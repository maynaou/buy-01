import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CatalogSearchState {
  private readonly panelOpen = signal(false);
  readonly isOpen = this.panelOpen.asReadonly();

  open(): void {
    this.panelOpen.set(true);
  }

  close(): void {
    this.panelOpen.set(false);
  }

  toggle(): void {
    this.panelOpen.update((isOpen) => !isOpen);
  }
}
