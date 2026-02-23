# New drum sounds
def generate_drum(drum_type, duration=0.4):
    import numpy as np
    SAMPLE_RATE = 44100
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

# Test
if __name__ == "__main__":
    for drum in ['kick', 'snare', 'hihat', 'tom', 'clap', 'cymbal']:
        sample = generate_drum(drum)
        print(f"{drum}: {len(sample)} samples, max={sample.max():.2f}")
