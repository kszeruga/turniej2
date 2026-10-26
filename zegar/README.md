# Zegar Turniejowy

Static web app hosted on GitHub Pages; Firebase Authentication and Realtime Database provide accounts and shared state.

## Firebase setup
1. In project `zegar-turniejowy`, enable **Authentication → Sign-in method → Email/Password**.
2. Create the Realtime Database in `europe-west1`.
3. Review and publish `database.rules.json` in the Realtime Database Rules editor (or deploy with Firebase CLI from this directory).
4. Register the web app; the configuration is in `firebase-config.js`.

## First administrator (required)
The app deliberately does not allow a newly registered user to grant themselves a role. After creating your own account through the app, copy its Firebase Authentication UID from **Authentication → Users**. In Realtime Database, create:
```json
{
  "users": {
    "YOUR_AUTH_UID": {
      "role": "admin",
      "status": "approved"
    }
  }
}
```
Use your actual UID and merge this entry into the database. Do not publish this UID in the repository. This one-time bootstrap is performed by the project owner in the Firebase Console.

## Publish
GitHub Pages should publish from the repository root. This app is in `/zegar/`; the URL will be `https://kszeruga.github.io/turniej2/zegar/` when the branch is published. For the development branch, configure Pages to publish from branch `zegar-turniejowy` (or merge the branch after reviewing it).

Timer links are intended to look like `/turniej2/zegar/timer_abc123/`. GitHub Pages serves unknown paths through `404.html`; that file loads this app while preserving the requested path.
