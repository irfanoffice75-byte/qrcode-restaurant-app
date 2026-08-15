import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { MenuService } from '../../services/menu.service';
import { CartService } from '../../services/cart.service';
import { MenuItem } from '../../models/menu.model';

@Component({
  selector: 'app-food-details',
  templateUrl: './food-details.page.html',
  styleUrls: ['./food-details.page.scss'],
  standalone: false
})
export class FoodDetailsPage implements OnInit {

  menuItem?: MenuItem;
  quantity: number = 1;
  specialInstructions: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private menuService: MenuService,
    private cartService: CartService,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.menuService.getMenuItemById(id).subscribe(item => {
          if (item) {
            this.menuItem = item;
          } else {
            this.goBack();
          }
        });
      }
    });
  }

  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  async addToCart() {
    if (this.menuItem) {
      this.cartService.addToCart(this.menuItem, this.quantity, this.specialInstructions);
      
      const alert = await this.alertController.create({
        header: 'Added to Cart',
        message: 'Do you want to proceed to checkout or add more items?',
        buttons: [
          {
            text: 'Add More Items',
            role: 'cancel',
            handler: () => {
              this.router.navigate(['/restaurant-home']);
            }
          },
          {
            text: 'Go to Cart',
            handler: () => {
              this.router.navigate(['/cart']);
            }
          }
        ]
      });

      await alert.present();
    }
  }

  goBack() {
    this.router.navigate(['/restaurant-home']);
  }

  get totalPrice(): number {
    return (this.menuItem?.price || 0) * this.quantity;
  }
}
