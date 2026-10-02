import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Roles from "./pages/Roles.jsx";
import Beyond from "./pages/Beyond.jsx";
import Resources from "./pages/Resources.jsx";
import Admin from "./pages/Admin.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";

// Student-only AI pages
import Chat from "./pages/Chat.jsx";
import MyRoadmaps from "./pages/MyRoadmaps.jsx";
import Quiz from "./pages/Quiz.jsx";
import Profile from "./pages/Profile.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/beyond" element={<Beyond />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/admin" element={<Admin />} />

        <Route element={<ProtectedRoute allowedRoles={["student", "guide"]} redirectTo="/?login=1" />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        <Route element={<ProtectedRoute allowedRoles={["student"]} redirectTo="/?login=1" />}>
          <Route path="/chat" element={<Chat />} />
          <Route path="/roadmaps" element={<MyRoadmaps />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/progress" element={<Navigate to="/dashboard#student-progress" replace />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
