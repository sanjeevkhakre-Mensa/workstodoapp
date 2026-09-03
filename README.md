# WorkToDo

A simple, fast personal task manager. No accounts, no teams — just your own daily tasks.
This is a **static, browser-only app**: it needs no server to run and can be hosted
straight from GitHub Pages (or opened as a plain file). Your tasks are stored in the
browser's `localStorage`, private to whichever browser/device you use it from.

## Running it

Just open `index.html` in a browser — double-click it, or serve the folder with any
static file server. Nothing to install, no build step.

## What it does

- Dashboard with Today / Upcoming / Overdue / Completed counts
- Add, edit, delete, and complete tasks (name, description, due date/time, priority)
- Search and filter by priority/status
- Completed tasks automatically move to the Completed view
- Overdue tasks are detected automatically from the due date — no manual flagging
- Light/dark mode, fully responsive down to mobile

## Data

Tasks are stored in your browser's `localStorage` under the key `worktodo_tasks_v1` —
nothing leaves your device, and nothing is shared between browsers or synced anywhere.
Clearing your browser's site data for this page deletes your tasks; there's no backup
beyond that (export/import isn't built — ask if you want it).

## Deploying to GitHub Pages

1. Push this `worktodo/` folder's contents as the root of a GitHub repository (see the
   walkthrough your assistant gave alongside this file).
2. In the repo, go to **Settings → Pages**, set **Source** to "Deploy from a branch",
   **Branch** to `main`, folder to `/ (root)`, then **Save**.
3. GitHub gives you a live URL in the form `https://USERNAME.github.io/REPOSITORY-NAME/`
   within a minute or two.

## Project structure

```
worktodo/
  index.html
  css/style.css
  js/
    utils.js             icons, formatting, toasts, theme
    state.js              task storage (localStorage) + task CRUD
    app.js                 router, page rendering, boot
    components/
      sidebar.js           sidebar + topbar
      dashboard.js          KPI counts row
      taskList.js            filtering, task rows, row actions
      taskModal.js            add/edit task form
  server/                  optional — NOT used by index.html above
    index.js                a Node/Express + JSON-file backend, kept as a reference
                              if you ever want to self-host this with server-side
                              storage instead of localStorage. Run with `npm install`
                              then `npm start` (or double-click start.bat) — but note
                              it's disconnected from the app now; wiring it back up
                              would mean reverting state.js to call it instead of
                              localStorage.
```
