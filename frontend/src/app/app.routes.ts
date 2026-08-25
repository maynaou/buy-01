import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Register } from './features/auth/register/register';
import { Login } from './features/auth/login/login';
import { Profile } from './features/profile/profile';
import { SellerDashboard } from './features/products/seller-dashboard/seller-dashboard';
import { authGuard } from './core/guards/auth-guard';
import { sellerGuard } from './core/guards/seller-guard';

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
    path: '**',
    redirectTo: '',
  },
];
