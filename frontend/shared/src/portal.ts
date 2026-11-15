import type { Role } from './api/types';

export type PortalID = 'buyer' | 'seller' | 'admin' | 'logistics';

export interface PortalDefinition {
  id: PortalID;
  name: string;
  shortName: string;
  description: string;
  port: number;
  allowedRoles: readonly Role[];
}

export const PORTALS: Record<PortalID, PortalDefinition> = {
  buyer: {
    id: 'buyer',
    name: 'Buyer Storefront',
    shortName: 'Tienda',
    description: 'Catálogo, carrito, checkout y órdenes',
    port: 5173,
    allowedRoles: ['BUYER'],
  },
  seller: {
    id: 'seller',
    name: 'Seller Center',
    shortName: 'Vendedor',
    description: 'Catálogo propio, inventario y órdenes',
    port: 5174,
    allowedRoles: ['SELLER'],
  },
  admin: {
    id: 'admin',
    name: 'Admin Console',
    shortName: 'Administración',
    description: 'Aprobaciones, usuarios y supervisión',
    port: 5175,
    allowedRoles: ['ADMINISTRATOR', 'SUPERVISOR'],
  },
  logistics: {
    id: 'logistics',
    name: 'Logistics Console',
    shortName: 'Logística',
    description: 'Despacho y confirmación de entregas',
    port: 5176,
    allowedRoles: ['LOGISTICS_OPERATOR'],
  },
};

export const PORTAL_BY_ROLE: Record<Role, { port: number; name: string }> = {
  BUYER: { port: PORTALS.buyer.port, name: PORTALS.buyer.name },
  SELLER: { port: PORTALS.seller.port, name: PORTALS.seller.name },
  ADMINISTRATOR: { port: PORTALS.admin.port, name: PORTALS.admin.name },
  SUPERVISOR: { port: PORTALS.admin.port, name: PORTALS.admin.name },
  LOGISTICS_OPERATOR: {
    port: PORTALS.logistics.port,
    name: PORTALS.logistics.name,
  },
};

export function portalUrl(port: number): string {
  return `http://localhost:${port}`;
}
