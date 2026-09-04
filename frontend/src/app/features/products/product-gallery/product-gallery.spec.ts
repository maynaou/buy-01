import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductGallery } from './product-gallery';
import { Product } from '../models/product';

describe('ProductGallery', () => {
  let component: ProductGallery;
  let fixture: ComponentFixture<ProductGallery>;

  const productWithImages: Product = {
    id: '1',
    name: 'Test Product',
    description: 'Test description',
    price: 99.99,
    quantity: 10,
    imagePaths: [
      'image-1.jpg',
      'image-2.jpg',
      'image-3.jpg',
    ],
  };

  const productWithoutImages: Product = {
    id: '2',
    name: 'Product Without Images',
    description: 'Test description',
    price: 49.99,
    quantity: 5,
    imagePaths: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductGallery],
    })
      .overrideComponent(ProductGallery, {
        set: {
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProductGallery);
    component = fixture.componentInstance;
  });

  // --------------------------------------------------
  // Creation
  // --------------------------------------------------

  it('should be created', () => {
    fixture.componentRef.setInput('product', productWithImages);
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  // --------------------------------------------------
  // product input
  // --------------------------------------------------

  describe('product', () => {
    it('should accept a product as input', () => {
      fixture.componentRef.setInput('product', productWithImages);
      fixture.detectChanges();

      expect(component.product()).toEqual(productWithImages);
    });

    it('should reset currentIndex when the product changes', () => {
      fixture.componentRef.setInput('product', productWithImages);
      fixture.detectChanges();

      component.select(2);

      expect(component.currentIndex()).toBe(2);

      const anotherProduct: Product = {
        id: '2',
        name: 'Another Product',
        description: 'Another description',
        price: 50,
        quantity: 3,
        imagePaths: [
          'another-1.jpg',
          'another-2.jpg',
        ],
      };

      fixture.componentRef.setInput('product', anotherProduct);
      fixture.detectChanges();

      expect(component.currentIndex()).toBe(0);
    });
  });

  // --------------------------------------------------
  // images
  // --------------------------------------------------

  describe('images', () => {
    it('should return the product image paths', () => {
      fixture.componentRef.setInput('product', productWithImages);
      fixture.detectChanges();

      expect(component.images()).toEqual([
        'image-1.jpg',
        'image-2.jpg',
        'image-3.jpg',
      ]);
    });

    it('should return an empty array when imagePaths is null', () => {
      fixture.componentRef.setInput('product', productWithoutImages);
      fixture.detectChanges();

      expect(component.images()).toEqual([]);
    });
  });

  // --------------------------------------------------
  // currentImage
  // --------------------------------------------------

  describe('currentImage', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('product', productWithImages);
      fixture.detectChanges();
    });

    it('should return the first image initially', () => {
      expect(component.currentImage()).toBe('image-1.jpg');
    });

    it('should return the selected image', () => {
      component.select(1);

      expect(component.currentImage()).toBe('image-2.jpg');
    });

    it('should return null when there are no images', () => {
      fixture.componentRef.setInput('product', productWithoutImages);
      fixture.detectChanges();

      expect(component.currentImage()).toBeNull();
    });
  });

  // --------------------------------------------------
  // hasMultiple
  // --------------------------------------------------

  describe('hasMultiple', () => {
    it('should be true when the product has multiple images', () => {
      fixture.componentRef.setInput('product', productWithImages);
      fixture.detectChanges();

      expect(component.hasMultiple()).toBeTrue();
    });

    it('should be false when the product has one image', () => {
      const product: Product = {
        ...productWithImages,
        imagePaths: ['only-image.jpg'],
      };

      fixture.componentRef.setInput('product', product);
      fixture.detectChanges();

      expect(component.hasMultiple()).toBeFalse();
    });

    it('should be false when the product has no images', () => {
      fixture.componentRef.setInput('product', productWithoutImages);
      fixture.detectChanges();

      expect(component.hasMultiple()).toBeFalse();
    });
  });

  // --------------------------------------------------
  // select()
  // --------------------------------------------------

  describe('select', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('product', productWithImages);
      fixture.detectChanges();
    });

    it('should select the requested image', () => {
      component.select(1);

      expect(component.currentIndex()).toBe(1);
      expect(component.currentImage()).toBe('image-2.jpg');
    });

    it('should select the last image', () => {
      component.select(2);

      expect(component.currentIndex()).toBe(2);
      expect(component.currentImage()).toBe('image-3.jpg');
    });
  });

  // --------------------------------------------------
  // next()
  // --------------------------------------------------

  describe('next', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('product', productWithImages);
      fixture.detectChanges();
    });

    it('should move to the next image', () => {
      component.next();

      expect(component.currentIndex()).toBe(1);
      expect(component.currentImage()).toBe('image-2.jpg');
    });

    it('should move through the images in order', () => {
      component.next();
      component.next();

      expect(component.currentIndex()).toBe(2);
      expect(component.currentImage()).toBe('image-3.jpg');
    });

    it('should wrap around to the first image after the last image', () => {
      component.select(2);

      component.next();

      expect(component.currentIndex()).toBe(0);
      expect(component.currentImage()).toBe('image-1.jpg');
    });

    it('should do nothing when there is only one image', () => {
      const product: Product = {
        ...productWithImages,
        imagePaths: ['only-image.jpg'],
      };

      fixture.componentRef.setInput('product', product);
      fixture.detectChanges();

      component.next();

      expect(component.currentIndex()).toBe(0);
      expect(component.currentImage()).toBe('only-image.jpg');
    });

    it('should do nothing when there are no images', () => {
      fixture.componentRef.setInput('product', productWithoutImages);
      fixture.detectChanges();

      component.next();

      expect(component.currentIndex()).toBe(0);
      expect(component.currentImage()).toBeNull();
    });
  });

  // --------------------------------------------------
  // previous()
  // --------------------------------------------------

  describe('previous', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('product', productWithImages);
      fixture.detectChanges();
    });

    it('should move to the previous image', () => {
      component.select(2);

      component.previous();

      expect(component.currentIndex()).toBe(1);
      expect(component.currentImage()).toBe('image-2.jpg');
    });

    it('should wrap around to the last image from the first image', () => {
      expect(component.currentIndex()).toBe(0);

      component.previous();

      expect(component.currentIndex()).toBe(2);
      expect(component.currentImage()).toBe('image-3.jpg');
    });

    it('should move backwards through the images', () => {
      component.select(2);

      component.previous();
      component.previous();

      expect(component.currentIndex()).toBe(0);
      expect(component.currentImage()).toBe('image-1.jpg');
    });

    it('should do nothing when there is only one image', () => {
      const product: Product = {
        ...productWithImages,
        imagePaths: ['only-image.jpg'],
      };

      fixture.componentRef.setInput('product', product);
      fixture.detectChanges();

      component.previous();

      expect(component.currentIndex()).toBe(0);
      expect(component.currentImage()).toBe('only-image.jpg');
    });

    it('should do nothing when there are no images', () => {
      fixture.componentRef.setInput('product', productWithoutImages);
      fixture.detectChanges();

      component.previous();

      expect(component.currentIndex()).toBe(0);
      expect(component.currentImage()).toBeNull();
    });
  });

  // --------------------------------------------------
  // close output
  // --------------------------------------------------

  describe('close', () => {
    it('should emit when close is triggered', () => {
      fixture.componentRef.setInput('product', productWithImages);
      fixture.detectChanges();

      let emitted = false;

      component.close.subscribe(() => {
        emitted = true;
      });

      component.close.emit();

      expect(emitted).toBeTrue();
    });
  });

  // --------------------------------------------------
  // Keyboard navigation
  // --------------------------------------------------

  describe('keyboard navigation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('product', productWithImages);
      fixture.detectChanges();
    });

    it('should move to the next image when ArrowRight is pressed', () => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
        }),
      );

      expect(component.currentIndex()).toBe(1);
    });

    it('should move to the previous image when ArrowLeft is pressed', () => {
      component.select(2);

      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowLeft',
        }),
      );

      expect(component.currentIndex()).toBe(1);
    });

    it('should emit close when Escape is pressed', () => {
      let emitted = false;

      component.close.subscribe(() => {
        emitted = true;
      });

      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
        }),
      );

      expect(emitted).toBeTrue();
    });
  });
});
