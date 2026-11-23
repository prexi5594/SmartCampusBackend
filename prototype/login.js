(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let register = false;
  const params = new URLSearchParams(location.search);
  const requestedPage = params.get('next');
  const next = ['/campus-navigator.html', '/usiu-map-review.html'].includes(requestedPage) ? requestedPage : '/campus-navigator.html';

  function message(text, error = false) {
    $('auth-message').textContent = text;
    $('auth-message').classList.toggle('is-error', error);
  }
  function setMode(create) {
    register = create;
    $('mode-login').setAttribute('aria-pressed', String(!create));
    $('mode-register').setAttribute('aria-pressed', String(create));
    $('name-field').hidden = !create;
    $('display-name').disabled = !create;
    $('display-name').required = create;
    $('password').minLength = create ? 12 : 1;
    $('password').autocomplete = create ? 'new-password' : 'current-password';
    $('password').value = '';
    $('password-hint').textContent = create ? 'Use 12–128 characters. A long passphrase works well.' : 'Use the password you created for this app.';
    $('auth-title').textContent = create ? 'Make yourself at home' : 'Welcome back';
    $('auth-description').textContent = create ? 'Create your account to start saving your campus places.' : 'Enter your email and password to continue.';
    $('auth-submit').textContent = create ? 'Create account' : 'Sign in';
    message('');
  }
  $('mode-login').addEventListener('click', () => setMode(false));
  $('mode-register').addEventListener('click', () => setMode(true));
  $('auth-form').addEventListener('submit', async event => {
    event.preventDefault();
    const controls = [...document.querySelectorAll('.auth-card button')];
    controls.forEach(button => { button.disabled = true; });
    message(register ? 'Creating your account…' : 'Signing in…');
    const body = { email: $('email').value.trim(), password: $('password').value };
    if (register) body.display_name = $('display-name').value.trim();
    try {
      await CampusApi.request(register ? '/auth/register' : '/auth/login', { method: 'POST', body });
      $('password').value = '';
      location.replace(next);
    } catch (error) {
      message(error.message, true);
      controls.forEach(button => { button.disabled = false; });
    }
  });
  if (!['http:', 'https:'].includes(location.protocol)) {
    message('Start the campus server and open http://127.0.0.1:8765. Accounts need the backend.', true);
    $('auth-submit').disabled = true;
  } else {
    if (params.has('expired')) message('Your session ended. Sign in again to continue.');
    CampusApi.request('/auth/session').then(() => location.replace(next)).catch(error => {
      if (error.status !== 401) message(error.message, true);
    });
  }
}());
