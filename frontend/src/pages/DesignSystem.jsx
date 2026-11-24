import { useState } from "react";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  ModalDemo,
  StatusBadge,
  Table,
  Tabs,
  Tag,
} from "../components/ui/DesignPrimitives.jsx";
import "../components/ui/design-primitives.css";

const STAGES = ["junior", "teen", "senior", "pro", "research"];
const THEMES = ["light", "dark"];
const ROLES = ["student", "parent", "guide", "institution"];

function Preview({ stage, theme, role }) {
  return (
    <article
      className="ds-preview"
      data-stage={stage}
      data-theme={theme}
      data-role-preview={role}
    >
      <div className="role-strip" aria-hidden="true" />
      <div>
        <h2>{stage[0].toUpperCase() + stage.slice(1)} · {theme} · {role}</h2>
        <p>Shared UI primitives adapt through tokens without changing navigation.</p>
      </div>
      <div className="ds-preview-row">
        <Button type="button">Primary action</Button>
        <Button type="button" variant="secondary">Secondary</Button>
        <StatusBadge>Saved</StatusBadge>
        <StatusBadge status="warning">Review needed</StatusBadge>
        <Tag>Accessible tag</Tag>
      </div>
      <Card title="Card primitive">
        <Input id={`${stage}-${theme}-${role}-input`} label="Text input" defaultValue="Sample value" />
      </Card>
      <Tabs labels={["Overview", "Details"]} />
      <Table
        headers={["Item", "Status"]}
        rows={[["Education profile", "Complete"], ["Roadmap", "In progress"]]}
      />
      <div className="ds-preview-row">
        <EmptyState />
        <LoadingState />
        <ErrorState />
      </div>
      <ModalDemo />
    </article>
  );
}

export default function DesignSystem() {
  const [filter, setFilter] = useState("all");
  const roles = filter === "all" ? ROLES : [filter];

  return (
    <main className="section design-system-page">
      <header className="page-hero">
        <h1>Design system</h1>
        <p>Token and primitive previews across all maturity stages, themes, and non-admin role tints.</p>
      </header>
      <div className="ds-preview-row" role="group" aria-label="Filter role previews">
        <Button type="button" variant="secondary" onClick={() => setFilter("all")}>All roles</Button>
        {ROLES.map((role) => (
          <Button key={role} type="button" variant="secondary" onClick={() => setFilter(role)}>{role}</Button>
        ))}
      </div>
      <div className="design-system-grid">
        {STAGES.flatMap((stage) => THEMES.flatMap((theme) => roles.map((role) => (
          <Preview key={`${stage}-${theme}-${role}`} stage={stage} theme={theme} role={role} />
        ))))}
      </div>
    </main>
  );
}
