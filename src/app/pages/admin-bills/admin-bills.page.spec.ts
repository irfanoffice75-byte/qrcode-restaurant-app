import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminBillsPage } from './admin-bills.page';

describe('AdminBillsPage', () => {
  let component: AdminBillsPage;
  let fixture: ComponentFixture<AdminBillsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminBillsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
