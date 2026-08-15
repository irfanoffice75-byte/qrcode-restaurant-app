import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { Order, OrderHistory } from '../../models/order.model';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-admin-bills',
  templateUrl: './admin-bills.page.html',
  styleUrls: ['./admin-bills.page.scss'],
  standalone: false
})
export class AdminBillsPage implements OnInit, OnDestroy {
  
  currentSegment: 'active' | 'previous' = 'active';

  activeOrders: Order[] = [];
  previousBills: OrderHistory[] = [];

  fromDate: string | null = null;
  toDate: string | null = null;

  private ordersSub!: Subscription;
  private billsSub!: Subscription;

  constructor(
    private router: Router,
    private orderService: OrderService,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.ordersSub = this.orderService.allOrders$.subscribe(orders => {
      // Show orders in Table Bills if payment has been collected (paymentStatus === 'paid')
      // OR if they are legacy active orders past the Order Placed/Pending state.
      this.activeOrders = orders.filter(o => o.paymentStatus === 'paid' || (o.status !== 'Order Placed' && o.status !== 'Pending'));
    });

    this.billsSub = this.orderService.previousBills$.subscribe(bills => {
      this.previousBills = bills;
    });
  }

  ngOnDestroy() {
    if (this.ordersSub) this.ordersSub.unsubscribe();
    if (this.billsSub) this.billsSub.unsubscribe();
  }

  segmentChanged(event: any) {
    this.currentSegment = event.detail.value;
  }

  get filteredPreviousBills(): OrderHistory[] {
    if (!this.fromDate && !this.toDate) {
      return this.previousBills;
    }
    return this.previousBills.filter(bill => {
      if (!bill.completedAt) return false;
      const dateObj = new Date(bill.completedAt);
      const isoDate = dateObj.toISOString().split('T')[0];
      
      let inRange = true;
      if (this.fromDate && isoDate < this.fromDate) {
        inRange = false;
      }
      if (this.toDate && isoDate > this.toDate) {
        inRange = false;
      }
      return inRange;
    });
  }

  goBack() {
    this.router.navigate(['/admin-orders']);
  }

  async markAsPaid(order: Order) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Payment',
      message: `Mark the bill for Table ${order.tableNumber} ($${order.totalPrice.toFixed(2)}) as Paid?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm',
          handler: () => {
            this.orderService.completeOrder(order);
          }
        }
      ]
    });
    await alert.present();
  }
}
