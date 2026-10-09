import {
  Bell,
  House,
  Mail,
  Handshake,
  Leaf,
  BookOpen,
  ShieldCheck,
  Pencil,
  Star,
  UserRound,
  Users,
} from "@lucide/vue";

// 仅静态导入实际使用的图标，避免全量图标注册。
export const appIcons = {
  home: House,
  users: Users,
  team: Handshake,
  leaf: Leaf,
  book: BookOpen,
  shield: ShieldCheck,
  pencil: Pencil,
  mail: Mail,
  star: Star,
  bell: Bell,
  user: UserRound,
};
export type AppIconName = keyof typeof appIcons;
