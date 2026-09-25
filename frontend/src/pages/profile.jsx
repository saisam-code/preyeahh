import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Profile() {
  const { user } = useContext(AuthContext);

  return (
    <div className="profile">
      <h1>Your Profile</h1>

      <div className="profile-card">
        <h2>{user?.firstName} {user?.lastName}</h2>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Branch:</strong> {user?.branch || "Not selected"}</p>
        <p><strong>Account Status:</strong> {user?.isVerified ? "Verified ✅" : "Unverified ❌"}</p>
      </div>

      <button>Edit Profile (Coming Soon)</button>
    </div>
  );
}