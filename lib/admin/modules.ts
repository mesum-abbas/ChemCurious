import {
  LayoutDashboard,
  ClipboardList,
  FlaskConical,
  Atom,
  GraduationCap,
  Trophy,
  BarChart3,
  Users,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  exact?: boolean;
  /** Sidebar group heading. */
  section: 'Overview' | 'Content' | 'Learners' | 'Administration';
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    title: 'Overview',
    url: '/admin/dashboard',
    section: 'Overview',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: 'Quiz & Curriculum',
    url: '/admin/quizzes',
    section: 'Content',
    icon: ClipboardList,
  },
  {
    title: 'Reactions',
    url: '/admin/reactions',
    section: 'Content',
    icon: FlaskConical,
  },
  {
    title: 'Molecules',
    url: '/admin/molecules',
    section: 'Content',
    icon: Atom,
  },
  {
    title: 'Students',
    url: '/admin/students',
    section: 'Learners',
    icon: GraduationCap,
  },
  {
    title: 'Leaderboard',
    url: '/admin/leaderboard',
    section: 'Learners',
    icon: Trophy,
  },
  {
    title: 'Analytics',
    url: '/admin/analytics',
    section: 'Learners',
    icon: BarChart3,
  },
  {
    title: 'Users & Access',
    url: '/admin/users',
    section: 'Administration',
    icon: Users,
    adminOnly: true,
  },
  {
    title: 'Audit Logs',
    url: '/admin/audit-logs',
    section: 'Administration',
    icon: ScrollText,
    adminOnly: true,
  },
];


export const ADMIN_NAV_SECTIONS = ['Overview', 'Content', 'Learners', 'Administration'] as const;
