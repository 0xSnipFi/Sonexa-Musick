# LumoraAudio — native plugin contract

The web build plays through `HTMLAudioElement` (browser owns the mixer — no
bit-perfect). On Android, `audio/player.js` instead calls a Capacitor plugin
named **`LumoraAudio`** that wraps **Media3 / ExoPlayer** in a foreground
`MediaSessionService`. This is the only layer that can deliver true gapless,
FLAC/ALAC decoding, Android 14 bit-perfect output, and USB-DAC exclusive mode.

## JS → native methods

```ts
LumoraAudio.load({ url, title, artist, artwork, lossless }): Promise<void>
LumoraAudio.play(): Promise<void>
LumoraAudio.pause(): Promise<void>
LumoraAudio.seek({ position: number /* seconds */ }): Promise<void>
LumoraAudio.stop(): Promise<void>
LumoraAudio.setEq({ bands: number[] /* 10 gains, dB */, enabled: boolean }): Promise<void>
LumoraAudio.setBitPerfect({ enabled: boolean }): Promise<void>
LumoraAudio.getOutputInfo(): Promise<{ sampleRate, encoding, device, exclusive }>
```

## native → JS events (Capacitor `notifyListeners`)

- `progress` `{ position, duration }`
- `playing` / `paused` / `ended`
- `error` `{ error }`
- `outputChanged` `{ sampleRate, encoding, device }`

## Implementation notes (Kotlin)

- **Engine**: `androidx.media3:media3-exoplayer` + `media3-session`. Reuse the
  Stash-0.9.37 playback stack as reference (it already has a Media3 service,
  queue, EQ controller and a custom renderers factory).
- **Bit-perfect (Android 14+, API 34)**: build the `AudioTrack` with
  `AudioTrack.Builder().setEncoding(...)` matching the source and request
  `AudioMixerAttributes` `MIXER_BEHAVIOR_BIT_PERFECT` on a supporting device,
  so the OS does not resample to 48 kHz. Fall back gracefully when unsupported.
- **USB DAC exclusive**: enumerate `AudioManager.getDevices()`, prefer
  `TYPE_USB_DEVICE/TYPE_USB_HEADSET`, set the preferred device on the player and
  match its native sample rate.
- **EQ/DSP**: 10-band via `android.media.audiofx.Equalizer` for a baseline;
  port Stash's custom DSP processors (crossfeed, parametric, ReplayGain) onto a
  Media3 `AudioProcessor` chain for the audiophile path.
- **Foreground service + MediaSession** for lockscreen/notification controls and
  background playback.

## Building the plugin

A local Capacitor plugin lives under `android/app/src/main/java/fm/lumora/audio/`
(or as a separate `@capacitor/plugin` module). Register it in
`MainActivity` so `window.Capacitor.Plugins.LumoraAudio` resolves at runtime.
