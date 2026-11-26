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

// Public Pages
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";

// Auth Experience Pages
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import GetStarted from "./pages/GetStarted.jsx";
import StudentOnboarding from "./pages/StudentOnboarding.jsx";
import GoogleCallback from "./pages/GoogleCallback.jsx";
import GoogleOnboarding from "./pages/GoogleOnboarding.jsx";

// Authenticated Pages
import PersonalCareerPlanner from "./pages/PersonalCareerPlanner.jsx";
import CareerDiscovery from "./pages/CareerDiscovery.jsx";
import MyRoadmaps from "./pages/MyRoadmaps.jsx";
import RoadmapView from "./pages/RoadmapView.jsx";
import Quiz from "./pages/Quiz.jsx";
import Profile from "./pages/Profile.jsx";
import Resources from "./pages/Resources.jsx";
import Roles from "./pages/Roles.jsx";
import Beyond from "./pages/Beyond.jsx";
import Chat from "./pages/Chat.jsx";

import GuidePanel from "./pages/GuidePanel.jsx";
import ParentPortal from "./pages/ParentPortal.jsx";
import InstitutionPortal from "./pages/InstitutionPortal.jsx";
import Admin from "./pages/Admin.jsx";
import GovernmentCareers from "./pages/GovernmentCareers.jsx";
import Dashboard from "./pages/Dashboard.jsx";
const DesignSystem = import.meta.env.DEV ? lazy(() => import("./pages/DesignSystem.jsx")) : null;

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
    const roleRoute = /^\/(dashboard|discovery|government-careers|planner|roadmaps|roadmap|quiz|profile|resources|roles|beyond|chat|guide-panel|parent-portal|institution-portal)(\/|$)/.test(location.pathname);
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
    <Routes>
      {import.meta.env.DEV && <Route path="/dev/design-system" element={<Suspense fallback={null}><DesignSystem /></Suspense>} />}
      {/* ── EXPERIENCE A: PUBLIC WEBSITE (Home, About & Government Careers) ── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/explore-careers" element={<CareerDiscovery />} />
        <Route path="/government-careers" element={<GovernmentCareers />} />
        <Route path="/discovery/government" element={<GovernmentCareers />} />
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
          <Route path="/discovery" element={<CareerDiscovery />} />
          <Route path="/government-careers" element={<GovernmentCareers />} />
          <Route path="/discovery/government" element={<GovernmentCareers />} />
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
  );
}
