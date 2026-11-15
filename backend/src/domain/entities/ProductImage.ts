/**
 * Domain Entity: ProductImage.
 *
 * An image is a child entity of the `Product` aggregate. It has no meaning on
 * its own: every operation is scoped to a product that the seller owns. The
 * aggregate publication rule requires at least one image and a SKU.
 *
 * DDD purity rules applied:
 *  - No imports of external libraries, frameworks or infrastructure elements.
 */

export class ProductImage {
  private readonly _imageId: string;
  private readonly _productId: string;
  private readonly _url: string;
  private readonly _altText?: string;
  private readonly _position: number;
  private readonly _createdAt: Date;

  constructor(params: {
    imageId: string;
    productId: string;
    url: string;
    altText?: string;
    position?: number;
    createdAt: Date;
  }) {
    if (!params.imageId || params.imageId.trim().length === 0) {
      throw new Error('ProductImage.imageId is required.');
    }
    if (!params.productId || params.productId.trim().length === 0) {
      throw new Error('ProductImage.productId is required.');
    }
    if (!params.url || params.url.trim().length === 0) {
      throw new Error('ProductImage.url is required.');
    }
    if (params.position !== undefined && (!Number.isInteger(params.position) || params.position < 0)) {
      throw new Error('ProductImage.position must be a non-negative integer.');
    }
    if (!(params.createdAt instanceof Date) || Number.isNaN(params.createdAt.getTime())) {
      throw new Error('ProductImage.createdAt must be a valid Date.');
    }

    this._imageId = params.imageId.trim();
    this._productId = params.productId.trim();
    this._url = params.url.trim();
    if (params.altText !== undefined) {
      this._altText = params.altText.trim();
    }
    this._position = params.position ?? 0;
    this._createdAt = params.createdAt;
  }

  get imageId(): string {
    return this._imageId;
  }

  get productId(): string {
    return this._productId;
  }

  get url(): string {
    return this._url;
  }

  get altText(): string | undefined {
    return this._altText;
  }

  get position(): number {
    return this._position;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
