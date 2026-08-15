import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RestaurantHomePage } from './restaurant-home.page';

describe('RestaurantHomePage', () => {
  let component: RestaurantHomePage;
  let fixture: ComponentFixture<RestaurantHomePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RestaurantHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
