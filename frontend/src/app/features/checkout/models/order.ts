// ── Request ──────────────────────────────────────────────────────────────────
export interface CheckoutRequest {
  fullName: string;
  address: string;
  phone: string;
}

// ── Response — mirrors Order.java entity ──────────────────────────────────────
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  image?: string;
}

export interface StatusChange {
  status: OrderStatus;
  changedAt: string; // ISO-8601
  changedBy: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  status: OrderStatus;
  paymentMethod: string;
  fullName: string;
  address: string;
  phone: string;
  items: OrderItem[];
  total: number;
  statusHistory: StatusChange[];
  hiddenByBuyer: boolean;
  createdAt: string; // ISO-8601
}
