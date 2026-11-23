"""Prepare a review-only campus dataset from an already downloaded OSM extract.

No network requests, snapping, invented entrances or inferred walking permissions.
Run from the project root: python scripts/prepare_usiu_geography.py INPUT.osm
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BOUNDARY_ID = '321620567'


def inside(point, ring):
    x, y = point
    result = False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            result = not result
    return result


def tags(element):
    return {item.get('k'): item.get('v') for item in element.findall('tag')}


def centroid(ring):
    vertices = ring[:-1] if ring[0] == ring[-1] else ring
    area = x = y = 0.0
    for a, b in zip(vertices, vertices[1:] + vertices[:1]):
        cross = a[0] * b[1] - b[0] * a[1]
        area += cross
        x += (a[0] + b[0]) * cross
        y += (a[1] + b[1]) * cross
    if abs(area) > 1e-14:
        return [x / (3 * area), y / (3 * area)]
    return [sum(p[i] for p in vertices) / len(vertices) for i in (0, 1)]


def build(source_path):
    root = ET.parse(source_path).getroot()
    node_elements = {n.get('id'): n for n in root.findall('node')}
    nodes = {key: [float(n.get('lon')), float(n.get('lat'))] for key, n in node_elements.items()}
    ways = {w.get('id'): w for w in root.findall('way')}
    if BOUNDARY_ID not in ways:
        raise ValueError('Campus boundary is absent from this extract.')

    def coordinates(way):
        refs = [n.get('ref') for n in way.findall('nd')]
        if not all(ref in nodes for ref in refs):
            raise ValueError('Incomplete way: ' + way.get('id'))
        return [nodes[ref] for ref in refs]

    boundary = coordinates(ways[BOUNDARY_ID])
    if boundary[0] != boundary[-1]:
        raise ValueError('Campus boundary must be closed.')
    features = []
    building_ids = []
    for osm_id, way in sorted(ways.items(), key=lambda item: int(item[0])):
        t = tags(way)
        if not any(key in t for key in ('building', 'highway', 'amenity', 'leisure', 'landuse')):
            continue
        coords = coordinates(way)
        if len(coords) < 2:
            continue
        centre = centroid(coords) if coords[0] == coords[-1] else [sum(p[i] for p in coords) / len(coords) for i in (0, 1)]
        is_campus = osm_id == BOUNDARY_ID
        is_path = 'highway' in t and any(inside(p, boundary) for p in coords)
        if not is_campus and not is_path and not inside(centre, boundary):
            continue
        if is_campus:
            kind = 'boundary'
        elif 'building' in t:
            kind = 'building'
        elif is_path:
            kind = 'path'
        elif t.get('amenity') == 'parking':
            kind = 'parking'
        elif 'leisure' in t or 'landuse' in t:
            kind = 'landmark'
        else:
            continue
        closed = len(coords) >= 4 and coords[0] == coords[-1]
        if kind in ('boundary', 'building', 'parking') and not closed:
            raise ValueError('Expected closed polygon: ' + osm_id)
        properties = {
            'kind': kind, 'osmId': 'way/' + osm_id,
            'osmVersion': way.get('version'), 'osmTimestamp': way.get('timestamp'),
            'name': t.get('name') or t.get('operator', ''),
            'osmTags': t, 'centre': [round(v, 7) for v in centre],
            'reviewStatus': 'needs-campus-review', 'navigationVerified': False,
        }
        if kind == 'building':
            building_ids.append(osm_id)
            properties['reviewId'] = 'B' + str(len(building_ids)).zfill(2)
            height = 8.0
            basis = 'Illustrative 8 m height; actual height unknown'
            try:
                if 'height' in t:
                    height = float(t['height'].replace(' m', ''))
                    basis = 'OSM height; not surveyed by this project'
                elif 'building:levels' in t:
                    height = float(t['building:levels']) * 3.2
                    basis = 'Estimated at 3.2 m per OSM storey; not measured'
            except ValueError:
                pass
            properties['displayHeight'] = min(80, max(2, height))
            properties['heightBasis'] = basis
        if kind == 'path':
            properties['pathType'] = t['highway']
            properties['nodeIds'] = [n.get('ref') for n in way.findall('nd')]
            properties['walkPermission'] = 'unverified'
        features.append({
            'type': 'Feature', 'id': 'way/' + osm_id, 'properties': properties,
            'geometry': {'type': 'Polygon', 'coordinates': [coords]} if closed and kind != 'path' else {'type': 'LineString', 'coordinates': coords},
        })

    entrances = []
    for node_id, element in node_elements.items():
        t = tags(element)
        if inside(nodes[node_id], boundary) and 'entrance' in t:
            entrances.append({'osmId': 'node/' + node_id, 'coordinates': nodes[node_id], 'tags': t})
    counts = dict(Counter(f['properties']['kind'] for f in features))
    paths = [f for f in features if f['properties']['kind'] == 'path']
    adjacency = {}
    for feature in paths:
        refs = feature['properties']['nodeIds']
        for a, b in zip(refs, refs[1:]):
            adjacency.setdefault(a, set()).add(b)
            adjacency.setdefault(b, set()).add(a)
    remaining = set(adjacency)
    components = []
    while remaining:
        stack = [remaining.pop()]
        count = 0
        while stack:
            node = stack.pop()
            count += 1
            for neighbour in adjacency[node]:
                if neighbour in remaining:
                    remaining.remove(neighbour)
                    stack.append(neighbour)
        components.append(count)
    bounds = [min(p[0] for p in boundary), min(p[1] for p in boundary), max(p[0] for p in boundary), max(p[1] for p in boundary)]
    meta = {
        'schemaVersion': 1, 'campus': 'USIU-Africa', 'reviewOnly': True,
        'preparedDate': '2026-11-21', 'downloadedUtc': datetime.fromtimestamp(source_path.stat().st_mtime, timezone.utc).isoformat(),
        'source': 'https://www.openstreetmap.org/api/0.6/map?bbox=36.8765,-1.2205,36.8845,-1.2075',
        'boundarySource': 'https://www.openstreetmap.org/way/' + BOUNDARY_ID,
        'attribution': '© OpenStreetMap contributors',
        'license': 'ODbL-1.0', 'licenseUrl': 'https://opendatacommons.org/licenses/odbl/1-0/',
        'bounds': bounds, 'counts': counts, 'mappedBuildingEntrances': entrances,
        'pathNodeComponents': sorted(components, reverse=True),
        'limitations': [
            'OSM geometry and names have not been checked on campus; labels may be outdated.',
            'A mapped path is not evidence of current walking access or accessibility.',
            'No automatic connection from building centres to paths has been created.',
            'Paths near the boundary may extend outside it; they are display geometry only.',
            'Most building heights are illustrative. This is not a surveyed 3D model.',
            'Buildings absent from OSM are absent here; full campus coverage is not certified.',
        ],
    }
    destination = ROOT / 'prototype' / 'data'
    destination.mkdir(parents=True, exist_ok=True)
    (destination / 'usiu-geography.geojson').write_text(json.dumps({'type': 'FeatureCollection', 'features': features}, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    (destination / 'usiu-map-sources.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'counts': counts, 'entrances': len(entrances), 'path_components': sorted(components, reverse=True)}, indent=2))
    return features, meta


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    build(args.source)
