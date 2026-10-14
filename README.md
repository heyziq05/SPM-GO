# SPM GO! by heyziq05

A live, installable (PWA) countdown to every SPM paper.

## Run it

It's a static site, with no build step. Any static server works:

```bash
python -m http.server 8000      # then open http://localhost:8000
```

To install it on a phone, host it on HTTPS (GitHub Pages, Netlify, Vercel). Service workers and "Add to Home Screen" need HTTPS or localhost.

- **Android / Chrome:** tap **Install app** in the top-right, or use the browser menu and choose **Install app**.
- **iPhone / iPad (Safari):** tap **Share**, then **Add to Home Screen**. The Install button shows this hint.

## Edit the schedule

Everything lives in `js/data.js`:

- `SPM_CONFIG.year`: the SPM year, used for every date.
- `defaultStart` / `defaultEnd`: the default paper times (MYT). The countdown runs to the start time. A paper counts as finished at its end time.
- `SPM_EXAMS`: one entry per paper. `date: 'MM-DD'`, `subject`, `paper`, `modules: [...]`. You can override the times for a single paper with `start: 'HH:MM'` / `end: 'HH:MM'`.
- `githubUrl` / `githubHandle`: the footer link.

After you change any file, bump `VERSION` in `sw.js` so installed apps pick up the change.

## Preview a date

Add `?now=` to the URL to simulate any moment (Malaysia time):

- `?now=2026-11-23T10:00`: a paper in progress, with the next one queued
- `?now=2026-12-18`: everything finished, showing the congratulations screen

## Structure

```
index.html            markup
css/styles.css        styles (self-hosted fonts, so it works offline)
js/data.js            schedule + settings  <- edit this
js/app.js             countdown, flip calendar, modules, cards, .ics export, install
sw.js                 offline cache
manifest.webmanifest  PWA manifest
icons/                app icons (icon.svg is the source)
fonts/, assets/       fonts + background pattern
```
