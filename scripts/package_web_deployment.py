"""Package only public web assets and backend source, never local accounts/tools."""

from pathlib import Path
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dist" / "deploy" / "smart-campus-railway.zip"
TOP_LEVEL = ("Dockerfile", ".dockerignore", ".railwayignore")


def deployment_files():
    files = [ROOT / name for name in TOP_LEVEL]
    files.extend((ROOT / "backend").glob("*.py"))
    files.extend([ROOT / "backend/requirements.txt", ROOT / "backend/requirements.lock.txt"])
    # Enumerate the existing frontend asset types, rather than copying the workspace.
    extensions = {".html", ".css", ".js", ".mjs", ".json", ".geojson", ".svg", ".png", ".jpg", ".webp"}
    for path in (ROOT / "prototype").rglob("*"):
        if path.is_file() and (path.suffix in extensions or path.name in {"LICENSE.txt", "USIU_DATA_LICENSE.md"}):
            files.append(path)
    for path in files:
        if path.is_symlink() or ROOT not in path.resolve().parents:
            raise ValueError("Deployment input must be a regular file inside the project.")
        if any(part.startswith(".") for part in path.relative_to(ROOT).parts) and path.name not in TOP_LEVEL:
            raise ValueError("Hidden files cannot be deployed.")
        if not path.is_file():
            raise ValueError(f"Missing deployment input: {path.name}")
    return sorted(files)


def main():
    files = deployment_files()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(ROOT).as_posix())
    with zipfile.ZipFile(OUTPUT) as archive:
        if archive.testzip() is not None:
            raise ValueError("Deployment ZIP integrity check failed.")
    print(f"Created {OUTPUT}")
    print(f"Files: {len(files)}; bytes: {OUTPUT.stat().st_size}")
    print("SHA256: " + hashlib.sha256(OUTPUT.read_bytes()).hexdigest())


if __name__ == "__main__":
    main()
