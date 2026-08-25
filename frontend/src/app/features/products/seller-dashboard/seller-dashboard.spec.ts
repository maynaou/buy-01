import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { SellerDashboard } from './seller-dashboard';
import { environment } from '../../../../environments/environment';
import { Product } from '../models/product';

const MY_PRODUCTS_URL = `${environment.apiUrl}/api/products/my-products`;
const PRODUCTS_URL = `${environment.apiUrl}/api/products/product`;
const IMAGE_URL = `${environment.apiUrl}/api/media/image`;

const PRODUCT: Product = {
  id: 'p1',
  name: 'Match ball',
  description: 'Size 5 training ball.',
  price: 24.99,
  quantity: 12,
  imagePaths: ['https://cdn.test/ball.jpg'],
};

/** `onFilesSelected` only reads `files` and clears `value`. */
function fileEvent(files: File[]): Event {
  return { target: { files, value: 'C:\\fakepath\\pick' } } as unknown as Event;
}

function image(name = 'one.png'): File {
  return new File(['x'], name, { type: 'image/png' });
}

function setup() {
  TestBed.configureTestingModule({
    imports: [SellerDashboard],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });

  const fixture = TestBed.createComponent(SellerDashboard);
  const httpTesting = TestBed.inject(HttpTestingController);
  return { fixture, component: fixture.componentInstance, httpTesting };
}

/** Fills the form with details that satisfy every backend constraint. */
function fillValid(component: SellerDashboard): void {
  component.productForm.setValue({
    name: 'Match ball',
    description: 'Size 5 training ball.',
    price: 24.99,
    quantity: 12,
  });
}

describe('SellerDashboard', () => {
  beforeEach(() => {
    // jsdom implements neither of these.
    let counter = 0;
    URL.createObjectURL = vi.fn(() => `blob:preview-${++counter}`);
    URL.revokeObjectURL = vi.fn();
  });

  it('should load only the caller’s products', async () => {
    const { fixture, component, httpTesting } = setup();

    const req = httpTesting.expectOne(MY_PRODUCTS_URL);
    expect(req.request.method).toBe('GET');
    req.flush([PRODUCT]);
    await fixture.whenStable();

    expect(component.products()).toEqual([PRODUCT]);
    expect(component.loading()).toBe(false);
    expect(component.loadError()).toBe('');
  });

  it('should report a failed load', async () => {
    const { fixture, component, httpTesting } = setup();

    httpTesting.expectOne(MY_PRODUCTS_URL).flush('boom', {
      status: 500,
      statusText: 'Server Error',
    });
    await fixture.whenStable();

    expect(component.loadError()).toContain('Unable to load your products');
  });

  it('should explain a 403 as a non-seller account', async () => {
    const { fixture, component, httpTesting } = setup();

    httpTesting.expectOne(MY_PRODUCTS_URL).flush('denied', {
      status: 403,
      statusText: 'Forbidden',
    });
    await fixture.whenStable();

    expect(component.loadError()).toContain('Only seller accounts');
  });

  describe('validation', () => {
    it('should require every field', () => {
      const { component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([]);

      component.startCreate();

      expect(component.productForm.invalid).toBe(true);
      expect(component.productForm.controls.name.hasError('required')).toBe(true);
      expect(component.productForm.controls.description.hasError('required')).toBe(true);
      expect(component.productForm.controls.price.hasError('required')).toBe(true);
      expect(component.productForm.controls.quantity.hasError('required')).toBe(true);
    });

    it('should reject a price of zero or below', () => {
      const { component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([]);

      const price = component.productForm.controls.price;

      price.setValue(0);
      expect(price.hasError('greaterThanZero')).toBe(true);

      price.setValue(-5);
      expect(price.hasError('greaterThanZero')).toBe(true);

      price.setValue(0.01);
      expect(price.valid).toBe(true);
    });

    it('should cap the price at the backend maximum', () => {
      const { component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([]);

      component.productForm.controls.price.setValue(1_000_000);
      expect(component.productForm.controls.price.hasError('max')).toBe(true);
    });

    it('should bound the name and description lengths', () => {
      const { component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([]);

      component.productForm.controls.name.setValue('a');
      expect(component.productForm.controls.name.hasError('minlength')).toBe(true);

      component.productForm.controls.description.setValue('short');
      expect(component.productForm.controls.description.hasError('minlength')).toBe(true);
    });

    it('should reject a negative or fractional quantity', () => {
      const { component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([]);

      const quantity = component.productForm.controls.quantity;

      quantity.setValue(-1);
      expect(quantity.hasError('min')).toBe(true);

      quantity.setValue(1.5);
      expect(quantity.hasError('wholeNumber')).toBe(true);

      quantity.setValue(0);
      expect(quantity.valid).toBe(true);
    });

    it('should not submit an invalid form', () => {
      const { component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([]);

      component.startCreate();
      component.onSubmit();

      // Nothing beyond the initial load was requested.
      httpTesting.verify();
      expect(component.productForm.controls.name.touched).toBe(true);
    });
  });

  describe('images', () => {
    it('should preview picked files and drop the ones removed', () => {
      const { component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([]);

      component.startCreate();
      component.onFilesSelected(fileEvent([image('one.png'), image('two.png')]));

      expect(component.pendingImages().length).toBe(2);
      expect(component.pendingImages()[0].previewUrl).toContain('blob:preview-');

      component.removeImage(0);

      expect(component.pendingImages().length).toBe(1);
      expect(component.pendingImages()[0].file.name).toBe('two.png');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
    });

    it('should refuse a file that is not an image', () => {
      const { component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([]);

      component.startCreate();
      component.onFilesSelected(
        fileEvent([new File(['x'], 'notes.txt', { type: 'text/plain' })]),
      );

      expect(component.pendingImages()).toEqual([]);
      expect(component.imageErrors()[0]).toContain('not an image');
    });

    it('should refuse a file over the multipart limit', () => {
      const { component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([]);

      const tooBig = new File([new Uint8Array(1024 * 1024 + 1)], 'big.png', {
        type: 'image/png',
      });

      component.startCreate();
      component.onFilesSelected(fileEvent([tooBig]));

      expect(component.pendingImages()).toEqual([]);
      expect(component.imageErrors()[0]).toContain('larger than');
    });
  });

  describe('create', () => {
    it('should POST the product and then its images', async () => {
      const { fixture, component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([]);

      component.startCreate();
      fillValid(component);
      component.onFilesSelected(fileEvent([image()]));
      component.onSubmit();

      const create = httpTesting.expectOne(PRODUCTS_URL);
      expect(create.request.method).toBe('POST');
      expect(create.request.body).toEqual({
        name: 'Match ball',
        description: 'Size 5 training ball.',
        price: 24.99,
        quantity: 12,
      });
      create.flush({ ...PRODUCT, imagePaths: [] });

      const upload = httpTesting.expectOne(IMAGE_URL);
      expect(upload.request.method).toBe('POST');
      expect((upload.request.body as FormData).get('productId')).toBe('p1');
      upload.flush([
        { imagePath: 'https://cdn.test/fresh.jpg', entityId: 'p1', mediaType: 'PRODUCT' },
      ]);
      await fixture.whenStable();

      // The returned paths are applied directly: the product's own imagePaths
      // are only filled in later, by the media events.
      expect(component.products()[0].imagePaths).toEqual(['https://cdn.test/fresh.jpg']);
      expect(component.formOpen()).toBe(false);
      expect(component.notice()).toContain('created');
    });

    it('should skip the upload when no image was picked', async () => {
      const { fixture, component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([]);

      component.startCreate();
      fillValid(component);
      component.onSubmit();

      httpTesting.expectOne(PRODUCTS_URL).flush({ ...PRODUCT, imagePaths: [] });
      await fixture.whenStable();

      httpTesting.verify();
      expect(component.products().length).toBe(1);
      expect(component.notice()).toBe('Product created.');
    });

    it('should keep the product when only the image upload fails', async () => {
      const { fixture, component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([]);

      component.startCreate();
      fillValid(component);
      component.onFilesSelected(fileEvent([image()]));
      component.onSubmit();

      httpTesting.expectOne(PRODUCTS_URL).flush({ ...PRODUCT, imagePaths: [] });
      // A 500 is not retried, unlike the ownership 403.
      httpTesting.expectOne(IMAGE_URL).flush('boom', { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();

      expect(component.products().length).toBe(1);
      expect(component.noticeError()).toContain('could not be uploaded');
    });
  });

  describe('edit', () => {
    it('should load the product into the form and PUT the changes', async () => {
      const { fixture, component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([PRODUCT]);
      await fixture.whenStable();

      component.startEdit(PRODUCT);

      expect(component.isEditing()).toBe(true);
      expect(component.editingImages()).toEqual(['https://cdn.test/ball.jpg']);
      expect(component.productForm.value.name).toBe('Match ball');

      component.productForm.controls.price.setValue(19.5);
      component.onSubmit();

      const update = httpTesting.expectOne(`${PRODUCTS_URL}/p1`);
      expect(update.request.method).toBe('PUT');
      expect(update.request.body.price).toBe(19.5);
      update.flush({ ...PRODUCT, price: 19.5 });
      await fixture.whenStable();

      expect(component.products()[0].price).toBe(19.5);
      expect(component.products().length).toBe(1);
      expect(component.notice()).toBe('Product updated.');
    });
  });

  describe('delete', () => {
    it('should confirm, then remove the product', async () => {
      const { fixture, component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([PRODUCT]);
      await fixture.whenStable();

      component.askDelete(PRODUCT);
      expect(component.deleteTarget()).toBe('p1');

      component.confirmDelete(PRODUCT);

      const req = httpTesting.expectOne(`${PRODUCTS_URL}/p1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      await fixture.whenStable();

      expect(component.products()).toEqual([]);
      expect(component.deleteTarget()).toBeNull();
      expect(component.notice()).toContain('deleted');
    });

    it('should keep the product when the delete is refused', async () => {
      const { fixture, component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([PRODUCT]);
      await fixture.whenStable();

      component.askDelete(PRODUCT);
      component.confirmDelete(PRODUCT);

      httpTesting.expectOne(`${PRODUCTS_URL}/p1`).flush('denied', {
        status: 403,
        statusText: 'Forbidden',
      });
      await fixture.whenStable();

      expect(component.products()).toEqual([PRODUCT]);
      expect(component.noticeError()).toContain('own products');
    });

    it('should cancel without a request', async () => {
      const { fixture, component, httpTesting } = setup();
      httpTesting.expectOne(MY_PRODUCTS_URL).flush([PRODUCT]);
      await fixture.whenStable();

      component.askDelete(PRODUCT);
      component.cancelDelete();

      httpTesting.verify();
      expect(component.deleteTarget()).toBeNull();
      expect(component.products()).toEqual([PRODUCT]);
    });
  });
});
