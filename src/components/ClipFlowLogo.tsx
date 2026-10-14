import React from "react";

interface ClipFlowLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  iconOnly?: boolean;
  className?: string;
  showProBadge?: boolean;
}

export const ClipFlowLogo: React.FC<ClipFlowLogoProps> = ({
  size = "sm",
  iconOnly = false,
  className = "",
  showProBadge = false,
}) => {
  // Height / scale calibrations for crisp compact UI rendering
  const heightMap = {
    xs: 22,
    sm: 28,
    md: 34,
    lg: 44,
  };

  const h = heightMap[size];
  const iconWidth = Math.round(h * 1.15);

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* ClipFlow 3D Gradient Icon (Curved 'C' Ribbon + Play Triangle + Motion Speed Lines) */}
      <svg
        width={iconWidth}
        height={h}
        viewBox="0 0 120 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 drop-shadow-[0_2px_8px_rgba(22,217,245,0.25)]"
      >
        <defs>
          {/* Main Ribbon C Gradient: Cyan -> Blue -> Indigo -> Purple -> Magenta -> Pink */}
          <linearGradient id="cf-outer-gradient" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#16D9F5" />
            <stop offset="24%" stopColor="#168CFF" />
            <stop offset="48%" stopColor="#4655FF" />
            <stop offset="72%" stopColor="#933CFF" />
            <stop offset="88%" stopColor="#E72DDB" />
            <stop offset="100%" stopColor="#FF4081" />
          </linearGradient>

          {/* Ribbon Gloss Highlight */}
          <linearGradient id="cf-gloss-gradient" x1="10%" y1="0%" x2="80%" y2="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#16D9F5" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#933CFF" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#FF4081" stopOpacity="0.3" />
          </linearGradient>

          {/* Internal Play Triangle Gradient */}
          <linearGradient id="cf-play-gradient" x1="20%" y1="20%" x2="90%" y2="85%">
            <stop offset="0%" stopColor="#16D9F5" />
            <stop offset="45%" stopColor="#168CFF" />
            <stop offset="75%" stopColor="#4655FF" />
            <stop offset="100%" stopColor="#933CFF" />
          </linearGradient>

          {/* Speed Lines Gradient */}
          <linearGradient id="cf-speed-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#4655FF" />
            <stop offset="50%" stopColor="#933CFF" />
            <stop offset="80%" stopColor="#E72DDB" />
            <stop offset="100%" stopColor="#FF4081" />
          </linearGradient>
        </defs>

        {/* 3 Horizontal Trailing Speed Lines */}
        <rect x="68" y="38" width="34" height="6.5" rx="3.25" fill="url(#cf-speed-gradient)" opacity="0.95" />
        <rect x="60" y="49" width="30" height="6.5" rx="3.25" fill="url(#cf-speed-gradient)" opacity="0.88" />
        <rect x="52" y="60" width="24" height="6" rx="3" fill="url(#cf-speed-gradient)" opacity="0.75" />

        {/* Outer Curved 'C' Ribbon Body */}
        <path
          d="M74 24.5 C66 12 49 7.5 34.5 13 C20 18.5 9 32.5 8 48 C7 64 16 78.5 30 84.5 C44 90.5 61 87.5 72 75 C75 71.5 72 66.5 67.5 67 C59 68 51 66 43.5 62 C33.5 56.5 28 46.5 29 35.5 C30 24.5 38 16 48.5 15.5 C57 15 65.5 19 71 25.5 C73.5 28.5 77 28 74 24.5 Z"
          fill="url(#cf-outer-gradient)"
        />

        {/* Volumetric Smooth C Rim */}
        <path
          d="M76 22 C64 8 44 4 28 11 C12 18 2 34 2 51 C2 69 13 85 29 91.5 C46 98 66 93 78 79 C79.5 77 77.5 74 74.5 75 C63 79 50 78.5 39 73 C26 66.5 18 54 18 39.5 C18 25 28 13.5 42 12 C54 10.5 66 15.5 73.5 24 C75.5 26.5 78.5 25 76 22 Z"
          fill="url(#cf-outer-gradient)"
        />

        {/* Specular Highlight along Top Curve */}
        <path
          d="M30 11.5 C44 5.5 62 8 74 21 C76 23 74 25.5 71.5 24 C61.5 14 45.5 11.5 32 16.5 C24 19.5 17 25 12 32.5 C10.5 30 14 23 19 18 C22 15.5 26 13 30 11.5 Z"
          fill="url(#cf-gloss-gradient)"
          opacity="0.9"
        />

        {/* Right-Pointing Center Play Triangle */}
        <path
          d="M36 30.5 C36 27.5 39.5 25.5 42 27 L66.5 45 C69 46.8 69 50.2 66.5 52 L42 70 C39.5 71.5 36 69.5 36 66.5 Z"
          fill="#080A0F"
        />
        <path
          d="M38 33 C38 30.5 41 29 43 30.5 L64.5 46.5 C66.5 48 66.5 51 43 66.5 C41 68 38 66.5 38 64 Z"
          fill="url(#cf-play-gradient)"
        />
        {/* Play Button Inner Glow Highlight */}
        <path
          d="M40 36 L60 48.5 L40 61 Z"
          fill="#0C0F16"
          opacity="0.65"
        />
        <path
          d="M40 36 L55 46.5 L40 50 Z"
          fill="#16D9F5"
          opacity="0.4"
        />
      </svg>

      {/* Wordmark: "Clip" in crisp white `#F7F8FA` + "Flow" in ClipFlow Gradient */}
      {!iconOnly && (
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className="font-extrabold tracking-tight text-[#F7F8FA] font-sans"
            style={{ fontSize: Math.round(h * 0.72) }}
          >
            Clip
            <span
              className="bg-clipflow-gradient"
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Flow
            </span>
          </span>

          {showProBadge && (
            <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#171C27] text-[#16D9F5] border border-[#272D3A] ml-0.5">
              PRO
            </span>
          )}
        </div>
      )}
    </div>
  );
};
