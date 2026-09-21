import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap, startWith } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CommandeService } from '../../services/commande.service';
import {
  Commande, StatutCommande, CommandeStats, STATUT_CONFIG, Client, POINTS_DEPART_GRPO
} from '../../models/commande.model';
import { CommandeDeleteDialogComponent } from '../commande-delete-dialog/commande-delete-dialog.component';

@Component({
  selector: 'app-commande-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './commande-list.component.html',
  styleUrls: ['./commande-list.component.scss']
})
export class CommandeListComponent implements OnInit, OnDestroy {

  // ── DATA ─────────────────────────────────────────────────────
  commandes: Commande[] = [];
  commandesFiltrees: Commande[] = [];
  stats: CommandeStats = { total:0, enAttente:0, assignee:0, enCours:0, livree:0, annulee:0 };
  clients: Client[] = [];

  // ── STATE ─────────────────────────────────────────────────────
  loading = true;
  skeletonRows = Array(8).fill(0);

  // ── FILTRES ───────────────────────────────────────────────────
  searchCtrl = new FormControl('');
  filtreStatut: StatutCommande | 'TOUS' = 'TOUS';
  filtreClientId: number | null = null;
  filtrePointDepart: string = '';
  pointsDepartGrpo = POINTS_DEPART_GRPO;
  vue: 'table' | 'kanban' = 'table';

  // ── SELECTION ─────────────────────────────────────────────────
  selectAll = false;
  selected = new Set<number>();

  // ── PAGINATION ────────────────────────────────────────────────
  page = 0;
  pageSize = 10;
  totalElements = 0;
  get totalPages(): number { return Math.max(1, Math.ceil(this.totalElements / this.pageSize)); }
  get debut(): number { return this.page * this.pageSize + 1; }
  get fin(): number { return Math.min((this.page + 1) * this.pageSize, this.totalElements); }

  // ── UTILS ─────────────────────────────────────────────────────
  readonly statutConfig: any = STATUT_CONFIG;
  readonly STATUTS: Array<StatutCommande | 'TOUS'> = [
    'TOUS','EN_ATTENTE','ASSIGNEE','EN_COURS','LIVREE','ANNULEE'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private svc: CommandeService,
    private router: Router,
    private snack: MatSnackBar,
    private dialog: MatDialog,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Recherche avec debounce
    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => { this.page = 0; this.appliquerFiltres(); });

    // Reload on refresh signal
    this.svc.refresh$.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.charger());

    this.charger();
    this.chargerClients();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── CHARGEMENT ────────────────────────────────────────────────
  charger(): void {
    this.loading = true;
    this.cd.markForCheck();

    this.svc.getAll({ page: this.page, size: 1000 }).subscribe({
      next: (res: any) => {
        const list: Commande[] = Array.isArray(res) ? res : (res.content || []);
        this.commandes = list.sort((a, b) =>
          new Date(b.createdAt || b.dateCommande || 0).getTime() -
          new Date(a.createdAt || a.dateCommande || 0).getTime()
        );
        this.calculerStats();
        this.appliquerFiltres();
        this.loading = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.snack.open('Erreur chargement commandes', 'Fermer', { duration: 4000 });
        this.cd.markForCheck();
      }
    });
  }

  chargerClients(): void {
    this.svc.getClients().subscribe({
      next: c => { this.clients = c; this.cd.markForCheck(); },
      error: () => {}
    });
  }

  calculerStats(): void {
    this.stats = {
      total:     this.commandes.length,
      enAttente: this.commandes.filter(c => c.statut === 'EN_ATTENTE').length,
      assignee:  this.commandes.filter(c => c.statut === 'ASSIGNEE').length,
      enCours:   this.commandes.filter(c => c.statut === 'EN_COURS').length,
      livree:    this.commandes.filter(c => c.statut === 'LIVREE').length,
      annulee:   this.commandes.filter(c => c.statut === 'ANNULEE').length,
    };
  }

  appliquerFiltres(): void {
    let r = [...this.commandes];
    const q = (this.searchCtrl.value || '').trim().toLowerCase();

    if (this.filtreStatut !== 'TOUS') r = r.filter(c => c.statut === this.filtreStatut);

    if (this.filtreClientId) r = r.filter(c => (c.client?.id || c.clientId) === this.filtreClientId);

    if (this.filtrePointDepart) r = r.filter(c =>
      (c.adresseChargement || '') === this.filtrePointDepart
    );

    if (q) {
      r = r.filter(c =>
        (c.numeroCommande || '').toLowerCase().includes(q) ||
        (c.client?.raisonSociale || c.clientNom || '').toLowerCase().includes(q) ||
        (c.adresseLivraison || '').toLowerCase().includes(q) ||
        (c.villeLivraison || '').toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    }

    this.totalElements = r.length;
    const debut = this.page * this.pageSize;
    this.commandesFiltrees = r.slice(debut, debut + this.pageSize);
    this.cd.markForCheck();
  }

  // ── NAVIGATION ────────────────────────────────────────────────
  voirDetails(c: Commande): void  { this.router.navigate(['/commandes', c.id]); }
  modifier(c: Commande, ev: MouseEvent): void { ev.stopPropagation(); this.router.navigate(['/commandes', c.id, 'edit']); }
  nouvelleCommande(): void        { this.router.navigate(['/commandes/new']); }

  supprimer(c: Commande, ev: MouseEvent): void {
    ev.stopPropagation();
    const ref = this.dialog.open(CommandeDeleteDialogComponent, {
      data: c, width: '420px', panelClass: 'grpo-dialog'
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.delete(c.id).subscribe({
        next: () => this.snack.open(`Commande ${c.numeroCommande} supprimée`, '✕', {
          duration: 3000, panelClass: 'snack-ok'
        }),
        error: () => this.snack.open('Erreur lors de la suppression', '✕', {
          duration: 4000, panelClass: 'snack-err'
        })
      });
    });
  }

  // ── STATUT RAPIDE ─────────────────────────────────────────────
  changerStatut(c: Commande, statut: StatutCommande, ev: MouseEvent): void {
    ev.stopPropagation();
    this.svc.updateStatut(c.id, statut).subscribe({
      next: updated => {
        c.statut = updated.statut;
        this.calculerStats();
        this.appliquerFiltres();
        this.snack.open(`Statut mis à jour : ${STATUT_CONFIG[statut].label}`, '✕', {
          duration: 3000, panelClass: 'snack-ok'
        });
      }
    });
  }

  // ── FILTRES ───────────────────────────────────────────────────
  setFiltreStatut(s: any): void {
    this.filtreStatut = s; this.page = 0; this.appliquerFiltres();
  }

  reinitialiserFiltres(): void {
    this.searchCtrl.setValue('');
    this.filtreStatut = 'TOUS';
    this.filtreClientId = null;
    this.filtrePointDepart = '';
    this.page = 0;
    this.appliquerFiltres();
  }

  get filtersActifs(): boolean {
    return !!(this.searchCtrl.value || this.filtreStatut !== 'TOUS' || this.filtreClientId || this.filtrePointDepart);
  }

  approuverCommande(c: Commande, ev: MouseEvent): void {
    ev.stopPropagation();
    this.svc.updateStatut(c.id, 'EN_ATTENTE').subscribe({
      next: () => {
        this.snack.open(`Commande ${c.numeroCommande} approuvée ✓`, undefined, { duration: 3000, panelClass: 'snack-success' });
        this.charger();
      },
      error: () => this.snack.open('Erreur lors de l\'approbation', 'Fermer', { duration: 4000 }),
    });
  }

  rejeterCommande(c: Commande, ev: MouseEvent): void {
    ev.stopPropagation();
    this.svc.updateStatut(c.id, 'ANNULEE').subscribe({
      next: () => {
        this.snack.open(`Commande ${c.numeroCommande} rejetée`, undefined, { duration: 3000 });
        this.charger();
      },
      error: () => this.snack.open('Erreur lors du rejet', 'Fermer', { duration: 4000 }),
    });
  }

  // ── SELECTION ─────────────────────────────────────────────────
  toggleAll(): void {
    if (this.selectAll) {
      this.commandesFiltrees.forEach(c => this.selected.add(c.id));
    } else {
      this.selected.clear();
    }
  }

  toggleRow(id: number): void {
    this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id);
    this.selectAll = this.commandesFiltrees.every(c => this.selected.has(c.id));
  }

  // ── PAGINATION ────────────────────────────────────────────────
  pagePrecedente(): void { if (this.page > 0) { this.page--; this.appliquerFiltres(); } }
  pageSuivante(): void { if (this.page < this.totalPages - 1) { this.page++; this.appliquerFiltres(); } }
  allerPage(p: number): void { this.page = p; this.appliquerFiltres(); }

  pagesVisibles(): number[] {
    const r: number[] = [];
    const start = Math.max(0, this.page - 2);
    const end = Math.min(this.totalPages - 1, this.page + 2);
    for (let i = start; i <= end; i++) r.push(i);
    return r;
  }

  // ── UTILS ─────────────────────────────────────────────────────

  /** Cast sécurisé pour éviter l'erreur de type sur statutConfig[s] */
  getStatutCfg(s: any): any { return (this.statutConfig as any)[s]; }

  /** Tronquer une chaîne sans le pipe slice (évite l'import de SlicePipe) */
  truncate(s: string, max: number): string {
    if (!s) return '';
    return s.length > max ? s.substring(0, max) + '...' : s;
  }

    getStatut(statut: string): any {
    return this.statutConfig[statut] || this.statutConfig['EN_ATTENTE'];
  }

  trackById(_: number, c: Commande): number { return c.id; }

  clientNom(c: Commande): string {
    return c.client?.raisonSociale || c.clientNom || `Client #${c.clientId}`;
  }

  avatarInitiale(c: Commande): string {
    return (c.client?.raisonSociale || c.clientNom || 'C')[0].toUpperCase();
  }

  avatarColor(c: Commande): string {
    const colors = ['#1B4F72','#0e6655','#7d3c98','#c0392b','#1a5276'];
    const nom = c.client?.raisonSociale || c.clientNom || '';
    return colors[(nom.charCodeAt(0) || 0) % colors.length];
  }

  dateRelative(d: string): string {
    if (!d) return '—';
    const diff = Math.round(
      (new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000
    );
    if (diff === 0)  return "Aujourd'hui";
    if (diff === 1)  return 'Demain';
    if (diff === -1) return 'Hier';
    if (diff < 0)    return `Il y a ${-diff}j`;
    return `Dans ${diff}j`;
  }

  fmtDate(d: string): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return d; }
  }

  isUrgent(c: Commande): boolean {
    if (!c.dateLivraisonPrevue || c.statut === 'LIVREE' || c.statut === 'ANNULEE') return false;
    const diff = (new Date(c.dateLivraisonPrevue).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 2;
  }

  get kpiCards(): Array<{label:string; val:number; icon:string; statut: StatutCommande|'TOUS'; color:string; bg:string}> {
    return [
      { label:'Total',      val: this.stats.total,     icon:'📦', statut:'TOUS'     , color:'#1B4F72', bg:'#EBF5FB' },
      { label:'En attente', val: this.stats.enAttente,  icon:'⏳', statut:'EN_ATTENTE', color:'#1B4F72', bg:'#EBF5FB' },
      { label:'Assignées',  val: this.stats.assignee,   icon:'🎯', statut:'ASSIGNEE',  color:'#D68910', bg:'#FEF9E7' },
      { label:'En cours',   val: this.stats.enCours,    icon:'🚛', statut:'EN_COURS',  color:'#E67E22', bg:'#FEF3E2' },
      { label:'Livrées',    val: this.stats.livree,     icon:'✅', statut:'LIVREE',    color:'#1E8449', bg:'#E8F8F5' },
      { label:'Annulées',   val: this.stats.annulee,    icon:'❌', statut:'ANNULEE',   color:'#CB4335', bg:'#FADBD8' },
    ];
  }
}