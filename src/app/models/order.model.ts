import { CartItem } from './cart.model';

export type OrderStatus =
  | 'active'
  | 'Pending'
  | 'Order Placed'
  | 'Accepted'
  | 'Preparing'
  | 'Ready'
  | 'Served'
  | 'Paid'
  | 'Completed';

export interface Order {
  id: string;
  tableId?: string;          // Firestore doc ID of the table
  tableNumber: string;
  customerName?: string;
  customerId?: string | null;
  items: CartItem[];
  subtotal: number;          // before tax
  totalPrice: number;        // final total (live recalculated)
  status: OrderStatus;
  createdAt: Date;
  completedAt?: Date;
  paymentStatus?: 'paid' | 'unpaid';
}

export interface OrderHistory {
  orderId: string;
  tableNumber: string;
  customerName?: string;
  customerId?: string | null;
  items: CartItem[];
  finalTotal: number;
  paymentStatus: string;
  createdAt: Date;
  completedAt: Date;
}
