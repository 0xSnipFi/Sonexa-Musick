<div align="center">

<img src="https://img.shields.io/badge/🎵_Sonexa-Music_Player-6e56ff?style=for-the-badge&labelColor=0a0a0a" alt="Sonexa" />

<br/>

# 🎵 Sonexa

**Free, open-source music player for Android**

Stream millions of songs from JioSaavn, YouTube, Archive.org & Jamendo — with a stunning glassmorphism UI, live lyrics, 10-band EQ, and offline downloads.

<br/>

[![Android](https://img.shields.io/badge/Android-8.0+-3DDC84?style=flat-square&logo=android&logoColor=white)](https://github.com/0xSnipFi/Sonexa-Musick/releases/latest)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org)
[![Capacitor](https://img.shields.io/badge/Capacitor-6-119EFF?style=flat-square&logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)
[![Release](https://img.shields.io/github/v/release/0xSnipFi/Sonexa-Musick?style=flat-square&color=6e56ff&label=latest)](https://github.com/0xSnipFi/Sonexa-Musick/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/0xSnipFi/Sonexa-Musick/total?style=flat-square&color=c15cff&label=downloads)](https://github.com/0xSnipFi/Sonexa-Musick/releases)

<br/>

### 📥 [Download APK](https://github.com/0xSnipFi/Sonexa-Musick/releases/latest)

</div>

---

## ✨ Features

| | Feature | Details |
|---|---------|---------|
| 🎶 | **Multi-Source Streaming** | JioSaavn (primary), YouTube via Piped, Archive.org, Jamendo |
| 🎛️ | **10-Band Equalizer** | Bass boost, mono toggle, custom presets |
| 📝 | **Live Synced Lyrics** | Real-time scrolling lyrics with tap-to-seek |
| 🔔 | **Lock Screen Controls** | Native MediaSession with notification panel controls |
| 📴 | **Offline Downloads** | Download songs for listening without internet |
| 🔀 | **Queue Management** | Shuffle, repeat (off/all/one), queue reorder |
| ⏱️ | **Sleep Timer** | Auto-pause after set duration |
| 🔄 | **Crossfade** | Smooth transitions between tracks |
| 📊 | **Play History** | Track your listening history |
| 🎨 | **Glassmorphism UI** | Customizable accent colors, blur, radius |
| 🌙 | **Themes** | Light / Dark / AMOLED black |
| 📋 | **Playlists** | Create and manage custom playlists |
| 🚀 | **Onboarding** | Guided first-launch setup with permissions |

## 🎵 Music Sources

| Source | Content | Quality |
|--------|---------|---------|
| 🇮🇳 **JioSaavn** | Bollywood, Indie, Pop, Regional | Up to 320kbps |
| ▶️ **YouTube (Piped)** | Everything on YouTube | ~256k AAC / 160k Opus |
| 📚 **Archive.org** | Public domain, CC, FLAC collections | Lossless where available |
| 🎸 **Jamendo** | Creative Commons catalog | MP3 / Ogg |

## 📥 Install

### Download APK (recommended)

1. Go to [**Releases**](https://github.com/0xSnipFi/Sonexa-Musick/releases/latest)
2. Download `Sonexa-v2.0.apk`
3. Install on your Android device
4. Allow "Install from unknown sources" if prompted

### Build from source

```bash
# Clone
git clone https://github.com/0xSnipFi/Sonexa-Musick.git
cd Sonexa-Musick

# Install & run (web dev)
npm install
npm run dev        # http://localhost:5173

# Build Android APK
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| 🖼️ UI | React 18 + Vite |
| 🎨 Styling | CSS custom properties, glassmorphism design system |
| 📱 Native Shell | Capacitor 6 |
| 🔊 Audio | HTML5 Audio + Web Audio API (EQ chain) |
| 🔔 Notifications | Native Java MediaSessionCompat + foreground service |
| 📝 Lyrics | lrclib.net API |

## 📁 Project Structure

```
src/
├── 🏠 App.jsx                  App shell, navigation, state
├── 🎨 app.css                  Design system tokens
├── 🔊 audio/
│   ├── player.js               Playback engine (HTML5 + HLS)
│   ├── usePlayer.js            React hook for player state
│   ├── mediaSession.js         Native notification bridge
│   ├── feed.js                 Discover feed
│   ├── lyrics.js               Synced lyrics fetcher
│   └── sources/
│       ├── saavn.js            🇮🇳 JioSaavn
│       ├── piped.js            ▶️ YouTube via Piped
│       ├── archive.js          📚 Internet Archive
│       └── jamendo.js          🎸 Jamendo
├── 📱 screens/
│   ├── onboarding.jsx          First-launch flow
│   ├── main.jsx                Home + Library
│   ├── search.jsx              Search
│   ├── player.jsx              Now Playing, Lyrics, EQ
│   └── settings.jsx            Settings + Appearance
└── 🧩 ui/
    ├── AlbumArt.jsx            Cover art + fallback
    ├── Logo.jsx                Brand mark
    └── data.jsx                Icon set

android/app/src/main/java/app/sonexa/music/
├── MainActivity.java           Capacitor activity
├── MusicService.java           Foreground service + MediaSession
└── MediaNotificationPlugin.java   JS ↔ native bridge
```

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit changes (`git commit -m "feat: add my feature"`)
4. Push to branch (`git push origin feat/my-feature`)
5. Open a Pull Request

## 📜 License

[MIT](LICENSE) &copy; 2025 0xSnipFi

## ⚠️ Disclaimer

Sonexa does not host any music. It fetches content from third-party APIs (JioSaavn, Piped, Archive.org, Jamendo). Users are responsible for ensuring their use complies with local laws and the terms of service of each source.

---

<div align="center">
<sub>🎵 Built with React + Capacitor. No ads, no tracking, no subscriptions.</sub>
</div>
