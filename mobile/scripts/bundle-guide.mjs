import { readFile, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';

// Package only the public route diagram. Web authentication and private records
// remain on the hosted service; never copy account pages or private evidence.
export async function bundleGuide(source, out) {
  let html = await readFile(path.join(source, 'science-interior.html'), 'utf8');
  const replacements = [
    [' class="auth-pending"', ''],
    ['<link rel="stylesheet" href="account.css">', ''],
    ['<script src="api.js" defer></script>', ''],
    ['<script src="auth-guard.js" defer></script>', ''],
    ['href="campus-navigator.html"', 'href="index.html"'],
    ['href="usiu-map-review.html"', 'href="index.html"'],
    ['<meta charset="utf-8">', '<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; style-src \'self\'; connect-src \'self\'; img-src \'self\' data:; object-src \'none\'; base-uri \'self\'">'],
  ];
  for (const [from, to] of replacements) {
    if (!html.includes(from)) throw new Error('Guide packaging contract changed: ' + from);
    html = html.replace(from, to);
  }
  let script = await readFile(path.join(source, 'science-interior.js'), 'utf8');
  const startup = 'window.CampusSession.then(user=>{if(user)start();});';
  if (!script.includes(startup)) throw new Error('Guide startup changed; review mobile packaging.');
  script = script.replace(startup, 'start();');
  await writeFile(path.join(out, 'science-interior.html'), html);
  await writeFile(path.join(out, 'science-interior.js'), script);
  for (const file of ['science-interior.css', 'pilot-guide.js', 'data/gate-a-science-pilot.json', 'data/science-lab-h.json'])
    await cp(path.join(source, file), path.join(out, file));
}
