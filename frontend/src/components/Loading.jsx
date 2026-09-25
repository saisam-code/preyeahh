export default function Loading({ message = "Loading..." }) {
  return (
    <div style={{ padding: "3rem 0", textAlign: "center" }}>
      <div className="icon">
        <i className="fa fa-spinner fa-spin" style={{ fontSize: 28 }} />
      </div>
      <p style={{ marginTop: 12 }}>{message}</p>
    </div>
  );
}
