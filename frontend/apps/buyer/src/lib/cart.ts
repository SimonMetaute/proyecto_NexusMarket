import { ApiError, addCartItem, createCart, getCart } from '@nexus/shared';
import type { AddCartItemRequest, AddCartItemResponse, Cart } from '@nexus/shared';

export async function consultCartOrNull(): Promise<Cart | null> {
  try {
    return await getCart();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * El backend exige un carrito abierto antes de aceptar ítems.
 * Si no existe, se crea uno (sin cálculos locales: todo viene del servidor).
 */
export async function addItemCreatingCartIfNeeded(
  payload: AddCartItemRequest,
): Promise<AddCartItemResponse> {
  const cart = await consultCartOrNull();
  if (cart === null) {
    await createCart();
  }
  return addCartItem(payload);
}
