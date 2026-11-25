# Supplied frontend wrapper

Imported from https://github.com/prexi5594/SmartCampusFrontend at commit 36c215bdb5d6838d008c613ace5bd0f9b965901a. The upstream repository is unchanged.

Use `pnpm install --frozen-lockfile` and `pnpm run build` in this directory. The build writes `../prototype/app`; those compiled assets are committed for the existing Python Docker deployment. From the repository root run `python -m backend` and open http://127.0.0.1:8765. Do not use Vite's standalone preview for authenticated operations; the app and API use one origin.

Login and saved places use the unchanged FastAPI routes and existing cookie sessions. Original campus navigation, geographic map and Lab H guidance remain accessible through links, with matching theme accents. Illustrative maps are labelled as such. External Google fonts were replaced with local system fallbacks to preserve the existing content security policy. Contact sending remains unavailable; no unverified support phone number is published.

Validation: build, oxlint, 28 Python backend/integration tests and 27 Node navigation tests; browser registration and saved-place compatibility between the new and original interfaces. Complete screenshot capture and physical-device acceptance remain outstanding.
