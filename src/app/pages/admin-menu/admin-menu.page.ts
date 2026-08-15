import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenuService } from '../../services/menu.service';
import { Category, MenuItem } from '../../models/menu.model';
import { ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-admin-menu',
  templateUrl: './admin-menu.page.html',
  styleUrls: ['./admin-menu.page.scss'],
  standalone: false
})
export class AdminMenuPage implements OnInit, OnDestroy {

  categories: Category[] = [];
  menuItems: MenuItem[] = [];
  
  private catSub!: Subscription;
  private menuSub!: Subscription;
  
  // UI State
  currentView: 'items' | 'categories' = 'items';
  showForm: boolean = false;
  showCategoryForm: boolean = false;

  // Category Model
  newCategory = {
    name: '',
    icon: 'fast-food-outline'
  };
  
  // Form Model
  newItem: Omit<MenuItem, 'id'> = {
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    categoryId: '',
    isVeg: true,
    rating: 5.0
  };

  constructor(
    private menuService: MenuService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.catSub = this.menuService.getCategories().subscribe(cats => {
      this.categories = cats;
      if (this.categories.length > 0) {
        this.newItem.categoryId = this.categories[0].id; // default category
      }
    });
    
    this.menuSub = this.menuService.getMenuItems().subscribe(items => {
      this.menuItems = items;
    });
  }

  ngOnDestroy() {
    if (this.catSub) this.catSub.unsubscribe();
    if (this.menuSub) this.menuSub.unsubscribe();
  }
  
  toggleForm() {
    this.showForm = !this.showForm;
  }

  toggleCategoryForm() {
    this.showCategoryForm = !this.showCategoryForm;
  }

  getCategoryName(id: string): string {
    const cat = this.categories.find(c => c.id === id);
    return cat ? cat.name : 'Unknown';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newItem.imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.newItem.imageUrl = '';
  }

  async saveItem() {
    if (!this.newItem.categoryId) {
      const toast = await this.toastCtrl.create({
        message: 'Please select a Category. If the list is empty, create a Category first!',
        duration: 3000,
        color: 'warning'
      });
      toast.present();
      return;
    }

    if (!this.newItem.name || !this.newItem.description || !this.newItem.price || !this.newItem.imageUrl) {
      const toast = await this.toastCtrl.create({
        message: 'Please fill out all fields',
        duration: 2000,
        color: 'danger'
      });
      toast.present();
      return;
    }
    
    // Ensure price is a number
    this.newItem.price = Number(this.newItem.price);
    
    this.menuService.addMenuItem(this.newItem).subscribe(async () => {
      const toast = await this.toastCtrl.create({
        message: 'Item added successfully!',
        duration: 2000,
        color: 'success'
      });
      toast.present();
      
      // Reset form
      this.newItem = {
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        categoryId: this.categories[0]?.id || '',
        isVeg: true,
        rating: 5.0
      };
      this.showForm = false;
    }, async (err) => {
      console.error(err);
      const toast = await this.toastCtrl.create({
        message: 'Failed to save item to database.',
        duration: 3000,
        color: 'danger'
      });
      toast.present();
    });
  }

  async deleteItem(item: MenuItem) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Item',
      message: `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.menuService.deleteMenuItem(item.id).subscribe(async () => {
              const toast = await this.toastCtrl.create({
                message: `"${item.name}" deleted successfully.`,
                duration: 2000,
                color: 'success'
              });
              toast.present();
            }, async (err) => {
              console.error(err);
              const toast = await this.toastCtrl.create({
                message: 'Failed to delete item.',
                duration: 3000,
                color: 'danger'
              });
              toast.present();
            });
          }
        }
      ]
    });
    await alert.present();
  }

  goBack() {
    this.router.navigate(['/admin-orders']);
  }

  async saveCategory() {
    if (!this.newCategory.name) {
      const toast = await this.toastCtrl.create({
        message: 'Please enter a category name',
        duration: 2000,
        color: 'danger'
      });
      toast.present();
      return;
    }

    this.menuService.addCategory(this.newCategory).subscribe(async () => {
      const toast = await this.toastCtrl.create({
        message: 'Category added successfully!',
        duration: 2000,
        color: 'success'
      });
      toast.present();
      
      this.newCategory = { name: '', icon: 'fast-food-outline' };
      this.showCategoryForm = false;
    }, async (err) => {
      console.error(err);
      const toast = await this.toastCtrl.create({
        message: 'Failed to add category.',
        duration: 3000,
        color: 'danger'
      });
      toast.present();
    });
  }

  async deleteCategory(cat: Category) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Category',
      message: `Are you sure you want to delete "${cat.name}"? Ensure there are no food items using this category!`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            if (cat.id) {
              this.menuService.deleteCategory(cat.id).subscribe(async () => {
                const toast = await this.toastCtrl.create({
                  message: `"${cat.name}" deleted successfully.`,
                  duration: 2000,
                  color: 'success'
                });
                toast.present();
              }, async (err) => {
                console.error(err);
                const toast = await this.toastCtrl.create({
                  message: 'Failed to delete category. It might be in use.',
                  duration: 3000,
                  color: 'danger'
                });
                toast.present();
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
