import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaComments, FaRobot, FaUser, FaBoxArchive, FaCircle } from "react-icons/fa6";
import { fetchStudentChats } from "../../services/adminService.js";

export default function AdminStudentChats({ student, onBack }) {
  const [data, setData] = useState(null); // { student, chats }
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState(null); // expanded chat

  useEffect(() => {
    if (!student?._id) return;
    setLoading(true);
    setOpenChat(null);
    fetchStudentChats(student._id)
      .then((r) => setData(r.data))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load chats"))
      .finally(() => setLoading(false));
  }, [student]);

  if (loading) {
    return (
      <div className="empty" style={{ padding: "4rem 0" }}>
        <div className="icon"><i className="fa fa-spinner fa-spin" /></div>
        <p>Loading chats…</p>
      </div>
    );
  }

  const chats = data?.chats || [];
  const studentInfo = data?.student || student;

  return (
    <div>
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button className="btn btn-outline btn-sm" onClick={onBack}>
            <FaArrowLeft /> Back
          </button>
          <div>
            <h2 style={{ margin: 0 }}>
              <FaComments style={{ marginRight: "0.5rem", color: "var(--accent)" }} />
              Chats — {studentInfo?.name}
            </h2>
            <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
              {studentInfo?.email} · {chats.length} conversation{chats.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {!chats.length ? (
        <div className="empty" style={{ padding: "4rem 0" }}>
          <div className="icon"><FaComments /></div>
          <p>This student hasn't started any chats yet.</p>
        </div>
      ) : (
        <div className="chat-list-admin">
          {chats.map((chat) => (
            <div key={chat._id} className={`chat-card-admin ${openChat?._id === chat._id ? "open" : ""}`}>
              <div className="chat-card-header" onClick={() => setOpenChat(openChat?._id === chat._id ? null : chat)}>
                <div className="chat-card-info">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FaCircle style={{ fontSize: "0.45rem", color: chat.isArchived ? "var(--muted)" : "#10b981" }} />
                    <strong>{chat.title || "Untitled Chat"}</strong>
                    {chat.isArchived && (
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <FaBoxArchive /> archived
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                    {chat.branch && <span className="branch-tag" style={{ fontSize: "0.72rem" }}>{chat.branch}</span>}
                    {chat.roleId && (
                      <span className="type-badge badge-core" style={{ fontSize: "0.72rem" }}>
                        {chat.roleId.title}
                      </span>
                    )}
                    {chat.topic && <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{chat.topic}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 110 }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                    {chat.messages?.length || 0} message{(chat.messages?.length || 0) !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                    {new Date(chat.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent)", marginTop: "0.2rem" }}>
                    {openChat?._id === chat._id ? "▲ collapse" : "▼ expand"}
                  </div>
                </div>
              </div>

              {openChat?._id === chat._id && (
                <div className="chat-messages-admin">
                  {(!chat.messages || !chat.messages.length) ? (
                    <div style={{ color: "var(--muted)", textAlign: "center", padding: "1rem" }}>No messages</div>
                  ) : (
                    chat.messages.map((msg) => (
                      <div key={msg._id} className={`admin-msg admin-msg-${msg.role}`}>
                        <div className="admin-msg-avatar">
                          {msg.role === "user" ? <FaUser /> : <FaRobot />}
                        </div>
                        <div className="admin-msg-bubble">
                          <div className="admin-msg-role">{msg.role === "user" ? studentInfo?.name || "Student" : "AI Assistant"}</div>
                          <div className="admin-msg-content">{msg.content}</div>
                          {msg.createdAt && (
                            <div className="admin-msg-time">
                              {new Date(msg.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
