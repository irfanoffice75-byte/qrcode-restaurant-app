import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminMenuPage } from './admin-menu.page';

describe('AdminMenuPage', () => {
  let component: AdminMenuPage;
  let fixture: ComponentFixture<AdminMenuPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminMenuPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
