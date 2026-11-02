/**
 * Domain Entity: ProductVariant
 * Source: SDD/Domain/domain_model.md (Section 2.7)
 */

export class ProductVariant {
  private readonly _variantId: string;
  private readonly _productId: string;
  private readonly _attribute: string;
  private readonly _value: string;
  private readonly _additionalPrice: number;
  private readonly _skuVariant: string;

  constructor(params: {
    variantId: string;
    productId: string;
    attribute: string;
    value: string;
    additionalPrice: number;
    skuVariant: string;
  }) {
    if (!params.variantId || params.variantId.trim().length === 0) {
      throw new Error('ProductVariant.variantId is required.');
    }
    if (!params.productId || params.productId.trim().length === 0) {
      throw new Error('ProductVariant.productId is required.');
    }
    if (!params.attribute || params.attribute.trim().length === 0) {
      throw new Error('ProductVariant.attribute is required.');
    }
    if (!params.value || params.value.trim().length === 0) {
      throw new Error('ProductVariant.value is required.');
    }
    if (!params.skuVariant || params.skuVariant.trim().length === 0) {
      throw new Error('ProductVariant.skuVariant is required.');
    }
    if (typeof params.additionalPrice !== 'number' || Number.isNaN(params.additionalPrice)) {
      throw new Error('ProductVariant.additionalPrice must be a valid number.');
    }

    this._variantId = params.variantId.trim();
    this._productId = params.productId.trim();
    this._attribute = params.attribute.trim();
    this._value = params.value.trim();
    this._additionalPrice = params.additionalPrice;
    this._skuVariant = params.skuVariant.trim();
  }

  get variantId(): string {
    return this._variantId;
  }

  get productId(): string {
    return this._productId;
  }

  get attribute(): string {
    return this._attribute;
  }

  get value(): string {
    return this._value;
  }

  get additionalPrice(): number {
    return this._additionalPrice;
  }

  get skuVariant(): string {
    return this._skuVariant;
  }
}
