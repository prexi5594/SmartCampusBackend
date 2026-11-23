"""Single-worker container entry point. The platform supplies TLS and PORT."""

import os

import uvicorn

from .config import Config


def server_options():
    # Validate deployment settings before binding a publicly reachable socket.
    Config.from_env()
    port = int(os.environ.get("PORT", "8080"))
    if not 1 <= port <= 65535:
        raise ValueError("PORT must be between 1 and 65535.")
    return {
        "app": "backend.main:app", "host": "0.0.0.0", "port": port,
        "workers": 1, "proxy_headers": False,
        "timeout_graceful_shutdown": 25,
    }


if __name__ == "__main__":
    uvicorn.run(**server_options())
