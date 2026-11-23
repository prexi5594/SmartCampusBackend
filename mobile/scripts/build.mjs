import { build } from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
await mkdir(out, { recursive: true });
await build({ entryPoints: [path.join(root, 'src/app.mjs')], outfile: path.join(out, 'app.js'), bundle: true, format: 'esm', target: ['chrome100'], sourcemap: true });
for (const name of ['index.html', 'styles.css']) await cp(path.join(root, 'src', name), path.join(out, name));
await mkdir(path.join(out, 'data'), { recursive: true });
for (const name of ['usiu-directory.json', 'usiu-geography.geojson', 'usiu-map-sources.json', 'usiu-routing.json', 'USIU_DATA_LICENSE.md'])
  await cp(path.join(root, '../prototype/data', name), path.join(out, 'data', name));
await cp(path.join(root, '../prototype/usiu-directory.js'), path.join(out, 'usiu-directory.js'));
await cp(path.join(root, '../prototype/vendor/maplibre-gl-6.19.0'), path.join(out, 'vendor/maplibre-gl-6.19.0'), { recursive: true });
console.log('Built Android web assets in mobile/dist. No remote map service or student data included.');
