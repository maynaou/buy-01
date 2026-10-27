import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { OrderService } from './order';
import { environment } from '../../../environments/environment';
import { Order, OrderStatus } from '../../features/checkout/models/order';

describe('OrderService', () => {
  let service: OrderService;
  let httpTestingController: HttpTestingController;

  const orderUrl = `${environment.apiUrl}/api/orders`;
  const mockOrder: Order = {
    id: 'order-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    status: 'PENDING',
    paymentMethod: 'PAY_ON_DELIVERY',
    fullName: 'Client Test',
    address: '123 Main Street',
    phone: '0612345678',
    items: [
      {
        productId: 'product-1',
        productName: 'Ball',
        unitPrice: 12.5,
        quantity: 2,
      },
    ],
    total: 25,
    statusHistory: [],
    hiddenByBuyer: false,
    createdAt: '2026-01-10T12:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrderService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(OrderService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should checkout and return orders', () => {
    const request = {
      fullName: 'Client Test',
      address: '123 Main Street',
      phone: '0612345678',
    };

    service.checkout(request).subscribe((orders) => {
      expect(orders).toEqual([mockOrder]);
    });

    const req = httpTestingController.expectOne(`${orderUrl}/checkout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush([mockOrder]);
  });

  it('should fetch buyer orders with search filters', () => {
    const filters = {
      search: 'ball',
      status: 'PENDING' as OrderStatus,
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    };

    service.getMyOrders(filters).subscribe((orders) => {
      expect(orders).toEqual([mockOrder]);
    });

    const req = httpTestingController.expectOne(`${orderUrl}/my-orders`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(filters);
    req.flush([mockOrder]);
  });

  it('should fetch seller orders with filters', () => {
    const filters = { status: 'SHIPPED' as OrderStatus };

    service.getSellerOrders(filters).subscribe((orders) => {
      expect(orders).toEqual([mockOrder]);
    });

    const req = httpTestingController.expectOne(`${orderUrl}/seller`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(filters);
    req.flush([mockOrder]);
  });

  it('should fetch seller top products', () => {
    const topProducts = [
      { productId: 'product-1', name: 'Ball', units: 8, revenue: 100 },
    ];

    service.getSellerTopProducts().subscribe((products) => {
      expect(products).toEqual(topProducts);
    });

    const req = httpTestingController.expectOne(`${orderUrl}/seller/top-products`);
    expect(req.request.method).toBe('GET');
    req.flush(topProducts);
  });

  it('should update an order status', () => {
    const status: OrderStatus = 'SHIPPED';
    const updatedOrder = { ...mockOrder, status };

    service.updateOrderStatus('order-1', status).subscribe((order) => {
      expect(order).toEqual(updatedOrder);
    });

    const req = httpTestingController.expectOne(`${orderUrl}/order-1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status });
    req.flush(updatedOrder);
  });

  it('should cancel an order', () => {
    const cancelledOrder = { ...mockOrder, status: 'CANCELLED' as const };

    service.cancelOrder('order-1').subscribe((order) => {
      expect(order).toEqual(cancelledOrder);
    });

    const req = httpTestingController.expectOne(`${orderUrl}/order-1/cancel`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(cancelledOrder);
  });

  it('should delete an order', () => {
    service.deleteOrder('order-1').subscribe((result) => {
      expect(result).toBeNull();
    });

    const req = httpTestingController.expectOne(`${orderUrl}/order-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should fetch customer order analytics', () => {
    const analytics = {
      totalSpent: 50,
      mostBoughtProducts: [
        { productId: 'product-1', name: 'Ball', units: 2, amountSpent: 25 },
      ],
      topCategories: [
        { category: 'SPORT', units: 2, amountSpent: 25 },
      ],
    };

    service.getMyAnalytics().subscribe((result) => {
      expect(result).toEqual(analytics);
    });

    const req = httpTestingController.expectOne(`${orderUrl}/my-analytics`);
    expect(req.request.method).toBe('GET');
    req.flush(analytics);
  });
});
