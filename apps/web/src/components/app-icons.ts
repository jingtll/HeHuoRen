import {
  Bell,
  House,
  Mail,
  Network,
  Star,
  UserRound,
  Users,
} from "@lucide/vue";

// 仅静态导入实际使用的图标，避免全量图标注册。
export const appIcons = {
  home: House,
  users: Users,
  network: Network,
  mail: Mail,
  star: Star,
  bell: Bell,
  user: UserRound,
};
export type AppIconName = keyof typeof appIcons;
