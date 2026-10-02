import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaPaperPlane, FaComments } from "react-icons/fa6";
import {
  fetchMentorshipConversation,
  listMentorshipConversations,
  listRoleMentors,
  sendMentorshipMessage,
  startMentorshipConversation,
} from "../services/mentorshipService.js";

export default function MentorshipInbox({ mode = "student", roleIntent = null }) {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [startingGuideId, setStartingGuideId] = useState(null);

  const loadConversations = useCallback(async () => {
    try {
      const items = await listMentorshipConversations(mode);
      setConversations(items);
      setSelected((current) => current ? items.find((item) => item.id === current.id) || current : null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load guide messages");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (mode !== "student" || !roleIntent?.id) {
      setMentors([]);
      return;
    }
    listRoleMentors(roleIntent.id)
      .then(setMentors)
      .catch((error) => toast.error(error.response?.data?.message || "Could not find guides for this role"));
  }, [mode, roleIntent?.id]);

  useEffect(() => {
    if (!selected?.id) return undefined;
    const refresh = async () => {
      try {
        setSelected(await fetchMentorshipConversation(mode, selected.id));
        await loadConversations();
      } catch {
        // The conversation may have been removed or the session may have expired.
      }
    };
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [mode, selected?.id, loadConversations]);

  const openConversation = async (conversation) => {
    try {
      setSelected(await fetchMentorshipConversation(mode, conversation.id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not open conversation");
    }
  };

  const beginConversation = async (guide) => {
    setStartingGuideId(guide.id);
    try {
      const conversation = await startMentorshipConversation({ roleId: roleIntent.id, guideId: guide.id });
      setSelected(conversation);
      setMentors([]);
      await loadConversations();
      toast.success(`Started a conversation with ${guide.name}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start conversation");
    } finally {
      setStartingGuideId(null);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!message.trim() || !selected || sending) return;
    setSending(true);
    try {
      const updated = await sendMentorshipMessage(mode, selected.id, message.trim());
      setSelected(updated);
      setMessage("");
      await loadConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send message");
    } finally {
      setSending(false);
    }
  };

  const otherPerson = (conversation) => mode === "guide" ? conversation.student.name : conversation.guide.name;
  const hasRoleConversation = roleIntent?.id && conversations.some((conversation) => conversation.role.id === roleIntent.id);

  return (
    <section className="section" aria-label="Guide conversations">
      <div className="admin-header">
        <div>
          <h2>{mode === "guide" ? "Student conversations" : "Chat with a guide"}</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.25rem" }}>
            Private mentor messages, separate from Preyeahh AI chats.
          </p>
        </div>
      </div>

      {mode === "student" && roleIntent?.id && mentors.length > 0 && (
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "0.95rem", marginBottom: "0.65rem" }}>Guides for {roleIntent.title}</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
            {mentors.map((guide) => (
              <div key={guide.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem", minWidth: 220, maxWidth: 360, background: "var(--surface)" }}>
                <strong>{guide.name}</strong>
                {guide.bio && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.35rem 0" }}>{guide.bio}</p>}
                <button type="button" className="btn btn-primary btn-sm" disabled={startingGuideId === guide.id} onClick={() => beginConversation(guide)}>
                  {startingGuideId === guide.id ? "Opening..." : "Message guide"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "student" && roleIntent?.id && !mentors.length && !loading && !hasRoleConversation && (
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
          No approved guide is currently assigned to {roleIntent.title}. Your commitment is saved; check back later.
        </p>
      )}

      <div className="mentorship-layout" style={{ display: "grid", gap: "1rem" }}>
        <aside className="mentorship-inbox-sidebar" style={{ borderRight: "1px solid var(--border)", paddingRight: "0.75rem" }}>
          <h3 style={{ fontSize: "0.88rem", marginBottom: "0.5rem" }}>Your conversations</h3>
          {loading ? <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Loading...</p> : conversations.length ? conversations.map((conversation) => (
            <button
              type="button"
              key={conversation.id}
              onClick={() => openConversation(conversation)}
              className="btn btn-outline"
              style={{ width: "100%", display: "block", textAlign: "left", marginBottom: "0.5rem", borderColor: selected?.id === conversation.id ? "var(--primary)" : undefined }}
            >
              <strong style={{ display: "block", fontSize: "0.82rem" }}>{otherPerson(conversation)}</strong>
              <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)" }}>{conversation.role.title}</span>
              {conversation.messages.at(-1) && <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.75rem" }}>{conversation.messages.at(-1).content}</span>}
            </button>
          )) : <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No conversations yet.</p>}
        </aside>

        <div style={{ minWidth: 0 }}>
          {selected ? (
            <>
              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.65rem", marginBottom: "0.75rem" }}>
                <h3 style={{ fontSize: "0.95rem" }}>{otherPerson(selected)} · {selected.role.title}</h3>
              </div>
              <div aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: 380, overflowY: "auto", padding: "0.25rem" }}>
                {selected.messages.map((item) => (
                  <div key={item.id} style={{ alignSelf: item.senderRole === mode ? "flex-end" : "flex-start", maxWidth: "85%", padding: "0.65rem 0.8rem", borderRadius: 8, background: item.senderRole === mode ? "var(--primary-bg)" : "var(--surface-mid)", color: "var(--text)" }}>
                    <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: "0.85rem" }}>{item.content}</p>
                    <time style={{ display: "block", color: "var(--text-muted)", fontSize: "0.68rem", marginTop: "0.25rem" }}>{new Date(item.createdAt).toLocaleString()}</time>
                  </div>
                ))}
                {!selected.messages.length && <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Say hello to start the conversation.</p>}
              </div>
              <form onSubmit={handleSend} style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                <input className="search-input" aria-label="Message" maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message..." />
                <button className="btn btn-primary" type="submit" disabled={sending || !message.trim()} title="Send message" aria-label="Send message"><FaPaperPlane /></button>
              </form>
            </>
          ) : (
            <div className="empty" style={{ minHeight: 180 }}>
              <div className="icon"><FaComments /></div>
              <p>Select a conversation or commit to a role to contact its guide.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
