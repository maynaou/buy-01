import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Home } from './home';
import { authInterceptor } from '../../core/interceptors/auth-interceptor';
import { environment } from '../../../environments/environment';
import { Product } from '../products/models/product';

const PRODUCTS_URL = `${environment.apiUrl}/api/products/product`;

const PRODUCT: Product = {
  name: 'Match ball',
  description: 'Size 5 training ball.',
  price: 24.99,
  quantity: 12,
  imagePaths: ['https://res.cloudinary.com/demo/image/upload/ball.jpg'],
};

function configure() {
  return TestBed.configureTestingModule({
    imports: [Home],
    providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
  }).compileComponents();
}

describe('Home (anonymous)', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await configure();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Home);
    httpTesting.expectOne(PRODUCTS_URL).flush([]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load products without a token', async () => {
    const fixture = TestBed.createComponent(Home);

    const req = httpTesting.expectOne(PRODUCTS_URL);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([PRODUCT]);
    await fixture.whenStable();

    expect(fixture.componentInstance.products()).toEqual([PRODUCT]);
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.errorMessage()).toBe('');
  });

  it('should report a failed load', async () => {
    const fixture = TestBed.createComponent(Home);

    httpTesting.expectOne(PRODUCTS_URL).flush('boom', {
      status: 500,
      statusText: 'Server Error',
    });
    await fixture.whenStable();

    expect(fixture.componentInstance.errorMessage()).toContain('Unable to load products');
    expect(fixture.componentInstance.loading()).toBe(false);
  });
});

describe('Home gallery', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await configure();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should open the gallery on card click and close it again', async () => {
    const fixture = TestBed.createComponent(Home);
    httpTesting.expectOne(PRODUCTS_URL).flush([PRODUCT]);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-product-gallery')).toBeNull();

    element.querySelector<HTMLButtonElement>('.product-card__open')?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.selectedProduct()).toEqual(PRODUCT);
    expect(element.querySelector('.gallery__dialog')).toBeTruthy();

    element.querySelector<HTMLButtonElement>('.gallery__close')?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.selectedProduct()).toBeNull();
    expect(element.querySelector('app-product-gallery')).toBeNull();
  });

  it('should badge a product that has several images', async () => {
    const fixture = TestBed.createComponent(Home);
    httpTesting
      .expectOne(PRODUCTS_URL)
      .flush([
        { ...PRODUCT, imagePaths: ['https://cdn.test/a.jpg', 'https://cdn.test/b.jpg'] },
        PRODUCT,
      ]);
    await fixture.whenStable();

    const badges = (fixture.nativeElement as HTMLElement).querySelectorAll('.product-card__badge');
    expect(badges.length).toBe(1);
    expect(badges[0].textContent).toContain('2');
  });
});

describe('Home (signed in)', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem('access_token', 'fake.jwt.token');
    await configure();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should send the bearer token', async () => {
    const fixture = TestBed.createComponent(Home);

    const req = httpTesting.expectOne(PRODUCTS_URL);
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake.jwt.token');
    req.flush([PRODUCT]);
    await fixture.whenStable();

    expect(fixture.componentInstance.products()).toEqual([PRODUCT]);
  });

  it('should drop a rejected token and still show products', async () => {
    const fixture = TestBed.createComponent(Home);

    httpTesting.expectOne(PRODUCTS_URL).flush('Unauthorized', {
      status: 401,
      statusText: 'Unauthorized',
    });
    await fixture.whenStable();

    // Retried anonymously after clearing the stale token.
    const retry = httpTesting.expectOne(PRODUCTS_URL);
    expect(retry.request.headers.has('Authorization')).toBe(false);
    retry.flush([PRODUCT]);
    await fixture.whenStable();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(fixture.componentInstance.products()).toEqual([PRODUCT]);
    expect(fixture.componentInstance.errorMessage()).toBe('');
  });
});
