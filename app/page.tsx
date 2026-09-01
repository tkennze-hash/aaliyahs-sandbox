"use client";

import { useState, useCallback } from "react";
import ChatPanel, { Message } from "@/components/ChatPanel";
import GamePreview from "@/components/GamePreview";
import { GameConfig, defaultConfig } from "@/lib/gameTemplate";

type Tab = "chat" | "game";

function extractGameConfig(text: string): GameConfig | null {
  const match = text.match(/```gameconfig\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim()) as GameConfig;
  } catch {
    return null;
  }
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultConfig);
  const [bitMode, setBitMode] = useState<"8" | "16">("8");

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const aiMsg: Message = { role: "assistant", content: data.content };
      setMessages((prev) => [...prev, aiMsg]);

      const newConfig = extractGameConfig(data.content);
      if (newConfig) {
        setGameConfig(newConfig);
        setTab("game");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Oops! Something went wrong. Try again! 🎮" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const tabStyle = (t: Tab): React.CSSProperties => ({
    flex: 1,
    padding: "12px 0",
    fontSize: "9px",
    textAlign: "center",
    background: tab === t ? "#e94560" : "#0f3460",
    color: "#fff",
    cursor: "pointer",
    border: "none",
    borderBottom: tab === t ? "3px solid #ff6b85" : "3px solid #000",
    fontFamily: "'Press Start 2P', monospace",
    letterSpacing: "0.05em",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#0d0d1a" }}>
      {/* Header */}
      <div style={{
        background: "#1a1a2e",
        borderBottom: "3px solid #e94560",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: "10px", color: "#e94560", letterSpacing: "0.05em" }}>
          🎮 GAME STUDIO
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["8", "16"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBitMode(b)}
              className="pixel-btn"
              style={{
                background: bitMode === b ? "#e94560" : "#0f3460",
                color: "#fff",
                fontSize: "7px",
                padding: "5px 8px",
              }}
            >
              {b}-BIT
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", flexShrink: 0 }}>
        <button style={tabStyle("chat")} onClick={() => setTab("chat")}>💬 CHAT</button>
        <button style={tabStyle("game")} onClick={() => setTab("game")}>🕹️ GAME</button>
      </div>

      {/* Content — both rendered, only one visible, so iframe stays alive */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, display: tab === "chat" ? "flex" : "none", flexDirection: "column" }}>
          <ChatPanel
            messages={messages}
            input={input}
            loading={loading}
            onInputChange={setInput}
            onSend={send}
          />
        </div>
        <div style={{ position: "absolute", inset: 0, display: tab === "game" ? "flex" : "none", flexDirection: "column" }}>
          <GamePreview config={gameConfig} />
        </div>
      </div>
    </div>
  );
}
