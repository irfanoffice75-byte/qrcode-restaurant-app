import { Component, OnInit, NgZone } from '@angular/core';
import { AuthService } from './services/auth.service';
import { HttpClient } from '@angular/common/http';
import OneSignal from 'onesignal-cordova-plugin';
import { Capacitor } from '@capacitor/core';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { OrderService } from './services/order.service';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService, 
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController,
    private orderService: OrderService,
    private ngZone: NgZone,
    private swUpdate: SwUpdate
  ) {
    // Check for PWA updates and reload instantly
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.pipe(
        filter(evt => evt.type === 'VERSION_READY')
      ).subscribe(() => {
        console.log('[PWA] New version ready. Reloading automatically...');
        window.location.reload();
      });
    }
  }

  async ngOnInit() {
    await this.authService.signInAnonymously();
    if (Capacitor.isNativePlatform()) {
      this.OneSignalInit();
    } else {
      this.OneSignalWebInit();
    }
    // Foreground popup when a new order arrives (Admin only)
    this.orderService.newOrderReceived$.subscribe(async (order) => {
      // Ensure this only shows if the user is on an admin page!
      // This completely prevents it from showing on the customer website.
      if (this.router.url.includes('admin')) {
        const toast = await this.toastController.create({
          header: 'New Order Received!',
          message: `Table ${order.tableNumber} - ${order.customerName || 'Guest'}\nTotal: $${order.totalPrice.toFixed(2)}`,
          duration: 5000,
          position: 'top',
          color: 'primary',
          buttons: [
            {
              text: 'View',
              handler: () => {
                this.router.navigate(['/admin-orders'], { queryParams: { highlight: order.id } });
              }
            }
          ]
        });
        await toast.present();
      }
    });

    // Foreground popup for specific Customer Notifications (Customer only)
    this.orderService.customerNotification$.subscribe(async (notif) => {
      // Ensure this only shows if the user is NOT on an admin page!
      if (!this.router.url.includes('admin')) {
        const toast = await this.toastController.create({
          header: notif.header,
          message: notif.message,
          duration: 4000,
          position: 'top',
          color: notif.color,
          buttons: [
            {
              text: 'OK',
              role: 'cancel'
            }
          ]
        });
        await toast.present();
      }
    });
  }

  OneSignalInit() {
    OneSignal.initialize("63660bad-8490-48fe-b806-c444ddbc1861");
    OneSignal.Notifications.requestPermission(true).then((success: Boolean) => {
      console.log("Notification permission granted " + success);
    });
    
    // Handle push subscription changes
    OneSignal.User.pushSubscription.addEventListener('change', (event: any) => {
      const playerId = event.current.id;
      if (playerId) {
        this.http.post(`${environment.apiUrl}/devices`, { playerId }).subscribe();
      }
    });

    // Re-register on every app startup if already subscribed
    setTimeout(() => {
      const existingPlayerId = OneSignal.User.pushSubscription.id;
      if (existingPlayerId) {
        this.http.post(`${environment.apiUrl}/devices`, { playerId: existingPlayerId }).subscribe();
      }
    }, 2000); // Give OneSignal time to initialize natively

    // Handle Background Taps
    OneSignal.Notifications.addEventListener('click', (event: any) => {
      this.ngZone.run(() => {
        const data = event.notification.additionalData;
        if (data && data.orderId) {
          this.router.navigate(['/admin-orders'], { queryParams: { highlight: data.orderId } });
        }
      });
    });
  }

  async OneSignalWebInit() {
    (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
    (window as any).OneSignalDeferred.push(async (OneSignal: any) => {

      // Unregister any stale service workers that may conflict with OneSignal
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          // Only unregister non-OneSignal workers that could conflict
          if (reg.active && reg.active.scriptURL.includes('ngsw-worker')) {
            await reg.unregister();
          }
        }
      }

      await OneSignal.init({
        appId: "63660bad-8490-48fe-b806-c444ddbc1861",
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerParam: { scope: '/' },
      });

      // Show Slidedown prompt for new users
      if (OneSignal.Slidedown) {
        OneSignal.Slidedown.promptPush();
      } else if (OneSignal.showNativePrompt) {
        OneSignal.showNativePrompt();
      }

      // Helper: get customerId with retry (fixes race condition where Firebase hasn't resolved yet)
      const getCustomerIdWithRetry = async (): Promise<string | null> => {
        for (let i = 0; i < 10; i++) {
          const id = this.authService.getCurrentUserId();
          if (id) return id;
          await new Promise(r => setTimeout(r, 300)); // wait 300ms and retry
        }
        return null;
      };

      // Helper: register this browser's playerId + customerId with our backend
      const registerDevice = async (playerId: string) => {
        const customerId = await getCustomerIdWithRetry();
        console.log(`[OneSignal] Registering device. playerId=${playerId}, customerId=${customerId}`);
        this.http.post(`${environment.apiUrl}/devices`, { playerId, customerId }).subscribe({
          next: () => console.log('[OneSignal] Device registered successfully.'),
          error: (err) => console.error('[OneSignal] Failed to register device:', err)
        });
      };

      // Listen for new subscriptions (user just clicked Allow)
      OneSignal.User.PushSubscription.addEventListener('change', async (event: any) => {
        if (event.current.optedIn) {
          // Sometimes playerId (id) isn't instantly available when optedIn becomes true
          let newPlayerId = event.current.id;
          let retries = 0;
          while (!newPlayerId && retries < 20) {
            await new Promise(r => setTimeout(r, 200));
            newPlayerId = OneSignal.User.PushSubscription.id;
            retries++;
          }
          if (newPlayerId) {
            await registerDevice(newPlayerId);
          } else {
            console.error('[OneSignal] Could not get playerId after 4 seconds of retrying.');
          }
        }
      });
      
      // Re-register on every page load if already subscribed (keeps customerId fresh)
      const isSubscribed = OneSignal.User.PushSubscription.optedIn;
      let existingPlayerId = OneSignal.User.PushSubscription.id;
      if (isSubscribed) {
        let retries = 0;
        while (!existingPlayerId && retries < 20) {
          await new Promise(r => setTimeout(r, 200));
          existingPlayerId = OneSignal.User.PushSubscription.id;
          retries++;
        }
        if (existingPlayerId) {
          await registerDevice(existingPlayerId);
        }
      }
    });
  }
}
