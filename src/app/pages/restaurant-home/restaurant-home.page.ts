import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenuService } from '../../services/menu.service';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Category, MenuItem } from '../../models/menu.model';
import { Order, OrderHistory } from '../../models/order.model';

@Component({
  selector: 'app-restaurant-home',
  templateUrl: './restaurant-home.page.html',
  styleUrls: ['./restaurant-home.page.scss'],
  standalone: false
})
export class RestaurantHomePage implements OnInit, OnDestroy {

  restaurantName = 'Foodie Palace';
  tableNumber = '';
  
  categories: Category[] = [];
  allMenuItems: MenuItem[] = [];
  displayedMenuItems: MenuItem[] = [];
  
  selectedCategoryId: string = 'all';
  searchQuery: string = '';
  
  cartItemCount: number = 0;
  cartItems: any[] = [];
  
  currentOrder: Order | null = null;

  showHistoryModal = false;
  orderHistory: OrderHistory[] = [];
  historyLoading = false;

  private cartSub!: Subscription;
  private orderSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private menuService: MenuService,
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.tableNumber = localStorage.getItem('qr_table_no') || '';
    this.restaurantName = localStorage.getItem('qr_restaurant_name') || 'The Grand Kitchen';

    this.menuService.getCategories().subscribe(cats => {
      this.categories = cats;
      this.cdr.detectChanges();
    });

    this.menuService.getMenuItems().subscribe(items => {
      this.allMenuItems = items;
      this.displayedMenuItems = [...items];
      this.cdr.detectChanges();
    });

    this.cartSub = this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
      this.cdr.detectChanges();
    });
    
    this.orderSub = this.orderService.currentOrder$.subscribe(order => {
      this.currentOrder = order;
      this.cdr.detectChanges();
    });
  }
  
  ngOnDestroy() {
    if (this.cartSub) {
      this.cartSub.unsubscribe();
    }
    if (this.orderSub) {
      this.orderSub.unsubscribe();
    }
  }

  goToTracking() {
    this.router.navigate(['/order-tracking']);
  }

  selectCategory(categoryId: string) {
    this.selectedCategoryId = categoryId;
    this.filterItems();
  }

  onSearch(event: any) {
    this.searchQuery = event.target.value?.toLowerCase() || '';
    this.filterItems();
  }

  filterItems() {
    let filtered = this.allMenuItems;
    
    if (this.selectedCategoryId !== 'all') {
      filtered = filtered.filter(item => item.categoryId === this.selectedCategoryId);
    }
    
    if (this.searchQuery.trim() !== '') {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(this.searchQuery) ||
        item.description.toLowerCase().includes(this.searchQuery)
      );
    }
    
    this.displayedMenuItems = filtered;
    this.cdr.detectChanges();
  }

  goToDetails(item: MenuItem) {
    this.router.navigate(['/food-details'], { queryParams: { id: item.id } });
  }

  quickAdd(item: MenuItem, event: Event) {
    event.stopPropagation();
    this.cartService.addToCart(item, 1);
  }

  getItemQuantity(item: MenuItem): number {
    const cartItem = this.cartItems.find(c => c.menuItem.id === item.id);
    return cartItem ? cartItem.quantity : 0;
  }

  updateQuantity(item: MenuItem, delta: number, event: Event) {
    event.stopPropagation();
    const currentQty = this.getItemQuantity(item);
    if (currentQty + delta > 0) {
      this.cartService.updateQuantity(item.id, currentQty + delta);
    } else {
      this.cartService.removeItem(item.id);
    }
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  async openHistory() {
    this.showHistoryModal = true;
    this.historyLoading = true;
    this.orderHistory = [];
    this.cdr.detectChanges(); // Force UI update immediately

    try {
      const uid = this.authService.getSavedUid();
      if (uid) {
        this.orderHistory = await this.orderService.getOrderHistoryByUid(uid);
      }
    } catch (e) {
      console.error('History load error', e);
    } finally {
      this.historyLoading = false;
      this.cdr.detectChanges(); // Force UI update after loading finishes
    }
  }

  closeHistory() {
    this.showHistoryModal = false;
    this.cdr.detectChanges();
  }
}
