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
            background: "var(--bg)",
            color: "var(--text)",
            padding: "2rem",
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
          }}
        >
          <div
            style={{
              maxWidth: 500,
              width: "100%",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "2.5rem",
              textAlign: "center",
              boxShadow: "var(--shadow-float)",
            }}
          >
            <div style={{ fontSize: "var(--font-size-3xl)", marginBottom: "0.5rem" }}>⚠️</div>
            <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800, margin: "0 0 0.5rem" }}>
              Something went wrong
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-md)", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
              An unexpected error occurred in the workspace. Your data has not been lost.
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: "var(--surface-mid)",
                  padding: "0.75rem",
                  borderRadius: "var(--radius)",
                  fontSize: "var(--font-size-sm)",
                  textAlign: "left",
                  overflowX: "auto",
                  color: "var(--error)",
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
