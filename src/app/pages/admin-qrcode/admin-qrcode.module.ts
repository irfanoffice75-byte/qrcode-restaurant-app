import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminQrcodePageRoutingModule } from './admin-qrcode-routing.module';

import { AdminQrcodePage } from './admin-qrcode.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminQrcodePageRoutingModule
  ],
  declarations: [AdminQrcodePage]
})
export class AdminQrcodePageModule {}
