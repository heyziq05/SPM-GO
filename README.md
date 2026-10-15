# SPM GO! by heyziq05

A live, installable (PWA) countdown to every SPM paper.

Made by **heyziq05** · [github.com/heyziq05](https://github.com/heyziq05)

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

## Tech stack

| Layer | Tech | Used for |
|---|---|---|
| Markup | HTML5 | Page structure, accessible tabs, meta tags |
| Styling | CSS3 (vanilla) | Layout (Grid/Flexbox), responsive mobile-first design, 3D flip-calendar (`perspective`, `rotateX`), animations, custom properties for theming |
| Logic | JavaScript (vanilla, ES2020+) | Live countdowns, flip-calendar animation, auto-switching to the next exam, module tabs, `.ics` calendar export |
| Data | `js/data.js` (plain JS config) | Exam schedule, year, times, modules — the only file to edit |
| Dates & time | `Intl.DateTimeFormat` API | Formatting dates/times in Malaysia time (Asia/Kuala_Lumpur) |
| PWA | Web App Manifest + Service Worker | Installable to home screen, works offline |
| Storage | `localStorage` | Remembers the last selected module |
| Fonts | Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono (self-hosted `.woff2`) | Headings, body text, numbers — work offline |
| Graphics | Inline SVG | Icons, background study pattern, app icon source |
| Hosting | Any static host (e.g. GitHub Pages) | Serves the site over HTTPS (required for install) |

No frameworks, no dependencies, no build step.

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
