import React, { useState, useRef, useCallback, useEffect } from 'react';
import ToolLayout from '../components/ToolLayout';
import '../styles/Chart.css';

// ─── Constants ───────────────────────────────────────────────────
const COLORS = [
  { id: 'red',    hex: '#e74c3c', label: 'Sleep' },
  { id: 'blue',   hex: '#3498db', label: 'Work' },
  { id: 'orange', hex: '#f39c12', label: 'Sport' },
  { id: 'green',  hex: '#2ecc71', label: 'Leisure' },
  { id: 'purple', hex: '#9b59b6', label: 'Study' },
  { id: 'gray',   hex: '#95a5a6', label: 'Routine' },
  { id: 'yellow', hex: '#f1c40f', label: 'Free' },
  { id: 'pink',   hex: '#e91e8f', label: 'Social' },
];

const TOTAL_MINUTES = 24 * 60;
const OUTER_RADIUS = 230;
const INNER_RADIUS = 140;
const CENTER = 260;

// ─── Helpers ─────────────────────────────────────────────────────
function minutesToAngle(minutes) {
  return ((minutes / TOTAL_MINUTES) * 360) - 90;
}

function angleToMinutes(angleDeg) {
  let adjusted = (angleDeg + 90) % 360;
  if (adjusted < 0) adjusted += 360;
  return Math.round((adjusted / 360) * TOTAL_MINUTES);
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, outerR, innerR, startAngle, endAngle) {
  let sweep = endAngle - startAngle;
  if (sweep <= 0) sweep += 360;
  const largeArc = sweep > 180 ? 1 : 0;

  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle + sweep);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle + sweep);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z'
  ].join(' ');
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function segmentDuration(seg) {
  let dur = seg.end - seg.start;
  if (dur <= 0) dur += TOTAL_MINUTES;
  return dur;
}

function snapToGrid(minutes, gridSize = 15) {
  return Math.round(minutes / gridSize) * gridSize % TOTAL_MINUTES;
}

// ─── Main Component ──────────────────────────────────────────────
const CHART = () => {
  const [segments, setSegments] = useState([
    { id: 1, start: 23 * 60, end: 7 * 60, colorId: 'red' },
    { id: 2, start: 9 * 60, end: 12 * 60, colorId: 'blue' },
    { id: 3, start: 14 * 60, end: 18 * 60, colorId: 'blue' },
  ]);
  const [colorLabels, setColorLabels] = useState(() => {
    const map = {};
    COLORS.forEach(c => { map[c.id] = c.label; });
    return map;
  });
  const [selectedSegId, setSelectedSegId] = useState(null);
  const [activeColorId, setActiveColorId] = useState('red');
  const [nextId, setNextId] = useState(4);
  const [dragState, setDragState] = useState(null); // { type: 'create' | 'moveStart' | 'moveEnd' | 'moveWhole', segId, startMin }
  const svgRef = useRef(null);

  // ─── Mouse → angle helper ──────
  const getMinutesFromEvent = useCallback((e) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = 520 / rect.width;
    const x = (e.clientX - rect.left) * scale - CENTER;
    const y = (e.clientY - rect.top) * scale - CENTER;
    const angle = (Math.atan2(y, x) * 180) / Math.PI;
    return angleToMinutes(angle);
  }, []);

  // ─── Drag: mouse down on empty area → create segment ──────
  const handleSvgMouseDown = useCallback((e) => {
    if (e.target.closest('.segment-arc') || e.target.closest('.handle')) return;
    const min = snapToGrid(getMinutesFromEvent(e));
    const id = nextId;
    setNextId(prev => prev + 1);
    setSegments(prev => [...prev, { id, start: min, end: (min + 60) % TOTAL_MINUTES, colorId: activeColorId }]);
    setSelectedSegId(id);
    setDragState({ type: 'moveEnd', segId: id, startMin: min });
  }, [getMinutesFromEvent, nextId, activeColorId]);

  // ─── Drag: mouse down on segment → select ──────
  const handleSegmentMouseDown = useCallback((e, segId) => {
    e.stopPropagation();
    setSelectedSegId(segId);
    const min = snapToGrid(getMinutesFromEvent(e));
    setDragState({ type: 'moveWhole', segId, startMin: min });
  }, [getMinutesFromEvent]);

  // ─── Drag: mouse down on handle ──────
  const handleHandleMouseDown = useCallback((e, segId, handleType) => {
    e.stopPropagation();
    setSelectedSegId(segId);
    const min = snapToGrid(getMinutesFromEvent(e));
    setDragState({ type: handleType, segId, startMin: min });
  }, [getMinutesFromEvent]);

  // ─── Drag: mouse move ──────
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e) => {
      const min = snapToGrid(getMinutesFromEvent(e));
      setSegments(prev => prev.map(seg => {
        if (seg.id !== dragState.segId) return seg;
        if (dragState.type === 'moveEnd' || dragState.type === 'create') {
          return { ...seg, end: min };
        }
        if (dragState.type === 'moveStart') {
          return { ...seg, start: min };
        }
        if (dragState.type === 'moveWhole') {
          const delta = min - dragState.startMin;
          if (delta === 0) return seg;
          return {
            ...seg,
            start: (seg.start + delta + TOTAL_MINUTES) % TOTAL_MINUTES,
            end: (seg.end + delta + TOTAL_MINUTES) % TOTAL_MINUTES,
          };
        }
        return seg;
      }));
      if (dragState.type === 'moveWhole') {
        setDragState(prev => ({ ...prev, startMin: min }));
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, getMinutesFromEvent]);

  // ─── Delete segment ──────
  const deleteSegment = (id) => {
    setSegments(prev => prev.filter(s => s.id !== id));
    if (selectedSegId === id) setSelectedSegId(null);
  };

  // ─── Compute summary ──────
  const summary = {};
  segments.forEach(seg => {
    const dur = segmentDuration(seg);
    if (!summary[seg.colorId]) summary[seg.colorId] = 0;
    summary[seg.colorId] += dur;
  });

  const selectedSeg = segments.find(s => s.id === selectedSegId);

  return (
    <ToolLayout>
      <div className="chart-page">
        {/* ─── LEFT PANEL ─── */}
        <div className="chart-panel">
          <h2 className="chart-panel-title">My Schedule</h2>

          {/* Color palette */}
          <div className="chart-section">
            <label className="chart-section-label">Color</label>
            <div className="color-palette">
              {COLORS.map(c => (
                <button
                  key={c.id}
                  className={`color-dot ${activeColorId === c.id ? 'active' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => setActiveColorId(c.id)}
                  title={colorLabels[c.id]}
                />
              ))}
            </div>
            {/* Label editor */}
            <div className="color-label-editor">
              <span className="color-label-dot" style={{ background: COLORS.find(c => c.id === activeColorId)?.hex }} />
              <input
                type="text"
                value={colorLabels[activeColorId] || ''}
                onChange={(e) => setColorLabels(prev => ({ ...prev, [activeColorId]: e.target.value }))}
                className="color-label-input"
                placeholder="Label..."
              />
            </div>
          </div>

          {/* Selected segment info */}
          {selectedSeg && (
            <div className="chart-section segment-info">
              <label className="chart-section-label">Selected</label>
              <div className="segment-info-row">
                <span className="segment-info-color" style={{ background: COLORS.find(c => c.id === selectedSeg.colorId)?.hex }} />
                <span className="segment-info-label">{colorLabels[selectedSeg.colorId]}</span>
              </div>
              <div className="segment-info-times">
                <span>{formatTime(selectedSeg.start)}</span>
                <span className="segment-info-arrow">→</span>
                <span>{formatTime(selectedSeg.end)}</span>
                <span className="segment-info-dur">({formatDuration(segmentDuration(selectedSeg))})</span>
              </div>
              <div className="segment-actions">
                <select
                  value={selectedSeg.colorId}
                  onChange={(e) => setSegments(prev => prev.map(s => s.id === selectedSeg.id ? { ...s, colorId: e.target.value } : s))}
                  className="segment-color-select"
                >
                  {COLORS.map(c => (
                    <option key={c.id} value={c.id}>{colorLabels[c.id]}</option>
                  ))}
                </select>
                <button className="segment-delete-btn" onClick={() => deleteSegment(selectedSeg.id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="chart-section">
            <label className="chart-section-label">Summary</label>
            <div className="summary-list">
              {Object.entries(summary).map(([colorId, dur]) => {
                const color = COLORS.find(c => c.id === colorId);
                return (
                  <div key={colorId} className="summary-item">
                    <span className="summary-dot" style={{ background: color?.hex }} />
                    <span className="summary-label">{colorLabels[colorId]}</span>
                    <span className="summary-dur">{formatDuration(dur)}</span>
                  </div>
                );
              })}
              {Object.keys(summary).length === 0 && (
                <p className="empty-hint">Click on the chart to add a segment</p>
              )}
            </div>
          </div>

          <p className="chart-hint">
            💡 Click empty area to create • Drag handles to resize • Drag segment to move
          </p>
        </div>

        {/* ─── CHART ─── */}
        <div className="chart-canvas-wrapper">
          <svg
            ref={svgRef}
            viewBox="0 0 520 520"
            className="chart-svg"
            onMouseDown={handleSvgMouseDown}
          >
            {/* Background rings */}
            <circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS} fill="none" stroke="#e0e0e0" strokeWidth="1" />
            <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="none" stroke="#e0e0e0" strokeWidth="1" />
            <circle cx={CENTER} cy={CENTER} r={(OUTER_RADIUS + INNER_RADIUS) / 2} fill="none" stroke="#f0f0f0" strokeWidth="0.5" strokeDasharray="4 4" />

            {/* Hour spokes & labels */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = minutesToAngle(i * 60);
              const inner = polarToCartesian(CENTER, CENTER, INNER_RADIUS - 4, angle);
              const outer = polarToCartesian(CENTER, CENTER, OUTER_RADIUS + 4, angle);
              const labelPos = polarToCartesian(CENTER, CENTER, OUTER_RADIUS + 22, angle);
              const isMajor = i % 4 === 0;
              return (
                <g key={i}>
                  <line
                    x1={inner.x} y1={inner.y}
                    x2={outer.x} y2={outer.y}
                    stroke={isMajor ? '#ccc' : '#eee'}
                    strokeWidth={isMajor ? 1 : 0.5}
                  />
                  {isMajor && (
                    <text
                      x={labelPos.x} y={labelPos.y}
                      textAnchor="middle" dominantBaseline="central"
                      className="hour-label-major"
                    >
                      {i}
                    </text>
                  )}
                  {!isMajor && (
                    <text
                      x={labelPos.x} y={labelPos.y}
                      textAnchor="middle" dominantBaseline="central"
                      className="hour-label-minor"
                    >
                      {i}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Minute ticks */}
            {Array.from({ length: 96 }).map((_, i) => {
              if (i % 4 === 0) return null; // skip hour marks
              const angle = minutesToAngle(i * 15);
              const inner = polarToCartesian(CENTER, CENTER, OUTER_RADIUS - 3, angle);
              const outer = polarToCartesian(CENTER, CENTER, OUTER_RADIUS + 3, angle);
              return (
                <line
                  key={i}
                  x1={inner.x} y1={inner.y}
                  x2={outer.x} y2={outer.y}
                  stroke="#e8e8e8"
                  strokeWidth={0.5}
                />
              );
            })}

            {/* Segments */}
            {segments.map(seg => {
              const color = COLORS.find(c => c.id === seg.colorId);
              const startAngle = minutesToAngle(seg.start);
              const endAngle = minutesToAngle(seg.end);
              const dur = segmentDuration(seg);
              const midAngle = startAngle + ((endAngle - startAngle + 360) % 360) / 2;
              const midR = (OUTER_RADIUS + INNER_RADIUS) / 2;
              const midPos = polarToCartesian(CENTER, CENTER, midR, midAngle);
              const isSelected = selectedSegId === seg.id;

              // Handle positions
              const startHandlePos = polarToCartesian(CENTER, CENTER, midR, startAngle);
              const endHandlePos = polarToCartesian(CENTER, CENTER, midR, endAngle);

              return (
                <g key={seg.id}>
                  {/* Arc */}
                  <path
                    d={describeArc(CENTER, CENTER, OUTER_RADIUS, INNER_RADIUS, startAngle, endAngle)}
                    fill={color?.hex || '#ccc'}
                    fillOpacity={isSelected ? 0.9 : 0.7}
                    stroke={isSelected ? '#333' : 'rgba(255,255,255,0.6)'}
                    strokeWidth={isSelected ? 2.5 : 1}
                    className="segment-arc"
                    style={{ cursor: 'grab', filter: isSelected ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' : 'none' }}
                    onMouseDown={(e) => handleSegmentMouseDown(e, seg.id)}
                  />
                  {/* Duration label */}
                  {dur >= 30 && (
                    <text
                      x={midPos.x} y={midPos.y}
                      textAnchor="middle" dominantBaseline="central"
                      className="segment-duration-label"
                    >
                      {formatDuration(dur)}
                    </text>
                  )}
                  {/* Start/end time labels on inner ring */}
                  {isSelected && (
                    <>
                      {/* Time labels */}
                      <text
                        x={polarToCartesian(CENTER, CENTER, INNER_RADIUS - 14, startAngle).x}
                        y={polarToCartesian(CENTER, CENTER, INNER_RADIUS - 14, startAngle).y}
                        textAnchor="middle" dominantBaseline="central"
                        className="segment-time-label"
                      >
                        {formatTime(seg.start)}
                      </text>
                      <text
                        x={polarToCartesian(CENTER, CENTER, INNER_RADIUS - 14, endAngle).x}
                        y={polarToCartesian(CENTER, CENTER, INNER_RADIUS - 14, endAngle).y}
                        textAnchor="middle" dominantBaseline="central"
                        className="segment-time-label"
                      >
                        {formatTime(seg.end)}
                      </text>
                      {/* Drag handles */}
                      <circle
                        cx={startHandlePos.x} cy={startHandlePos.y} r={7}
                        fill="white" stroke="#333" strokeWidth={2}
                        className="handle"
                        style={{ cursor: 'ew-resize' }}
                        onMouseDown={(e) => handleHandleMouseDown(e, seg.id, 'moveStart')}
                      />
                      <circle
                        cx={endHandlePos.x} cy={endHandlePos.y} r={7}
                        fill="white" stroke="#333" strokeWidth={2}
                        className="handle"
                        style={{ cursor: 'ew-resize' }}
                        onMouseDown={(e) => handleHandleMouseDown(e, seg.id, 'moveEnd')}
                      />
                    </>
                  )}
                </g>
              );
            })}

            {/* Center summary */}
            <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS - 25} fill="white" fillOpacity="0.85" />
            {Object.entries(summary).map(([colorId, dur], idx) => {
              const color = COLORS.find(c => c.id === colorId);
              const yOffset = CENTER - (Object.keys(summary).length * 10) + idx * 24;
              return (
                <g key={colorId}>
                  <rect x={CENTER - 50} y={yOffset - 6} width={12} height={12} rx={3} fill={color?.hex} />
                  <text x={CENTER - 33} y={yOffset + 1} className="center-summary-text" dominantBaseline="central">
                    {colorLabels[colorId]}: {formatDuration(dur)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </ToolLayout>
  );
};

export default CHART;
