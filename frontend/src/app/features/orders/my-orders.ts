import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { OrderService } from '../../core/services/order';
import { CartService } from '../../core/services/cart';
import { NotificationError } from '../../core/services/notification-error';
import { Order, OrderStatus } from '../checkout/models/order';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, FormsModule],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
})
export class MyOrdersPage {
  private readonly orderService = inject(OrderService);
  private readonly cartService = inject(CartService);
  private readonly notification = inject(NotificationError);
  private readonly router = inject(Router);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly actionOrderId = signal<string | null>(null);
  readonly orderFilter = signal<OrderStatus | 'ALL'>('ALL');
  readonly orderSearch = signal<string>('');

  // Dernières commandes en premier avec filtre optionnel et recherche
  readonly filteredOrders = computed(() => {
    const filter = this.orderFilter();
    const query = this.orderSearch().trim().toLowerCase();
    let list = this.orders();
    if (filter !== 'ALL') {
      list = list.filter((o) => o.status === filter);
    }
    if (query) {
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(query) ||
          o.items.some((i) => i.productName.toLowerCase().includes(query))
      );
    }
    return list;
  });

  // Statistiques pour le client (total dépensé, en cours, pertes/annulées)
  readonly totalOrdersCount = computed(() => this.orders().length);
  readonly totalDeliveredAmount = computed(() =>
    this.orders()
      .filter((o) => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + (o.total || 0), 0)
  );
  readonly totalActiveCount = computed(
    () =>
      this.orders().filter(
        (o) =>
          o.status === 'PENDING' ||
          o.status === 'CONFIRMED' ||
          o.status === 'SHIPPED'
      ).length
  );
  readonly totalCancelledCount = computed(
    () => this.orders().filter((o) => o.status === 'CANCELLED').length
  );
  readonly totalCancelledAmount = computed(() =>
    this.orders()
      .filter((o) => o.status === 'CANCELLED')
      .reduce((sum, o) => sum + (o.total || 0), 0)
  );

  constructor() {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        // Dernières commandes en haut (tri décroissant par date)
        const sorted = [...orders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.orders.set(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Impossible de charger vos commandes.');
      },
    });
  }

  countByStatus(status: OrderStatus): number {
    return this.orders().filter((o) => o.status === status).length;
  }

  orderCardClass(status: string): string {
    return 'client-order-card--' + status.toLowerCase();
  }

  cancelOrder(order: Order): void {
    if (order.status !== 'PENDING' || this.actionOrderId() === order.id) {
      return;
    }

    this.actionOrderId.set(order.id);
    this.orderService.cancelOrder(order.id).subscribe({
      next: (updatedOrder) => {
        this.orders.update((list) =>
          list.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        );
        this.actionOrderId.set(null);
        this.notification.show('Commande annulée avec succès.', 'green');
      },
      error: (err) => {
        this.actionOrderId.set(null);
        const msg = err?.error?.message || "Impossible d'annuler la commande.";
        this.notification.show(msg, 'red');
      },
    });
  }

  deleteOrder(order: Order): void {
    if (
      (order.status !== 'DELIVERED' && order.status !== 'CANCELLED') ||
      this.actionOrderId() === order.id
    ) {
      return;
    }

    this.actionOrderId.set(order.id);
    this.orderService.deleteOrder(order.id).subscribe({
      next: () => {
        this.orders.update((list) => list.filter((o) => o.id !== order.id));
        this.actionOrderId.set(null);
        this.notification.show('Commande retirée de votre historique.', 'green');
      },
      error: (err) => {
        this.actionOrderId.set(null);
        const msg = err?.error?.message || 'Impossible de supprimer cette commande.';
        this.notification.show(msg, 'red');
      },
    });
  }

  reorder(order: Order): void {
    if (this.actionOrderId() === order.id) {
      return;
    }

    this.actionOrderId.set(order.id);

    const addCalls = order.items.map((item) =>
      this.cartService.addToCart({
        productId: item.productId,
        quantity: item.quantity,
      })
    );

    forkJoin(addCalls).subscribe({
      next: () => {
        this.actionOrderId.set(null);
        this.notification.show('Articles ajoutés au panier !', 'green');
        this.router.navigate(['/cart']);
      },
      error: () => {
        this.actionOrderId.set(null);
        this.notification.show(
          'Certains articles ne sont plus disponibles en stock.',
          'red'
        );
      },
    });
  }

  statusLabel(status: OrderStatus): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'CONFIRMED':
        return 'Confirmée';
      case 'SHIPPED':
        return 'Expédiée';
      case 'DELIVERED':
        return 'Livrée';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return status;
    }
  }

  statusClass(status: OrderStatus): string {
    switch (status) {
      case 'PENDING':
        return 'status--pending';
      case 'CONFIRMED':
        return 'status--confirmed';
      case 'SHIPPED':
        return 'status--shipped';
      case 'DELIVERED':
        return 'status--delivered';
      case 'CANCELLED':
        return 'status--cancelled';
      default:
        return '';
    }
  }

  shortId(id: string): string {
    return id.length > 8 ? '…' + id.slice(-8) : id;
  }
}
