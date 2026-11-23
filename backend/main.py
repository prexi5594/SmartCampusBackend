"""Serve the existing frontend and its same-origin account/data API."""

from contextlib import asynccontextmanager
import json
from typing import Annotated
from urllib.parse import urlsplit, quote

from fastapi import Depends, FastAPI, HTTPException, Path, Query, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, field_validator
from starlette.concurrency import run_in_threadpool
from starlette.datastructures import Headers, MutableHeaders
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .auth import AuthStore, DuplicateAccount, RateLimited
from .config import Config, WEB_ROOT
from .storage import MAX_RECORD_BYTES, StorageQuotaExceeded, StorageUnavailable, UserDataStore

COOKIE_NAME = "campus_session"
MAX_REQUEST_BYTES = 64 * 1024
Namespace = Annotated[str, Path(pattern=r"^[a-z][a-z0-9_-]{0,31}$")]
RecordKey = Annotated[str, Path(pattern=r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$")]


class Credentials(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value):
        import re
        value = value.strip().lower()
        if not re.fullmatch(r"[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}", value):
            raise ValueError("Enter a valid email address.")
        local, domain = value.split("@")
        if (len(local) > 64 or local.startswith(".") or local.endswith(".")
                or ".." in value or any(label.startswith("-") or label.endswith("-")
                                       or len(label) > 63 for label in domain.split("."))):
            raise ValueError("Enter a valid email address.")
        return value


class Registration(Credentials):
    display_name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=12, max_length=128)

    @field_validator("display_name")
    @classmethod
    def normalize_name(cls, value):
        value = value.strip()
        if not value or any(ord(char) < 32 for char in value):
            raise ValueError("Enter a display name.")
        return value


class RecordWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    value: dict = Field(description="A JSON object; ownership comes from the session, never this value.")

    @field_validator("value")
    @classmethod
    def check_size(cls, value):
        try:
            encoded = json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(",", ":")).encode("utf-8")
        except (ValueError, RecursionError, UnicodeError):
            raise ValueError("Use a valid JSON object with finite numbers.")
        if len(encoded) > MAX_RECORD_BYTES:
            raise ValueError("Each record must fit within 32 KiB.")
        return value


class RequestPolicy:
    """Bound request bodies and enforce same-origin writes before parsing credentials."""

    def __init__(self, app, config, service):
        self.app, self.config, self.service = app, config, service

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def send_secure(message):
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers["Cache-Control"] = "no-store"
                headers["X-Content-Type-Options"] = "nosniff"
                headers["X-Frame-Options"] = "DENY"
                headers["Referrer-Policy"] = "same-origin"
                headers["Content-Security-Policy"] = (
                    "default-src 'self'; script-src 'self' 'unsafe-inline'; "
                    "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
                    "connect-src 'self'; worker-src 'self' blob:; object-src 'none'; "
                    "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
                )
                if self.config.secure_cookies:
                    headers["Strict-Transport-Security"] = "max-age=31536000"
            await send(message)

        async def reject(status, message):
            await JSONResponse({"detail": message}, status_code=status)(scope, receive, send_secure)

        path, method = scope["path"], scope["method"]
        headers = Headers(scope=scope)
        if self.config.healthcheck_host and headers.get("host", "").split(":", 1)[0] == self.config.healthcheck_host:
            if path != "/health" or method != "GET":
                return await reject(404, "Not found.")
        if path.startswith("/api/") and method not in {"GET", "HEAD", "OPTIONS"}:
            if headers.get("origin") != self.config.origin or headers.get("x-campus-request") != "1":
                return await reject(403, "This request must come from the campus app.")
            if headers.get("content-type", "").split(";", 1)[0].strip().lower() != "application/json":
                return await reject(415, "Send application/json.")
            body = bytearray()
            while True:
                message = await receive()
                if message["type"] == "http.disconnect":
                    return
                body.extend(message.get("body", b""))
                if len(body) > MAX_REQUEST_BYTES:
                    return await reject(413, "This request is too large.")
                if not message.get("more_body", False):
                    break
            delivered = False

            async def buffered_receive():
                nonlocal delivered
                if not delivered:
                    delivered = True
                    return {"type": "http.request", "body": bytes(body), "more_body": False}
                return await receive()

            downstream_receive = buffered_receive
        else:
            downstream_receive = receive

        request = Request(scope)
        user = await run_in_threadpool(
            self.service.state.auth.user_for_session, request.cookies.get(COOKIE_NAME),
        )
        scope.setdefault("state", {})["user"] = user
        if user is None and (path == "/" or (path.endswith(".html") and path != "/login.html")):
            # Only retain known page paths; never reflect an arbitrary redirect URL.
            destination = path if path in {"/campus-navigator.html", "/usiu-map-review.html"} else "/campus-navigator.html"
            response = RedirectResponse("/login.html?next=" + quote(destination, safe=""), status_code=303)
            return await response(scope, downstream_receive, send_secure)
        await self.app(scope, downstream_receive, send_secure)


def current_user(request: Request):
    if not request.state.user:
        raise HTTPException(401, "Sign in to continue.")
    expected = request.headers.get("x-campus-user")
    if expected and expected != request.state.user["id"]:
        raise SessionChanged
    return request.state.user


class SessionChanged(Exception):
    pass


User = Annotated[dict, Depends(current_user)]


def create_app(config=None):
    config = config or Config.from_env()

    @asynccontextmanager
    async def lifespan(app):
        config.data_dir.mkdir(parents=True, exist_ok=True)
        app.state.auth = AuthStore(config.data_dir / "accounts.sqlite3", config.session_seconds)
        app.state.data = UserDataStore(config.data_dir / "chroma")
        try:
            yield
        finally:
            app.state.data.client.close()

    app = FastAPI(title="Smart Campus Navigator", lifespan=lifespan,
                  docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(RequestPolicy, config=config, service=app)
    allowed_hosts = [urlsplit(config.origin).hostname]
    if config.healthcheck_host:
        allowed_hosts.append(config.healthcheck_host)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

    @app.exception_handler(SessionChanged)
    async def session_changed(request, error):
        return JSONResponse({"detail": "Your account changed. Reload to continue.",
                             "code": "session_changed"}, status_code=409)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, error):
        # FastAPI's default details can echo the submitted password or private data.
        return JSONResponse({"detail": "Check the fields and try again.", "errors": [
            {"field": ".".join(str(item) for item in issue["loc"]), "message": issue["msg"]}
            for issue in error.errors()
        ]}, status_code=422)

    @app.exception_handler(StorageUnavailable)
    async def storage_error(request, error):
        return JSONResponse({"detail": "Your data is temporarily unavailable. Please try again."}, status_code=503)

    @app.exception_handler(StorageQuotaExceeded)
    async def quota_error(request, error):
        return JSONResponse({"detail": "Your account has reached its 1,000-record limit."}, status_code=409)

    def authenticate_response(user, request, response):
        token = app.state.auth.create_session(user["id"], request.cookies.get(COOKIE_NAME))
        response.set_cookie(COOKIE_NAME, token, max_age=config.session_seconds,
                            httponly=True, secure=config.secure_cookies, samesite="strict", path="/")
        return {"user": user}

    def throttle(request, email):
        try:
            app.state.auth.check_rate_limit(request.client.host if request.client else "unknown", email)
        except RateLimited:
            raise HTTPException(429, "Too many sign-in attempts. Try again in 15 minutes.",
                                headers={"Retry-After": "900"})

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.get("/")
    def homepage():
        return RedirectResponse("/campus-navigator.html", status_code=303)

    @app.post("/api/auth/register", status_code=201)
    def register(body: Registration, request: Request, response: Response):
        throttle(request, body.email)
        try:
            user = app.state.auth.register(body.email, body.password, body.display_name)
        except DuplicateAccount:
            raise HTTPException(409, "An account could not be created with this email. Try signing in.")
        return authenticate_response(user, request, response)

    @app.post("/api/auth/login")
    def login(body: Credentials, request: Request, response: Response):
        throttle(request, body.email)
        user = app.state.auth.login(body.email, body.password)
        if not user:
            raise HTTPException(401, "Email or password is incorrect.")
        return authenticate_response(user, request, response)

    @app.get("/api/auth/session")
    def session(user: User):
        return {"user": user}

    @app.post("/api/auth/logout", status_code=204)
    def logout(request: Request, response: Response):
        app.state.auth.logout(request.cookies.get(COOKIE_NAME))
        response.delete_cookie(COOKIE_NAME, path="/", secure=config.secure_cookies,
                               httponly=True, samesite="strict")

    @app.get("/api/data/{namespace}")
    def list_records(namespace: Namespace, user: User,
                     limit: Annotated[int, Query(ge=1, le=100)] = 100,
                     offset: Annotated[int, Query(ge=0, le=1000)] = 0):
        # Fetch one extra row to provide accurate pagination without another query.
        records = app.state.data.list(user["id"], namespace, limit + 1, offset)
        return {"records": records[:limit], "next_offset": offset + limit if len(records) > limit else None}

    @app.get("/api/data/{namespace}/{key}")
    def get_record(namespace: Namespace, key: RecordKey, user: User):
        record = app.state.data.get(user["id"], namespace, key)
        if record is None:
            raise HTTPException(404, "This record was not found.")
        return record

    @app.put("/api/data/{namespace}/{key}")
    def put_record(namespace: Namespace, key: RecordKey, body: RecordWrite, user: User):
        return app.state.data.put(user["id"], namespace, key, body.value)

    @app.delete("/api/data/{namespace}/{key}", status_code=204)
    def delete_record(namespace: Namespace, key: RecordKey, user: User):
        if not app.state.data.delete(user["id"], namespace, key):
            raise HTTPException(404, "This record was not found.")

    # Only frontend assets are served. Neither the repository nor private-data is mounted.
    app.mount("/", StaticFiles(directory=WEB_ROOT), name="frontend")
    return app


app = create_app()
