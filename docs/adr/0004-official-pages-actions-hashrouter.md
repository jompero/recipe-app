# Deploy with GitHub's official Pages actions; route with HashRouter

Deploys use `actions/upload-pages-artifact` and `actions/deploy-pages`, with the Pages source set to "GitHub Actions". There's no `gh-pages` branch and no third-party deploy action, and the workflow only needs `pages: write` and `id-token: write`, not `contents: write`. GitHub Pages can't serve single-page-app deep links (a refresh returns 404), so the app uses React Router's `HashRouter` (`/#/recipes/123`) instead of the 404.html redirect trick. Vite's `base` must match the repo name.
