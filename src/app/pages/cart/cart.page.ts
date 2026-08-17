import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cart.model';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: false
})
export class CartPage implements OnInit, OnDestroy {

  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  
  private cartSub!: Subscription;

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cartSub = this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.totalPrice = this.cartService.getTotalPrice();
    });
  }

  ngOnDestroy() {
    if (this.cartSub) {
      this.cartSub.unsubscribe();
    }
  }

  increaseQuantity(item: CartItem) {
    this.cartService.updateQuantity(item.menuItem.id, item.quantity + 1);
  }

  decreaseQuantity(item: CartItem) {
    this.cartService.updateQuantity(item.menuItem.id, item.quantity - 1);
  }

  removeItem(item: CartItem) {
    this.cartService.removeItem(item.menuItem.id);
  }

  goBack() {
    this.router.navigate(['/restaurant-home']);
  }

  goToCheckout() {
    if (this.cartItems.length > 0) {
      this.router.navigate(['/checkout']);
    }
  }
}
