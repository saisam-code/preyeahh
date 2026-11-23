import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FaEye, FaEyeSlash, FaArrowRight, FaCheck } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import preyeahhLogo from "../assets/preyeahh-logo.png";
import toast from "react-hot-toast";

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
    <div style={{ minHeight: "calc(100vh - 70px)", background: "var(--bg)", padding: "2.5rem 1rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          maxWidth: 540,
          width: "100%",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "1.25rem",
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <img src={preyeahhLogo} alt="PREYEAHH Logo" style={{ width: 38, height: 38, objectFit: "contain" }} />
          <div>
            <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>Create Your Account</h2>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Join the Preyeahh Career Universe</span>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.35rem", marginBottom: "1.5rem" }}>
          {[
            { id: "student", label: "Student" },
            { id: "guide", label: "Guide" },
            { id: "parent", label: "Parent" },
            { id: "institution", label: "Institution" },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleRoleChange(id)}
              style={{
                padding: "0.5rem 0.25rem",
                borderRadius: "0.5rem",
                fontSize: "0.82rem",
                fontWeight: role === id ? 700 : 500,
                border: "1px solid",
                borderColor: role === id ? "var(--primary)" : "var(--border)",
                background: role === id ? "rgba(21,128,61,0.08)" : "transparent",
                color: role === id ? "var(--primary)" : "var(--text)",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {successMsg ? (
          <div style={{ background: "rgba(21,128,61,0.08)", border: "1px solid var(--primary)", borderRadius: "0.75rem", padding: "1.5rem", textAlign: "center" }}>
            <div style={{ color: "var(--primary)", fontSize: "1.8rem", marginBottom: "0.5rem" }}><FaCheck /></div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem" }}>Registration Submitted</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.5, margin: "0 0 1.25rem" }}>
              {successMsg}
            </p>
            <Link to={`/login?role=${role}`} className="btn btn-primary btn-sm">
              Proceed to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Common Name */}
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                {role === "institution" ? "Institution Name" : "Full Name"}
              </label>
              <input
                type="text"
                placeholder={role === "institution" ? "e.g. N.B.K.R. Institute of Science & Technology" : "e.g. Ananya Sharma"}
                {...register("name", { required: "Name is required", minLength: { value: 2, message: "Min 2 characters" } })}
                style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
              />
              {errors.name && <small style={{ color: "var(--error)", fontSize: "0.78rem" }}>{errors.name.message}</small>}
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                {role === "guide" ? "Official College Email (@nbkrist.org)" : role === "institution" ? "Official Placement Email" : "Email Address"}
              </label>
              <input
                type="email"
                placeholder={role === "guide" ? "faculty@nbkrist.org" : role === "institution" ? "placement@college.edu" : "student@gmail.com"}
                {...register("email", { required: "Email is required" })}
                style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
              />
              {errors.email && <small style={{ color: "var(--error)", fontSize: "0.78rem" }}>{errors.email.message}</small>}
            </div>

            {/* Role-specific fields */}
            {(role === "student" || role === "guide") && (
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Academic Branch</label>
                <select
                  {...register("branch")}
                  style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                >
                  {BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {role === "guide" && (
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Designation / Bio</label>
                <input
                  type="text"
                  placeholder="e.g. Associate Professor in AI/ML & Distributed Systems"
                  {...register("bio")}
                  style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                />
              </div>
            )}

            {role === "parent" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      {...register("phone")}
                      style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Relationship</label>
                    <select
                      {...register("relationship")}
                      style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Student Email (To link account)</label>
                  <input
                    type="email"
                    placeholder="student@gmail.com"
                    {...register("studentEmail")}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Optional: You can also link your student from settings later.</small>
                </div>
              </>
            )}

            {role === "institution" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Institution Code</label>
                    <input
                      type="text"
                      placeholder="e.g. NBKRIST"
                      {...register("code", { required: "Institution code required" })}
                      style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Category</label>
                    <select
                      {...register("category")}
                      style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                    >
                      <option value="Engineering College">Engineering College</option>
                      <option value="University">University</option>
                      <option value="Junior College">Junior College</option>
                      <option value="Polytechnic">Polytechnic</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. K. Sudhir"
                      {...register("contactPerson")}
                      style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Placement Officer"
                      {...register("designation")}
                      style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Passwords */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Min 6 chars"
                    {...register("password", { required: "Password required", minLength: { value: 6, message: "Min 6 characters" } })}
                    style={{ width: "100%", padding: "0.65rem 2.2rem 0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  >
                    {showPass ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <small style={{ color: "var(--error)", fontSize: "0.75rem" }}>{errors.password.message}</small>}
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Confirm Password</label>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Repeat password"
                  {...register("confirmPassword", { required: "Confirm password required" })}
                  style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                />
                {errors.confirmPassword && <small style={{ color: "var(--error)", fontSize: "0.75rem" }}>{errors.confirmPassword.message}</small>}
              </div>
            </div>

            {errors.root && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid var(--error)", borderRadius: "0.5rem", padding: "0.6rem", color: "var(--error)", fontSize: "0.82rem" }}>
                {errors.root.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: "0.75rem", fontWeight: 700, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem" }}
            >
              {isSubmitting ? "Creating Account..." : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`} <FaArrowRight />
            </button>

            <div style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Already have an account? <Link to={`/login?role=${role}`} style={{ color: "var(--primary)", fontWeight: 600 }}>Sign in here</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
