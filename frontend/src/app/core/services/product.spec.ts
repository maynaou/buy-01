import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ProductService } from './product';
import { environment } from '../../../environments/environment';

describe('ProductService', () => {
  let service: ProductService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProductService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request every product', () => {
    service.getProducts().subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/products/product`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should request only the caller’s products', () => {
    service.getMyProducts().subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/products/my-products`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should POST a new product', () => {
    const request = { name: 'Ball', description: 'A round ball.', price: 9.99, quantity: 3 };
    service.createProduct(request).subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/products/product`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ id: 'p1', ...request, imagePaths: [] });
  });

  it('should PUT an updated product', () => {
    const request = { name: 'Ball', description: 'A round ball.', price: 12.5, quantity: 1 };
    service.updateProduct('p1', request).subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/products/product/p1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ id: 'p1', ...request, imagePaths: [] });
  });

  it('should DELETE a product by id', () => {
    service.deleteProduct('p1').subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/products/product/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
