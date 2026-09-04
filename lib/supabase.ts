import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// ── concept signal detection ────────────────────────────────────────────────

const CONCEPT_SIGNALS: Array<{ pattern: RegExp; concept: string }> = [
  { pattern: /\bIF\b.{0,60}\bTHEN\b/i,         concept: "condition" },
  { pattern: /\bwhat happens (if|when)\b/i,      concept: "condition" },
  { pattern: /\bhow (fast|high|many|much)\b/i,   concept: "variable" },
  { pattern: /\bkeeps? (happening|repeating|going)\b/i, concept: "loop" },
  { pattern: /\bevery time\b/i,                  concept: "loop" },
  { pattern: /\bwhat should happen when\b/i,     concept: "function" },
  { pattern: /\bpress(ing)? (jump|left|right)\b/i, concept: "function" },
  { pattern: /\bscore.{0,20}(goes? up|increases?|adds?)\b/i, concept: "arithmetic" },
  { pattern: /\bpoints?\b/i,                     concept: "arithmetic" },
];

export function detectConcepts(text: string): string[] {
  const found = new Set<string>();
  for (const { pattern, concept } of CONCEPT_SIGNALS) {
    if (pattern.test(text)) found.add(concept);
  }
  return Array.from(found);
}

// ── database helpers ────────────────────────────────────────────────────────

export async function ensurePlayer(name: string): Promise<string> {
  const stored = typeof window !== "undefined" ? localStorage.getItem("aaliyah_player_id") : null;
  if (stored) return stored;

  const { data, error } = await supabase
    .from("players")
    .insert({ name })
    .select("id")
    .single();

  if (error) throw error;
  if (typeof window !== "undefined") localStorage.setItem("aaliyah_player_id", data.id);
  return data.id;
}

export async function getPlayerId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("aaliyah_player_id");
}

export async function startSession(playerId: string): Promise<string> {
  const { data, error } = await supabase
    .from("sessions")
    .insert({ player_id: playerId })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function saveMessage(sessionId: string, role: "user" | "assistant", content: string) {
  await supabase.from("messages").insert({ session_id: sessionId, role, content });
}

export async function saveGame(sessionId: string, config: object, theme: string) {
  const { count } = await supabase
    .from("games")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  const name = `Aaliyah's ${capitalize(theme)} Game #${(count ?? 0) + 1}`;

  await supabase.from("games").insert({ session_id: sessionId, name, config });
}

export async function saveConcepts(sessionId: string, concepts: string[], example: string) {
  if (!concepts.length) return;
  const rows = concepts.map((concept) => ({ session_id: sessionId, concept, example: example.slice(0, 200) }));
  await supabase.from("concepts").insert(rows);
}

export async function loadLastGame(): Promise<object | null> {
  const playerId = await getPlayerId();
  if (!playerId) return null;

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id")
    .eq("player_id", playerId);

  if (!sessions?.length) return null;
  const sessionIds = sessions.map((s) => s.id);

  const { data } = await supabase
    .from("games")
    .select("config")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false })
    .limit(1);

  return data?.[0]?.config ?? null;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
