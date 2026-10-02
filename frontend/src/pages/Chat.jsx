import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaDownload, FaPaperPlane, FaPlus, FaTrash } from "react-icons/fa6";
import {
  fetchChats, createChat, fetchChat, exportChat, sendChatMessage, clearChatHistory, deleteChat,
} from "../services/chatService.js";
import { fetchRoles } from "../services/rolesService.js";
import { useBranch } from "../context/BranchContext.jsx";

const errMsg = (err, fallback) =>
  err.response?.status === 429 ? "AI is busy — wait a moment and try again." : err.response?.data?.message || fallback;

export default function Chat() {
  const { branch } = useBranch();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [topic, setTopic] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const bottomRef = useRef(null);

  const loadChats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchChats({ limit: 50 });
      setChats(res.data || []);
    } catch {
      toast.error("Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadChats(); }, [loadChats]);

  // Role picker is scoped to the selected branch so the AI gets branch-relevant context
  useEffect(() => {
    if (!branch) { setRoles([]); return; }
    fetchRoles({ branch, limit: 100 }).then((res) => setRoles(res.data || [])).catch(() => setRoles([]));
  }, [branch]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const handleNewChat = async () => {
    try {
      const chat = await createChat({ topic: topic.trim() || undefined, roleId: roleId || undefined });
      setChats((prev) => [chat, ...prev]);
      setActiveChat(chat);
      setMessages([]);
      setTopic("");
      setRoleId("");
    } catch (err) {
      toast.error(errMsg(err, "Failed to create chat"));
    }
  };

  const handleSelectChat = async (chat) => {
    try {
      const full = await fetchChat(chat.id);
      setActiveChat(full);
      setMessages(full.messages || []);
    } catch {
      toast.error("Failed to load chat");
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeChat || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text, id: `tmp-${Date.now()}` }]);
    setSending(true);
    try {
      const res = await sendChatMessage(activeChat.id, text);
      setMessages((prev) => [...prev, res.message]);
      setChats((prev) => prev.map((c) => (c.id === activeChat.id ? { ...c, title: res.title } : c)));
      setActiveChat((prev) => (prev ? { ...prev, title: res.title } : prev));
    } catch (err) {
      // Server stores nothing on failure, so roll back the optimistic message and restore the text
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
      toast.error(errMsg(err, "Failed to send message"));
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async (chatId) => {
    try {
      const blob = await exportChat(chatId);
      const link = document.createElement("a");
      const fileName = `chat-${chatId}.json`;
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Chat downloaded");
    } catch {
      toast.error("Failed to download chat");
    }
  };

  const handleDelete = async (chatId) => {
    try {
      await deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChat?.id === chatId) { setActiveChat(null); setMessages([]); }
      toast.success("Chat deleted");
    } catch {
      toast.error("Failed to delete chat");
    }
  };

  const handleClear = async () => {
    if (!activeChat) return;
    try {
      await clearChatHistory(activeChat.id);
      setMessages([]);
      toast.success("History cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", height: "calc(100vh - 68px)" }}>
      <div style={{ background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input className="search-input" placeholder="Topic (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            style={{ padding: "0.5rem 0.75rem", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "999px", color: "var(--text)" }}
          >
            <option value="">{branch ? `Any ${branch} role (optional)` : "Pick a branch on Roles to choose a role"}</option>
            {roles.map((r) => <option key={r._id} value={r._id}>{r.title}</option>)}
          </select>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleNewChat}><FaPlus /> New Chat</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
          {loading ? (
            <div className="empty"><p>Loading...</p></div>
          ) : chats.length === 0 ? (
            <div className="empty"><p>No chats yet</p></div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                style={{
                  padding: "0.75rem", borderRadius: "8px", cursor: "pointer", marginBottom: "0.25rem",
                  background: activeChat?.id === chat.id ? "var(--primary-bg)" : "transparent",
                  border: activeChat?.id === chat.id ? "1px solid var(--primary)" : "1px solid transparent",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{chat.title}</div>
                  {chat.topic && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{chat.topic}</div>}
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button
                    className="btn btn-sm"
                    style={{ background: "transparent", color: "var(--text-muted)", padding: "0.2rem 0.4rem" }}
                    onClick={(e) => { e.stopPropagation(); handleDownload(chat.id); }}
                    title="Download chat"
                  ><FaDownload /></button>
                  <button
                    className="btn btn-sm"
                    style={{ background: "transparent", color: "var(--text-muted)", padding: "0.2rem 0.4rem" }}
                    onClick={(e) => { e.stopPropagation(); handleDelete(chat.id); }}
                    title="Delete chat"
                  ><FaTrash /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!activeChat ? (
          <div className="empty" style={{ margin: "auto" }}>
            <div className="icon"><FaPaperPlane /></div>
            <p>Select a chat or start a new one</p>
          </div>
        ) : (
          <>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, color: "var(--text)" }}>{activeChat.title}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {[activeChat.branch, activeChat.topic].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-outline btn-sm" onClick={() => handleDownload(activeChat.id)}>Download</button>
                <button className="btn btn-outline btn-sm" onClick={handleClear}>Clear History</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {messages.length === 0 && <div className="empty"><p>Send a message to start the conversation</p></div>}
              {messages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  style={{
                    maxWidth: "75%",
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    background: msg.role === "user" ? "var(--primary)" : "var(--surface)",
                    color: msg.role === "user" ? "white" : "var(--text)",
                    border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                    padding: "0.75rem 1rem",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    fontSize: "0.9rem", lineHeight: 1.6, whiteSpace: "pre-wrap",
                  }}
                >{msg.content}</div>
              ))}
              {sending && <div style={{ alignSelf: "flex-start", color: "var(--text-muted)", fontSize: "0.85rem" }}>AI is typing...</div>}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: "0.75rem" }}>
              <input
                className="search-input"
                style={{ flex: 1 }}
                placeholder="Ask anything about your branch, role, or career..."
                value={input}
                maxLength={4000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                disabled={sending}
              />
              <button className="btn btn-primary" onClick={handleSend} disabled={sending || !input.trim()}><FaPaperPlane /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
