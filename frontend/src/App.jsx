import { Routes, Route, Navigate, useSearchParams } from "react-router-dom";

// Layouts
import PublicLayout from "./layouts/PublicLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import StudentLayout from "./layouts/StudentLayout.jsx";
import GuideLayout from "./layouts/GuideLayout.jsx";
import ParentLayout from "./layouts/ParentLayout.jsx";
import InstitutionLayout from "./layouts/InstitutionLayout.jsx";

// Guards
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Public Pages
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";

// Auth Experience Pages
import Login from "./pages/Login.jsx";
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

export default function App() {
  const [searchParams] = useSearchParams();

  // Redirect legacy /?login=1 queries directly to canonical /login
  if (searchParams.get("login") === "1") {
    const role = searchParams.get("role");
    const target = role ? `/login?role=${role}` : "/login";
    return <Navigate to={target} replace />;
  }

  return (
    <Routes>
      {/* ── EXPERIENCE A: PUBLIC WEBSITE (ONLY Home & About) ── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Route>

      {/* ── EXPERIENCE B: AUTHENTICATION EXPERIENCE ── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/onboarding" element={<StudentOnboarding />} />
        <Route path="/google-callback" element={<GoogleCallback />} />
        <Route path="/google-onboarding" element={<GoogleOnboarding />} />
      </Route>

      {/* ── EXPERIENCE C: AUTHENTICATED STUDENT APPLICATION ── */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} redirectTo="/login" />}>
        <Route element={<StudentLayout />}>
          <Route path="/planner" element={<PersonalCareerPlanner />} />
          <Route path="/discovery" element={<CareerDiscovery />} />
          <Route path="/roadmaps" element={<MyRoadmaps />} />
          <Route path="/roadmap/:id" element={<RoadmapView />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/beyond" element={<Beyond />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Navigate to="/planner" replace />} />
        </Route>
      </Route>

      {/* ── EXPERIENCE C: AUTHENTICATED GUIDE APPLICATION ── */}
      <Route element={<ProtectedRoute allowedRoles={["guide"]} redirectTo="/login" />}>
        <Route element={<GuideLayout />}>
          <Route path="/guide-panel" element={<GuidePanel />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/beyond" element={<Beyond />} />
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
