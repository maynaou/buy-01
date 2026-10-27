export interface MostPurchasedProduct {
  productId: string;
  name: string;
  units: number;
  amountSpent: number;
}

export interface PurchasedCategory {
  category: string;
  units: number;
  amountSpent: number;
}

export interface CustomerProfileAnalytics {
  totalSpent: number;
  mostBoughtProducts: MostPurchasedProduct[];
  topCategories: PurchasedCategory[];
}
