"use client";

import { useRef, useEffect, useCallback } from "react";
import { GameConfig, buildGameHTML } from "@/lib/gameTemplate";

interface GamePreviewProps {
  config: GameConfig;
}

export default function GamePreview({ config }: GamePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const srcDoc = buildGameHTML(config);

  const sendKey = useCallback((type: "KEYDOWN" | "KEYUP", key: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type, key }, "*");
  }, []);

  // Keyboard support (desktop)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  sendKey("KEYDOWN", "LEFT");
      if (e.key === "ArrowRight") sendKey("KEYDOWN", "RIGHT");
      if (e.key === "ArrowUp" || e.key === " ") sendKey("KEYDOWN", "UP");
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  sendKey("KEYUP", "LEFT");
      if (e.key === "ArrowRight") sendKey("KEYUP", "RIGHT");
      if (e.key === "ArrowUp" || e.key === " ") sendKey("KEYUP", "UP");
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [sendKey]);

  const btnStyle = (color: string): React.CSSProperties => ({
    background: color,
    color: "#fff",
    fontSize: "14px",
    padding: "0",
    width: "56px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "3px solid #000",
    boxShadow: "3px 3px 0 #000",
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "none",
    borderRadius: "4px",
  });

  const touchStart = (key: string) => (e: React.TouchEvent) => {
    e.preventDefault();
    sendKey("KEYDOWN", key);
  };
  const touchEnd = (key: string) => (e: React.TouchEvent) => {
    e.preventDefault();
    sendKey("KEYUP", key);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#000" }}>
      {/* Game iframe */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          title="game"
        />
      </div>

      {/* Touch controls */}
      <div style={{
        background: "#0d0d1a",
        borderTop: "2px solid #1a1a2e",
        padding: "10px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        {/* Left / Right */}
        <div style={{ display: "flex", gap: "8px" }}>
          <div
            style={btnStyle("#0f3460")}
            onTouchStart={touchStart("LEFT")}
            onTouchEnd={touchEnd("LEFT")}
            onMouseDown={() => sendKey("KEYDOWN", "LEFT")}
            onMouseUp={() => sendKey("KEYUP", "LEFT")}
            onMouseLeave={() => sendKey("KEYUP", "LEFT")}
          >◀</div>
          <div
            style={btnStyle("#0f3460")}
            onTouchStart={touchStart("RIGHT")}
            onTouchEnd={touchEnd("RIGHT")}
            onMouseDown={() => sendKey("KEYDOWN", "RIGHT")}
            onMouseUp={() => sendKey("KEYUP", "RIGHT")}
            onMouseLeave={() => sendKey("KEYUP", "RIGHT")}
          >▶</div>
        </div>

        <div style={{ fontSize: "8px", color: "#444", textAlign: "center" }}>
          CONTROLS
        </div>

        {/* Jump */}
        <div
          style={btnStyle("#e94560")}
          onTouchStart={touchStart("UP")}
          onTouchEnd={touchEnd("UP")}
          onMouseDown={() => sendKey("KEYDOWN", "UP")}
          onMouseUp={() => sendKey("KEYUP", "UP")}
          onMouseLeave={() => sendKey("KEYUP", "UP")}
        >▲</div>
      </div>
    </div>
  );
}
