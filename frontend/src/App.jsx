import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { getEducationMaturityStage } from "./constants/educationStages.js";

// Layouts
import PublicLayout from "./layouts/PublicLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import StudentLayout from "./layouts/StudentLayout.jsx";
import GuideLayout from "./layouts/GuideLayout.jsx";
import ParentLayout from "./layouts/ParentLayout.jsx";
import InstitutionLayout from "./layouts/InstitutionLayout.jsx";
import RoleLayout from "./layouts/RoleLayout.jsx";

// Guards
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const GetStarted = lazy(() => import("./pages/GetStarted.jsx"));
const StudentOnboarding = lazy(() => import("./pages/StudentOnboarding.jsx"));
const GoogleCallback = lazy(() => import("./pages/GoogleCallback.jsx"));
const GoogleOnboarding = lazy(() => import("./pages/GoogleOnboarding.jsx"));
const PersonalCareerPlanner = lazy(() => import("./pages/PersonalCareerPlanner.jsx"));
const Explore = lazy(() => import("./pages/Explore.jsx"));
const MyRoadmaps = lazy(() => import("./pages/MyRoadmaps.jsx"));
const RoadmapView = lazy(() => import("./pages/RoadmapView.jsx"));
const Quiz = lazy(() => import("./pages/Quiz.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Resources = lazy(() => import("./pages/Resources.jsx"));
const Roles = lazy(() => import("./pages/Roles.jsx"));
const Beyond = lazy(() => import("./pages/Beyond.jsx"));
const Chat = lazy(() => import("./pages/Chat.jsx"));
const GuidePanel = lazy(() => import("./pages/GuidePanel.jsx"));
const ParentPortal = lazy(() => import("./pages/ParentPortal.jsx"));
const InstitutionPortal = lazy(() => import("./pages/InstitutionPortal.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));

export default function App() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();
  const [appearanceRevision, setAppearanceRevision] = useState(0);

  useEffect(() => {
    const refreshAppearance = () => setAppearanceRevision((revision) => revision + 1);
    const refreshTheme = () => {
      document.documentElement.dataset.theme = localStorage.getItem("pp_theme") || "system";
    };
    window.addEventListener("preyeahh-appearance-change", refreshAppearance);
    window.addEventListener("preyeahh-theme-change", refreshTheme);
    return () => {
      window.removeEventListener("preyeahh-appearance-change", refreshAppearance);
      window.removeEventListener("preyeahh-theme-change", refreshTheme);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = localStorage.getItem("pp_theme") || "system";
    const storedOverride = localStorage.getItem("pp_stage_override") || "auto";
    const educationStage = user?.preferences?.educationStage || location.state?.onboardingData?.educationStage;
    const isAdmin = location.pathname === "/admin";
    const roleRoute = /^\/(dashboard|explore|discovery|government-careers|planner|roadmaps|roadmap|quiz|profile|resources|roles|beyond|chat|guide-panel|parent-portal|institution-portal)(\/|$)/.test(location.pathname);
    const stage = storedOverride !== "auto"
      ? storedOverride
      : educationStage
        ? getEducationMaturityStage(educationStage)
        : "senior";

    root.dataset.stage = stage;
    root.dataset.role = isAdmin ? "admin" : roleRoute ? user?.role || "" : "";
    if (isAdmin) {
      root.dataset.rolePreview = "";
      root.style.setProperty("--role-tint", "var(--role-admin)");
    } else {
      root.dataset.rolePreview = roleRoute ? user?.role || "student" : "";
      root.style.removeProperty("--role-tint");
    }
  }, [appearanceRevision, location.pathname, location.state, user]);

  // Redirect legacy /?login=1 queries directly to canonical /login
  if (searchParams.get("login") === "1") {
    const role = searchParams.get("role");
    const target = role ? `/login?role=${role}` : "/login";
    return <Navigate to={target} replace />;
  }

  return (
    <Suspense fallback={<div className="route-loading" role="status">Loading page...</div>}>
    <Routes>
      {/* ── EXPERIENCE A: PUBLIC WEBSITE (Home, About & Government Careers) ── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/explore-careers" element={<Explore />} />
        <Route path="/government-careers" element={<Navigate to="/explore-careers?section=exams" replace />} />
        <Route path="/discovery/government" element={<Navigate to="/explore-careers?section=exams" replace />} />
      </Route>

      {/* ── EXPERIENCE B: AUTHENTICATION EXPERIENCE ── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/onboarding" element={<StudentOnboarding />} />
        <Route path="/google-callback" element={<GoogleCallback />} />
        <Route path="/google-onboarding" element={<GoogleOnboarding />} />
      </Route>

      {/* ── SHARED AUTHENTICATED ROUTES: STUDENT & GUIDE (SINGLE DEFINITION VIA ROLELAYOUT) ── */}
      <Route element={<ProtectedRoute allowedRoles={["student", "guide"]} redirectTo="/login" />}>
        <Route element={<RoleLayout />}>
          <Route path="/chat" element={<Chat />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/beyond" element={<Beyond />} />
        </Route>
      </Route>

      {/* ── STUDENT-ONLY AUTHENTICATED APPLICATION ── */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} redirectTo="/login" />}>
        <Route element={<StudentLayout />}>
          <Route path="/planner" element={<PersonalCareerPlanner />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/discovery" element={<Explore />} />
          <Route path="/roadmaps" element={<MyRoadmaps />} />
          <Route path="/roadmap/:id" element={<RoadmapView />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Route>

      {/* ── GUIDE-ONLY AUTHENTICATED APPLICATION ── */}
      <Route element={<ProtectedRoute allowedRoles={["guide"]} redirectTo="/login" />}>
        <Route element={<GuideLayout />}>
          <Route path="/guide-panel" element={<GuidePanel />} />
        </Route>
      </Route>

      {/* ── EXPERIENCE C: AUTHENTICATED PARENT APPLICATION ── */}
      <Route element={<ProtectedRoute allowedRoles={["parent"]} redirectTo="/login" />}>
        <Route element={<ParentLayout />}>
          <Route path="/parent-portal" element={<ParentPortal />} />
        </Route>
      </Route>

      {/* ── EXPERIENCE C: AUTHENTICATED INSTITUTION APPLICATION ── */}
      <Route element={<ProtectedRoute allowedRoles={["institution"]} redirectTo="/login" />}>
        <Route element={<InstitutionLayout />}>
          <Route path="/institution-portal" element={<InstitutionPortal />} />
        </Route>
      </Route>

      {/* ── PRIVATE PROTECTED SYSTEM ROLE: ADMIN ── */}
      <Route path="/admin" element={<Admin />} />

      {/* ── CATCH-ALL REDIRECT ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
