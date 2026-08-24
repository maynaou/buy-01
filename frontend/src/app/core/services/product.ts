import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { Product } from '../../features/products/models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);

  private readonly productsUrl = `${environment.apiUrl}/api/products`;

  getProducts() {
     console.log("-------------------------------");
     
    return this.http.get<Product[]>(`${this.productsUrl}/product`);
  }
}
