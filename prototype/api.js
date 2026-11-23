(function () {
  'use strict';
  let activeUserId = null;

  async function request(path, options = {}) {
    if (!['http:', 'https:'].includes(location.protocol)) {
      throw new Error('Start the campus server and open http://127.0.0.1:8765 to use your account.');
    }
    const method = options.method || 'GET';
    const headers = { Accept: 'application/json' };
    if (method !== 'GET') {
      headers['Content-Type'] = 'application/json';
      headers['X-Campus-Request'] = '1';
    }
    if (activeUserId) headers['X-Campus-User'] = activeUserId;
    let response;
    try {
      response = await fetch('/api' + path, {
        method, headers, credentials: 'same-origin', cache: 'no-store',
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new Error('Cannot reach the campus server. Check your connection and try again.');
    }
    let data = null;
    if (response.status !== 204) {
      try { data = await response.json(); } catch {
        throw new Error('The campus server is unavailable. Please try again.');
      }
    }
    if (!response.ok) {
      const detail = data?.errors?.[0]?.message || data?.detail;
      const error = new Error(typeof detail === 'string' ? detail.replace(/^Value error, /, '') : 'The request could not be completed.');
      error.status = response.status;
      if (response.status === 409 && data?.code === 'session_changed') location.reload();
      if (response.status === 401 && !path.startsWith('/auth/')) {
        location.replace('/login.html?expired=1');
      }
      throw error;
    }
    return data;
  }

  const recordPath = (namespace, key) => '/data/' + encodeURIComponent(namespace) +
    (key === undefined ? '' : '/' + encodeURIComponent(key));

  window.CampusApi = Object.freeze({
    request,
    setUser: user => { activeUserId = user.id; },
    get: (namespace, key) => request(recordPath(namespace, key)),
    put: (namespace, key, value) => request(recordPath(namespace, key), { method: 'PUT', body: { value } }),
    remove: (namespace, key) => request(recordPath(namespace, key), { method: 'DELETE', body: {} }),
    async list(namespace) {
      const records = [];
      let offset = 0;
      do {
        const page = await request(recordPath(namespace) + '?limit=100&offset=' + offset);
        records.push(...page.records);
        offset = page.next_offset;
      } while (offset !== null);
      return records;
    },
  });
}());
