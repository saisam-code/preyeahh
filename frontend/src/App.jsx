import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Roles from "./pages/Roles.jsx";
import Beyond from "./pages/Beyond.jsx";
import Resources from "./pages/Resources.jsx";
import Admin from "./pages/Admin.jsx";
import GoogleCallback from "./pages/GoogleCallback.jsx";
import GoogleOnboarding from "./pages/GoogleOnboarding.jsx";

// Role-specific learning pages
import Chat from "./pages/Chat.jsx";
import MyRoadmaps from "./pages/MyRoadmaps.jsx";
import RoadmapView from "./pages/RoadmapView.jsx";
import Quiz from "./pages/Quiz.jsx";
import Profile from "./pages/Profile.jsx";
import PersonalCareerPlanner from "./pages/PersonalCareerPlanner.jsx";
import CareerDiscovery from "./pages/CareerDiscovery.jsx";
import GetStarted from "./pages/GetStarted.jsx";
import StudentOnboarding from "./pages/StudentOnboarding.jsx";
import InstitutionPortal from "./pages/InstitutionPortal.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/onboarding" element={<StudentOnboarding />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/beyond" element={<Beyond />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/discovery" element={<CareerDiscovery />} />
        <Route path="/institution-portal" element={<InstitutionPortal />} />
        <Route path="/admin" element={<Admin />} />

        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        {/* Google OAuth callback pages — no Navbar auth required, tokens arrive via fragment */}
        <Route path="/google-callback" element={<GoogleCallback />} />
        <Route path="/google-onboarding" element={<GoogleOnboarding />} />

        <Route element={<ProtectedRoute allowedRoles={["student", "guide"]} redirectTo="/?login=1" />}>
          <Route path="/chat" element={<Chat />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["student"]} redirectTo="/?login=1" />}>
          <Route path="/planner" element={<PersonalCareerPlanner />} />
          <Route path="/roadmaps" element={<MyRoadmaps />} />
          <Route path="/roadmap/:id" element={<RoadmapView />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/progress" element={<Navigate to="/#student-progress" replace />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
