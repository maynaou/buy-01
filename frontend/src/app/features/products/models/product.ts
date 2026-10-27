export const PRODUCT_CATEGORIES = [
  { value: 'BALLS', label: 'Ballons' },
  { value: 'FOOTWEAR', label: 'Chaussures' },
  { value: 'APPAREL', label: 'Maillots et tenues' },
  { value: 'TRAINING', label: 'Entraînement' },
  { value: 'PROTECTION', label: 'Protections' },
  { value: 'GOALKEEPER', label: 'Équipement de gardien' },
  { value: 'ACCESSORIES', label: 'Accessoires' },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]['value'];

export function productCategoryLabel(
  category: ProductCategory | null | undefined,
): string {
  return (
    PRODUCT_CATEGORIES.find((option) => option.value === category)?.label ??
    'Non catégorisé'
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
