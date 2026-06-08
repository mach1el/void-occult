# i-ching-kb

A personal knowledge base for **Liu Yao / Six Lines divination (六爻)** - a static HTML cheat sheet for Wen Wang Gua interpretation. No build step required.

## Contents

| File | Description |
|------|-------|
| `index.html` | Table of contents / landing page |
| `luc-hao-co-ban.html` | Level 1 - Five Phases, Six Relations, Shi-Ying, Useful God, strength/weakness, and a worked hexagram example |
| `luc-hao-nang-cao.html` | Level 2 - moving lines, transformed hexagrams, six transformation patterns, Void, Hidden/Flying Spirits, Day/Month influence, combinations and clashes |

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

1. Create a new `.html` file in the repo.
2. Add an `<a class="card">` entry for it in `index.html`.
3. Commit and push:

```bash
git add .
git commit -m "add: <article-name>"
git push
```

## Notes

- This is a personal cheat-sheet style archive. It favors compact rules, memory aids, and applied examples over full textbook coverage.
- Chinese and Sino-Vietnamese terms are kept where useful for cross-checking with other Liu Yao sources: Five Phases, Six Relations, Shi-Ying, Useful God, Day/Month influence, Void, Hidden/Flying Spirits, combinations, and clashes.
- Read the pages by level: start with `luc-hao-co-ban.html` to understand how to assign Six Relations, choose the Useful God, and judge strength/weakness; then move to `luc-hao-nang-cao.html` for moving lines, transformations, void, hidden spirits, and combinations/clashes.
- Each article is a standalone HTML page with embedded CSS, so it can be opened offline or deployed directly to Netlify without a build pipeline.
- When adding new material, keep the same structure: short concept explanation, quick reference table, memory tip, and applied example. If the article starts a new level, link it from `index.html` so it stays discoverable.
- This repo is not an automated casting or hexagram-calculation tool. For real readings, record the question, casting time, Day Spirit, Month Command, primary hexagram, moving lines, and transformed hexagram separately so the reading can be reviewed later.

---
🤖 st_mich43l
