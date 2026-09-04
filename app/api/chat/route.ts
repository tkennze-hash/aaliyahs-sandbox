import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

const HD_PROMPT = `

VISUAL QUALITY — HD MODE ACTIVE:
The player has selected HD mode. Generate visually rich, mobile-quality games. Use:
- Rounded rectangles: const g = this.add.graphics(); g.fillStyle(COLOR, 1); g.fillRoundedRect(x, y, w, h, 16);
- Gradient effect (layered shapes): draw large shape at low alpha, smaller same-colour shape at high alpha on top for depth
- Drop shadows: draw a slightly offset darker shape behind main shapes
- Particle effects: first make texture: const pg = this.make.graphics({add:false}); pg.fillStyle(0xffffff); pg.fillCircle(4,4,4); pg.generateTexture('dot',8,8); pg.destroy(); then: this.add.particles(x,y,'dot',{ speed:{min:50,max:150}, scale:{start:0.4,end:0}, alpha:{start:1,end:0}, lifespan:600, quantity:3 })
- Tweens on everything: score pop (scale 1.3 then back), coins spin, player bounce
- Vibrant palette: 0xff6b35 orange, 0x06d6a0 teal, 0xffd166 gold, 0xef476f pink, 0x118ab2 blue, 0x7400b8 purple
- Large clear UI text: { fontSize:'20px', color:'#fff', stroke:'#000', strokeThickness:4, fontFamily:'Arial Black, Arial' }
- Parallax scrolling for runner/endless games: multiple background layers at different scroll speeds
- Make it look like a real mobile game — smooth, colourful, polished`;

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Ordered by preference: lite has higher RPM quota
const MODELS = ["gemini-3.1-flash-lite", "gemini-3-flash-preview"];
const ERROR_MSG = "Hmm, something went wrong! Try again? 🎮";

async function geminiCall(model: string, contents: unknown[], systemPrompt: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  let res: Response;
  try {
    res = await fetch(`${BASE}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        tools: [{ googleSearch: {} }],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(`${model} ${res.status}: ${data.error?.message ?? "error"}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error(`${model} empty`);
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, bitMode } = await req.json();
    const systemText = SYSTEM_PROMPT + (bitMode === "hd" ? HD_PROMPT : "");

    // Strip error messages from history — they pollute Gemini context
    const clean = messages.filter(
      (m: { role: string; content: string }) => m.content !== ERROR_MSG
    );

    const contents = clean.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const errors: string[] = [];
    for (let i = 0; i < MODELS.length; i++) {
      try {
        const text = await geminiCall(MODELS[i], contents, systemText);
        return NextResponse.json({ content: text });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${MODELS[i]}: ${msg}`);
        console.warn(`Gemini ${MODELS[i]} failed:`, msg);
        if (i < MODELS.length - 1) await new Promise((r) => setTimeout(r, 1000));
      }
    }

    console.error("All Gemini models failed:", errors);
    return NextResponse.json({ content: ERROR_MSG, debug: errors }, { status: 500 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Gemini route error:", msg);
    return NextResponse.json({ content: ERROR_MSG, debug: [msg] }, { status: 500 });
  }
}
