import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: false
})
export class WelcomePage implements OnInit {

  isLoading = window.location.search.includes('table=');  // pre-set to prevent flash if URL has table
  isApp = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private orderService: OrderService,
    private cartService: CartService,
    private authService: AuthService,
    private platform: Platform
  ) { 
    this.isApp = this.platform.is('capacitor');
  }

  ngOnInit() {
    // If the user scans a QR code with their phone's native camera,
    // it will directly open this page with a ?table=X parameter.
    this.route.queryParams.subscribe(params => {
      const tableNumber = params['table'];
      if (tableNumber) {
        this.isLoading = true;
        this.handleTableScan(tableNumber);
      }
      // If no table param: just show the clean "scan your QR code" screen
    });
  }

  async handleTableScan(tableNumber: string) {

    let loading: any;
    if (this.isApp) {
      loading = await this.loadingCtrl.create({
        message: 'Loading, please wait...',
        spinner: 'crescent'
      });
      await loading.present();
    }

    try {
      localStorage.setItem('qr_table_no', tableNumber);
      
      // Always fetch the latest tableId for the scanned table
      const tableId = await this.orderService.getTableIdByNumber(tableNumber);
      if (tableId) {
        localStorage.setItem('qr_table_id', tableId);
      }

      this.orderService.sendTelemetry(`WelcomePage: QR scan started for table ${tableNumber}`);

      // ── STEP 1: Get Anonymous UID ──────────────────────────────────────
      // signInAnonymously() always saves UID to localStorage.
      // getSavedUid() reads it back instantly even if Firebase is still loading.
      const authUser = await this.authService.signInAnonymously();
      const uid = authUser?.uid || this.authService.getSavedUid();
      
      this.orderService.sendTelemetry(`WelcomePage: UID retrieved -> ${uid}`);

      if (uid) {
        // ── STEP 2: Find latest order with this UID ────────────────────
        const latestOrder = await this.orderService.getLatestOrderByUid(uid);

        if (latestOrder) {
          const isPaid = latestOrder.status === 'Paid' || latestOrder.status === 'Completed';

          const customerName = latestOrder.customerName || localStorage.getItem('qr_customer_name') || 'Guest';
          localStorage.setItem('qr_customer_name', customerName);
          localStorage.setItem('qr_restaurant_name', 'The Grand Kitchen');

          if (!isPaid) {
            this.orderService.sendTelemetry(`WelcomePage: Found ACTIVE latest order (${latestOrder.id}). Status: ${latestOrder.status}. Routing to /order-tracking.`);

            // ── Active order exists → restore it and show live status ────────
            localStorage.setItem('qr_current_order_id', latestOrder.id);
            this.orderService.loadExistingOrder(latestOrder);

            if (loading) await loading.dismiss();
            // Keep isLoading true so it stays full-screen loading until navigation completes
            // Go to order-tracking so they see the live status of their order
            this.router.navigate(['/order-tracking'], { replaceUrl: true });
            return;
          } else {
            this.orderService.sendTelemetry(`WelcomePage: Found PAID/COMPLETED latest order (${latestOrder.id}). Clearing session and routing to /restaurant-home.`);
            // ── Order is Paid → Returning customer, allow fresh order ──
            this.cartService.clearCart();
            localStorage.removeItem('qr_current_order_id');
            // We must clear the current order from the service so the UI doesn't show old state
            if (this.orderService.clearCurrentOrder) {
              this.orderService.clearCurrentOrder();
            }
          }

          if (loading) await loading.dismiss();
          this.router.navigate(['/restaurant-home'], { replaceUrl: true });
          return;
        }
      }

      // ── STEP 3: No prior order found in Firestore, but we still have a UID ──
      // Check if they already told us their name in a previous session.
      // This covers the case where order_history lookup fails or returns nothing
      // (e.g., old orders before the Firebase migration), but the device is clearly
      // a returning customer because we have their UID and saved name.
      const savedName = localStorage.getItem('qr_customer_name');
      if (uid && savedName) {
        // Returning customer — skip the name prompt entirely
        localStorage.setItem('qr_restaurant_name', 'The Grand Kitchen');
        this.cartService.clearCart();
        localStorage.removeItem('qr_current_order_id');
        if (this.orderService.clearCurrentOrder) {
          this.orderService.clearCurrentOrder();
        }
        
        if (loading) await loading.dismiss();
        this.router.navigate(['/restaurant-home'], { replaceUrl: true });
        return;
      }

      // ── Truly brand-new customer (no UID, no saved name) ──────────────
      if (loading) await loading.dismiss();
      this.promptForNameAndEnter(tableNumber, tableId);

    } catch (err) {
      if (loading) await loading.dismiss();
      this.isLoading = false;
      console.error(err);
    }
  }

  async promptForNameAndEnter(tableNumber: string, tableId: string | null) {
    const nameAlert = await this.alertCtrl.create({
      header: 'Welcome!',
      message: 'What is your name? (Optional)',
      inputs: [
        {
          name: 'customerName',
          type: 'text',
          placeholder: 'Enter your name'
        }
      ],
      buttons: [
        {
          text: 'Skip',
          role: 'cancel',
          handler: () => {
            this.enterRestaurant(tableNumber, tableId, 'Guest');
          }
        },
        {
          text: 'Continue',
          handler: (data) => {
            const name = data.customerName?.trim() || 'Guest';
            this.enterRestaurant(tableNumber, tableId, name);
          }
        }
      ]
    });
    await nameAlert.present();
  }

  async enterRestaurant(tableNumber: string, tableId: string | null, customerName: string) {
    let loading: any;
    if (this.isApp) {
      loading = await this.loadingCtrl.create({
        message: 'Loading menu, please wait...',
        spinner: 'crescent'
      });
      await loading.present();
    } else {
      this.isLoading = true; // Show full screen loading
    }

    try {
      localStorage.setItem('qr_table_no', tableNumber);
      if (tableId) {
        localStorage.setItem('qr_table_id', tableId);
      }
      localStorage.setItem('qr_customer_name', customerName);
      localStorage.setItem('qr_restaurant_name', 'The Grand Kitchen');

      // Clear previous session orders
      this.cartService.clearCart();
      localStorage.removeItem('qr_current_order_id');
      if (this.orderService.clearCurrentOrder) {
        this.orderService.clearCurrentOrder();
      }

      // Create fresh order in Firestore if we have the table
      if (tableId) {
        this.orderService.createOrder(tableId, tableNumber, customerName).catch(err => console.error(err));
      }

      if (loading) await loading.dismiss();
      this.router.navigate(['/restaurant-home'], { replaceUrl: true });
    } catch (err) {
      if (loading) await loading.dismiss();
      this.isLoading = false;
      console.error(err);
    }
  }

  goToScanner() {
    this.router.navigate(['/qr-scanner']);
  }

  goToAdmin() {
    this.router.navigate(['/admin-orders']);
  }
}
