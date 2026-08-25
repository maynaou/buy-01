export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  imagePaths: string[] | null;
}


export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  quantity: number;
}
