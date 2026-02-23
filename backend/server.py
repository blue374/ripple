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
from collections import deque

# Base frequencies for each note (octave 4)
BASE_FREQS = {
    'C': 262, 'C#': 277, 'Db': 277, 'D': 294, 'D#': 311, 'Eb': 311,
    'E': 330, 'F': 349, 'F#': 370, 'Gb': 370, 'G': 392, 'G#': 415,
    'Ab': 415, 'A': 440, 'A#': 466, 'Bb': 466, 'B': 494
}

# Chord intervals (semitones from root)
CHORD_INTERVALS = {
    'maj': [0, 4, 7],
    'm': [0, 3, 7],
    '7': [0, 4, 7, 10],
}

def get_frequency(note, octave=4):
    """Get frequency for a note at a given octave"""
    base = BASE_FREQS.get(note, 262)
    return base * (2 ** (octave - 4))

def parse_sound(sound_str):
    """Parse a sound string like 'C_maj_inv1_oct5' into frequencies"""
    if not sound_str or sound_str == 'none':
        return []
    
    # Extract octave
    octave = 4
    if '_oct' in sound_str:
        try:
            octave = int(sound_str.split('_oct')[1][0])
            sound_str = sound_str.split('_oct')[0]
        except:
            pass
    
    # Extract inversion
    inversion = 0
    if '_inv' in sound_str:
        try:
            inversion = int(sound_str.split('_inv')[1][0])
            sound_str = sound_str.split('_inv')[0]
        except:
            pass
    
    # Check if it's a chord
    if '_maj' in sound_str:
        root = sound_str.replace('_maj', '')
        intervals = CHORD_INTERVALS['maj']
    elif sound_str.endswith('m') and not sound_str.endswith('_m'):
        root = sound_str[:-1]
        intervals = CHORD_INTERVALS['m']
    elif sound_str.endswith('7'):
        root = sound_str[:-1]
        intervals = CHORD_INTERVALS['7']
    else:
        # Single note
        return [get_frequency(sound_str, octave)]
    
    # Get root frequency
    root_freq = get_frequency(root, octave)
    
    # Calculate chord frequencies
    freqs = []
    for i, interval in enumerate(intervals):
        freq = root_freq * (2 ** (interval / 12))
        # Apply inversion - move lower notes up an octave
        if i < inversion:
            freq *= 2
        freqs.append(freq)
    
    return sorted(freqs)


app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SAMPLE_RATE = 44100

CHORDS = {
    # Natural notes
    'C': [262], 'D': [294], 'E': [330], 'F': [349], 'G': [392], 'A': [440], 'B': [494],
    # Sharp notes
    'C#': [277], 'D#': [311], 'F#': [370], 'G#': [415], 'A#': [466],
    # Flat notes (enharmonic equivalents)
    'Db': [277], 'Eb': [311], 'Gb': [370], 'Ab': [415], 'Bb': [466],
    # Higher octave
    'C5': [523], 'D5': [587], 'E5': [659], 'F5': [698], 'G5': [784],
    # Major chords
    'C_maj': [262, 330, 392], 'D_maj': [294, 370, 440], 'E_maj': [330, 415, 494],
    'F_maj': [349, 440, 523], 'G_maj': [392, 494, 587], 'A_maj': [440, 554, 659], 'B_maj': [494, 622, 740],
    # Sharp major chords
    'C#_maj': [277, 349, 415], 'D#_maj': [311, 392, 466], 'F#_maj': [370, 466, 554],
    'G#_maj': [415, 523, 622], 'A#_maj': [466, 587, 698],
    # Flat major chords
    'Db_maj': [277, 349, 415], 'Eb_maj': [311, 392, 466], 'Gb_maj': [370, 466, 554],
    'Ab_maj': [415, 523, 622], 'Bb_maj': [466, 587, 698],
    # Minor chords
    'Am': [440, 523, 659], 'Bm': [494, 587, 740], 'Cm': [262, 311, 392],
    'Dm': [294, 349, 440], 'Em': [330, 392, 494], 'Fm': [349, 415, 523], 'Gm': [392, 466, 587],
    # Sharp minor chords
    'C#m': [277, 330, 415], 'D#m': [311, 370, 466], 'F#m': [370, 440, 554],
    'G#m': [415, 494, 622], 'A#m': [466, 554, 698],
    # Flat minor chords
    'Dbm': [277, 330, 415], 'Ebm': [311, 370, 466], 'Gbm': [370, 440, 554],
    'Abm': [415, 494, 622], 'Bbm': [466, 554, 698],
    # 7th chords
    'C7': [262, 330, 392, 466], 'D7': [294, 370, 440, 523], 'E7': [330, 415, 494, 587],
    'F7': [349, 440, 523, 622], 'G7': [392, 494, 587, 698], 'A7': [440, 554, 659, 784], 'B7': [494, 622, 740, 880],
    # None
    'none': [],
}

DRUMS = ['kick', 'snare', 'hihat', 'tom', 'clap', 'cymbal']

def generate_drum(drum_type, duration=0.4):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    
    if drum_type == 'kick':
        # Deep bass with sub frequencies
        freq = 55 * np.exp(-2 * t)
        wave = np.sin(2 * np.pi * freq * t) * np.exp(-3 * t)
        wave += 0.6 * np.sin(2 * np.pi * 35 * t) * np.exp(-4 * t)
        wave += 0.2 * np.random.randn(len(t)) * np.exp(-80 * t)
    
    elif drum_type == 'snare':
        wave = 0.4 * np.sin(2 * np.pi * 180 * t) * np.exp(-25 * t)
        wave += 0.6 * np.random.randn(len(t)) * np.exp(-18 * t)
    
    elif drum_type == 'hihat':
        wave = np.random.randn(len(t)) * np.exp(-35 * t)
        wave = np.diff(np.concatenate([[0], wave]))
    
    elif drum_type == 'tom':
        freq = 90 * np.exp(-4 * t)
        wave = np.sin(2 * np.pi * freq * t) * np.exp(-8 * t)
    
    elif drum_type == 'clap':
        wave = np.zeros(len(t))
        for i in range(5):
            offset = int((i * 0.012 + np.random.random() * 0.005) * SAMPLE_RATE)
            if offset < len(t):
                remaining = len(t) - offset
                noise = np.random.randn(remaining)
                hit_env = np.exp(-60 * np.linspace(0, 0.1, remaining))
                wave[offset:] += noise * hit_env * (0.7 ** i)
        wave *= np.exp(-12 * t)
        wave += 0.15 * np.random.randn(len(t)) * np.exp(-6 * t)
    
    elif drum_type == 'cymbal':
        wave = np.random.randn(len(t)) * np.exp(-2.5 * t)
        wave += 0.4 * np.random.randn(len(t)) * np.exp(-1 * t)
    
    else:
        wave = np.zeros(len(t))
    
    if np.max(np.abs(wave)) > 0:
        wave = wave / np.max(np.abs(wave)) * 0.75
    return wave.astype(np.float32)

# Pre-generate drum samples
drum_samples = {drum: generate_drum(drum) for drum in DRUMS}

INSTRUMENTS = {
    'sine': lambda t, f: np.sin(2 * np.pi * f * t),
    'soft': lambda t, f: 0.6*np.sin(2*np.pi*f*t) + 0.3*np.sin(4*np.pi*f*t) + 0.1*np.sin(6*np.pi*f*t),
    'bell': lambda t, f: np.sin(2*np.pi*f*t) + 0.5*np.sin(4*np.pi*f*t),
    'pad': lambda t, f: 0.4*np.sin(2*np.pi*f*t) + 0.3*np.sin(2*np.pi*(f*1.002)*t) + 0.3*np.sin(2*np.pi*(f*0.998)*t),
}

PRESETS = {
    'therapy': {'name': '🧘 Therapy', 'instrument': 'pad', 'mapping': {'thumb': 'C_maj', 'index': 'F_maj', 'middle': 'G_maj', 'ring': 'Am', 'pinky': 'Em'}},
    'piano': {'name': '🎹 Piano', 'instrument': 'bell', 'mapping': {'thumb': 'C', 'index': 'D', 'middle': 'E', 'ring': 'F', 'pinky': 'G'}},
    'chords': {'name': '🎸 Chords', 'instrument': 'soft', 'mapping': {'thumb': 'C_maj', 'index': 'D_maj', 'middle': 'E_maj', 'ring': 'G_maj', 'pinky': 'A_maj'}},
    'drums': {'name': '🥁 Drums', 'instrument': 'drums', 'mapping': {'thumb': 'kick', 'index': 'snare', 'middle': 'hihat', 'ring': 'tom', 'pinky': 'clap'}},
    'custom': {'name': '✏️ Custom', 'instrument': 'sine', 'mapping': {'thumb': 'C', 'index': 'D', 'middle': 'E', 'ring': 'F', 'pinky': 'G'}},
}

TUTORIALS = {
    # BEGINNER
    'scale': {
        'name': 'Simple Scale',
        'difficulty': 'Beginner',
        'sequence': ['thumb', 'index', 'middle', 'ring', 'pinky', 'pinky', 'ring', 'middle', 'index', 'thumb'],
    },
    'hotcross': {
        'name': 'Hot Cross Buns',
        'difficulty': 'Beginner',
        'sequence': ['middle', 'index', 'thumb', 'middle', 'index', 'thumb', 'thumb', 'thumb', 'thumb', 'thumb', 'index', 'index', 'index', 'index', 'middle', 'index', 'thumb'],
    },
    'rain': {
        'name': 'Rain Rain Go Away',
        'difficulty': 'Beginner',
        'sequence': ['middle', 'thumb', 'middle', 'middle', 'thumb', 'middle', 'middle', 'thumb', 'middle', 'ring', 'middle', 'index', 'thumb'],
    },
    # EASY
    'mary': {
        'name': 'Mary Had a Little Lamb',
        'difficulty': 'Easy',
        'sequence': ['middle', 'index', 'thumb', 'index', 'middle', 'middle', 'middle', 'index', 'index', 'index', 'middle', 'pinky', 'pinky', 'middle', 'index', 'thumb', 'index', 'middle', 'middle', 'middle', 'middle', 'index', 'index', 'middle', 'index', 'thumb'],
    },
    'happy': {
        'name': 'Happy Birthday',
        'difficulty': 'Easy',
        'sequence': ['thumb', 'thumb', 'index', 'thumb', 'ring', 'middle', 'thumb', 'thumb', 'index', 'thumb', 'pinky', 'ring', 'thumb', 'thumb', 'thumb', 'middle', 'ring', 'middle', 'index'],
    },
    'london': {
        'name': 'London Bridge',
        'difficulty': 'Easy',
        'sequence': ['pinky', 'ring', 'middle', 'ring', 'pinky', 'pinky', 'pinky', 'ring', 'ring', 'ring', 'pinky', 'pinky', 'pinky', 'pinky', 'ring', 'middle', 'ring', 'pinky', 'pinky', 'pinky', 'ring', 'ring', 'pinky', 'ring', 'middle'],
    },
    'twinkle': {
        'name': 'Twinkle Twinkle Little Star',
        'difficulty': 'Easy',
        'sequence': ['thumb', 'thumb', 'pinky', 'pinky', 'pinky', 'pinky', 'pinky', 'ring', 'ring', 'middle', 'middle', 'index', 'index', 'thumb', 'pinky', 'pinky', 'ring', 'ring', 'middle', 'middle', 'index', 'pinky', 'pinky', 'ring', 'ring', 'middle', 'middle', 'index', 'thumb', 'thumb', 'pinky', 'pinky', 'pinky', 'pinky', 'pinky', 'ring', 'ring', 'middle', 'middle', 'index', 'index', 'thumb'],
    },
    # MEDIUM
    'brother': {
        'name': 'Are You Sleeping (Frère Jacques)',
        'difficulty': 'Medium',
        'sequence': ['thumb', 'index', 'middle', 'thumb', 'thumb', 'index', 'middle', 'thumb', 'middle', 'ring', 'pinky', 'middle', 'ring', 'pinky', 'pinky', 'ring', 'middle', 'thumb', 'pinky', 'ring', 'middle', 'thumb', 'thumb', 'pinky', 'thumb', 'thumb', 'pinky', 'thumb'],
    },
    'jingle': {
        'name': 'Jingle Bells (Chorus)',
        'difficulty': 'Medium',
        'sequence': ['middle', 'middle', 'middle', 'middle', 'middle', 'middle', 'middle', 'pinky', 'thumb', 'index', 'middle', 'ring', 'ring', 'ring', 'ring', 'ring', 'middle', 'middle', 'middle', 'middle', 'index', 'index', 'middle', 'index', 'pinky'],
    },
    'ode': {
        'name': 'Ode to Joy',
        'difficulty': 'Medium',
        'sequence': ['middle', 'middle', 'ring', 'pinky', 'pinky', 'ring', 'middle', 'index', 'thumb', 'thumb', 'index', 'middle', 'middle', 'index', 'index', 'middle', 'middle', 'ring', 'pinky', 'pinky', 'ring', 'middle', 'index', 'thumb', 'thumb', 'index', 'middle', 'index', 'thumb', 'thumb'],
    },
    'rowboat': {
        'name': 'Row Row Row Your Boat',
        'difficulty': 'Medium',
        'sequence': ['thumb', 'thumb', 'thumb', 'index', 'middle', 'middle', 'index', 'middle', 'ring', 'pinky', 'pinky', 'pinky', 'pinky', 'middle', 'middle', 'middle', 'thumb', 'thumb', 'thumb', 'pinky', 'ring', 'middle', 'index', 'thumb'],
    },
    # HARD
    'entertainer': {
        'name': 'The Entertainer (Intro)',
        'difficulty': 'Hard',
        'sequence': ['index', 'middle', 'index', 'thumb', 'index', 'middle', 'ring', 'middle', 'index', 'middle', 'index', 'thumb', 'index', 'middle', 'ring', 'pinky', 'ring', 'middle', 'ring', 'middle', 'index', 'thumb', 'index', 'middle', 'middle', 'ring', 'pinky', 'ring', 'middle', 'index', 'thumb', 'index'],
    },
    'minuet': {
        'name': 'Minuet in G (Simplified)',
        'difficulty': 'Hard',
        'sequence': ['pinky', 'index', 'middle', 'ring', 'pinky', 'pinky', 'thumb', 'middle', 'index', 'middle', 'ring', 'middle', 'index', 'thumb', 'index', 'thumb', 'index', 'middle', 'ring', 'middle', 'pinky', 'index', 'middle', 'ring', 'pinky', 'pinky', 'thumb', 'ring', 'middle', 'index', 'thumb', 'index', 'middle', 'ring', 'pinky'],
    },
    'furelise': {
        'name': 'Für Elise (Theme)',
        'difficulty': 'Hard',
        'sequence': ['middle', 'index', 'middle', 'index', 'middle', 'thumb', 'index', 'thumb', 'thumb', 'middle', 'thumb', 'middle', 'index', 'middle', 'index', 'middle', 'middle', 'index', 'middle', 'index', 'middle', 'thumb', 'index', 'thumb', 'thumb', 'middle', 'index', 'thumb', 'thumb'],
    },
    'cancan': {
        'name': 'Can-Can (Fast)',
        'difficulty': 'Hard',
        'sequence': ['thumb', 'thumb', 'index', 'index', 'middle', 'middle', 'ring', 'ring', 'pinky', 'ring', 'middle', 'index', 'thumb', 'index', 'middle', 'ring', 'pinky', 'pinky', 'ring', 'ring', 'middle', 'middle', 'index', 'index', 'thumb', 'index', 'middle', 'ring', 'pinky', 'ring', 'middle', 'index', 'thumb', 'thumb', 'middle', 'middle', 'pinky', 'middle', 'thumb', 'middle', 'pinky'],
    },
    'flight': {
        'name': 'Flight of the Bumblebee (Mini)',
        'difficulty': 'Hard',
        'sequence': ['thumb', 'index', 'middle', 'index', 'thumb', 'index', 'middle', 'ring', 'middle', 'index', 'thumb', 'index', 'middle', 'ring', 'pinky', 'ring', 'middle', 'ring', 'pinky', 'ring', 'middle', 'index', 'thumb', 'index', 'middle', 'index', 'thumb', 'index', 'middle', 'ring', 'middle', 'index', 'thumb', 'index', 'middle', 'ring', 'pinky', 'ring', 'middle', 'index', 'thumb'],
    },
}

FINGERS = {
    'thumb': {'idx': 1, 'range': 139000},
    'index': {'idx': 5, 'range': 140000},
    'middle': {'idx': 4, 'range': 139000},
    'ring': {'idx': 3, 'range': 184000},
    'pinky': {'idx': 6, 'range': 168000},
}

THRESHOLD = 0.15

state = {
    "connected": False,
    "calibrated": False,
    "active_fingers": [],
    "current_preset": "piano",
    "threshold": THRESHOLD,
    "mode": "play",
    "tutorial": {"current": None, "step": 0, "completed": False},
    "recording": False,
    "playing_back": False,
}

custom_types = {'thumb': 'note', 'index': 'note', 'middle': 'note', 'ring': 'note', 'pinky': 'note'}
custom_instrument = 'sine'

rest = {}
ser = None
stream = None
active = set()
clients = []
running = False
last_active = set()

tutorial_ready = set(['thumb', 'index', 'middle', 'ring', 'pinky'])
TUTORIAL_RELEASE_THRESHOLD = 0.08

current_recording = []
recording_start_time = 0

# Audio state
current_frequencies = []
phase = {}
audio_lock = threading.Lock()

# Drum queue for one-shot sounds
drum_queue = deque()
drum_playback_pos = {}

def audio_callback(outdata, frames, time_info, status):
    global phase, drum_playback_pos
    
    wave = np.zeros(frames, dtype=np.float32)
    
    # Mix sustained notes
    with audio_lock:
        if current_frequencies:
            preset = PRESETS[state["current_preset"]]
            synth_name = preset["instrument"] if state["current_preset"] != "custom" else custom_instrument
            
            t = np.arange(frames) / SAMPLE_RATE
            
            for freq in current_frequencies:
                if freq not in phase:
                    phase[freq] = 0.0
                
                if synth_name == 'sine':
                    wave += np.sin(2 * np.pi * freq * t + phase[freq])
                elif synth_name == 'soft':
                    wave += 0.6*np.sin(2*np.pi*freq*t + phase[freq]) + 0.3*np.sin(4*np.pi*freq*t + phase[freq]*2)
                elif synth_name == 'bell':
                    wave += np.sin(2*np.pi*freq*t + phase[freq]) + 0.5*np.sin(4*np.pi*freq*t + phase[freq]*2)
                elif synth_name == 'pad':
                    wave += 0.4*np.sin(2*np.pi*freq*t + phase[freq]) + 0.3*np.sin(2*np.pi*(freq*1.002)*t + phase[freq])
                
                phase[freq] += 2 * np.pi * freq * frames / SAMPLE_RATE
                phase[freq] %= 2 * np.pi
            
            wave = wave / max(len(current_frequencies), 1) * 0.3
    
    # Mix drum sounds
    drums_to_remove = []
    for drum_id, (drum_type, pos) in list(drum_playback_pos.items()):
        if drum_type in drum_samples:
            sample = drum_samples[drum_type]
            remaining = len(sample) - pos
            to_play = min(frames, remaining)
            if to_play > 0:
                wave[:to_play] += sample[pos:pos + to_play]
                drum_playback_pos[drum_id] = (drum_type, pos + to_play)
            if pos + to_play >= len(sample):
                drums_to_remove.append(drum_id)
    
    for drum_id in drums_to_remove:
        del drum_playback_pos[drum_id]
    
    # Process new drums from queue
    while drum_queue:
        drum_type = drum_queue.popleft()
        drum_id = time.time()
        drum_playback_pos[drum_id] = (drum_type, 0)
    
    # Clip to prevent distortion
    wave = np.clip(wave, -1.0, 1.0)
    outdata[:, 0] = wave

def play_drum(drum_type):
    if drum_type in drum_samples:
        drum_queue.append(drum_type)

def update_sound(fingers, trigger_drums=True):
    global current_frequencies, phase
    
    preset = PRESETS[state["current_preset"]]
    is_drum_preset = preset["instrument"] == "drums"
    
    # Handle drums
    if trigger_drums:
        for f in fingers:
            sound = preset["mapping"].get(f)
            if is_drum_preset and sound in DRUMS:
                play_drum(sound)
            elif state["current_preset"] == "custom" and custom_types.get(f) == "drum":
                if sound in DRUMS:
                    play_drum(sound)
    
    # Handle sustained sounds
    with audio_lock:
        if is_drum_preset:
            current_frequencies = []
            phase = {}
            return
        
        if not fingers:
            current_frequencies = []
            phase = {}
            return
        
        new_freqs = []
        for f in fingers:
            sound = preset["mapping"].get(f)
            
            if state["current_preset"] == "custom":
                sound_type = custom_types.get(f, 'note')
                if sound_type == 'drum' or sound_type == 'none':
                    continue
                # Use dynamic parsing for custom sounds with octave/inversion
                new_freqs.extend(parse_sound(sound))
            elif sound and sound in CHORDS:
                new_freqs.extend(CHORDS[sound])
        
        new_phase = {}
        for freq in new_freqs:
            if freq in phase:
                new_phase[freq] = phase[freq]
            else:
                new_phase[freq] = 0.0
        
        current_frequencies = new_freqs
        phase = new_phase

def broadcast_sync(msg):
    for client in clients[:]:
        try:
            asyncio.run(client.send_json(msg))
        except:
            pass

def check_tutorial_progress(finger, is_pressed):
    global tutorial_ready
    
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
    
    if is_pressed and finger == expected and finger in tutorial_ready:
        tutorial_ready.discard(finger)
        
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

def record_event(fingers, newly_pressed):
    global current_recording, recording_start_time
    if state["recording"] and recording_start_time > 0:
        timestamp = time.time() - recording_start_time
        preset = PRESETS[state["current_preset"]]
        
        sounds = []
        for f in newly_pressed:
            sound = preset["mapping"].get(f)
            sound_type = 'drum' if preset["instrument"] == "drums" else 'note'
            if state["current_preset"] == "custom":
                sound_type = custom_types.get(f, 'note')
            sounds.append({"finger": f, "sound": sound, "type": sound_type})
        
        if sounds:
            current_recording.append({
                "time": timestamp,
                "fingers": list(newly_pressed),
                "sounds": sounds,
                "preset": state["current_preset"]
            })

def read_loop():
    global active, running, last_active, tutorial_ready
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
                                
                                if state["mode"] == "tutorial":
                                    if drop < TUTORIAL_RELEASE_THRESHOLD:
                                        tutorial_ready.add(name)
                                    
                                    if drop > state["threshold"] and name in tutorial_ready:
                                        check_tutorial_progress(name, True)
                        
                        if new_active != active:
                            newly_pressed = new_active - active
                            
                            if state["recording"]:
                                record_event(new_active, newly_pressed)
                            
                            last_active = active.copy()
                            active = new_active.copy()
                            state["active_fingers"] = list(active)
                            
                            # Trigger drums for new presses, update sustained for all
                            if newly_pressed:
                                update_sound(newly_pressed, trigger_drums=True)
                            update_sound(active, trigger_drums=False)
                            
                            broadcast_sync({"type": "fingers", "active": list(active)})
                except ValueError:
                    pass
        except:
            pass
        time.sleep(0.005)

def disconnect():
    global ser, stream, running, active, last_active, current_frequencies, phase, tutorial_ready
    running = False
    time.sleep(0.1)
    
    with audio_lock:
        current_frequencies = []
        phase = {}
    
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
    tutorial_ready = set(['thumb', 'index', 'middle', 'ring', 'pinky'])
    state["connected"] = False
    state["calibrated"] = False
    state["active_fingers"] = []
    state["recording"] = False
    rest.clear()

async def playback_recording(websocket, events):
    state["playing_back"] = True
    await websocket.send_json({"type": "playback_started"})
    
    start_time = time.time()
    event_idx = 0
    
    while event_idx < len(events) and state["playing_back"]:
        elapsed = time.time() - start_time
        event = events[event_idx]
        
        if elapsed >= event["time"]:
            for sound_info in event.get("sounds", []):
                if sound_info["type"] == "drum" and sound_info["sound"] in DRUMS:
                    play_drum(sound_info["sound"])
            
            fingers = set(event["fingers"])
            await websocket.send_json({"type": "fingers", "active": list(fingers)})
            event_idx += 1
        else:
            await asyncio.sleep(0.01)
    
    await websocket.send_json({"type": "fingers", "active": []})
    await websocket.send_json({"type": "playback_stopped"})
    state["playing_back"] = False

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global ser, stream, running, current_recording, recording_start_time, tutorial_ready, custom_types, custom_instrument
    await websocket.accept()
    clients.append(websocket)
    
    await websocket.send_json({
        "type": "init",
        "presets": {k: {"name": v["name"], "mapping": v["mapping"], "instrument": v["instrument"]} for k, v in PRESETS.items()},
        "chords": list(CHORDS.keys()),
        "drums": DRUMS,
        "instruments": list(INSTRUMENTS.keys()),
        "tutorials": {k: {"name": v["name"], "difficulty": v["difficulty"], "length": len(v["sequence"])} for k, v in TUTORIALS.items()},
        "state": state,
        "custom_types": custom_types,
        "custom_instrument": custom_instrument,
    })
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "connect":
                try:
                    ser = serial.Serial('/dev/ttyUSB0', 921600, timeout=0.02)
                    stream = sd.OutputStream(
                        samplerate=SAMPLE_RATE, 
                        channels=1, 
                        blocksize=512,
                        latency='low',
                        callback=audio_callback
                    )
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
                update_sound(active, trigger_drums=False)
                await websocket.send_json({"type": "preset_changed", "preset": data["preset"]})
            
            elif data["type"] == "set_mapping":
                finger = data["finger"]
                sound = data["sound"]
                sound_type = data.get("sound_type", "note")
                
                PRESETS["custom"]["mapping"][finger] = sound
                custom_types[finger] = sound_type
                state["current_preset"] = "custom"
                
                await websocket.send_json({
                    "type": "mapping_updated", 
                    "finger": finger, 
                    "sound": sound,
                    "sound_type": sound_type,
                    "custom_types": custom_types
                })
            
            elif data["type"] == "set_custom_instrument":
                custom_instrument = data["instrument"]
                await websocket.send_json({"type": "custom_instrument_changed", "instrument": custom_instrument})
            
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
                    tutorial_ready = set(['thumb', 'index', 'middle', 'ring', 'pinky'])
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
                    tutorial_ready = set(['thumb', 'index', 'middle', 'ring', 'pinky'])
                    tutorial = TUTORIALS[state["tutorial"]["current"]]
                    await websocket.send_json({
                        "type": "tutorial_reset",
                        "next_finger": tutorial["sequence"][0],
                        "total": len(tutorial["sequence"])
                    })
            
            elif data["type"] == "start_recording":
                current_recording = []
                recording_start_time = time.time()
                state["recording"] = True
                await websocket.send_json({"type": "recording_started"})
            
            elif data["type"] == "stop_recording":
                state["recording"] = False
                recording_data = {
                    "events": current_recording,
                    "preset": state["current_preset"],
                    "duration": time.time() - recording_start_time if recording_start_time > 0 else 0
                }
                await websocket.send_json({
                    "type": "recording_stopped",
                    "recording": recording_data
                })
            
            elif data["type"] == "playback":
                recording = data["recording"]
                asyncio.create_task(playback_recording(websocket, recording["events"]))
            
            elif data["type"] == "stop_playback":
                state["playing_back"] = False
            
            elif data["type"] == "test_sound":
                finger = data.get("finger", "thumb")
                preset = PRESETS[state["current_preset"]]
                sound = preset["mapping"].get(finger)
                if preset["instrument"] == "drums" and sound in DRUMS:
                    play_drum(sound)
                elif state["current_preset"] == "custom" and custom_types.get(finger) == "drum" and sound in DRUMS:
                    play_drum(sound)
                else:
                    update_sound([finger], trigger_drums=True)
                    await asyncio.sleep(0.3)
                    update_sound([])
                
    except:
        pass
    finally:
        clients.remove(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
