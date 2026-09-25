export default function ErrorMessage({ error }) {
  if (!error) return null;
  const msg = typeof error === "string" ? error : error.message || JSON.stringify(error);
  return (
    <div className="ulm-err" style={{ margin: "1rem 0" }}>
      {msg}
    </div>
  );
}
