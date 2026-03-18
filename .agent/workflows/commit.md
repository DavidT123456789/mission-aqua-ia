---
description: Commit and push changes to the main repository
---

This workflow automates the process of staging changes, creating a commit with a descriptive message, and pushing to the `main` branch of the `origin` repository.

1. Stage all changes
// turbo
`git add .`

2. Commit the changes
Please provide a descriptive commit message if prompted, or the agent will generate one based on the changes.
`git commit -m "chore: update project changes"`

3. Push to origin
// turbo
`git push origin main`
