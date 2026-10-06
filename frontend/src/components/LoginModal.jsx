import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchBranches } from "../services/branchService.js";
import { fetchRoles } from "../services/rolesService.js";
import preyeahhLogo from "../assets/preyeahh-logo.png";

const GUIDE_EMAIL_RE = /^[^\s@]+@nbkrist\.org$/i;

export default function LoginModal({ open, onClose, startTab = "login" }) {
  const { registerGuide } = useAuth();
  const [tab, setTab] = useState(startTab);
  const [loginType, setLoginType] = useState("student");
  const [regType, setRegType] = useState("student");
  const [branches, setBranches] = useState([]);
  const [rolesForBranch, setRolesForBranch] = useState([]);
  const [regSuccess, setRegSuccess] = useState("");

  useEffect(() => {
    if (open) {
      setTab(startTab);
      setRegSuccess("");
      fetchBranches().then(setBranches).catch(() => setBranches([]));
    }
  }, [open, startTab]);

  const registerForm = useForm({
    defaultValues: { name: "", email: "", password: "", branch: "", roleName: "", newRoleName: "", newRoleDesc: "", bio: "" },
  });
  const watchedBranch = registerForm.watch("branch");
  const watchedRole = registerForm.watch("roleName");

  useEffect(() => {
    if (!open || regType !== "guide" || !watchedBranch) return;
    fetchRoles({ branch: watchedBranch, limit: 100 })
      .then((res) => setRolesForBranch(res.data || []))
      .catch(() => setRolesForBranch([]));
  }, [open, regType, watchedBranch]);

  useEffect(() => {
    if (branches.length && !registerForm.getValues("branch")) {
      registerForm.setValue("branch", branches[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches]);

  if (!open) return null;

  const onRegisterSubmit = async (data) => {
    if (regType === "student") return; // Students register via Google, not this form

    const email = data.email.trim().toLowerCase();

    if (!GUIDE_EMAIL_RE.test(email)) {
      registerForm.setError("email", { message: "Guides must register with a @nbkrist.org email address." });
      return;
    }

    try {
      const roleName = data.roleName === "__new__" ? data.newRoleName.trim() : data.roleName;
      if (!roleName) {
        registerForm.setError("roleName", { message: data.roleName === "__new__" ? "Enter the new role's name." : "Select a role to guide." });
        return;
      }
      const bio = data.newRoleDesc
        ? `[New role: ${data.newRoleDesc.trim()}]${data.bio ? " — " + data.bio.trim() : ""}`
        : data.bio.trim();

      const res = await registerGuide({ name: data.name.trim(), email, password: data.password, branch: data.branch, roleNames: [roleName], bio });
      setRegSuccess(res.message || "Check your email to verify your account, then wait for admin approval.");
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      registerForm.setError("root", { message: msg });
    }
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div>
            <img src={preyeahhLogo} alt="PREYEAHH Logo" className="modal-logo" style={{ height: "40px", marginBottom: "0.5rem" }} />
            <h2>{tab === "login" ? "Sign In" : "Create Account"}</h2>
            <p className="modal-sub">
              {tab === "login" ? "Welcome back — enter your details below." : "Join Preyeahh to track your career interests."}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem" }}>
          <button className={`tab ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>Login</button>
          <button className={`tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>Register</button>
        </div>

        {tab === "login" ? (
          <div style={{ padding: "1rem 0" }}>
            <div className="ulm-reg-toggle" style={{ marginBottom: "1.5rem" }}>
              <button type="button" className={`ulm-rt-btn ${loginType === "student" ? "active" : ""}`} onClick={() => setLoginType("student")}>
                Student
              </button>
              <button type="button" className={`ulm-rt-btn ${loginType === "guide" ? "active" : ""}`} onClick={() => setLoginType("guide")}>
                Guide
              </button>
            </div>
            
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-dim, #888)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                {loginType === "student" 
                  ? "Students log in with Google. No password needed."
                  : "Guides log in with Google. No password needed."}
              </p>
              <a
                href={`${import.meta.env.VITE_API_URL || "/api"}/auth/google?role=${loginType}`}
                className="btn btn-outline"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", textDecoration: "none" }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Continue with Google
              </a>
              <small style={{ fontSize: "0.75rem", color: "var(--muted, #888)", marginTop: "0.75rem", display: "block" }}>
                Only @gmail.com and @nbkrist.org emails are supported.
              </small>
            </div>
          </div>
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
            <div className="ulm-reg-toggle">
              <button type="button" className={`ulm-rt-btn ${regType === "student" ? "active" : ""}`} onClick={() => setRegType("student")}>
                Student
              </button>
              <button type="button" className={`ulm-rt-btn ${regType === "guide" ? "active" : ""}`} onClick={() => setRegType("guide")}>
                Guide
              </button>
            </div>

            {!regSuccess && regType === "student" && (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <p style={{ color: "var(--text-dim, #888)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                  Students register with Google. Click below to get started — no password needed.
                </p>
                <a
                  href={`${import.meta.env.VITE_API_URL || "/api"}/auth/google?role=student`}
                  className="btn btn-outline"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", textDecoration: "none" }}
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  Continue with Google
                </a>
                <small style={{ fontSize: "0.75rem", color: "var(--muted, #888)", marginTop: "0.75rem", display: "block" }}>
                  Only @gmail.com and @nbkrist.org emails are supported.
                </small>
              </div>
            )}

            {!regSuccess && regType === "guide" && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Your name" {...registerForm.register("name", { required: true })} />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@nbkrist.org"
                    {...registerForm.register("email", { required: true })}
                  />
                  <small style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.3rem", display: "block" }}>
                    Guides must use a @nbkrist.org email.
                  </small>
                  {registerForm.formState.errors.email && (
                    <small style={{ color: "var(--error, #ef4444)", display: "block", marginTop: "0.25rem" }}>
                      {registerForm.formState.errors.email.message}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="pass-wrap">
                    <input
                      type={showPass.register ? "text" : "password"}
                      placeholder="Min 6 characters"
                      {...registerForm.register("password", { required: true, minLength: 6 })}
                    />
                    <button type="button" className="pass-eye" tabIndex={-1} onClick={() => setShowPass((s) => ({ ...s, register: !s.register }))}>
                      {showPass.register ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Branch you want to guide</label>
                  <select {...registerForm.register("branch", { required: true })}>
                    {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Role you want to guide</label>
                  <select {...registerForm.register("roleName")}>
                    {rolesForBranch.length === 0 ? (
                      <option value="">No roles for this branch yet</option>
                    ) : (
                      rolesForBranch.map((r) => <option key={r._id} value={r.title}>{r.title}</option>)
                    )}
                    <option value="__new__">+ Propose a new role…</option>
                  </select>
                  {registerForm.formState.errors.roleName && (
                    <small style={{ color: "var(--error, #ef4444)" }}>{registerForm.formState.errors.roleName.message}</small>
                  )}
                </div>

                {watchedRole === "__new__" && (
                  <>
                    <div className="form-group">
                      <label>New Role Name</label>
                      <input type="text" placeholder="e.g. Cybersecurity Analyst" {...registerForm.register("newRoleName")} />
                    </div>
                    <div className="form-group">
                      <label>Brief Description</label>
                      <textarea placeholder="What does this role involve?" style={{ minHeight: 60 }} {...registerForm.register("newRoleDesc")} />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Short Bio <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                  <textarea placeholder="Tell students a bit about yourself..." style={{ minHeight: 65 }} {...registerForm.register("bio")} />
                </div>

                <p className="ulm-note">Guide registrations are reviewed by the admin before activation.</p>
              </>
            )}

            {registerForm.formState.errors.root && <p className="ulm-err" style={{ display: "block" }}>{registerForm.formState.errors.root.message}</p>}
            {regSuccess && <p className="ulm-ok">{regSuccess}</p>}

            {!regSuccess && regType === "guide" ? (
              <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={registerForm.formState.isSubmitting}>
                {registerForm.formState.isSubmitting ? "Submitting..." : "Submit Registration"}
              </button>
            ) : regSuccess ? (
              <button className="btn btn-outline" style={{ width: "100%" }} type="button" onClick={onClose}>
                Close
              </button>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}
