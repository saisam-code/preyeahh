import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchRoadmap, fetchRoadmaps, setTopicCompleted } from "../services/aiRoadmapService.js";
import RoadmapGraph from "../components/RoadmapGraph.jsx";

export default function RoadmapView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [rm, all] = await Promise.all([
        fetchRoadmap(id),
        fetchRoadmaps({ limit: 10 })
      ]);
      setRoadmap(rm);
      setRelated(all.data || []);
    } catch (err) {
      toast.error("Failed to load roadmap");
      navigate("/roadmaps");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTopicStatusChange = async (topicId, isCompleted) => {
    // Optimistic UI update
    setRoadmap(prev => {
      if (!prev) return prev;
      const newSections = prev.sections.map(section => ({
        ...section,
        topics: section.topics.map(t => t._id === topicId ? { ...t, isCompleted } : t)
      }));
      return { ...prev, sections: newSections };
    });

    try {
      await setTopicCompleted(id, topicId, isCompleted);
    } catch (err) {
      toast.error("Failed to update status");
      // Revert optimism on error? For simplicity, we just leave it or reload.
      loadData();
    }
  };

  if (loading) {
    return <div style={{ padding: "4rem", textAlign: "center", color: "var(--text)" }}>Loading Roadmap...</div>;
  }

  if (!roadmap) return null;

  return (
    <div>
      <RoadmapGraph 
        roadmap={roadmap} 
        relatedRoadmaps={related} 
        onTopicStatusChange={handleTopicStatusChange} 
      />
    </div>
  );
}
