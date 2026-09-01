"use client";

import { useRef, useEffect } from "react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  messages: Message[];
  input: string;
  loading: boolean;
  onInputChange: (v: string) => void;
  onSend: () => void;
}

export default function ChatPanel({ messages, input, loading, onInputChange, onSend }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const displayText = (text: string) =>
    text.replace(/```gameconfig[\s\S]*?```/g, "✨ Updating your game...").trim();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0d0d1a" }}>
      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🎮</div>
            <div style={{ fontSize: "8px", color: "#00ff88", lineHeight: "1.8" }}>
              {"HI! I'M YOUR GAME GUIDE."}
              <br />
              {"WHAT KIND OF GAME"}
              <br />
              {"DO YOU WANT TO MAKE?"}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className="fade-in"
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "assistant" && (
              <div style={{
                width: "24px",
                height: "24px",
                marginRight: "8px",
                flexShrink: 0,
                fontSize: "16px",
                lineHeight: "24px",
              }}>🎮</div>
            )}
            <div
              className={msg.role === "assistant" ? "chat-bubble-ai" : "chat-bubble-user"}
              style={{
                padding: "10px 12px",
                maxWidth: "80%",
                fontSize: "8px",
                lineHeight: "1.8",
                wordBreak: "break-word",
              }}
            >
              {displayText(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>🎮</span>
            <div className="chat-bubble-ai" style={{ padding: "10px 12px", fontSize: "8px" }}>
              <span className="blink">▌</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "10px",
        borderTop: "2px solid #1a1a2e",
        display: "flex",
        gap: "8px",
        background: "#0d0d1a",
      }}>
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type here..."
          disabled={loading}
          style={{
            flex: 1,
            background: "#1a1a2e",
            color: "#e0e0e0",
            border: "2px solid #0f3460",
            padding: "10px",
            fontSize: "8px",
            outline: "none",
          }}
        />
        <button
          onClick={onSend}
          disabled={loading || !input.trim()}
          className="pixel-btn"
          style={{
            background: loading || !input.trim() ? "#333" : "#e94560",
            color: "#fff",
            fontSize: "10px",
            padding: "10px 14px",
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
