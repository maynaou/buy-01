import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductGallery } from './product-gallery';
import { Product } from '../models/product';

const PRODUCT: Product = {
  name: 'Match ball',
  description: 'Size 5 training ball.',
  price: 24.99,
  quantity: 12,
  imagePaths: [
    'https://cdn.test/one.jpg',
    'https://cdn.test/two.jpg',
    'https://cdn.test/three.jpg',
  ],
};

describe('ProductGallery', () => {
  let component: ProductGallery;
  let fixture: ComponentFixture<ProductGallery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductGallery],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductGallery);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', PRODUCT);
    await fixture.whenStable();
  });

  it('should start on the first image', () => {
    expect(component.currentIndex()).toBe(0);
    expect(component.currentImage()).toBe('https://cdn.test/one.jpg');
    expect(component.hasMultiple()).toBe(true);
  });

  it('should render one thumbnail per image', () => {
    const thumbs = (fixture.nativeElement as HTMLElement).querySelectorAll('.gallery__thumb');
    expect(thumbs.length).toBe(3);
  });

  it('should page forward and wrap around', () => {
    component.next();
    expect(component.currentImage()).toBe('https://cdn.test/two.jpg');

    component.next();
    component.next();
    expect(component.currentIndex()).toBe(0);
  });

  it('should page backward from the first image to the last', () => {
    component.previous();
    expect(component.currentIndex()).toBe(2);
    expect(component.currentImage()).toBe('https://cdn.test/three.jpg');
  });

  it('should jump to a thumbnail', async () => {
    (fixture.nativeElement as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('.gallery__thumb')[2]
      .click();
    await fixture.whenStable();

    expect(component.currentIndex()).toBe(2);
  });

  it('should emit close when the backdrop is clicked', async () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));

    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.gallery')?.click();
    await fixture.whenStable();

    expect(closed).toBe(true);
  });

  it('should not emit close when the dialog itself is clicked', async () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));

    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.gallery__dialog')?.click();
    await fixture.whenStable();

    expect(closed).toBe(false);
  });

  it('should hide navigation for a single image', async () => {
    fixture.componentRef.setInput('product', {
      ...PRODUCT,
      imagePaths: ['https://cdn.test/one.jpg'],
    });
    await fixture.whenStable();

    expect(component.hasMultiple()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.gallery__nav')).toBeNull();

    component.next();
    expect(component.currentIndex()).toBe(0);
  });

  it('should cope with a product that has no images', async () => {
    fixture.componentRef.setInput('product', { ...PRODUCT, imagePaths: null });
    await fixture.whenStable();

    expect(component.currentImage()).toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.gallery__image--empty'),
    ).toBeTruthy();
  });
});
