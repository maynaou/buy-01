import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CartService } from '../../core/services/cart';
import { NotificationError } from '../../core/services/notification-error';
import { OrderService } from '../../core/services/order';
import { Order, OrderStatus } from '../checkout/models/order';
import { MyOrdersPage } from './my-orders';

describe('MyOrdersPage', () => {
  let component: MyOrdersPage;
  let fixture: ComponentFixture<MyOrdersPage>;
  let orderService: jasmine.SpyObj<OrderService>;
  let cartService: jasmine.SpyObj<CartService>;
  let notification: jasmine.SpyObj<NotificationError>;
  let router: jasmine.SpyObj<Router>;

  const mockOrders: Order[] = [
    makeOrder('order-old', 'DELIVERED', 20, '2026-01-01T10:00:00Z'),
    makeOrder('order-new', 'PENDING', 30, '2026-02-01T10:00:00Z'),
    makeOrder('order-cancelled', 'CANCELLED', 15, '2026-01-15T10:00:00Z'),
  ];

  beforeEach(async () => {
    orderService = jasmine.createSpyObj<OrderService>('OrderService', [
      'getMyOrders',
      'cancelOrder',
      'deleteOrder',
    ]);
    cartService = jasmine.createSpyObj<CartService>('CartService', ['addToCart']);
    notification = jasmine.createSpyObj<NotificationError>('NotificationError', ['show']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    orderService.getMyOrders.and.returnValue(of(mockOrders));
    orderService.cancelOrder.and.callFake((id) =>
      of({ ...makeOrder(id, 'CANCELLED', 30, '2026-02-01T10:00:00Z') })
    );
    orderService.deleteOrder.and.returnValue(of(void 0));
    cartService.addToCart.and.returnValue(of({
      userId: 'buyer-1',
      items: [],
      totalItems: 0,
      subtotalPrice: 0,
      shippingPrice: 0,
      totalPrice: 0,
    }));

    await TestBed.configureTestingModule({
      imports: [MyOrdersPage],
      providers: [
        provideRouter([]),
        { provide: OrderService, useValue: orderService },
        { provide: CartService, useValue: cartService },
        { provide: NotificationError, useValue: notification },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(MyOrdersPage, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(MyOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load orders sorted newest first and calculate status totals', () => {
    expect(orderService.getMyOrders).toHaveBeenCalledWith({
      search: '',
      status: undefined,
      dateFrom: '',
      dateTo: '',
    });
    expect(component.orders().map((order) => order.id)).toEqual([
      'order-new',
      'order-cancelled',
      'order-old',
    ]);
    expect(component.filteredOrders().map((order) => order.id)).toEqual([
      'order-new',
      'order-cancelled',
      'order-old',
    ]);
    expect(component.totalOrdersCount()).toBe(3);
    expect(component.totalDeliveredAmount()).toBe(20);
    expect(component.totalActiveCount()).toBe(1);
    expect(component.totalCancelledCount()).toBe(1);
    expect(component.totalCancelledAmount()).toBe(15);
    expect(component.loading()).toBeFalse();
  });

  it('should send the selected filters when applying them', () => {
    component.orderSearch.set(' ball ');
    component.orderDateFrom.set('2026-01-01');
    component.orderDateTo.set('2026-01-31');
    component.orderFilter.set('SHIPPED');

    component.applyOrderFilters();

    expect(orderService.getMyOrders).toHaveBeenCalledWith({
      search: ' ball ',
      status: 'SHIPPED',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
  });

  it('should update the active filter and reload orders', () => {
    component.setOrderFilter('DELIVERED');

    expect(component.orderFilter()).toBe('DELIVERED');
    expect(orderService.getMyOrders).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'DELIVERED' })
    );
  });

  it('should not overwrite all-order statistics while a filter is active', () => {
    component.orderFilter.set('PENDING');
    orderService.getMyOrders.and.returnValue(of([mockOrders[1]]));

    component.loadOrders();

    expect(component.filteredOrders().map((order) => order.id)).toEqual(['order-new']);
    expect(component.orders()).toHaveSize(3);
    expect(component.totalOrdersCount()).toBe(3);
  });

  it('should set an error message when loading orders fails', () => {
    orderService.getMyOrders.and.returnValue(throwError(() => new Error('network')));

    component.loadOrders();

    expect(component.errorMessage()).toBe('Impossible de charger vos commandes.');
    expect(component.loading()).toBeFalse();
  });

  it('should cancel pending orders, update local state and reload', () => {
    const pendingOrder = component.orders().find((order) => order.status === 'PENDING')!;
    const cancelledOrder = {
      ...pendingOrder,
      status: 'CANCELLED' as const,
    };
    orderService.getMyOrders.and.returnValue(
      of(mockOrders.map((order) => order.id === pendingOrder.id ? cancelledOrder : order))
    );

    component.cancelOrder(pendingOrder);

    expect(orderService.cancelOrder).toHaveBeenCalledWith(pendingOrder.id);
    expect(component.orders().find((order) => order.id === pendingOrder.id)?.status)
      .toBe('CANCELLED');
    expect(notification.show).toHaveBeenCalledWith('Commande annulée avec succès.', 'green');
    expect(component.actionOrderId()).toBeNull();
    expect(orderService.getMyOrders).toHaveBeenCalledTimes(2);
  });

  it('should not cancel non-pending orders or repeat an active cancellation', () => {
    const deliveredOrder = mockOrders[0];
    component.cancelOrder(deliveredOrder);
    expect(orderService.cancelOrder).not.toHaveBeenCalled();

    component.actionOrderId.set(mockOrders[1].id);
    component.cancelOrder(mockOrders[1]);
    expect(orderService.cancelOrder).not.toHaveBeenCalled();
  });

  it('should show the API error when cancellation fails', () => {
    orderService.cancelOrder.and.returnValue(
      throwError(() => ({ error: { message: 'Cancellation rejected' } }))
    );

    component.cancelOrder(mockOrders[1]);

    expect(notification.show).toHaveBeenCalledWith('Cancellation rejected', 'red');
    expect(component.actionOrderId()).toBeNull();
  });

  it('should remove terminal orders from local lists after deletion', () => {
    component.deleteOrder(mockOrders[0]);

    expect(orderService.deleteOrder).toHaveBeenCalledWith('order-old');
    expect(component.orders().some((order) => order.id === 'order-old')).toBeFalse();
    expect(component.filteredOrders().some((order) => order.id === 'order-old')).toBeFalse();
    expect(notification.show).toHaveBeenCalledWith(
      'Commande retirée de votre historique.',
      'green'
    );
    expect(component.actionOrderId()).toBeNull();
  });

  it('should not delete non-terminal orders', () => {
    component.deleteOrder(mockOrders[1]);

    expect(orderService.deleteOrder).not.toHaveBeenCalled();
  });

  it('should show the API error when deleting an order fails', () => {
    orderService.deleteOrder.and.returnValue(
      throwError(() => ({ error: { message: 'Delete rejected' } }))
    );

    component.deleteOrder(mockOrders[0]);

    expect(notification.show).toHaveBeenCalledWith('Delete rejected', 'red');
    expect(component.actionOrderId()).toBeNull();
    expect(component.orders().some((order) => order.id === 'order-old')).toBeTrue();
  });

  it('should add all order items to cart and navigate to cart', () => {
    const order = mockOrders[0];
    cartService.addToCart.and.returnValues(
      of(emptyCart()),
      of(emptyCart())
    );
    const reorderOrder: Order = {
      ...order,
      items: [
        { productId: 'product-1', productName: 'Ball', unitPrice: 10, quantity: 2 },
        { productId: 'product-2', productName: 'Shoes', unitPrice: 20, quantity: 1 },
      ],
    };

    component.reorder(reorderOrder);

    expect(cartService.addToCart).toHaveBeenCalledTimes(2);
    expect(cartService.addToCart).toHaveBeenCalledWith({
      productId: 'product-1',
      quantity: 2,
    });
    expect(cartService.addToCart).toHaveBeenCalledWith({
      productId: 'product-2',
      quantity: 1,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/cart']);
    expect(notification.show).toHaveBeenCalledWith('Articles ajoutés au panier !', 'green');
    expect(component.actionOrderId()).toBeNull();
  });

  it('should notify when adding a reordered item fails', () => {
    cartService.addToCart.and.returnValue(
      throwError(() => new Error('Out of stock'))
    );

    component.reorder(mockOrders[0]);

    expect(notification.show).toHaveBeenCalledWith(
      'Certains articles ne sont plus disponibles en stock.',
      'red'
    );
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.actionOrderId()).toBeNull();
  });

  it('should provide order status labels, classes and short ids', () => {
    const statuses: OrderStatus[] = [
      'PENDING',
      'CONFIRMED',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];

    expect(statuses.map((status) => component.statusLabel(status))).toEqual([
      'En attente',
      'Confirmée',
      'Expédiée',
      'Livrée',
      'Annulée',
    ]);
    expect(component.statusClass('CANCELLED')).toBe('status--cancelled');
    expect(component.orderCardClass('PENDING')).toBe('client-order-card--pending');
    expect(component.shortId('1234567890')).toBe('…34567890');
    expect(component.shortId('short')).toBe('short');
    expect(component.countByStatus('PENDING')).toBe(1);
  });
});

function makeOrder(
  id: string,
  status: OrderStatus,
  total: number,
  createdAt: string
): Order {
  return {
    id,
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    status,
    paymentMethod: 'PAY_ON_DELIVERY',
    fullName: 'Client Test',
    address: '123 Main Street',
    phone: '0612345678',
    items: [{ productId: 'product-1', productName: 'Ball', unitPrice: total, quantity: 1 }],
    total,
    statusHistory: [],
    hiddenByBuyer: false,
    createdAt,
  };
}

function emptyCart() {
  return {
    userId: 'buyer-1',
    items: [],
    totalItems: 0,
    subtotalPrice: 0,
    shippingPrice: 0,
    totalPrice: 0,
  };
}
