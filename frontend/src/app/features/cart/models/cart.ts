export interface CartRequest {
  productId: string;
  quantity: number;
}

export interface CartItemResponse {
  productId: string;
  productName: string;
  productDescription?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  availableStock: number;
  imagePaths?: string[];
}

export interface CartResponse {
  id?: string;
  userId: string;
  items: CartItemResponse[];
  totalItems: number;
  subtotalPrice: number;
  shippingPrice: number;
  totalPrice: number;
}

// Backward-compatible aliases
export type Cart = CartResponse;
export type CartItem = CartItemResponse;