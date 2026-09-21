import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  template: `
    <header class="header" [class.header--scrolled]="scrolled">

      <!-- ── LEFT ─────────────────────────────── -->
      <div class="header__left">
        <button class="menu-btn grpo-btn grpo-btn--ghost grpo-btn--icon" (click)="toggleSidebar.emit()">
          <mat-icon>menu</mat-icon>
        </button>

        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a class="breadcrumb__home" routerLink="/dashboard">
            <mat-icon>home</mat-icon>
          </a>
          <span class="breadcrumb__sep">
            <mat-icon>chevron_right</mat-icon>
          </span>
          <span class="breadcrumb__current">{{ currentPageTitle }}</span>
        </nav>
      </div>

      <!-- ── CENTER : SEARCH ───────────────────── -->
      <div class="header__center">
        <div class="global-search" [class.global-search--active]="searchOpen" (click)="openSearch()">
          <mat-icon class="search-icon">search</mat-icon>
          <input #searchInput
                 class="search-input"
                 [(ngModel)]="searchQuery"
                 (input)="onSearch()"
                 (keydown.escape)="closeSearch()"
                 placeholder="Rechercher clients, commandes, tournées..."
                 [attr.aria-label]="'Recherche globale'">
          <kbd class="search-kbd">Ctrl+K</kbd>
        </div>

        <!-- Search Dropdown -->
        <div class="search-dropdown" *ngIf="searchOpen && searchQuery.length > 0">
          <div class="search-category" *ngFor="let cat of searchResults">
            <div class="search-category__label">{{ cat.label }}</div>
            <a *ngFor="let item of cat.items" class="search-result" (click)="navigateTo(item.route)">
              <mat-icon class="search-result__icon">{{ item.icon }}</mat-icon>
              <span class="search-result__text" [innerHTML]="highlight(item.text)"></span>
              <span class="search-result__badge">{{ cat.label }}</span>
            </a>
          </div>
          <div *ngIf="!searchResults.length" class="search-empty">
            <mat-icon>search_off</mat-icon>
            <span>Aucun résultat pour "<strong>{{ searchQuery }}</strong>"</span>
          </div>
        </div>
      </div>

      <!-- ── RIGHT ─────────────────────────────── -->
      <div class="header__right">

        <!-- Live indicator -->
        <div class="live-pill">
          <span class="live-dot"></span>
          <span>Live</span>
        </div>

        <!-- Notifications -->
        <button class="notif-btn grpo-btn grpo-btn--ghost grpo-btn--icon"
                style="position:relative"
                [matMenuTriggerFor]="notifMenu"
                matTooltip="Notifications">
          <mat-icon>notifications</mat-icon>
          <span class="notif-badge" *ngIf="notifCount > 0">{{ notifCount }}</span>
        </button>

        <mat-menu #notifMenu="matMenu" class="notif-menu-panel">
          <div class="notif-header">
            <span>Notifications</span>
            <button mat-button class="notif-clear" (click)="clearNotifs()">Tout effacer</button>
          </div>
          <div *ngFor="let n of notifications" class="notif-item" [class.notif-item--unread]="!n.read">
            <div class="notif-item__icon" [ngClass]="'notif-icon--' + n.type">
              <mat-icon>{{ n.icon }}</mat-icon>
            </div>
            <div class="notif-item__body">
              <div class="notif-item__text">{{ n.message }}</div>
              <div class="notif-item__time">{{ n.time }}</div>
            </div>
          </div>
        </mat-menu>

        <!-- Profile -->
        <button class="profile-btn" [matMenuTriggerFor]="profileMenu">
          <div class="avatar">
            <span>{{ userInitials }}</span>
          </div>
          <div class="profile-info">
            <span class="profile-name">{{ userName }}</span>
            <span class="profile-role">Administrateur</span>
          </div>
          <mat-icon class="profile-chevron">expand_more</mat-icon>
        </button>

        <mat-menu #profileMenu="matMenu">
          <div class="profile-menu-header">
            <div class="avatar avatar--lg"><span>{{ userInitials }}</span></div>
            <div>
              <div style="font-weight:600;font-size:14px;color:var(--c-text-primary)">{{ userName }}</div>
              <div style="font-size:12px;color:var(--c-text-muted)">admin&#64;grpo.tn</div>
            </div>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item><mat-icon>person</mat-icon> Mon profil</button>
          <button mat-menu-item><mat-icon>settings</mat-icon> Paramètres</button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()" style="color:var(--c-error)">
            <mat-icon style="color:var(--c-error)">logout</mat-icon> Déconnexion
          </button>
        </mat-menu>

      </div>
    </header>

    <!-- Search backdrop -->
    <div class="search-backdrop" *ngIf="searchOpen" (click)="closeSearch()"></div>
  `,
  styles: [`
    :host { display: block; position: sticky; top: 0; z-index: 100; }

    .header {
      display: flex; align-items: center; gap: var(--sp-4);
      height: var(--header-h);
      padding: 0 var(--sp-6);
      background: rgba(8, 14, 23, 0.8);
      backdrop-filter: blur(20px) saturate(1.5);
      border-bottom: 1px solid var(--c-border);
      transition: border-color var(--t-base), box-shadow var(--t-base);
    }

    .header--scrolled {
      border-bottom-color: rgba(255,255,255,0.1);
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    }

    /* Left */
    .header__left { display: flex; align-items: center; gap: var(--sp-3); }

    .menu-btn mat-icon { color: var(--c-text-secondary); }

    .breadcrumb {
      display: flex; align-items: center; gap: 2px;
      font-size: var(--text-sm);
      color: var(--c-text-muted);
    }

    .breadcrumb__home { 
      display: flex; 
      color: var(--c-text-muted); 
    }

    .breadcrumb__home mat-icon { 
      font-size: 16px; 
      width: 16px; 
      height: 16px; 
    }

    .breadcrumb__sep { 
      display: flex; 
    }

    .breadcrumb__sep mat-icon { 
      font-size: 16px; 
      width: 16px; 
      height: 16px; 
      opacity: .4; 
    }

    .breadcrumb__current { 
      color: var(--c-text-secondary); 
      font-weight: var(--fw-medium); 
    }

    /* Center / Search */
    .header__center { flex: 1; max-width: 480px; position: relative; }

    .global-search {
      display: flex; align-items: center; gap: var(--sp-2);
      background: var(--c-bg-input);
      border: 1px solid var(--c-border);
      border-radius: var(--r-sm);
      padding: 0 var(--sp-3);
      height: 38px;
      cursor: text;
      transition: border-color var(--t-base), box-shadow var(--t-base);
    }

    .global-search--active {
      border-color: var(--c-orange-500);
      box-shadow: 0 0 0 3px rgba(230,126,34,0.12);
    }

    .search-icon { color: var(--c-text-muted); font-size: 18px; width:18px;height:18px; flex-shrink:0; }
    
    .search-input {
      flex: 1; background: none; border: none; outline: none;
      color: var(--c-text-primary); font-size: var(--text-sm); font-family: var(--font-body);
    }
    
    .search-input::placeholder { color: var(--c-text-muted); }
    
    .search-kbd {
      font-family: var(--font-mono); font-size: 10px;
      background: var(--c-bg-hover); color: var(--c-text-muted);
      border: 1px solid var(--c-border); border-radius: var(--r-xs);
      padding: 2px 6px; white-space: nowrap; flex-shrink: 0;
    }

    .search-dropdown {
      position: absolute; top: calc(100% + 8px); left: 0; right: 0;
      background: var(--c-bg-overlay);
      border: 1px solid var(--c-border-hover);
      border-radius: var(--r-md);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      animation: scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
      z-index: 200;
    }
    
    .search-category__label {
      font-size: 10px; font-weight: var(--fw-semibold); letter-spacing:.08em; text-transform:uppercase;
      color: var(--c-text-muted); padding: 8px 12px 4px;
    }
    
    .search-result {
      display: flex; align-items: center; gap: var(--sp-3);
      padding: 8px 12px; cursor: pointer;
      text-decoration: none; color: var(--c-text-primary);
      transition: background var(--t-fast);
    }
    
    .search-result:hover { background: var(--c-bg-hover); }
    
    .search-result__icon { 
      font-size:16px; 
      width:16px;
      height:16px; 
      color:var(--c-text-muted); 
      flex-shrink:0; 
    }
    
    .search-result__text { 
      flex:1; 
      font-size:var(--text-sm); 
    }
    
    .search-result__badge { 
      font-size:10px; 
      background:var(--c-bg-hover); 
      color:var(--c-text-muted); 
      padding:2px 6px; 
      border-radius:var(--r-full); 
    }
    
    .search-empty {
      display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-4) var(--sp-4);
      color: var(--c-text-muted); font-size:var(--text-sm);
    }
    
    .search-empty mat-icon { font-size:20px; width:20px;height:20px; opacity:.5; }
    
    .search-backdrop {
      position: fixed; inset: 0; z-index: 99;
    }

    /* Right */
    .header__right { display: flex; align-items: center; gap: var(--sp-3); margin-left: auto; }

    .live-pill {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; font-weight: var(--fw-semibold);
      color: rgba(255,255,255,0.4);
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: var(--r-full);
      padding: 4px 10px;
    }
    
    .live-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--c-success);
      animation: pulse-dot 1.5s ease-in-out infinite;
      box-shadow: 0 0 6px var(--c-success);
    }

    .notif-btn { position: relative; }

    .profile-btn {
      display: flex; align-items: center; gap: var(--sp-2);
      background: none; border: none; cursor: pointer;
      padding: var(--sp-1) var(--sp-2);
      border-radius: var(--r-sm);
      transition: background var(--t-fast);
    }
    
    .profile-btn:hover { background: var(--c-bg-hover); }
    
    .avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--c-primary-500), var(--c-orange-500));
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: var(--fw-bold); color: white;
      flex-shrink: 0;
    }
    
    .avatar--lg { width:44px; height:44px; font-size:16px; }
    
    .profile-info {
      display: flex; flex-direction: column; text-align: left;
    }
    
    @media (max-width: 768px) { 
      .profile-info { display: none; } 
    }
    
    .profile-name { font-size: var(--text-sm); font-weight: var(--fw-semibold); color: var(--c-text-primary); }
    .profile-role { font-size: 11px; color: var(--c-text-muted); }
    .profile-chevron { font-size:18px; width:18px;height:18px; color:var(--c-text-muted); }

    .profile-menu-header {
      display: flex; align-items: center; gap: var(--sp-3);
      padding: var(--sp-4) var(--sp-4) var(--sp-3);
    }

    .notif-menu-panel { min-width: 340px !important; }
    
    .notif-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--c-border);
      font-size: var(--text-sm); font-weight: var(--fw-semibold); color: var(--c-text-primary);
    }
    
    .notif-clear { font-size:12px; color:var(--c-orange-500); height:auto; min-height:0; padding: 0; }
    
    .notif-item {
      display: flex; align-items: flex-start; gap: var(--sp-3);
      padding: var(--sp-3) var(--sp-4);
      transition: background var(--t-fast);
    }
    
    .notif-item:hover { background: var(--c-bg-hover); }
    
    .notif-item--unread { 
      border-left: 2px solid var(--c-orange-500); 
    }
    
    .notif-item__icon {
      width:32px;
      height:32px; 
      border-radius:50%; 
      display:flex;
      align-items:center;
      justify-content:center; 
      flex-shrink:0;
    }
    
    .notif-item__icon mat-icon {
      font-size:16px;
      width:16px;
      height:16px;
    }
    
    .notif-item__text { 
      font-size:var(--text-sm); 
      color:var(--c-text-primary); 
    }
    
    .notif-item__time { 
      font-size:11px; 
      color:var(--c-text-muted); 
      margin-top:2px; 
    }
    
    .notif-icon--success { background:rgba(39,174,96,.15); color:#4ade80; }
    .notif-icon--warning { background:rgba(243,156,18,.15); color:#fbbf24; }
    .notif-icon--info    { background:rgba(52,152,219,.15); color:#60a5fa; }
    .notif-icon--error   { background:rgba(231,76,60,.15);  color:#f87171; }
  `]
})
export class HeaderComponent implements OnInit {
  @Input() currentPageTitle = 'Tableau de bord';
  @Output() toggleSidebar = new EventEmitter<void>();

  scrolled = false;
  searchOpen = false;
  searchQuery = '';
  searchResults: any[] = [];
  notifCount = 3;
  userName = 'Admin';
  userInitials = 'AD';

  notifications = [
    { type: 'success', icon: 'check_circle', message: 'Commande CMD-2024-047 livrée avec succès', time: 'Il y a 5 min', read: false },
    { type: 'warning', icon: 'schedule', message: 'Tournée T-089 en retard de 2h', time: 'Il y a 23 min', read: false },
    { type: 'info',    icon: 'person_add', message: 'Nouveau client : Société Aziz & Co', time: 'Il y a 1h', read: false },
    { type: 'warning', icon: 'build', message: 'Véhicule TN-2847-B en maintenance', time: 'Il y a 2h', read: true },
  ];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.username || 'Admin';
      this.userInitials = this.userName.substring(0, 2).toUpperCase();
    }
  }

  @HostListener('window:scroll')
  onScroll(): void { this.scrolled = window.scrollY > 10; }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault(); this.openSearch();
    }
  }

  openSearch(): void { this.searchOpen = true; }
  closeSearch(): void { this.searchOpen = false; this.searchQuery = ''; this.searchResults = []; }

  onSearch(): void {
    if (!this.searchQuery.trim()) { this.searchResults = []; return; }
    const q = this.searchQuery.toLowerCase();
    this.searchResults = [
      { label: 'Navigation', items: [
        { text: 'Tableau de bord', icon: 'dashboard', route: '/dashboard' },
        { text: 'Clients',    icon: 'corporate_fare', route: '/clients' },
        { text: 'Commandes',  icon: 'inventory_2', route: '/commandes' },
        { text: 'Chauffeurs', icon: 'badge', route: '/chauffeurs' },
        { text: 'Véhicules',  icon: 'local_shipping', route: '/vehicules' },
        { text: 'Tournées',   icon: 'route', route: '/tournees' },
        { text: 'Rapports',   icon: 'assessment', route: '/rapports' },
      ].filter(i => i.text.toLowerCase().includes(q)) }
    ].filter(cat => cat.items.length > 0);
  }

  highlight(text: string): string {
    if (!this.searchQuery) return text;
    const re = new RegExp(`(${this.searchQuery})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
  }

  navigateTo(route: string): void { this.router.navigate([route]); this.closeSearch(); }

  clearNotifs(): void { this.notifCount = 0; this.notifications.forEach(n => n.read = true); }

  logout(): void { this.authService.logout(); }
}