import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NotificationError } from './core/services/notification-error';
import { Navbar } from './shared/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('frontend');
  protected readonly notification = inject(NotificationError);
}
