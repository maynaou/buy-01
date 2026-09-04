import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { Product } from '../models/product';

@Component({
  selector: 'app-product-gallery',
  imports: [CurrencyPipe],
  templateUrl: './product-gallery.html',
  styleUrl: './product-gallery.scss',
  host: {
    '(document:keydown.escape)': 'close.emit()',
    '(document:keydown.arrowright)': 'next()',
    '(document:keydown.arrowleft)': 'previous()',
  },
})
export class ProductGallery {
  readonly product = input.required<Product>();

  readonly close = output<void>();

  readonly currentIndex = signal(0);

  readonly images = computed(() => this.product().imagePaths ?? []);

  readonly currentImage = computed(() => this.images()[this.currentIndex()] ?? null);

  readonly hasMultiple = computed(() => this.images().length > 1);

  constructor() {
    // Reopening on a different product must start from its first image.
    effect(() => {
      this.product();
      this.currentIndex.set(0);
    });
  }

  select(index: number): void {
    this.currentIndex.set(index);
  }

  next(): void {
    const total = this.images().length;
    if (total > 1) {
      this.currentIndex.update((index) => (index + 1) % total);
    }
  }

  previous(): void {
    const total = this.images().length;
    if (total > 1) {
      this.currentIndex.update((index) => (index - 1 + total) % total);
    }
  }
}
