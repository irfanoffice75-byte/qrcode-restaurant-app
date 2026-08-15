import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminBillsPageRoutingModule } from './admin-bills-routing.module';

import { AdminBillsPage } from './admin-bills.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminBillsPageRoutingModule
  ],
  declarations: [AdminBillsPage]
})
export class AdminBillsPageModule {}
