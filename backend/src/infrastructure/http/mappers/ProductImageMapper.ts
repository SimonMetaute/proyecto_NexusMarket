import type { ProductImage } from '../../../domain/entities/ProductImage.js';

export function toProductImageResponse(image: ProductImage): Record<string, unknown> {
  return {
    imageId: image.imageId,
    productId: image.productId,
    url: image.url,
    altText: image.altText,
    position: image.position,
    createdAt: image.createdAt,
  };
}
