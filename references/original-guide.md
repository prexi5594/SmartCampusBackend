# Smart Campus Navigator: prompt and code walkthrough

This frontend draft follows the desktop homepage, desktop Explore view and phone layouts in your three reference images. The screenshots provide enough information to draft the interface; actual campus geography and contact details remain to be supplied.

## Prompt in your style

I'm developing a web app to help new students in my campus navigate the school. Use the attached images as the reference for the frontend design on desktop and mobile. Call it Smart Campus Navigator for now.

The app should have two main views: the homepage and Explore Campus. At the top, put the logo and app name on the left. Have Home, Explore Campus, About and Contact in the navigation, with an “Open campus map” button on the right. On phones, replace the desktop navigation with a menu button that opens and closes.

On the homepage, use the heading “Find Your Way Around Campus.” Below it, add a short description, a search field with the placeholder “Where would you like to go?” and a blue “Explore Campus” button. Users should be able to search for a building or facility. Add shortcuts below the search for popular places such as the Library, Lecture Halls and Student Centre.

Below that, add a “Get to know your campus” section with an interactive map and an option to open the full map. Use light green areas for campus grounds, pale blue shapes for buildings and white paths between them. Label the buildings and highlight the selected destination in blue. Include a north indicator, zoom in, zoom out and reset controls.

The next section should say “Everything you need, right where you need it.” Display cards for the Library, Lecture Halls, Computer Laboratories, Administration Offices, Student Centre, Cafeteria, Parking Area and Sports Facilities. Each card should have a simple icon, the facility name, a short description and a “View Location” button. Clicking it should open Explore Campus with that facility selected.

The Explore Campus view should say “Your next stop, made simple.” On desktop, put the facility list and walking route panel on the left, with the larger map on the right. The route panel should let the student choose a starting location and destination, then show the walking distance, estimated time and simple directions. Draw the selected route as a dashed blue line along the campus paths. Update the map, selected facility and route details together whenever the student changes the destination.

On mobile, show the map first, followed by the facility list and route details. Stack the homepage cards vertically and make the search fields and main buttons easy to use on a phone.

Keep the design clean, with white and very light blue backgrounds, dark navy text, blue buttons, rounded corners, thin borders and plenty of space between sections. Use a clear sans-serif font similar to the references. Add the About and campus support sections near the bottom, followed by a dark navy footer.

For this first draft, use plain HTML, CSS and JavaScript in one file that I can open in my browser. Make the search, building selection, menu, zoom controls and directions walkthrough work. Include a message when a search has no results. Use clearly labelled sample buildings, paths and distances until I provide the real campus information. The directions walkthrough can advance manually for now; it should not pretend to use live GPS. Add comments and explain the code chunk by chunk so I can understand how it works and change it myself.

## Open the sample

1. Download `campus-navigator.html`.
2. Open it in Chrome or Edge by double-clicking it, or use your browser's Open File command.
3. Search for “books” or “food”, select a facility, change the starting location, or step through the directions.
4. To edit it, open the same file in VS Code. Save your changes, then refresh the browser.

There is no installation step, backend, login or map API key. The page uses its own schematic SVG map and sample data. It makes no network requests.

## Code, chunk by chunk

The full source is reproduced below in its original order. Each section corresponds to a numbered `CHUNK` comment in the HTML file. The snippets belong to one continuous file; individual chunks are not standalone programs. HTML creates the structure, CSS styles and rearranges it, and JavaScript supplies the interactive behaviour.

### 1. Browser setup

The document starts with HTML5, declares English and uses UTF-8 so punctuation displays correctly. The viewport tag tells phones to lay the page out at their real screen width. Without it, a phone can show a shrunken desktop page. The stylesheet is inside the same file; the script is near the bottom so the HTML exists before JavaScript accesses it.

```html
<!doctype html>
<html lang="en">
<head>
  <!-- CHUNK 1: Browser setup. Everything is in this file; no packages or API keys. -->
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Smart Campus Navigator — frontend draft</title>
  <style>
```

### 2. Shared visual design

The :root variables are the design settings. --blue controls primary actions and selected routes; --navy controls the main text and footer; --pale supplies the light blue sections. These are approximations from the screenshots, not values extracted from the Figma file. Change a variable once to update all components that use it. Reusable classes define buttons, icons, the header and navigation. Focus outlines and a skip link support keyboard use.

```css
    /* CHUNK 2: Shared colours, type, spacing and reusable controls. */
    :root {
      --navy: #122e4c;
      --blue: #1761cf;
      --pale: #eef7ff;
      --muted: #5d6d7e;
      --line: #dfe7ef;
      --green: #deeadb;
      --radius: 14px;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; scroll-padding-top: 96px; }
    body { margin: 0; font: 15px/1.55 Arial, Helvetica, sans-serif; color: var(--navy); background: white; }
    button, input, select { font: inherit; }
    button, a, input, select { -webkit-tap-highlight-color: transparent; }
    button { cursor: pointer; }
    a { color: inherit; text-decoration: none; }
    button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible,
    [tabindex]:focus-visible { outline: 3px solid #a65b00; outline-offset: 4px; }
    [hidden] { display: none !important; }
    h1, h2, h3, p { margin-top: 0; }
    h1, h2, h3 { line-height: 1.2; }
    h2 { font-size: 30px; letter-spacing: -1px; }
    h3 { font-size: 17px; }
    p { color: var(--muted); }
    .container { width: min(1180px, calc(100% - 64px)); margin-inline: auto; }
    .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #355c87; }
    .primary { border: 0; border-radius: 8px; background: var(--blue); color: white; padding: 13px 19px; font-weight: 700; }
    .primary:hover { background: #0e4eaf; }
    .text-button { border: 0; background: transparent; color: #245b97; font-weight: 700; padding: 10px 0; }
    .small { font-size: 12px; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    .skip-link { position: fixed; top: -100px; left: 12px; padding: 12px; background: white; z-index: 100; }
    .skip-link:focus { top: 10px; }
    .icon { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-mark { background: var(--navy); color: white; width: 39px; height: 43px; display: grid; place-items: center; border-radius: 10px; }
    .brand strong { display: block; font-size: 15px; line-height: 1.1; }
    .brand small { display: block; font-size: 8px; letter-spacing: 3px; margin-top: 5px; }
    .site-header { background: white; border-bottom: 1px solid #edf0f5; position: relative; z-index: 10; }
    .header-inner { min-height: 82px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
    .nav-links { display: flex; align-items: center; gap: 30px; font-size: 13px; }
    .nav-links a { padding-block: 10px; color: var(--muted); }
    .nav-links a[aria-current="page"] { color: var(--blue); font-weight: 700; }
    .menu-toggle { display: none; border: 1px solid var(--line); background: white; border-radius: 8px; width: 44px; height: 44px; }
```

### 3. Page layout and phone adaptation

CSS Grid arranges facility cards in four columns on wide screens and two on smaller screens. Below 480 px, the cards become one column. The Explore view normally uses a sidebar and a map. Below 760 px, it becomes a vertical flex layout, and order: -1 moves the map above the sidebar. The mobile menu replaces the desktop navigation. Map labels are actual buttons over a drawing, and the map viewport scrolls when its contents are enlarged. A reduced-motion rule turns off smooth scrolling for users who request it.

```css
    /* CHUNK 3: Homepage and map presentation, followed by mobile layouts. */
    .hero-wrap { background: var(--pale); padding: 58px 0 34px; }
    .hero { max-width: 670px; margin: 0 auto 56px; text-align: center; }
    .badge { display: inline-flex; align-items: center; gap: 7px; background: #deedfe; border-radius: 30px; padding: 5px 11px; font-size: 11px; color: #235a92; margin-bottom: 18px; }
    .badge .icon { width: 14px; height: 14px; }
    .hero h1 { font-size: clamp(37px, 4.5vw, 56px); letter-spacing: -2px; margin-bottom: 18px; }
    .hero p { max-width: 510px; margin: 0 auto 25px; }
    .search-box { display: flex; align-items: center; gap: 11px; border: 1px solid var(--line); background: white; padding: 6px 6px 6px 15px; border-radius: 10px; }
    .search-box input { min-width: 0; width: 100%; border: 0; background: transparent; padding: 9px 0; color: var(--navy); }
    .search-box .primary { flex-shrink: 0; font-size: 12px; }
    .popular { display: flex; justify-content: center; align-items: center; gap: 14px; margin-top: 12px; flex-wrap: wrap; font-size: 11px; }
    .popular span { color: var(--muted); }
    .popular button { border: 0; background: none; padding: 6px 0; color: var(--navy); }
    .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 14px; }
    .section-heading h2 { font-size: 21px; letter-spacing: -.3px; margin: 0; }
    .map-shell { position: relative; border-radius: var(--radius); overflow: hidden; border: 1px solid #e2e9e4; background: #edf2ec; }
    .map-viewport { height: 335px; overflow: auto; overscroll-behavior: contain; }
    .map-canvas { position: relative; width: 100%; height: 100%; }
    .map-drawing { width: 100%; height: 100%; display: block; }
    .map-search { position: absolute; left: 16px; top: 16px; width: min(280px, calc(100% - 85px)); z-index: 3; padding-block: 2px; box-shadow: 0 2px 10px #122e4c08; }
    .map-search input { font-size: 12px; }
    .north { position: absolute; top: 16px; right: 16px; display: grid; text-align: center; border-radius: 7px; background: white; padding: 6px 11px; font-size: 15px; line-height: 1.1; }
    .north small { font-size: 9px; margin-top: 4px; }
    .map-tools { position: absolute; right: 16px; bottom: 16px; display: flex; flex-direction: column; background: white; padding: 4px; border-radius: 9px; box-shadow: 0 2px 10px #122e4c0c; }
    .map-tools button { border: 0; background: white; color: var(--navy); width: 36px; height: 36px; font-size: 20px; }
    .map-tools button:hover { background: var(--pale); }
    .map-tools button:disabled { color: #abb7c0; cursor: default; }
    .map-tools svg { width: 17px; height: 17px; }
    .map-pin { position: absolute; transform: translate(-50%, -50%); border: 1px solid #e0e7e1; border-radius: 5px; background: white; color: var(--navy); padding: 5px 7px; font-size: 10px; font-weight: 700; white-space: nowrap; min-height: 32px; }
    .map-pin::before { content: '•'; color: var(--blue); margin-right: 4px; }
    .map-pin[aria-pressed="true"] { background: var(--blue); color: white; border-color: var(--blue); }
    .map-pin[aria-pressed="true"]::before { color: white; }
    .map-pin.is-start { outline: 2px solid #24644a; outline-offset: 2px; }
    .map-caption { font-size: 11px; color: var(--muted); margin: 10px 0 0; }
    .legend { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; font-size: 11px; color: var(--muted); margin-top: 15px; }
    .legend span::before { content: ''; display: inline-block; width: 7px; height: 7px; border-radius: 2px; background: #b7cadb; margin-right: 6px; }
    .legend .green::before { background: #b7d0af; }
    .legend .route-key::before { background: var(--blue); }
    .destinations { padding: 65px 0; }
    .destinations h2 { margin-bottom: 10px; }
    .facility-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; margin-top: 28px; }
    .facility-card { border: 1px solid var(--line); border-radius: var(--radius); padding: 23px; display: flex; flex-direction: column; align-items: flex-start; min-height: 237px; }
    .facility-card:hover { border-color: #a8c5eb; box-shadow: 0 4px 18px #122e4c07; }
    .card-icon { width: 37px; height: 37px; border-radius: 8px; background: var(--pale); color: #3374b5; display: grid; place-items: center; margin-bottom: 17px; }
    .facility-card h3 { font-size: 15px; margin-bottom: 9px; }
    .facility-card p { font-size: 12px; margin-bottom: 18px; }
    .facility-card button { width: 100%; display: flex; justify-content: space-between; margin-top: auto; font-size: 12px; text-align: left; }
    .about-section { background: #f5f8fd; padding: 45px 0; }
    .about-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 70px; align-items: center; }
    .about-grid h2 { font-size: 27px; margin-bottom: 12px; }
    .about-grid p { font-size: 13px; margin-bottom: 0; }
    .support-card { background: white; border: 1px solid var(--line); border-radius: var(--radius); padding: 24px; }
    .support-card h3 { margin-bottom: 10px; }
    details { font-size: 12px; margin-top: 14px; }
    summary { cursor: pointer; color: #245b97; font-weight: 700; padding: 5px 0; }
    .site-footer { background: var(--navy); color: white; padding: 22px 0; font-size: 11px; }
    .footer-inner { display: flex; justify-content: space-between; gap: 20px; }
    .footer-inner span { color: #c4d2e3; }
    .explore-page { background: #f5f8fd; padding: 38px 0 45px; }
    .explore-title { font-size: 34px; letter-spacing: -1px; margin-bottom: 9px; }
    .demo-note { border: 1px solid #d7e5f3; border-radius: 8px; background: #edf5ff; padding: 10px 13px; font-size: 12px; margin: 18px 0 24px; }
    .explore-grid { display: grid; grid-template-columns: 285px minmax(0, 1fr); gap: 22px; align-items: start; }
    .sidebar { display: grid; gap: 18px; }
    .panel { background: white; padding: 19px; border: 1px solid var(--line); border-radius: var(--radius); }
    .panel h2 { font-size: 17px; letter-spacing: -.2px; margin-bottom: 5px; }
    .result-count { font-size: 11px; margin-bottom: 12px; }
    .facility-list { display: grid; gap: 3px; }
    .facility-list button { text-align: left; display: flex; align-items: center; gap: 9px; border: 0; border-radius: 6px; padding: 11px 9px; color: var(--navy); background: white; width: 100%; font-size: 12px; }
    .facility-list button .icon { width: 15px; height: 15px; }
    .facility-list button[aria-pressed="true"] { background: #eaf2ff; color: #1452b1; font-weight: 700; }
    .facility-list button:hover { background: var(--pale); }
    .facility-list .arrow { margin-left: auto; }
    .empty { padding: 10px 0; font-size: 13px; }
    .empty button { padding-left: 0; color: var(--blue); }
    .route-panel label { font-size: 10px; font-weight: 700; color: #53687d; text-transform: uppercase; letter-spacing: .5px; display: block; margin-top: 13px; }
    .route-panel select { width: 100%; border: 1px solid var(--line); padding: 10px; border-radius: 7px; background: #f5f8fc; color: var(--navy); margin-top: 5px; font-size: 12px; }
    .selected-description { font-size: 12px; margin: 12px 0; }
    .route-summary { margin-top: 15px; color: var(--navy); }
    .route-summary strong { font-size: 25px; }
    .route-summary span { margin-left: 7px; font-size: 12px; color: var(--muted); }
    .route-hint { font-size: 11px; margin: 4px 0 12px; }
    .route-steps { padding-left: 23px; font-size: 12px; color: #536477; }
    .route-steps li { padding: 5px 2px; }
    .route-steps li.current-step { color: #124da3; font-weight: 700; background: #edf5ff; border-radius: 5px; }
    .route-panel .primary { width: 100%; margin-top: 7px; font-size: 12px; }
    .route-panel .primary:disabled { background: #d5dfeb; color: #4e6076; cursor: default; }
    .walk-status { font-size: 12px; margin: 10px 0 0; color: var(--navy); }
    .reset-walk { width: 100%; font-size: 12px; }
    .explore-map .map-viewport { height: 590px; }
    .explore-map .section-heading h2 { font-size: 15px; }
    .route-label { font-size: 11px; color: #255995; }
    @media (max-width: 1000px) {
      .nav-links { gap: 18px; }
      .facility-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .explore-grid { grid-template-columns: 255px minmax(0, 1fr); gap: 16px; }
      .map-pin { font-size: 9px; padding-inline: 4px; }
    }
    @media (max-width: 760px) {
      .container { width: calc(100% - 36px); }
      .header-inner { min-height: 70px; }
      .header-cta { display: none; }
      .menu-toggle { display: grid; place-items: center; }
      .nav-links { display: none; position: absolute; left: 0; right: 0; top: 100%; padding: 18px; background: white; border-bottom: 1px solid var(--line); box-shadow: 0 8px 12px #122e4c0a; }
      .nav-links.is-open { display: flex; flex-direction: column; align-items: stretch; gap: 4px; }
      .nav-links a { padding: 12px; }
      .hero-wrap { padding-top: 34px; }
      .hero { text-align: left; margin-bottom: 38px; }
      .hero h1 { font-size: 38px; letter-spacing: -1.7px; }
      .hero p { margin-left: 0; font-size: 14px; }
      .hero-search { display: grid; grid-template-columns: 20px minmax(0, 1fr); padding: 10px; }
      .hero-search .primary { grid-column: 1 / -1; width: 100%; }
      .popular { justify-content: flex-start; gap: 10px; }
      .section-heading h2 { font-size: 18px; }
      .section-heading a { font-size: 11px; }
      .map-viewport, .explore-map .map-viewport { height: 360px; }
      .map-search { left: 10px; top: 10px; }
      .map-pin { font-size: 10px; min-height: 36px; }
      .map-tools, .north { right: 10px; }
      .destinations { padding: 42px 0; }
      .destinations h2 { font-size: 29px; }
      .facility-card { padding: 22px; }
      .about-grid { grid-template-columns: 1fr; gap: 25px; }
      .footer-inner { flex-direction: column; gap: 7px; }
      .explore-page { padding-top: 28px; }
      .explore-title { font-size: 30px; }
      .explore-grid { display: flex; flex-direction: column; gap: 22px; }
      .explore-map { order: -1; width: 100%; }
      .sidebar { width: 100%; }
      .panel { padding: 20px; }
      .facility-list button { font-size: 13px; min-height: 46px; }
    }
    @media (max-width: 480px) { .facility-grid { grid-template-columns: 1fr; } }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
  </style>
</head>
<body>
```

### 4. HTML interface

The header, main content and footer describe the page structure. The homepage contains the hero search, popular shortcuts, map container, facility-card container, About and support sections. The Explore view contains the facility list, start/destination selectors, route summary, directions and larger map. hidden initially keeps Explore out of sight and out of the accessibility tree. JavaScript later switches between the two views. Labels give form fields accessible names, while status regions announce search and route changes. Support details remain explicit placeholders until you provide official information.

```html
  <!-- CHUNK 4: Semantic HTML for the shared header and the two page views. -->
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="#home" aria-label="Smart Campus Navigator home">
        <span class="brand-mark" data-icon="pin" aria-hidden="true"></span>
        <span><strong>Smart Campus</strong><small>NAVIGATOR</small></span>
      </a>
      <button class="menu-toggle" id="menu-toggle" aria-controls="main-nav" aria-expanded="false" aria-label="Open navigation menu"><span data-icon="menu"></span></button>
      <nav class="nav-links" id="main-nav" aria-label="Main navigation">
        <a href="#home" data-page-link="home">Home</a>
        <a href="#explore" data-page-link="explore">Explore Campus</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
      <a class="primary header-cta" href="#explore">Open campus map &nbsp; →</a>
    </div>
  </header>
  <main id="main" tabindex="-1">
    <div id="home-view">
      <section class="hero-wrap">
        <div class="container">
          <div class="hero">
            <span class="badge"><span data-icon="pin"></span>A smarter way to explore</span>
            <h1 id="home-title" tabindex="-1">Find Your Way<br>Around Campus.</h1>
            <p>Explore your campus with ease. Find lecture halls, laboratories, libraries and other facilities in just a few clicks.</p>
            <form class="search-box hero-search" id="hero-search" role="search">
              <span data-icon="search"></span>
              <label class="sr-only" for="hero-query">Search campus facilities</label>
              <input id="hero-query" type="search" placeholder="Where would you like to go?" autocomplete="off">
              <button class="primary" type="submit">Explore Campus &nbsp; →</button>
            </form>
            <div class="popular"><span>Popular:</span><button data-destination="library">Library</button><button data-destination="lectures">Lecture Halls</button><button data-destination="student">Student Centre</button></div>
          </div>
          <div class="section-heading"><h2>Get to know your campus</h2><a class="text-button" href="#explore">Explore full map ↗</a></div>
          <div id="home-map"></div>
          <div class="legend"><span>Campus buildings</span><span class="green">Green spaces</span><span class="route-key">Selected route</span></div>
          <p class="map-caption">Illustrative campus map. Buildings, routes and distances are sample data.</p>
        </div>
      </section>
      <section class="container destinations" aria-labelledby="destinations-title">
        <p class="eyebrow">Everyday destinations</p>
        <h2 id="destinations-title">Everything you need,<br>right where you need it.</h2>
        <p>From your first lecture to your favourite lunch spot, find your place on campus.</p>
        <div class="facility-grid" id="facility-cards"></div>
      </section>
      <section class="about-section" id="about" aria-labelledby="about-title">
        <div class="container about-grid">
          <div><h2 id="about-title" tabindex="-1">A little less searching.<br>A lot more campus.</h2><p>Built for first days, everyday journeys and everything in between. Smart Campus Navigator helps students, staff and visitors feel right at home.</p></div>
          <div class="support-card" id="contact"><h3 id="contact-title" tabindex="-1">Need a hand finding your way?</h3><p>Your campus support details will appear here.</p><details><summary>Campus support information →</summary><p>This draft does not include a real phone number or email address. Add the official welcome desk location, opening hours and contact details before launch.</p></details></div>
        </div>
      </section>
    </div>
    <section class="explore-page" id="explore-view" hidden aria-labelledby="explore-title">
      <div class="container">
        <p class="eyebrow">Campus guide / Explore</p>
        <h1 class="explore-title" id="explore-title" tabindex="-1">Your next stop, made simple.</h1>
        <p>Search a place, choose your route and find your way.</p>
        <p class="demo-note">Frontend demo · These paths and distances are illustrative. Directions advance manually; this is not live GPS navigation.</p>
        <div class="explore-grid">
          <aside class="sidebar" aria-label="Facilities and route planner">
            <section class="panel" aria-labelledby="facilities-title">
              <h2 id="facilities-title">Explore facilities</h2>
              <p class="result-count" id="result-count" role="status" aria-live="polite"></p>
              <div class="facility-list" id="facility-list"></div>
            </section>
            <section class="panel route-panel" aria-labelledby="route-title">
              <h2 id="route-title">Your walking route</h2>
              <label for="start-location">Starting location</label><select id="start-location"></select>
              <label for="destination">Destination</label><select id="destination"></select>
              <p class="selected-description" id="selected-description"></p>
              <div id="route-summary" class="route-summary" role="status" aria-live="polite"></div>
              <p class="route-hint">Sample distance · walking estimate at 75 m/min</p>
              <ol class="route-steps" id="route-steps"></ol>
              <button class="primary" id="walk-button">Start directions (demo) →</button>
              <p class="walk-status" id="walk-status" role="status" aria-live="polite"></p>
              <button class="text-button reset-walk" id="reset-walk" hidden>Reset walkthrough</button>
            </section>
          </aside>
          <section class="explore-map" aria-label="Interactive campus map">
            <div class="section-heading"><h2>Campus overview</h2><span class="route-label">● Walking route</span></div>
            <div id="explore-map"></div>
            <p class="map-caption">Blue = destination · green outline = start. Zoom with + / −; scroll the enlarged map. Reset fits the whole campus.</p>
          </section>
        </div>
      </div>
    </section>
  </main>
  <footer class="site-footer"><div class="container footer-inner"><strong>Smart Campus Navigator</strong><span>Your campus. Connected.</span><span>Frontend sample · Campus guide</span></div></footer>
  <noscript><p class="container">Enable JavaScript to use the map, facility search and directions.</p></noscript>

  <script>
    'use strict';
```

### 5. Campus data and walkways

places is the catalogue of eight facilities. Each object has a stable id, display names, an icon, coordinates, a description and search keywords. For example, searching for “food” can find Cafeteria. x and y are positions on a 900 × 600 schematic drawing; they are not geographic coordinates. nodes includes entrances and path junctions. connections records which nodes connect, and gives each path a name. Every connection is bidirectional in this example. edges adds a synthetic distance using 0.8 metres per drawing unit. Replace that assumption with measured path lengths for a real campus. Renaming a facility does not require rewriting the interface.

```javascript
    // CHUNK 5: Facility data is separate from layout, so campus details are easy to replace.
    const places = [
      { id: 'library', name: 'Library', mapName: 'Library', icon: 'book', x: 450, y: 180, description: 'Find your quiet corner. Books, study spaces and resources.', keywords: 'books research reading study' },
      { id: 'lectures', name: 'Lecture Halls', mapName: 'Lecture Halls', icon: 'lecture', x: 150, y: 180, description: 'Your next class, closer. Large teaching rooms and auditoriums.', keywords: 'classes classrooms teaching' },
      { id: 'labs', name: 'Computer Laboratories', mapName: 'Computer Labs', icon: 'monitor', x: 750, y: 180, description: 'Connect and create. Discover computing and practical labs.', keywords: 'computers ict practical technology' },
      { id: 'admin', name: 'Administration Offices', mapName: 'Administration', icon: 'building', x: 150, y: 385, description: 'Get the support you need. Admissions, records and enquiries.', keywords: 'registration fees admissions records finance' },
      { id: 'student', name: 'Student Centre', mapName: 'Student Centre', icon: 'people', x: 450, y: 385, description: 'The heart of campus life. Meet, collaborate and get involved.', keywords: 'clubs societies students events' },
      { id: 'cafe', name: 'Cafeteria', mapName: 'Cafeteria', icon: 'food', x: 750, y: 385, description: 'Take a delicious break. Explore places to eat and recharge.', keywords: 'food lunch meals dining' },
      { id: 'parking', name: 'Parking Area', mapName: 'Parking Area', icon: 'parking', x: 150, y: 555, description: 'Arrive without the guesswork. Find convenient campus parking.', keywords: 'cars vehicles parking' },
      { id: 'sports', name: 'Sports Facilities', mapName: 'Sports Facilities', icon: 'trophy', x: 750, y: 555, description: 'Make your next move. Find courts, fields and fitness spaces.', keywords: 'gym football basketball fitness' }
    ];
    const mainEntrance = { id: 'main', name: 'Main Entrance', mapName: 'Main Entrance', x: 300, y: 555 };
    const locations = [mainEntrance, ...places];
    const byId = Object.fromEntries(locations.map(place => [place.id, place]));

    // A node is an entrance or path junction. Edges describe actual connections in this demo.
    // Coordinates are schematic drawing units, NOT latitude/longitude.
    const nodes = Object.fromEntries(locations.map(place => [place.id, [place.x, place.y]]));
    Object.assign(nodes, {
      nw: [300, 210], nc: [450, 210], ne: [600, 210],
      sw: [300, 420], sc: [450, 420], se: [600, 420],
      tl: [150, 210], tr: [750, 210], ml: [150, 420], mr: [750, 420], bottom: [600, 555]
    });
    const connections = [
      ['main', 'sw', 'University Walk'], ['sw', 'nw', 'University Walk'],
      ['nw', 'nc', 'Library Walk'], ['nc', 'ne', 'Library Walk'],
      ['nw', 'tl', 'Library Walk'], ['ne', 'tr', 'Library Walk'],
      ['ne', 'se', 'East Walk'], ['se', 'bottom', 'East Walk'],
      ['sw', 'sc', 'Central Walk'], ['sc', 'se', 'Central Walk'],
      ['sw', 'ml', 'Central Walk'], ['se', 'mr', 'Central Walk'],
      ['tl', 'lectures', 'the entrance path'], ['nc', 'library', 'the entrance path'],
      ['tr', 'labs', 'the entrance path'], ['ml', 'admin', 'the entrance path'],
      ['sc', 'student', 'the entrance path'], ['mr', 'cafe', 'the entrance path'],
      ['main', 'parking', 'South Walk'], ['bottom', 'sports', 'South Walk']
    ];
    const edges = connections.map(([a, b, road]) => ({
      a, b, road,
      // Synthetic scale for the example only. Replace with measured path lengths.
      meters: Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]) * 0.8
    }));
```

### 6. Shared state and helpers

state records the chosen starting place, destination, search text, route and current walkthrough step. It keeps both maps, the list and the route controls consistent. The $ and $$ helpers are short forms of querySelector and querySelectorAll. escapeHTML turns special characters into text before descriptions and names are inserted into HTML. icon returns small inline SVG illustrations. These icons require no external images, font download or icon package.

```javascript
    // CHUNK 6: Small shared state, safe text output and reusable SVG icons.
    const state = { start: 'main', destination: 'library', query: '', route: null, steps: [], step: -1 };
    const $ = selector => document.querySelector(selector);
    const $$ = selector => [...document.querySelectorAll(selector)];
    const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const iconPaths = {
      pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
      search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
      menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
      book: '<path d="M12 5v16M12 5C9 3 5 3 3 4v15c3-1 6-1 9 2 3-3 6-3 9-2V4c-2-1-6-1-9 1Z"/>',
      lecture: '<rect x="3" y="3" width="18" height="13" rx="1"/><path d="m8 21 4-5 4 5M7 7h10M7 11h6"/>',
      monitor: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5M8 21h8"/>',
      building: '<path d="M5 21V5l7-3 7 3v16H5ZM10 21v-5h4v5M8 7h1M15 7h1M8 11h1M15 11h1"/>',
      people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6M18 13c3 0 3 4 3 8"/>',
      food: '<path d="M5 3v6a3 3 0 0 0 6 0V3M8 3v18M17 21v-8h3V3c-3 0-3 6-3 10"/>',
      parking: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 18V6h4a4 4 0 0 1 0 8H9"/>',
      trophy: '<path d="M8 3h8v7a4 4 0 0 1-8 0V3ZM8 5H3v3a4 4 0 0 0 5 4M16 5h5v3a4 4 0 0 1-5 4M12 14v6M8 21h8"/>',
      fit: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>'
    };
    const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.pin}</svg>`;
```

### 7. Drawing the map and facility cards

mapMarkup creates the same map for Home and Explore using a different input-id prefix, so labels remain unique. SVG draws the grounds, walkways and building rectangles. The route is a polyline: an ordered set of points joined by line segments. HTML buttons sit above the drawing at positions calculated as x / 900 and y / 600. This makes each building selectable with a mouse, touch or keyboard. renderCards loops through the same place data to create the eight homepage cards. Keeping map labels and cards tied to one dataset avoids separately maintained copies.

```javascript
    // CHUNK 7: Render both maps from the same data, with real buttons over an SVG drawing.
    function mapMarkup(prefix) {
      const buildingShapes = places.map(place => `<rect data-building="${place.id}" x="${place.x - 58}" y="${place.y - 90}" width="116" height="66" rx="5" fill="#d4e0e9" stroke="#bfccd5" stroke-width="3"/>`).join('');
      const paths = edges.map(edge => `<line x1="${nodes[edge.a][0]}" y1="${nodes[edge.a][1]}" x2="${nodes[edge.b][0]}" y2="${nodes[edge.b][1]}" stroke="#fff" stroke-width="14"/>`).join('');
      const pins = locations.map(place => `<button class="map-pin" style="left:${place.x / 9}%;top:${place.y / 6}%" data-map-place="${place.id}" aria-label="${place.id === 'main' ? 'Set start to Main Entrance' : `Directions to ${escapeHTML(place.name)}`}" aria-pressed="false">${escapeHTML(place.mapName)}</button>`).join('');
      return `<div class="map-shell" data-map="${prefix}">
        <div class="map-viewport" tabindex="0" aria-label="${prefix === 'home' ? 'Preview' : 'Explore'} map; scroll to pan when zoomed">
          <div class="map-canvas">
            <svg class="map-drawing" viewBox="0 0 900 600" preserveAspectRatio="none" aria-hidden="true">
              <rect width="900" height="600" fill="#edf2ec"/>
              <rect x="28" y="95" width="235" height="415" rx="28" fill="#dfead9"/>
              <rect x="350" y="260" width="200" height="139" rx="24" fill="#dce9d7"/>
              <rect x="642" y="110" width="225" height="400" rx="28" fill="#e0eadc"/>
              <path d="M300 65V580M600 65V580M0 210H900M0 420H900" stroke="white" stroke-width="25" fill="none"/>
              <path d="M300 65V580M600 65V580M0 210H900M0 420H900" stroke="#e5eae3" stroke-width="1" fill="none"/>
              ${paths}${buildingShapes}
              <text x="450" y="282" text-anchor="middle" fill="#5a7458" font-family="Arial" font-size="12">CENTRAL GREEN</text>
              <polyline data-route-line points="" fill="none" stroke="#1761cf" stroke-width="3" stroke-dasharray="6 4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
            </svg>${pins}
          </div>
        </div>
        <form class="search-box map-search" data-map-search role="search">
          ${icon('search')}<label class="sr-only" for="${prefix}-map-query">Search buildings or facilities</label>
          <input id="${prefix}-map-query" type="search" placeholder="Search buildings or facilities" autocomplete="off">
        </form>
        <div class="north" aria-label="North is up">↑<small>N</small></div>
        <div class="map-tools" aria-label="Map controls">
          <button data-zoom="in" aria-label="Zoom in">+</button>
          <button data-zoom="out" aria-label="Zoom out">−</button>
          <button data-zoom="reset" aria-label="Reset map view">${icon('fit')}</button>
        </div>
      </div>`;
    }
    function renderCards() {
      $('#facility-cards').innerHTML = places.map(place => `<article class="facility-card">
        <span class="card-icon">${icon(place.icon)}</span><h3>${escapeHTML(place.name)}</h3>
        <p>${escapeHTML(place.description)}</p><button class="text-button" data-destination="${place.id}" aria-label="View ${escapeHTML(place.name)} on the map">View Location <span aria-hidden="true">↗</span></button>
      </article>`).join('');
    }
```

### 8. Facility search

searchPlaces lowercases the query, removes outer spaces and splits it into words. A facility matches when every query word appears somewhere in its name, keywords or description. renderList shows those matches and their count; if none match, it shows a useful message and a Clear search button. Typing in the Explore search filters the list immediately. Submitting a search with exactly one match also selects that destination. Multiple matches remain a list for the student to choose from. Filtering the list does not silently change an existing route.

```javascript
    // CHUNK 8: Search filters facility data; the currently selected route stays intact.
    function searchPlaces(query) {
      const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
      return places.filter(place => terms.every(term => `${place.name} ${place.keywords} ${place.description}`.toLowerCase().includes(term)));
    }
    function renderList() {
      const matches = searchPlaces(state.query);
      $('#result-count').textContent = `${matches.length} of ${places.length} places${state.query.trim() ? ' match your search' : ' around campus'}`;
      $('#facility-list').innerHTML = matches.length ? matches.map(place => `<button data-destination="${place.id}" aria-pressed="${place.id === state.destination}">${icon('pin')}<span>${escapeHTML(place.name)}</span><span class="arrow" aria-hidden="true">›</span></button>`).join('') : '<div class="empty"><p>No facilities found. Try “library”, “food” or “classes”.</p><button data-clear-search>Clear search</button></div>';
    }
```

### 9. Finding and showing a route

shortestPath uses Dijkstra’s algorithm. It begins with distance zero at the start and unknown/infinite distance elsewhere. It repeatedly chooses the nearest unvisited node, checks each connected neighbour and keeps any shorter distance it discovers. previous records how to reconstruct the winning path. The result contains the node sequence and total metres; an unreachable destination returns null. routeInstructions groups consecutive segments that share a path name and direction. updateRoute draws the resulting line, highlights the destination, synchronises selectors and estimates minutes using metres / 75, rounded up. The sample Main Entrance → Library route is 420 m, displayed as 6 min. That is a demonstration value, not a measurement of your campus.

```javascript
    // CHUNK 9: Dijkstra's algorithm chooses the shortest connected route by path distance.
    // For this small graph, a simple scan is easier to learn than a priority queue.
    function shortestPath(start, end) {
      if (!nodes[start] || !nodes[end]) return null;
      const distance = Object.fromEntries(Object.keys(nodes).map(id => [id, Infinity]));
      const previous = {};
      const unvisited = new Set(Object.keys(nodes));
      distance[start] = 0;
      while (unvisited.size) {
        const current = [...unvisited].reduce((best, id) => distance[id] < distance[best] ? id : best);
        if (distance[current] === Infinity) break;
        unvisited.delete(current);
        if (current === end) break;
        for (const edge of edges) {
          const next = edge.a === current ? edge.b : edge.b === current ? edge.a : null;
          if (!next || !unvisited.has(next)) continue;
          const candidate = distance[current] + edge.meters;
          if (candidate < distance[next]) {
            distance[next] = candidate;
            previous[next] = current;
          }
        }
      }
      if (!Number.isFinite(distance[end])) return null;
      const path = [];
      for (let node = end; node !== undefined; node = previous[node]) path.unshift(node);
      return { path, meters: distance[end] };
    }
    function routeInstructions(route) {
      if (!route) return [];
      const steps = [];
      route.path.slice(1).forEach((b, index) => {
        const a = route.path[index];
        const edge = edges.find(item => (item.a === a && item.b === b) || (item.a === b && item.b === a));
        const dx = nodes[b][0] - nodes[a][0], dy = nodes[b][1] - nodes[a][1];
        const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : (dy > 0 ? 'south' : 'north');
        const last = steps.at(-1);
        if (last && last.road === edge.road && last.direction === direction) last.meters += edge.meters;
        else steps.push({ road: edge.road, direction, meters: edge.meters });
      });
      return steps.map(step => `Head ${step.direction} along ${step.road} for ${Math.round(step.meters)} m.`);
    }
    function updateRoute() {
      state.route = shortestPath(state.start, state.destination);
      state.steps = routeInstructions(state.route);
      state.step = -1;
      $('#start-location').value = state.start;
      $('#destination').value = state.destination;
      $('#selected-description').textContent = byId[state.destination].description;
      const meters = state.route ? Math.round(state.route.meters) : 0;
      const minutes = Math.ceil(meters / 75);
      $('#route-summary').innerHTML = !state.route ? 'No connected route is available.' : meters === 0 ? 'You selected the same start and destination.' : `<strong>${minutes} min</strong><span>walk · ${meters} m</span>`;
      $('#route-steps').innerHTML = state.steps.map(step => `<li>${escapeHTML(step)}</li>`).join('');
      const points = state.route ? state.route.path.map(id => nodes[id].join(',')).join(' ') : '';
      $$('[data-route-line]').forEach(line => line.setAttribute('points', points));
      $$('[data-building]').forEach(building => {
        const active = building.dataset.building === state.destination;
        building.setAttribute('fill', active ? '#c4dcff' : '#d4e0e9');
        building.setAttribute('stroke', active ? '#1761cf' : '#bfccd5');
      });
      $$('[data-map-place]').forEach(pin => {
        pin.setAttribute('aria-pressed', String(pin.dataset.mapPlace === state.destination));
        pin.classList.toggle('is-start', pin.dataset.mapPlace === state.start);
      });
      renderWalkthrough();
      renderList();
    }
```

### 10. Manual directions walkthrough

state.step starts at -1, meaning the walkthrough has not begun. Start directions moves it to the first step. Next step advances it, and Finish walkthrough displays completion. The current instruction is highlighted and announced. Restart and Reset allow another run. A start equal to the destination produces a clear message and disables the walkthrough. Changing the route resets progress. This demonstrates the navigation interface; it does not request location permission, track movement or confirm physical arrival.

```javascript
    // CHUNK 10: The directions button advances a manual demo, not a GPS session.
    function renderWalkthrough() {
      const count = state.steps.length;
      const finished = state.step >= count && count > 0;
      $('#walk-button').disabled = !count;
      $('#walk-button').textContent = state.step < 0 ? 'Start directions (demo) →' : finished ? 'Restart demo →' : state.step === count - 1 ? 'Finish walkthrough ✓' : 'Next step →';
      $('#walk-status').textContent = !count ? '' : state.step < 0 ? 'Advance each step manually in this demo.' : finished ? `Demo complete: ${byId[state.destination].name}.` : `Step ${state.step + 1} of ${count}: ${state.steps[state.step]}`;
      $('#reset-walk').hidden = state.step < 0;
      $$('#route-steps li').forEach((item, index) => {
        item.classList.toggle('current-step', index === state.step);
        if (index === state.step) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      });
    }
```

### 11. Connecting clicks, typing and navigation

Event listeners translate user actions into state changes. A click on a facility card or map label selects that destination and updates the route. A single delegated click handler recognises data-* attributes even when the list has been recreated. Change events on the selectors recalculate directions. Zoom buttons resize only their own map canvas; reset restores the initial size and scroll position. The URL hash switches between #home and #explore and supports browser Back/Forward. About and Contact reveal the homepage and move to the appropriate section. The mobile menu reports its expanded state, closes after navigation and responds to Escape. Focus handling helps keyboard users retain their place.

```javascript
    // CHUNK 11: Navigation, search and map events connect user actions to the state.
    function closeMenu() {
      $('#main-nav').classList.remove('is-open');
      $('#menu-toggle').setAttribute('aria-expanded', 'false');
      $('#menu-toggle').setAttribute('aria-label', 'Open navigation menu');
    }
    function showPage(moveFocus = true) {
      const page = location.hash === '#explore' ? 'explore' : 'home';
      $('#home-view').hidden = page !== 'home';
      $('#explore-view').hidden = page !== 'explore';
      document.title = `${page === 'explore' ? 'Explore Campus' : 'Smart Campus Navigator'} — frontend draft`;
      $$('[data-page-link]').forEach(link => {
        if (link.dataset.pageLink === page) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      closeMenu();
      if (!moveFocus) return;
      const section = ['#about', '#contact'].includes(location.hash) ? location.hash : null;
      const title = section ? $(`${section}-title`) : $(`#${page}-title`);
      title.focus({ preventScroll: true });
      if (section) $(section).scrollIntoView();
      else window.scrollTo({ top: 0, behavior: 'instant' });
    }
    function setQuery(query) {
      state.query = query;
      $('#explore-map-query').value = query;
      renderList();
    }
    function selectDestination(id, moveFocus = false) {
      if (!places.some(place => place.id === id)) return;
      state.destination = id;
      updateRoute();
      if (location.hash !== '#explore') location.hash = 'explore';
      else if (moveFocus && window.matchMedia('(max-width: 760px)').matches) {
        $('#route-title').setAttribute('tabindex', '-1');
        $('#route-title').focus({ preventScroll: true });
        $('#route-title').scrollIntoView({ block: 'start' });
      }
    }
    function submitSearch(query) {
      setQuery(query);
      const matches = searchPlaces(query);
      // Only choose automatically when the result is unambiguous.
      if (query.trim() && matches.length === 1) selectDestination(matches[0].id);
      else location.hash = 'explore';
    }
    document.addEventListener('click', event => {
      if (event.target.closest('#main-nav a')) closeMenu();
      const destinationButton = event.target.closest('[data-destination]');
      if (destinationButton) {
        // Avoid discarding keyboard focus when renderList replaces the clicked button.
        const id = destinationButton.dataset.destination;
        const fromList = !!destinationButton.closest('#facility-list');
        selectDestination(id, true);
        if (fromList && !window.matchMedia('(max-width: 760px)').matches) $(`#facility-list [data-destination="${id}"]`)?.focus();
      }
      const pin = event.target.closest('[data-map-place]');
      if (pin) {
        if (pin.dataset.mapPlace === 'main') { state.start = 'main'; updateRoute(); }
        else selectDestination(pin.dataset.mapPlace, true);
      }
      if (event.target.closest('[data-clear-search]')) { setQuery(''); $('#explore-map-query').focus(); }
      const zoom = event.target.closest('[data-zoom]');
      if (zoom) {
        const shell = zoom.closest('[data-map]');
        const current = Number(shell.dataset.scale || 1);
        const scale = zoom.dataset.zoom === 'reset' ? 1 : Math.min(2, Math.max(1, current + (zoom.dataset.zoom === 'in' ? .25 : -.25)));
        shell.dataset.scale = scale;
        const canvas = shell.querySelector('.map-canvas');
        canvas.style.width = `${scale * 100}%`;
        canvas.style.height = `${scale * 100}%`;
        shell.querySelector('[data-zoom="out"]').disabled = scale === 1;
        shell.querySelector('[data-zoom="in"]').disabled = scale === 2;
        if (zoom.dataset.zoom === 'reset') shell.querySelector('.map-viewport').scrollTo(0, 0);
      }
    });
    $('#hero-search').addEventListener('submit', event => { event.preventDefault(); submitSearch($('#hero-query').value); });
    $('#menu-toggle').addEventListener('click', () => {
      const open = $('#main-nav').classList.toggle('is-open');
      $('#menu-toggle').setAttribute('aria-expanded', String(open));
      $('#menu-toggle').setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && $('#main-nav').classList.contains('is-open')) { closeMenu(); $('#menu-toggle').focus(); }
    });
    $('#start-location').addEventListener('change', event => { state.start = event.target.value; updateRoute(); });
    $('#destination').addEventListener('change', event => selectDestination(event.target.value));
    $('#walk-button').addEventListener('click', () => { state.step = state.step >= state.steps.length ? 0 : state.step + 1; renderWalkthrough(); });
    $('#reset-walk').addEventListener('click', () => { state.step = -1; renderWalkthrough(); $('#walk-button').focus(); });
    window.addEventListener('hashchange', () => showPage());
```

### 12. Starting the app

The final statements insert the icons, create both maps, build the facility cards and populate the selectors. They connect the search forms, calculate the initial Main Entrance → Library route, and display the page requested by the URL. These statements run once after the browser reads the page. Subsequent interactions call the smaller functions above to update only the relevant parts of the interface.

```html
    // CHUNK 12: Initial render. Run once after the HTML has been parsed.
    $$('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
    $('#home-map').innerHTML = mapMarkup('home');
    $('#explore-map').innerHTML = mapMarkup('explore');
    renderCards();
    $('#start-location').innerHTML = locations.map(place => `<option value="${place.id}">${escapeHTML(place.name)}</option>`).join('');
    $('#destination').innerHTML = places.map(place => `<option value="${place.id}">${escapeHTML(place.name)}</option>`).join('');
    $$('[data-map-search]').forEach(form => form.addEventListener('submit', event => { event.preventDefault(); submitSearch(form.querySelector('input').value); }));
    $('#explore-map-query').addEventListener('input', event => setQuery(event.target.value));
    $$('[data-zoom="out"]').forEach(button => { button.disabled = true; });
    updateRoute();
    showPage(false);
  </script>
</body>
</html>
```

## Where to customise it

| What you want to change | Where to edit |
| --- | --- |
| Colours, corners, spacing and typography | `:root` and CSS rules, chunks 2–3 |
| App name, headings, support details and page wording | HTML, chunk 4 |
| Facility names, descriptions and search terms | `places`, chunk 5 |
| Building positions and available walking connections | `nodes`, `connections` and `edges`, chunk 5 |
| Map drawing and campus shapes | `mapMarkup`, chunk 7 |
| Search matching rules | `searchPlaces`, chunk 8 |
| Route choice, estimated speed and instruction wording | `shortestPath`, `routeInstructions` and `updateRoute`, chunk 9 |
| Buttons, navigation and walkthrough behaviour | Chunks 10–11 |

For a campus-specific version, supply the real campus name, a map with entrances and walkways, official facility and room names, and verified contact details. Add verified stair, ramp and access restrictions before offering step-free or accessible routes. Indoor room navigation and live GPS would be separate additions to this sample.

## Verification

JavaScript syntax, keyword search, empty/no-result searches, escaped text, map generation, instruction grouping, same-start/destination handling and disconnected-route handling passed local checks. All 72 combinations of nine start locations and eight destinations were checked against an independent shortest-distance calculation.

Browser rendering and end-to-end interaction were not verified: this environment blocked browser startup/local-file preview. The sample includes the responsive CSS, but desktop and phone rendering still need a visual check in your browser.
