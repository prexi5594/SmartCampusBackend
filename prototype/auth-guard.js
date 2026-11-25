(function () {
  'use strict';
  const api = window.CampusApi;
  window.CampusSession = api.request('/auth/session').then(({ user }) => {
    api.setUser(user);
    const bar = document.createElement('div');
    bar.className = 'account-bar';
    bar.innerHTML = '<div class="account-bar-inner"><p>Signed in as <strong></strong></p><div class="account-actions"><a href="campus-navigator.html#my-places">My saved places</a><button type="button">Sign out</button><span class="account-feedback" role="status"></span></div></div>';
    bar.querySelector('strong').textContent = user.display_name;
    const button = bar.querySelector('button');
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        await api.request('/auth/logout', { method: 'POST', body: {} });
        location.replace('/login.html');
      } catch (error) {
        bar.querySelector('[role="status"]').textContent = error.message;
        button.disabled = false;
      }
    });
    const header = document.querySelector('header');
    if (header) header.after(bar); else document.body.prepend(bar);
    document.documentElement.classList.remove('auth-pending');
    return user;
  }).catch(error => {
    if (error.status === 401) {
      const next = ['/campus-navigator.html', '/usiu-map-review.html', '/science-interior.html'].includes(location.pathname) ? location.pathname : '/campus-navigator.html';
      location.replace('/login.html?next=' + encodeURIComponent(next));
    } else {
      const section = document.createElement('main');
      section.className = 'session-unavailable';
      const title = document.createElement('h1');
      title.textContent = 'Your account could not be loaded';
      const text = document.createElement('p');
      text.textContent = error.message;
      const retry = document.createElement('button');
      retry.textContent = 'Try again';
      retry.onclick = () => location.reload();
      section.append(title, text, retry);
      document.body.replaceChildren(section);
      document.documentElement.classList.remove('auth-pending');
    }
    return null;
  });
  // Revalidate after back/forward cache restoration or an account change in another tab.
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    const original = await window.CampusSession;
    if (!original) return;
    try {
      const { user } = await api.request('/auth/session');
      if (user.id !== original.id) location.reload();
    } catch (error) {
      if (error.status === 401) location.replace('/login.html?expired=1');
    }
  });
}());
