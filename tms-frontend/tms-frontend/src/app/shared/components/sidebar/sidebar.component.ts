import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  template: `
    <aside class="sidebar" [class.sidebar--mini]="mini">

      <!-- LOGO -->
      <div class="sidebar__brand" (click)="naviguer('/dashboard')">
        <div class="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" fill="white" opacity="0.9"/>
            <circle cx="12" cy="9" r="2" fill="#E67E22"/>
          </svg>
        </div>
        <div class="brand-text" *ngIf="!mini">
          <span class="brand-name">GRPO</span>
          <span class="brand-sub">TMS v2.0</span>
        </div>
      </div>

      <!-- NAV -->
      <nav class="sidebar__nav">
        <ng-container *ngFor="let group of navGroups">
          <div class="nav-group">
            <span class="nav-group__label" *ngIf="!mini">{{ group.label }}</span>
            <a *ngFor="let item of group.items"
               class="nav-item"
               [class.nav-item--active]="isActive(item.route)"
               (click)="naviguer(item.route)"
               [matTooltip]="mini ? item.label : ''"
               matTooltipPosition="right">
              <span class="nav-item__icon">
                <mat-icon>{{ item.icon }}</mat-icon>
              </span>
              <span class="nav-item__label" *ngIf="!mini">{{ item.label }}</span>
              <span *ngIf="item.badge && !mini"
                    class="nav-item__badge"
                    [style.background]="item.badgeColor || 'rgba(255,255,255,0.1)'"
                    [style.color]="'white'">
                {{ item.badge }}
              </span>
              <span class="nav-item__active-bar" *ngIf="isActive(item.route)"></span>
            </a>
          </div>
        </ng-container>
      </nav>

      <!-- BOTTOM -->
      <div class="sidebar__bottom">
        <a class="nav-item"
           [class.nav-item--active]="isActive('/rapports')"
           (click)="naviguer('/rapports')"
           [matTooltip]="mini ? 'Rapports & Exports' : ''"
           matTooltipPosition="right">
          <span class="nav-item__icon"><mat-icon>assessment</mat-icon></span>
          <span class="nav-item__label" *ngIf="!mini">Rapports &amp; Exports</span>
        </a>

        <a class="nav-item"
           [class.nav-item--active]="isActive('/demandes')"
           (click)="naviguer('/demandes')"
           [matTooltip]="mini ? 'Demandes inscription' : ''"
           matTooltipPosition="right">
          <span class="nav-item__icon"><mat-icon>how_to_reg</mat-icon></span>
          <span class="nav-item__label" *ngIf="!mini">Demandes d'inscription</span>
        </a>

        <div class="divider"></div>

        <button class="collapse-btn" (click)="toggleMini()"
                [matTooltip]="mini ? 'Agrandir' : 'Réduire'"
                matTooltipPosition="right">
          <mat-icon>{{ mini ? 'chevron_right' : 'chevron_left' }}</mat-icon>
          <span *ngIf="!mini">Réduire</span>
        </button>
      </div>

    </aside>
  `,
  styles: [`
    :host { display:block; height:100vh; position:sticky; top:0; flex-shrink:0; }

    .sidebar {
      width: var(--sidebar-w, 240px);
      height: 100%;
      background: linear-gradient(180deg, #0a1523 0%, #060e17 100%);
      border-right: 1px solid rgba(255,255,255,0.06);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      overflow: hidden;
    }

    .sidebar--mini { width: var(--sidebar-w-mini, 64px); }

    .sidebar__brand {
      display:flex; align-items:center; gap:12px;
      padding:20px; cursor:pointer; height:64px;
      border-bottom:1px solid rgba(255,255,255,0.06);
      flex-shrink:0;
    }

    .brand-icon {
      width:36px; height:36px;
      background:linear-gradient(135deg,#1B4F72,#0d2b3e);
      border-radius:8px;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0;
      box-shadow:0 2px 12px rgba(27,79,114,0.4);
    }

    .brand-name { display:block; font-weight:800; font-size:15px; color:white; letter-spacing:0.04em; }
    .brand-sub  { display:block; font-size:10px; color:rgba(255,255,255,0.3); letter-spacing:0.08em; text-transform:uppercase; }

    .sidebar__nav { flex:1; overflow-y:auto; padding:16px 12px; }
    .sidebar__nav::-webkit-scrollbar { width:0; }

    .nav-group { margin-bottom:16px; }

    .nav-group__label {
      display:block; font-size:10px; font-weight:600; letter-spacing:0.1em;
      text-transform:uppercase; color:rgba(255,255,255,0.2);
      padding:0 12px; margin-bottom:4px;
    }

    .nav-item {
      display:flex; align-items:center; gap:12px;
      padding:0 12px; height:40px; border-radius:8px;
      cursor:pointer; text-decoration:none;
      color:rgba(255,255,255,0.55);
      font-size:13.5px; font-weight:500;
      transition:all 0.15s; position:relative; white-space:nowrap;
      margin-bottom:2px;
      user-select:none;
    }

    .nav-item:hover {
      background:rgba(255,255,255,0.06);
      color:rgba(255,255,255,0.85);
    }

    .nav-item--active {
      background:rgba(230,126,34,0.15) !important;
      color:white !important;
    }

    .nav-item--active::before {
      content:''; position:absolute; left:0; top:50%;
      transform:translateY(-50%); width:3px; height:22px;
      background:#E67E22; border-radius:0 3px 3px 0;
    }

    .nav-item__icon {
      display:flex; align-items:center; justify-content:center;
      width:20px; height:20px; flex-shrink:0;
    }
    .nav-item__icon mat-icon { font-size:20px; width:20px; height:20px; }
    .nav-item--active .nav-item__icon { color:#E67E22; }
    .nav-item__label { flex:1; overflow:hidden; text-overflow:ellipsis; }

    .nav-item__badge {
      font-size:10px; font-weight:700;
      padding:1px 7px; border-radius:20px;
      background:rgba(255,255,255,0.1);
    }

    .nav-item__active-bar {
      position:absolute; right:8px; width:5px; height:5px;
      border-radius:50%; background:#E67E22;
      box-shadow:0 0 8px #E67E22;
    }

    .sidebar__bottom {
      padding:12px;
      border-top:1px solid rgba(255,255,255,0.06);
      flex-shrink:0;
    }

    .divider { height:1px; background:rgba(255,255,255,0.06); margin:8px 0; }

    .collapse-btn {
      display:flex; align-items:center; gap:12px;
      width:100%; height:36px; padding:0 12px;
      background:none; border:none; cursor:pointer;
      color:rgba(255,255,255,0.3); font-size:13px;
      font-family:inherit; border-radius:8px;
      transition:all 0.15s;
    }
    .collapse-btn:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.6); }
    .collapse-btn mat-icon { font-size:20px; width:20px; height:20px; }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() mini = false;
  @Output() miniChange = new EventEmitter<boolean>();

  private destroy$ = new Subject<void>();
  currentRoute = '';

  navGroups: NavGroup[] = [
    {
      label: 'Principal',
      items: [
        { label: 'Tableau de bord', icon: 'dashboard', route: '/dashboard' },
      ]
    },
    {
      label: 'Gestion',
      items: [
        { label: 'Clients',    icon: 'corporate_fare', route: '/clients'   },
        { label: 'Commandes',  icon: 'inventory_2',    route: '/commandes' },
        { label: 'Tournées',   icon: 'route',          route: '/tournees'  },
        { label: 'Optimisation',  icon: 'auto_awesome',   route: '/tournees/optimiser' },
        { label: 'Suivi GPS',    icon: 'gps_fixed',      route: '/gps'               },
      ]
    },
    {
      label: 'Ressources',
      items: [
        { label: 'Chauffeurs', icon: 'badge',           route: '/chauffeurs' },
        { label: 'Véhicules',  icon: 'local_shipping',  route: '/vehicules'  },
      ]
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // ✅ Initialiser avec l'URL courante
    this.currentRoute = this.router.url.split('?')[0];

    // ✅ S'abonner aux changements de route
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((e: any) => {
        this.currentRoute = (e.urlAfterRedirects || e.url).split('?')[0];
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ FIX DEFINITIF — Correspondance stricte par segment de route
   * /dashboard ne matche PAS /dashboard-stats ou autres
   * /commandes matche /commandes et /commandes/123 mais PAS /dashboard
   */
 isActive(route: string): boolean {
  const current = this.currentRoute;

  // Correspondance exacte — priorité absolue
  if (current === route) return true;

  // Pour les routes exactes comme /tournees/optimiser
  // ne pas matcher si une route plus spécifique existe
  const routeEstSpecifique = route.split('/').length > 2;
  if (routeEstSpecifique) {
    return current === route;
  }

  // Sous-routes génériques (ex: /commandes/123)
  // mais pas si une route fille plus spécifique existe dans navGroups
  const routesFilles = this.navGroups
    .flatMap(g => g.items)
    .map(i => i.route)
    .filter(r => r !== route && r.startsWith(route + '/'));

  if (routesFilles.some(r => current.startsWith(r))) {
    return false;
  }

  if (current.startsWith(route + '/')) return true;

  return false;
}

  /**
   * ✅ Navigation programmatique — évite les problèmes de routerLink
   */
  naviguer(route: string): void {
    this.router.navigate([route]);
  }

  toggleMini(): void {
    this.mini = !this.mini;
    this.miniChange.emit(this.mini);
  }
}
