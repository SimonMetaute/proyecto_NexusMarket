import {
  AppShell,
  AuthProvider,
  LoginPage,
  NotFound,
  PORTALS,
  QueryProvider,
  RoleGuard,
  type NavItem,
} from '@nexus/shared';
import { FileClock, LayoutDashboard, UserPlus, Users } from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { DashboardPage } from './pages/DashboardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { UsersPage } from './pages/UsersPage';

const portal = PORTALS.admin;

const nav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sellers/onboarding', label: 'Onboarding', icon: UserPlus },
  { to: '/users', label: 'Usuarios', icon: Users },
  { to: '/audit-logs', label: 'Auditoría', icon: FileClock },
];

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage portal={portal} />} />
          <Route element={<RoleGuard portal={portal} />}>
            <Route element={<AppShell portal={portal} nav={nav} />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="sellers/onboarding" element={<OnboardingPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="*" element={<NotFound homePath="/dashboard" />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </QueryProvider>
  );
}
