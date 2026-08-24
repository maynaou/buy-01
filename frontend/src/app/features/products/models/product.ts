/**
 * Mirrors the backend `ProductDTO`.
 *
 * Note: the DTO does not expose the product id, so list items are not
 * individually addressable yet.
 */
export interface Product {
  name: string;
  description: string;
  price: number;
  quantity: number;
  imagePaths: string[] | null;
}
