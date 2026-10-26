import { TestBed } from '@angular/core/testing';
import { Navigation, Router, provideRouter } from '@angular/router';

import { Order } from '../checkout/models/order';
import { OrderConfirmationPage } from './order-confirmation';

describe('OrderConfirmationPage', () => {
  let router: jasmine.SpyObj<Router>;

  const orders: Order[] = [
    makeOrder('order-123456789', 25),
    makeOrder('order-987654321', 40),
  ];

  function createPage(currentOrders: Order[] | undefined): OrderConfirmationPage {
    router = jasmine.createSpyObj<Router>('Router', [
      'getCurrentNavigation',
      'navigate',
    ]);
    router.getCurrentNavigation.and.returnValue(
      currentOrders
        ? ({
            extras: { state: { orders: currentOrders } },
          } as Navigation)
        : null
    );

    TestBed.configureTestingModule({
      imports: [OrderConfirmationPage],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: router },
      ],
    }).overrideComponent(OrderConfirmationPage, { set: { template: '' } });

    const fixture = TestBed.createComponent(OrderConfirmationPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should display orders passed in navigation state and compute grand total', () => {
    const component = createPage(orders);

    expect(component.orders()).toEqual(orders);
    expect(component.grandTotal()).toBe(65);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect home when navigation state has no orders', () => {
    const component = createPage(undefined);

    expect(component.orders()).toEqual([]);
    expect(component.grandTotal()).toBe(0);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should shorten long order ids and preserve short ids', () => {
    const component = createPage(orders);

    expect(component.shortId('order-123456789')).toBe('…23456789');
    expect(component.shortId('short-id')).toBe('short-id');
  });
});

function makeOrder(id: string, total: number): Order {
  return {
    id,
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    status: 'PENDING',
    paymentMethod: 'PAY_ON_DELIVERY',
    fullName: 'Client Test',
    address: '123 Main Street',
    phone: '0612345678',
    items: [],
    total,
    statusHistory: [],
    hiddenByBuyer: false,
    createdAt: '2026-01-10T12:00:00Z',
  };
}
