import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full'
  },
  {
    path: 'splash',
    loadChildren: () => import('./pages/splash/splash.module').then( m => m.SplashPageModule)
  },
  {
    path: 'welcome',
    loadChildren: () => import('./pages/welcome/welcome.module').then( m => m.WelcomePageModule)
  },
  {
    path: 'qr-scanner',
    loadChildren: () => import('./pages/qr-scanner/qr-scanner.module').then( m => m.QrScannerPageModule)
  },
  {
    path: 'restaurant-home',
    loadChildren: () => import('./pages/restaurant-home/restaurant-home.module').then( m => m.RestaurantHomePageModule)
  },
  {
    path: 'food-details',
    loadChildren: () => import('./pages/food-details/food-details.module').then( m => m.FoodDetailsPageModule)
  },
  {
    path: 'cart',
    loadChildren: () => import('./pages/cart/cart.module').then( m => m.CartPageModule)
  },
  {
    path: 'checkout',
    loadChildren: () => import('./pages/checkout/checkout.module').then( m => m.CheckoutPageModule)
  },
  {
    path: 'order-success',
    loadChildren: () => import('./pages/order-success/order-success.module').then( m => m.OrderSuccessPageModule)
  },
  {
    path: 'order-tracking',
    loadChildren: () => import('./pages/order-tracking/order-tracking.module').then( m => m.OrderTrackingPageModule)
  },
  {
    path: 'admin-orders',
    loadChildren: () => import('./pages/admin-orders/admin-orders.module').then( m => m.AdminOrdersPageModule)
  },
  {
    path: 'admin-menu',
    loadChildren: () => import('./pages/admin-menu/admin-menu.module').then( m => m.AdminMenuPageModule)
  },
  {
    path: 'admin-qrcode',
    loadChildren: () => import('./pages/admin-qrcode/admin-qrcode.module').then( m => m.AdminQrcodePageModule)
  },
  {
    path: 'admin-bills',
    loadChildren: () => import('./pages/admin-bills/admin-bills.module').then( m => m.AdminBillsPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
