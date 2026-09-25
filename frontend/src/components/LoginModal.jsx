import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { fetchBranches } from "../services/branchService";
import { fetchRoles } from "../services/rolesService";

const STUDENT_EMAIL_RE = /^[^\s@]+@(gmail\.com|nbkrist\.org)$/i;
const GUIDE_EMAIL_RE = /^[^\s@]+@nbkrist\.org$/i;

export default function LoginModal({ open, onClose, startTab = "login" }) {
  const { login, registerStudent, registerGuide } = useAuth();
  const [tab, setTab] = useState(startTab);
  const [regType, setRegType] = useState("student");
  const [branches, setBranches] = useState([]);
  const [rolesForBranch, setRolesForBranch] = useState([]);
  const [showPass, setShowPass] = useState({ login: false, register: false });
  const [regSuccess, setRegSuccess] = useState("");

  useEffect(() => {
    if (open) {
      setTab(startTab);
      setRegSuccess("");
      fetchBranches().then(setBranches).catch(() => setBranches([]));
    }
  }, [open, startTab]);

  const loginForm = useForm({ defaultValues: { email: "", password: "" } });
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

  const onLoginSubmit = async (data) => {
    try {
      await login(data.email.trim(), data.password);
      toast.success("Welcome back!");
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password.";
      if (msg.toLowerCase().includes("verify")) {
        loginForm.setError("root", { message: msg });
      } else {
        toast.error(msg);
      }
    }
  };

  const onRegisterSubmit = async (data) => {
    const email = data.email.trim().toLowerCase();

    if (regType === "student" && !STUDENT_EMAIL_RE.test(email)) {
      registerForm.setError("email", { message: "Students must use a Gmail (@gmail.com) or college (@nbkrist.org) email." });
      return;
    }
    if (regType === "guide" && !GUIDE_EMAIL_RE.test(email)) {
      registerForm.setError("email", { message: "Guides must register with a @nbkrist.org email address." });
      return;
    }

    try {
      if (regType === "student") {
        const res = await registerStudent({ name: data.name.trim(), email, password: data.password, branch: data.branch });
        setRegSuccess(res.message || "Check your email to verify your account before logging in.");
      } else {
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
      }
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
            <h2>{tab === "login" ? "Sign In" : "Create Account"}</h2>
            <p className="modal-sub">
              {tab === "login" ? "Welcome back — enter your details below." : "Join Pre-Yeah to track your career interests."}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem" }}>
          <button className={`tab ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>Login</button>
          <button className={`tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>Register</button>
        </div>

        {tab === "login" ? (
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@college.edu" {...loginForm.register("email", { required: true })} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="pass-wrap">
                <input type={showPass.login ? "text" : "password"} placeholder="••••••••" {...loginForm.register("password", { required: true })} />
                <button type="button" className="pass-eye" tabIndex={-1} onClick={() => setShowPass((s) => ({ ...s, login: !s.login }))}>
                  {showPass.login ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            {loginForm.formState.errors.root && (
              <p className="ulm-err" style={{ display: "block" }}>{loginForm.formState.errors.root.message}</p>
            )}
            <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={loginForm.formState.isSubmitting}>
              {loginForm.formState.isSubmitting ? "Signing in..." : "Login"}
            </button>
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.9rem", textAlign: "center" }}>
              <a href="/forgot-password?role=student" style={{ color: "var(--primary)" }}>Forgot password?</a>
            </p>
          </form>
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

            {!regSuccess && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Your name" {...registerForm.register("name", { required: true })} />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder={regType === "guide" ? "you@nbkrist.org" : "you@gmail.com or you@nbkrist.org"}
                    {...registerForm.register("email", { required: true })}
                  />
                  <small style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.3rem", display: "block" }}>
                    {regType === "guide" ? "Guides must use a @nbkrist.org email." : "Use your Gmail or @nbkrist.org email."}
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
                  <label>{regType === "guide" ? "Branch you want to guide" : "Your Branch"}</label>
                  <select {...registerForm.register("branch", { required: true })}>
                    {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                {regType === "guide" && (
                  <>
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
              </>
            )}

            {registerForm.formState.errors.root && <p className="ulm-err" style={{ display: "block" }}>{registerForm.formState.errors.root.message}</p>}
            {regSuccess && <p className="ulm-ok">{regSuccess}</p>}

            {!regSuccess ? (
              <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={registerForm.formState.isSubmitting}>
                {registerForm.formState.isSubmitting ? "Submitting..." : regType === "guide" ? "Submit Registration" : "Create Account"}
              </button>
            ) : (
              <button className="btn btn-outline" style={{ width: "100%" }} type="button" onClick={onClose}>
                Close
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}