# Deploy with GitHub's official Pages actions; route with HashRouter

Deploys use `actions/upload-pages-artifact` and `actions/deploy-pages`, with the Pages source set to "GitHub Actions". There's no `gh-pages` branch and no third-party deploy action, and the workflow only needs `pages: write` and `id-token: write`, not `contents: write`. GitHub Pages can't serve single-page-app deep links (a refresh returns 404), so the app uses React Router's `HashRouter` (`/#/recipes/123`) instead of the 404.html redirect trick. Vite's `base` must match the repo name.

**Update (2026-11-04, US-3.2):** the app now mounts its routes with `createHashRouter` (React Router's data router) instead of the `<HashRouter>` component. The URLs are still hash URLs, so the decision above stands. The data router is needed for scroll restoration (US-3.3) and the "Discard changes?" prompt (`useBlocker`, US-3.5), which React Router 8 only supports in data mode.

**Update (2026-11-07, US-8.1):** Vite's `base` is now relative (`./`) and no longer the repo name. Hash routing means only `index.html` is ever served, so relative asset URLs work at `jompero.github.io/recipe-app/` and at the custom domain `recipes.danijompero.com/` alike. One build serves both addresses, so the move to the custom domain (EPIC-8) has no downtime. Dev and e2e run at `/`. Hash routing and the official Pages actions stand.
