// Owns a single watch, including cancellation while a permission dialog or native
// watch registration is pending. Late callbacks can never restart a stopped trip.
export class LocationSession {
  constructor(provider) { this.provider = provider; this.generation = 0; this.watchId = null; }
  async start(onPosition, onError) {
    const generation = ++this.generation;
    const active = () => generation === this.generation;
    const previousId = this.watchId; this.watchId = null;
    try {
      if (previousId !== null) await this.provider.clear(previousId);
      if (!active()) return;
      await this.provider.prepare();
      if (!active()) return;
      const id = await this.provider.watch((position, error) => {
        if (!active()) return;
        if (error) onError(error); else if (position) onPosition(position);
      });
      if (!active()) await this.provider.clear(id);
      else this.watchId = id;
    } catch (error) { if (active()) onError(error); }
  }
  async stop() {
    this.generation++;
    const id = this.watchId; this.watchId = null;
    if (id !== null) await this.provider.clear(id);
  }
}
export function locationError(error) {
  const code = String(error?.code || '');
  if (code === 'APPROXIMATE') return 'Only approximate location is enabled. Allow precise location in Android settings, or choose a starting place.';
  if (['1', 'OS-PLUG-GLOC-0003', 'OS-PLUG-GLOC-0008'].includes(code))
    return 'Location permission is off. Allow precise location in Android settings, or choose a starting place.';
  if (['OS-PLUG-GLOC-0007', 'OS-PLUG-GLOC-0009', 'OS-PLUG-GLOC-0017'].includes(code))
    return 'Device location is switched off. Turn it on, then tap Use my location again.';
  if (['3', 'OS-PLUG-GLOC-0010'].includes(code))
    return 'A location could not be found in time. Move to an open area and try again, or choose a starting place.';
  return 'Device location is unavailable. Try again or choose a starting place.';
}
