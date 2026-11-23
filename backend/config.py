"""Local defaults; production must use an HTTPS origin and persistent storage."""

from dataclasses import dataclass
import os
from pathlib import Path
from urllib.parse import urlsplit

PROJECT_ROOT = Path(__file__).resolve().parents[1]
WEB_ROOT = PROJECT_ROOT / "prototype"


@dataclass(frozen=True)
class Config:
    data_dir: Path
    origin: str = "http://127.0.0.1:8765"
    session_seconds: int = 7 * 24 * 60 * 60
    production: bool = False
    healthcheck_host: str | None = None

    def __post_init__(self):
        origin = self.origin.rstrip("/")
        parsed = urlsplit(origin)
        if (parsed.scheme not in {"http", "https"} or not parsed.hostname
                or parsed.username or parsed.password or parsed.path
                or parsed.query or parsed.fragment):
            raise ValueError("CAMPUS_ORIGIN must be an origin, e.g. https://campus.example.edu")
        if parsed.scheme != "https" and parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
            raise ValueError("Use HTTPS for a non-local CAMPUS_ORIGIN.")
        if self.production and (parsed.scheme != "https" or parsed.hostname in {"localhost", "127.0.0.1", "::1"}):
            raise ValueError("Production requires a public HTTPS CAMPUS_ORIGIN.")
        data_dir = Path(self.data_dir).resolve()
        if data_dir == WEB_ROOT or WEB_ROOT in data_dir.parents:
            raise ValueError("Private data must be outside the frontend directory.")
        if not 60 <= self.session_seconds <= 30 * 24 * 60 * 60:
            raise ValueError("Session duration must be between one minute and 30 days.")
        object.__setattr__(self, "origin", origin)
        object.__setattr__(self, "data_dir", data_dir)

    @property
    def secure_cookies(self):
        return self.origin.startswith("https://")

    @classmethod
    def from_env(cls):
        environment = os.environ.get("CAMPUS_ENV", "local")
        if environment not in {"local", "production"}:
            raise ValueError("CAMPUS_ENV must be local or production.")
        railway = bool(os.environ.get("RAILWAY_ENVIRONMENT_ID"))
        production = environment == "production" or railway
        origin = os.environ.get("CAMPUS_ORIGIN")
        if not origin and railway and os.environ.get("RAILWAY_PUBLIC_DOMAIN"):
            origin = "https://" + os.environ["RAILWAY_PUBLIC_DOMAIN"]
        data_dir = os.environ.get("CAMPUS_DATA_DIR")
        if production and (not origin or not data_dir):
            raise ValueError("Production requires an HTTPS origin and an explicit persistent CAMPUS_DATA_DIR.")
        if railway:
            mount_value = os.environ.get("RAILWAY_VOLUME_MOUNT_PATH")
            if not mount_value:
                raise ValueError("Attach a Railway volume before starting; ephemeral storage would lose user data.")
            mount = Path(mount_value).resolve()
            destination = Path(data_dir).resolve()
            if not mount.is_dir() or (destination != mount and mount not in destination.parents):
                raise ValueError("CAMPUS_DATA_DIR must be inside the attached Railway volume.")
        return cls(
            data_dir=Path(data_dir or PROJECT_ROOT / "private-data"),
            origin=origin or "http://127.0.0.1:8765",
            session_seconds=int(os.environ.get("CAMPUS_SESSION_SECONDS", "604800")),
            production=production,
            healthcheck_host="healthcheck.railway.app" if railway else None,
        )
