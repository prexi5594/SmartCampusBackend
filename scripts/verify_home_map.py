"""Check the authenticated homepage and map assets locally or after deployment.

Public checks reuse only the synthetic deployment account in private-data.
No credentials or student records are printed or changed.
"""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import secrets
import httpx

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.assets = [], []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'script' and attrs.get('src'):
            self.assets.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            self.assets.append(attrs['href'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--origin', required=True)
    args = parser.parse_args()
    origin = args.origin.rstrip('/')
    local = origin == 'http://127.0.0.1:8765'
    if local:
        credentials = {'email': 'map-' + secrets.token_hex(8) + '@example.test',
                       'password': secrets.token_urlsafe(32)}
    else:
        state = json.loads((ROOT / 'private-data/cloud-smoke.json').read_text())
        if origin != state['origin']:
            raise ValueError('Origin must match the synthetic deployment account.')
        credentials = state['account']
    with httpx.Client(base_url=origin, timeout=60,
                      headers={'Origin': origin, 'X-Campus-Request': '1'}) as client:
        assert client.get('/health').status_code == 200
        assert client.get('/campus-navigator.html').status_code == 303
        assert client.get('/api/data/saved-places').status_code == 401
        if local:
            response = client.post('/api/auth/register', json={**credentials, 'display_name': 'Map Check'})
            assert response.status_code == 201
        else:
            assert client.post('/api/auth/login', json=credentials).status_code == 200
        try:
            for entry in ['login.html', 'campus-navigator.html']:
                response = client.get('/' + entry)
                assert response.content == (ROOT / 'prototype/app/index.html').read_bytes(), entry
            assets = set()
            shell = Page()
            shell.feed(response.text)
            assets.update(a.lstrip('/') for a in shell.assets)
            for name in ['campus-tools.html', 'usiu-map-review.html', 'science-interior.html']:
                response = client.get('/' + name)
                assert response.status_code == 200, name
                assert response.content == (ROOT / 'prototype' / name).read_bytes(), name
                assert "frame-ancestors 'none'" in response.headers['content-security-policy']
                page = Page()
                page.feed(response.text)
                assert len(page.ids) == len(set(page.ids)), name
                for element in (['journey', 'steps', 'gaps'] if name == 'science-interior.html' else ['map-live', 'campus-query', 'view-3d', 'review-details']):
                    assert element in page.ids, element
                if name == 'campus-tools.html':
                    assert 'campus-map' in page.ids
                assets.update(page.assets)
            assets.update(['data/gate-a-science-pilot.json', 'data/science-lab-h.json', 'data/usiu-geography.geojson', 'data/usiu-directory.json',
                           'data/usiu-map-sources.json',
                           'vendor/maplibre-gl-6.19.0/maplibre-gl.mjs',
                           'vendor/maplibre-gl-6.19.0/maplibre-gl-shared.mjs',
                           'vendor/maplibre-gl-6.19.0/maplibre-gl-worker.mjs'])
            for asset in sorted(assets):
                response = client.get('/' + asset)
                assert response.status_code == 200, asset
                assert hashlib.sha256(response.content).digest() == hashlib.sha256(
                    (ROOT / 'prototype' / asset).read_bytes()).digest(), asset
            assert client.get('/api/data/saved-places').status_code == 200
            print(f'PASS: protected homepage, authenticated map views, unique IDs, security headers, and {len(assets)} exact deployed assets.')
        finally:
            assert client.post('/api/auth/logout', json={}).status_code == 204
        assert client.get('/api/auth/session').status_code == 401


if __name__ == '__main__':
    main()
