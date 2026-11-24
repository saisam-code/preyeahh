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
  FaBullseye,
  FaFlag,
  FaChartLine,
  FaRotate,
  FaPen,
  FaGraduationCap,
  FaAward,
  FaLayerGroup,
  FaTriangleExclamation,
} from "react-icons/fa6";
import {
  getStudentPlan,
  addPlannerTask,
  togglePlannerTask,
  deletePlannerTask,
  generateAdaptiveSchedule,
  addCareerGoal,
  addExamDeadline,
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

const VIEWS = [
  { id: "today", label: "Today" },
  { id: "week", label: "Weekly Schedule" },
  { id: "month", label: "Monthly Calendar" },
  { id: "milestones", label: "Milestones & Timeline" },
  { id: "goals", label: "Career Goals" },
  { id: "analytics", label: "Planner Analytics" },
];

export default function PersonalCareerPlanner() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("today");
  const [generating, setGenerating] = useState(false);

  // New task form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("Skill development");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskDate, setTaskDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [taskStart] = useState("18:00");
  const [taskDuration, setTaskDuration] = useState(45);

  // New Goal modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalType, setNewGoalType] = useState("Alternative");
  const [newGoalTimeline, setNewGoalTimeline] = useState("3 years");

  // New Deadline modal
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineTitle, setDeadlineTitle] = useState("");
  const [deadlineCategory, setDeadlineCategory] = useState("University Exam");
  const [deadlineDate, setDeadlineDate] = useState("");

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await getStudentPlan();
      setPlan(data);
    } catch {
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
      toast.success(updated.isCompleted ? "Task completed!" : "Task marked incomplete");
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
      toast.success("Activity scheduled");
    } catch {
      toast.error("Error creating task");
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return toast.error("Goal title is required");
    try {
      const g = await addCareerGoal({
        title: newGoalTitle.trim(),
        goalType: newGoalType,
        targetTimeline: newGoalTimeline,
      });
      setPlan((prev) => ({
        ...prev,
        goals: [...(prev.goals || []), g],
        primaryCareer: newGoalType === "Primary" ? newGoalTitle.trim() : prev.primaryCareer,
      }));
      setShowGoalModal(false);
      setNewGoalTitle("");
      toast.success("Career goal added!");
    } catch {
      toast.error("Failed to add goal");
    }
  };

  const handleCreateDeadline = async (e) => {
    e.preventDefault();
    if (!deadlineTitle.trim() || !deadlineDate) return toast.error("Title and date required");
    try {
      const d = await addExamDeadline({
        title: deadlineTitle.trim(),
        category: deadlineCategory,
        date: deadlineDate,
      });
      setPlan((prev) => ({ ...prev, deadlines: [...(prev.deadlines || []), d] }));
      setShowDeadlineModal(false);
      setDeadlineTitle("");
      toast.success("Deadline saved");
    } catch {
      toast.error("Failed to save deadline");
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

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: userTimezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  const todayTasks = plan?.tasks?.filter((t) => t.scheduledDate === todayStr) || [];
  const completedToday = todayTasks.filter((t) => t.isCompleted).length;

  // Week calculation (today through +6 days)
  const weekDates = [];
  const [ty, tm, td] = todayStr.split("-").map(Number);
  const baseWeek = new Date(Date.UTC(ty, tm - 1, td));
  for (let i = 0; i < 7; i++) {
    const cur = new Date(baseWeek);
    cur.setUTCDate(baseWeek.getUTCDate() + i);
    weekDates.push(cur.toISOString().slice(0, 10));
  }
  const weekTasks = plan?.tasks?.filter((t) => weekDates.includes(t.scheduledDate)) || [];

  // Month calculation (all days of current month)
  const daysInMonth = new Date(ty, tm, 0).getDate();
  const firstDayOfMonth = new Date(ty, tm - 1, 1).getDay(); // 0 is Sunday
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dStr = String(i + 1).padStart(2, "0");
    const fullDate = `${ty}-${String(tm).padStart(2, "0")}-${dStr}`;
    return {
      dayNum: i + 1,
      fullDate,
      isToday: fullDate === todayStr,
      tasks: (plan?.tasks || []).filter((t) => t.scheduledDate === fullDate),
      deadlines: (plan?.deadlines || []).filter((dl) => dl.date === fullDate),
    };
  });

  return (
    <div className="planner-container" style={{ padding: "1.5rem 0", maxWidth: 1100, margin: "0 auto" }}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FaCalendarCheck style={{ color: "var(--primary)" }} /> Personal Career Planner
          </h1>
          <p style={{ color: "var(--text-muted)", margin: "0.35rem 0 0", fontSize: "0.95rem" }}>
            <em>"Know your destination. Know your next step. Know when to take it."</em>
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowDeadlineModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <FaCalendarCheck /> Add Deadline
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowGoalModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <FaBullseye /> Add Goal
          </button>
        </div>
      </div>

      {/* ── DESTINATION CARD ── */}
      {plan?.primaryCareer && (
        <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1, color: "var(--primary)", fontWeight: 700 }}>
              Career Destination
            </div>
            <h3 style={{ margin: "0.2rem 0", fontSize: "1.3rem" }}>{plan.primaryCareer}</h3>
            {plan.alternativeCareer && (
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Alternative: <strong>{plan.alternativeCareer}</strong>
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Today's Tasks</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: completedToday === todayTasks.length && todayTasks.length > 0 ? "#10b981" : "inherit" }}>
                {completedToday} / {todayTasks.length}
              </div>
            </div>
            <span className="branch-tag">{plan.academicStage || "Undergraduate"}</span>
          </div>
        </div>
      )}

      {/* ── NAVIGATION VIEWS ── */}
      <div className="tabs" style={{ marginBottom: "1.5rem", overflowX: "auto" }}>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            className={`tab ${activeTab === v.id ? "active" : ""}`}
            onClick={() => setActiveTab(v.id)}
            style={{ whiteSpace: "nowrap" }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENTS ── */}
      {loading ? (
        <div className="empty"><p>Loading planner...</p></div>
      ) : activeTab === "today" || activeTab === "week" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {((activeTab === "today" ? todayTasks : weekTasks)).length === 0 ? (
            <div className="empty" style={{ padding: "3rem 1rem", textAlign: "center", background: "var(--card-bg, #fff)", borderRadius: "1rem", border: "1px solid var(--border)" }}>
              <FaCalendarDays style={{ fontSize: "2.2rem", color: "var(--text-muted)", marginBottom: "0.75rem" }} />
              <h4 style={{ margin: "0 0 0.25rem" }}>{activeTab === "today" ? "No tasks scheduled for today" : "No tasks scheduled for the next 7 days"}</h4>
              <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>
                Click <strong>AI Adaptive Timetable</strong> to generate your weekly plan or <strong>Add Task</strong> above.
              </p>
            </div>
          ) : (
            (activeTab === "today" ? todayTasks : weekTasks).map((t) => (
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
                    <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem", flexWrap: "wrap" }}>
                      <span>{t.category}</span>
                      <span>•</span>
                      <span><FaClock size={11} /> {t.startTime || "18:00"} ({t.durationMinutes}m)</span>
                      <span>•</span>
                      <span style={{ fontWeight: t.scheduledDate === todayStr ? 700 : 400, color: t.scheduledDate === todayStr ? "var(--primary)" : "inherit" }}>
                        {t.scheduledDate} {t.scheduledDate === todayStr ? "(Today)" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: 4, background: t.priority === "High" || t.priority === "Critical" ? "rgba(239,68,68,0.15)" : "var(--badge-bg)", color: t.priority === "High" || t.priority === "Critical" ? "var(--error)" : "inherit" }}>
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
      ) : activeTab === "month" ? (
        /* Real Monthly Calendar Grid */
        <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.15rem" }}>
              {new Date(ty, tm - 1).toLocaleString("default", { month: "long" })} {ty}
            </h3>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {plan?.deadlines?.length || 0} Deadlines registered
            </span>
          </div>

          {/* Calendar Grid Header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem", textAlign: "center", fontWeight: 700, fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} style={{ padding: "0.4rem 0" }}>{day}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
            {/* Empty slots before first day of month */}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: 70, background: "transparent" }} />
            ))}

            {monthDays.map((md) => (
              <div
                key={md.fullDate}
                style={{
                  minHeight: 70,
                  border: md.isToday ? "2px solid var(--primary)" : "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  padding: "0.4rem",
                  background: md.isToday ? "var(--primary-bg)" : "var(--surface)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: md.isToday ? 800 : 500, color: md.isToday ? "var(--primary)" : "inherit" }}>
                    {md.dayNum}
                  </span>
                  {md.deadlines.length > 0 && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--error)" }} title={`${md.deadlines.length} Exam / Target Deadlines`} />
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginTop: "0.25rem" }}>
                  {md.tasks.slice(0, 2).map((t) => (
                    <div
                      key={t._id}
                      style={{
                        fontSize: "0.68rem",
                        padding: "0.15rem 0.35rem",
                        borderRadius: "0.25rem",
                        background: t.isCompleted ? "#10b981" : "var(--primary-bg)",
                        color: t.isCompleted ? "#fff" : "var(--primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  ))}
                  {md.tasks.length > 2 && (
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      +{md.tasks.length - 2} more
                    </span>
                  )}
                  {md.deadlines.map((dl, dli) => (
                    <div
                      key={dli}
                      style={{
                        fontSize: "0.68rem",
                        padding: "0.15rem 0.35rem",
                        borderRadius: "0.25rem",
                        background: "rgba(239,68,68,0.15)",
                        color: "var(--error)",
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={`Target: ${dl.title}`}
                    >
                      🎯 {dl.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === "milestones" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {plan?.milestones?.map((m, idx) => (
            <div key={idx} style={{ padding: "1.25rem", background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "0.75rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <strong style={{ fontSize: "1.05rem" }}>{m.title}</strong>
                  <span className="branch-tag">{m.timeHorizon}</span>
                </div>
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.88rem", color: "var(--text-muted)" }}>
                  {m.description || "Foundational milestone contributing to primary career goal."}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "goals" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {plan?.goals?.map((g, idx) => (
            <div key={idx} style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "0.85rem", padding: "1.25rem" }}>
              <span className="branch-tag" style={{ marginBottom: "0.5rem" }}>{g.goalType} Goal</span>
              <h4 style={{ margin: "0.3rem 0", fontSize: "1.15rem" }}>{g.title}</h4>
              <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {g.description || `Target career goal planned for ${g.targetTimeline}.`}
              </p>
              <div style={{ fontSize: "0.82rem", color: "var(--primary)", fontWeight: 600 }}>
                Status: {g.status}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Analytics View */
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Total Tasks Scheduled</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{plan?.tasks?.length || 0}</div>
            </div>
            <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Completed Tasks</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10b981" }}>
                {plan?.tasks?.filter((t) => t.isCompleted).length || 0}
              </div>
            </div>
            <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Milestones in Progress</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--primary)" }}>
                {plan?.milestones?.length || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD TASK MODAL ── */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 460, padding: "1.5rem" }}>
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

      {/* ── ADD GOAL MODAL ── */}
      {showGoalModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 450, padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem" }}>Add Career Goal</h3>
            <form onSubmit={handleCreateGoal}>
              <div className="form-group">
                <label>Career Goal Title</label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. AI Research Scientist"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Goal Type</label>
                  <select value={newGoalType} onChange={(e) => setNewGoalType(e.target.value)}>
                    <option value="Primary">Primary</option>
                    <option value="Alternative">Alternative</option>
                    <option value="Exploring">Exploring</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Timeline</label>
                  <input type="text" value={newGoalTimeline} onChange={(e) => setNewGoalTimeline(e.target.value)} placeholder="e.g. 3 years" />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowGoalModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD DEADLINE MODAL ── */}
      {showDeadlineModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 450, padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem" }}>Register Exam or Target Deadline</h3>
            <form onSubmit={handleCreateDeadline}>
              <div className="form-group">
                <label>Examination / Target Title</label>
                <input
                  type="text"
                  value={deadlineTitle}
                  onChange={(e) => setDeadlineTitle(e.target.value)}
                  placeholder="e.g. UPSC CSE Prelims 2026, GATE CS, Semester 6 Finals"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={deadlineCategory} onChange={(e) => setDeadlineCategory(e.target.value)}>
                    <option value="University Exam">University Exam</option>
                    <option value="Competitive Exam">Competitive Exam</option>
                    <option value="Entrance Exam">Entrance Exam</option>
                    <option value="Certification">Certification</option>
                    <option value="Internship Deadline">Internship Deadline</option>
                    <option value="Scholarship">Scholarship</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Date</label>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowDeadlineModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Deadline</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
