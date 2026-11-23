"""Extract verified official tool archives only inside this project's tool folder."""
from pathlib import Path
import hashlib
import sys
import zipfile

root = Path(__file__).resolve().parents[1] / '.android-tools'
packages = {
    'java': ('temurin-21.0.13.1-windows-x64.zip', 'bbebea1469996b276683c9299c227b294f85c847039c82633218186a4ad4fbf2', root / 'java'),
    'sdk': ('commandlinetools-win-15859902_latest.zip', '90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a', root / 'sdk/cmdline-tools/latest'),
}
kind = sys.argv[1]
filename, checksum, destination = packages[kind]
archive = root / 'downloads' / filename
with archive.open('rb') as stream:
    if hashlib.file_digest(stream, 'sha256').hexdigest() != checksum:
        raise RuntimeError('Archive checksum mismatch; extraction refused.')
destination = destination.resolve()
destination.relative_to(root.resolve())
with zipfile.ZipFile(archive) as zipped:
    for member in zipped.infolist():
        name = member.filename
        if kind == 'sdk':
            if not name.startswith('cmdline-tools/'):
                raise RuntimeError('Unexpected SDK archive layout.')
            name = name.removeprefix('cmdline-tools/')
        target = (destination / name).resolve()
        target.relative_to(destination)
        if member.is_dir():
            target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            with zipped.open(member) as source, target.open('wb') as output:
                while block := source.read(1024 * 1024):
                    output.write(block)
print(f'Extracted verified {kind} tools to {destination}')
