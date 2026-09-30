import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ProductService } from './product';
import { environment } from '../../../environments/environment';
import { Product, ProductRequest } from '../../features/products/models/product';

describe('ProductService', () => {
  let service: ProductService;
  let httpTestingController: HttpTestingController;

  const productsUrl = `${environment.apiUrl}/api/products`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ProductService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProducts', () => {
    it('should send a GET request to fetch all products', () => {
      const response: Product[] = [{ id: '1' } as Product];

      service.getProducts().subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpTestingController.expectOne(`${productsUrl}/product`);

      expect(req.request.method).toBe('GET');

      req.flush(response);
    });
  });

  describe('getMyProducts', () => {
    it('should send a GET request to fetch my products', () => {
      const response: Product[] = [{ id: '1' } as Product];

      service.getMyProducts().subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpTestingController.expectOne(`${productsUrl}/my-products`);

      expect(req.request.method).toBe('GET');

      req.flush(response);
    });
  });

  describe('createProduct', () => {
    it('should send a POST request with the product data', () => {
      const request: ProductRequest = { name: 'Test' } as ProductRequest;
      const response: Product = { id: '1' } as Product;

      service.createProduct(request).subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpTestingController.expectOne(`${productsUrl}/product`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);

      req.flush(response);
    });
  });

  describe('updateProduct', () => {
    it('should send a PUT request to update the product', () => {
      const id = 'prod-1';
      const request: ProductRequest = { name: 'Updated' } as ProductRequest;
      const response: Product = { id } as Product;

      service.updateProduct(id, request).subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpTestingController.expectOne(`${productsUrl}/product/${id}`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);

      req.flush(response);
    });
  });

  describe('deleteProduct', () => {
    it('should send a DELETE request', () => {
      const id = 'prod-1';

      service.deleteProduct(id).subscribe();

      const req = httpTestingController.expectOne(`${productsUrl}/product/${id}`);

      expect(req.request.method).toBe('DELETE');

      req.flush(null);
    });
  });
});