import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, AlertController } from '@ionic/angular';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { CartItem } from '../../models/cart.model';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: false
})
export class CheckoutPage implements OnInit {

  cartItems: CartItem[] = [];
  subtotal: number = 0;
  taxes: number = 2.50;
  tableNumber: string = '';
  paymentMethod: string = 'card';
  
  isProcessing = false;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router,
    private navCtrl: NavController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.cartItems = this.cartService.getCartItems();
    this.subtotal = this.cartService.getTotalPrice();

    // Read real table number from QR code scan (set in welcome page)
    this.tableNumber = localStorage.getItem('qr_table_no') || '';

    if (this.cartItems.length === 0) {
      this.router.navigate(['/restaurant-home']);
    }
  }

  get total(): number {
    return this.subtotal + this.taxes;
  }

  placeOrder() {
    this.isProcessing = true;
    
    setTimeout(() => {
      this.orderService.placeOrder(this.tableNumber, this.cartItems, this.total).subscribe({
        next: (order) => {
          this.cartService.clearCart();
          this.isProcessing = false;
          this.navCtrl.navigateRoot(['/order-tracking']);
        },
        error: (err) => {
          console.error("Order failed to place!", err);
          this.isProcessing = false;
          alert("Failed to place order: " + err.message);
        }
      });
    }, 2000);
  }

  goBack() {
    this.router.navigate(['/cart']);
  }
}
