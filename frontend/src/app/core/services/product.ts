import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { Product, ProductRequest } from '../../features/products/models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);

  private readonly productsUrl = `${environment.apiUrl}/api/products`;

  getProducts() {
    return this.http.get<Product[]>(`${this.productsUrl}/product`);
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
