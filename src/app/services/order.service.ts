import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, firstValueFrom, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { Order, OrderStatus, OrderHistory } from '../models/order.model';
import { CartItem } from '../models/cart.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const TAXES = 2.50;

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http: HttpClient = inject(HttpClient);
  private authService: AuthService = inject(AuthService);
  private ngZone: NgZone = inject(NgZone);
  private socket: Socket;
  private apiUrl = environment.apiUrl;

  private allOrders = new BehaviorSubject<Order[]>([]);
  public allOrders$ = this.allOrders.asObservable();

  // Track orders currently being optimistically updated to prevent race conditions with refreshAllOrders
  private updatingOrderIds = new Set<string>();
  
  // Track timestamps of recent local updates to prevent stale GET responses from overriding recent PUTs
  private recentLocalUpdates = new Map<string, number>();
  
  // Track the unique token of the most recent API request to prevent older concurrent requests from overwriting newer optimistic states
  private latestUpdateTokens = new Map<string, number>();

  private previousBills = new BehaviorSubject<OrderHistory[]>([]);
  public previousBills$ = this.previousBills.asObservable();

  private myOrders = new BehaviorSubject<Order[]>([]);
  public myOrders$ = this.myOrders.asObservable();

  private currentOrder = new BehaviorSubject<Order | null>(null);
  public currentOrder$ = this.currentOrder.asObservable();

  public newOrderReceived$ = new Subject<Order>();
  public customerNotification$ = new Subject<{header: string, message: string, color: string}>();
  
  public initialLoadComplete = new BehaviorSubject<boolean>(false);

  constructor() {
    this.socket = io(environment.socketUrl);
    
    // Listen for realtime Socket.io updates instead of Firebase onSnapshot
    this.socket.on('new_order', (order: Order) => {
      this.ngZone.run(() => {
        // Prevent duplicate orders
        const current = this.allOrders.getValue();
        if (!current.some(o => o.id === order.id)) {
          this.allOrders.next([...current, order]);
          this.newOrderReceived$.next(order);
        }
      });
    });

    this.socket.on('order_updated', (order: Order) => {
      this.ngZone.run(() => {
        // Block socket if we have a NEWER local update in-flight for this order
        const lastLocalUpdate = this.recentLocalUpdates.get(order.id) || 0;
        const isRecentlyUpdated = (Date.now() - lastLocalUpdate) < 5000;
        if (this.updatingOrderIds.has(order.id) || isRecentlyUpdated) {
          return;
        }

        const currentOrders = this.allOrders.getValue();
        const index = currentOrders.findIndex(o => o.id === order.id);
        if (index !== -1) {
          if (order.status === 'Paid' || order.status === 'Completed') {
            currentOrders.splice(index, 1);
          } else {
            currentOrders[index] = order;
          }
          this.allOrders.next([...currentOrders]);
        }
        
        // Also update myOrders
        const currentMyOrders = this.myOrders.getValue();
        const myIndex = currentMyOrders.findIndex(o => o.id === order.id);
        if (myIndex !== -1) {
          const oldStatus = currentMyOrders[myIndex].status;
          
          if (oldStatus !== order.status) {
            if (order.status === 'Accepted') {
              this.customerNotification$.next({ header: 'Order Update', message: 'Your order has been accepted.', color: 'success' });
            } else if (order.status === 'Ready') {
              this.customerNotification$.next({ header: 'Order Update', message: 'Your order is ready!', color: 'success' });
            }
          }

          if (order.status === 'Paid' || order.status === 'Completed') {
            currentMyOrders.splice(myIndex, 1);
          } else {
            currentMyOrders[myIndex] = order;
          }
          this.myOrders.next([...currentMyOrders]);
        } else if (order.customerId === this.authService.getCurrentUserId() && order.status !== 'Paid' && order.status !== 'Completed') {
          // New order from this customer that isn't completed yet
          this.myOrders.next([...currentMyOrders, order]);
        }

        if (this.currentOrder.getValue()?.id === order.id) {
          this.currentOrder.next(order);
        }
      });
    });

    this.refreshAllOrders();
  }

  // Log to backend so agent can see frontend timeline
  public sendTelemetry(message: string) {
    const timestamp = new Date().toISOString();
    const formatted = `[FRONTEND TIMELINE] ${timestamp} - ${message}`;
    console.log(formatted);
    fetch(`${this.apiUrl}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: formatted })
    }).catch(e => console.error('Telemetry failed', e));
  }

  public async refreshAllOrders(): Promise<void> {
    try {
      const orders = await import('rxjs').then(m => m.firstValueFrom(this.http.get<Order[]>(`${this.apiUrl}/orders`)));
      
      this.ngZone.run(() => {
        const now = Date.now();
        // Merge fetched orders, but ignore any that are currently being updated locally
        // OR were recently updated locally (within 5 seconds) to prevent stale GET responses from overwriting.
        const currentOrders = this.allOrders.getValue();
        const updatedOrders = orders.map(serverOrder => {
          const lastUpdate = this.recentLocalUpdates.get(serverOrder.id) || 0;
          const isRecentlyUpdated = (now - lastUpdate) < 5000;
          
          if (this.updatingOrderIds.has(serverOrder.id) || isRecentlyUpdated) {
            // Keep our local optimistic version
            return currentOrders.find(o => o.id === serverOrder.id) || serverOrder;
          }
          return serverOrder;
        });

        // Filter out completed for the main view
        const active = updatedOrders.filter(o => o.status !== 'Paid' && o.status !== 'Completed');
        this.allOrders.next(active);

        // Restore currentOrder from localStorage if it's still active
        const savedOrderId = localStorage.getItem('qr_current_order_id');
        if (savedOrderId) {
          const found = active.find(o => o.id === savedOrderId);
          if (found) {
            this.currentOrder.next(found);
            // Always keep myOrders in sync with the saved order
            const currentMyOrders = this.myOrders.getValue();
            const alreadyInMyOrders = currentMyOrders.some(o => o.id === found.id);
            if (!alreadyInMyOrders) {
              this.myOrders.next([found, ...currentMyOrders]);
            } else {
              this.myOrders.next(currentMyOrders.map(o => o.id === found.id ? found : o));
            }
          } else {
            localStorage.removeItem('qr_current_order_id');
            this.currentOrder.next(null);
          }
        } else {
          // No saved order → fall back to filtering by userId
          const currentUserId = this.authService.getCurrentUserId();
          if (currentUserId) {
            const myActive = active.filter(o => o.customerId === currentUserId);
            this.myOrders.next(myActive);
          }
        }

        // Filter completed for the bills view
        const bills = updatedOrders.filter(o => o.status === 'Paid' || o.status === 'Completed').map(o => ({
          ...o,
          orderId: o.id,
          finalTotal: o.totalPrice
        })) as OrderHistory[];
        this.previousBills.next(bills);

        if (!this.initialLoadComplete.getValue()) {
          this.initialLoadComplete.next(true);
        }
      });
    } catch (error) {
      console.error('Failed to refresh orders:', error);
    }
  }

  async getActiveOrderForTable(tableId: string): Promise<Order | null> {
    return null; // Mocked for now during migration
  }

  async getTableIdByNumber(tableNumber: string): Promise<string | null> {
    return tableNumber; 
  }

  async createOrder(tableId: string, tableNumber: string, customerName: string): Promise<Order> {
    return {} as Order;
  }

  loadExistingOrder(order: Order) {
    this.currentOrder.next(order);
    
    // Seed myOrders and allOrders immediately so the UI doesn't flicker empty
    const currentMyOrders = this.myOrders.getValue();
    if (!currentMyOrders.find(o => o.id === order.id)) {
      this.myOrders.next([order, ...currentMyOrders]);
    }
    
    const currentAllOrders = this.allOrders.getValue();
    if (!currentAllOrders.find(o => o.id === order.id)) {
      this.allOrders.next([order, ...currentAllOrders]);
    }
  }

  async syncCartToOrder(orderId: string, items: CartItem[]) {}

  async updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    const updateToken = Date.now();
    this.latestUpdateTokens.set(orderId, updateToken);
    
    this.updatingOrderIds.add(orderId);
    this.recentLocalUpdates.set(orderId, updateToken);
    
    // Optimistic UI Update for instant feedback
    const currentOrders = this.allOrders.getValue();
    const orderIndex = currentOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      currentOrders[orderIndex] = { ...currentOrders[orderIndex], status: newStatus };
      this.allOrders.next([...currentOrders]);
    }
    
    const currentMyOrders = this.myOrders.getValue();
    const myOrderIndex = currentMyOrders.findIndex(o => o.id === orderId);
    if (myOrderIndex !== -1) {
      currentMyOrders[myOrderIndex] = { ...currentMyOrders[myOrderIndex], status: newStatus };
      this.myOrders.next([...currentMyOrders]);
    }
    
    try {
      const updatedServerOrder = await this.http.put<Order>(`${this.apiUrl}/orders/${orderId}/status`, { status: newStatus }).toPromise();
      if (updatedServerOrder && this.latestUpdateTokens.get(orderId) === updateToken) {
        const freshOrders = this.allOrders.getValue();
        const fIndex = freshOrders.findIndex(o => o.id === orderId);
        if (fIndex !== -1) {
          freshOrders[fIndex] = updatedServerOrder;
          this.allOrders.next([...freshOrders]);
        }
        
        const freshMyOrders = this.myOrders.getValue();
        const fmIndex = freshMyOrders.findIndex(o => o.id === orderId);
        if (fmIndex !== -1) {
          freshMyOrders[fmIndex] = updatedServerOrder;
          this.myOrders.next([...freshMyOrders]);
        }
      }
    } finally {
      if (this.latestUpdateTokens.get(orderId) === updateToken) {
        this.updatingOrderIds.delete(orderId);
      }
    }
  }

  async updatePaymentStatus(orderId: string, paymentStatus: 'paid' | 'unpaid') {
    const updateToken = Date.now();
    this.latestUpdateTokens.set(orderId, updateToken);
    
    this.updatingOrderIds.add(orderId);
    this.recentLocalUpdates.set(orderId, updateToken);
    
    // Optimistic UI Update for instant feedback
    const currentOrders = this.allOrders.getValue();
    const orderIndex = currentOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      currentOrders[orderIndex] = { ...currentOrders[orderIndex], paymentStatus };
      this.allOrders.next([...currentOrders]);
    }
    
    const currentMyOrders = this.myOrders.getValue();
    const myOrderIndex = currentMyOrders.findIndex(o => o.id === orderId);
    if (myOrderIndex !== -1) {
      currentMyOrders[myOrderIndex] = { ...currentMyOrders[myOrderIndex], paymentStatus };
      this.myOrders.next([...currentMyOrders]);
    }

    try {
      const updatedServerOrder = await this.http.put<Order>(`${this.apiUrl}/orders/${orderId}/payment`, { paymentStatus }).toPromise();
      if (updatedServerOrder && this.latestUpdateTokens.get(orderId) === updateToken) {
        const freshOrders = this.allOrders.getValue();
        const fIndex = freshOrders.findIndex(o => o.id === orderId);
        if (fIndex !== -1) {
          freshOrders[fIndex] = updatedServerOrder;
          this.allOrders.next([...freshOrders]);
        }
        
        const freshMyOrders = this.myOrders.getValue();
        const fmIndex = freshMyOrders.findIndex(o => o.id === orderId);
        if (fmIndex !== -1) {
          freshMyOrders[fmIndex] = updatedServerOrder;
          this.myOrders.next([...freshMyOrders]);
        }
      }
    } finally {
      if (this.latestUpdateTokens.get(orderId) === updateToken) {
        this.updatingOrderIds.delete(orderId);
      }
    }
  }

  async completeOrder(order: Order, paymentStatus: 'paid' | 'unpaid' = 'paid'): Promise<void> {
    await this.updateOrderStatus(order.id, 'Completed');
  }

  getCurrentOrder(): Order | null {
    return this.currentOrder.getValue();
  }

  getCurrentOrderId(): string | null {
    return this.currentOrder.getValue()?.id || null;
  }

  clearCurrentOrder() {
    this.currentOrder.next(null);
  }

  getMyOrders(): Order[] {
    return this.myOrders.getValue();
  }

  getAllOrders(): Order[] {
    return this.allOrders.getValue();
  }

  clearAllOrders() {}

  placeOrder(tableNumber: string, items: CartItem[], totalPrice: number): Observable<Order> {
    const customerId = this.authService.getCurrentUserId();
    const customerName = localStorage.getItem('qr_customer_name') || 'Guest';
    const subtotal = items.length > 0 ? totalPrice - TAXES : 0;
    
    return this.http.post<Order>(`${this.apiUrl}/orders`, {
      tableNumber,
      customerName,
      customerId,
      subtotal,
      totalPrice,
      items
    }).pipe(
      tap(order => {
        localStorage.setItem('qr_current_order_id', order.id);
        this.currentOrder.next(order);
        
        // Eagerly update myOrders so tracking page works immediately
        const currentMyOrders = this.myOrders.getValue();
        this.myOrders.next([order, ...currentMyOrders]);
      })
    );
  }

  async getLastKnownCustomerName(uid: string): Promise<string | null> {
    return null;
  }

  async getLatestOrderByUid(uid: string): Promise<Order | null> {
    try {
      const order = await firstValueFrom(this.http.get<Order | null>(`${this.apiUrl}/orders/customer/${uid}/latest`));
      return order;
    } catch (err) {
      console.error('Failed to get latest order:', err);
      return null;
    }
  }

  async getOrderHistoryByUid(uid: string): Promise<OrderHistory[]> {
    return [];
  }
}
