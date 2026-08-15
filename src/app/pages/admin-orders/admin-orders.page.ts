import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import OneSignal from 'onesignal-cordova-plugin';
import { OrderService } from '../../services/order.service';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-admin-orders',
  templateUrl: './admin-orders.page.html',
  styleUrls: ['./admin-orders.page.scss'],
  standalone: false
})
export class AdminOrdersPage implements OnInit, OnDestroy, AfterViewInit {

  orders: Order[] = [];
  private orderSub!: Subscription;
  private querySub!: Subscription;
  highlightId: string | null = null;

  // Tabs for segment
  currentSegment: 'new' | 'preparing' | 'ready' | 'served' = 'new';
  
  // Status mapping for segments
  statusMap = {
    'new': ['Pending', 'Order Placed', 'Accepted'],
    'preparing': ['Preparing'],
    'ready': ['Ready'],
    'served': ['Served']
  };

  constructor(
    private orderService: OrderService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.orderSub = this.orderService.allOrders$.subscribe(orders => {
      this.orders = orders;
    });

    this.querySub = this.route.queryParams.subscribe(async params => {
      if (params['highlight']) {
        this.highlightId = params['highlight'];
        this.currentSegment = 'new';
        
        // Wait briefly for network to wake up if app was completely suspended
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Force refresh from server in case app was in background and await it
        await this.orderService.refreshAllOrders();
        
        // Data is now fetched. Wait a tiny bit for UI to render DOM, then scroll
        setTimeout(() => {
          this.scrollToOrder(this.highlightId!);
          
          // Automatically remove the red border/highlight after 10 seconds
          setTimeout(() => {
            if (this.highlightId === params['highlight']) {
              this.highlightId = null;
            }
          }, 10000);
        }, 100);
      }
    });
  }

  ngOnDestroy() {
    if (this.orderSub) {
      this.orderSub.unsubscribe();
    }
    if (this.querySub) {
      this.querySub.unsubscribe();
    }
  }
  
  segmentChanged(event: any) {
    this.currentSegment = event.detail.value;
  }
  
  get filteredOrders(): Order[] {
    const statuses = this.statusMap[this.currentSegment];
    return this.orders.filter(order => statuses.includes(order.status));
  }

  getOrderCount(segment: 'new' | 'preparing' | 'ready' | 'served'): number {
    const statuses = this.statusMap[segment];
    return this.orders.filter(order => statuses.includes(order.status)).length;
  }
  
  ngAfterViewInit() {
    if (this.highlightId) {
      setTimeout(() => {
        this.scrollToOrder(this.highlightId!);
      }, 500);
    }
  }

  scrollToOrder(orderId: string) {
    const el = document.getElementById('order-' + orderId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  updateStatus(order: Order, newStatus: OrderStatus) {
    this.dismissOrderNotification(order.id);
    if (newStatus === 'Paid' || newStatus === 'Completed') {
      this.orderService.completeOrder(order);
    } else {
      this.orderService.updateOrderStatus(order.id, newStatus);
    }
  }

  collectPayment(order: Order) {
    this.dismissOrderNotification(order.id);
    // The backend /api/orders/:id/status endpoint automatically sets paymentStatus to 'paid' 
    // when status is set to 'Order Placed'. We only need one call here.
    order.paymentStatus = 'paid'; // Instantly hide the button
    this.orderService.updateOrderStatus(order.id, 'Order Placed');
  }

  dismissOrderNotification(orderId: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        console.log(`[Admin Orders] Dismissing notification for group: ${orderId}`);
        OneSignal.Notifications.removeGroupedNotifications(orderId);
      } catch (err) {
        console.error('Error dismissing OneSignal notification', err);
      }
    }
  }

  goBack() {
    this.router.navigate(['/welcome']);
  }

  goToBills() {
    this.router.navigate(['/admin-bills']);
  }

  goToMenu() {
    this.router.navigate(['/admin-menu']);
  }

  goToQRGenerator() {
    this.router.navigate(['/admin-qrcode']);
  }

  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }
}
