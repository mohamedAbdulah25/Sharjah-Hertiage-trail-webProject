# Sharjah Heritage Trail

A gamified tourist guide to Sharjah's landmarks, built for the Web Programming course (1501341) at the University of Sharjah, Fall 2026–2027.

Visitors explore landmarks, prove each visit by passing an on-site verification quiz, earn XP and passport stamps, unlock achievements and plan their trip. An admin can log in to add, edit or delete landmarks and their quizzes.

## Project stages

| Stage | Status |
|---|---|
| Content creation (HTML) | ✅ Done |
| Presentation (CSS) | ✅ Done |
| Interaction (JavaScript) | ✅ Done |
| Final submission | ⏳ |

All content is rendered by JavaScript from `data/landmarks.json`, plus any landmarks added through the admin page. Progress (XP, stamps, badges, plans) is saved in the browser with localStorage.

## Features

- **Verification quizzes:** pass all questions to verify a visit, earn XP and unlock the landmark's stamp. Wrong answers are highlighted and can be retried.
- **XP and levels:** Visitor (0) → Explorer (200) → Historian (400) → Heritage Guardian (800).
- **Badges:** First Steps, Museum Lover, Halfway There, Trip Planner, Mission Complete, Heritage Guardian.
- **Trip planner:** add, remove and drag to reorder stops; automatic times, opening-hour and closed-day warnings, cost (students 50% off) and XP totals; full validation; save, confirm, print, reopen and delete plans.
- **Explorer accounts:** sign up (name, email, password with strength meter and confirmation) and log in. Each account keeps its own XP, stamps, badges and plans; guest progress moves into a new account on sign-up.
- **Admin:** separate admin login from the Login page, add/edit/delete landmarks with quizzes, restore edited built-ins, export and import JSON.
- **Validation:** custom error messages on every form (trip planner, contact, explorer name, admin login and landmark form).

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
| Login | `login.html` | Explorer log in and sign up, plus an Admin login button that switches to the admin form |
| Admin dashboard | `admin.html` | Landmark management (admins only; others are sent to the login page) |

## Folder structure

```
index.html  landmarks.html  landmark.html  map.html
achievements.html  plan.html  contact.html  login.html  admin.html
css/style.css      shared styles
css/print.css      print layout for the trip plan
img/photos/        landmark photos
img/               map, avatar and pattern graphics
media/             audio and video (to be supplied)
js/data.js         levels, badges and settings
js/core.js         storage, progress, badges, toasts, helpers
js/<page>.js       one script per page
data/landmarks.json built-in landmark data
```

## Admin login

On the Login page, press **Admin login** in the side panel, then sign in with:

- Username: `admin`
- Password: `admin`

This login runs entirely in the browser and is for demonstration only. It is not real security: the admin credentials are visible in `js/data.js`, quiz answers are visible in `data/landmarks.json`, and explorer accounts (with hashed passwords) are stored in the browser's localStorage, so they only exist on that device.

## Media to supply

Landmark photos are in `img/photos/`, one per landmark, named by landmark id (e.g. `img/photos/al-noor.jpg`). The home page hero uses `al-noor.jpg` and the promo video poster uses `al-majaz.jpg`. To add more photos to a landmark's gallery, add their paths to its `images` array in `data/landmarks.json` (up to 3).

Still to supply:

| File | Content |
|---|---|
| `media/promo.mp4` | Promotional video on the home page |
| `media/narration-<id>.mp3` | Audio narration for each landmark |

Landmark ids: `heritage-museum`, `al-noor`, `islamic-civilization`, `art-museum`, `al-hisn`, `al-majaz`.

Note: the current Al Hisn photo shows Al Jahili Fort in Al Ain and should be replaced with a photo of Al Hisn Sharjah.

## Running locally

Open the folder in VS Code and use the **Live Server** extension, or run:

```
python -m http.server
```

then visit `http://localhost:8000`. A local server is required because `fetch()` can't load `data/landmarks.json` from a file opened directly.

## Deploying on GitHub Pages

1. Go to the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Save. The site will be live at `https://<username>.github.io/<repository>/` within a minute or two.

## Publishing admin-added landmarks

Landmarks added through the admin page are saved only in that browser. To publish them for every visitor:

1. Click **Export JSON** on the admin page.
2. Replace `data/landmarks.json` with the exported file.
3. Commit and push.

## Contact form

Messages from the contact form are sent to `u24103355@sharjah.ac.ae` through [FormSubmit](https://formsubmit.co), a free form-to-email service called from JavaScript (no server code). The first message triggers a one-time activation email to that address; click **Activate Form** in it, and later messages are delivered normally. The address is set in `js/data.js` (`CONTACT_EMAIL`).

## Notes

- Landmark opening hours and prices are sample data. Check official sources before relying on them.
- Quiz questions are based on published facts about each landmark (Wikipedia, Gulf News, Khaleej Times). For stronger proof of a visit, replace them with details only visible on site.
