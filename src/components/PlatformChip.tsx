import React from "react";
import { Youtube, Instagram, Facebook, Linkedin } from "lucide-react";

type IconProps = { className?: string; style?: React.CSSProperties };

const TikTokIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
    <path d="M16.6 3c.35 2.3 1.75 3.9 4 4.15v3.05a7.1 7.1 0 0 1-3.95-1.2v6.3a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6.02.9.07v3.15a2.5 2.5 0 1 0 1.6 2.38V3h3.05z" />
  </svg>
);
const XIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
    <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />
  </svg>
);

export const PLATFORM_BRAND: Record<
  string,
  { label: string; Icon: React.ComponentType<IconProps>; color: string; fill: string; text: string }
> = {
  youtube: { label: "YouTube", Icon: Youtube as any, color: "#FF0000", fill: "#FF0000", text: "#fff" },
  instagram: {
    label: "Instagram",
    Icon: Instagram as any,
    color: "#E1306C",
    fill: "linear-gradient(45deg,#F58529,#DD2A7B 50%,#8134AF)",
    text: "#fff",
  },
  tiktok: { label: "TikTok", Icon: TikTokIcon, color: "#25F4EE", fill: "#000000", text: "#fff" },
  facebook: { label: "Facebook", Icon: Facebook as any, color: "#1877F2", fill: "#1877F2", text: "#fff" },
  linkedin: { label: "LinkedIn", Icon: Linkedin as any, color: "#0A66C2", fill: "#0A66C2", text: "#fff" },
  x: { label: "X", Icon: XIcon, color: "#E7E9EA", fill: "#000000", text: "#fff" },
};

/** Brand-coloured platform chip. Selected = filled with the brand colour; unselected = outlined/dimmed. */
export const PlatformChip: React.FC<{
  platform: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: "xs" | "sm";
  showLabel?: boolean;
  title?: string;
}> = ({ platform, selected = true, onClick, disabled, size = "sm", showLabel = true, title }) => {
  const b = PLATFORM_BRAND[platform] || { label: platform, Icon: () => null, color: "#9CA5B5", fill: "#272D3A", text: "#fff" };
  const { Icon } = b;
  const isTikTok = platform === "tiktok";
  const style: React.CSSProperties = selected
    ? {
        background: b.fill,
        color: b.text,
        borderColor: isTikTok ? "#FE2C55" : "transparent",
        boxShadow: isTikTok ? "-1px -1px 0 #25F4EE inset, 1px 1px 0 #FE2C55 inset" : undefined,
      }
    : { background: "transparent", color: b.color, borderColor: `${b.color}66`, opacity: 0.6 };
  const pad = size === "xs" ? "px-1 py-0.5 text-[9px] gap-0.5" : "px-2 py-0.5 text-[11px] gap-1";
  const icon = size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3";
  const Tag: any = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={disabled}
      title={title || b.label}
      aria-pressed={onClick ? selected : undefined}
      className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap transition-all ${pad} ${
        onClick ? "cursor-pointer hover:opacity-100" : ""
      } ${disabled ? "!opacity-30 cursor-not-allowed" : ""}`}
      style={style}
    >
      <Icon className={icon} style={isTikTok && selected ? { filter: "drop-shadow(1px 0 0 #FE2C55) drop-shadow(-1px 0 0 #25F4EE)" } : undefined} />
      {showLabel && <span>{b.label}</span>}
    </Tag>
  );
};

export default PlatformChip;
