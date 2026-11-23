import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught an unhandled error]", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg, #f8fafc)",
            color: "var(--text, #0f172a)",
            padding: "2rem",
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
          }}
        >
          <div
            style={{
              maxWidth: 500,
              width: "100%",
              background: "var(--surface, #ffffff)",
              border: "1px solid var(--border, #e2e8f0)",
              borderRadius: "1rem",
              padding: "2.5rem",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚠️</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem" }}>
              Something went wrong
            </h2>
            <p style={{ color: "var(--text-muted, #64748b)", fontSize: "0.95rem", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
              An unexpected error occurred in the workspace. Your data has not been lost.
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: "var(--surface-mid, #f1f5f9)",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.8rem",
                  textAlign: "left",
                  overflowX: "auto",
                  color: "var(--error, #ef4444)",
                  marginBottom: "1.5rem",
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={this.handleReload}
                className="btn btn-primary btn-sm"
                style={{ padding: "0.6rem 1.25rem", cursor: "pointer" }}
              >
                Reload Page
              </button>
              <a
                href="/"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn btn-outline btn-sm"
                style={{ padding: "0.6rem 1.25rem", textDecoration: "none" }}
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
