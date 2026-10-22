import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import {
  Product,
  ProductCategory,
  ProductPage,
  ProductRequest,
} from '../../features/products/models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);

  private readonly productsUrl = `${environment.apiUrl}/api/products`;

  getProducts(page = 0, size = 10) {
    return this.http.get<ProductPage>(`${this.productsUrl}/catalog`, {
      params: { page, size },
    });
  }

  searchProducts(
    keyword: string,
    category: ProductCategory | null,
    page = 0,
    size = 10,
    minPrice?: number,
    maxPrice?: number,
  ) {
    let params = new HttpParams();
    if (keyword) params = params.set('keyword', keyword);
    if (category) params = params.set('category', category);
    params = params.set('page', page).set('size', size);
    if (minPrice !== undefined) params = params.set('minPrice', minPrice);
    if (maxPrice !== undefined) params = params.set('maxPrice', maxPrice);

    return this.http.get<ProductPage>(`${this.productsUrl}/search`, {
      params,
    });
  }

  getMyProducts() {
    return this.http.get<Product[]>(`${this.productsUrl}/my-products`);
  }

  createProduct(request: ProductRequest) {
    return this.http.post<Product>(`${this.productsUrl}/product`, request);
  }

  updateProduct(id: string, request: ProductRequest) {
    return this.http.put<Product>(`${this.productsUrl}/product/${id}`, request);
  }

  deleteProduct(id: string) {
    return this.http.delete<void>(`${this.productsUrl}/product/${id}`);
  }
}
