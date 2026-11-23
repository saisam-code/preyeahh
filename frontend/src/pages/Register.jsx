import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FaEye, FaEyeSlash, FaArrowRight, FaXmark, FaCheck } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import { CAREER_DOMAINS } from "../data/careerWheelData.js";
import CareerWheel from "../components/wheel/CareerWheel.jsx";
import CareerCategoryDetails from "../components/wheel/CareerCategoryDetails.jsx";
import { updatePreferences } from "../services/studentService.js";
import preyeahhLogo from "../assets/preyeahh-logo.png";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const BRANCH_OPTIONS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AI&DS", "OTHER"];

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { registerStudent, registerGuide, registerParent, registerInstitution } = useAuth();

  const [role, setRole] = useState(() => {
    const r = searchParams.get("role");
    return ["student", "guide", "parent", "institution"].includes(r) ? r : "student";
  });

  const [showPass, setShowPass] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Career Wheel Interactive Exploration State
  const [selectedDomain, setSelectedDomain] = useState(CAREER_DOMAINS[0]);
  const [selectedDomainInterests, setSelectedDomainInterests] = useState([]);
  const [selectedCareerRoles, setSelectedCareerRoles] = useState([]);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      branch: "CSE",
      roleNames: "Assistant Professor",
      bio: "",
      phone: "",
      relationship: "Guardian",
      studentEmail: "",
      code: "",
      category: "Engineering College",
      location: "",
      website: "",
      contactPerson: "",
      designation: "Placement Cell Head",
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, reset } = form;

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setSuccessMsg("");
    reset();
  };

  // Toggle individual career within domain
  const handleToggleCareer = (careerName) => {
    if (selectedCareerRoles.includes(careerName)) {
      setSelectedCareerRoles(selectedCareerRoles.filter((c) => c !== careerName));
    } else {
      setSelectedCareerRoles([...selectedCareerRoles, careerName]);
    }
  };

  // Toggle domain category interest
  const handleToggleDomainInterest = (domainTitle) => {
    if (selectedDomainInterests.includes(domainTitle)) {
      setSelectedDomainInterests(selectedDomainInterests.filter((d) => d !== domainTitle));
    } else {
      setSelectedDomainInterests([...selectedDomainInterests, domainTitle]);
    }
  };

  const onSubmit = async (values) => {
    setSuccessMsg("");
    if (values.password !== values.confirmPassword) {
      setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }

    try {
      if (role === "student") {
        await registerStudent({
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          branch: values.branch,
        });

        // If student preselected career interests from the orbit, save them
        if (selectedDomainInterests.length || selectedCareerRoles.length) {
          try {
            await updatePreferences({
              interests: selectedDomainInterests,
              primaryCareerGoal: selectedCareerRoles[0] || selectedDomain.careers[0]?.name || "",
              targetRole: selectedCareerRoles[0] || selectedDomain.careers[0]?.name || "",
            });
          } catch {
            // Non-fatal if session not yet verified
          }
        }

        setSuccessMsg("Registration successful! Please check your email to verify your student account before logging in.");
      } else if (role === "guide") {
        await registerGuide({
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          branch: values.branch,
          roleNames: values.roleNames ? [values.roleNames] : ["Faculty Guide"],
          bio: values.bio,
        });
        setSuccessMsg("Guide account submitted! Check your official @nbkrist.org email for verification.");
      } else if (role === "parent") {
        await registerParent({
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          phone: values.phone,
          relationship: values.relationship,
          studentEmail: values.studentEmail ? values.studentEmail.trim().toLowerCase() : undefined,
        });
        setSuccessMsg("Parent account created! You can now log in to the Parent Portal.");
        setTimeout(() => navigate(`/login?role=parent`), 2000);
      } else if (role === "institution") {
        await registerInstitution({
          name: values.name.trim(),
          code: values.code.trim().toUpperCase(),
          category: values.category,
          location: values.location,
          website: values.website,
          contactEmail: values.email.trim().toLowerCase(),
          password: values.password,
          contactPerson: values.contactPerson,
          designation: values.designation,
        });
        setSuccessMsg("Institution registered successfully! Under placement cell verification review.");
        setTimeout(() => navigate(`/login?role=institution`), 2500);
      }
      toast.success("Account registered!");
    } catch (err) {
      setError("root", { message: err.response?.data?.message || err.message || "Registration failed" });
    }
  };

  return (
    <main style={{ minHeight: "calc(100vh - 70px)", background: "var(--bg)", padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        {/* Title Bar */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: 1.2, color: "var(--primary)", fontWeight: 700 }}>
            DISCOVER · CHOOSE · REGISTER
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, margin: "0.25rem 0", color: "var(--text)" }}>
            Explore Career Orbit &amp; Create Account
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: 680, margin: "0 auto" }}>
            Spin through 12 major career domains, discover specialized roles, and create your account to synchronize your personalized career roadmap.
          </p>
        </div>

        {/* Selected Interests Chip Bar */}
        {(selectedDomainInterests.length > 0 || selectedCareerRoles.length > 0) && (
          <div
            style={{
              background: "var(--surface)",
              border: "1.5px solid var(--primary)",
              borderRadius: "1rem",
              padding: "0.85rem 1.25rem",
              marginBottom: "2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)" }}>Selected Interests:</span>
              {selectedDomainInterests.map((d) => (
                <span
                  key={d}
                  style={{
                    background: "rgba(21,128,61,0.1)",
                    color: "var(--primary)",
                    borderRadius: "2rem",
                    padding: "0.2rem 0.65rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  {d}
                  <FaXmark style={{ cursor: "pointer" }} onClick={() => handleToggleDomainInterest(d)} />
                </span>
              ))}
              {selectedCareerRoles.map((c) => (
                <span
                  key={c}
                  style={{
                    background: "var(--surface-mid)",
                    color: "var(--text)",
                    borderRadius: "2rem",
                    padding: "0.2rem 0.65rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    border: "1px solid var(--border)",
                  }}
                >
                  {c}
                  <FaXmark style={{ cursor: "pointer" }} onClick={() => handleToggleCareer(c)} />
                </span>
              ))}
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600 }}>
              ✓ Will sync to your profile
            </span>
          </div>
        )}

        {/* ── MAIN WORKSPACE GRID: WHEEL + DETAILS + REGISTRATION ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "2rem", alignItems: "start" }}>
          {/* 1. RADIAL CAREER WHEEL */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.5rem",
              padding: "2rem 1.5rem",
              boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: 1, color: "var(--primary)", fontWeight: 700 }}>
                Interactive Radial Wheel
              </div>
              <h3 style={{ margin: "0.15rem 0", fontSize: "1.2rem", fontWeight: 700 }}>Click Any Domain Segment</h3>
            </div>

            <CareerWheel
              domains={CAREER_DOMAINS}
              selectedDomain={selectedDomain}
              onSelectDomain={setSelectedDomain}
              multiSelectedIds={selectedDomainInterests.map(
                (title) => CAREER_DOMAINS.find((d) => d.title === title)?.id
              ).filter(Boolean)}
            />

            <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Active Selection: <strong style={{ color: selectedDomain?.color }}>{selectedDomain?.title}</strong>
            </div>
          </div>

          {/* 2. SELECTED CATEGORY DETAILS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <CareerCategoryDetails
              domain={selectedDomain}
              selectedCareerNames={selectedCareerRoles}
              onToggleCareer={handleToggleCareer}
              onAddDomainInterest={handleToggleDomainInterest}
              isDomainSelected={selectedDomainInterests.includes(selectedDomain?.title)}
            />
          </div>

          {/* 3. INTEGRATED REGISTRATION FORM */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.5rem",
              padding: "2rem",
              boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
              <img src={preyeahhLogo} alt="PREYEAHH Logo" style={{ width: 36, height: 36, objectFit: "contain" }} />
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Create an Account</h3>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Join the Preyeahh Career Universe</span>
              </div>
            </div>

            {/* Role Switcher Tabs */}
            <div className="ulm-reg-toggle lp-toggle" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.25rem", marginBottom: "1.25rem" }}>
              {[
                { id: "student", label: "Student" },
                { id: "guide", label: "Guide" },
                { id: "parent", label: "Parent" },
                { id: "institution", label: "Institution" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`ulm-rt-btn ${role === id ? "active" : ""}`}
                  style={{ fontSize: "0.78rem", padding: "0.45rem 0.2rem" }}
                  onClick={() => handleRoleChange(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {successMsg ? (
              <div
                style={{
                  background: "rgba(21,128,61,0.08)",
                  border: "1px solid var(--primary)",
                  borderRadius: "0.75rem",
                  padding: "1.25rem",
                  textAlign: "center",
                  color: "var(--primary)",
                  marginBottom: "1.5rem",
                }}
              >
                <FaCheck style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }} />
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>{successMsg}</p>
                <div style={{ marginTop: "1rem" }}>
                  <Link to={`/login?role=${role}`} className="btn btn-primary btn-sm">
                    Proceed to Login <FaArrowRight />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="reg-name">{role === "institution" ? "Institution Name" : "Full Name"}</label>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder={
                      role === "institution" ? "e.g. NBKR Institute of Science & Technology" :
                      role === "guide" ? "e.g. Dr. Radhika" :
                      role === "parent" ? "e.g. Ramesh Sharma" :
                      "Your full name"
                    }
                    {...register("name", { required: "Name is required" })}
                  />
                  {errors.name && <small className="lp-err">{errors.name.message}</small>}
                </div>

                {/* Email Address */}
                <div className="form-group">
                  <label htmlFor="reg-email">
                    {role === "guide" ? "Official College Email (@nbkrist.org)" : "Email Address"}
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    placeholder={
                      role === "guide" ? "you@nbkrist.org" :
                      role === "institution" ? "placement@college.edu" :
                      role === "parent" ? "parent@example.com" :
                      "you@gmail.com"
                    }
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: role === "guide" ? /^[^\s@]+@nbkrist\.org$/i : /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: role === "guide" ? "Guides must register with an official @nbkrist.org email" : "Invalid email format",
                      },
                    })}
                  />
                  {errors.email && <small className="lp-err">{errors.email.message}</small>}
                </div>

                {/* Student / Guide Branch Selector */}
                {(role === "student" || role === "guide") && (
                  <div className="form-group">
                    <label htmlFor="reg-branch">Engineering Branch</label>
                    <select id="reg-branch" {...register("branch", { required: "Branch is required" })}>
                      {BRANCH_OPTIONS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    {errors.branch && <small className="lp-err">{errors.branch.message}</small>}
                  </div>
                )}

                {/* Guide Specific Fields */}
                {role === "guide" && (
                  <>
                    <div className="form-group">
                      <label htmlFor="reg-roleNames">Designation / Faculty Role</label>
                      <input
                        id="reg-roleNames"
                        type="text"
                        placeholder="e.g. Associate Professor & Placement Mentor"
                        {...register("roleNames")}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="reg-bio">Short Bio &amp; Research Focus</label>
                      <textarea
                        id="reg-bio"
                        rows={2}
                        placeholder="Brief background and mentorship interests..."
                        {...register("bio")}
                      />
                    </div>
                  </>
                )}

                {/* Parent Specific Fields */}
                {role === "parent" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div className="form-group">
                        <label htmlFor="reg-phone">Phone Number</label>
                        <input id="reg-phone" type="tel" placeholder="+91 9876543210" {...register("phone")} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="reg-relationship">Relationship</label>
                        <select id="reg-relationship" {...register("relationship")}>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Guardian</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="reg-studentEmail">Ward's Student Email</label>
                      <input
                        id="reg-studentEmail"
                        type="email"
                        placeholder="ward@gmail.com or ward@nbkrist.org"
                        {...register("studentEmail")}
                      />
                    </div>
                  </>
                )}

                {/* Institution Specific Fields */}
                {role === "institution" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div className="form-group">
                        <label htmlFor="reg-code">College Code</label>
                        <input id="reg-code" type="text" placeholder="e.g. NBKR" {...register("code", { required: "Code is required" })} />
                        {errors.code && <small className="lp-err">{errors.code.message}</small>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="reg-category">Category</label>
                        <select id="reg-category" {...register("category")}>
                          <option value="Engineering College">Engineering College</option>
                          <option value="University">University</option>
                          <option value="Polytechnic">Polytechnic</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div className="form-group">
                        <label htmlFor="reg-contactPerson">Contact Person</label>
                        <input id="reg-contactPerson" type="text" placeholder="Placement Officer" {...register("contactPerson")} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="reg-designation">Designation</label>
                        <input id="reg-designation" type="text" placeholder="Head of Training & Placement" {...register("designation")} />
                      </div>
                    </div>
                  </>
                )}

                {/* Password Fields */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label htmlFor="reg-pass">Password</label>
                    <div className="pass-wrap">
                      <input
                        id="reg-pass"
                        type={showPass ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="At least 6 chars"
                        {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 characters" } })}
                      />
                      <button type="button" className="pass-eye" tabIndex={-1} onClick={() => setShowPass((s) => !s)} aria-label="Toggle password">
                        {showPass ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.password && <small className="lp-err">{errors.password.message}</small>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-cpass">Confirm Password</label>
                    <input
                      id="reg-cpass"
                      type={showPass ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Repeat password"
                      {...register("confirmPassword", { required: "Confirm password" })}
                    />
                    {errors.confirmPassword && <small className="lp-err">{errors.confirmPassword.message}</small>}
                  </div>
                </div>

                {errors.root && <p className="ulm-err" style={{ display: "block", marginTop: "0.5rem" }}>{errors.root.message}</p>}

                <button className="btn btn-primary lp-full" type="submit" disabled={isSubmitting} style={{ marginTop: "1rem" }}>
                  {isSubmitting ? "Creating Account..." : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                </button>
              </form>
            )}

            {/* Google OAuth is supported for student and guide */}
            {(role === "student" || role === "guide") && !successMsg && (
              <>
                <div className="lp-or"><span>OR</span></div>
                <a href={`${API_BASE}/auth/google?role=${role}`} className="btn btn-outline lp-full lp-google">
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  Sign up with Google
                </a>
              </>
            )}

            <div style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <Link to={`/login?role=${role}`} style={{ color: "var(--primary)", fontWeight: 600 }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
