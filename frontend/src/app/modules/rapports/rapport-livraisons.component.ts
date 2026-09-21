import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RapportService } from '../../core/services/rapport.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-rapport-livraisons',
  template: `
    <div class="rapport-header">
      <div class="back-title">
        <button mat-icon-button (click)="router.navigate(['/rapports'])">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1><mat-icon>local_shipping</mat-icon> Rapport des Livraisons</h1>
          <p>Analyse complète des commandes et livraisons</p>
        </div>
      </div>
      <div class="actions">
        <button mat-raised-button (click)="load()" [disabled]="loading">
          <mat-icon>refresh</mat-icon> Actualiser
        </button>
        <button mat-raised-button color="primary" [matMenuTriggerFor]="exportMenu">
          <mat-icon>download</mat-icon> Exporter
        </button>
        <mat-menu #exportMenu="matMenu">
          <button mat-menu-item (click)="exportExcel()"><mat-icon>table_view</mat-icon> Excel (.xlsx)</button>
          <button mat-menu-item (click)="exportPdf()"><mat-icon>picture_as_pdf</mat-icon> PDF</button>
          <button mat-menu-item (click)="exportCsv()"><mat-icon>description</mat-icon> CSV</button>
          <button mat-menu-item (click)="imprimer()"><mat-icon>print</mat-icon> Imprimer</button>
        </mat-menu>
      </div>
    </div>

    <div *ngIf="loading" class="loading-overlay">
      <mat-spinner diameter="60"></mat-spinner>
      <p>Chargement des données...</p>
    </div>

    <div *ngIf="!loading && data">

      <!-- STATS CARDS -->
      <div class="stats-grid">
        <div class="stat-card primary">
          <mat-icon>assignment</mat-icon>
          <div class="val">{{ data.total }}</div>
          <div class="lbl">Total commandes</div>
        </div>
        <div class="stat-card success">
          <mat-icon>check_circle</mat-icon>
          <div class="val">{{ data.livrees }}</div>
          <div class="lbl">Livrées</div>
        </div>
        <div class="stat-card warning">
          <mat-icon>local_shipping</mat-icon>
          <div class="val">{{ data.enCours }}</div>
          <div class="lbl">En cours</div>
        </div>
        <div class="stat-card error">
          <mat-icon>cancel</mat-icon>
          <div class="val">{{ data.annulees }}</div>
          <div class="lbl">Annulées</div>
        </div>
        <div class="stat-card accent">
          <mat-icon>euro_symbol</mat-icon>
          <div class="val">{{ data.revenu | number:'1.0-0' }} DT</div>
          <div class="lbl">Revenu livraisons</div>
        </div>
        <div class="stat-card info">
          <mat-icon>trending_up</mat-icon>
          <div class="val">{{ data.taux }}%</div>
          <div class="lbl">Taux de livraison</div>
        </div>
      </div>

      <!-- GRAPHIQUES -->
      <div class="charts-grid">
        <div class="tms-card chart-card">
          <h3><mat-icon>show_chart</mat-icon> Évolution mensuelle</h3>
          <canvas #lineChart width="400" height="180"></canvas>
        </div>
        <div class="tms-card chart-card">
          <h3><mat-icon>pie_chart</mat-icon> Répartition par statut</h3>
          <canvas #pieChart width="300" height="180"></canvas>
        </div>
        <div class="tms-card chart-card full-width">
          <h3><mat-icon>bar_chart</mat-icon> Revenus par mois (DT)</h3>
          <canvas #barChart width="600" height="160"></canvas>
        </div>
      </div>

      <!-- TABLEAU -->
      <div class="tms-card">
        <div class="table-toolbar">
          <h3><mat-icon>table_chart</mat-icon> Détail des commandes ({{ data.rows.length }})</h3>
          <mat-form-field appearance="outline" style="width:250px">
            <mat-label>Rechercher</mat-label>
            <input matInput [(ngModel)]="search" placeholder="N°, client, statut...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
        <div class="table-container">
          <table mat-table [dataSource]="filteredRows" class="tms-table">
            <ng-container matColumnDef="numero"><th mat-header-cell *matHeaderCellDef>N° Commande</th><td mat-cell *matCellDef="let r"><strong>{{r.numero}}</strong></td></ng-container>
            <ng-container matColumnDef="client"><th mat-header-cell *matHeaderCellDef>Client</th><td mat-cell *matCellDef="let r">{{r.client}}</td></ng-container>
            <ng-container matColumnDef="livraison"><th mat-header-cell *matHeaderCellDef>Livraison</th><td mat-cell *matCellDef="let r" class="addr-cell" [matTooltip]="r.livraison">{{r.livraison | slice:0:35}}...</td></ng-container>
            <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let r">{{r.date}}</td></ng-container>
            <ng-container matColumnDef="poids"><th mat-header-cell *matHeaderCellDef>Poids</th><td mat-cell *matCellDef="let r">{{r.poids}}</td></ng-container>
            <ng-container matColumnDef="cout"><th mat-header-cell *matHeaderCellDef>Coût</th><td mat-cell *matCellDef="let r"><strong>{{r.cout}}</strong></td></ng-container>
            <ng-container matColumnDef="statut">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let r">
                <span class="badge" [ngClass]="getStatutClass(r.statut)">{{r.statut}}</span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;" class="table-row"></tr>
            <tr class="mat-row" *matNoDataRow><td class="mat-cell no-data" colspan="7"><mat-icon>inbox</mat-icon><p>Aucune donnée</p></td></tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rapport-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; flex-wrap:wrap; gap:16px; }
    .back-title { display:flex; align-items:center; gap:8px; }
    .back-title h1 { display:flex; align-items:center; gap:8px; font-size:22px; color:#1B4F72; margin:0; }
    .back-title p { margin:4px 0 0; color:#666; font-size:13px; }
    .actions { display:flex; gap:10px; }
    .loading-overlay { text-align:center; padding:80px; color:#666; }
    .loading-overlay p { margin-top:16px; font-size:14px; }

    .stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:16px; margin-bottom:24px; }
    .stat-card { border-radius:12px; padding:20px 16px; text-align:center; color:white; }
    .stat-card mat-icon { font-size:32px; width:32px; height:32px; opacity:.85; }
    .stat-card .val { font-size:26px; font-weight:700; margin:8px 0 4px; }
    .stat-card .lbl { font-size:12px; opacity:.9; }
    .stat-card.primary { background:linear-gradient(135deg,#1B4F72,#2980b9); }
    .stat-card.success { background:linear-gradient(135deg,#27AE60,#2ecc71); }
    .stat-card.warning { background:linear-gradient(135deg,#E67E22,#f39c12); }
    .stat-card.error   { background:linear-gradient(135deg,#E74C3C,#c0392b); }
    .stat-card.accent  { background:linear-gradient(135deg,#8e44ad,#9b59b6); }
    .stat-card.info    { background:linear-gradient(135deg,#16a085,#1abc9c); }

    .charts-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px; }
    .chart-card { padding:20px; }
    .chart-card h3 { display:flex; align-items:center; gap:6px; margin:0 0 16px; font-size:15px; color:#1B4F72; }
    .full-width { grid-column:1/-1; }

    .table-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .table-toolbar h3 { display:flex; align-items:center; gap:6px; margin:0; font-size:15px; color:#1B4F72; }
    .table-container { overflow-x:auto; }
    .tms-table { width:100%; }
    .tms-table th { background:#1B4F72; color:white; font-weight:600; }
    .table-row:hover { background:#f5f9fc; }
    .no-data { text-align:center; padding:30px !important; color:#999; }
    .addr-cell { max-width:220px; cursor:default; }
    .badge { padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; }
    .badge-livree   { background:#e8f5e9; color:#2E7D32; }
    .badge-encours  { background:#fff8e1; color:#E65100; }
    .badge-annulee  { background:#ffebee; color:#C62828; }
    .badge-attente  { background:#f5f5f5; color:#666; }
    .badge-assignee { background:#e3f2fd; color:#1565C0; }

    @media print {
      .actions, .back-title button { display:none !important; }
      .rapport-header { margin-bottom:12px; }
      .stat-card { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
    @media (max-width:768px) {
      .charts-grid { grid-template-columns:1fr; }
      .full-width { grid-column:1; }
    }
  `]
})
export class RapportLivraisonsComponent implements OnInit, OnDestroy {
  @ViewChild('lineChart') lineRef!: ElementRef;
  @ViewChild('pieChart')  pieRef!: ElementRef;
  @ViewChild('barChart')  barRef!: ElementRef;

  data: any = null;
  loading = false;
  search = '';
  cols = ['numero','client','livraison','date','poids','cout','statut'];
  private charts: Chart[] = [];

  get filteredRows(): any[] {
    if (!this.data?.rows) return [];
    const s = this.search.toLowerCase();
    return this.data.rows.filter((r: any) =>
      !s || Object.values(r).some(v => String(v).toLowerCase().includes(s))
    );
  }

  constructor(
    public router: Router,
    private rapportSvc: RapportService,
    private excelSvc: ExcelExportService,
    private pdfSvc: PdfExportService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { this.load(); }

  ngOnDestroy(): void { this.charts.forEach(c => c.destroy()); }

  load(): void {
    this.loading = true;
    this.rapportSvc.getRapportLivraisons().subscribe({
      next: d => {
        this.data = d;
        this.loading = false;
        setTimeout(() => this.buildCharts(), 100);
      },
      error: () => {
        this.loading = false;
        this.snack.open('Erreur de chargement', 'OK', { duration: 3000 });
      }
    });
  }

  private buildCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    const ev = this.data.evolution || [];
    const labels = ev.map((e: any) => e.label);
    const BLUE = '#1B4F72'; const ORANGE = '#E67E22'; const GREEN = '#27AE60'; const RED = '#E74C3C';

    // LINE — évolution
    if (this.lineRef) {
      this.charts.push(new Chart(this.lineRef.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Total', data: ev.map((e: any) => e.total), borderColor: BLUE, backgroundColor: BLUE+'22', fill: true, tension: .4 },
            { label: 'Livrées', data: ev.map((e: any) => e.livrees), borderColor: GREEN, backgroundColor: GREEN+'22', fill: true, tension: .4 },
            { label: 'Annulées', data: ev.map((e: any) => e.annulees), borderColor: RED, backgroundColor: RED+'22', fill: true, tension: .4 },
          ]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
      }));
    }

    // PIE — répartition statuts
    if (this.pieRef) {
      this.charts.push(new Chart(this.pieRef.nativeElement, {
        type: 'pie',
        data: {
          labels: ['En attente','Assignées','En cours','Livrées','Annulées'],
          datasets: [{ data: [this.data.enAttente, this.data.assignees, this.data.enCours, this.data.livrees, this.data.annulees],
            backgroundColor: ['#95a5a6', BLUE, ORANGE, GREEN, RED] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'right' } } }
      }));
    }

    // BAR — revenus
    if (this.barRef) {
      this.charts.push(new Chart(this.barRef.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: 'Revenu (DT)', data: ev.map((e: any) => e.revenu), backgroundColor: ORANGE, borderColor: ORANGE, borderWidth: 1, borderRadius: 4 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      }));
    }
  }

  getStatutClass(s: string): string {
    const m: any = { 'LIVREE':'badge-livree','EN_COURS':'badge-encours','ANNULEE':'badge-annulee','EN_ATTENTE':'badge-attente','ASSIGNEE':'badge-assignee' };
    return m[s] || '';
  }

  exportExcel(): void {
    const cols = [
      { key:'numero', label:'N° Commande' }, { key:'client', label:'Client' },
      { key:'livraison', label:'Adresse livraison' }, { key:'date', label:'Date' },
      { key:'poids', label:'Poids' }, { key:'cout', label:'Coût estimé' }, { key:'statut', label:'Statut' }
    ];
    this.excelSvc.exportToExcelStyled(this.data.rows, cols, 'rapport_livraisons', 'Rapport Livraisons');
  }

  exportPdf(): void {
    const cols = [
      { key:'numero', label:'N° Commande', width:30 }, { key:'client', label:'Client', width:35 },
      { key:'date', label:'Date', width:22 }, { key:'poids', label:'Poids', width:20 },
      { key:'cout', label:'Coût', width:22 }, { key:'statut', label:'Statut', width:22 }
    ];
    const stats = [
      { label:'Total commandes', value: String(this.data.total) },
      { label:'Livrées', value: String(this.data.livrees) },
      { label:'En cours', value: String(this.data.enCours) },
      { label:'Annulées', value: String(this.data.annulees) },
      { label:'Revenu', value: this.data.revenu + ' DT' },
      { label:'Taux livraison', value: this.data.taux + '%' }
    ];
    this.pdfSvc.exportRapportPdf('Rapport des Livraisons', `Généré le ${new Date().toLocaleDateString('fr-FR')}`, stats, this.data.rows, cols, 'rapport_livraisons');
  }

  exportCsv(): void { this.excelSvc.exportCsv(this.data.rows, 'rapport_livraisons'); }

  imprimer(): void { window.print(); }
}
