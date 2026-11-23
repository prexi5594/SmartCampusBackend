/* Room matching is independent of map coordinates. Keep code order significant:
 * B-Lab (Chandaria) and Lab B (Science) are different destinations. */
(function (scope) {
  'use strict';
  const normalise = text => String(text).toLowerCase().replace(/[\s-]+/g, '');
  function search(directory, query) {
    const value = normalise(query.trim());
    if (!value) return directory.buildings.map(building => ({ building, label: building.name, code: '', candidates: building.osmCandidates, score: 0 }));
    const results = [];
    for (const building of directory.buildings) {
      const labelText = normalise([building.name, building.shortName, ...building.aliases].join(' '));
      if (labelText.includes(value)) results.push({ building, label: building.name, code: '', candidates: building.osmCandidates, score: 1 });
      for (const room of building.rooms) {
        if (normalise(room).includes(value)) results.push({ building, label: room + ' — ' + building.name, code: room, candidates: building.osmCandidates, score: normalise(room) === value ? 3 : 0 });
      }
      for (const block of building.blocks || []) {
        if (normalise(block.code).includes(value)) results.push({ building, label: block.code + ' — Wooden Blocks', code: block.code, candidates: block.osmCandidates, score: normalise(block.code) === value ? 3 : 0 });
      }
    }
    return results.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  }
  scope.UsiuDirectory = { search, normalise };
}(typeof window === 'undefined' ? globalThis : window));
