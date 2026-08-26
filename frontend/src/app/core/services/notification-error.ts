import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationError {
  private message = signal<string | null>(null);
  private color = signal<'red' | 'green'>('green');

  show(message: string, color: 'red' | 'green' = 'green') {

    this.message.set(message);
    this.color.set(color);
    setTimeout(() => {
      this.message.set(null);
    }, 3000);
  }

  getMessage() {
    return this.message();
  }

  getColor() {
    return this.color();
  }
}