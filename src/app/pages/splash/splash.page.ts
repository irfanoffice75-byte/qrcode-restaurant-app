import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: false
})
export class SplashPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
    // Preserve any query params (e.g. ?table=1) from the original URL
    // so QR code deep links like /welcome?table=1 still work after the splash
    const params = new URLSearchParams(window.location.search);
    const tableNumber = params.get('table');

    setTimeout(() => {
      if (tableNumber) {
        this.router.navigate(['/welcome'], { queryParams: { table: tableNumber }, replaceUrl: true });
      } else {
        this.router.navigateByUrl('/welcome', { replaceUrl: true });
      }
    }, 2500);
  }

}
