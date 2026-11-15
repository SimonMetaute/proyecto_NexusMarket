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
import {
  ClipboardList,
  LayoutDashboard,
  Package,
  Warehouse,
} from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { EditProductPage } from './pages/EditProductPage';
import { InventoryPage } from './pages/InventoryPage';
import { NewProductPage } from './pages/NewProductPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';

const portal = PORTALS.seller;

const nav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/inventory', label: 'Inventario', icon: Warehouse },
  { to: '/orders', label: 'Órdenes', icon: ClipboardList },
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
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/new" element={<NewProductPage />} />
              <Route path="products/:productId/edit" element={<EditProductPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="*" element={<NotFound homePath="/dashboard" />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </QueryProvider>
  );
}
