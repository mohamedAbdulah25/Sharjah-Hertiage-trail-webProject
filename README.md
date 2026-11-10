# Sharjah Heritage Trail

A gamified tourist guide to Sharjah's landmarks, built for the Web Programming course (1501341) at the University of Sharjah, Fall 2026–2027.

Visitors explore landmarks, prove each visit by passing an on-site verification quiz, earn XP and passport stamps, unlock achievements and plan their trip. An admin can log in to add, edit or delete landmarks and their quizzes.

## Project stages

| Stage | Status |
|---|---|
| Content creation (HTML) | ✅ Done |
| Presentation (CSS) | ✅ Done |
| Interaction (JavaScript) | ⏳ Next |
| Final submission | ⏳ |

The site currently contains static sample content. The JavaScript stage will render it from `data/landmarks.json` and saved progress.

## Pages

| Page | File | Purpose |
|---|---|---|
| Home | `index.html` | Hero, how it works, explorer progress, featured landmarks, promo video |
| Landmarks | `landmarks.html` | All landmarks with category filter and search |
| Landmark detail | `landmark.html?id=<id>` | Gallery, info, audio guide, verification quiz, passport stamp |
| Map | `map.html` | Illustrated map with clickable pins (CSS `:target` popups) |
| Achievements | `achievements.html` | Profile, level ladder, heritage passport, badges |
| Plan Your Visit | `plan.html` | Landmark picker, trip details, contact details, trip summary, saved plans |
| Contact | `contact.html` | Contact form, FAQ, embedded map |
| Admin | `admin.html` | Login and landmark management (linked from the footer) |

## Folder structure

```
index.html  landmarks.html  landmark.html  map.html
achievements.html  plan.html  contact.html  admin.html
css/style.css      shared styles
css/print.css      print layout for the trip plan
img/               placeholder SVG images
media/             audio and video (to be supplied)
js/                JavaScript (next stage)
data/              landmarks.json (next stage)
```

## Admin login

- Username: `admin`
- Password: `admin`

This login runs entirely in the browser and is for demonstration only. It is not real security.

## Media to supply

The images in `img/` are placeholders. To use real photos, replace each file with an image of the same name (or update the paths).

| File | Content |
|---|---|
| `img/hero.svg` | Home page hero background |
| `img/<id>-1.svg`, `-2.svg`, `-3.svg` | Three photos per landmark |
| `img/map.svg` | Illustrated map of Sharjah |
| `img/avatar.svg` | Default explorer avatar |
| `media/promo.mp4` | Promotional video on the home page |
| `media/narration-<id>.mp3` | Audio narration for each landmark |

Landmark ids: `heritage-museum`, `al-noor`, `islamic-civilization`, `art-museum`, `al-hisn`, `al-majaz`.

## Running locally

Open the folder in VS Code and use the **Live Server** extension, or run:

```
python -m http.server
```

then visit `http://localhost:8000`. From the JavaScript stage onward, a local server is required because `fetch()` can't load `data/landmarks.json` from a file opened directly.

## Deploying on GitHub Pages

1. Go to the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Save. The site will be live at `https://<username>.github.io/<repository>/` within a minute or two.

## Publishing admin-added landmarks

Landmarks added through the admin page are saved only in that browser. To publish them for every visitor:

1. Click **Export JSON** on the admin page.
2. Replace `data/landmarks.json` with the exported file.
3. Commit and push.

## Notes

- Landmark opening hours and prices are sample data. Check official sources before relying on them.
- Quiz questions marked `[REPLACE WITH ON-SITE DETAIL]` should be replaced with questions about details only visible in person.
