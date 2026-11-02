# Build locally against the Firebase Emulator until a dedicated Go-live epic

Every feature through the grocery list is built and tested against the Firebase Emulator Suite, using a `demo-recipe-app` project ID that needs no real Firebase project and no secrets. The real Firebase project, rules deployment, GitHub Pages deploy, authorized domains and API key restriction all happen together in the Go-live epic. This costs almost no extra work, because the app code is identical either way (only the config changes) and CI can run the emulator without secrets. We accept that real-environment problems (the Vite `base` path, sign-in popups on iOS, authorized domains) will show up late, because they're well-known and cheap to fix. A go-live checklist covers them.

## Consequences

- The Pepperplate images are still downloaded during the Local foundation epic, because their links could die at any time.
- Data moves to production through the "Export everything" JSON file and the importer's restore option.
