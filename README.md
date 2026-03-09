# 🎵 Ripple

**Music Therapy System using the DexUMI Exoskeleton**

Ripple transforms finger movements into real-time music, designed for therapeutic applications. Simply wear the exoskeleton, move your fingers, and create beautiful sounds — no installation, no Python, no setup required.

🌐 **[Try it live → ripplemusic.org](https://ripplemusic.org)**

---

## ✨ Features

- **Zero Installation** — Runs entirely in your browser (Chrome/Edge). No Python, no backend, no dependencies.
- **5 Presets** — Therapy, Piano, Chords, Drums, and fully customizable mappings
- **4 Instruments** — Sine, Soft, Bell, and Pad synthesizers
- **80+ Chords** — Single notes, major/minor chords, 7th chords, sharps/flats, and octave 5 notes
- **Drum Synthesis** — Full synthesized kick, snare, hihat, tom, clap, and cymbal
- **Sustained Notes** — Notes hold continuously while fingers are bent, release on lift
- **Hysteresis Thresholds** — Separate ON/OFF thresholds prevent note flickering
- **Smoothing Filter** — Moving average filter across configurable frame window
- **Real-time Visual Feedback** — Hand visualization shows active fingers with color per finger
- **Tutorial Mode** — 13 guided songs with per-song note mappings, step-by-step finger guidance, and progress tracking
- **Recording & Playback** — Record sessions and replay them
- **Adjustable Settings** — Fine-tune ON threshold, release threshold, filter size, and volume

---

## 🎹 Presets

| Preset | Instrument | Thumb | Index | Middle | Ring | Pinky |
|--------|------------|-------|-------|--------|------|-------|
| 🧘 Therapy | Pad | C maj | F maj | G maj | Am | Em |
| 🎹 Piano | Bell | C | D | E | F | G |
| 🎸 Chords | Soft | C maj | D maj | E maj | G maj | A maj |
| 🥁 Drums | — | Kick | Snare | Hihat | Tom | Clap |
| ✏️ Custom | Sine | *your choice* | *your choice* | *your choice* | *your choice* | *your choice* |

---

## 🎓 Tutorials

Each tutorial automatically applies the correct note mapping for that song. Songs are arranged by difficulty:

| Difficulty | Songs |
|------------|-------|
| Beginner | Simple Scale, Hot Cross Buns, Rain Rain Go Away |
| Easy | Mary Had a Little Lamb, Happy Birthday, London Bridge, Twinkle Twinkle |
| Medium | Are You Sleeping, Jingle Bells, Ode to Joy, Row Your Boat |
| Hard | The Entertainer, Für Elise |

During a tutorial, the screen shows which finger to press next, a progress bar, sequence dots, and the full finger-to-note legend for that song.

---

## 🚀 Quick Start

### Requirements
- **Browser**: Chrome 89+ or Edge 89+ (Web Serial API required)
- **Hardware**: DexUMI exoskeleton with encoder board

### Steps

1. **Open the app** in Chrome: [ripplemusic.org](https://ripplemusic.org)

2. **Connect the exoskeleton**
   - Power on (5V via buck converter)
   - Plug in USB cable
   - Click **Connect**
   - Select **CP2102 USB to UART Bridge Controller** from the popup

3. **Calibrate**
   - Keep your hand completely still
   - Click **Calibrate**
   - Wait ~1 second for baseline to be captured

4. **Play!**
   - Bend your fingers to trigger notes
   - Switch presets to try different sounds
   - Use **Custom** preset to create your own mappings
   - Try **Tutorial** mode to learn songs step by step

---

## ⚙️ Settings

Open the **Settings** tab to access:

| Setting | Description |
|---------|-------------|
| **ON Threshold** (5–60%) | How much bend is needed to trigger a note |
| **Release Threshold** (2–40%) | How much to unbend before the note stops |
| **Smoothing** (1–15 frames) | Moving average window to reduce sensor noise |
| **Volume** (5–100%) | Master output volume |
| **Custom Instrument** | Synthesizer type used for the Custom preset |

---

## 🛠️ Technical Details

### Architecture
The entire app is a single `index.html` file with no build step, no backend, and no dependencies. It uses:
- **Web Serial API** — direct browser-to-hardware serial communication
- **Web Audio API** — real-time synthesized audio with sustained oscillators
- **Vanilla JS** — no frameworks

### Serial Protocol
- Baud rate: 921,600
- Packet size: 40 bytes
- Header: `0xAA 0x55`
- Data: 10 × 32-bit little-endian unsigned integers

### Finger Encoder Indices
| Finger | Index | Range |
|--------|-------|-------|
| Thumb | 1 | 139,000 |
| Index | 5 | 140,000 |
| Middle | 4 | 139,000 |
| Ring | 3 | 184,000 |
| Pinky | 6 | 168,000 |

### Audio Engine
- Sustained oscillator nodes per finger (start on press, fade out on release)
- Instrument waveforms: sine, soft (3 harmonics), bell (2 harmonics + decay), pad (3 detuned oscillators)
- Drum synthesis: procedurally generated kick, snare, hihat, tom, clap, cymbal
- Master gain node with per-finger gain scaling

---

## 📁 Project Structure

```
ripple/
├── index.html    # Complete app (HTML + CSS + JS, single file)
├── docs/
│   └── index.html  # GitHub Pages deployment copy
├── README.md     # This file
└── CNAME         # Custom domain (ripplemusic.org)
```

To update the site: edit `index.html`, copy it to `docs/index.html`, then commit and push. GitHub Pages updates in ~30 seconds.

---

## 🐛 Troubleshooting

**"Web Serial API not supported"**
Use Chrome or Edge. Firefox and Safari don't support Web Serial.

**No device appears in the connection popup**
- Check that the exoskeleton is powered on
- Verify the USB cable is connected
- On Linux, add yourself to the `dialout` group: `sudo usermod -a -G dialout $USER` then log out and back in

**Connected but no sound**
- Click anywhere on the page first (browsers require a user interaction to start audio)
- Check the Volume slider in Settings
- Try a different instrument

**Notes trigger randomly or too easily**
- Increase the ON Threshold in Settings
- Re-calibrate while keeping your hand completely still

**Notes don't trigger when bending fingers**
- Decrease the ON Threshold in Settings
- Re-calibrate
- Check that the encoder cables are connected

---

## 🔬 About

Ripple was developed as part of research into music therapy applications using robotic exoskeletons. The system allows users to create music through small finger movements, providing both therapeutic benefits and creative expression. It has been demonstrated at senior centers and youth programs.

### Hardware
- **Exoskeleton**: DexUMI with rotary encoders
- **Power**: 5V via 24V-to-5V buck converter (XT30 connector)
- **Connection**: USB serial via CP2102 adapter at 921,600 baud

---

## 📄 License

MIT License — Feel free to use, modify, and share!

---

## 🙏 Acknowledgments

- DexUMI exoskeleton platform
- Web Serial API for browser-based hardware access
- Web Audio API for real-time sound synthesis
