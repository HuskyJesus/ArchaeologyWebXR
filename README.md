# UCF WebXR Experiences

A collection of three browser-based educational WebXR experiences built for the University of Central Florida. The repository is a plain static website: a landing page at the root routes to three fully independent projects, each in its own folder.

WebXR is a progressive enhancement throughout. Every experience is fully usable on desktop and mobile with mouse, touch, and keyboard - a VR headset adds an immersive option but is never required.

## The experiences

| Experience | Folder | What it is |
|---|---|---|
| [Redstone Bluff Archaeological Investigation](./archaeology/) | `archaeology/` | Take the role of a field archaeologist investigating a prehistoric settlement threatened by erosion and development. Survey, excavate, analyze artifacts, make ethical decisions, and write an evidence-based report. Includes a full Guided Accessible Mode and automatic save and resume. |
| [Case File: Marlowe Alley](./crime-alley/) | `crime-alley/` | Take the role of an investigating officer examining a nighttime alley crime scene. Classify evidence as relevant or not, explain your reasoning, and submit a case conclusion. Offers a 3D scene and an equivalent text-based case file mode. |
| [The Language House](./language-home/) | `language-home/` | Choose Spanish, French, German, Italian, Portuguese, Russian, or Japanese, then explore the rooms of a home and practice vocabulary by identifying furniture, appliances, and household objects in an interactive 3D experience with spoken pronunciation. |

## Folder structure

```
UCFWebXR/
  index.html          Landing page (plain HTML and CSS, no JavaScript)
  styles/landing.css  Landing page styles
  archaeology/        Redstone Bluff (modular: src/, styles/, tests/, vendor/, docs)
  crime-alley/        Case File: Marlowe Alley (single-file experience)
  language-home/      The Language House (single-file experience)
  README.md
  .gitignore
```

Each project is self-contained. No project depends on files inside another project, and each can be opened directly at its folder URL.

## Running locally

Any static file server works. From the repository root:

```sh
# Python (no install needed on macOS)
python3 -m http.server 8000

# or Node
npx serve .
```

Then open http://localhost:8000/ for the landing page, or go straight to a project:

- http://localhost:8000/archaeology/
- http://localhost:8000/crime-alley/
- http://localhost:8000/language-home/

Note: Crime Alley and the Language House load Three.js from a CDN, and the Language House loads Google Fonts, so those two need an internet connection. The archaeology project vendors its own copy of Three.js and runs fully offline.

## Deploying to GitHub Pages

The site is built to work from a subdirectory (project pages). To deploy:

1. Push to `main` on GitHub.
2. In the repository settings, enable Pages with source "Deploy from a branch", branch `main`, folder `/ (root)`.
3. The site is served at `https://<user>.github.io/UCFWebXR/`, with the projects at `.../UCFWebXR/archaeology/`, `.../UCFWebXR/crime-alley/`, and `.../UCFWebXR/language-home/`.

All internal links are relative, so no base-path configuration is needed. WebXR and speech synthesis require the secure (https) origin that GitHub Pages provides.

## Accessibility

The landing page targets WCAG 2.2 Level AA: semantic landmarks, a skip link, correct heading order, native links styled as buttons, visible keyboard focus, 4.5:1 text contrast, reduced-motion support, large touch targets, and reflow down to 320 px wide at up to 400 percent zoom. Project identity on the cards is conveyed by name and description, not color alone.

Within the experiences:

- **Archaeology** includes a complete Guided Accessible Mode that presents the entire investigation as headings, lists, and forms with full keyboard and screen-reader support, equivalent to the 3D mode. See [archaeology/ACCESSIBILITY.md](./archaeology/ACCESSIBILITY.md) for the full conformance documentation.
- **Crime Alley** includes a text-based case file mode covering the same investigation as the 3D scene, plus keyboard controls and an optional narrated briefing in both modes.
- **The Language House** supports keyboard room navigation (arrow keys or 1-4) and spoken vocabulary in the chosen language.

Each experience has a "Back to UCF WebXR Experiences" link on its start screen.

## Development notes

- The archaeology project has an in-browser test suite at `archaeology/tests/` - open it through a local server and every suite runs automatically.
- Archaeology-specific documentation lives inside the `archaeology/` folder and stays there.
- Progress in the archaeology experience saves to `localStorage` automatically; moving the site between hosts or paths on the same origin does not erase saves.
