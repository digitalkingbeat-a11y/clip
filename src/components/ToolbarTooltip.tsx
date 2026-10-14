import React, { useState, useRef, useEffect } from "react";

export interface ToolbarTooltipProps {
  label: string;
  description: string;
  shortcut?: string;
  enabled: boolean;
  position?: "top" | "bottom";
  children: React.ReactNode;
  className?: string;
}

export const ToolbarTooltip: React.FC<ToolbarTooltipProps> = ({
  label,
  description,
  shortcut,
  enabled,
  position = "top",
  children,
  className = "relative inline-flex items-center",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (!enabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {enabled && isHovered && (
        <div
          role="tooltip"
          className={`absolute left-1/2 -translate-x-1/2 pointer-events-none z-[120] px-2.5 py-1.5 rounded-lg bg-[#141822] text-gray-200 border border-[#3a3a44] shadow-2xl text-[10px] whitespace-nowrap animate-in fade-in-50 zoom-in-95 duration-100 ${
            position === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <span>{label}</span>
            {shortcut && (
              <kbd className="px-1 py-0.5 rounded bg-black/60 text-[9px] font-mono text-[#16D9F5] border border-white/10 font-bold">
                {shortcut}
              </kbd>
            )}
          </div>
          <div className="text-[9px] text-gray-300 font-normal leading-tight mt-0.5 max-w-xs text-left">
            {description}
          </div>
          {/* Subtle pointer arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[#141822] border-[#3a3a44] ${
              position === "top"
                ? "bottom-[-4px] border-r border-b"
                : "top-[-4px] border-l border-t"
            }`}
          />
        </div>
      )}
    </div>
  );
};
