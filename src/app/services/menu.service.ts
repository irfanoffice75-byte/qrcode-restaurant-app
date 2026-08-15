import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Category, MenuItem } from '../models/menu.model';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = environment.apiUrl;
  
  private categories = new BehaviorSubject<Category[]>([]);
  private menuItems = new BehaviorSubject<MenuItem[]>([]);
  
  public categories$ = this.categories.asObservable();
  public menuItems$ = this.menuItems.asObservable();
  
  private socket: Socket;

  constructor(private http: HttpClient) {
    this.socket = io(environment.socketUrl);
    
    // Listen for realtime menu changes
    this.socket.on('menu_updated', () => {
      this.refreshData();
    });

    this.loadData();
  }

  private loadData() {
    this.http.get<Category[]>(`${this.apiUrl}/categories`).subscribe(
      cats => this.categories.next(cats),
      err => console.error('Failed to load categories:', err)
    );
    this.http.get<MenuItem[]>(`${this.apiUrl}/menu`).subscribe(
      items => this.menuItems.next(items),
      err => console.error('Failed to load menu items:', err)
    );
  }

  refreshData() {
    this.loadData();
  }

  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  addCategory(category: { name: string, icon: string }): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, category).pipe(
      tap(newCategory => {
        const currentCats = this.categories.getValue();
        this.categories.next([...currentCats, newCategory]);
      })
    );
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`).pipe(
      tap(() => {
        const currentCats = this.categories.getValue();
        this.categories.next(currentCats.filter(c => c.id !== id));
      })
    );
  }

  getMenuItems(): Observable<MenuItem[]> {
    return this.menuItems$;
  }

  getMenuItemsByCategory(categoryId: string): Observable<MenuItem[]> {
    if (categoryId === 'all') {
      return this.menuItems$;
    }
    return this.menuItems$.pipe(
      map(items => items.filter(item => item.categoryId === categoryId))
    );
  }

  getMenuItemById(id: string): Observable<MenuItem | undefined> {
    return this.menuItems$.pipe(
      map(items => items.find(item => item.id === id))
    );
  }

  addMenuItem(item: Omit<MenuItem, 'id'>): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${this.apiUrl}/menu`, item).pipe(
      tap(newItem => {
        const currentItems = this.menuItems.getValue();
        this.menuItems.next([...currentItems, newItem]);
      })
    );
  }

  deleteMenuItem(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/menu/${id}`).pipe(
      tap(() => {
        const currentItems = this.menuItems.getValue();
        this.menuItems.next(currentItems.filter(item => item.id !== id));
      })
    );
  }
}
