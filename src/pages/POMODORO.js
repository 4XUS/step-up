import React, { useState, useEffect, useRef, useCallback } from 'react';
import ToolLayout from '../components/ToolLayout';
import '../styles/Pomodoro.css';

// ─── Config ──────────────────────────────────────────────────────
const MODES = {
  pomodoro:   { label: 'Pomodoro',    minutes: 25, color: '#ba4949', bg: '#c15c5c' },
  shortBreak: { label: 'Short Break', minutes: 5,  color: '#38858a', bg: '#4c9196' },
  longBreak:  { label: 'Long Break',  minutes: 15, color: '#457c9c', bg: '#5b8fa8' },
};

// ─── Helpers ─────────────────────────────────────────────────────
function padZero(n) { return n.toString().padStart(2, '0'); }

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${padZero(m)}:${padZero(s)}`;
}

// ─── Alarm sound (simple beep using Web Audio API) ───────────────
function playAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playBeep = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    // 3 beeps
    playBeep(880, ctx.currentTime, 0.2);
    playBeep(880, ctx.currentTime + 0.3, 0.2);
    playBeep(880, ctx.currentTime + 0.6, 0.4);
  } catch (e) { /* silent fail */ }
}

// ─── Component ───────────────────────────────────────────────────
const POMODORO = () => {
  const [mode, setMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // Tasks
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPomos, setNewTaskPomos] = useState(1);
  const [newTaskNote, setNewTaskNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [nextId, setNextId] = useState(1);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const intervalRef = useRef(null);
  const titleRef = useRef(document.title);

  const config = MODES[mode];

  // ─── Switch mode ──────
  const switchMode = useCallback((newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].minutes * 60);
    clearInterval(intervalRef.current);
  }, []);

  // ─── Timer tick ──────
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            playAlarm();

            // Auto-advance
            if (mode === 'pomodoro') {
              setPomodoroCount(c => c + 1);
              // Increment active task completed pomos
              if (activeTaskId) {
                setTasks(prev => prev.map(t =>
                  t.id === activeTaskId ? { ...t, completedPomos: t.completedPomos + 1 } : t
                ));
              }
              // Every 4 pomodoros → long break, else short break
              const nextCount = pomodoroCount + 1;
              if (nextCount % 4 === 0) {
                switchMode('longBreak');
              } else {
                switchMode('shortBreak');
              }
            } else {
              switchMode('pomodoro');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode, pomodoroCount, activeTaskId, switchMode]);

  // ─── Update browser tab title ──────
  useEffect(() => {
    const originalTitle = titleRef.current;
    if (isRunning) {
      document.title = `${formatTime(timeLeft)} - ${config.label}`;
    } else {
      document.title = originalTitle;
    }
    return () => { document.title = originalTitle; };
  }, [timeLeft, isRunning, config.label]);

  // ─── Toggle start/pause ──────
  const toggleTimer = () => {
    setIsRunning(prev => !prev);
  };

  // ─── Reset ──────
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(config.minutes * 60);
    clearInterval(intervalRef.current);
  };

  // ─── Add task ──────
  const handleSaveTask = () => {
    if (!newTaskTitle.trim()) return;
    const task = {
      id: nextId,
      title: newTaskTitle.trim(),
      estPomos: newTaskPomos,
      completedPomos: 0,
      note: newTaskNote.trim(),
      done: false,
    };
    setTasks(prev => [...prev, task]);
    setNextId(prev => prev + 1);
    if (!activeTaskId) setActiveTaskId(task.id);
    // Reset form but keep open
    setNewTaskTitle('');
    setNewTaskPomos(1);
    setNewTaskNote('');
    setShowNote(false);
  };

  // ─── Toggle done ──────
  const toggleDone = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  // ─── Delete task ──────
  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTaskId === id) {
      const remaining = tasks.filter(t => t.id !== id && !t.done);
      setActiveTaskId(remaining.length > 0 ? remaining[0].id : null);
    }
    setEditingTaskId(null);
  };

  // ─── Select active task ──────
  const selectTask = (id) => {
    setActiveTaskId(id);
    setEditingTaskId(null);
  };

  // ─── Summary ──────
  const totalEstPomos = tasks.filter(t => !t.done).reduce((sum, t) => sum + t.estPomos, 0);
  const totalDonePomos = tasks.filter(t => !t.done).reduce((sum, t) => sum + t.completedPomos, 0);
  const remainingPomos = Math.max(0, totalEstPomos - totalDonePomos);
  const finishMinutes = remainingPomos * MODES.pomodoro.minutes + (remainingPomos > 0 ? (remainingPomos - 1) * MODES.shortBreak.minutes : 0);
  const finishTime = new Date(Date.now() + finishMinutes * 60000);
  const finishHours = (finishMinutes / 60).toFixed(1);

  const activeTask = tasks.find(t => t.id === activeTaskId);

  // ─── Clear all done ──────
  const clearDone = () => {
    setTasks(prev => prev.filter(t => !t.done));
  };

  // ─── Clear all ──────
  const clearAll = () => {
    setTasks([]);
    setActiveTaskId(null);
  };

  return (
    <ToolLayout>
      <div className="pomo-page" style={{ '--pomo-color': config.color, '--pomo-bg': config.bg }}>
        <div className="pomo-wrapper">
          {/* ─── TIMER CARD ─── */}
          <div className="pomo-card">
            {/* Mode tabs */}
            <div className="pomo-tabs">
              {Object.entries(MODES).map(([key, val]) => (
                <button
                  key={key}
                  className={`pomo-tab ${mode === key ? 'active' : ''}`}
                  onClick={() => switchMode(key)}
                >
                  {val.label}
                </button>
              ))}
            </div>

            {/* Timer display */}
            <div className="pomo-timer">
              {formatTime(timeLeft)}
            </div>

            {/* Start / Pause */}
            <div className="pomo-controls">
              <button className="pomo-start-btn" onClick={toggleTimer}>
                {isRunning ? 'PAUSE' : 'START'}
              </button>
              {isRunning && (
                <button className="pomo-skip-btn" onClick={() => {
                  setIsRunning(false);
                  clearInterval(intervalRef.current);
                  if (mode === 'pomodoro') {
                    switchMode('shortBreak');
                  } else {
                    switchMode('pomodoro');
                  }
                }} title="Skip to next">
                  ⏭
                </button>
              )}
            </div>
          </div>

          {/* ─── POMODORO COUNT ─── */}
          <div className="pomo-counter">
            <span className="pomo-counter-hash">#{pomodoroCount + 1}</span>
            <p className="pomo-counter-text">
              {activeTask ? activeTask.title : (mode === 'pomodoro' ? 'Time to focus!' : 'Time for a break!')}
            </p>
          </div>

          {/* ─── TASKS ─── */}
          <div className="pomo-tasks-section">
            <div className="pomo-tasks-header">
              <h3>Tasks</h3>
              <div className="pomo-tasks-menu">
                <button className="pomo-menu-btn" title="Options" onClick={(e) => {
                  e.currentTarget.nextElementSibling?.classList.toggle('show');
                }}>⋮</button>
                <div className="pomo-menu-dropdown">
                  <button onClick={clearDone}>Clear finished</button>
                  <button onClick={clearAll}>Clear all</button>
                  <button onClick={resetTimer}>Reset timer</button>
                </div>
              </div>
            </div>
            <div className="pomo-tasks-divider" />

            {/* Task list */}
            <div className="pomo-task-list">
              {tasks.map(task => (
                <div key={task.id} className={`pomo-task-item ${task.done ? 'done' : ''} ${activeTaskId === task.id ? 'active' : ''}`}>
                  <button
                    className={`pomo-check ${task.done ? 'checked' : ''}`}
                    onClick={() => toggleDone(task.id)}
                    style={{ '--check-color': config.color }}
                  >
                    {task.done ? '✓' : ''}
                  </button>
                  <div className="pomo-task-body" onClick={() => selectTask(task.id)}>
                    <span className={`pomo-task-title ${task.done ? 'strike' : ''}`}>{task.title}</span>
                  </div>
                  <span className="pomo-task-pomos">{task.completedPomos}/{task.estPomos}</span>
                  <button className="pomo-task-edit-btn" onClick={(e) => {
                    e.stopPropagation();
                    setEditingTaskId(editingTaskId === task.id ? null : task.id);
                  }}>⋮</button>
                  {editingTaskId === task.id && (
                    <div className="pomo-task-edit-menu">
                      <button onClick={() => deleteTask(task.id)}>🗑️ Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add task form */}
            {showAddForm ? (
              <div className="pomo-add-form">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What are you working on?"
                  className="pomo-add-input"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTask(); }}
                />
                <div className="pomo-add-pomos">
                  <label>Est Pomodoros</label>
                  <div className="pomo-pomos-control">
                    <input
                      type="number"
                      value={newTaskPomos}
                      onChange={(e) => setNewTaskPomos(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      className="pomo-pomos-input"
                    />
                    <button onClick={() => setNewTaskPomos(prev => prev + 1)} className="pomo-pomos-btn">▲</button>
                    <button onClick={() => setNewTaskPomos(prev => Math.max(1, prev - 1))} className="pomo-pomos-btn">▼</button>
                  </div>
                </div>
                {showNote ? (
                  <textarea
                    value={newTaskNote}
                    onChange={(e) => setNewTaskNote(e.target.value)}
                    placeholder="Some notes..."
                    className="pomo-add-note"
                    rows={3}
                  />
                ) : (
                  <button className="pomo-add-note-toggle" onClick={() => setShowNote(true)}>+ Add Note</button>
                )}
                <div className="pomo-add-actions">
                  <button className="pomo-cancel-btn" onClick={() => { setShowAddForm(false); setShowNote(false); }}>Cancel</button>
                  <button className="pomo-save-btn" onClick={handleSaveTask}>Save</button>
                </div>
              </div>
            ) : (
              <button className="pomo-add-task-btn" onClick={() => setShowAddForm(true)}>
                ＋ Add Task
              </button>
            )}

            {/* Summary footer */}
            {tasks.length > 0 && (
              <div className="pomo-summary-footer">
                <span>Pomos: <strong>{totalDonePomos}</strong>/{totalEstPomos}</span>
                <span>
                  Finish At: <strong>{padZero(finishTime.getHours())}:{padZero(finishTime.getMinutes())}</strong>
                  <span className="pomo-summary-hours"> ({finishHours}h)</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default POMODORO;
