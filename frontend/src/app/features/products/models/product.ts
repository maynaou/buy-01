export const PRODUCT_CATEGORIES = [
  { value: 'BALLS', label: 'Balls' },
  { value: 'FOOTWEAR', label: 'Footwear' },
  { value: 'APPAREL', label: 'Apparel' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'PROTECTION', label: 'Protective gear' },
  { value: 'GOALKEEPER', label: 'Goalkeeper gear' },
  { value: 'ACCESSORIES', label: 'Accessories' },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]['value'];

export function productCategoryLabel(
  category: ProductCategory | null | undefined,
): string {
  return (
    PRODUCT_CATEGORIES.find((option) => option.value === category)?.label ??
    'Uncategorized'
  );
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  imagePaths: string[] | null;
  category?: ProductCategory | null;
}

export interface ProductPage {
  content: Product[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}


export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: ProductCategory;
}
