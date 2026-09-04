import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { Home } from './home';
import { ProductService } from '../../core/services/product';
import { AuthService } from '../../core/services/auth';
import { NotificationError } from '../../core/services/notification-error';
import { Product } from '../products/models/product';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  let productService: jasmine.SpyObj<ProductService>;
  let authService: jasmine.SpyObj<AuthService>;
  let notificationError: jasmine.SpyObj<NotificationError>;

  const products: Product[] = [
    {
      id: '1',
      name: 'Laptop',
      description: 'Gaming laptop',
      price: 1200,
      quantity: 5,
      imagePaths: [
        'https://example.com/laptop-1.jpg',
        'https://example.com/laptop-2.jpg',
      ],
    },
    {
      id: '2',
      name: 'Mouse',
      description: 'Wireless mouse',
      price: 50,
      quantity: 10,
      imagePaths: null,
    },
  ];

  beforeEach(async () => {
    productService = jasmine.createSpyObj<ProductService>(
      'ProductService',
      ['getProducts'],
    );

    authService = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['logout'],
    );

    notificationError = jasmine.createSpyObj<NotificationError>(
      'NotificationError',
      ['show'],
    );

    /*
     * Home calls loadProducts() inside the constructor.
     *
     * Therefore getProducts() must have a value before
     * TestBed.createComponent(Home).
     */
    productService.getProducts.and.returnValue(
      of(products),
    );

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        {
          provide: ProductService,
          useValue: productService,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: NotificationError,
          useValue: notificationError,
        },
      ],
    })
      .overrideComponent(Home, {
        set: {
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  // --------------------------------------------------
  // Component creation / initial state
  // --------------------------------------------------

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should load products when the component is created', () => {
    expect(productService.getProducts).toHaveBeenCalledTimes(1);
  });

  it('should store the loaded products', () => {
    expect(component.products()).toEqual(products);
  });

  it('should stop loading after products are loaded', () => {
    expect(component.loading()).toBeFalse();
  });

  it('should initialize errorMessage as empty', () => {
    expect(component.errorMessage()).toBe('');
  });

  it('should initialize selectedProduct as null', () => {
    expect(component.selectedProduct()).toBeNull();
  });

  // --------------------------------------------------
  // loadProducts - success
  // --------------------------------------------------

  it('should set loading to true while products are loading', () => {
    let emitProducts!: (products: Product[]) => void;

    productService.getProducts.and.returnValue(
      new Observable<Product[]>((subscriber) => {
        emitProducts = (value) => subscriber.next(value);
      }),
    );

    component.loadProducts();

    expect(component.loading()).toBeTrue();

    emitProducts(products);

    expect(component.loading()).toBeFalse();
  });

  it('should clear the previous error message when loading products', () => {
    component.errorMessage.set('Previous error');

    productService.getProducts.and.returnValue(of(products));

    component.loadProducts();

    expect(component.errorMessage()).toBe('');
  });

  it('should replace the products when loading succeeds', () => {
    const newProducts: Product[] = [
      {
        id: '3',
        name: 'Keyboard',
        description: 'Mechanical keyboard',
        price: 100,
        quantity: 7,
        imagePaths: ['keyboard.jpg'],
      },
    ];

    productService.getProducts.and.returnValue(of(newProducts));

    component.loadProducts();

    expect(component.products()).toEqual(newProducts);
  });

  // --------------------------------------------------
  // loadProducts - errors
  // --------------------------------------------------

  it('should stop loading when loading products fails', () => {
    productService.getProducts.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            statusText: 'Server Error',
          }),
      ),
    );

    /*
     * Ignore the getProducts() call made by the constructor.
     */
    productService.getProducts.calls.reset();

    component.loadProducts();

    expect(component.loading()).toBeFalse();
  });

  it('should set the generic error message for a non-authentication error', () => {
    productService.getProducts.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            statusText: 'Server Error',
          }),
      ),
    );

    productService.getProducts.calls.reset();

    component.loadProducts();

    expect(component.errorMessage()).toBe(
      'Unable to load products. Please try again.',
    );
  });

  it('should not logout for a non-authentication error', () => {
    productService.getProducts.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            statusText: 'Server Error',
          }),
      ),
    );

    productService.getProducts.calls.reset();

    component.loadProducts();

    expect(authService.logout).not.toHaveBeenCalled();
  });

  // --------------------------------------------------
  // 401 / 403 authentication errors
  // --------------------------------------------------

  it('should logout when a 401 error occurs', () => {
    productService.getProducts.and.returnValues(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              message: 'Unauthorized',
            },
          }),
      ),
      of(products),
    );

    productService.getProducts.calls.reset();

    component.loadProducts();

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('should logout when a 403 error occurs', () => {
    productService.getProducts.and.returnValues(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            statusText: 'Forbidden',
            error: {
              message: 'Forbidden',
            },
          }),
      ),
      of(products),
    );

    productService.getProducts.calls.reset();

    component.loadProducts();

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('should retry loading products after a 401 error', () => {
    productService.getProducts.and.returnValues(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              message: 'Unauthorized',
            },
          }),
      ),
      of(products),
    );

    productService.getProducts.calls.reset();

    component.loadProducts();

    expect(productService.getProducts).toHaveBeenCalledTimes(2);
  });

  it('should retry loading products after a 403 error', () => {
    productService.getProducts.and.returnValues(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            statusText: 'Forbidden',
            error: {
              message: 'Forbidden',
            },
          }),
      ),
      of(products),
    );

    productService.getProducts.calls.reset();

    component.loadProducts();

    expect(productService.getProducts).toHaveBeenCalledTimes(2);
  });

  it('should show the authentication error notification', () => {
    productService.getProducts.and.returnValues(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              message: 'Token expired',
            },
          }),
      ),
      of(products),
    );

    productService.getProducts.calls.reset();

    component.loadProducts();

    expect(notificationError.show).toHaveBeenCalledTimes(1);

    expect(notificationError.show).toHaveBeenCalledWith(
      'Token expired',
      'red',
    );
  });

  it('should not retry after the authentication error when retryOnAuthError is false', () => {
    productService.getProducts.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              message: 'Unauthorized',
            },
          }),
      ),
    );

    productService.getProducts.calls.reset();

    component.loadProducts(false);

    expect(productService.getProducts).toHaveBeenCalledTimes(1);
    expect(authService.logout).not.toHaveBeenCalled();

    expect(component.errorMessage()).toBe(
      'Unable to load products. Please try again.',
    );
  });

  // --------------------------------------------------
  // openGallery / closeGallery
  // --------------------------------------------------

  it('should select a product when opening the gallery', () => {
    const product = products[0];

    component.openGallery(product);

    expect(component.selectedProduct()).toEqual(product);
  });

  it('should replace the selected product when opening another gallery', () => {
    const firstProduct = products[0];
    const secondProduct = products[1];

    component.openGallery(firstProduct);
    component.openGallery(secondProduct);

    expect(component.selectedProduct()).toEqual(secondProduct);
  });

  it('should clear the selected product when closing the gallery', () => {
    component.openGallery(products[0]);

    component.closeGallery();

    expect(component.selectedProduct()).toBeNull();
  });

  // --------------------------------------------------
  // coverImage
  // --------------------------------------------------

  it('should return the first image as the cover image', () => {
    const product = products[0];

    expect(component.coverImage(product)).toBe(
      'https://example.com/laptop-1.jpg',
    );
  });

  it('should return null when the product has no images', () => {
    const product: Product = {
      id: '3',
      name: 'Keyboard',
      description: 'Mechanical keyboard',
      price: 100,
      quantity: 7,
      imagePaths: null,
    };

    expect(component.coverImage(product)).toBeNull();
  });

  it('should return null when imagePaths is an empty array', () => {
    const product: Product = {
      id: '4',
      name: 'Monitor',
      description: '4K monitor',
      price: 500,
      quantity: 3,
      imagePaths: [],
    };

    expect(component.coverImage(product)).toBeNull();
  });

  // --------------------------------------------------
  // imageCount
  // --------------------------------------------------

  it('should return the number of product images', () => {
    const product = products[0];

    expect(component.imageCount(product)).toBe(2);
  });

  it('should return 0 when the product has no images', () => {
    const product = products[1];

    expect(component.imageCount(product)).toBe(0);
  });

  it('should return 0 when imagePaths is an empty array', () => {
    const product: Product = {
      id: '4',
      name: 'Monitor',
      description: '4K monitor',
      price: 500,
      quantity: 3,
      imagePaths: [],
    };

    expect(component.imageCount(product)).toBe(0);
  });
});
