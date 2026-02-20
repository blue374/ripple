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

function Hand({ activeFingers, mapping, onFingerClick, highlightFinger }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '30px' }}>
      {FINGERS.map(finger => {
        const isActive = activeFingers.includes(finger)
        const isHighlighted = finger === highlightFinger
        const color = FINGER_COLORS[finger]
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
              boxShadow: isActive ? `0 0 25px ${color}66` : isHighlighted ? `0 0 20px ${color}44, inset 0 0 20px ${color}22` : 'none',
              marginTop: finger === 'thumb' ? '55px' : finger === 'pinky' ? '25px' : finger === 'index' || finger === 'ring' ? '8px' : '0',
              cursor: onFingerClick ? 'pointer' : 'default',
              border: isHighlighted ? `3px solid ${color}` : onFingerClick ? '2px solid rgba(255,255,255,0.3)' : 'none',
              animation: isHighlighted ? 'pulse 1s infinite' : 'none',
            }}
          >
            <span style={{ fontWeight: 'bold', fontSize: '0.85rem', opacity: 0.9 }}>{mapping?.[finger] || NOTE_NAMES[finger]}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '2px' }}>{finger}</span>
          </div>
        )
      })}
    </div>
  )
}

function ChordSelector({ chords, currentChord, onSelect, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#1e293b', borderRadius: '20px', padding: '30px', maxWidth: '500px', width: '90%' }}>
        <h3 style={{ marginBottom: '20px' }}>Select Chord</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {chords.map(chord => (
            <button key={chord} onClick={() => onSelect(chord)}
              style={{ padding: '12px', borderRadius: '8px', border: chord === currentChord ? '2px solid #4ade80' : '2px solid transparent',
                background: chord === currentChord ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
              {chord}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}>Cancel</button>
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

function RecordingCard({ recording, onPlay, onDelete, isPlaying }) {
  return (
    <div style={{ 
      background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)', 
      border: isPlaying ? '2px solid #ef4444' : '2px solid transparent',
      borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
    }}>
      <div>
        <h4 style={{ marginBottom: '5px' }}>{recording.name}</h4>
        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          {recording.events.length} notes • {recording.duration.toFixed(1)}s
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => onPlay(recording)}
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: isPlaying ? '#ef4444' : '#4ade80', color: 'white', cursor: 'pointer' }}>
          {isPlaying ? '⏹' : '▶'}
        </button>
        <button onClick={() => onDelete(recording.id)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>
          🗑
        </button>
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
        <input
          type="text"
          placeholder="Recording name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', marginBottom: '20px' }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => name.trim() && onSave(name.trim())}
            disabled={!name.trim()}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: name.trim() ? '#4ade80' : '#555', color: 'white', cursor: name.trim() ? 'pointer' : 'default' }}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [connected, setConnected] = useState(false)
  const [calibrated, setCalibrated] = useState(false)
  const [activeFingers, setActiveFingers] = useState([])
  const [currentPreset, setCurrentPreset] = useState('therapy')
  const [presets, setPresets] = useState({})
  const [chords, setChords] = useState([])
  const [tutorials, setTutorials] = useState({})
  const [selectedFinger, setSelectedFinger] = useState(null)
  const [threshold, setThreshold] = useState(0.15)
  const [showSettings, setShowSettings] = useState(false)
  const [mode, setMode] = useState('play')
  const [tab, setTab] = useState('play')
  const [tutorialState, setTutorialState] = useState({ current: null, name: '', step: 0, total: 0, nextFinger: null, sequence: [], completed: false })
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState(() => {
    const saved = localStorage.getItem('ripple-recordings')
    return saved ? JSON.parse(saved) : []
  })
  const [pendingRecording, setPendingRecording] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [playingId, setPlayingId] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingTimerRef = useRef(null)
  
  const ws = useRef(null)

  // Save recordings to localStorage
  useEffect(() => {
    localStorage.setItem('ripple-recordings', JSON.stringify(recordings))
  }, [recordings])

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000/ws')
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'init') {
        setPresets(data.presets); setChords(data.chords); setTutorials(data.tutorials)
        setCurrentPreset(data.state.current_preset); setConnected(data.state.connected); setCalibrated(data.state.calibrated)
      } else if (data.type === 'status') {
        setConnected(data.connected); if (data.calibrated !== undefined) setCalibrated(data.calibrated)
      } else if (data.type === 'calibrated') { setCalibrated(true)
      } else if (data.type === 'fingers') { setActiveFingers(data.active)
      } else if (data.type === 'preset_changed') { setCurrentPreset(data.preset)
      } else if (data.type === 'mapping_updated') {
        setPresets(prev => ({ ...prev, custom: { ...prev.custom, mapping: { ...prev.custom?.mapping, [data.finger]: data.chord } } }))
      } else if (data.type === 'tutorial_started') {
        setMode('tutorial'); setTutorialState({ current: data.tutorial, name: data.name, step: 0, total: data.total, nextFinger: data.next_finger, sequence: data.sequence, completed: false })
      } else if (data.type === 'tutorial_progress') {
        setTutorialState(prev => ({ ...prev, step: data.step, nextFinger: data.next_finger }))
      } else if (data.type === 'tutorial_complete') {
        setTutorialState(prev => ({ ...prev, completed: true, nextFinger: null }))
      } else if (data.type === 'tutorial_reset') {
        setTutorialState(prev => ({ ...prev, step: 0, nextFinger: data.next_finger, completed: false }))
      } else if (data.type === 'recording_started') {
        setIsRecording(true)
        setRecordingTime(0)
        recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 0.1), 100)
      } else if (data.type === 'recording_stopped') {
        setIsRecording(false)
        clearInterval(recordingTimerRef.current)
        if (data.recording.events.length > 0) {
          setPendingRecording(data.recording)
          setShowSaveModal(true)
        }
      } else if (data.type === 'playback_started') {
        // Playing
      } else if (data.type === 'playback_stopped') {
        setPlayingId(null)
      }
    }
    return () => ws.current?.close()
  }, [])

  const connect = () => ws.current?.send(JSON.stringify({ type: 'connect' }))
  const disconnect = () => ws.current?.send(JSON.stringify({ type: 'disconnect' }))
  const calibrate = () => ws.current?.send(JSON.stringify({ type: 'calibrate' }))
  const selectPreset = (preset) => ws.current?.send(JSON.stringify({ type: 'set_preset', preset }))
  const startTutorial = (id) => ws.current?.send(JSON.stringify({ type: 'start_tutorial', tutorial: id }))
  const resetTutorial = () => ws.current?.send(JSON.stringify({ type: 'reset_tutorial' }))
  const exitTutorial = () => { ws.current?.send(JSON.stringify({ type: 'set_mode', mode: 'play' })); setMode('play'); setTutorialState({ current: null, name: '', step: 0, total: 0, nextFinger: null, sequence: [], completed: false }) }
  const handleFingerClick = (finger) => setSelectedFinger(finger)
  const handleChordSelect = (chord) => { ws.current?.send(JSON.stringify({ type: 'set_mapping', finger: selectedFinger, chord })); setSelectedFinger(null) }
  const updateThreshold = (val) => { setThreshold(val); ws.current?.send(JSON.stringify({ type: 'set_threshold', value: val })) }

  // Recording functions
  const startRecording = () => ws.current?.send(JSON.stringify({ type: 'start_recording' }))
  const stopRecording = () => ws.current?.send(JSON.stringify({ type: 'stop_recording' }))
  
  const saveRecording = (name) => {
    if (pendingRecording) {
      const newRecording = {
        id: Date.now(),
        name,
        ...pendingRecording
      }
      setRecordings(prev => [...prev, newRecording])
      setPendingRecording(null)
      setShowSaveModal(false)
    }
  }
  
  const playRecording = (recording) => {
    if (playingId === recording.id) {
      ws.current?.send(JSON.stringify({ type: 'stop_playback' }))
      setPlayingId(null)
    } else {
      setPlayingId(recording.id)
      ws.current?.send(JSON.stringify({ type: 'playback', recording, preset: recording.preset }))
    }
  }
  
  const deleteRecording = (id) => {
    setRecordings(prev => prev.filter(r => r.id !== id))
  }

  const currentMapping = presets[currentPreset]?.mapping || {}

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '5px' }}>🎵 Ripple</h1>
        <p style={{ opacity: 0.6 }}>Music Therapy System</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {!connected ? (
          <button onClick={connect} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>Connect</button>
        ) : (
          <button onClick={disconnect} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}>Disconnect</button>
        )}
        <button onClick={calibrate} disabled={!connected || calibrated}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: calibrated ? '#4ade80' : connected ? '#8b5cf6' : '#555', color: 'white', cursor: !connected || calibrated ? 'default' : 'pointer' }}>
          {calibrated ? '✓ Calibrated' : 'Calibrate'}
        </button>
        <button onClick={() => setShowSettings(!showSettings)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>⚙️ Settings</button>
      </div>

      {showSettings && (
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '20px', marginBottom: '25px' }}>
          <h3 style={{ marginBottom: '15px' }}>Sensitivity: {Math.round(threshold * 100)}%</h3>
          <input type="range" min="0.05" max="0.4" step="0.01" value={threshold} onChange={(e) => updateThreshold(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', justifyContent: 'center' }}>
        <button onClick={() => { setTab('play'); exitTutorial(); }}
          style={{ padding: '12px 24px', borderRadius: '12px', border: tab === 'play' ? '2px solid #3b82f6' : '2px solid transparent',
            background: tab === 'play' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>🎹 Play</button>
        <button onClick={() => setTab('tutorial')}
          style={{ padding: '12px 24px', borderRadius: '12px', border: tab === 'tutorial' ? '2px solid #8b5cf6' : '2px solid transparent',
            background: tab === 'tutorial' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>📚 Tutorial</button>
        <button onClick={() => setTab('recordings')}
          style={{ padding: '12px 24px', borderRadius: '12px', border: tab === 'recordings' ? '2px solid #ef4444' : '2px solid transparent',
            background: tab === 'recordings' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>🎙 Recordings</button>
      </div>

      {tab === 'play' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.entries(presets).map(([key, preset]) => (
              <button key={key} onClick={() => selectPreset(key)}
                style={{ padding: '12px 20px', borderRadius: '12px', border: currentPreset === key ? '2px solid #4ade80' : '2px solid transparent',
                  background: currentPreset === key ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>{preset.name}</button>
            ))}
          </div>
          
          {/* Recording controls */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
            {!isRecording ? (
              <button onClick={startRecording} disabled={!calibrated}
                style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: calibrated ? '#ef4444' : '#555', color: 'white', cursor: calibrated ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔴 Start Recording
              </button>
            ) : (
              <button onClick={stopRecording}
                style={{ padding: '12px 24px', borderRadius: '12px', border: '2px solid #ef4444', background: 'rgba(239, 68, 68, 0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', animation: 'pulse 1s infinite' }}>
                ⏹ Stop Recording ({recordingTime.toFixed(1)}s)
              </button>
            )}
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', marginBottom: '25px' }}>
            <Hand activeFingers={activeFingers} mapping={currentMapping} onFingerClick={currentPreset === 'custom' ? handleFingerClick : null} />
            <p style={{ textAlign: 'center', opacity: 0.6, marginTop: '10px' }}>
              {isRecording ? '🔴 Recording...' : activeFingers.length > 0 ? `Playing: ${activeFingers.map(f => currentMapping[f]).join(' + ')}` : currentPreset === 'custom' ? 'Click a finger to customize' : 'Bend fingers to play'}
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '15px', padding: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Current Mapping</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '10px' }}>
              {FINGERS.map(finger => (
                <div key={finger} onClick={() => currentPreset === 'custom' && handleFingerClick(finger)}
                  style={{ textAlign: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', cursor: currentPreset === 'custom' ? 'pointer' : 'default' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: FINGER_COLORS[finger] }}>{currentMapping[finger]}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{finger}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'tutorial' && mode !== 'tutorial' && (
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '25px' }}>
          <h2 style={{ marginBottom: '20px' }}>Choose a Song</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
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
                <div key={i} style={{ width: '30px', height: '30px', borderRadius: '6px',
                  background: i < tutorialState.step ? '#4ade80' : i === tutorialState.step ? FINGER_COLORS[finger] : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', opacity: i < tutorialState.step ? 0.5 : 1 }}>{NOTE_NAMES[finger]}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'recordings' && (
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '25px' }}>
          <h2 style={{ marginBottom: '20px' }}>🎙 My Recordings</h2>
          
          {recordings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
              <p style={{ marginBottom: '15px' }}>No recordings yet!</p>
              <p>Go to Play tab and click "Start Recording" to create one.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {recordings.map(recording => (
                <RecordingCard
                  key={recording.id}
                  recording={recording}
                  onPlay={playRecording}
                  onDelete={deleteRecording}
                  isPlaying={playingId === recording.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedFinger && <ChordSelector chords={chords} currentChord={currentMapping[selectedFinger]} onSelect={handleChordSelect} onClose={() => setSelectedFinger(null)} />}
      
      {showSaveModal && <SaveRecordingModal onSave={saveRecording} onClose={() => { setShowSaveModal(false); setPendingRecording(null); }} />}
    </div>
  )
}
