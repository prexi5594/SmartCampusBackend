(async function () {
  'use strict';
  const user = await window.CampusSession;
  if (!user) return;
  const $ = id => document.getElementById(id);
  const api = window.CampusApi;
  const namespace = 'saved-places';
  let places;
  try { places = window.CampusCatalogue.create(window.CampusDemoFacilities).places; } catch {
    $('saved-list-message').textContent = 'The catalogue is unavailable. Reload to try again.';
    $('saved-places-list').setAttribute('aria-busy', 'false');
    return;
  }
  const byId = new Map(places.map(place => [place.id, place]));
  let records = [], editingKey = null, busy = false;
  const form = $('saved-place-form');

  function message(id, text, error = false) {
    $(id).textContent = text;
    $(id).classList.toggle('is-error', error);
  }
  function setBusy(value) {
    busy = value;
    form.querySelectorAll('input, select, textarea, button').forEach(control => { control.disabled = value; });
    $('refresh-places').disabled = value;
    $('save-destination').disabled = value;
    $('saved-places-list').querySelectorAll('button').forEach(button => { button.disabled = value; });
  }
  function resetForm() {
    editingKey = null;
    form.reset();
    $('saved-title').value = byId.get($('saved-location').value)?.name || '';
    $('save-place-submit').textContent = 'Save place';
    $('cancel-place-edit').hidden = true;
  }
  function showEditor() {
    $('my-places').scrollIntoView({ behavior: 'auto', block: 'start' });
    $('saved-title').focus({ preventScroll: true });
  }
  function validPlace(record) {
    return record.value?.catalogue === 'demo' && byId.has(record.value.locationId) &&
      typeof record.value.title === 'string' && typeof record.value.note === 'string';
  }
  function confirmDeletion(title) {
    const dialog = $('delete-place-dialog');
    if (dialog.open) return Promise.resolve(false);
    $('delete-place-description').textContent = `“${title}” and its personal note will be removed from your account.`;
    dialog.returnValue = 'cancel';
    return new Promise(resolve => {
      dialog.addEventListener('close', () => resolve(dialog.returnValue === 'delete'), { once: true });
      dialog.showModal();
    });
  }
  function render() {
    const items = records.slice().sort((a, b) => b.updated_at.localeCompare(a.updated_at)).map(record => {
      const item = document.createElement('li');
      const title = document.createElement('h3');
      const subtitle = document.createElement('small');
      const note = document.createElement('p');
      const valid = validPlace(record);
      title.textContent = valid ? record.value.title : 'Unrecognised saved place';
      subtitle.textContent = valid ? byId.get(record.value.locationId).name + ' · Sample catalogue' : 'This save uses another data format.';
      note.textContent = valid ? record.value.note : '';
      const buttons = document.createElement('div');
      buttons.className = 'personal-buttons';
      if (valid) {
        const open = document.createElement('button');
        open.type = 'button'; open.className = 'quiet'; open.textContent = 'View on map';
        open.dataset.destination = record.value.locationId;
        const edit = document.createElement('button');
        edit.type = 'button'; edit.className = 'quiet'; edit.textContent = 'Edit';
        edit.addEventListener('click', () => {
          editingKey = record.key;
          $('saved-location').value = record.value.locationId;
          $('saved-title').value = record.value.title;
          $('saved-note').value = record.value.note;
          $('save-place-submit').textContent = 'Save changes';
          $('cancel-place-edit').hidden = false;
          message('saved-place-message', 'Editing your saved place.');
          showEditor();
        });
        buttons.append(open, edit);
      }
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'quiet'; remove.textContent = 'Delete';
      remove.setAttribute('aria-label', 'Delete ' + title.textContent);
      remove.addEventListener('click', async () => {
        if (busy || !await confirmDeletion(title.textContent)) return;
        setBusy(true);
        try {
          await api.remove(namespace, record.key);
          records = records.filter(item => item.key !== record.key);
          if (editingKey === record.key) resetForm();
          render();
          message('saved-list-message', 'Saved place deleted.');
          $('refresh-places').disabled = false;
          $('refresh-places').focus();
        } catch (error) { message('saved-list-message', error.message, true); }
        finally { setBusy(false); }
      });
      buttons.append(remove);
      item.append(title, subtitle, note, buttons);
      return item;
    });
    $('saved-places-list').replaceChildren(...items);
    message('saved-list-message', records.length ? `${records.length} saved ${records.length === 1 ? 'place' : 'places'}.` : 'No saved places yet. Add your first place using the form.');
  }

  async function refresh() {
    setBusy(true);
    $('saved-places-list').setAttribute('aria-busy', 'true');
    message('saved-list-message', 'Loading your saved places…');
    try {
      records = await api.list(namespace);
      render();
    } catch (error) { message('saved-list-message', error.message + ' Use Refresh saved places to retry.', true); }
    finally {
      $('saved-places-list').setAttribute('aria-busy', 'false');
      setBusy(false);
    }
  }

  $('saved-location').replaceChildren(...places.map(place => new Option(place.name, place.id)));
  resetForm();
  $('saved-location').addEventListener('change', () => {
    if (!editingKey) $('saved-title').value = byId.get($('saved-location').value)?.name || '';
  });
  $('save-destination').addEventListener('click', () => {
    if (busy) return;
    resetForm();
    const place = byId.get($('destination').value);
    if (place) { $('saved-location').value = place.id; $('saved-title').value = place.name; }
    message('saved-place-message', 'Add a title or note, then save this place.');
    showEditor();
  });
  $('cancel-place-edit').addEventListener('click', () => { resetForm(); message('saved-place-message', 'Edit cancelled.'); });
  $('refresh-places').addEventListener('click', refresh);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const title = $('saved-title').value.trim();
    if (!title) { message('saved-place-message', 'Enter a title for this place.', true); return; }
    const place = byId.get($('saved-location').value);
    if (!place) { message('saved-place-message', 'Choose a campus place.', true); return; }
    // Keep a new key through retries: a lost response must not create duplicate saves.
    if (!editingKey) editingKey = crypto.randomUUID();
    const value = { title, note: $('saved-note').value.trim(), locationId: place.id,
      catalogue: 'demo', position: { kind: 'schematic', ...place.schematic } };
    setBusy(true);
    message('saved-place-message', 'Saving…');
    try {
      const saved = await api.put(namespace, editingKey, value);
      records = records.filter(item => item.key !== saved.key).concat(saved);
      render(); resetForm();
      message('saved-place-message', 'Saved to your account.');
    } catch (error) { message('saved-place-message', error.message + ' Your draft is still here.', true); }
    finally { setBusy(false); $('save-place-submit').focus(); }
  });
  await refresh();
  if (location.hash === '#my-places') {
    $('my-places-title').focus({ preventScroll: true });
    $('my-places').scrollIntoView({ block: 'start' });
  }
}());
