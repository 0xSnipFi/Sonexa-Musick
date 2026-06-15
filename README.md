# Sonexa

Free, open-source music player for Android with a glassmorphism UI. Stream millions of songs from JioSaavn, YouTube (via Piped), Internet Archive and Jamendo.

## Features

- Stream from **JioSaavn** (primary), **Piped/YouTube**, **Archive.org**, **Jamendo**
- **10-band EQ** with bass boost, mono toggle
- **Live synced lyrics** with tap-to-seek
- **Lock screen & notification controls** via native MediaSession
- **Onboarding flow** with permission setup on first launch
- **Offline downloads** for listening without internet
- **Crossfade**, sleep timer, play history, playlists
- **Glassmorphism UI** with customizable accent colors, blur, radius
- Light / Dark / AMOLED themes
- Shuffle, repeat (off / all / one), queue management

## Screenshots

> Add screenshots to `docs/screenshots/` and reference them here.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + Vite |
| Styling | CSS custom properties, glassmorphism |
| Native shell | Capacitor 6 |
| Audio | HTML5 Audio + Web Audio API (EQ) |
| Notifications | Native Java MediaSessionCompat + foreground service |
| Lyrics | lrclib.net API |
| Sources | JioSaavn, Piped, Archive.org, Jamendo |

## Quick Start

### Web (development)

```bash
npm install
npm run dev        # http://localhost:5173
```

### Android APK

Requires Android SDK / Android Studio with `ANDROID_HOME` set.

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

## Project Structure

```
src/
  App.jsx                 App shell, navigation, state
  app.css                 Design system (tokens, glass, motion)
  main.jsx                Entry point
  audio/
    player.js             Playback engine (HTML5 Audio + HLS)
    usePlayer.js          React hook bridging player to UI
    mediaSession.js       MediaSession + native notification bridge
    feed.js               Discover feed (search-based)
    lyrics.js             Synced lyrics fetcher
    registry.js           Multi-source search registry
    sources/
      saavn.js            JioSaavn (primary)
      piped.js            YouTube via Piped
      archive.js          Internet Archive
      jamendo.js          Jamendo (CC catalog)
  screens/
    onboarding.jsx        First-launch onboarding slides
    main.jsx              Home + Library screens
    search.jsx            Search screen
    player.jsx            Now Playing, Lyrics, EQ
    settings.jsx          Settings + Appearance
    extra.jsx             Playlists, History, Queue, etc.
  ui/
    AlbumArt.jsx          Album art with procedural fallback
    Logo.jsx              App logo / brand mark
    data.jsx              Icon set + procedural cover art
    primitives.jsx        Slider, toggle, reusable UI
android/
  app/src/main/java/app/sonexa/music/
    MainActivity.java     Capacitor activity
    MusicService.java     Foreground service + MediaSession
    MediaNotificationPlugin.java   JS-native bridge
```

## Configuration

Sources can be enabled/disabled in Settings > Sources inside the app. JioSaavn is enabled by default with no API key needed.

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit changes (`git commit -m "feat: add my feature"`)
4. Push to branch (`git push origin feat/my-feature`)
5. Open a Pull Request

## License

MIT License. See [LICENSE](LICENSE) for details.

## Disclaimer

Sonexa does not host any music. It fetches content from third-party APIs (JioSaavn, Piped, Archive.org, Jamendo). Users are responsible for ensuring their use complies with local laws and the terms of service of each source.
