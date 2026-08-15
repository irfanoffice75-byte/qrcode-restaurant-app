import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminBillsPage } from './admin-bills.page';

const routes: Routes = [
  {
    path: '',
    component: AdminBillsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminBillsPageRoutingModule {}
