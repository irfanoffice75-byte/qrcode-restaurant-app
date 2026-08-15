import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminOrdersPage } from './admin-orders.page';

describe('AdminOrdersPage', () => {
  let component: AdminOrdersPage;
  let fixture: ComponentFixture<AdminOrdersPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
