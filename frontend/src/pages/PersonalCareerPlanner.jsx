import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  FaCalendarCheck,
  FaPlus,
  FaBolt,
  FaClock,
  FaCheck,
  FaTrash,
  FaCalendarDays,
  FaFlag,
  FaArrowRight,
  FaRotate,
} from "react-icons/fa6";
import {
  getStudentPlan,
  addPlannerTask,
  togglePlannerTask,
  reschedulePlannerTask,
  deletePlannerTask,
  generateAdaptiveSchedule,
} from "../services/careerPlannerService.js";

const CATEGORIES = [
  "Academic study",
  "Skill development",
  "Career research",
  "Career experiment",
  "Practical project",
  "Portfolio development",
  "Exam preparation",
  "Rest and breaks",
];

export default function PersonalCareerPlanner() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("today"); // today, week, milestones
  const [generating, setGenerating] = useState(false);

  // New task form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("Skill development");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskDate, setTaskDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [taskStart, setTaskStart] = useState("18:00");
  const [taskDuration, setTaskDuration] = useState(45);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await getStudentPlan();
      setPlan(data);
    } catch (err) {
      toast.error("Could not load career planner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleToggle = async (taskId) => {
    try {
      const updated = await togglePlannerTask(taskId);
      setPlan((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t._id === taskId ? { ...t, isCompleted: updated.isCompleted } : t)),
      }));
      toast.success(updated.isCompleted ? "Task completed! Great progress." : "Task marked incomplete");
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deletePlannerTask(taskId);
      setPlan((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t._id !== taskId),
      }));
      toast.success("Task removed");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return toast.error("Task title required");

    try {
      const newTask = await addPlannerTask({
        title: taskTitle.trim(),
        category: taskCategory,
        priority: taskPriority,
        scheduledDate: taskDate,
        startTime: taskStart,
        durationMinutes: Number(taskDuration),
      });
      setPlan((prev) => ({ ...prev, tasks: [...prev.tasks, newTask] }));
      setShowAddModal(false);
      setTaskTitle("");
      toast.success("Task added to schedule");
    } catch {
      toast.error("Error creating task");
    }
  };

  const handleGenerateAiSchedule = async () => {
    setGenerating(true);
    try {
      await generateAdaptiveSchedule({ availableHoursPerDay: 2 });
      toast.success("Personalized AI timetable generated!");
      await loadPlan();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate schedule");
    } finally {
      setGenerating(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = plan?.tasks?.filter((t) => t.scheduledDate === todayStr) || [];
  const upcomingTasks = plan?.tasks?.filter((t) => t.scheduledDate >= todayStr) || [];

  return (
    <div className="planner-container" style={{ padding: "1.5rem 0", maxWidth: 1000, margin: "0 auto" }}>
      {/* Header & Positioning */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FaCalendarCheck style={{ color: "var(--primary)" }} /> Personal Career Planner
          </h2>
          <p style={{ color: "var(--text-muted)", margin: "0.35rem 0 0", fontSize: "0.95rem" }}>
            <em>"Know your destination. Know your next step. Know when to take it."</em>
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleGenerateAiSchedule}
            disabled={generating}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <FaBolt /> {generating ? "Generating..." : "AI Adaptive Timetable"}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <FaPlus /> Add Task
          </button>
        </div>
      </div>

      {/* Target career badge banner */}
      {plan?.primaryCareer && (
        <div style={{ background: "var(--primary-bg, rgba(26,86,219,0.08))", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: 0.8, color: "var(--primary)", fontWeight: 700 }}>Active Target Goal</span>
            <h4 style={{ margin: "0.15rem 0 0", fontSize: "1.1rem" }}>{plan.primaryCareer}</h4>
          </div>
          <span className="branch-tag">{plan.academicStage || "Undergraduate"}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        <button className={`tab ${activeTab === "today" ? "active" : ""}`} onClick={() => setActiveTab("today")}>
          Today's Plan ({todayTasks.length})
        </button>
        <button className={`tab ${activeTab === "week" ? "active" : ""}`} onClick={() => setActiveTab("week")}>
          All Scheduled ({upcomingTasks.length})
        </button>
        <button className={`tab ${activeTab === "milestones" ? "active" : ""}`} onClick={() => setActiveTab("milestones")}>
          Milestones & Timeline
        </button>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="empty"><p>Loading planner...</p></div>
      ) : activeTab === "milestones" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {plan?.milestones?.map((m, idx) => (
            <div key={idx} style={{ padding: "1rem 1.25rem", background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "0.75rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {idx + 1}
              </span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: "1rem" }}>{m.title}</strong>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{m.timeHorizon}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {(activeTab === "today" ? todayTasks : upcomingTasks).length === 0 ? (
            <div className="empty" style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
              <FaCalendarDays style={{ fontSize: "2rem", color: "var(--text-muted)", marginBottom: "0.5rem" }} />
              <p>No tasks scheduled yet. Click <strong>AI Adaptive Timetable</strong> or <strong>Add Task</strong> above.</p>
            </div>
          ) : (
            (activeTab === "today" ? todayTasks : upcomingTasks).map((t) => (
              <div
                key={t._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.85rem 1.25rem",
                  background: "var(--card-bg, #fff)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  textDecoration: t.isCompleted ? "line-through" : "none",
                  opacity: t.isCompleted ? 0.65 : 1,
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flex: 1 }}>
                  <button
                    onClick={() => handleToggle(t._id)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: "1.5px solid var(--border)",
                      background: t.isCompleted ? "#10b981" : "transparent",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    {t.isCompleted && <FaCheck size={12} />}
                  </button>

                  <div>
                    <strong style={{ fontSize: "0.95rem" }}>{t.title}</strong>
                    <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      <span>{t.category}</span>
                      <span>•</span>
                      <span><FaClock size={11} /> {t.startTime || "Anytime"} ({t.durationMinutes}m)</span>
                      <span>•</span>
                      <span>{t.scheduledDate}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: 4, background: t.priority === "High" ? "rgba(239,68,68,0.15)" : "var(--badge-bg)", color: t.priority === "High" ? "var(--error)" : "inherit" }}>
                    {t.priority}
                  </span>
                  <button
                    onClick={() => handleDelete(t._id)}
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.4rem" }}
                    title="Delete task"
                  >
                    <FaTrash size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Manual Task Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 450, padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem" }}>Add Activity to Schedule</h3>
            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Practice Linked List problems"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Duration (mins)</label>
                  <input type="number" min={15} max={240} value={taskDuration} onChange={(e) => setTaskDuration(e.target.value)} />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Activity</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
