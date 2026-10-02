import React, { useRef, useEffect, useMemo } from "react";
import "./MindMap.css";

const TOPIC_COLORS = [
  "#ff6b6b", "#ffa94d", "#ffe066", "#69db7c",
  "#4dabf7", "#cc5de8", "#f783ac", "#63e6be",
];

const RESOURCE_ICONS = {
  video: "🎥",
  course: "🎓",
  documentation: "📚",
  article: "📄",
  book: "📖",
  practice: "🛠️",
  github: "🐙",
};

/**
 * Computes radial layout: centre node + topic arcs
 * returns { cx, cy, centre, spokes }
 */
function computeLayout(section, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const topics = section.topics || [];
  const count = topics.length;

  // Radius scales with topic count, but caps
  const radius = Math.min(Math.max(count * 45, 180), Math.min(cx, cy) - 80);

  const spokes = topics.map((topic, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2; // Start at top
    const tx = cx + radius * Math.cos(angle);
    const ty = cy + radius * Math.sin(angle);
    return {
      topic,
      angle,
      tx,
      ty,
      color: TOPIC_COLORS[i % TOPIC_COLORS.length],
    };
  });

  return { cx, cy, radius, spokes };
}

export default function MindMap({ section, onClose, onTopicStatusChange }) {
  const svgRef = useRef(null);

  const SIZE = 700; // SVG viewBox size
  const { cx, cy, spokes } = useMemo(() => computeLayout(section, SIZE, SIZE), [section]);

  return (
    <div className="mindmap-backdrop" onClick={onClose}>
      <div className="mindmap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mindmap-header">
          <h2 className="mindmap-title">{section.title}</h2>
          <div className="mindmap-subtitle">Mind Map — click a topic to toggle done</div>
          <button className="mindmap-close" onClick={onClose}>✕</button>
        </div>

        <div className="mindmap-canvas-wrap">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="mindmap-svg"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Concentric guide circles */}
            <circle cx={cx} cy={cy} r={80} fill="none" stroke="#e9ecef" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx={cx} cy={cy} r={spokes.length > 0 ? Math.min(Math.max((section.topics?.length || 0) * 45, 180), Math.min(cx, cy) - 80) : 200}
              fill="none" stroke="#e9ecef" strokeWidth="1" strokeDasharray="4 4" />

            {/* Spokes */}
            {spokes.map((spoke, i) => {
              const midX = (cx + spoke.tx) / 2;
              const midY = (cy + spoke.ty) / 2;
              // Perpendicular offset for curve
              const dx = spoke.tx - cx;
              const dy = spoke.ty - cy;
              const perpX = -dy * 0.15;
              const perpY = dx * 0.15;
              const pathD = `M ${cx} ${cy} Q ${midX + perpX} ${midY + perpY} ${spoke.tx} ${spoke.ty}`;
              return (
                <path
                  key={i}
                  d={pathD}
                  stroke={spoke.color}
                  strokeWidth="3"
                  strokeOpacity="0.7"
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Centre node */}
            <ellipse cx={cx} cy={cy} rx={70} ry={34} fill="#1a1a2e" stroke="#fff" strokeWidth="2" />
            <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="800"
              fontFamily="Inter, sans-serif" style={{ userSelect: "none" }}>
              {section.title.length > 16 ? section.title.slice(0, 15) + "…" : section.title}
            </text>

            {/* Topic nodes */}
            {spokes.map((spoke, i) => {
              const nodeW = 130;
              const nodeH = 44;
              const nx = spoke.tx - nodeW / 2;
              const ny = spoke.ty - nodeH / 2;
              const isDone = spoke.topic.isCompleted;

              return (
                <g
                  key={spoke.topic._id || i}
                  style={{ cursor: "pointer" }}
                  onClick={() => onTopicStatusChange(spoke.topic._id, !spoke.topic.isCompleted)}
                >
                  <rect
                    x={nx} y={ny} width={nodeW} height={nodeH}
                    rx="10" ry="10"
                    fill={isDone ? "#d9ead3" : spoke.color}
                    stroke={isDone ? "#27ae60" : "#000"}
                    strokeWidth={isDone ? "3" : "2"}
                    filter={isDone ? "none" : "url(#shadow)"}
                  />
                  {isDone && (
                    <text x={spoke.tx - 50} y={spoke.ty + 5} fill="#27ae60" fontSize="14" fontWeight="900">✓</text>
                  )}
                  <text
                    x={spoke.tx + (isDone ? 6 : 0)}
                    y={spoke.ty - 4}
                    textAnchor="middle"
                    fill={isDone ? "#1e7e34" : "#000"}
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="Inter, sans-serif"
                    style={{ userSelect: "none", textDecoration: isDone ? "line-through" : "none" }}
                  >
                    {spoke.topic.title.length > 16 ? spoke.topic.title.slice(0, 15) + "…" : spoke.topic.title}
                  </text>
                  {spoke.topic.resources?.length > 0 && (
                    <text x={spoke.tx} y={spoke.ty + 13} textAnchor="middle" fontSize="10"
                      fill={isDone ? "#1e7e34" : "#333"} fontFamily="Inter, sans-serif" style={{ userSelect: "none" }}>
                      {spoke.topic.resources.slice(0, 2).map(r => RESOURCE_ICONS[r.type] || "📄").join(" ")}
                      {spoke.topic.resources.length > 2 ? ` +${spoke.topic.resources.length - 2}` : ""}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Drop shadow filter */}
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.25" />
              </filter>
            </defs>
          </svg>
        </div>

        {/* Legend */}
        <div className="mindmap-legend">
          {spokes.map((spoke, i) => (
            <div
              key={i}
              className={`mindmap-legend-item ${spoke.topic.isCompleted ? 'done' : ''}`}
              onClick={() => onTopicStatusChange(spoke.topic._id, !spoke.topic.isCompleted)}
            >
              <span className="mindmap-legend-dot" style={{ background: spoke.color }} />
              <span className="mindmap-legend-label">{spoke.topic.title}</span>
              {spoke.topic.isCompleted && <span className="mindmap-legend-check">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
