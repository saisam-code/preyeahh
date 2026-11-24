import { useState } from "react";
import preyeahhLogo from "../../assets/preyeahh-logo.png";
import { wheelLabelPresentation } from "../../utils/contrast.js";

/**
 * Helper to calculate SVG arc path between two angles
 */
function createArc(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
  const toRad = (deg) => ((deg - 90) * Math.PI) / 180.0;
  const startInner = { x: cx + innerRadius * Math.cos(toRad(startAngle)), y: cy + innerRadius * Math.sin(toRad(startAngle)) };
  const endInner = { x: cx + innerRadius * Math.cos(toRad(endAngle)), y: cy + innerRadius * Math.sin(toRad(endAngle)) };
  const startOuter = { x: cx + outerRadius * Math.cos(toRad(startAngle)), y: cy + outerRadius * Math.sin(toRad(startAngle)) };
  const endOuter = { x: cx + outerRadius * Math.cos(toRad(endAngle)), y: cy + outerRadius * Math.sin(toRad(endAngle)) };

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

export default function CareerWheel({
  domains,
  selectedDomain,
  onSelectDomain,
  multiSelectedIds = [],
}) {
  const [hoveredDomain, setHoveredDomain] = useState(null);

  const size = 520;
  const center = size / 2;
  const innerRadius = 90;
  const outerRadius = 230;
  const segmentAngle = 360 / domains.length;

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: size, margin: "0 auto", userSelect: "none" }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
        role="region"
        aria-label="Interactive Radial Career Selection Wheel"
      >
        <defs>
          <filter id="segment-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.3" floodColor="var(--ink-900)" />
          </filter>
        </defs>

        {/* Outer Circular Ring Guide */}
        <circle cx={center} cy={center} r={outerRadius + 4} fill="none" stroke="var(--border)" strokeWidth="1.5" opacity="0.6" />

        {/* 12 Career Segments */}
        {domains.map((d, index) => {
          const startAngle = index * segmentAngle;
          const endAngle = startAngle + segmentAngle - 1.2; // slight gap between segments
          const isSelected = selectedDomain?.id === d.id;
          const isMultiSelected = multiSelectedIds.includes(d.id);
          const isHovered = hoveredDomain?.id === d.id;
          const labelPresentation = wheelLabelPresentation(d.color);
          const Icon = d.icon;

          // Mid angle for text label and icon placement
          const midAngle = startAngle + segmentAngle / 2;
          const midRad = ((midAngle - 90) * Math.PI) / 180.0;
          const textRadius = (innerRadius + outerRadius) / 2 + 6;
          const textX = center + textRadius * Math.cos(midRad);
          const textY = center + textRadius * Math.sin(midRad);

          // Dynamic radial expansion on active / hover
          const currentOuter = isSelected || isHovered ? outerRadius + 8 : outerRadius;
          const currentInner = isSelected || isHovered ? innerRadius - 4 : innerRadius;
          const pathData = createArc(center, center, currentInner, currentOuter, startAngle, endAngle);

          return (
            <g
              key={d.id}
              onClick={() => onSelectDomain(d)}
              onMouseEnter={() => setHoveredDomain(d)}
              onMouseLeave={() => setHoveredDomain(null)}
              style={{ cursor: "pointer", transition: "all 0.25s ease" }}
              tabIndex={0}
              role="button"
              aria-label={`${d.title} category`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDomain(d);
                }
              }}
            >
              <path
                d={pathData}
                fill={d.color}
                opacity={isSelected ? 1 : isHovered ? 0.92 : isMultiSelected ? 0.85 : 0.72}
                stroke={isSelected || isMultiSelected ? "var(--ink-900)" : "var(--surface)"}
                strokeWidth={isSelected ? 4 : isMultiSelected ? 3 : 1.5}
                filter={isSelected || isHovered ? "url(#segment-glow)" : "none"}
                style={{ transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}
              />

              {labelPresentation.background !== "transparent" && (
                <rect
                  x={textX - 44}
                  y={textY - 10}
                  width="88"
                  height="20"
                  rx="6"
                  fill={labelPresentation.background}
                  transform={`rotate(${midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle}, ${textX}, ${textY})`}
                />
              )}

              {/* Segment Label */}
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="central"
                fill={labelPresentation.foreground}
                style={{
                  fontSize: "var(--font-size-xs)",
                  fontWeight: 700,
                  fontFamily: "var(--font-heading)",
                  pointerEvents: "none",
                }}
                transform={`rotate(${midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle}, ${textX}, ${textY})`}
              >
                {isMultiSelected ? `✓ ${d.shortTitle}` : d.shortTitle}
              </text>
              <foreignObject
                x={center + (innerRadius + 18) * Math.cos(midRad) - 9}
                y={center + (innerRadius + 18) * Math.sin(midRad) - 9}
                width="18"
                height="18"
                style={{ pointerEvents: "none", color: labelPresentation.foreground }}
              >
                <Icon aria-hidden="true" focusable="false" style={{ width: 18, height: 18 }} />
              </foreignObject>
            </g>
          );
        })}

        {/* Central PREYEAHH Hub */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius - 6}
          fill="var(--surface)"
          stroke="var(--border)"
          strokeWidth="2"
          filter="drop-shadow(0 4px 12px var(--overlay-color))"
        />

        <circle
          cx={center}
          cy={center}
          r={innerRadius - 16}
          fill="var(--primary-bg)"
          stroke="var(--primary)"
          strokeWidth="1.5"
          opacity="0.8"
        />
      </svg>

      {/* Center PREYEAHH Logo & Label Overlay */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
          width: 130,
        }}
      >
        <img
          src={preyeahhLogo}
          alt="PREYEAHH"
          style={{ width: 44, height: 44, objectFit: "contain", margin: "0 auto 0.25rem", display: "block" }}
        />
        <div style={{ fontSize: "0.85rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--text)" }}>
          PRE<span>YEAHH</span>
        </div>
        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: 0.5 }}>
          CAREER ORBIT
        </div>
      </div>
    </div>
  );
}
