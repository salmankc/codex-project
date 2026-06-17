# Kerala Temple Runner

A mobile-first Kerala temple festival inspired endless runner game. The code runs in a browser during development and can be packaged as an Android APK using Capacitor.

## Features

- Three-lane endless runner gameplay
- Swipe and keyboard controls
- Jump, slide, lane switching, obstacles, coins, score, pause, restart
- Kerala-inspired temple backdrop, festival flags, lamps, drums, coconut trees, and warm visual theme
- Responsive full-screen canvas for mobile and desktop
- Capacitor-ready Android APK setup

## Setup

Install Node.js LTS first. Then run:

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal and test the game.

## Build Web Version

```bash
npm run build
```

The production web build will be created in `dist`.

## Create Android APK

Install Android Studio first, including Android SDK and a recent Android build tool.

Then run:

```bash
npm install
npm run build
npm run android:add
npm run android:sync
npm run android:open
```

Android Studio will open the generated Android project. From Android Studio:

1. Select `Build`.
2. Select `Build Bundle(s) / APK(s)`.
3. Select `Build APK(s)`.
4. After the build finishes, click `locate` to find the APK.

For a release APK, create a signing key in Android Studio and use `Generate Signed Bundle / APK`.

## Business Improvements

Useful next upgrades for a production launch:

- Add SELTROK branding screen and product placement boards inside the track.
- Add leaderboard and player score storage using Firebase or Supabase.
- Add rewarded ads for revive/continue.
- Add festival season skins for Onam, Vishu, and temple utsavam campaigns.
- Add analytics events for install source, session time, deaths, and retention.
