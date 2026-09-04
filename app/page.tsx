"use client";

import { useState, useCallback, useEffect } from "react";
import ChatPanel, { Message } from "@/components/ChatPanel";
import GamePreview from "@/components/GamePreview";
import { GameConfig, defaultConfig } from "@/lib/gameTemplate";
import {
  ensurePlayer, startSession, getPlayerId,
  saveMessage, saveGame, saveConcepts, loadLastGame, detectConcepts,
} from "@/lib/supabase";

type Tab = "chat" | "game";

function extractGameConfig(text: string): GameConfig | null {
  const match = text.match(/```gameconfig\s*([\s\S]*?)```/);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()) as GameConfig; } catch { return null; }
}

function extractGameCode(text: string): string | null {
  const match = text.match(/```gamecode\s*([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

export default function Home() {
  const [tab, setTab]               = useState<Tab>("chat");
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultConfig);
  const [bitMode, setBitMode]       = useState<"8" | "16" | "hd">("8");

  // Name gate
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [nameInput, setNameInput]   = useState("");
  const [sessionId, setSessionId]   = useState<string | null>(null);
  const [dbReady, setDbReady]       = useState(false);

  // On mount: restore existing player or show name gate
  useEffect(() => {
    (async () => {
      const pid = await getPlayerId();
      if (pid) {
        try {
          const sid = await startSession(pid);
          setSessionId(sid);
          setDbReady(true);
          const last = await loadLastGame();
          if (last) setGameConfig(last as GameConfig);
        } catch {
          // DB unavailable — proceed without persistence
        }
        setPlayerName("returning");
        return;
      }
      // New user — show name gate
    })();
  }, []);

  const handleNameSubmit = useCallback(async () => {
    const name = nameInput.trim();
    if (!name) return;
    try {
      const pid = await ensurePlayer(name);
      const sid = await startSession(pid);
      setSessionId(sid);
      setDbReady(true);
      setPlayerName(name);
    } catch {
      // DB unavailable — proceed without persistence
      setPlayerName(name);
      setDbReady(false);
    }
  }, [nameInput]);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    if (dbReady && sessionId) {
      saveMessage(sessionId, "user", userMsg.content).catch(() => {});
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, bitMode }),
      });
      const data = await res.json();
      const aiMsg: Message = { role: "assistant", content: data.content };
      setMessages((prev) => [...prev, aiMsg]);

      if (dbReady && sessionId) {
        saveMessage(sessionId, "assistant", aiMsg.content).catch(() => {});
        // Detect concepts from AI reply
        const concepts = detectConcepts(aiMsg.content);
        if (concepts.length) {
          saveConcepts(sessionId, concepts, aiMsg.content).catch(() => {});
        }
      }

      // AI-generated custom game code takes priority
      const gameCode = extractGameCode(data.content);
      if (gameCode) {
        const customConfig: GameConfig = { ...defaultConfig, gameType: "custom", customSceneCode: gameCode };
        setGameConfig(customConfig);
        setTab("game");
        if (dbReady && sessionId) {
          saveGame(sessionId, customConfig, "custom").catch(() => {});
        }
      } else {
        const newConfig = extractGameConfig(data.content);
        if (newConfig) {
          setGameConfig(newConfig);
          setTab("game");
          if (dbReady && sessionId) {
            saveGame(sessionId, newConfig, newConfig.theme).catch(() => {});
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Oops! Something went wrong. Try again! 🎮" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, dbReady, sessionId]);

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

  // ── Name gate screen ──────────────────────────────────────────────────────
  if (playerName === null) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100dvh", background: "#0d0d1a",
        padding: "24px", gap: "24px",
      }}>
        <div style={{ fontSize: "40px" }}>🎮</div>
        <div style={{ fontSize: "9px", color: "#e94560", textAlign: "center", lineHeight: "2" }}>
          {"WELCOME TO"}<br />{"GAME STUDIO!"}
        </div>
        <div style={{ fontSize: "7px", color: "#aaa", textAlign: "center", lineHeight: "2" }}>
          {"WHAT'S YOUR NAME?"}
        </div>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleNameSubmit(); }}
          placeholder="Type your name..."
          autoFocus
          style={{
            background: "#1a1a2e", color: "#e0e0e0",
            border: "2px solid #e94560", padding: "12px 16px",
            fontSize: "10px", outline: "none", width: "100%", maxWidth: "280px",
            textAlign: "center",
          }}
        />
        <button
          onClick={handleNameSubmit}
          disabled={!nameInput.trim()}
          className="pixel-btn"
          style={{
            background: nameInput.trim() ? "#e94560" : "#333",
            color: "#fff", fontSize: "9px", padding: "12px 24px",
          }}
        >
          LET'S GO! ▶
        </button>
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#0d0d1a" }}>
      {/* Header */}
      <div style={{
        background: "#1a1a2e", borderBottom: "3px solid #e94560",
        padding: "10px 14px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexShrink: 0,
      }}>
        <div style={{ fontSize: "10px", color: "#e94560", letterSpacing: "0.05em" }}>
          🎮 GAME STUDIO
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["8", "16", "hd"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBitMode(b)}
              className="pixel-btn"
              style={{
                background: bitMode === b ? "#e94560" : "#0f3460",
                color: "#fff", fontSize: "7px", padding: "5px 8px",
              }}
            >
              {b === "hd" ? "HD" : `${b}-BIT`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", flexShrink: 0 }}>
        <button style={tabStyle("chat")} onClick={() => setTab("chat")}>💬 CHAT</button>
        <button style={tabStyle("game")} onClick={() => setTab("game")}>🕹️ GAME</button>
      </div>

      {/* Content — visibility:hidden keeps canvas sized (display:none makes it 0×0 → WebGL framebuffer error) */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          visibility: tab === "chat" ? "visible" : "hidden",
          pointerEvents: tab === "chat" ? "auto" : "none",
        }}>
          <ChatPanel
            messages={messages}
            input={input}
            loading={loading}
            onInputChange={setInput}
            onSend={send}
          />
        </div>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          visibility: tab === "game" ? "visible" : "hidden",
          pointerEvents: tab === "game" ? "auto" : "none",
        }}>
          <GamePreview config={gameConfig} bitMode={bitMode} />
        </div>
      </div>
    </div>
  );
}
