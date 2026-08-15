import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../models/cart.model';
import { MenuItem } from '../models/menu.model';
import { OrderService } from './order.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();

  constructor(private orderService: OrderService) {}

  /** Load items from an existing Firestore order into the local cart */
  loadFromOrder(items: CartItem[]) {
    this.cartItems.next([...items]);
    // Don't sync back — these came FROM Firestore already
  }

  getCartItems(): CartItem[] {
    return this.cartItems.getValue();
  }

  addToCart(menuItem: MenuItem, quantity: number = 1, specialInstructions: string = '') {
    const items = this.getCartItems();
    const existing = items.find(i => i.menuItem.id === menuItem.id);

    if (existing) {
      existing.quantity += quantity;
      if (specialInstructions) {
        existing.specialInstructions = existing.specialInstructions
          ? `${existing.specialInstructions}, ${specialInstructions}`
          : specialInstructions;
      }
      this.cartItems.next([...items]);
    } else {
      this.cartItems.next([...items, { menuItem, quantity, specialInstructions }]);
    }
  }

  updateQuantity(menuItemId: string, quantity: number) {
    const items = this.getCartItems();
    const idx = items.findIndex(i => i.menuItem.id === menuItemId);
    if (idx > -1) {
      if (quantity <= 0) {
        items.splice(idx, 1);
      } else {
        items[idx].quantity = quantity;
      }
      this.cartItems.next([...items]);
    }
  }

  removeItem(menuItemId: string) {
    const items = this.getCartItems().filter(i => i.menuItem.id !== menuItemId);
    this.cartItems.next(items);
  }

  getTotalPrice(): number {
    return this.getCartItems().reduce(
      (total, item) => total + item.menuItem.price * item.quantity, 0
    );
  }

  getTotalItems(): number {
    return this.getCartItems().reduce((total, item) => total + item.quantity, 0);
  }

  clearCart() {
    this.cartItems.next([]);
    // Don't sync clear — clearing happens on order completion, not by customer
  }

  // Removed syncToFirestore, cart is now strictly local until placeOrder is called
}
