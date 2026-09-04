import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SellerDashboard } from './seller-dashboard';
import { ProductService } from '../../../core/services/product';
import { MediaService } from '../../../core/services/media';
import { NotificationError } from '../../../core/services/notification-error';
import { Product } from '../models/product';
import { ProductImage } from '../models/product-image';

describe('SellerDashboard', () => {
  let component: SellerDashboard;
  let fixture: ComponentFixture<SellerDashboard>;

  let productService: jasmine.SpyObj<ProductService>;
  let mediaService: jasmine.SpyObj<MediaService>;
  let router: jasmine.SpyObj<Router>;
  let notificationError: jasmine.SpyObj<NotificationError>;

  const product: Product = {
    id: 'product-1',
    name: 'Test Product',
    description: 'This is a valid test product.',
    price: 100,
    quantity: 10,
    imagePaths: ['image-1.jpg', 'image-2.jpg'],
  };

  const productWithoutImages: Product = {
    id: 'product-2',
    name: 'Product Without Images',
    description: 'This is another valid product.',
    price: 200,
    quantity: 5,
    imagePaths: null,
  };

  const uploadedImages: ProductImage[] = [
    {
      imagePath: 'uploaded-image-1.jpg',
      entityId: 'product-1',
      mediaType: 'image/jpeg',
    },
    {
      imagePath: 'uploaded-image-2.jpg',
      entityId: 'product-1',
      mediaType: 'image/jpeg',
    },
  ];

  beforeEach(async () => {
    productService = jasmine.createSpyObj<ProductService>(
      'ProductService',
      [
        'getMyProducts',
        'createProduct',
        'updateProduct',
        'deleteProduct',
      ],
    );

    mediaService = jasmine.createSpyObj<MediaService>(
      'MediaService',
      ['uploadProductImages'],
    );

    router = jasmine.createSpyObj<Router>(
      'Router',
      ['navigate'],
    );

    notificationError = jasmine.createSpyObj<NotificationError>(
      'NotificationError',
      ['show'],
    );

    /*
     * SellerDashboard calls loadProducts() in its constructor.
     * Therefore getMyProducts() must have a default return value
     * before the component is created.
     */
    productService.getMyProducts.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [SellerDashboard],
      providers: [
        {
          provide: ProductService,
          useValue: productService,
        },
        {
          provide: MediaService,
          useValue: mediaService,
        },
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: NotificationError,
          useValue: notificationError,
        },
      ],
    })
      .overrideComponent(SellerDashboard, {
        set: {
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SellerDashboard);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  // =========================================================
  // Creation
  // =========================================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with the correct default values', () => {
    expect(component.products()).toEqual([]);
    expect(component.loading()).toBeFalse();
    expect(component.loadError()).toBe('');

    expect(component.formOpen()).toBeFalse();
    expect(component.editingId()).toBeNull();
    expect(component.saving()).toBeFalse();

    expect(component.editingImages()).toEqual([]);
    expect(component.pendingImages()).toEqual([]);
    expect(component.imageErrors()).toEqual([]);

    expect(component.deleteTarget()).toBeNull();
    expect(component.deleting()).toBeNull();

    expect(component.isEditing()).toBeFalse();
  });

  it('should have a maximum image size of 1024 KB', () => {
    expect(component.maxImageKb).toBe(1024);
  });

  // =========================================================
  // loadProducts
  // =========================================================

  it('should load products successfully', () => {
    const products = [product, productWithoutImages];

    productService.getMyProducts.and.returnValue(of(products));

    component.loadProducts();

    expect(productService.getMyProducts).toHaveBeenCalled();
    expect(component.products()).toEqual(products);
    expect(component.loading()).toBeFalse();
    expect(component.loadError()).toBe('');
  });

  it('should redirect to login when loading products returns 401', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: {
        message: 'Unauthorized',
      },
    });

    productService.getMyProducts.and.returnValue(
      throwError(() => error),
    );

    component.loadProducts();

    expect(component.loading()).toBeFalse();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);

    expect(notificationError.show).toHaveBeenCalledWith(
      'Unauthorized',
      'red',
    );
  });

  it('should show seller error when loading products returns 403', () => {
    const error = new HttpErrorResponse({
      status: 403,
    });

    productService.getMyProducts.and.returnValue(
      throwError(() => error),
    );

    component.loadProducts();

    expect(component.loading()).toBeFalse();

    expect(component.loadError()).toBe(
      'Only seller accounts can manage products.',
    );

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show generic error for other loading errors', () => {
    const error = new HttpErrorResponse({
      status: 500,
    });

    productService.getMyProducts.and.returnValue(
      throwError(() => error),
    );

    component.loadProducts();

    expect(component.loading()).toBeFalse();

    expect(component.loadError()).toBe(
      'Unable to load your products. Please try again.',
    );
  });

  // =========================================================
  // startCreate
  // =========================================================

  it('should open the form in create mode', () => {
    component.editingId.set('product-1');
    component.editingImages.set(['old-image.jpg']);

    component.startCreate();

    expect(component.formOpen()).toBeTrue();
    expect(component.editingId()).toBeNull();
    expect(component.editingImages()).toEqual([]);
  });

  it('should reset the form when starting create mode', () => {
    component.productForm.setValue({
      name: 'Old name',
      description: 'Old description',
      price: 100,
      quantity: 5,
    });

    component.startCreate();

    expect(component.productForm.value).toEqual({
      name: '',
      description: '',
      price: null,
      quantity: null,
    });
  });

  // =========================================================
  // startEdit
  // =========================================================

  it('should open the form in edit mode', () => {
    spyOn(window, 'scrollTo');

    component.startEdit(product);

    expect(component.formOpen()).toBeTrue();
    expect(component.editingId()).toBe(product.id);
    expect(component.isEditing()).toBeTrue();

    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('should load product data into the form when editing', () => {
    spyOn(window, 'scrollTo');

    component.startEdit(product);

    expect(component.productForm.value).toEqual({
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
    });
  });

  it('should copy product images when editing', () => {
    spyOn(window, 'scrollTo');

    component.startEdit(product);

    expect(component.editingImages()).toEqual([
      'image-1.jpg',
      'image-2.jpg',
    ]);
  });

  it('should use an empty image array for a product without images', () => {
    spyOn(window, 'scrollTo');

    component.startEdit(productWithoutImages);

    expect(component.editingImages()).toEqual([]);
    expect(component.editingId()).toBe(productWithoutImages.id);
  });

  // =========================================================
  // closeForm
  // =========================================================

  it('should close the form', () => {
    component.startCreate();

    component.closeForm();

    expect(component.formOpen()).toBeFalse();
  });

  it('should reset editing state when closing the form', () => {
    component.startEdit(product);

    component.closeForm();

    expect(component.editingId()).toBeNull();
    expect(component.editingImages()).toEqual([]);
    expect(component.pendingImages()).toEqual([]);
    expect(component.imageErrors()).toEqual([]);
  });

  // =========================================================
  // Form validation
  // =========================================================

  it('should not submit an empty form', () => {
    component.startCreate();

    component.onSubmit();

    expect(productService.createProduct).not.toHaveBeenCalled();
    expect(component.saving()).toBeFalse();
  });

  it('should reject a name shorter than 2 characters', () => {
    component.startCreate();

    component.productForm.setValue({
      name: 'A',
      description: 'This is a valid description.',
      price: 100,
      quantity: 10,
    });

    expect(
      component.productForm.controls.name.hasError('minlength'),
    ).toBeTrue();

    component.onSubmit();

    expect(productService.createProduct).not.toHaveBeenCalled();
  });

  it('should reject a description shorter than 10 characters', () => {
    component.startCreate();

    component.productForm.setValue({
      name: 'Valid Name',
      description: 'Short',
      price: 100,
      quantity: 10,
    });

    expect(
      component.productForm.controls.description.hasError('minlength'),
    ).toBeTrue();

    component.onSubmit();

    expect(productService.createProduct).not.toHaveBeenCalled();
  });

  it('should reject a price of zero', () => {
    component.startCreate();

    component.productForm.setValue({
      name: 'Valid Name',
      description: 'This is a valid description.',
      price: 0,
      quantity: 10,
    });

    expect(
      component.productForm.controls.price.hasError('greaterThanZero'),
    ).toBeTrue();

    component.onSubmit();

    expect(productService.createProduct).not.toHaveBeenCalled();
  });

  it('should reject a negative price', () => {
    component.startCreate();

    component.productForm.setValue({
      name: 'Valid Name',
      description: 'This is a valid description.',
      price: -10,
      quantity: 10,
    });

    expect(
      component.productForm.controls.price.hasError('greaterThanZero'),
    ).toBeTrue();

    component.onSubmit();

    expect(productService.createProduct).not.toHaveBeenCalled();
  });

  it('should reject a fractional quantity', () => {
    component.startCreate();

    component.productForm.setValue({
      name: 'Valid Name',
      description: 'This is a valid description.',
      price: 100,
      quantity: 2.5,
    });

    expect(
      component.productForm.controls.quantity.hasError('wholeNumber'),
    ).toBeTrue();

    component.onSubmit();

    expect(productService.createProduct).not.toHaveBeenCalled();
  });

  it('should allow quantity equal to zero', () => {
    component.startCreate();

    component.productForm.setValue({
      name: 'Valid Name',
      description: 'This is a valid description.',
      price: 100,
      quantity: 0,
    });

    expect(component.productForm.valid).toBeTrue();
  });

  // =========================================================
  // Create product
  // =========================================================

  it('should create a product with trimmed values', () => {
    const createdProduct: Product = {
      ...product,
      id: 'created-product',
      name: 'Created Product',
    };

    productService.createProduct.and.returnValue(
      of(createdProduct),
    );

    component.startCreate();

    component.productForm.setValue({
      name: '  Created Product  ',
      description: '  This is a valid product.  ',
      price: 300,
      quantity: 20,
    });

    component.onSubmit();

    expect(productService.createProduct).toHaveBeenCalledWith({
      name: 'Created Product',
      description: 'This is a valid product.',
      price: 300,
      quantity: 20,
    });
  });

  it('should add the created product to the beginning of the products list', () => {
    const existingProduct: Product = {
      ...product,
      id: 'existing-product',
    };

    const createdProduct: Product = {
      ...product,
      id: 'created-product',
      name: 'Created Product',
    };

    component.products.set([existingProduct]);

    productService.createProduct.and.returnValue(
      of(createdProduct),
    );

    component.startCreate();

    component.productForm.setValue({
      name: 'Created Product',
      description: 'This is a valid product.',
      price: 300,
      quantity: 20,
    });

    component.onSubmit();

    expect(component.products()).toEqual([
      createdProduct,
      existingProduct,
    ]);
  });

  it('should finish saving after creating a product without images', () => {
    const createdProduct: Product = {
      ...product,
      id: 'created-product',
    };

    productService.createProduct.and.returnValue(
      of(createdProduct),
    );

    component.startCreate();

    component.productForm.setValue({
      name: 'Created Product',
      description: 'This is a valid product.',
      price: 300,
      quantity: 20,
    });

    component.onSubmit();

    expect(component.saving()).toBeFalse();
    expect(component.formOpen()).toBeFalse();

    expect(notificationError.show).toHaveBeenCalledWith(
      'Product created.',
      'green',
    );

    expect(mediaService.uploadProductImages).not.toHaveBeenCalled();
  });

  // =========================================================
  // Update product
  // =========================================================

  it('should update an existing product', () => {
    const updatedProduct: Product = {
      ...product,
      name: 'Updated Product',
      price: 500,
    };

    component.products.set([product]);

    productService.updateProduct.and.returnValue(
      of(updatedProduct),
    );

    spyOn(window, 'scrollTo');

    component.startEdit(product);

    component.productForm.setValue({
      name: 'Updated Product',
      description: product.description,
      price: 500,
      quantity: product.quantity,
    });

    component.onSubmit();

    expect(productService.updateProduct).toHaveBeenCalledWith(
      product.id,
      {
        name: 'Updated Product',
        description: product.description,
        price: 500,
        quantity: product.quantity,
      },
    );

    expect(component.products()).toEqual([
      updatedProduct,
    ]);

    expect(component.saving()).toBeFalse();
    expect(component.formOpen()).toBeFalse();

    expect(notificationError.show).toHaveBeenCalledWith(
      'Product updated.',
      'green',
    );
  });

  it('should not submit when already saving', () => {
    component.startCreate();

    component.productForm.setValue({
      name: 'Valid Product',
      description: 'This is a valid product.',
      price: 100,
      quantity: 10,
    });

    component.saving.set(true);

    component.onSubmit();

    expect(productService.createProduct).not.toHaveBeenCalled();
  });

  // =========================================================
  // Save errors
  // =========================================================

  it('should handle a 403 error when saving a product', () => {
    const error = new HttpErrorResponse({
      status: 403,
    });

    productService.createProduct.and.returnValue(
      throwError(() => error),
    );

    component.startCreate();

    component.productForm.setValue({
      name: 'Valid Product',
      description: 'This is a valid product.',
      price: 100,
      quantity: 10,
    });

    component.onSubmit();

    expect(component.saving()).toBeFalse();

    expect(notificationError.show).toHaveBeenCalledWith(
      'You are not allowed to save this product.',
      'red',
    );
  });

  it('should handle a 400 error when saving a product', () => {
    const error = new HttpErrorResponse({
      status: 400,
    });

    productService.createProduct.and.returnValue(
      throwError(() => error),
    );

    component.startCreate();

    component.productForm.setValue({
      name: 'Valid Product',
      description: 'This is a valid product.',
      price: 100,
      quantity: 10,
    });

    component.onSubmit();

    expect(notificationError.show).toHaveBeenCalledWith(
      'The server rejected these details. Please review the fields.',
      'red',
    );
  });

  it('should handle a generic error when saving a product', () => {
    const error = new HttpErrorResponse({
      status: 500,
    });

    productService.createProduct.and.returnValue(
      throwError(() => error),
    );

    component.startCreate();

    component.productForm.setValue({
      name: 'Valid Product',
      description: 'This is a valid product.',
      price: 100,
      quantity: 10,
    });

    component.onSubmit();

    expect(notificationError.show).toHaveBeenCalledWith(
      'Could not save the product. Please try again.',
      'red',
    );
  });

  // =========================================================
  // Image selection
  // =========================================================

  it('should accept a valid image', () => {
    const file = new File(
      ['image'],
      'photo.jpg',
      { type: 'image/jpeg' },
    );

    spyOn(URL, 'createObjectURL').and.returnValue(
      'blob:photo',
    );

    const input = document.createElement('input');

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    const event = {
      target: input,
    } as unknown as Event;

    component.onFilesSelected(event);

    expect(component.pendingImages().length).toBe(1);
    expect(component.pendingImages()[0].file).toBe(file);
    expect(component.pendingImages()[0].previewUrl).toBe(
      'blob:photo',
    );

    expect(component.imageErrors()).toEqual([]);
  });

  it('should reject a non-image file', () => {
    const file = new File(
      ['text'],
      'document.txt',
      { type: 'text/plain' },
    );

    const input = document.createElement('input');

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    const event = {
      target: input,
    } as unknown as Event;

    component.onFilesSelected(event);

    expect(component.pendingImages()).toEqual([]);

    expect(component.imageErrors()).toEqual([
      'document.txt is not an image.',
    ]);
  });

  it('should reject an image larger than 1024 KB', () => {
    const file = new File(
      ['image'],
      'large.jpg',
      { type: 'image/jpeg' },
    );

    Object.defineProperty(file, 'size', {
      value: 1024 * 1024 + 1,
    });

    const input = document.createElement('input');

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    const event = {
      target: input,
    } as unknown as Event;

    component.onFilesSelected(event);

    expect(component.pendingImages()).toEqual([]);

    expect(component.imageErrors()).toEqual([
      'large.jpg is larger than 1024 KB.',
    ]);
  });

  it('should accept valid images and reject invalid files together', () => {
    const validFile = new File(
      ['image'],
      'valid.jpg',
      { type: 'image/jpeg' },
    );

    const invalidFile = new File(
      ['text'],
      'invalid.txt',
      { type: 'text/plain' },
    );

    spyOn(URL, 'createObjectURL').and.returnValue(
      'blob:valid',
    );

    const input = document.createElement('input');

    Object.defineProperty(input, 'files', {
      value: [validFile, invalidFile],
    });

    const event = {
      target: input,
    } as unknown as Event;

    component.onFilesSelected(event);

    expect(component.pendingImages().length).toBe(1);
    expect(component.pendingImages()[0].file).toBe(validFile);

    expect(component.imageErrors()).toEqual([
      'invalid.txt is not an image.',
    ]);
  });

  // =========================================================
  // removeImage
  // =========================================================

  it('should remove a pending image', () => {
    const revokeSpy = spyOn(URL, 'revokeObjectURL');

    const file1 = new File(
      ['a'],
      'a.jpg',
      { type: 'image/jpeg' },
    );

    const file2 = new File(
      ['b'],
      'b.jpg',
      { type: 'image/jpeg' },
    );

    component.pendingImages.set([
      {
        file: file1,
        previewUrl: 'blob:a',
      },
      {
        file: file2,
        previewUrl: 'blob:b',
      },
    ]);

    component.removeImage(0);

    expect(component.pendingImages().length).toBe(1);
    expect(component.pendingImages()[0].file).toBe(file2);

    expect(revokeSpy).toHaveBeenCalledWith('blob:a');
  });

  it('should not remove anything for an invalid image index', () => {
    const revokeSpy = spyOn(URL, 'revokeObjectURL');

    const file = new File(
      ['a'],
      'a.jpg',
      { type: 'image/jpeg' },
    );

    component.pendingImages.set([
      {
        file,
        previewUrl: 'blob:a',
      },
    ]);

    component.removeImage(99);

    expect(component.pendingImages().length).toBe(1);
    expect(revokeSpy).not.toHaveBeenCalled();
  });

  // =========================================================
  // Delete
  // =========================================================

  it('should set the product as the delete target', () => {
    component.askDelete(product);

    expect(component.deleteTarget()).toBe(product.id);
  });

  it('should cancel deletion', () => {
    component.askDelete(product);

    component.cancelDelete();

    expect(component.deleteTarget()).toBeNull();
  });

  it('should delete a product successfully', () => {
    component.products.set([
      product,
      productWithoutImages,
    ]);

    productService.deleteProduct.and.returnValue(
      of(void 0),
    );

    component.confirmDelete(product);

    expect(productService.deleteProduct).toHaveBeenCalledWith(
      product.id,
    );

    expect(component.products()).toEqual([
      productWithoutImages,
    ]);

    expect(component.deleting()).toBeNull();
    expect(component.deleteTarget()).toBeNull();

    /*
     * NotificationError.show() has a default color,
     * so SellerDashboard calls it with only one argument here.
     */
    expect(notificationError.show).toHaveBeenCalledWith(
      '“Test Product” was deleted.',
      'green',
    );
  });

  it('should not delete a product when another deletion is in progress', () => {
    component.deleting.set('another-product');

    component.confirmDelete(product);

    expect(productService.deleteProduct).not.toHaveBeenCalled();
  });

  it('should handle a 403 delete error', () => {
    const error = new HttpErrorResponse({
      status: 403,
    });

    productService.deleteProduct.and.returnValue(
      throwError(() => error),
    );

    component.confirmDelete(product);

    expect(component.deleting()).toBeNull();
    expect(component.deleteTarget()).toBeNull();

    expect(notificationError.show).toHaveBeenCalledWith(
      'You can only delete your own products.',
      'red',
    );
  });

  it('should handle a generic delete error', () => {
    const error = new HttpErrorResponse({
      status: 500,
    });

    productService.deleteProduct.and.returnValue(
      throwError(() => error),
    );

    component.confirmDelete(product);

    expect(component.deleting()).toBeNull();
    expect(component.deleteTarget()).toBeNull();

    expect(notificationError.show).toHaveBeenCalledWith(
      'Could not delete the product. Please try again.',
      'red',
    );
  });

  // =========================================================
  // Helper methods
  // =========================================================

  it('should return the first image as the cover image', () => {
    expect(component.coverImage(product)).toBe(
      'image-1.jpg',
    );
  });

  it('should return null when the product has no images', () => {
    expect(component.coverImage(productWithoutImages)).toBeNull();
  });

  it('should return the number of product images', () => {
    expect(component.imageCount(product)).toBe(2);
  });

  it('should return zero when the product has no images', () => {
    expect(component.imageCount(productWithoutImages)).toBe(0);
  });

  // =========================================================
  // Image upload
  // =========================================================

  it('should upload pending images after creating a product', () => {
    const createdProduct: Product = {
      ...product,
      id: 'created-product',
      name: 'Created Product',
      imagePaths: null,
    };

    const file = new File(
      ['image'],
      'photo.jpg',
      { type: 'image/jpeg' },
    );

    productService.createProduct.and.returnValue(
      of(createdProduct),
    );

    mediaService.uploadProductImages.and.returnValue(
      of(uploadedImages),
    );

    spyOn(URL, 'revokeObjectURL');

    component.startCreate();

    component.pendingImages.set([
      {
        file,
        previewUrl: 'blob:photo',
      },
    ]);

    component.productForm.setValue({
      name: 'Created Product',
      description: 'This is a valid product.',
      price: 300,
      quantity: 20,
    });

    component.onSubmit();

    expect(mediaService.uploadProductImages).toHaveBeenCalledWith(
      createdProduct.id,
      [file],
    );

    expect(component.products()).toEqual([
      {
        ...createdProduct,
        imagePaths: [
          'uploaded-image-1.jpg',
          'uploaded-image-2.jpg',
        ],
      },
    ]);

    expect(component.saving()).toBeFalse();
    expect(component.formOpen()).toBeFalse();

    expect(notificationError.show).toHaveBeenCalledWith(
      'Product created and images uploaded.',
      'green',
    );
  });

  it('should replace images after updating a product', () => {
    const updatedProduct: Product = {
      ...product,
      name: 'Updated Product',
    };

    const file = new File(
      ['image'],
      'new-photo.jpg',
      { type: 'image/jpeg' },
    );

    component.products.set([product]);

    productService.updateProduct.and.returnValue(
      of(updatedProduct),
    );

    mediaService.uploadProductImages.and.returnValue(
      of(uploadedImages),
    );

    spyOn(window, 'scrollTo');

    component.startEdit(product);

    component.pendingImages.set([
      {
        file,
        previewUrl: 'blob:new-photo',
      },
    ]);

    component.productForm.setValue({
      name: 'Updated Product',
      description: product.description,
      price: product.price,
      quantity: product.quantity,
    });

    component.onSubmit();

    expect(mediaService.uploadProductImages).toHaveBeenCalledWith(
      product.id,
      [file],
    );

    expect(component.products()).toEqual([
      {
        ...updatedProduct,
        imagePaths: [
          'uploaded-image-1.jpg',
          'uploaded-image-2.jpg',
        ],
      },
    ]);

    expect(component.saving()).toBeFalse();
    expect(component.formOpen()).toBeFalse();

    expect(notificationError.show).toHaveBeenCalledWith(
      'Product updated and images replaced.',
      'green',
    );
  });

  it('should keep the product saved when image upload fails', () => {
    const createdProduct: Product = {
      ...product,
      id: 'created-product',
      name: 'Created Product',
    };

    const file = new File(
      ['image'],
      'photo.jpg',
      { type: 'image/jpeg' },
    );

    const error = new HttpErrorResponse({
      status: 500,
    });

    productService.createProduct.and.returnValue(
      of(createdProduct),
    );

    mediaService.uploadProductImages.and.returnValue(
      throwError(() => error),
    );

    component.startCreate();

    component.pendingImages.set([
      {
        file,
        previewUrl: 'blob:photo',
      },
    ]);

    component.productForm.setValue({
      name: 'Created Product',
      description: 'This is a valid product.',
      price: 300,
      quantity: 20,
    });

    component.onSubmit();

    expect(component.products()).toEqual([
      createdProduct,
    ]);

    expect(component.saving()).toBeFalse();
    expect(component.formOpen()).toBeFalse();

    expect(notificationError.show).toHaveBeenCalledWith(
      '“Created Product” was saved, but its images could not be uploaded. Open Edit to try again.',
      'red',
    );
  });
});
