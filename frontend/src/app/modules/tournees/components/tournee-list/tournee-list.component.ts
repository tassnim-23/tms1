import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormControl } from '@angular/forms';
import { TourneeService } from '../../services/tournee.service';
import { Tournee, StatutTournee, STATUT_TOURNEE_CONFIG } from '../../models/tournee.model';
import { TourneeDeleteDialogComponent } from '../tournee-delete-dialog/tournee-delete-dialog.component';

@Component({
  selector: 'app-tournee-list',
  templateUrl: './tournee-list.component.html',
  styleUrls: ['./tournee-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourneeListComponent implements OnInit, OnDestroy {

  tournees: Tournee[] = [];
  tourneesFiltrees: Tournee[] = [];
  loading = true;
  searchCtrl = new FormControl('');
  filtreStatut: StatutTournee | 'TOUS' = 'TOUS';
  statutConfig = STATUT_TOURNEE_CONFIG;

  // Pagination
  page = 0;
  pageSize = 10;

  // Colonnes
  readonly Math = Math;
  readonly colonnes = ['date', 'numero', 'chauffeur', 'vehicule', 'commandes', 'statut', 'actions'];

  private destroy$ = new Subject<void>();

  constructor(
    private svc: TourneeService,
    private router: Router,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.charger();

    // Refresh automatique
    this.svc.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => this.charger());

    // Recherche avec debounce
    this.searchCtrl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.filtrer());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  charger(): void {
    this.loading = true;
    this.cd.markForCheck();
    this.svc.getTournees().pipe(takeUntil(this.destroy$)).subscribe({
      next: data => {
        this.tournees = data;
        this.filtrer();
        this.loading = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.snack.open('Erreur lors du chargement des tournées', 'Fermer', { duration: 4000 });
        this.cd.markForCheck();
      }
    });
  }

  filtrer(): void {
    const q = (this.searchCtrl.value || '').toLowerCase().trim();
    this.tourneesFiltrees = this.tournees.filter(t => {
      const matchStatut = this.filtreStatut === 'TOUS' || t.statut === this.filtreStatut;
      const matchSearch = !q ||
        t.numeroTournee?.toLowerCase().includes(q) ||
        t.chauffeurNom?.toLowerCase().includes(q) ||
        t.vehiculeLabel?.toLowerCase().includes(q);
      return matchStatut && matchSearch;
    });
    this.page = 0;
    this.cd.markForCheck();
  }

  setFiltreStatut(s: StatutTournee | 'TOUS'): void {
    this.filtreStatut = s;
    this.filtrer();
  }

  get pageCourante(): Tournee[] {
    const start = this.page * this.pageSize;
    return this.tourneesFiltrees.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.tourneesFiltrees.length / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  nouvelle(): void {
    this.router.navigate(['/tournees/new']);
  }

  voir(id: number): void {
    this.router.navigate(['/tournees', id]);
  }

  modifier(id: number): void {
    this.router.navigate(['/tournees', id, 'edit']);
  }

  supprimer(tournee: Tournee): void {
    const ref = this.dialog.open(TourneeDeleteDialogComponent, {
      data: tournee, width: '440px', panelClass: 'dialog-tournee'
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.svc.deleteTournee(tournee.id).subscribe({
        next: () => this.snack.open(`Tournée ${tournee.numeroTournee} supprimée`, '✓', { duration: 3000 }),
        error: (e) => this.snack.open(e?.error?.message || 'Erreur suppression', 'Fermer', { duration: 5000 })
      });
    });
  }

  getStatutConfig(s: StatutTournee) {
    return this.statutConfig[s] || this.statutConfig.PLANIFIEE;
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }

  trackById(_: number, t: Tournee) { return t.id; }

  get kpiCards(): Array<{label: string; val: number; icon: string; statut: StatutTournee | 'TOUS'; color: string; bg: string}> {
    return [
      { label: 'Total',     val: this.tournees.length,                                                   icon: 'route',          statut: 'TOUS',      color: '#1B4F72', bg: '#EBF5FB' },
      { label: 'Planifiées', val: this.tournees.filter(t => t.statut === 'PLANIFIEE').length,             icon: 'schedule',       statut: 'PLANIFIEE', color: '#1B4F72', bg: '#EBF5FB' },
      { label: 'En cours',  val: this.tournees.filter(t => t.statut === 'EN_COURS').length,               icon: 'local_shipping', statut: 'EN_COURS',  color: '#E67E22', bg: '#FEF3E2' },
      { label: 'Terminées', val: this.tournees.filter(t => t.statut === 'TERMINEE').length,               icon: 'check_circle',   statut: 'TERMINEE',  color: '#27ae60', bg: '#E8F8F5' },
    ];
  }
}
