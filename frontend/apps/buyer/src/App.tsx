import { AuthProvider, LoginPage, PORTALS, QueryProvider, RoleGuard, StorefrontShell } from '@nexus/shared';
import { Route, Routes } from 'react-router-dom';
import { CartPage } from './pages/CartPage';
import { CatalogPage } from './pages/CatalogPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFound } from '@nexus/shared';

const portal = PORTALS.buyer;

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage portal={portal} allowRegister />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<StorefrontShell />}>
            <Route index element={<CatalogPage />} />
            <Route path="products/:productId" element={<ProductDetailPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route element={<RoleGuard portal={portal} />}>
            <Route element={<StorefrontShell />}>
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </QueryProvider>
  );
}
