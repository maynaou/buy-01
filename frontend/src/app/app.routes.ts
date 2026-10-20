import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Register } from './features/auth/register/register';
import { Login } from './features/auth/login/login';
import { Profile } from './features/profile/profile';
import { SellerDashboard } from './features/products/seller-dashboard/seller-dashboard';
import { authGuard } from './core/guards/auth-guard';
import { sellerGuard } from './core/guards/seller-guard';
import { CartPage } from './features/cart/cart';
import { CheckoutPage } from './features/checkout/checkout';
import { OrderConfirmationPage } from './features/order-confirmation/order-confirmation';
import { MyOrdersPage } from './features/orders/my-orders';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'profile',
    component: Profile,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    component: SellerDashboard,
    canActivate: [sellerGuard],
  },
  {
    path: 'cart',
    component: CartPage,
    canActivate: [authGuard],
  },
  {
    path: 'checkout',
    component: CheckoutPage,
    canActivate: [authGuard],
  },
  {
    path: 'order/confirmation',
    component: OrderConfirmationPage,
    canActivate: [authGuard],
  },
  {
    path: 'orders',
    component: MyOrdersPage,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
