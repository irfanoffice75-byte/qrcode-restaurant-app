import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { TableService, TableQR } from '../../services/table.service';
import { Filesystem, Directory } from '@capacitor/filesystem';

@Component({
  selector: 'app-admin-qrcode',
  templateUrl: './admin-qrcode.page.html',
  styleUrls: ['./admin-qrcode.page.scss'],
  standalone: false
})
export class AdminQrcodePage implements OnInit, OnDestroy {
  serverUrl: string = '';
  tables: TableQR[] = [];
  private sub!: Subscription;

  constructor(
    private router: Router,
    private tableService: TableService,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.serverUrl = this.tableService.getServerUrl();
    this.sub = this.tableService.tables$.subscribe(data => {
      this.tables = data;
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
  
  updateServerUrl() {
    this.tableService.updateServerUrl(this.serverUrl);
  }

  async addTable() {
    const addAlert = await this.alertCtrl.create({
      header: 'Enter Table Number',
      message: 'What number should this table be?',
      inputs: [
        {
          name: 'tableNumber',
          type: 'number',
          placeholder: 'e.g. 1, 2, 3...',
          min: 1
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Create',
          handler: async (data) => {
            const num = data.tableNumber?.toString().trim();
            if (!num || isNaN(parseInt(num))) {
              return false; // keep alert open
            }
            // Check if this table number already exists
            const exists = this.tables.some(t => t.tableNumber === num);
            if (exists) {
              const errAlert = await this.alertCtrl.create({
                header: 'Duplicate Table',
                message: 'Table ' + num + ' already exists! Choose a different number.',
                buttons: ['OK']
              });
              await errAlert.present();
              return false;
            }
            try {
              await this.tableService.addTableWithNumber(num);
            } catch (err) {
              console.error('Failed to create table in Firebase:', err);
              const errAlert = await this.alertCtrl.create({
                header: 'Database Error',
                message: 'Failed to create QR code. Please check your connection.',
                buttons: ['OK']
              });
              await errAlert.present();
            }
            return true;
          }
        }
      ]
    });
    await addAlert.present();
  }


  async deleteAllTables() {
    if (this.tables.length === 0) return;
    const alert = await this.alertCtrl.create({
      header: 'Delete All Tables?',
      message: 'This will permanently delete ALL table QR codes. This cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete All',
          role: 'destructive',
          handler: async () => {
            for (const table of this.tables) {
              if (table.id) {
                await this.tableService.deleteTable(table.id);
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async editTable(table: TableQR) {
    const alert = await this.alertCtrl.create({
      header: 'Edit Table Number',
      inputs: [
        {
          name: 'tableNumber',
          type: 'text',
          value: table.tableNumber,
          placeholder: 'Enter new table number'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: (data) => {
            if (data.tableNumber && table.id) {
              this.tableService.updateTableNumber(table.id, data.tableNumber);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteTable(table: TableQR) {
    if (!table.id) return;
    
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete the QR code for Table ${table.tableNumber}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.tableService.deleteTable(table.id as string);
          }
        }
      ]
    });
    await alert.present();
  }

  async downloadQR(table: TableQR) {
    if (!table.qrImageUrl) return;
    
    try {
      // 1. Fetch the image as a Blob
      const response = await fetch(table.qrImageUrl);
      const blob = await response.blob();
      
      // 2. Convert Blob to Base64
      const base64Data = await this.convertBlobToBase64(blob) as string;
      
      // 3. Save it to the device's Documents directory using Capacitor Filesystem
      const fileName = `table-${table.tableNumber || 'qr'}.png`;
      
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents
      });
      
      const successAlert = await this.alertCtrl.create({
        header: 'Download Complete',
        message: `QR Code saved to Documents folder as ${fileName}`,
        buttons: ['OK']
      });
      await successAlert.present();
    } catch (error: any) {
      console.error('Error downloading QR Code:', error);
      const errorAlert = await this.alertCtrl.create({
        header: 'Download Failed',
        message: 'Could not save QR code: ' + error.message,
        buttons: ['OK']
      });
      await errorAlert.present();
    }
  }

  private convertBlobToBase64(blob: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  }

  goBack() {
    this.router.navigate(['/admin-orders']);
  }
}
