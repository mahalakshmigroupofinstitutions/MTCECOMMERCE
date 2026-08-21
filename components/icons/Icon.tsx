/* NextGen — icon set backed by lucide-react. Keeps the original hand-drawn
 * set's name/prop API so every call site across the app is unchanged; only
 * the rendering underneath is now a real, professionally maintained icon
 * library instead of hand-copied paths. WhatsApp has no lucide equivalent
 * (it's a generic icon set, not brand logos) and stays a custom mark. */
import {
  Search,
  Filter,
  SlidersHorizontal,
  Star,
  Check,
  BadgeCheck,
  MapPin,
  Clock,
  Truck,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Plus,
  LayoutGrid,
  List,
  Heart,
  Bell,
  Home,
  Box,
  FileText,
  Mic,
  Camera,
  Shield,
  Tag,
  User,
  Menu,
  Building2,
  ShoppingCart,
  X,
  Mail,
  Phone,
  TrendingUp,
  Sparkles,
  Store,
  type LucideIcon,
} from "lucide-react";

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
  | "spark"
  | "store";

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const ICONS: Partial<Record<IconName, LucideIcon>> = {
  search: Search,
  filter: Filter,
  sliders: SlidersHorizontal,
  star: Star,
  "star-o": Star,
  check: Check,
  verified: BadgeCheck,
  pin: MapPin,
  clock: Clock,
  truck: Truck,
  chat: MessageCircle,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  plus: Plus,
  grid: LayoutGrid,
  list: List,
  heart: Heart,
  bell: Bell,
  home: Home,
  box: Box,
  doc: FileText,
  mic: Mic,
  camera: Camera,
  shield: Shield,
  tag: Tag,
  user: User,
  menu: Menu,
  building: Building2,
  cart: ShoppingCart,
  x: X,
  mail: Mail,
  phone: Phone,
  trend: TrendingUp,
  spark: Sparkles,
  store: Store,
};

export function Icon({ name, size = 20, strokeWidth = 1.7, className }: IconProps) {
  if (name === "whatsapp") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M5 19l1.2-3.4a7 7 0 113.2 3.1z" />
        <path d="M9 9.2c.2 2.4 2.3 4.5 4.7 4.7.6.05 1.2-.5 1.2-1.1 0-.3-.2-.6-.5-.8l-1-.4c-.3-.1-.6 0-.8.2-.6-.3-1.1-.8-1.4-1.4.2-.2.3-.5.2-.8l-.4-1c-.1-.3-.4-.5-.8-.5-.6 0-1.1.6-1.1 1.2z" />
      </svg>
    );
  }

  const LucideComponent = ICONS[name] ?? Search;
  const filled = name === "star";
  return (
    <LucideComponent
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
    />
  );
}
