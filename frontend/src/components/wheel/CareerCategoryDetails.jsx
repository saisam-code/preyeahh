import { FaCheck, FaPlus, FaArrowRight } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { wheelLabelPresentation } from "../../utils/contrast.js";

export default function CareerCategoryDetails({
  domain,
  selectedCareerNames = [],
  onToggleCareer,
  onAddDomainInterest,
  isDomainSelected,
}) {
  if (!domain) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "2.5rem 1.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", margin: 0 }}>
          Click or hover on any segment of the <strong>Career Wheel</strong> to inspect careers, roles, and specializations.
        </p>
      </div>
    );
  }

  const Icon = domain.icon;
  const wheelStyles = getComputedStyle(document.documentElement);
  const labelPresentation = wheelLabelPresentation(
    domain.color,
    wheelStyles.getPropertyValue("--wheel-label-dark").trim(),
    wheelStyles.getPropertyValue("--wheel-label-light").trim()
  );

  return (
    <div
      className="career-domain-details"
      style={{
        background: "var(--surface)",
        border: `2px solid ${domain.color}`,
        borderRadius: "var(--radius)",
        padding: "1.75rem",
        boxShadow: "var(--shadow-float)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Domain Header */}
      <div className="career-domain-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius)",
              background: domain.color,
              color: labelPresentation.foreground,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-size-lg)",
            }}
          >
            <Icon />
          </div>
          <div>
            <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 800, margin: 0, color: "var(--text)" }}>
              {domain.title}
            </h2>
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--ink-600)", fontWeight: 700 }}>
              {domain.careers.length} Career Paths
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAddDomainInterest(domain.title)}
          className="btn btn-sm"
          style={{
            background: isDomainSelected ? "var(--ink-900)" : "transparent",
            color: isDomainSelected ? "var(--surface)" : "var(--ink-900)",
            border: `1.5px solid ${domain.color}`,
            borderRadius: "var(--radius)",
            fontSize: "var(--font-size-sm)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {isDomainSelected ? <><FaCheck /> Added to Interests</> : <><FaPlus /> Track Domain</>}
        </button>
      </div>

      <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", lineHeight: 1.55, margin: "0 0 1.25rem" }}>
        {domain.description}
      </p>

      {domain.id === "law-public" && (
        <Link to="/government-careers" className="btn btn-outline domain-government-link">
          Explore Government Careers <FaArrowRight aria-hidden="true" />
        </Link>
      )}

      {/* Career Roles Grid */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "var(--font-size-sm)", textTransform: "uppercase", letterSpacing: 1, color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.6rem" }}>
          Explore Roles in this Domain
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.65rem" }}>
          {domain.careers.map((career) => {
            const isPicked = selectedCareerNames.includes(career.name);
            return (
              <div
                key={career.name}
                onClick={() => onToggleCareer(career.name)}
                style={{
                  border: isPicked ? `2px solid ${domain.color}` : "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "0.75rem 1rem",
                  background: isPicked ? `color-mix(in srgb, ${domain.color} 12%, var(--surface))` : "var(--surface)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <div>
                  <strong style={{ fontSize: "var(--font-size-sm)", color: "var(--text)" }}>
                    {career.name}
                  </strong>
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    {career.desc}
                  </div>
                </div>

                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "var(--r-full)",
                    border: isPicked ? `2px solid ${domain.color}` : "1.5px solid var(--border)",
                    background: isPicked ? domain.color : "transparent",
                    color: "var(--on-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "var(--font-size-sm)",
                    flexShrink: 0,
                    marginLeft: "0.75rem",
                  }}
                >
                  {isPicked && <FaCheck />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Specializations Tags */}
      <div>
        <div style={{ fontSize: "var(--font-size-sm)", textTransform: "uppercase", letterSpacing: 1, color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.5rem" }}>
          Key Specializations
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {domain.specializations.map((spec) => (
            <span
              key={spec}
              style={{
                fontSize: "var(--font-size-sm)",
                padding: "0.25rem 0.65rem",
                borderRadius: "var(--radius)",
                background: "var(--surface-mid)",
                color: "var(--text)",
                fontWeight: 600,
                border: "1px solid var(--border)",
              }}
            >
              {spec}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
