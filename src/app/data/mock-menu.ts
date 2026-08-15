import { Category, MenuItem } from '../models/menu.model';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Pizza', icon: 'pizza-outline' },
  { id: 'c2', name: 'Burgers', icon: 'fast-food-outline' },
  { id: 'c3', name: 'Biryani', icon: 'restaurant-outline' },
  { id: 'c4', name: 'Chinese', icon: 'nutrition-outline' },
  { id: 'c5', name: 'Desserts', icon: 'ice-cream-outline' },
  { id: 'c6', name: 'Drinks', icon: 'cafe-outline' }
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    categoryId: 'c1',
    name: 'Margherita Pizza',
    description: 'Classic delight with 100% real mozzarella cheese.',
    price: 12.99,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=600&auto=format&fit=crop',
    rating: 4.5,
    isVeg: true
  },
  {
    id: 'm2',
    categoryId: 'c1',
    name: 'Pepperoni Pizza',
    description: 'Pepperoni, cheese and tomato sauce.',
    price: 14.99,
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=600&auto=format&fit=crop',
    rating: 4.8,
    isVeg: false
  },
  {
    id: 'm3',
    categoryId: 'c2',
    name: 'Classic Cheeseburger',
    description: 'Juicy beef patty with melted cheese, lettuce, and tomato.',
    price: 8.99,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop',
    rating: 4.6,
    isVeg: false
  },
  {
    id: 'm4',
    categoryId: 'c3',
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice cooked with tender chicken and spices.',
    price: 11.99,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop',
    rating: 4.9,
    isVeg: false
  },
  {
    id: 'm5',
    categoryId: 'c4',
    name: 'Hakka Noodles',
    description: 'Stir-fried noodles with crisp vegetables and soy sauce.',
    price: 9.99,
    imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=600&auto=format&fit=crop',
    rating: 4.3,
    isVeg: true
  },
  {
    id: 'm6',
    categoryId: 'c5',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a gooey molten center.',
    price: 6.99,
    imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=600&auto=format&fit=crop',
    rating: 4.7,
    isVeg: true
  },
  {
    id: 'm7',
    categoryId: 'c6',
    name: 'Fresh Lime Soda',
    description: 'Refreshing drink made with fresh lime juice, soda, and mint.',
    price: 3.99,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop',
    rating: 4.4,
    isVeg: true
  }
];
