import asyncio
import json
import serial
import struct
import numpy as np
import sounddevice as sd
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import threading
import time

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SAMPLE_RATE = 44100

CHORDS = {
    'C': [262], 'D': [294], 'E': [330], 'F': [349], 'G': [392], 'A': [440], 'B': [494],
    'C_maj': [262, 330, 392], 'D_maj': [294, 370, 440], 'E_maj': [330, 415, 494],
    'F_maj': [349, 440, 523], 'G_maj': [392, 494, 587], 'A_maj': [440, 554, 659],
    'Am': [440, 523, 659], 'Dm': [294, 349, 440], 'Em': [330, 392, 494],
    'C7': [262, 330, 392, 466], 'G7': [392, 494, 587, 698],
}

INSTRUMENTS = {
    'sine': lambda t, f: np.sin(2 * np.pi * f * t),
    'soft': lambda t, f: 0.6*np.sin(2*np.pi*f*t) + 0.3*np.sin(4*np.pi*f*t) + 0.1*np.sin(6*np.pi*f*t),
    'bell': lambda t, f: np.sin(2*np.pi*f*t)*np.exp(-3*t) + 0.5*np.sin(4*np.pi*f*t)*np.exp(-4*t),
    'pad': lambda t, f: 0.4*np.sin(2*np.pi*f*t) + 0.3*np.sin(2*np.pi*(f*1.002)*t) + 0.3*np.sin(2*np.pi*(f*0.998)*t),
}

PRESETS = {
    'therapy': {'name': '🧘 Therapy', 'instrument': 'pad', 'mapping': {'thumb': 'C_maj', 'index': 'F_maj', 'middle': 'G_maj', 'ring': 'Am', 'pinky': 'Em'}},
    'piano': {'name': '🎹 Piano', 'instrument': 'bell', 'mapping': {'thumb': 'C', 'index': 'D', 'middle': 'E', 'ring': 'F', 'pinky': 'G'}},
    'chords': {'name': '🎸 Chords', 'instrument': 'soft', 'mapping': {'thumb': 'C_maj', 'index': 'D_maj', 'middle': 'E_maj', 'ring': 'G_maj', 'pinky': 'A_maj'}},
    'custom': {'name': '✏️ Custom', 'instrument': 'sine', 'mapping': {'thumb': 'C', 'index': 'D', 'middle': 'E', 'ring': 'F', 'pinky': 'G'}},
}

TUTORIALS = {
    'scale': {
        'name': 'Simple Scale',
        'difficulty': 'Beginner',
        'sequence': ['thumb', 'index', 'middle', 'ring', 'pinky', 'pinky', 'ring', 'middle', 'index', 'thumb'],
    },
    'mary': {
        'name': 'Mary Had a Little Lamb',
        'difficulty': 'Easy',
        'sequence': ['middle', 'index', 'thumb', 'index', 'middle', 'middle', 'middle', 
                     'index', 'index', 'index', 'middle', 'pinky', 'pinky',
                     'middle', 'index', 'thumb', 'index', 'middle', 'middle', 'middle', 
                     'middle', 'index', 'index', 'middle', 'index', 'thumb'],
    },
    'twinkle': {
        'name': 'Twinkle Twinkle Little Star',
        'difficulty': 'Easy',
        'sequence': ['thumb', 'thumb', 'pinky', 'pinky', 'pinky', 'pinky', 'pinky',
                     'ring', 'ring', 'middle', 'middle', 'index', 'index', 'thumb',
                     'pinky', 'pinky', 'ring', 'ring', 'middle', 'middle', 'index',
                     'pinky', 'pinky', 'ring', 'ring', 'middle', 'middle', 'index',
                     'thumb', 'thumb', 'pinky', 'pinky', 'pinky', 'pinky', 'pinky',
                     'ring', 'ring', 'middle', 'middle', 'index', 'index', 'thumb'],
    },
    'jingle': {
        'name': 'Jingle Bells (Chorus)',
        'difficulty': 'Medium',
        'sequence': ['middle', 'middle', 'middle', 'middle', 'middle', 'middle',
                     'middle', 'pinky', 'thumb', 'index', 'middle',
                     'ring', 'ring', 'ring', 'ring', 'ring', 'middle', 'middle', 'middle', 'middle',
                     'index', 'index', 'middle', 'index', 'pinky'],
    },
    'ode': {
        'name': 'Ode to Joy',
        'difficulty': 'Medium',
        'sequence': ['middle', 'middle', 'ring', 'pinky', 'pinky', 'ring', 'middle', 'index',
                     'thumb', 'thumb', 'index', 'middle', 'middle', 'index', 'index',
                     'middle', 'middle', 'ring', 'pinky', 'pinky', 'ring', 'middle', 'index',
                     'thumb', 'thumb', 'index', 'middle', 'index', 'thumb', 'thumb'],
    },
}

FINGERS = {
    'thumb': {'idx': 1, 'range': 139000},
    'index': {'idx': 3, 'range': 184000},
    'middle': {'idx': 4, 'range': 139000},
    'ring': {'idx': 5, 'range': 140000},
    'pinky': {'idx': 6, 'range': 168000},
}

state = {
    "connected": False,
    "calibrated": False,
    "active_fingers": [],
    "current_preset": "piano",
    "threshold": 0.15,
    "mode": "play",
    "tutorial": {"current": None, "step": 0, "completed": False},
}

rest = {}
ser = None
stream = None
active = set()
clients = []
running = False
last_active = set()

def envelope(t, attack=0.005, release=0.02):
    env = np.ones_like(t)
    att = int(attack * SAMPLE_RATE)
    rel = int(release * SAMPLE_RATE)
    if att > 0: env[:att] = np.linspace(0, 1, att)
    if rel > 0: env[-rel:] = np.linspace(1, 0, rel)
    return env

def play_sound(fingers):
    if not fingers or not stream:
        return
    preset = PRESETS[state["current_preset"]]
    all_freqs = []
    for f in fingers:
        chord = preset["mapping"].get(f)
        if chord and chord in CHORDS:
            all_freqs.extend(CHORDS[chord])
    if not all_freqs:
        return
    duration = 0.1
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    synth = INSTRUMENTS.get(preset["instrument"], INSTRUMENTS["sine"])
    wave = sum(synth(t, f) for f in all_freqs) / len(all_freqs)
    wave = wave * envelope(t) * 0.3
    stream.write(wave.astype(np.float32))

def broadcast_sync(msg):
    for client in clients[:]:
        try:
            asyncio.run(client.send_json(msg))
        except:
            pass

def check_tutorial_progress(new_fingers):
    global last_active
    if state["mode"] != "tutorial" or not state["tutorial"]["current"]:
        return
    tutorial = TUTORIALS.get(state["tutorial"]["current"])
    if not tutorial:
        return
    step = state["tutorial"]["step"]
    sequence = tutorial["sequence"]
    if step >= len(sequence):
        return
    expected = sequence[step]
    newly_pressed = new_fingers - last_active
    if expected in newly_pressed:
        state["tutorial"]["step"] += 1
        if state["tutorial"]["step"] >= len(sequence):
            state["tutorial"]["completed"] = True
            broadcast_sync({"type": "tutorial_complete", "tutorial": state["tutorial"]["current"]})
        else:
            broadcast_sync({
                "type": "tutorial_progress",
                "step": state["tutorial"]["step"],
                "next_finger": sequence[state["tutorial"]["step"]],
                "total": len(sequence)
            })

def read_loop():
    global active, running, last_active
    running = True
    while running and state["connected"]:
        try:
            data = ser.read(64)
            if len(data) >= 40:
                try:
                    idx = data.index(b'\xaa\x55')
                    if idx + 40 <= len(data):
                        v = struct.unpack('<IIIIIIIIII', data[idx:idx+40])
                        new_active = set()
                        for name, cfg in FINGERS.items():
                            if name in rest:
                                drop = (rest[name] - v[cfg['idx']]) / cfg['range']
                                if drop > state["threshold"]:
                                    new_active.add(name)
                        if new_active != active:
                            if state["mode"] == "tutorial":
                                check_tutorial_progress(new_active)
                            last_active = active.copy()
                            active = new_active.copy()
                            state["active_fingers"] = list(active)
                            if active:
                                play_sound(active)
                            broadcast_sync({"type": "fingers", "active": list(active)})
                except ValueError:
                    pass
        except:
            pass
        time.sleep(0.005)

def disconnect():
    global ser, stream, running, active, last_active
    running = False
    time.sleep(0.1)
    if stream:
        try:
            stream.stop()
            stream.close()
        except:
            pass
        stream = None
    if ser:
        try:
            ser.close()
        except:
            pass
        ser = None
    active = set()
    last_active = set()
    state["connected"] = False
    state["calibrated"] = False
    state["active_fingers"] = []
    rest.clear()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global ser, stream, running
    await websocket.accept()
    clients.append(websocket)
    
    await websocket.send_json({
        "type": "init",
        "presets": {k: {"name": v["name"], "mapping": v["mapping"], "instrument": v["instrument"]} for k, v in PRESETS.items()},
        "chords": list(CHORDS.keys()),
        "instruments": list(INSTRUMENTS.keys()),
        "tutorials": {k: {"name": v["name"], "difficulty": v["difficulty"], "length": len(v["sequence"])} for k, v in TUTORIALS.items()},
        "state": state,
    })
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "connect":
                try:
                    ser = serial.Serial('/dev/ttyUSB0', 921600, timeout=0.02)
                    stream = sd.OutputStream(samplerate=SAMPLE_RATE, channels=1, blocksize=256, latency='low')
                    stream.start()
                    state["connected"] = True
                    threading.Thread(target=read_loop, daemon=True).start()
                    await websocket.send_json({"type": "status", "connected": True})
                except Exception as e:
                    await websocket.send_json({"type": "error", "message": str(e)})
            
            elif data["type"] == "disconnect":
                disconnect()
                await websocket.send_json({"type": "status", "connected": False, "calibrated": False})
            
            elif data["type"] == "calibrate":
                baseline = {name: [] for name in FINGERS}
                for _ in range(30):
                    raw = ser.read(64)
                    if len(raw) >= 40:
                        try:
                            idx = raw.index(b'\xaa\x55')
                            if idx + 40 <= len(raw):
                                v = struct.unpack('<IIIIIIIIII', raw[idx:idx+40])
                                for name, cfg in FINGERS.items():
                                    baseline[name].append(v[cfg['idx']])
                        except ValueError:
                            pass
                    await asyncio.sleep(0.02)
                for name in FINGERS:
                    if baseline[name]:
                        rest[name] = int(np.mean(baseline[name]))
                state["calibrated"] = True
                await websocket.send_json({"type": "calibrated", "baselines": rest})
            
            elif data["type"] == "set_preset":
                state["current_preset"] = data["preset"]
                await websocket.send_json({"type": "preset_changed", "preset": data["preset"]})
            
            elif data["type"] == "set_mapping":
                PRESETS["custom"]["mapping"][data["finger"]] = data["chord"]
                state["current_preset"] = "custom"
                await websocket.send_json({"type": "mapping_updated", "finger": data["finger"], "chord": data["chord"]})
            
            elif data["type"] == "set_threshold":
                state["threshold"] = data["value"]
                await websocket.send_json({"type": "threshold_changed"})
            
            elif data["type"] == "set_mode":
                state["mode"] = data["mode"]
                if data["mode"] == "play":
                    state["tutorial"] = {"current": None, "step": 0, "completed": False}
                await websocket.send_json({"type": "mode_changed", "mode": data["mode"]})
            
            elif data["type"] == "start_tutorial":
                tutorial_id = data["tutorial"]
                if tutorial_id in TUTORIALS:
                    state["mode"] = "tutorial"
                    state["current_preset"] = "piano"
                    state["tutorial"] = {"current": tutorial_id, "step": 0, "completed": False}
                    tutorial = TUTORIALS[tutorial_id]
                    await websocket.send_json({
                        "type": "tutorial_started",
                        "tutorial": tutorial_id,
                        "name": tutorial["name"],
                        "sequence": tutorial["sequence"],
                        "total": len(tutorial["sequence"]),
                        "next_finger": tutorial["sequence"][0]
                    })
            
            elif data["type"] == "reset_tutorial":
                if state["tutorial"]["current"]:
                    state["tutorial"]["step"] = 0
                    state["tutorial"]["completed"] = False
                    tutorial = TUTORIALS[state["tutorial"]["current"]]
                    await websocket.send_json({
                        "type": "tutorial_reset",
                        "next_finger": tutorial["sequence"][0],
                        "total": len(tutorial["sequence"])
                    })
            
            elif data["type"] == "test_sound":
                play_sound([data.get("finger", "thumb")])
                
    except:
        pass
    finally:
        clients.remove(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
