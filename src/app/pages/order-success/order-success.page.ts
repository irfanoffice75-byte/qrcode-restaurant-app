import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-order-success',
  templateUrl: './order-success.page.html',
  styleUrls: ['./order-success.page.scss'],
  standalone: false
})
export class OrderSuccessPage implements OnInit {

  order: Order | null = null;

  constructor(
    private orderService: OrderService,
    private router: Router,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    this.order = this.orderService.getCurrentOrder();
    if (!this.order) {
      this.router.navigate(['/restaurant-home']);
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

  trackOrder() {
    this.navCtrl.navigateRoot(['/order-tracking']);
  }

  addMoreFood() {
    this.navCtrl.navigateRoot(['/restaurant-home']);
  }
}
