import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.firstName || "User"}!</h1>
      
      <div className="user-info">
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Branch:</strong> {user?.branch || "Not set"}</p>
        <p><strong>Verified:</strong> {user?.isVerified ? "✅ Yes" : "❌ No"}</p>
      </div>

      <div className="coming-soon">
        <h2>Coming Soon</h2>
        <ul>
          <li>🎓 Roadmaps</li>
          <li>❓ Quizzes</li>
          <li>🤖 AI Assistant</li>
          <li>📊 Progress Tracking</li>
        </ul>
      </div>
    </div>
  );
}