# void-occult

A personal static knowledge base for **I-Ching / Liu Yao (六爻)** and **Purple Star / Tử Vi Đẩu Số (紫微斗數)**. No build step required.

## Contents

| File | Description |
|------|-------|
| `index.html` | Category hub for I-Ching and Purple Star |
| `pages/i-ching/luc-hao-co-ban.html` | Level 1 - Five Phases, Six Relations, Shi-Ying, Useful God, strength/weakness, and a worked hexagram example |
| `pages/i-ching/luc-hao-nang-cao.html` | Level 2 - moving lines, transformed hexagrams, six transformation patterns, Void, Hidden/Flying Spirits, Day/Month influence, combinations and clashes |
| `pages/purple-star/tu-vi-nam-phai.html` | Purple Star base chart builder - solar input, browser lunar conversion, Nam Phái palace placement, major stars, expanded auxiliary stars, Vòng Tràng Sinh, Tuần/Triệt, natal Tứ Hóa, Phi Hóa cung can, and annual stars |
| `pages/purple-star/tu-vi-nam-phai.css` | Purple Star chart UI styles |
| `pages/purple-star/tu-vi-engine.js` | Static browser engine for lunar conversion, star placement, Tứ Hóa, Phi Hóa, and annual layers |

## View Locally

Open `index.html` directly in a browser, or run:

```bash
python3 -m http.server 8080
# http://localhost:8080
```

## Deploy (Netlify)

This is a pure static site. Connect the repo to Netlify with:

- **Build command:** *(leave blank)*
- **Publish directory:** `.`

Every `git push` triggers a Netlify auto-deploy.

## Add a New Article

1. Create a new `.html` file in the right category folder: `pages/i-ching/` or `pages/purple-star/`.
2. Add an `<a class="card">` entry for it in `index.html`.
3. Commit and push:

```bash
git add .
git commit -m "add: <article-name>"
git push
```

## Notes

- This is a personal cheat-sheet and tool archive. It favors compact rules, memory aids, applied examples, and deploy-safe static pages over full textbook coverage.
- Chinese and Sino-Vietnamese terms are kept where useful for cross-checking with other Liu Yao sources: Five Phases, Six Relations, Shi-Ying, Useful God, Day/Month influence, Void, Hidden/Flying Spirits, combinations, and clashes.
- Read the pages by level: start with `pages/i-ching/luc-hao-co-ban.html` to understand how to assign Six Relations, choose the Useful God, and judge strength/weakness; then move to `pages/i-ching/luc-hao-nang-cao.html` for moving lines, transformations, void, hidden spirits, and combinations/clashes.
- I-Ching articles are standalone HTML pages. The Tử Vi page keeps its CSS and engine JS beside the page in `pages/purple-star/`, so the chart can scale while still deploying directly to Netlify without a build pipeline.
- When adding new material, keep the same structure: short concept explanation, quick reference table, memory tip, and applied example. If the article starts a new level, link it from `index.html` so it stays discoverable.
- This repo is not an automated casting or hexagram-calculation tool. For real readings, record the question, casting time, Day Spirit, Month Command, primary hexagram, moving lines, and transformed hexagram separately so the reading can be reviewed later.
- The Tử Vi page expects solar birth data, converts to lunar data in the browser, and keeps chart logic in `pages/purple-star/tu-vi-engine.js` so the page can scale without turning into one monolithic HTML file.

---
🤖 st_mich43l
