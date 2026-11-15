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
import { RotateCcw, Truck } from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DispatchQueuePage } from './pages/DispatchQueuePage';
import { ReturnsPage } from './pages/ReturnsPage';
import { ShipmentPage } from './pages/ShipmentPage';

const portal = PORTALS.logistics;

const nav: NavItem[] = [
  { to: '/dispatch-queue', label: 'Cola de despacho', icon: Truck },
  { to: '/returns', label: 'Devoluciones', icon: RotateCcw },
];

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage portal={portal} />} />
          <Route element={<RoleGuard portal={portal} />}>
            <Route element={<AppShell portal={portal} nav={nav} />}>
              <Route index element={<Navigate to="/dispatch-queue" replace />} />
              <Route path="dispatch-queue" element={<DispatchQueuePage />} />
              <Route path="shipments/:orderId" element={<ShipmentPage />} />
              <Route path="returns" element={<ReturnsPage />} />
              <Route path="*" element={<NotFound homePath="/dispatch-queue" />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </QueryProvider>
  );
}
