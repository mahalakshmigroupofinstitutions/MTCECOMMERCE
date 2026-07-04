/* NextGen — minimal stroke icon set. Ported from the prototype's icons.jsx (Lucide-style, currentColor). */

export type IconName =
  | "search"
  | "filter"
  | "sliders"
  | "star"
  | "star-o"
  | "check"
  | "verified"
  | "pin"
  | "clock"
  | "truck"
  | "chat"
  | "whatsapp"
  | "arrow-left"
  | "arrow-right"
  | "chevron-right"
  | "chevron-down"
  | "plus"
  | "grid"
  | "list"
  | "heart"
  | "bell"
  | "home"
  | "box"
  | "doc"
  | "mic"
  | "camera"
  | "shield"
  | "tag"
  | "user"
  | "menu"
  | "building"
  | "cart"
  | "x"
  | "mail"
  | "phone"
  | "trend"
  | "spark";

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function Icon({ name, size = 20, strokeWidth = 1.7, className }: IconProps) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (name) {
    case "search":
      return (
        <svg {...p}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    case "filter":
      return (
        <svg {...p}>
          <path d="M3 5h18M7 12h10M10 19h4" />
        </svg>
      );
    case "sliders":
      return (
        <svg {...p}>
          <path d="M4 6h11M19 6h1M4 12h1M9 12h11M4 18h7M15 18h5" />
          <circle cx="17" cy="6" r="2" />
          <circle cx="7" cy="12" r="2" />
          <circle cx="13" cy="18" r="2" />
        </svg>
      );
    case "star":
      return (
        <svg {...p} fill="currentColor" stroke="none">
          <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z" />
        </svg>
      );
    case "star-o":
      return (
        <svg {...p}>
          <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z" />
        </svg>
      );
    case "check":
      return (
        <svg {...p}>
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      );
    case "verified":
      return (
        <svg {...p}>
          <path d="M12 2.6l2.1 1.5 2.6-.2 1 2.4 2.2 1.4-.6 2.5.6 2.5-2.2 1.4-1 2.4-2.6-.2L12 21.4l-2.1-1.5-2.6.2-1-2.4-2.2-1.4.6-2.5-.6-2.5 2.2-1.4 1-2.4 2.6.2z" />
          <path d="M8.8 12.2l2.1 2.1 4.3-4.4" />
        </svg>
      );
    case "pin":
      return (
        <svg {...p}>
          <path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "clock":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 1.8" />
        </svg>
      );
    case "truck":
      return (
        <svg {...p}>
          <path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z" />
          <circle cx="7" cy="17.5" r="1.8" />
          <circle cx="17.5" cy="17.5" r="1.8" />
        </svg>
      );
    case "chat":
      return (
        <svg {...p}>
          <path d="M4 5h16v11H9l-4 3.5V16H4z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...p}>
          <path d="M5 19l1.2-3.4a7 7 0 113.2 3.1z" />
          <path d="M9 9.2c.2 2.4 2.3 4.5 4.7 4.7.6.05 1.2-.5 1.2-1.1 0-.3-.2-.6-.5-.8l-1-.4c-.3-.1-.6 0-.8.2-.6-.3-1.1-.8-1.4-1.4.2-.2.3-.5.2-.8l-.4-1c-.1-.3-.4-.5-.8-.5-.6 0-1.1.6-1.1 1.2z" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg {...p}>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...p}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...p}>
          <path d="M9 5l7 7-7 7" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...p}>
          <path d="M5 9l7 7 7-7" />
        </svg>
      );
    case "plus":
      return (
        <svg {...p}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "grid":
      return (
        <svg {...p}>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
        </svg>
      );
    case "list":
      return (
        <svg {...p}>
          <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
        </svg>
      );
    case "heart":
      return (
        <svg {...p}>
          <path d="M12 20s-7-4.6-7-9.4A4.1 4.1 0 0112 7a4.1 4.1 0 017 3.6C19 15.4 12 20 12 20z" />
        </svg>
      );
    case "bell":
      return (
        <svg {...p}>
          <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" />
          <path d="M10 19a2 2 0 004 0" />
        </svg>
      );
    case "home":
      return (
        <svg {...p}>
          <path d="M4 11l8-7 8 7M6 9.5V20h12V9.5" />
        </svg>
      );
    case "box":
      return (
        <svg {...p}>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
          <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
        </svg>
      );
    case "doc":
      return (
        <svg {...p}>
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v4h4M10 12h5M10 16h5" />
        </svg>
      );
    case "mic":
      return (
        <svg {...p}>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0014 0M12 18v3" />
        </svg>
      );
    case "camera":
      return (
        <svg {...p}>
          <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
          <circle cx="12" cy="13" r="3.2" />
        </svg>
      );
    case "shield":
      return (
        <svg {...p}>
          <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
        </svg>
      );
    case "tag":
      return (
        <svg {...p}>
          <path d="M3 12l8.5-8.5H20V12L11.5 20.5z" />
          <circle cx="16" cy="8" r="1.4" />
        </svg>
      );
    case "user":
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20a7 7 0 0114 0" />
        </svg>
      );
    case "menu":
      return (
        <svg {...p}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "building":
      return (
        <svg {...p}>
          <path d="M5 21V5l8-2v18M13 21V9l6 2v10M5 21h16M8 8h2M8 12h2M8 16h2" />
        </svg>
      );
    case "cart":
      return (
        <svg {...p}>
          <path d="M4 5h2l2 11h9l2-7H7" />
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="17" cy="20" r="1.4" />
        </svg>
      );
    case "x":
      return (
        <svg {...p}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "mail":
      return (
        <svg {...p}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M4 7l8 6 8-6" />
        </svg>
      );
    case "phone":
      return (
        <svg {...p}>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z" />
        </svg>
      );
    case "trend":
      return (
        <svg {...p}>
          <path d="M4 16l5-5 3 3 6-7M16 7h4v4" />
        </svg>
      );
    case "spark":
      return (
        <svg {...p}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
