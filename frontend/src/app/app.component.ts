import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
    <!-- Pages publiques : sans sidebar/header -->
    <ng-container *ngIf="pagePublique">
      <router-outlet></router-outlet>
    </ng-container>

    <!-- Application protégée : avec layout complet -->
    <div class="app-layout" *ngIf="!pagePublique">
      <app-sidebar></app-sidebar>
      <div class="app-content-area">
        <app-header></app-header>
        <main class="app-main" [class.fullscreen]="urlActuelle.includes('/gps')">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .app-layout { display:flex; min-height:100vh; background:#f1f5f9; }
    .app-content-area { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
    .app-main { flex:1; overflow-y:auto; padding:28px 32px; height: 100%; }
    .app-main.fullscreen { padding: 0; overflow: hidden; }
    .app-main app-gps-carte { display: flex; height: 100%; width: 100%; }
    @media (max-width:768px) { .app-main { padding:16px; } }
  `]
})
export class AppComponent implements OnInit {
  pagePublique = true;
  urlActuelle = '';

  // Routes sans sidebar/header
  private readonly routesPubliques = ['/', '/login', '/inscription', ''];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.verifierRoute(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.verifierRoute(e.urlAfterRedirects));
  }


  private verifierRoute(url: string): void {
  const chemin = url.split('?')[0];
  this.urlActuelle = chemin;
  
  const routesSansLayout = ['/', '/login', '/inscription', '', '/attente-approbation', '/demande-rejetee'];
  const estClientDashboard = chemin.startsWith('/client-dashboard');
  
  this.pagePublique = routesSansLayout.includes(chemin) || estClientDashboard;
}
}