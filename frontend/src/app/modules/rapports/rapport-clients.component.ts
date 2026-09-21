import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RapportService } from '../../core/services/rapport.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-rapport-clients',
  template: `
    <div class="rapport-header">
      <div class="back-title">
        <button mat-icon-button (click)="router.navigate(['/rapports'])"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1><mat-icon>people</mat-icon> Rapport des Clients</h1>
          <p>Chiffre d'affaires, commandes et fidélité par client</p>
        </div>
      </div>
      <div class="actions">
        <button mat-raised-button (click)="load()"><mat-icon>refresh</mat-icon> Actualiser</button>
        <button mat-raised-button color="primary" [matMenuTriggerFor]="exportMenu"><mat-icon>download</mat-icon> Exporter</button>
        <mat-menu #exportMenu="matMenu">
          <button mat-menu-item (click)="exportExcel()"><mat-icon>table_view</mat-icon> Excel</button>
          <button mat-menu-item (click)="exportPdf()"><mat-icon>picture_as_pdf</mat-icon> PDF</button>
          <button mat-menu-item (click)="exportCsv()"><mat-icon>description</mat-icon> CSV</button>
          <button mat-menu-item (click)="imprimer()"><mat-icon>print</mat-icon> Imprimer</button>
        </mat-menu>
      </div>
    </div>

    <div *ngIf="loading" class="loading-overlay"><mat-spinner diameter="60"></mat-spinner><p>Chargement...</p></div>

    <div *ngIf="!loading && data">
      <div class="stats-grid">
        <div class="stat-card primary"><mat-icon>people</mat-icon><div class="val">{{data.total}}</div><div class="lbl">Total clients</div></div>
        <div class="stat-card accent"><mat-icon>assignment</mat-icon><div class="val">{{data.totalCommandes}}</div><div class="lbl">Total commandes</div></div>
        <div class="stat-card success"><mat-icon>euro_symbol</mat-icon><div class="val">{{data.totalCA | number:'1.0-0'}} DT</div><div class="lbl">CA Total</div></div>
        <div class="stat-card info"><mat-icon>trending_up</mat-icon><div class="val">{{ data.total > 0 ? (data.totalCA / data.total | number:'1.0-0') : 0 }} DT</div><div class="lbl">CA moyen / client</div></div>
      </div>

      <div class="charts-grid">
        <div class="tms-card chart-card">
          <h3><mat-icon>bar_chart</mat-icon> CA par client (Top 8)</h3>
          <canvas #barChart width="400" height="220"></canvas>
        </div>
        <div class="tms-card chart-card">
          <h3><mat-icon>pie_chart</mat-icon> Commandes par client (Top 6)</h3>
          <canvas #pieChart width="300" height="220"></canvas>
        </div>
      </div>

      <div class="tms-card">
        <div class="table-toolbar">
          <h3><mat-icon>table_chart</mat-icon> Détail clients ({{data.rows.length}})</h3>
          <mat-form-field appearance="outline" style="width:220px">
            <mat-label>Rechercher</mat-label>
            <input matInput [(ngModel)]="search"><mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
        <div class="table-container">
          <table mat-table [dataSource]="filteredRows" class="tms-table">
            <ng-container matColumnDef="raisonSociale"><th mat-header-cell *matHeaderCellDef>Client</th><td mat-cell *matCellDef="let r"><strong>{{r.raisonSociale}}</strong></td></ng-container>
            <ng-container matColumnDef="ville"><th mat-header-cell *matHeaderCellDef>Ville</th><td mat-cell *matCellDef="let r">{{r.ville}}</td></ng-container>
            <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>Email</th><td mat-cell *matCellDef="let r">{{r.email}}</td></ng-container>
            <ng-container matColumnDef="commandes"><th mat-header-cell *matHeaderCellDef>Commandes</th><td mat-cell *matCellDef="let r">{{r.commandes}}</td></ng-container>
            <ng-container matColumnDef="livrees"><th mat-header-cell *matHeaderCellDef>Livrées</th><td mat-cell *matCellDef="let r">{{r.livrees}}</td></ng-container>
            <ng-container matColumnDef="tauxLivraison"><th mat-header-cell *matHeaderCellDef>Taux livraison</th>
              <td mat-cell *matCellDef="let r">
                <div class="progress-bar"><div class="bar" [style.width]="r.tauxLivraison"></div><span>{{r.tauxLivraison}}</span></div>
              </td>
            </ng-container>
            <ng-container matColumnDef="ca"><th mat-header-cell *matHeaderCellDef>CA (DT)</th><td mat-cell *matCellDef="let r"><strong>{{r.ca}}</strong></td></ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;" class="table-row"></tr>
            <tr class="mat-row" *matNoDataRow><td class="mat-cell no-data" colspan="7"><mat-icon>people_outline</mat-icon><p>Aucun client</p></td></tr>
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
    .loading-overlay { text-align:center; padding:80px; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:16px; margin-bottom:24px; }
    .stat-card { border-radius:12px; padding:20px 16px; text-align:center; color:white; }
    .stat-card mat-icon { font-size:32px; width:32px; height:32px; opacity:.85; }
    .stat-card .val { font-size:22px; font-weight:700; margin:8px 0 4px; }
    .stat-card .lbl { font-size:12px; opacity:.9; }
    .stat-card.primary { background:linear-gradient(135deg,#1B4F72,#2980b9); }
    .stat-card.accent  { background:linear-gradient(135deg,#8e44ad,#9b59b6); }
    .stat-card.success { background:linear-gradient(135deg,#27AE60,#2ecc71); }
    .stat-card.info    { background:linear-gradient(135deg,#16a085,#1abc9c); }
    .charts-grid { display:grid; grid-template-columns:3fr 2fr; gap:20px; margin-bottom:24px; }
    .chart-card { padding:20px; }
    .chart-card h3 { display:flex; align-items:center; gap:6px; margin:0 0 16px; color:#1B4F72; font-size:15px; }
    .table-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .table-toolbar h3 { display:flex; align-items:center; gap:6px; margin:0; color:#1B4F72; }
    .table-container { overflow-x:auto; }
    .tms-table { width:100%; } .tms-table th { background:#1B4F72; color:white; font-weight:600; }
    .table-row:hover { background:#f5f9fc; }
    .no-data { text-align:center; padding:30px !important; color:#999; }
    .progress-bar { display:flex; align-items:center; gap:8px; }
    .progress-bar .bar { height:6px; background:linear-gradient(90deg,#1B4F72,#27AE60); border-radius:3px; min-width:4px; transition:width .3s; }
    .progress-bar span { font-size:12px; font-weight:600; color:#1B4F72; white-space:nowrap; }
    @media (max-width:768px) { .charts-grid { grid-template-columns:1fr; } }
    @media print { .actions, .back-title button { display:none !important; } }
  `]
})
export class RapportClientsComponent implements OnInit, OnDestroy {
  @ViewChild('barChart') barRef!: ElementRef;
  @ViewChild('pieChart') pieRef!: ElementRef;
  data: any = null; loading = false; search = '';
  cols = ['raisonSociale','ville','email','commandes','livrees','tauxLivraison','ca'];
  private charts: Chart[] = [];

  get filteredRows(): any[] {
    if (!this.data?.rows) return [];
    const s = this.search.toLowerCase();
    return this.data.rows.filter((r: any) => !s || Object.values(r).some(v => String(v).toLowerCase().includes(s)));
  }

  constructor(public router: Router, private rapportSvc: RapportService, private excelSvc: ExcelExportService, private pdfSvc: PdfExportService, private snack: MatSnackBar) {}
  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.charts.forEach(c => c.destroy()); }

  load(): void {
    this.loading = true;
    this.rapportSvc.getRapportClients().subscribe({
      next: d => { this.data = d; this.loading = false; setTimeout(() => this.buildCharts(), 100); },
      error: () => { this.loading = false; this.snack.open('Erreur', 'OK', { duration: 3000 }); }
    });
  }

  private buildCharts(): void {
    this.charts.forEach(c => c.destroy()); this.charts = [];
    const top8 = [...(this.data.rows || [])].sort((a: any, b: any) => parseInt(b.ca) - parseInt(a.ca)).slice(0, 8);
    const top6 = [...(this.data.rows || [])].sort((a: any, b: any) => b.commandes - a.commandes).slice(0, 6);
    const COLORS = ['#1B4F72','#E67E22','#27AE60','#E74C3C','#8e44ad','#16a085','#2980b9','#f39c12'];

    if (this.barRef && top8.length > 0) {
      this.charts.push(new Chart(this.barRef.nativeElement, {
        type: 'bar',
        data: { labels: top8.map((r: any) => r.raisonSociale), datasets: [{ label: 'CA (DT)', data: top8.map((r: any) => parseInt(r.ca) || 0), backgroundColor: COLORS, borderRadius: 6 }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      }));
    }
    if (this.pieRef && top6.length > 0) {
      this.charts.push(new Chart(this.pieRef.nativeElement, {
        type: 'pie',
        data: { labels: top6.map((r: any) => r.raisonSociale), datasets: [{ data: top6.map((r: any) => r.commandes), backgroundColor: COLORS, hoverOffset: 4 }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }
      }));
    }
  }

  exportExcel(): void {
    const cols = [{ key:'raisonSociale',label:'Client' },{ key:'ville',label:'Ville' },{ key:'email',label:'Email' },{ key:'commandes',label:'Commandes' },{ key:'livrees',label:'Livrées' },{ key:'tauxLivraison',label:'Taux livraison' },{ key:'ca',label:'CA (DT)' }];
    this.excelSvc.exportToExcelStyled(this.data.rows, cols, 'rapport_clients', 'Rapport Clients');
  }
  exportPdf(): void {
    const cols = [{ key:'raisonSociale',label:'Client',width:40 },{ key:'ville',label:'Ville',width:25 },{ key:'commandes',label:'Commandes',width:22 },{ key:'livrees',label:'Livrées',width:18 },{ key:'tauxLivraison',label:'Taux',width:18 },{ key:'ca',label:'CA (DT)',width:22 }];
    const stats = [{ label:'Clients',value:String(this.data.total) },{ label:'Commandes',value:String(this.data.totalCommandes) },{ label:'CA Total',value:this.data.totalCA+' DT' }];
    this.pdfSvc.exportRapportPdf('Rapport des Clients','',stats,this.data.rows,cols,'rapport_clients');
  }
  exportCsv(): void { this.excelSvc.exportCsv(this.data.rows,'rapport_clients'); }
  imprimer(): void { window.print(); }
}
