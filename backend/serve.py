"""Run the frontend and API together, locally or behind the production TLS proxy."""

import os
from urllib.parse import urlsplit

import uvicorn

from .config import Config


def server_options():
    # Validate deployment settings before binding a publicly reachable socket.
    config = Config.from_env()
    origin = urlsplit(config.origin)
    local_http = not config.production and origin.scheme == "http"
    origin_port = origin.port or (443 if origin.scheme == "https" else 80)
    port = int(os.environ.get("PORT", str(origin_port if local_http else 8080)))
    if not 1 <= port <= 65535:
        raise ValueError("PORT must be between 1 and 65535.")
    if local_http and port != origin_port:
        raise ValueError("PORT must match the port in CAMPUS_ORIGIN for local sign-in to work.")
    return {
        "app": "backend.main:app",
        "host": origin.hostname if local_http else "0.0.0.0", "port": port,
        "workers": 1, "proxy_headers": False,
        "timeout_graceful_shutdown": 25,
    }


def main():
    uvicorn.run(**server_options())


if __name__ == "__main__":
    main()
