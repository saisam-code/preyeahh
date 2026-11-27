import { useSearchParams } from "react-router-dom";
import CareerDiscovery from "./CareerDiscovery.jsx";
import Roles from "./Roles.jsx";
import Resources from "./Resources.jsx";
import Beyond from "./Beyond.jsx";
import GovernmentCareers from "./GovernmentCareers.jsx";

const SECTIONS = [
  { id: "domains", label: "Domains" },
  { id: "roles", label: "Roles" },
  { id: "resources", label: "Resources" },
  { id: "exams", label: "Exams" },
  { id: "opportunities", label: "Opportunities" },
];

function getSection(searchParams) {
  const requestedTab = searchParams.get("tab");
  const requestedSection = searchParams.get("section");
  const requested = SECTIONS.some(({ id }) => id === requestedTab)
    ? requestedTab
    : requestedSection;
  return SECTIONS.some(({ id }) => id === requested) ? requested : "domains";
}

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = getSection(searchParams);

  const selectSection = (section) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", section);
    next.delete("section");
    if (section === "exams") {
      next.set("examTab", searchParams.get("examTab") || "syllabus");
    } else {
      next.delete("examTab");
    }
    setSearchParams(next);
  };

  let content;
  switch (activeSection) {
    case "roles":
      content = <Roles />;
      break;
    case "resources":
      content = <Resources />;
      break;
    case "exams":
      content = <GovernmentCareers />;
      break;
    case "opportunities":
      content = <Beyond />;
      break;
    default:
      content = <CareerDiscovery hideHeader />;
  }

  return (
    <main className="explore-page">
      <header className="page-hero">
        <h1>Explore</h1>
        <p>Discover career domains, roles, learning resources, exams, and opportunities.</p>
      </header>
      <nav className="type-tabs explore-tabs" aria-label="Explore sections">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`tab${activeSection === id ? " active" : ""}`}
            aria-current={activeSection === id ? "page" : undefined}
            onClick={() => selectSection(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <section className="explore-content" aria-live="polite">
        {content}
      </section>
    </main>
  );
}
