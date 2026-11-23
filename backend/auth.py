"""Transactional account/session storage. Passwords and bearer tokens are hashed."""

from contextlib import contextmanager
import hashlib
import secrets
import sqlite3
import time
from uuid import uuid4

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, InvalidHashError


def token_hash(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class DuplicateAccount(Exception):
    pass


class RateLimited(Exception):
    pass


class AuthStore:
    def __init__(self, path, session_seconds):
        self.path = path
        self.session_seconds = session_seconds
        self.hasher = PasswordHasher()
        # Unknown accounts still perform a password verification.
        self.dummy_hash = self.hasher.hash(secrets.token_urlsafe(32))
        with self.connection() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    display_name TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    token_hash TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    expires_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
                CREATE TABLE IF NOT EXISTS auth_limits (
                    bucket TEXT PRIMARY KEY,
                    started_at INTEGER NOT NULL,
                    attempts INTEGER NOT NULL
                );
            """)

    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.path, timeout=15)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try:
            with db:
                yield db
        finally:
            db.close()

    @staticmethod
    def public_user(row):
        return {key: row[key] for key in ("id", "email", "display_name")}

    def register(self, email, password, display_name):
        password_hash = self.hasher.hash(password)
        user = {"id": str(uuid4()), "email": email, "display_name": display_name}
        try:
            with self.connection() as db:
                db.execute(
                    "INSERT INTO users VALUES (?, ?, ?, ?, ?)",
                    (user["id"], email, display_name, password_hash, int(time.time())),
                )
        except sqlite3.IntegrityError as error:
            raise DuplicateAccount from error
        return user

    def login(self, email, password):
        with self.connection() as db:
            row = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        stored_hash = row["password_hash"] if row else self.dummy_hash
        try:
            self.hasher.verify(stored_hash, password)
        except (VerificationError, InvalidHashError):
            return None
        if row is None:
            return None
        if self.hasher.check_needs_rehash(stored_hash):
            replacement = self.hasher.hash(password)
            with self.connection() as db:
                db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (replacement, row["id"]))
        return self.public_user(row)

    def create_session(self, user_id, previous_token=None):
        token = secrets.token_urlsafe(32)
        now = int(time.time())
        with self.connection() as db:
            db.execute("DELETE FROM sessions WHERE expires_at <= ?", (now,))
            if previous_token:
                db.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash(previous_token),))
            db.execute("INSERT INTO sessions VALUES (?, ?, ?)",
                       (token_hash(token), user_id, now + self.session_seconds))
        return token

    def user_for_session(self, token):
        if not token or len(token) > 128:
            return None
        with self.connection() as db:
            row = db.execute("""
                SELECT users.id, users.email, users.display_name
                FROM sessions JOIN users ON users.id = sessions.user_id
                WHERE sessions.token_hash = ? AND sessions.expires_at > ?
            """, (token_hash(token), int(time.time()))).fetchone()
        return self.public_user(row) if row else None

    def logout(self, token):
        if token:
            with self.connection() as db:
                db.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash(token),))

    def check_rate_limit(self, ip, email):
        """Bound expensive password work by address and account, across restarts."""
        now = int(time.time())
        buckets = [(token_hash("ip:" + ip), 60), (token_hash("email:" + email), 10)]
        with self.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute("DELETE FROM auth_limits WHERE started_at <= ?", (now - 900,))
            for bucket, limit in buckets:
                row = db.execute("SELECT attempts FROM auth_limits WHERE bucket = ?", (bucket,)).fetchone()
                if row and row["attempts"] >= limit:
                    raise RateLimited
            for bucket, _ in buckets:
                db.execute("""
                    INSERT INTO auth_limits VALUES (?, ?, 1)
                    ON CONFLICT(bucket) DO UPDATE SET attempts = attempts + 1
                """, (bucket, now))
