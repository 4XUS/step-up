import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ToolLayout from '../components/ToolLayout';
import '../styles/Habits.css';

// ─── Constants ───────────────────────────────────────────────────
const EMOJIS = ['💪','📖','🧘','🏃','💻','🎯','🍎','💧','✍️','🎨','🌅','🧠'];
const CATEGORIES = ['Fitness','Learning','Health','Mindfulness','Productivity','Growth'];
const QUOTES = [
  "Discipline beats motivation.",
  "Don't break the chain.",
  "One day stronger.",
  "Consistency compounds.",
  "Small steps, big results.",
  "The secret is showing up.",
  "You're building identity, not just habits.",
  "Day by day, you become unstoppable.",
  "Champions are made in the dark.",
  "Trust the process.",
];
const XP_PER_CHECKIN = 25;
const XP_PER_LEVEL = 200;

// ─── Helpers ─────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);
const loadData = (key, fallback) => { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch { return fallback; } };
const saveData = (key, val) => localStorage.setItem(key, JSON.stringify(val));

function getStreak(history) {
  const today = todayKey();
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 21; i++) {
    const k = d.toISOString().slice(0, 10);
    if (history[k]) { streak++; } else if (k !== today) { break; } else { break; }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function getBestStreak(history) {
  const dates = Object.keys(history).sort();
  let best = 0, cur = 0;
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) { cur = 1; } else {
      const prev = new Date(dates[i - 1]); prev.setDate(prev.getDate() + 1);
      cur = prev.toISOString().slice(0, 10) === dates[i] ? cur + 1 : 1;
    }
    if (cur > best) best = cur;
  }
  return best;
}

// ─── Main Component ──────────────────────────────────────────────
const HABITS = () => {
  const [tab, setTab] = useState('home');
  const [habits, setHabits] = useState(() => loadData('habits21', []));
  const [xp, setXp] = useState(() => loadData('habits21_xp', 0));
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [formData, setFormData] = useState({ name: '', emoji: '💪', category: 'Fitness' });

  // Persist
  useEffect(() => { saveData('habits21', habits); }, [habits]);
  useEffect(() => { saveData('habits21_xp', xp); }, [xp]);

  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const today = todayKey();

  const selected = habits.find(h => h.id === selectedId) || habits[0] || null;

  // ─── Check-in ──────
  const checkIn = useCallback((habitId) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      if (h.history[today]) return h; // already done
      const newHistory = { ...h.history, [today]: true };
      const newStreak = getStreak(newHistory);
      const completed21 = newStreak >= 21;
      if (completed21) setTimeout(() => setShowCelebration(true), 300);
      return { ...h, history: newHistory };
    }));
    setXp(prev => prev + XP_PER_CHECKIN);
  }, [today]);

  // ─── Create habit ──────
  const createHabit = () => {
    if (!formData.name.trim()) return;
    const habit = { id: Date.now().toString(), name: formData.name.trim(), emoji: formData.emoji, category: formData.category, history: {}, createdAt: today };
    setHabits(prev => [...prev, habit]);
    setSelectedId(habit.id);
    setShowForm(false);
    setFormData({ name: '', emoji: '💪', category: 'Fitness' });
  };

  // ─── Delete habit ──────
  const deleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // ─── Render progress ring ──────
  const renderRing = (habit) => {
    const streak = habit ? getStreak(habit.history) : 0;
    const pct = Math.min(streak / 21, 1);
    const r = 76; const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct);

    return (
      <div className="hero-ring-wrap">
        <svg className="hero-ring-svg" viewBox="0 0 180 180">
          <defs><linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f97316"/><stop offset="100%" stopColor="#ef4444"/></linearGradient></defs>
          <circle cx="90" cy="90" r={r} className="hero-ring-bg" />
          <circle cx="90" cy="90" r={r} className="hero-ring-fg" strokeDasharray={circ} strokeDashoffset={offset} />
        </svg>
        <div className="hero-ring-center">
          <span className="hero-day">{streak}</span>
          <span className="hero-of">of 21 days</span>
        </div>
      </div>
    );
  };

  // ─── 21-day grid ──────
  const renderDayGrid = (habit) => {
    if (!habit) return null;

    const days = [];
    const startDate = new Date(habit.createdAt || today);
    for (let i = 0; i < 21; i++) {
      const d = new Date(startDate); d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const isCompleted = !!habit.history[key];
      const isCurrent = key === today;
      const isPast = key < today;
      const isFuture = key > today;
      let cls = 'day-cell';
      if (isCompleted) {
        cls += ' completed';
        if (i < 5) cls += ' fire-low';
        else if (i < 14) cls += ' fire-mid';
        else cls += ' fire-high';
      } else if (isCurrent) cls += ' current';
      else if (isPast) cls += ' missed';
      else cls += ' locked';
      days.push(
        <div key={i} className={cls}>
          <span className="day-num">{i + 1}</span>
          <span className="day-icon">{isCompleted ? '✅' : isCurrent ? '🔥' : isFuture ? '🔒' : '✖'}</span>
        </div>
      );
    }
    return <div className="day-grid">{days}</div>;
  };

  // ─── Heatmap (last 28 days) ──────
  const renderHeatmap = () => {
    const cells = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = habits.filter(h => h.history[key]).length;
      const lvl = count === 0 ? '' : count <= 1 ? 'l1' : count <= 2 ? 'l2' : count <= 3 ? 'l3' : 'l4';
      cells.push(<div key={i} className={`heatmap-cell ${lvl}`} title={`${key}: ${count} habits`} />);
    }
    return (
      <div className="heatmap-card">
        <div className="heatmap-title">Last 28 Days</div>
        <div className="heatmap-days">{'MTWTFSS'.split('').map((d,i) => <span key={i} className="heatmap-day-lbl">{d}</span>)}</div>
        <div className="heatmap-grid">{cells}</div>
      </div>
    );
  };

  // ─── Stats ──────
  const totalCompleted = habits.reduce((s, h) => s + Object.keys(h.history).length, 0);
  const bestStreak = habits.reduce((b, h) => Math.max(b, getBestStreak(h.history)), 0);
  const consistency = habits.length > 0 ? Math.round((totalCompleted / Math.max(habits.length * 21, 1)) * 100) : 0;

  return (
    <ToolLayout>
      <div className="habits-root">
        {/* Nav */}
        <div className="habits-nav">
          {[['home','🏠 Home'],['habits','📋 Habits'],['challenge','🔥 Challenge'],['stats','📊 Stats']].map(([k,l]) => (
            <button key={k} className={`habits-nav-btn ${tab===k?'active':''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        <div className="habits-content">
          {/* ─── HOME TAB ─── */}
          {tab === 'home' && (
            <>
              {/* XP Bar */}
              <div className="xp-bar-wrap">
                <div className="xp-header">
                  <span className="xp-level">⭐ Level {level}</span>
                  <span className="xp-amount">{xpInLevel}/{XP_PER_LEVEL} XP</span>
                </div>
                <div className="xp-track"><div className="xp-fill" style={{ width: `${(xpInLevel/XP_PER_LEVEL)*100}%` }} /></div>
              </div>

              {/* Quote */}
              <div className="quote-card" style={{ marginTop: 16 }}>
                <span className="quote-icon">💡</span>
                <span className="quote-text">"{quote}"</span>
              </div>

              {/* Hero for selected habit */}
              {selected ? (
                <div className="hero-section">
                  {renderRing(selected)}
                  <h2 className="hero-title">{selected.emoji} {selected.name}</h2>
                  <p className="hero-subtitle">{selected.category} • {getStreak(selected.history)} day streak</p>
                  <button className={`hero-checkin-btn ${selected.history[today] ? 'done' : ''}`} onClick={() => checkIn(selected.id)} disabled={!!selected.history[today]}>
                    {selected.history[today] ? '✓ Done Today' : '✓ Check In'}
                  </button>
                  <div className="hero-stats-row">
                    <div className="hero-stat"><div className="hero-stat-val">{getStreak(selected.history)}</div><div className="hero-stat-lbl">Streak</div></div>
                    <div className="hero-stat"><div className="hero-stat-val">{Object.keys(selected.history).length}</div><div className="hero-stat-lbl">Total</div></div>
                    <div className="hero-stat"><div className="hero-stat-val">{Math.round((getStreak(selected.history)/21)*100)}%</div><div className="hero-stat-lbl">Progress</div></div>
                  </div>
                </div>
              ) : (
                <div className="hero-section">
                  <h2 className="hero-title">Welcome to 21 Streak</h2>
                  <p className="hero-subtitle">Create your first habit to begin your journey</p>
                  <button className="hero-checkin-btn" onClick={() => { setTab('habits'); setShowForm(true); }}>+ Create Habit</button>
                </div>
              )}

              {/* Quick habit list */}
              {habits.length > 0 && (
                <div className="habits-list">
                  {habits.map(h => {
                    const streak = getStreak(h.history);
                    const done = !!h.history[today];
                    return (
                      <div key={h.id} className={`habit-card ${selectedId === h.id ? 'selected' : ''}`} onClick={() => setSelectedId(h.id)}>
                        <div className="habit-emoji">{h.emoji}</div>
                        <div className="habit-info">
                          <div className="habit-name">{h.name}</div>
                          <div className="habit-streak-text">{streak} day streak • {h.category}</div>
                          <div className="habit-mini-bar"><div className="habit-mini-bar-fill" style={{ width: `${Math.min(streak/21*100,100)}%` }} /></div>
                        </div>
                        <span className="habit-day-badge">D{streak}</span>
                        <div className={`habit-check-circle ${done ? 'checked' : ''}`} onClick={(e) => { e.stopPropagation(); checkIn(h.id); }}>
                          {done ? '✓' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ─── HABITS TAB ─── */}
          {tab === 'habits' && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>My Habits</h2>
              <div className="habits-list">
                {habits.map(h => (
                  <div key={h.id} className="habit-card">
                    <div className="habit-emoji">{h.emoji}</div>
                    <div className="habit-info">
                      <div className="habit-name">{h.name}</div>
                      <div className="habit-streak-text">{h.category} • {Object.keys(h.history).length} days completed</div>
                    </div>
                    <button style={{ background:'none', border:'none', color:'#ef4444', fontSize:16, cursor:'pointer', padding:8 }} onClick={() => deleteHabit(h.id)} title="Delete">🗑️</button>
                  </div>
                ))}
              </div>
              {showForm ? (
                <div className="habit-form">
                  <h3 className="habit-form-title">New Habit</h3>
                  <div className="habit-form-field">
                    <label className="habit-form-label">Name</label>
                    <input className="habit-form-input" placeholder="e.g. Meditate daily" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} autoFocus />
                  </div>
                  <div className="habit-form-field">
                    <label className="habit-form-label">Icon</label>
                    <div className="emoji-picker">
                      {EMOJIS.map(e => <button key={e} className={`emoji-pick ${formData.emoji===e?'active':''}`} onClick={() => setFormData(p => ({ ...p, emoji: e }))}>{e}</button>)}
                    </div>
                  </div>
                  <div className="habit-form-field">
                    <label className="habit-form-label">Category</label>
                    <div className="category-picker">
                      {CATEGORIES.map(c => <button key={c} className={`cat-pick ${formData.category===c?'active':''}`} onClick={() => setFormData(p => ({ ...p, category: c }))}>{c}</button>)}
                    </div>
                  </div>
                  <div className="habit-form-actions">
                    <button className="form-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                    <button className="form-save" onClick={createHabit}>Create Habit</button>
                  </div>
                </div>
              ) : (
                <button className="add-habit-btn" onClick={() => setShowForm(true)}>＋ Add New Habit</button>
              )}
            </>
          )}

          {/* ─── CHALLENGE TAB ─── */}
          {tab === 'challenge' && (
            <div className="challenge-section">
              {selected ? (
                <>
                  <h2 className="challenge-title">{selected.emoji} {selected.name}</h2>
                  <p style={{ textAlign:'center', color:'var(--streak-muted)', fontSize:14, margin:'0 0 20px' }}>21-Day Challenge</p>
                  {renderDayGrid(selected)}
                  <div style={{ textAlign:'center', marginTop:20 }}>
                    <button className={`hero-checkin-btn ${selected.history[today]?'done':''}`} onClick={() => checkIn(selected.id)} disabled={!!selected.history[today]}>
                      {selected.history[today] ? '✓ Done Today' : '✓ Check In Day ' + (getStreak(selected.history) + 1)}
                    </button>
                  </div>
                  {/* Habit selector */}
                  <div style={{ marginTop:24 }}>
                    <p style={{ fontSize:12, color:'var(--streak-muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Switch Habit</p>
                    <div className="habits-list">
                      {habits.map(h => (
                        <div key={h.id} className={`habit-card ${selectedId===h.id?'selected':''}`} onClick={() => setSelectedId(h.id)} style={{ padding:'10px 14px' }}>
                          <div className="habit-emoji" style={{ width:32, height:32, fontSize:20 }}>{h.emoji}</div>
                          <div className="habit-name" style={{ fontSize:13 }}>{h.name}</div>
                          <span className="habit-day-badge">D{getStreak(h.history)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="hero-section">
                  <h2 className="hero-title">No habit selected</h2>
                  <p className="hero-subtitle">Create a habit to start your 21-day challenge</p>
                  <button className="hero-checkin-btn" onClick={() => { setTab('habits'); setShowForm(true); }}>+ Create Habit</button>
                </div>
              )}
            </div>
          )}

          {/* ─── STATS TAB ─── */}
          {tab === 'stats' && (
            <div className="stats-section">
              <h2 style={{ fontSize:20, fontWeight:700, margin:'0 0 16px' }}>Analytics</h2>
              <div className="xp-bar-wrap">
                <div className="xp-header"><span className="xp-level">⭐ Level {level}</span><span className="xp-amount">{xp} total XP</span></div>
                <div className="xp-track"><div className="xp-fill" style={{ width:`${(xpInLevel/XP_PER_LEVEL)*100}%` }} /></div>
              </div>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-card-val">{bestStreak}</div><div className="stat-card-lbl">Best Streak</div></div>
                <div className="stat-card"><div className="stat-card-val">{totalCompleted}</div><div className="stat-card-lbl">Days Done</div></div>
                <div className="stat-card"><div className="stat-card-val">{habits.length}</div><div className="stat-card-lbl">Habits</div></div>
                <div className="stat-card"><div className="stat-card-val">{consistency}%</div><div className="stat-card-lbl">Consistency</div></div>
              </div>
              {renderHeatmap()}
              {habits.length > 0 && (
                <div className="heatmap-card">
                  <div className="heatmap-title">Habit Comparison</div>
                  {habits.map(h => { const s = getStreak(h.history); return (
                    <div key={h.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <span style={{ fontSize:20 }}>{h.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600 }}>{h.name}</div>
                        <div className="habit-mini-bar"><div className="habit-mini-bar-fill" style={{ width:`${Math.min(s/21*100,100)}%` }} /></div>
                      </div>
                      <span style={{ fontSize:13, fontWeight:800, color:'var(--streak-orange)' }}>{s}/21</span>
                    </div>
                  ); })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── CELEBRATION ─── */}
        {showCelebration && (
          <div className="celebration-overlay" onClick={() => setShowCelebration(false)}>
            <div className="celebration-card" onClick={e => e.stopPropagation()}>
              <div className="celebration-badge">🏆</div>
              <h2 className="celebration-title">21 Days Complete!</h2>
              <p className="celebration-msg">You kept the promise to yourself. Discipline has become your identity.</p>
              <div className="celebration-actions">
                <button className="celebration-btn primary" onClick={() => setShowCelebration(false)}>Continue to 42 Days</button>
                <button className="celebration-btn secondary" onClick={() => { setShowCelebration(false); setTab('habits'); setShowForm(true); }}>Create Another Habit</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default HABITS;
