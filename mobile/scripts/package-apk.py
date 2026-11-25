"""Verify bundled files and publish versioned and stable local APK downloads."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

root = Path(__file__).resolve().parents[1]
apk = root / 'android/app/build/outputs/apk/debug/app-debug.apk'
version = json.loads((root / 'package.json').read_text())['version']
files = sorted(p for p in (root / 'dist').rglob('*') if p.is_file())
with zipfile.ZipFile(apk) as archive:
    assert archive.testzip() is None, 'APK ZIP integrity failed'
    for file in files:
        name = file.relative_to(root / 'dist').as_posix()
        assert archive.read('assets/public/' + name) == file.read_bytes(), f'Stale APK asset: {name}'
    assert not any('/private-data/' in n or n.endswith(('.mp4', '.db', '.sqlite')) for n in archive.namelist())
release = root / 'releases'
release.mkdir(exist_ok=True)
digest = hashlib.sha256(apk.read_bytes()).hexdigest()
for name in [f'SmartCampus-{version}-debug.apk', 'SmartCampus-latest-debug.apk']:
    target = release / name
    shutil.copyfile(apk, target)
    assert hashlib.sha256(target.read_bytes()).hexdigest() == digest
    (release / (name + '.sha256')).write_text(f'{digest}  {name}\n', encoding='utf-8')
manifest = {'version': version, 'sha256': digest, 'bytes': apk.stat().st_size,
            'verifiedAssets': len(files), 'assets': {p.relative_to(root / 'dist').as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
(release / 'latest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({k: v for k, v in manifest.items() if k != 'assets'}, indent=2))
