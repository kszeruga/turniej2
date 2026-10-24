# Tournament display 

Static website with:
- a public display (`index.html`) for multiple TVs/projectors;
- a password-protected control panel (`control.html`);
- Firebase Realtime Database for live synchronization;
- Firebase Authentication (email/password) for operators;
- the supplied partner-logo graphic at the bottom of the display.

## 1. Create a Firebase project

1. Open https://console.firebase.google.com/ and create a project.
2. In **Project settings → General → Your apps**, add a Web app.
3. Copy its Firebase configuration into `firebase-config.js`.
4. In **Build → Realtime Database**, create a database. Choose a region near your users.
5. Copy the database URL into `databaseURL` in `firebase-config.js`. Use the exact URL shown in the Firebase console; database URL formats vary by region/project.

## 2. Configure operator login

1. In **Build → Authentication → Sign-in method**, enable **Email/Password**.
2. In **Authentication → Users**, add an operator account with an email and a strong password.
3. Do not add a public sign-up form. Create operator accounts manually in Firebase Console.
4. Under **Authentication → Settings → Authorized domains**, add your GitHub Pages hostname, e.g. `YOUR-USER.github.io`. If you use a custom domain, add that domain too.

## 3. Set database security rules

In **Realtime Database → Rules**, paste the contents of `database.rules.json` and publish them.

These rules let anyone read the public display state, but only signed-in Firebase users write it. This is appropriate for the intended public screen/private operator split. Anyone can still read the public state, so never store secrets or private participant data in it. If you need to restrict writes to a specific operator rather than any authenticated account, replace `auth != null` with an explicit allowlist rule based on Firebase Auth UIDs.

## 4. Run locally

Because the app uses JavaScript modules, serve it over HTTP rather than opening the files directly. From this folder, run for example:

```bash
python -m http.server 8000
```

Then open:
- Display: http://localhost:8000/
- Control: http://localhost:8000/control.html

Replace the Firebase configuration first.

## 5. Publish with GitHub Pages

1. Create a GitHub repository, e.g. `tournament-display`.
2. Upload all files and the `assets` directory, keeping the folder structure.
3. In repository **Settings → Pages**, select **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. Wait for GitHub Pages to publish. Your display URL will look like `https://YOUR-USER.github.io/tournament-display/`.
5. The control URL will be `https://YOUR-USER.github.io/tournament-display/control.html`.
6. Open the display URL on each TV/projector device. Open the control URL only on the operator's device.

## Timer behavior

The timer stores a shared end timestamp while running. All displays calculate the remaining time from that timestamp, so they stay aligned and recover after refresh/reconnect. Pausing stores the remaining duration; starting resumes it. “Ustaw czas” sets a new duration and leaves the timer paused. “Reset” restores the configured duration and pauses the timer.

## Notes

- The title is currently fixed to “Akademia Rummikub” in `index.html`.
- The footer graphic is `assets/footer-logos.png`, copied from the supplied image.
- The timer uses the Firebase server-time offset (`.info/serverTimeOffset`), so displays stay in sync even if device clocks differ.
- Firebase web config is not a password; security comes from Authentication and database rules.
- Firebase and GitHub Pages have free tiers, but usage limits and product pricing may change.
- Before a live event, test login, write permissions, refresh/reconnect, pause/resume, and all target display resolutions.
