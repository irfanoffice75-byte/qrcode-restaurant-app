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

  async ngOnInit() {
    // ── Synchronous pre-check to prevent empty-state flash ──────────────
    const currentOrders = this.orderService.getMyOrders();
    if (currentOrders.length > 0) {
      // Orders already in memory — render immediately, no flicker
      this.activeOrders = currentOrders.filter(
        o => o.status !== 'Paid' && o.status !== 'Completed'
      );
      this.isInitializing = false;
    } else {
      // Always start with spinner ON if no data in memory
      this.isInitializing = true;
    }

    this.ordersSub = this.orderService.myOrders$.subscribe(orders => {
      this.activeOrders = orders.filter(
        o => o.status !== 'Paid' && o.status !== 'Completed'
      );

      // If active orders arrive, turn off spinner immediately
      if (this.activeOrders.length > 0) {
        this.isInitializing = false;
      }

      // If we had active orders before and now all are paid/completed → show paid screen
      if (orders.length === 0 && !this.orderPaid) {
        // If they had an order that completely disappeared (e.g., cancelled/deleted), auto-redirect
        if (!this.isInitializing) {
          this.startNewOrder();
        }
      } else if (this.activeOrders.length === 0 && orders.length > 0) {
        this.orderPaid = true;
        this.isInitializing = false;
      }
      this.cdr.detectChanges();
    });

    // Ensure we always fetch fresh data when the component mounts
    // and wait for it to complete before executing any empty-state fallbacks
    try {
      await this.orderService.refreshAllOrders();
    } catch (err) {
      console.error(err);
    }

    // After the backend load is complete, check if we still have no active orders
    if (this.activeOrders.length === 0) {
      if (!this.orderPaid) {
        // Automatically redirect to fresh menu if there are genuinely no active orders
        this.startNewOrder();
      } else {
        this.isInitializing = false;
        this.cdr.detectChanges();
      }
    }
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
