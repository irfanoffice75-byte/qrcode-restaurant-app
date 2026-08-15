import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import * as QRCode from 'qrcode';
import { environment } from '../../environments/environment';

export interface TableQR {
  id?: string;
  tableNumber: string;
  url: string;
  qrImageUrl: string;
  status?: 'available' | 'occupied';
}

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private http: HttpClient = inject(HttpClient);
  private tables = new BehaviorSubject<TableQR[]>([]);
  public tables$ = this.tables.asObservable();
  
  private serverUrl = environment.socketUrl;
  private apiUrl = environment.apiUrl;
  private socket: Socket;

  constructor() {
    this.socket = io(this.serverUrl);
    
    // Initial load
    this.refreshTables();

    // Listen for realtime Socket.io updates instead of Firebase
    this.socket.on('tables_updated', () => {
      this.refreshTables();
    });
  }

  private refreshTables() {
    this.http.get<TableQR[]>(`${this.apiUrl}/tables`).subscribe(tables => {
      // Sort numerically by table number
      const sorted = tables.sort((a, b) => {
        const numA = parseInt(a.tableNumber, 10);
        const numB = parseInt(b.tableNumber, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.tableNumber.localeCompare(b.tableNumber);
      });
      this.tables.next(sorted);
    }, err => {
      console.error('Failed to load tables:', err);
    });
  }

  public getTables(): TableQR[] {
    return this.tables.getValue();
  }

  public async updateServerUrl(url: string) {
    this.serverUrl = url;
    localStorage.setItem('qr_server_url', url);
    
    // Auto-update all existing tables' URLs and QR codes
    const current = this.tables.getValue();
    for (let t of current) {
      if (t.id) {
        const updated = await this.regenerateQR({ ...t });
        this.http.put(`${this.apiUrl}/tables/${t.id}`, updated).subscribe();
      }
    }
  }

  public getServerUrl(): string {
    return this.serverUrl;
  }

  public async addTableWithNumber(tableNumber: string) {
    const newTable: TableQR = {
      tableNumber: tableNumber,
      url: '',
      qrImageUrl: '',
      status: 'available'
    };
    const generatedTable = await this.regenerateQR(newTable);
    
    // Persist via Node.js API
    this.http.post(`${this.apiUrl}/tables`, generatedTable).subscribe(
      () => {},
      (err) => console.error('Error adding table:', err)
    );
  }

  public async addTable() {
    const current = this.tables.getValue();
    let nextNum = 1;

    current.forEach(t => {
      const num = parseInt(t.tableNumber, 10);
      if (!isNaN(num) && num >= nextNum) {
        nextNum = num + 1;
      }
    });

    const newTable: TableQR = {
      tableNumber: nextNum.toString(),
      url: '',
      qrImageUrl: '',
      status: 'available'
    };

    const generatedTable = await this.regenerateQR(newTable);
    this.http.post(`${this.apiUrl}/tables`, generatedTable).subscribe(
      () => {},
      (err) => console.error('Error adding table:', err)
    );
  }

  public async updateTableNumber(id: string, newNumber: string) {
    const current = this.tables.getValue();
    const table = current.find(t => t.id === id);
    if (table) {
      const tempTable = { ...table, tableNumber: newNumber };
      const updated = await this.regenerateQR(tempTable);
      this.http.put(`${this.apiUrl}/tables/${id}`, updated).subscribe(
        () => {},
        (err) => console.error('Error updating table:', err)
      );
    }
  }

  public async deleteTable(id: string) {
    this.http.delete(`${this.apiUrl}/tables/${id}`).subscribe(
      () => {},
      (err) => console.error('Error deleting table:', err)
    );
  }

  private async regenerateQR(table: TableQR): Promise<TableQR> {
    const targetUrl = `${this.serverUrl}/welcome?table=${table.tableNumber}`;
    table.url = targetUrl;
    try {
      table.qrImageUrl = await QRCode.toDataURL(targetUrl, { width: 600, margin: 2 });
    } catch (e) {
      table.qrImageUrl = '';
    }
    return table;
  }
}
