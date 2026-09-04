"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const CORRECT_PIN = process.env.NEXT_PUBLIC_PARENT_PIN ?? "1234";

const CONCEPT_LABELS: Record<string, string> = {
  condition:  "IF/THEN Logic",
  variable:   "Variables",
  loop:       "Loops",
  function:   "Functions",
  arithmetic: "Maths & Scoring",
};

const CONCEPT_EMOJI: Record<string, string> = {
  condition:  "🔀",
  variable:   "📊",
  loop:       "🔁",
  function:   "⚡",
  arithmetic: "➕",
};

interface Player {
  id: string;
  name: string;
  created_at: string;
}

interface ConceptRow {
  concept: string;
  example: string | null;
  detected_at: string;
}

interface GameRow {
  name: string;
  config: Record<string, unknown>;
  created_at: string;
}

interface DashboardData {
  player: Player | null;
  sessionCount: number;
  messageCount: number;
  gameCount: number;
  concepts: ConceptRow[];
  recentGames: GameRow[];
  firstSeen: string | null;
  lastSeen: string | null;
}

async function fetchDashboard(): Promise<DashboardData> {
  // Get first player (Aaliyah)
  const { data: players } = await supabase
    .from("players")
    .select("id, name, created_at")
    .order("created_at", { ascending: true })
    .limit(1);

  const player: Player | null = players?.[0] ?? null;

  if (!player) {
    return { player: null, sessionCount: 0, messageCount: 0, gameCount: 0, concepts: [], recentGames: [], firstSeen: null, lastSeen: null };
  }

  // Sessions for this player
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, started_at")
    .eq("player_id", player.id)
    .order("started_at", { ascending: false });

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const sessionCount = sessionIds.length;
  const firstSeen = sessions ? (sessions[sessions.length - 1]?.started_at ?? null) : null;
  const lastSeen = sessions ? (sessions[0]?.started_at ?? null) : null;

  if (!sessionIds.length) {
    return { player, sessionCount: 0, messageCount: 0, gameCount: 0, concepts: [], recentGames: [], firstSeen, lastSeen };
  }

  // Messages count
  const { count: messageCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("session_id", sessionIds)
    .eq("role", "user");

  // Games
  const { data: games } = await supabase
    .from("games")
    .select("name, config, created_at")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false })
    .limit(10);

  // Concepts
  const { data: concepts } = await supabase
    .from("concepts")
    .select("concept, example, detected_at")
    .in("session_id", sessionIds)
    .order("detected_at", { ascending: false });

  return {
    player,
    sessionCount,
    messageCount: messageCount ?? 0,
    gameCount: (games ?? []).length,
    concepts: concepts ?? [],
    recentGames: (games ?? []) as GameRow[],
    firstSeen,
    lastSeen,
  };
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StatCard({ label, value, emoji }: { label: string; value: number | string; emoji: string }) {
  return (
    <div style={{
      background: "#1a1a2e",
      border: "2px solid #0f3460",
      padding: "14px 10px",
      textAlign: "center",
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontSize: "20px", marginBottom: "6px" }}>{emoji}</div>
      <div style={{ fontSize: "14px", color: "#e94560", fontWeight: "bold" }}>{value}</div>
      <div style={{ fontSize: "6px", color: "#888", marginTop: "4px", lineHeight: 1.6 }}>{label}</div>
    </div>
  );
}

export default function ParentDashboard() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const checkPin = useCallback(() => {
    if (pin === CORRECT_PIN) {
      setAuthed(true);
      setPinError(false);
      if (typeof window !== "undefined") sessionStorage.setItem("parent_authed", "1");
    } else {
      setPinError(true);
    }
  }, [pin]);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("parent_authed") === "1") {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetchDashboard().then((d) => { setData(d); setLoading(false); });
  }, [authed]);

  // ── PIN gate ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100dvh", background: "#0d0d1a",
        padding: "24px", gap: "20px",
        fontFamily: "'Press Start 2P', monospace",
      }}>
        <div style={{ fontSize: "36px" }}>🔐</div>
        <div style={{ fontSize: "9px", color: "#e94560", textAlign: "center", lineHeight: 2 }}>
          PARENT DASHBOARD
        </div>
        <div style={{ fontSize: "7px", color: "#aaa", textAlign: "center" }}>
          ENTER PIN
        </div>
        <input
          type="password"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setPinError(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") checkPin(); }}
          placeholder="••••"
          autoFocus
          style={{
            background: "#1a1a2e",
            color: "#e0e0e0",
            border: `2px solid ${pinError ? "#ff4444" : "#e94560"}`,
            padding: "12px 16px",
            fontSize: "16px",
            outline: "none",
            width: "160px",
            textAlign: "center",
            letterSpacing: "0.3em",
          }}
        />
        {pinError && (
          <div style={{ fontSize: "7px", color: "#ff4444" }}>WRONG PIN</div>
        )}
        <button
          onClick={checkPin}
          style={{
            background: "#e94560", color: "#fff",
            fontSize: "8px", padding: "12px 24px",
            border: "3px solid #000", boxShadow: "3px 3px 0 #000",
            cursor: "pointer", fontFamily: "'Press Start 2P', monospace",
          }}
        >
          UNLOCK ▶
        </button>
        <div style={{ fontSize: "6px", color: "#444", textAlign: "center", lineHeight: 2 }}>
          DEFAULT PIN: 1234<br />
          SET NEXT_PUBLIC_PARENT_PIN TO CHANGE
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100dvh", background: "#0d0d1a", color: "#e94560",
        fontFamily: "'Press Start 2P', monospace", fontSize: "9px",
      }}>
        LOADING...
      </div>
    );
  }

  // ── No data yet ───────────────────────────────────────────────────────────
  if (!data.player) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100dvh", background: "#0d0d1a", gap: "16px",
        fontFamily: "'Press Start 2P', monospace",
      }}>
        <div style={{ fontSize: "36px" }}>😴</div>
        <div style={{ fontSize: "8px", color: "#aaa", textAlign: "center", lineHeight: 2 }}>
          NO DATA YET<br />AALIYAH HASN'T PLAYED
        </div>
        <a
          href="/"
          style={{ fontSize: "7px", color: "#e94560", textDecoration: "none" }}
        >
          ← BACK TO GAME
        </a>
      </div>
    );
  }

  // Unique concepts
  const uniqueConcepts = [...new Set(data.concepts.map((c) => c.concept))];
  // Concept counts
  const conceptCounts: Record<string, number> = {};
  data.concepts.forEach((c) => { conceptCounts[c.concept] = (conceptCounts[c.concept] ?? 0) + 1; });

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0d0d1a",
      fontFamily: "'Press Start 2P', monospace",
      color: "#e0e0e0",
    }}>
      {/* Header */}
      <div style={{
        background: "#1a1a2e",
        borderBottom: "3px solid #e94560",
        padding: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ fontSize: "9px", color: "#e94560" }}>🔐 PARENT VIEW</div>
        <a
          href="/"
          style={{
            fontSize: "7px", color: "#888",
            textDecoration: "none",
            border: "1px solid #333",
            padding: "4px 8px",
          }}
        >
          ← GAME
        </a>
      </div>

      <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto" }}>

        {/* Player info */}
        <div style={{
          background: "#1a1a2e",
          border: "2px solid #e94560",
          padding: "14px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}>
          <div style={{ fontSize: "32px" }}>🎮</div>
          <div>
            <div style={{ fontSize: "11px", color: "#e94560", marginBottom: "6px" }}>
              {data.player.name.toUpperCase()}
            </div>
            <div style={{ fontSize: "6px", color: "#888", lineHeight: 2 }}>
              FIRST PLAY: {fmt(data.firstSeen)}<br />
              LAST SEEN: {fmt(data.lastSeen)}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <StatCard emoji="📅" label="SESSIONS" value={data.sessionCount} />
          <StatCard emoji="💬" label="MESSAGES" value={data.messageCount} />
          <StatCard emoji="🕹️" label="GAMES BUILT" value={data.gameCount} />
          <StatCard emoji="🧠" label="CONCEPTS" value={uniqueConcepts.length} />
        </div>

        {/* Concepts learned */}
        <div style={{
          background: "#1a1a2e",
          border: "2px solid #0f3460",
          padding: "14px",
          marginBottom: "16px",
        }}>
          <div style={{ fontSize: "8px", color: "#e94560", marginBottom: "12px" }}>
            🧠 CODING CONCEPTS DISCOVERED
          </div>
          {uniqueConcepts.length === 0 ? (
            <div style={{ fontSize: "7px", color: "#555", lineHeight: 2 }}>
              NONE YET — KEEP CHATTING!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.keys(CONCEPT_LABELS).map((key) => {
                const learned = uniqueConcepts.includes(key);
                const count = conceptCounts[key] ?? 0;
                return (
                  <div key={key} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    opacity: learned ? 1 : 0.3,
                  }}>
                    <div style={{ fontSize: "16px", width: "24px", textAlign: "center" }}>
                      {CONCEPT_EMOJI[key]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "7px", color: learned ? "#fff" : "#666" }}>
                        {CONCEPT_LABELS[key]}
                      </div>
                      {learned && (
                        <div style={{ fontSize: "6px", color: "#888", marginTop: "2px" }}>
                          SPOTTED {count}x
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "12px" }}>
                      {learned ? "✅" : "⬜"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent games */}
        {data.recentGames.length > 0 && (
          <div style={{
            background: "#1a1a2e",
            border: "2px solid #0f3460",
            padding: "14px",
            marginBottom: "16px",
          }}>
            <div style={{ fontSize: "8px", color: "#e94560", marginBottom: "12px" }}>
              🕹️ GAMES CREATED
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {data.recentGames.map((g, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: i < data.recentGames.length - 1 ? "1px solid #222" : "none",
                  paddingBottom: i < data.recentGames.length - 1 ? "8px" : 0,
                }}>
                  <div>
                    <div style={{ fontSize: "7px", color: "#ddd" }}>{g.name}</div>
                    <div style={{ fontSize: "6px", color: "#666", marginTop: "2px" }}>
                      {String(g.config?.gameType ?? "platformer").toUpperCase()} · {String(g.config?.theme ?? "").toUpperCase()}
                    </div>
                  </div>
                  <div style={{ fontSize: "6px", color: "#555", textAlign: "right" }}>
                    {fmt(g.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent concept examples */}
        {data.concepts.length > 0 && (
          <div style={{
            background: "#1a1a2e",
            border: "2px solid #0f3460",
            padding: "14px",
            marginBottom: "16px",
          }}>
            <div style={{ fontSize: "8px", color: "#e94560", marginBottom: "12px" }}>
              💡 RECENT LEARNING MOMENTS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.concepts.slice(0, 5).map((c, i) => (
                <div key={i} style={{ borderLeft: "2px solid #e94560", paddingLeft: "10px" }}>
                  <div style={{ fontSize: "6px", color: "#e94560", marginBottom: "4px" }}>
                    {CONCEPT_EMOJI[c.concept]} {CONCEPT_LABELS[c.concept] ?? c.concept.toUpperCase()}
                  </div>
                  <div style={{
                    fontSize: "6px", color: "#aaa", lineHeight: 1.8,
                    fontFamily: "sans-serif", letterSpacing: 0,
                  }}>
                    &ldquo;{c.example?.slice(0, 120)}{(c.example?.length ?? 0) > 120 ? "…" : ""}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ fontSize: "6px", color: "#333", textAlign: "center", paddingBottom: "24px", lineHeight: 2 }}>
          ALL DATA STAYS ON YOUR SUPABASE ACCOUNT<br />
          CHANGE PIN: SET NEXT_PUBLIC_PARENT_PIN IN VERCEL
        </div>
      </div>
    </div>
  );
}
