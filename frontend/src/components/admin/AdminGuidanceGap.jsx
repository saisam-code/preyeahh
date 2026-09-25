import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminGuidanceGap() {
  const [gaps, setGaps] = useState([]);
  
  useEffect(() => {
    api.get("/admin/guidance-gaps").then((res) => {
      setGaps(res.data.data);
    });
  }, []);

  return (
    <div className="guidance-gap-dashboard">
      <h2>Guidance Gaps ({gaps.length})</h2>
      <p style={{ color: "#ff6b6b" }}>
        ⚠️ Roles without guidance curated (visibility only)
      </p>
      
      {gaps.map((role) => (
        <div key={role._id} className="gap-item">
          <h3>{role.name}</h3>
          <p>Status: {role.guidance.status}</p>
        </div>
      ))}
    </div>
  );
}