import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminQrcodePage } from './admin-qrcode.page';

const routes: Routes = [
  {
    path: '',
    component: AdminQrcodePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminQrcodePageRoutingModule {}
