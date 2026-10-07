import React from "react";

/**
 * Reusable AdminCard adhering to requirement 8:
 * - Radius 10-14px (12px)
 * - Subtle border & very light shadow
 * - Comfortable but compact padding
 * - Clear typography hierarchy
 * - Contextual icon badge
 * - Hover elevation & border change
 * - Pointer cursor for clickable cards
 * - Status colors: green, amber, red, blue, neutral
 */
export default function AdminCard({
  icon: Icon,
  label,
  value,
  subtext,
  badgeText,
  badgeType = "neutral", // "success" | "warning" | "error" | "info" | "neutral"
  variant = "neutral",   // "success" | "warning" | "error" | "info" | "neutral"
  onClick,
  className = "",
  children,
}) {
  const isClickable = Boolean(onClick);

  return (
    <div
      className={`admin-kpi-card ${variant ? `kpi-${variant}` : ""} ${isClickable ? "is-clickable" : ""} ${className}`}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        {Icon && (
          <div className={`kpi-icon-badge kpi-badge-${variant}`}>
            <Icon />
          </div>
        )}
      </div>

      <div className="kpi-body">
        <div className="kpi-value-row">
          <span className="kpi-value">{value}</span>
          {badgeText && (
            <span className={`kpi-trend-pill pill-${badgeType}`}>
              {badgeText}
            </span>
          )}
        </div>
        {subtext && <div className="kpi-subtext">{subtext}</div>}
        {children}
      </div>

      {isClickable && (
        <div className="kpi-footer-cue">
          <span>Click to view →</span>
        </div>
      )}
    </div>
  );
}
