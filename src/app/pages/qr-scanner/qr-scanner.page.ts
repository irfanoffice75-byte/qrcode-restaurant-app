import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.page.html',
  styleUrls: ['./qr-scanner.page.scss'],
  standalone: false
})
export class QrScannerPage {

  isScanning = false;

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private ngZone: NgZone
  ) { }

  onScanSuccess(result: string) {
    if (!this.isScanning) return;
    
    this.isScanning = false;
    let tableNo = '1'; // Default
    
    // Parse result if it's a URL
    if (result.includes('table=')) {
      const urlParams = new URLSearchParams(result.split('?')[1]);
      tableNo = urlParams.get('table') || '1';
    } else {
      tableNo = result; // Assuming raw text is the table number
    }
    
    this.promptForNameAndEnter(tableNo);
  }

  simulateScan() {
    this.isScanning = true;
    setTimeout(() => {
      this.onScanSuccess('table=5');
    }, 0);
  }

  async promptForNameAndEnter(tableNumber: string) {
    const alert = await this.alertCtrl.create({
      header: 'Scan Successful!',
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
            this.enterRestaurant(tableNumber, 'Guest');
          }
        },
        {
          text: 'Continue',
          handler: (data) => {
            const name = data.customerName?.trim() || 'Guest';
            this.enterRestaurant(tableNumber, name);
          }
        }
      ]
    });
    await alert.present();
  }

  enterRestaurant(tableNumber: string, customerName: string) {
    localStorage.setItem('qr_table_no', tableNumber);
    localStorage.setItem('qr_customer_name', customerName);
    localStorage.setItem('qr_restaurant_name', 'The Grand Kitchen');
    this.ngZone.run(() => {
      this.router.navigate(['/restaurant-home'], { replaceUrl: true });
    });
  }

  goBack() {
    this.router.navigate(['/welcome']);
  }
}
