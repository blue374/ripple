# 🎵 Ripple

**Music Therapy System using the DexUMI Exoskeleton**

Ripple transforms finger movements into music, designed for therapeutic applications. Simply wear the exoskeleton, move your fingers, and create beautiful sounds — no installation required.

🌐 **[Try it live →](https://YOUR_USERNAME.github.io/ripple)** *(update with your actual URL)*

---

## ✨ Features

- **Zero Installation** — Runs entirely in your browser (Chrome/Edge)
- **4 Presets** — Therapy, Piano, Chords, and fully customizable mappings
- **4 Instruments** — Sine, Soft, Bell, and Pad synthesizers
- **18 Chords** — Single notes, major/minor chords, and 7th chords
- **Real-time Response** — Low-latency audio feedback
- **Visual Feedback** — Hand visualization shows active fingers
- **Adjustable Sensitivity** — Fine-tune the activation threshold

---

## 🎹 Presets

| Preset | Instrument | Thumb | Index | Middle | Ring | Pinky |
|--------|------------|-------|-------|--------|------|-------|
| 🧘 Therapy | Pad | C maj | F maj | G maj | Am | Em |
| 🎹 Piano | Bell | C | D | E | F | G |
| 🎸 Chords | Soft | C maj | D maj | E maj | G maj | A maj |
| ✏️ Custom | Sine | *your choice* | *your choice* | *your choice* | *your choice* | *your choice* |

---

## 🚀 Quick Start

### Requirements
- **Browser**: Chrome 89+ or Edge 89+ (Web Serial API required)
- **Hardware**: DexUMI exoskeleton with encoder board

### Steps

1. **Open the app** in Chrome: [ripple link](https://YOUR_USERNAME.github.io/ripple)

2. **Connect the exoskeleton**
   - Power on (5V via buck converter)
   - Plug in USB cable
   - Click **Connect** button
   - Select the USB Serial device from the popup

3. **Calibrate**
   - Keep your hand completely still
   - Click **Calibrate**
   - Wait 1 second

4. **Play!**
   - Bend your fingers to trigger notes
   - Switch presets to try different sounds
   - Use **Custom** preset to create your own mappings

---

## ⚙️ Settings

Click the **⚙️ Settings** button to access:

- **Sensitivity** (5-40%) — Lower = more sensitive, triggers with smaller movements
- **Instrument** — Change the synthesizer sound for the current preset

---

## 🛠️ Technical Details

### Serial Protocol
- Baud rate: 921600
- Packet size: 40 bytes
- Header: `0xAA 0x55`
- Data: 10 × 32-bit little-endian integers

### Finger Encoder Indices
| Finger | Index | Range |
|--------|-------|-------|
| Thumb | 1 | 139,000 |
| Index | 3 | 184,000 |
| Middle | 4 | 139,000 |
| Ring | 5 | 140,000 |
| Pinky | 6 | 168,000 |

### Audio
- Web Audio API
- Sample rate: 48kHz (browser default)
- Note duration: 100ms with attack/release envelope

---

## 🌐 Custom Domain Setup

To use a custom domain like `ripple.yourdomain.com`:

1. Create a `CNAME` file in the repo root containing:
   ```
   ripple.yourdomain.com
   ```

2. Add a DNS CNAME record:
   - **Name**: `ripple`
   - **Value**: `YOUR_USERNAME.github.io`

3. Wait for DNS propagation (up to 24 hours)

4. GitHub will automatically configure HTTPS

---

## 🐛 Troubleshooting

### "Web Serial API not supported"
Use Chrome or Edge. Firefox and Safari don't support Web Serial.

### No device appears in the connection popup
- Check that the exoskeleton is powered on
- Verify USB cable is connected
- On Linux, add yourself to the `dialout` group:
  ```bash
  sudo usermod -a -G dialout $USER
  ```
  Then log out and back in.

### Connected but no sound
- Click anywhere on the page (browsers require user interaction for audio)
- Check volume slider in Settings isn't at minimum
- Try a different instrument

### Notes trigger randomly or too easily
- Increase the Sensitivity value in Settings
- Re-calibrate while keeping hand completely still

### Notes don't trigger when bending fingers
- Decrease the Sensitivity value
- Check that the finger encoders are mechanically connected
- Re-calibrate

---

## 📁 Project Structure

```
ripple/
├── index.html    # Complete app (HTML + CSS + JS)
├── README.md     # This file
└── CNAME         # Custom domain (optional)
```

The entire app is contained in a single `index.html` file for easy deployment and portability.

---

## 🔬 About

Ripple was developed as part of research into music therapy applications using robotic exoskeletons. The system allows users with limited mobility to create music through small finger movements, providing both therapeutic benefits and creative expression.

### Hardware
- **Exoskeleton**: DexUMI with rotary encoders
- **Power**: 5V via 24V-to-5V buck converter (XT30 connector)
- **Connection**: USB serial at 921600 baud

---

## 📄 License

MIT License — Feel free to use, modify, and share!

---

## 🙏 Acknowledgments

- DexUMI exoskeleton platform
- Web Serial API for browser-based hardware access
- Web Audio API for real-time sound synthesis
