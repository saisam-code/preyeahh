export default function ContributorLabel({ item }) {
  const author = item?.createdBy?.name || "Original contributor not recorded";
  const editors = [...new Set((item?.editHistory || []).map((entry) => entry.name).filter(Boolean))];

  return (
    <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "0.45rem" }}>
      <span>Added by {author}</span>
      {editors.length > 0 && <span> · Edited by {editors.join(", ")}</span>}
    </div>
  );
}
