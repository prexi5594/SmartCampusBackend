/* Data validation and matching only: no DOM, route state, storage or network access. */
(function () {
  'use strict';
  const isText = value => typeof value === 'string' && value.trim().length > 0;
  const isId = value => typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value);
  const hasPosition = place => place?.schematic &&
    Number.isFinite(place.schematic.x) && Number.isFinite(place.schematic.y) &&
    place.schematic.x >= 0 && place.schematic.x <= 900 &&
    place.schematic.y >= 0 && place.schematic.y <= 600;

  function create(data) {
    if (!data || data.schemaVersion !== 1 || data.kind !== 'demo' ||
        data.coordinateSpace !== 'schematic-900x600' ||
        !Array.isArray(data.categories) || !Array.isArray(data.places)) {
      throw new Error('The demonstration catalogue is missing or has an unsupported format.');
    }
    const categoryIds = new Set();
    for (const category of data.categories) {
      if (!category || !isId(category.id) || category.id === 'all' ||
          !isText(category.name) || categoryIds.has(category.id)) {
        throw new Error('The catalogue contains an invalid or repeated category.');
      }
      categoryIds.add(category.id);
    }
    if (data.entrance?.id !== 'main' || !isText(data.entrance.name) ||
        !isText(data.entrance.mapName) || !hasPosition(data.entrance)) {
      throw new Error('The demonstration entrance is missing or invalid.');
    }
    const placeIds = new Set(['main']);
    for (const place of data.places) {
      if (!place || !isId(place.id) || placeIds.has(place.id) ||
          !isText(place.name) || !isText(place.mapName) || !isText(place.description) ||
          !isId(place.icon) || !categoryIds.has(place.category) || !hasPosition(place) ||
          !Array.isArray(place.aliases) || !place.aliases.every(isText)) {
        throw new Error('The catalogue contains an invalid or repeated facility.');
      }
      placeIds.add(place.id);
    }
    const categoryNames = Object.fromEntries(data.categories.map(item => [item.id, item.name]));
    const places = data.places.map(place => ({
      ...place, aliases: [...place.aliases], schematic: { ...place.schematic },
      categoryName: categoryNames[place.category]
    }));
    return {
      categories: data.categories.map(category => ({ ...category })),
      places,
      entrance: { ...data.entrance, schematic: { ...data.entrance.schematic } },
      search(query = '', category = 'all') {
        const terms = String(query).toLowerCase().trim().split(/\s+/).filter(Boolean);
        return places.filter(place => {
          if (category !== 'all' && place.category !== category) return false;
          const searchable = [place.name, place.mapName, place.categoryName,
            place.description, ...place.aliases].join(' ').toLowerCase();
          return terms.every(term => searchable.includes(term));
        });
      }
    };
  }
  window.CampusCatalogue = { create };
}());
