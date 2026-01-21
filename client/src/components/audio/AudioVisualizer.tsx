import { useState } from "react";

export default function AudioVisualizer() {
    // Generate random heights/delays for bars to look organic
    const [bars] = useState(() => Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        delay: Math.random() * 0.5,
        duration: 0.8 + Math.random() * 0.5,
    })));

    return (
        <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#111", // Dark background matching library
            borderRadius: "8px",
            overflow: "hidden"
        }}>
            <div style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "6px",
                height: "60%"
            }}>
                {bars.map((bar) => (
                    <div
                        key={bar.id}
                        style={{
                            width: "12px",
                            height: "100%",
                            background: "linear-gradient(to top, #4ade80, #3b82f6)", // Green to Blue gradient
                            borderRadius: "4px",
                            animation: `visualizer-bounce ${bar.duration}s ease-in-out infinite alternate`,
                            animationDelay: `${bar.delay}s`,
                            opacity: 0.8
                        }}
                    />
                ))}
            </div>
            <style>{`
        @keyframes visualizer-bounce {
          0% { height: 10%; opacity: 0.5; }
          50% { height: 50%; opacity: 0.8; }
          100% { height: 100%; opacity: 1; }
        }
      `}</style>
        </div>
    );
}
