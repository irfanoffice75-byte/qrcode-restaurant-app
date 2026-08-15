import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FoodDetailsPage } from './food-details.page';

describe('FoodDetailsPage', () => {
  let component: FoodDetailsPage;
  let fixture: ComponentFixture<FoodDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FoodDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
