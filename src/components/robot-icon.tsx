export function RobotIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={["robot-wave", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <style>{`
        .robot-eyes {
          transform-box: fill-box;
          transform-origin: center;
          animation: robot-blink 4s ease-in-out infinite;
        }
        @keyframes robot-blink {
          0%, 90%, 100% { transform: scaleY(1); }
          93% { transform: scaleY(0.08); }
          96% { transform: scaleY(1); }
        }
        .robot-antenna {
          animation: robot-glow 2s ease-in-out infinite;
        }
        @keyframes robot-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .robot-wave {
          transform-origin: 75% 92%;
          animation: robot-wave 5s ease-in-out infinite;
        }
        @keyframes robot-wave {
          0%, 55% { transform: rotate(0deg); }
          60% { transform: rotate(-14deg); }
          65% { transform: rotate(12deg); }
          70% { transform: rotate(-10deg); }
          75% { transform: rotate(8deg); }
          80% { transform: rotate(-5deg); }
          85%, 100% { transform: rotate(0deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .robot-wave, .robot-eyes, .robot-antenna { animation: none; }
        }
      `}</style>

      {/* antenna */}
      <line x1="24" y1="9" x2="24" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle className="robot-antenna" cx="24" cy="6" r="3" fill="currentColor" />

      {/* ears */}
      <path d="M9 23H6.5a1.5 1.5 0 0 0-1.5 1.5v3A1.5 1.5 0 0 0 6.5 29H9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M39 23h2.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H39" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

      {/* head */}
      <rect x="9" y="14" width="30" height="24" rx="7" fill="currentColor" opacity="0.18" />
      <rect x="9" y="14" width="30" height="24" rx="7" stroke="currentColor" strokeWidth="2.5" />

      {/* eyes */}
      <g className="robot-eyes">
        <circle cx="18.5" cy="24" r="3.2" fill="currentColor" />
        <circle cx="29.5" cy="24" r="3.2" fill="currentColor" />
      </g>

      {/* smile */}
      <path d="M19 31c1.4 1.8 3.3 2.7 5 2.7s3.6-.9 5-2.7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
