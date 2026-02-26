import React, { useState, useEffect, useRef } from 'react'

const FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky']
const FINGER_COLORS = {
  thumb: '#ef4444',
  index: '#f97316', 
  middle: '#eab308',
  ring: '#22c55e',
  pinky: '#3b82f6',
}
const NOTE_NAMES = { thumb: 'C', index: 'D', middle: 'E', ring: 'F', pinky: 'G' }

const OCTAVES = [2, 3, 4, 5, 6]
const INVERSIONS = [
  { value: 0, label: 'Root' },
  { value: 1, label: '1st Inv' },
  { value: 2, label: '2nd Inv' },
]

// Default data (same as server)
const DEFAULT_PRESETS = {
  'therapy': { name: '🧘 Therapy', instrument: 'pad', mapping: { thumb: 'C_maj', index: 'F_maj', middle: 'G_maj', ring: 'Am', pinky: 'Em' } },
  'piano': { name: '🎹 Piano', instrument: 'bell', mapping: { thumb: 'C', index: 'D', middle: 'E', ring: 'F', pinky: 'G' } },
  'chords': { name: '🎸 Chords', instrument: 'soft', mapping: { thumb: 'C_maj', index: 'D_maj', middle: 'E_maj', ring: 'G_maj', pinky: 'A_maj' } },
  'drums': { name: '🥁 Drums', instrument: 'drums', mapping: { thumb: 'kick', index: 'snare', middle: 'hihat', ring: 'tom', pinky: 'clap' } },
  'custom': { name: '✏️ Custom', instrument: 'sine', mapping: { thumb: 'C', index: 'D', middle: 'E', ring: 'F', pinky: 'G' } },
}

const DEFAULT_DRUMS = ['kick', 'snare', 'hihat', 'tom', 'clap', 'cymbal']

const DEFAULT_TUTORIALS = {
  'scale': { name: 'Simple Scale', difficulty: 'Beginner', length: 10 },
  'hotcross': { name: 'Hot Cross Buns', difficulty: 'Beginner', length: 17 },
  'rain': { name: 'Rain Rain Go Away', difficulty: 'Beginner', length: 13 },
  'mary': { name: 'Mary Had a Little Lamb', difficulty: 'Easy', length: 26 },
  'happy': { name: 'Happy Birthday', difficulty: 'Easy', length: 19 },
  'london': { name: 'London Bridge', difficulty: 'Easy', length: 25 },
  'twinkle': { name: 'Twinkle Twinkle Little Star', difficulty: 'Easy', length: 42 },
  'brother': { name: 'Are You Sleeping (Frère Jacques)', difficulty: 'Medium', length: 28 },
  'jingle': { name: 'Jingle Bells (Chorus)', difficulty: 'Medium', length: 25 },
  'ode': { name: 'Ode to Joy', difficulty: 'Medium', length: 30 },
  'rowboat': { name: 'Row Row Row Your Boat', difficulty: 'Medium', length: 24 },
  'entertainer': { name: 'The Entertainer (Intro)', difficulty: 'Hard', length: 32 },
  'minuet': { name: 'Minuet in G (Simplified)', difficulty: 'Hard', length: 35 },
  'furelise': { name: 'Für Elise (Theme)', difficulty: 'Hard', length: 29 },
  'cancan': { name: 'Can-Can (Fast)', difficulty: 'Hard', length: 41 },
  'flight': { name: 'Flight of the Bumblebee (Mini)', difficulty: 'Hard', length: 41 },
}

function Hand({ activeFingers, mapping, onFingerClick, highlightFinger }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '30px' }}>
      {FINGERS.map(finger => {
        const isActive = activeFingers.includes(finger)
        const isHighlighted = finger === highlightFinger
        const color = FINGER_COLORS[finger]
        const displayName = mapping?.[finger]?.split('_oct')[0]?.split('_inv')[0] || NOTE_NAMES[finger]
        return (
          <div
            key={finger}
            onClick={() => onFingerClick?.(finger)}
            style={{
              width: finger === 'thumb' ? '55px' : '45px',
              height: finger === 'middle' ? '130px' : finger === 'thumb' ? '75px' : finger === 'pinky' ? '100px' : '115px',
              background: isActive 
                ? `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`
                : isHighlighted ? `linear-gradient(180deg, ${color}66 0%, ${color}33 100%)` : 'rgba(255,255,255,0.15)',
              borderRadius: '22px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: '12px',
              transition: 'all 0.1s ease',
              transform: isActive ? 'scale(1.08)' : isHighlighted ? 'scale(1.05)' : 'scale(1)',
              boxShadow: isActive ? `0 0 25px ${color}66` : isHighlighted ? `0 0 20px ${color}44` : 'none',
              marginTop: finger === 'thumb' ? '55px' : finger === 'pinky' ? '25px' : finger === 'index' || finger === 'ring' ? '8px' : '0',
              cursor: onFingerClick ? 'pointer' : 'default',
              border: isHighlighted ? `3px solid ${color}` : onFingerClick ? '2px solid rgba(255,255,255,0.3)' : 'none',
              animation: isHighlighted ? 'pulse 1s infinite' : 'none',
            }}
          >
            <span style={{ fontWeight: 'bold', fontSize: '0.85rem', opacity: 0.9 }}>{displayName}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '2px' }}>{finger}</span>
          </div>
        )
      })}
    </div>
  )
}

function OctaveInversionSelector({ sound, soundType, onSelect, onBack }) {
  const [octave, setOctave] = useState(4)
  const [inversion, setInversion] = useState(0)
  
  const isChord = soundType === 'chord'
  const displaySound = sound.replace('_maj', ' Major').replace('_', ' ').replace('m', ' minor')
  
  const handleConfirm = () => {
    let finalSound = sound
    if (isChord) {
      finalSound = `${sound}_inv${inversion}_oct${octave}`
    } else {
      finalSound = `${sound}_oct${octave}`
    }
    onSelect(finalSound, soundType)
  }
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 101 }}>
      <div style={{ background: '#1e293b', borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '90%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button onClick={onBack} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>←</button>
          <h3 style={{ margin: 0 }}>{displaySound}</h3>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '10px', opacity: 0.7 }}>Octave</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            {OCTAVES.map(oct => (
              <button key={oct} onClick={() => setOctave(oct)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: octave === oct ? '2px solid #4ade80' : '2px solid transparent',
                  background: octave === oct ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>
                {oct}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.75rem', opacity: 0.5 }}>
            <span>Lower</span>
            <span>Higher</span>
          </div>
        </div>
        
        {isChord && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '10px', opacity: 0.7 }}>Inversion</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              {INVERSIONS.map(inv => (
                <button key={inv.value} onClick={() => setInversion(inv.value)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: inversion === inv.value ? '2px solid #8b5cf6' : '2px solid transparent',
                    background: inversion === inv.value ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
                  {inv.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
          <span style={{ opacity: 0.6 }}>Selected: </span>
          <span style={{ fontWeight: 'bold', color: '#4ade80' }}>
            {sound} {isChord ? `(${INVERSIONS[inversion].label})` : ''} - Octave {octave}
          </span>
        </div>
        
        <button onClick={handleConfirm}
          style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', background: '#4ade80', color: 'black', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
          ✓ Confirm
        </button>
      </div>
    </div>
  )
}

function SoundSelector({ drums, currentSound, currentType, onSelect, onClose }) {
  const [tab, setTab] = useState(currentType || 'note')
  const [selectedSound, setSelectedSound] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  
  const notes = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
  const majorChords = ['C_maj', 'C#_maj', 'Db_maj', 'D_maj', 'D#_maj', 'Eb_maj', 'E_maj', 'F_maj', 'F#_maj', 'Gb_maj', 'G_maj', 'G#_maj', 'Ab_maj', 'A_maj', 'A#_maj', 'Bb_maj', 'B_maj']
  const minorChords = ['Am', 'A#m', 'Bbm', 'Bm', 'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm']
  const seventh = ['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7']
  
  const handleSoundClick = (sound, type) => {
    if (type === 'drum' || type === 'none') {
      onSelect(sound, type)
    } else {
      setSelectedSound(sound)
      setSelectedType(type)
    }
  }
  
  if (selectedSound) {
    return <OctaveInversionSelector sound={selectedSound} soundType={selectedType} onSelect={onSelect} onBack={() => { setSelectedSound(null); setSelectedType(null) }} />
  }
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#1e293b', borderRadius: '20px', padding: '30px', maxWidth: '550px', width: '90%', maxHeight: '85vh', overflow: 'auto' }}>
        <h3 style={{ marginBottom: '20px' }}>Select Sound</h3>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['note', 'chord', 'drum', 'none'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, minWidth: '70px', padding: '10px', borderRadius: '8px', border: tab === t ? '2px solid #4ade80' : '2px solid transparent',
                background: tab === t ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', textTransform: 'capitalize' }}>
              {t === 'none' ? '🚫' : t === 'drum' ? '🥁' : t === 'chord' ? '🎸' : '🎹'} {t}
            </button>
          ))}
        </div>
        
        {tab === 'none' && (
          <button onClick={() => handleSoundClick('none', 'none')}
            style={{ width: '100%', padding: '20px', borderRadius: '8px', border: '2px solid #ef4444', background: 'rgba(239, 68, 68, 0.2)', color: 'white', cursor: 'pointer', fontSize: '1.1rem' }}>
            No Sound (Disabled)
          </button>
        )}
        
        {tab === 'note' && (
          <>
            <p style={{ opacity: 0.6, marginBottom: '10px', fontSize: '0.85rem' }}>Click a note to select octave</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {notes.map(note => (
                <button key={note} onClick={() => handleSoundClick(note, 'note')}
                  style={{ padding: '12px 8px', borderRadius: '8px', border: '2px solid transparent',
                    background: note.includes('#') || note.includes('b') ? 'rgba(100,100,100,0.3)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
                  {note}
                </button>
              ))}
            </div>
          </>
        )}
        
        {tab === 'chord' && (
          <>
            <p style={{ opacity: 0.6, marginBottom: '10px', fontSize: '0.85rem' }}>Click a chord to select octave & inversion</p>
            <h4 style={{ marginTop: '15px', marginBottom: '10px', opacity: 0.7 }}>Major</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '15px' }}>
              {majorChords.map(chord => (
                <button key={chord} onClick={() => handleSoundClick(chord, 'chord')}
                  style={{ padding: '10px 6px', borderRadius: '8px', border: '2px solid transparent', background: 'rgba(74, 222, 128, 0.15)', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>
                  {chord.replace('_maj', '')}
                </button>
              ))}
            </div>
            <h4 style={{ marginBottom: '10px', opacity: 0.7 }}>Minor</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '15px' }}>
              {minorChords.map(chord => (
                <button key={chord} onClick={() => handleSoundClick(chord, 'chord')}
                  style={{ padding: '10px 6px', borderRadius: '8px', border: '2px solid transparent', background: 'rgba(139, 92, 246, 0.15)', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>
                  {chord}
                </button>
              ))}
            </div>
            <h4 style={{ marginBottom: '10px', opacity: 0.7 }}>7th</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {seventh.map(chord => (
                <button key={chord} onClick={() => handleSoundClick(chord, 'chord')}
                  style={{ padding: '10px 6px', borderRadius: '8px', border: '2px solid transparent', background: 'rgba(249, 115, 22, 0.15)', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>
                  {chord}
                </button>
              ))}
            </div>
          </>
        )}
        
        {tab === 'drum' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {drums.map(drum => (
              <button key={drum} onClick={() => handleSoundClick(drum, 'drum')}
                style={{ padding: '15px', borderRadius: '8px', border: '2px solid transparent', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>
                {drum}
              </button>
            ))}
          </div>
        )}
        
        <button onClick={onClose} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', marginTop: '20px' }}>Cancel</button>
      </div>
    </div>
  )
}

function TutorialCard({ id, name, difficulty, length, onStart, active }) {
  const colors = { 'Beginner': '#4ade80', 'Easy': '#22c55e', 'Medium': '#eab308', 'Hard': '#ef4444' }
  return (
    <div onClick={() => onStart(id)}
      style={{ background: active ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)', border: active ? '2px solid #4ade80' : '2px solid transparent',
        borderRadius: '12px', padding: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>
      <h4 style={{ marginBottom: '8px' }}>{name}</h4>
      <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', opacity: 0.7 }}>
        <span style={{ color: colors[difficulty] }}>{difficulty}</span>
        <span>•</span>
        <span>{length} notes</span>
      </div>
    </div>
  )
}

function RecordingCard({ recording, onPlay, onEdit, onDelete, isPlaying }) {
  return (
    <div style={{ background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)', border: isPlaying ? '2px solid #ef4444' : '2px solid transparent',
      borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h4 style={{ marginBottom: '5px' }}>{recording.name}</h4>
        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{recording.events.length} notes • {recording.duration.toFixed(1)}s</div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={(e) => { e.stopPropagation(); onPlay(recording); }}
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: isPlaying ? '#ef4444' : '#4ade80', color: 'white', cursor: 'pointer', fontSize: '1.1rem' }}>
          {isPlaying ? '⏹' : '▶️'}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(recording); }}
          style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#8b5cf6', color: 'white', cursor: 'pointer' }}>✏️</button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(recording.id); }}
          style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>🗑</button>
      </div>
    </div>
  )
}

function CreatorMode({ recording, onSave, onClose, ws, connected }) {
  const [events, setEvents] = useState(recording.events || [])
  const [name, setName] = useState(recording.name || '')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const playbackRef = useRef(null)
  const duration = Math.max(recording.duration || 0, events.length > 0 ? Math.max(...events.map(e => e.time)) + 1 : 5)
  const pixelsPerSecond = 100
  
  const moveEvent = (index, newTime) => {
    const newEvents = [...events]
    newEvents[index] = { ...newEvents[index], time: Math.max(0, newTime) }
    newEvents.sort((a, b) => a.time - b.time)
    setEvents(newEvents)
  }
  
  const deleteEvent = (index) => { setEvents(events.filter((_, i) => i !== index)); setSelectedEvent(null) }
  
  const handleDrag = (e, index) => {
    const track = e.currentTarget.closest('[data-track]')
    if (!track) return
    const rect = track.getBoundingClientRect()
    const x = e.clientX - rect.left
    moveEvent(index, Math.max(0, x / pixelsPerSecond))
  }
  
  const playRecording = () => {
    if (!connected) { alert('Please connect and calibrate first to hear playback'); return }
    if (isPlaying) {
      setIsPlaying(false); setPlaybackTime(0)
      if (playbackRef.current) clearInterval(playbackRef.current)
      ws.current?.send(JSON.stringify({ type: 'stop_playback' }))
    } else {
      setIsPlaying(true); setPlaybackTime(0)
      const startTime = Date.now()
      ws.current?.send(JSON.stringify({ type: 'playback', recording: { events, preset: recording.preset || 'piano' } }))
      playbackRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        setPlaybackTime(elapsed)
        if (elapsed >= duration) { setIsPlaying(false); setPlaybackTime(0); clearInterval(playbackRef.current) }
      }, 50)
    }
  }
  
  useEffect(() => { return () => { if (playbackRef.current) clearInterval(playbackRef.current) } }, [])
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0f172a', zIndex: 100, overflow: 'auto' }}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>← Back</button>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Recording name..."
              style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1.2rem', width: '250px' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={playRecording} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: isPlaying ? '#ef4444' : '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {isPlaying ? '⏹ Stop' : '▶️ Play'}
            </button>
            <button onClick={() => onSave({ ...recording, name, events, duration })}
              style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#4ade80', color: 'black', cursor: 'pointer', fontWeight: 'bold' }}>�� Save</button>
          </div>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', marginBottom: '20px', overflowX: 'auto' }}>
          <h3 style={{ marginBottom: '15px' }}>🎼 Timeline</h3>
          <div style={{ position: 'relative', marginLeft: '80px', marginBottom: '10px', height: '20px' }}>
            {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
              <div key={i} style={{ position: 'absolute', left: `${i * pixelsPerSecond}px`, fontSize: '0.8rem', opacity: 0.5 }}>{i}s</div>
            ))}
            {isPlaying && <div style={{ position: 'absolute', left: `${playbackTime * pixelsPerSecond}px`, top: 0, bottom: '-200px', width: '2px', background: '#ef4444', zIndex: 10, pointerEvents: 'none' }} />}
          </div>
          {FINGERS.map(finger => (
            <div key={finger} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ width: '80px', fontSize: '0.85rem', color: FINGER_COLORS[finger], fontWeight: 'bold', flexShrink: 0 }}>{finger}</div>
              <div data-track style={{ flex: 1, height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', position: 'relative', minWidth: `${Math.max(duration, 5) * pixelsPerSecond}px` }}>
                {Array.from({ length: Math.ceil(duration) }, (_, i) => (
                  <div key={i} style={{ position: 'absolute', left: `${(i + 1) * pixelsPerSecond}px`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                ))}
                {events.map((event, idx) => {
                  if (!event.fingers.includes(finger)) return null
                  const sound = event.sounds?.find(s => s.finger === finger)
                  return (
                    <div key={idx} draggable onDragEnd={(e) => handleDrag(e, idx)} onClick={() => setSelectedEvent(selectedEvent === idx ? null : idx)}
                      style={{ position: 'absolute', left: `${event.time * pixelsPerSecond}px`, top: '4px', height: '32px', minWidth: '40px', padding: '0 8px',
                        background: selectedEvent === idx ? '#4ade80' : FINGER_COLORS[finger], borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'grab', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: selectedEvent === idx ? '0 0 10px #4ade80' : 'none', zIndex: selectedEvent === idx ? 5 : 1 }}>
                      {sound?.sound?.split('_oct')[0]?.split('_inv')[0] || '♪'}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        
        {selectedEvent !== null && events[selectedEvent] && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '15px' }}>Selected Note</h4>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <span style={{ opacity: 0.6, marginRight: '10px' }}>Time:</span>
                <input type="number" step="0.1" value={events[selectedEvent].time.toFixed(2)} onChange={(e) => moveEvent(selectedEvent, parseFloat(e.target.value) || 0)}
                  style={{ padding: '8px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', width: '80px' }} />
                <span style={{ opacity: 0.6, marginLeft: '5px' }}>s</span>
              </div>
              <div><span style={{ opacity: 0.6, marginRight: '10px' }}>Fingers:</span><span>{events[selectedEvent].fingers.join(', ')}</span></div>
              <button onClick={() => deleteEvent(selectedEvent)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}>🗑 Delete</button>
            </div>
          </div>
        )}
        <div style={{ opacity: 0.6, fontSize: '0.9rem' }}><p>💡 Drag notes to move them • Click to select • Press Play to preview</p></div>
      </div>
    </div>
  )
}

function SaveRecordingModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#1e293b', borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '90%' }}>
        <h3 style={{ marginBottom: '20px' }}>Save Recording</h3>
        <input type="text" placeholder="Recording name..." value={name} onChange={(e) => setName(e.target.value)} autoFocus
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', marginBottom: '20px', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => name.trim() && onSave(name.trim())} disabled={!name.trim()}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: name.trim() ? '#4ade80' : '#555', color: 'white', cursor: name.trim() ? 'pointer' : 'default' }}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [connected, setConnected] = useState(false)
  const [calibrated, setCalibrated] = useState(false)
  const [activeFingers, setActiveFingers] = useState([])
  const [currentPreset, setCurrentPreset] = useState('piano')
  const [presets, setPresets] = useState(DEFAULT_PRESETS)
  const [drums, setDrums] = useState(DEFAULT_DRUMS)
  const [tutorials, setTutorials] = useState(DEFAULT_TUTORIALS)
  const [selectedFinger, setSelectedFinger] = useState(null)
  const [customTypes, setCustomTypes] = useState({ thumb: 'note', index: 'note', middle: 'note', ring: 'note', pinky: 'note' })
  const [threshold, setThreshold] = useState(0.15)
  const [showSettings, setShowSettings] = useState(false)
  const [mode, setMode] = useState('play')
  const [tab, setTab] = useState('play')
  const [tutorialState, setTutorialState] = useState({ current: null, name: '', step: 0, total: 0, nextFinger: null, sequence: [], completed: false })
  
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState(() => {
    const saved = localStorage.getItem('ripple-recordings')
    return saved ? JSON.parse(saved) : []
  })
  const [pendingRecording, setPendingRecording] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [playingId, setPlayingId] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [creatorRecording, setCreatorRecording] = useState(null)
  const recordingTimerRef = useRef(null)
  
  const ws = useRef(null)

  useEffect(() => { localStorage.setItem('ripple-recordings', JSON.stringify(recordings)) }, [recordings])

  useEffect(() => {
    const connectWs = () => {
      ws.current = new WebSocket('ws://localhost:8000/ws')
      ws.current.onopen = () => console.log('WebSocket connected')
      ws.current.onclose = () => {
        console.log('WebSocket disconnected')
        setConnected(false)
        setCalibrated(false)
      }
      ws.current.onerror = () => console.log('WebSocket error')
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'init') {
          setPresets(data.presets || DEFAULT_PRESETS)
          setDrums(data.drums || DEFAULT_DRUMS)
          setTutorials(data.tutorials || DEFAULT_TUTORIALS)
          setCurrentPreset(data.state?.current_preset || 'piano')
          setConnected(data.state?.connected || false)
          setCalibrated(data.state?.calibrated || false)
          setCustomTypes(data.custom_types || { thumb: 'note', index: 'note', middle: 'note', ring: 'note', pinky: 'note' })
        } else if (data.type === 'status') { setConnected(data.connected); if (data.calibrated !== undefined) setCalibrated(data.calibrated)
        } else if (data.type === 'calibrated') { setCalibrated(true)
        } else if (data.type === 'fingers') { setActiveFingers(data.active)
        } else if (data.type === 'preset_changed') { setCurrentPreset(data.preset)
        } else if (data.type === 'mapping_updated') {
          setPresets(prev => ({ ...prev, custom: { ...prev.custom, mapping: { ...prev.custom?.mapping, [data.finger]: data.sound } } }))
          if (data.custom_types) setCustomTypes(data.custom_types)
        } else if (data.type === 'tutorial_started') {
          setMode('tutorial'); setTutorialState({ current: data.tutorial, name: data.name, step: 0, total: data.total, nextFinger: data.next_finger, sequence: data.sequence, completed: false })
        } else if (data.type === 'tutorial_progress') { setTutorialState(prev => ({ ...prev, step: data.step, nextFinger: data.next_finger }))
        } else if (data.type === 'tutorial_complete') { setTutorialState(prev => ({ ...prev, completed: true, nextFinger: null }))
        } else if (data.type === 'tutorial_reset') { setTutorialState(prev => ({ ...prev, step: 0, nextFinger: data.next_finger, completed: false }))
        } else if (data.type === 'recording_started') {
          setIsRecording(true); setRecordingTime(0); recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 0.1), 100)
        } else if (data.type === 'recording_stopped') {
          setIsRecording(false); clearInterval(recordingTimerRef.current)
          if (data.recording.events.length > 0) { setPendingRecording(data.recording); setShowSaveModal(true) }
        } else if (data.type === 'playback_stopped') { setPlayingId(null) }
      }
    }
    connectWs()
    return () => ws.current?.close()
  }, [])

  const send = (msg) => { if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(msg)) }
  const connect = () => send({ type: 'connect' })
  const disconnect = () => send({ type: 'disconnect' })
  const calibrate = () => send({ type: 'calibrate' })
  const selectPreset = (preset) => { setCurrentPreset(preset); send({ type: 'set_preset', preset }) }
  const startTutorial = (id) => send({ type: 'start_tutorial', tutorial: id })
  const resetTutorial = () => send({ type: 'reset_tutorial' })
  const exitTutorial = () => { send({ type: 'set_mode', mode: 'play' }); setMode('play'); setTutorialState({ current: null, name: '', step: 0, total: 0, nextFinger: null, sequence: [], completed: false }) }
  const handleFingerClick = (finger) => setSelectedFinger(finger)
  const handleSoundSelect = (sound, soundType) => { 
    setPresets(prev => ({ ...prev, custom: { ...prev.custom, mapping: { ...prev.custom?.mapping, [selectedFinger]: sound } } }))
    setCustomTypes(prev => ({ ...prev, [selectedFinger]: soundType }))
    send({ type: 'set_mapping', finger: selectedFinger, sound, sound_type: soundType })
    setSelectedFinger(null) 
  }
  const updateThreshold = (val) => { setThreshold(val); send({ type: 'set_threshold', value: val }) }
  const startRecording = () => send({ type: 'start_recording' })
  const stopRecording = () => send({ type: 'stop_recording' })
  
  const saveRecording = (name) => {
    if (pendingRecording) { setRecordings(prev => [...prev, { id: Date.now(), name, ...pendingRecording }]); setPendingRecording(null); setShowSaveModal(false) }
  }
  
  const playRecording = (recording) => {
    if (!connected) { alert('Please connect and calibrate the device first to hear playback'); return }
    if (playingId === recording.id) { send({ type: 'stop_playback' }); setPlayingId(null) }
    else { setPlayingId(recording.id); send({ type: 'playback', recording }) }
  }
  
  const editRecording = (recording) => setCreatorRecording(recording)
  const saveCreatorRecording = (updatedRecording) => { setRecordings(prev => prev.map(r => r.id === updatedRecording.id ? updatedRecording : r)); setCreatorRecording(null) }
  const deleteRecording = (id) => setRecordings(prev => prev.filter(r => r.id !== id))

  const currentMapping = presets[currentPreset]?.mapping || {}

  if (creatorRecording) return <CreatorMode recording={creatorRecording} onSave={saveCreatorRecording} onClose={() => setCreatorRecording(null)} ws={ws} connected={connected} />

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '5px' }}>🎵 Ripple</h1>
        <p style={{ opacity: 0.6 }}>Music Therapy System</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {!connected ? <button onClick={connect} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>Connect</button>
          : <button onClick={disconnect} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}>Disconnect</button>}
        <button onClick={calibrate} disabled={!connected || calibrated}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: calibrated ? '#4ade80' : connected ? '#8b5cf6' : '#555', color: 'white', cursor: !connected || calibrated ? 'default' : 'pointer' }}>
          {calibrated ? '✓ Calibrated' : 'Calibrate'}</button>
        <button onClick={() => setShowSettings(!showSettings)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>⚙️ Settings</button>
      </div>

      {showSettings && (
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '20px', marginBottom: '25px' }}>
          <h3 style={{ marginBottom: '15px' }}>Sensitivity: {Math.round(threshold * 100)}%</h3>
          <input type="range" min="0.05" max="0.4" step="0.01" value={threshold} onChange={(e) => updateThreshold(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { setTab('play'); exitTutorial() }} style={{ padding: '12px 24px', borderRadius: '12px', border: tab === 'play' ? '2px solid #3b82f6' : '2px solid transparent', background: tab === 'play' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>🎹 Play</button>
        <button onClick={() => setTab('tutorial')} style={{ padding: '12px 24px', borderRadius: '12px', border: tab === 'tutorial' ? '2px solid #8b5cf6' : '2px solid transparent', background: tab === 'tutorial' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>📚 Tutorial</button>
        <button onClick={() => setTab('recordings')} style={{ padding: '12px 24px', borderRadius: '12px', border: tab === 'recordings' ? '2px solid #ef4444' : '2px solid transparent', background: tab === 'recordings' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>🎙 Recordings</button>
      </div>

      {tab === 'play' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.entries(presets).map(([key, preset]) => (
              <button key={key} onClick={() => selectPreset(key)} style={{ padding: '12px 20px', borderRadius: '12px', border: currentPreset === key ? '2px solid #4ade80' : '2px solid transparent', background: currentPreset === key ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>{preset.name}</button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
            {!isRecording ? <button onClick={startRecording} disabled={!calibrated} style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: calibrated ? '#ef4444' : '#555', color: 'white', cursor: calibrated ? 'pointer' : 'default' }}>🔴 Start Recording</button>
              : <button onClick={stopRecording} style={{ padding: '12px 24px', borderRadius: '12px', border: '2px solid #ef4444', background: 'rgba(239, 68, 68, 0.2)', color: 'white', cursor: 'pointer', animation: 'pulse 1s infinite' }}>⏹ Stop Recording ({recordingTime.toFixed(1)}s)</button>}
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', marginBottom: '25px' }}>
            <Hand activeFingers={activeFingers} mapping={currentMapping} onFingerClick={currentPreset === 'custom' ? handleFingerClick : null} />
            <p style={{ textAlign: 'center', opacity: 0.6, marginTop: '10px' }}>
              {isRecording ? '🔴 Recording...' : activeFingers.length > 0 ? `Playing: ${activeFingers.map(f => (currentMapping[f] || '').split('_oct')[0].split('_inv')[0]).join(' + ')}` : currentPreset === 'custom' ? 'Click a finger to customize' : 'Bend fingers to play'}
            </p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '15px', padding: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Current Mapping</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '10px' }}>
              {FINGERS.map(finger => {
                const fullSound = currentMapping[finger] || '-'
                const displaySound = fullSound.split('_oct')[0].split('_inv')[0]
                const octave = fullSound.match(/_oct(\d)/)?.[1]
                const inv = fullSound.match(/_inv(\d)/)?.[1]
                return (
                  <div key={finger} onClick={() => currentPreset === 'custom' && handleFingerClick(finger)}
                    style={{ textAlign: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', cursor: currentPreset === 'custom' ? 'pointer' : 'default' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: FINGER_COLORS[finger] }}>{displaySound}</div>
                    {(octave || inv) && <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{octave ? `Oct ${octave}` : ''}{inv ? ` Inv ${inv}` : ''}</div>}
                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{currentPreset === 'custom' && customTypes[finger] ? customTypes[finger] : ''}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{finger}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {tab === 'tutorial' && mode !== 'tutorial' && (
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '25px' }}>
          <h2 style={{ marginBottom: '20px' }}>Choose a Song</h2>
          <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
            {Object.entries(tutorials).map(([id, tutorial]) => (
              <TutorialCard key={id} id={id} name={tutorial.name} difficulty={tutorial.difficulty} length={tutorial.length} onStart={startTutorial} active={tutorialState.current === id} />
            ))}
          </div>
        </div>
      )}

      {tab === 'tutorial' && mode === 'tutorial' && (
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>{tutorialState.name}</h2>
            <button onClick={exitTutorial} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>✕ Exit</button>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}><span>Progress</span><span>{tutorialState.step} / {tutorialState.total}</span></div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
              <div style={{ background: tutorialState.completed ? '#4ade80' : '#8b5cf6', height: '100%', width: `${(tutorialState.step / tutorialState.total) * 100}%`, transition: 'width 0.3s ease' }} />
            </div>
          </div>
          <Hand activeFingers={activeFingers} mapping={NOTE_NAMES} highlightFinger={tutorialState.nextFinger} />
          {tutorialState.completed ? (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <h3 style={{ color: '#4ade80', marginBottom: '15px' }}>🎉 Congratulations!</h3>
              <p style={{ marginBottom: '20px', opacity: 0.7 }}>You completed the song!</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={resetTutorial} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#8b5cf6', color: 'white', cursor: 'pointer' }}>🔄 Play Again</button>
                <button onClick={exitTutorial} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>Choose Another</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ fontSize: '1.2rem' }}>Press: <span style={{ color: FINGER_COLORS[tutorialState.nextFinger], fontWeight: 'bold', fontSize: '1.5rem' }}>{tutorialState.nextFinger?.toUpperCase()} ({NOTE_NAMES[tutorialState.nextFinger]})</span></p>
              <button onClick={resetTutorial} style={{ marginTop: '15px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>🔄 Restart</button>
            </div>
          )}
          <div style={{ marginTop: '25px' }}>
            <h4 style={{ marginBottom: '10px', opacity: 0.7 }}>Sequence</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {tutorialState.sequence.map((finger, i) => (
                <div key={i} style={{ width: '30px', height: '30px', borderRadius: '6px', background: i < tutorialState.step ? '#4ade80' : i === tutorialState.step ? FINGER_COLORS[finger] : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', opacity: i < tutorialState.step ? 0.5 : 1 }}>{NOTE_NAMES[finger]}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'recordings' && (
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '25px' }}>
          <h2 style={{ marginBottom: '20px' }}>🎙 My Recordings</h2>
          {!connected && <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '10px', padding: '15px', marginBottom: '20px' }}>⚠️ Connect and calibrate the device to play recordings with sound</div>}
          {recordings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}><p style={{ marginBottom: '15px' }}>No recordings yet!</p><p>Go to Play tab and click "Start Recording" to create one.</p></div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {recordings.map(recording => <RecordingCard key={recording.id} recording={recording} onPlay={playRecording} onEdit={editRecording} onDelete={deleteRecording} isPlaying={playingId === recording.id} />)}
            </div>
          )}
        </div>
      )}

      {selectedFinger && <SoundSelector drums={drums} currentSound={currentMapping[selectedFinger]} currentType={customTypes[selectedFinger]} onSelect={handleSoundSelect} onClose={() => setSelectedFinger(null)} />}
      {showSaveModal && <SaveRecordingModal onSave={saveRecording} onClose={() => { setShowSaveModal(false); setPendingRecording(null) }} />}
    </div>
  )
}
