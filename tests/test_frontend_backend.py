"""Exercise the shipped JavaScript client against the real single-server app."""

import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
from urllib.error import URLError
from urllib.request import urlopen

import uvicorn
from backend.config import Config
from backend.main import create_app
from backend.serve import server_options

ROOT = Path(__file__).resolve().parents[1]


class FrontendBackendTests(unittest.TestCase):
    def test_browser_api_client_against_running_backend(self):
        self.assertIsNotNone(shutil.which("node"), "Install Node.js 22+ to run frontend integration checks.")
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            port = listener.getsockname()[1]
        origin = f"http://127.0.0.1:{port}"
        with tempfile.TemporaryDirectory(prefix="campus-web-integration-") as directory:
            # Never inherit production/database configuration for this synthetic test.
            environment = {"CAMPUS_ORIGIN": origin, "CAMPUS_DATA_DIR": directory}
            with patch.dict(os.environ, environment, clear=True):
                options = server_options()
                options["app"] = create_app(Config.from_env())
            server = uvicorn.Server(uvicorn.Config(**options, log_level="warning"))
            worker = threading.Thread(target=server.run, daemon=True)
            worker.start()
            try:
                deadline = time.monotonic() + 30
                while time.monotonic() < deadline and worker.is_alive():
                    try:
                        with urlopen(origin + "/health", timeout=1) as response:
                            if response.status == 200:
                                break
                    except (URLError, TimeoutError):
                        time.sleep(0.2)
                else:
                    self.fail("The integrated frontend/backend server did not start.")
                result = subprocess.run(
                    ["node", "tests/frontend-backend-client.mjs", origin], cwd=ROOT,
                    capture_output=True, text=True, timeout=60,
                )
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn("Frontend/backend integration passed", result.stdout)
            finally:
                # Let the lifespan close Chroma before removing the temporary data.
                server.should_exit = True
                worker.join(timeout=30)
                self.assertFalse(worker.is_alive(), "Test server did not shut down.")


if __name__ == "__main__":
    unittest.main()
