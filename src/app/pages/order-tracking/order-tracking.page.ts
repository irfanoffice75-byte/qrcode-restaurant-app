import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Order, OrderHistory, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-order-tracking',
  templateUrl: './order-tracking.page.html',
  styleUrls: ['./order-tracking.page.scss'],
  standalone: false
})
export class OrderTrackingPage implements OnInit, OnDestroy {

  // Only active (non-paid, non-completed) orders shown by default
  activeOrders: Order[] = [];
  isInitializing = true;  // true until first data arrives — prevents empty state flash
  orderPaid = false;  // True when admin marks order as paid
  private ordersSub!: Subscription;

  // History panel
  showHistory = false;
  completedHistory: OrderHistory[] = [];
  historyLoading = false;

  statuses: { title: OrderStatus, icon: string, description: string }[] = [
    { title: 'Pending',       icon: 'document-text-outline',  description: 'Please pay your bill at the counter.' },
    { title: 'Order Placed',  icon: 'document-text-outline',  description: 'We have received your order' },
    { title: 'Accepted',      icon: 'restaurant-outline',      description: 'Kitchen is preparing your ingredients' },
    { title: 'Preparing',     icon: 'flame-outline',           description: 'Your food is being cooked' },
    { title: 'Ready',         icon: 'checkmark-circle-outline', description: 'Food is ready to be served' },
    { title: 'Served',        icon: 'happy-outline',           description: 'Enjoy your meal!' }
  ];

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.ordersSub = this.orderService.myOrders$.subscribe(orders => {
      // First emission received — no longer initializing
      this.isInitializing = false;

      // Only keep active orders in the main view
      this.activeOrders = orders.filter(
        o => o.status !== 'Paid' && o.status !== 'Completed'
      );

      // If we HAD active orders before and now they are all gone →
      // admin marked the order as Paid (deleted from 'unpaid').
      // Show the paid success screen instead of redirecting silently.
      if (orders.length === 0 && !this.orderPaid) {
        // Do nothing, let the empty state UI show up
      } else if (this.activeOrders.length === 0 && orders.length > 0) {
        // Orders exist but all are Paid/Completed → show paid screen
        this.orderPaid = true;
      }
      this.cdr.detectChanges();
    });
  }

  // Prevent browser back button from returning to the menu/cart
  ionViewDidEnter() {
    history.pushState(null, '', location.href);
    window.onpopstate = function () {
      history.go(1);
    };
  }

  ionViewWillLeave() {
    window.onpopstate = null;
  }

  ngOnDestroy() {
    if (this.ordersSub) this.ordersSub.unsubscribe();
  }

  isStatusReached(order: Order, status: OrderStatus): boolean {
    const currentIndex = this.statuses.findIndex(s => s.title === order.status);
    const targetIndex  = this.statuses.findIndex(s => s.title === status);
    return targetIndex <= currentIndex;
  }

  isStatusActive(order: Order, status: OrderStatus): boolean {
    return order.status === status;
  }

  async toggleHistory() {
    this.showHistory = !this.showHistory;
    this.cdr.detectChanges(); // Force UI update immediately for toggle

    if (this.showHistory && this.completedHistory.length === 0) {
      this.historyLoading = true;
      this.cdr.detectChanges();
      
      try {
        const uid = this.authService.getSavedUid();
        if (uid) {
          this.completedHistory = await this.orderService.getOrderHistoryByUid(uid);
        }
      } catch (e) {
        console.error('History load error', e);
      } finally {
        this.historyLoading = false;
        this.cdr.detectChanges(); // Force UI update after load
      }
    }
  }

  startNewOrder() {
    this.cartService.clearCart();
    localStorage.removeItem('qr_current_order_id');
    this.router.navigate(['/restaurant-home'], { replaceUrl: true });
  }

  goHome() {
    this.router.navigate(['/restaurant-home']);
  }
}
