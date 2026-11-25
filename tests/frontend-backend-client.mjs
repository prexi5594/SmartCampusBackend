// Run by test_frontend_backend.py against its disposable backend, never production.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const origin = process.argv[2];
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const source = await fetch(origin + '/api.js').then(response => {
  assert.equal(response.status, 200);
  return response.text();
});

function browserClient() {
  let cookie = '';
  const redirects = [];
  const location = {
    protocol: 'http:',
    replace: path => redirects.push(path),
    reload: () => redirects.push('reload'),
  };
  // Node has no browser cookie jar. Supply browser transport behavior only;
  // execute the actual served api.js and send every request to the real backend.
  async function browserFetch(path, options = {}) {
    assert.equal(new URL(path, origin).origin, origin);
    if (path.startsWith('/api/')) assert.equal(options.credentials, 'same-origin');
    const headers = new Headers(options.headers);
    if (cookie) headers.set('Cookie', cookie);
    if (options.method && options.method !== 'GET') headers.set('Origin', origin);
    const response = await fetch(new URL(path, origin), { ...options, headers });
    const sessionCookie = response.headers.getSetCookie().find(value => value.startsWith('campus_session='));
    if (sessionCookie) cookie = sessionCookie.split(';')[0];
    return response;
  }
  const context = vm.createContext({ window: {}, location, fetch: browserFetch, AbortSignal });
  const reactClient = readFileSync(new URL('../frontend/src/services/campusApi.js', import.meta.url), 'utf8').replace('export default campusApi;', 'window.CampusApi = campusApi;');
  context.window.dispatchEvent = () => redirects.push('/login.html?expired=1');
  context.Event = Event;
  vm.runInContext(reactClient, context, { filename: 'campusApi.js' });
  return { api: context.window.CampusApi, fetch: browserFetch, redirects };
}

const alice = browserClient();
const credentials = { email: 'integration-alice@example.test', password: 'synthetic test passphrase 827' };
const loginPage = await alice.fetch('/login.html');
assert.equal(loginPage.status, 200);
const loginHtml = await loginPage.text();
assert.match(loginHtml, /id="root"/);
assert.match(loginHtml, /\/app\/assets\//);
await assert.rejects(alice.api.request('/auth/session'), error => error.status === 401);
const guarded = await alice.fetch('/campus-navigator.html', { redirect: 'manual' });
assert.equal(guarded.status, 303);

const { user } = await alice.api.request('/auth/register', {
  method: 'POST', body: { ...credentials, display_name: 'Integration Student' },
});
alice.api.setUser(user);
assert.equal((await alice.api.request('/auth/session')).user.id, user.id);
for (const page of ['/campus-tools.html', '/usiu-map-review.html']) {
  const response = await alice.fetch(page);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /src="api.js"/);
  assert.match(html, /src="auth-guard.js"/);
  // A fresh checkout must serve every script and stylesheet referenced by its pages.
  for (const match of html.matchAll(/(?:src|href)="([^"#?]+\.(?:js|mjs|css))"/g)) {
    assert.equal((await alice.fetch('/' + match[1])).status, 200, match[1]);
  }
}

const place = { title: 'Library', note: '<b>Private plain-text note</b>', locationId: 'library', catalogue: 'demo' };
await alice.api.put('saved-places', 'integration-place', place);
assert.deepEqual((await alice.api.get('saved-places', 'integration-place')).value, place);
assert.equal((await alice.api.list('saved-places')).length, 1);

const secondSession = browserClient();
const login = await secondSession.api.request('/auth/login', { method: 'POST', body: credentials });
secondSession.api.setUser(login.user);
assert.equal((await secondSession.api.get('saved-places', 'integration-place')).value.note, place.note);
await secondSession.api.put('saved-places', 'integration-place', { ...place, note: 'Updated from another session' });
assert.equal((await alice.api.get('saved-places', 'integration-place')).value.note, 'Updated from another session');

const bob = browserClient();
const registered = await bob.api.request('/auth/register', {
  method: 'POST', body: { ...credentials, email: 'integration-bob@example.test', display_name: 'Other Student' },
});
bob.api.setUser(registered.user);
assert.equal((await bob.api.list('saved-places')).length, 0);
await assert.rejects(bob.api.get('saved-places', 'integration-place'), error => error.status === 404);
await assert.rejects(bob.api.remove('saved-places', 'integration-place'), error => error.status === 404);
await alice.api.remove('saved-places', 'integration-place');
assert.equal((await secondSession.api.list('saved-places')).length, 0);
await alice.api.request('/auth/logout', { method: 'POST', body: {} });
await assert.rejects(alice.api.list('saved-places'), error => error.status === 401);
assert.deepEqual(alice.redirects, ['/login.html?expired=1']);
console.log('Frontend/backend integration passed: pages, assets, registration, login, sessions, CRUD, isolation, logout.');
