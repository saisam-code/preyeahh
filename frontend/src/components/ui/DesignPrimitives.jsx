import { useState } from "react";
import { FaCheck, FaCircleExclamation, FaSpinner, FaXmark } from "react-icons/fa6";

export function Button({ children, variant = "primary", ...props }) {
  return <button className={`ds-button ds-button-${variant}`} {...props}>{children}</button>;
}

export function Input({ label, id, ...props }) {
  return (
    <label className="ds-field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} {...props} />
    </label>
  );
}

export function Card({ title, children }) {
  return <section className="ds-card">{title && <h3>{title}</h3>}{children}</section>;
}

export function Tag({ children }) {
  return <span className="ds-tag">{children}</span>;
}

export function Table({ headers, rows }) {
  return (
    <div className="ds-table-scroll">
      <table className="ds-table">
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="ds-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="ds-modal" role="dialog" aria-modal="true" aria-labelledby="ds-modal-title" onClick={(event) => event.stopPropagation()}>
        <header><h2 id="ds-modal-title">{title}</h2><button className="ds-icon-button" type="button" onClick={onClose} aria-label="Close dialog"><FaXmark /></button></header>
        {children}
        <Button type="button" onClick={onClose}>Close</Button>
      </section>
    </div>
  );
}

export function Tabs({ labels }) {
  const [active, setActive] = useState(0);
  return (
    <div className="ds-tabs">
      <div role="tablist" aria-label="Preview tabs">
        {labels.map((label, index) => (
          <button key={label} type="button" role="tab" aria-selected={active === index} onClick={() => setActive(index)}>{label}</button>
        ))}
      </div>
      <p role="tabpanel">{labels[active]} content</p>
    </div>
  );
}

export function StatusBadge({ children, status = "success" }) {
  return <span className={`ds-status ds-status-${status}`}>{status === "success" ? <FaCheck aria-hidden="true" /> : <FaCircleExclamation aria-hidden="true" />}{children}</span>;
}

export function EmptyState() {
  return <div className="ds-state"><strong>Nothing here yet</strong><span>When there is something to show, it will appear here.</span></div>;
}

export function LoadingState() {
  return <div className="ds-state" role="status"><FaSpinner className="ds-spinner" aria-hidden="true" /><span>Loading your information</span></div>;
}

export function ErrorState() {
  return <div className="ds-state ds-error-state" role="alert"><FaCircleExclamation aria-hidden="true" /><strong>Could not load this section</strong><Button variant="secondary" type="button">Try again</Button></div>;
}

export function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" type="button" onClick={() => setOpen(true)}>Open modal</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Confirmation">
        <p>Shared modal primitive with a dismissible dialog.</p>
      </Modal>
    </>
  );
}
