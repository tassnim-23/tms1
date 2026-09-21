import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RapportService } from '../../core/services/rapport.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-rapport-personnalise',
  template: `
    <div class="rapport-header">
      <div class="back-title">
        <button mat-icon-button (click)="router.navigate(['/rapports'])"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1><mat-icon>tune</mat-icon> Rapport Personnalisé</h1>
          <p>Configurez votre rapport sur mesure</p>
        </div>
      </div>
    </div>

    <!-- WIZARD ÉTAPES -->
    <div class="wizard-container">
      <!-- Étape 1 : Sélection source -->
      <div class="tms-card wizard-step" [class.active]="step >= 1">
        <div class="step-header" (click)="step = 1">
          <span class="step-num" [class.done]="step > 1">{{ step > 1 ? '✓' : '1' }}</span>
          <h3>Source de données</h3>
          <mat-icon>{{ step === 1 ? 'expand_less' : 'expand_more' }}</mat-icon>
        </div>
        <div class="step-body" *ngIf="step === 1">
          <div class="sources-grid">
            <div *ngFor="let s of sources" class="source-card" [class.selected]="selectedSource === s.key" (click)="selectSource(s.key)">
              <mat-icon [style.color]="s.color">{{ s.icon }}</mat-icon>
              <span>{{ s.label }}</span>
            </div>
          </div>
          <button mat-raised-button color="primary" [disabled]="!selectedSource" (click)="step = 2; loadData()">
            Suivant <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </div>

      <!-- Étape 2 : Colonnes -->
      <div class="tms-card wizard-step" [class.active]="step >= 2">
        <div class="step-header" (click)="step >= 2 && (step = 2)">
          <span class="step-num" [class.done]="step > 2">{{ step > 2 ? '✓' : '2' }}</span>
          <h3>Colonnes à afficher</h3>
          <mat-icon>{{ step === 2 ? 'expand_less' : 'expand_more' }}</mat-icon>
        </div>
        <div class="step-body" *ngIf="step === 2">
          <p style="color:#666;margin:0 0 12px">Cochez les colonnes à inclure dans le rapport :</p>
          <div class="cols-grid">
            <mat-checkbox *ngFor="let c of availableColumns" [(ngModel)]="c.selected" color="primary">{{ c.label }}</mat-checkbox>
          </div>
          <div class="step-actions">
            <button mat-button (click)="step = 1"><mat-icon>arrow_back</mat-icon> Retour</button>
            <button mat-raised-button color="primary" [disabled]="!hasSelectedCols" (click)="step = 3">
              Suivant <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Étape 3 : Graphiques -->
      <div class="tms-card wizard-step" [class.active]="step >= 3">
        <div class="step-header" (click)="step >= 3 && (step = 3)">
          <span class="step-num" [class.done]="step > 3">{{ step > 3 ? '✓' : '3' }}</span>
          <h3>Type de graphique</h3>
          <mat-icon>{{ step === 3 ? 'expand_less' : 'expand_more' }}</mat-icon>
        </div>
        <div class="step-body" *ngIf="step === 3">
          <div class="chart-types">
            <div *ngFor="let t of chartTypes" class="chart-type" [class.selected]="selectedChart === t.key" (click)="selectedChart = t.key">
              <mat-icon>{{ t.icon }}</mat-icon>
              <span>{{ t.label }}</span>
            </div>
            <div class="chart-type" [class.selected]="selectedChart === 'none'" (click)="selectedChart = 'none'">
              <mat-icon>block</mat-icon>
              <span>Sans graphique</span>
            </div>
          </div>
          <div class="step-actions">
            <button mat-button (click)="step = 2"><mat-icon>arrow_back</mat-icon> Retour</button>
            <button mat-raised-button color="primary" (click)="step = 4; generateReport()">
              <mat-icon>assessment</mat-icon> Générer le rapport
            </button>
          </div>
        </div>
      </div>

      <!-- Étape 4 : Résultat -->
      <div class="tms-card wizard-step" [class.active]="step === 4" *ngIf="step === 4">
        <div class="step-header">
          <span class="step-num done">✓</span>
          <h3>Rapport Généré</h3>
          <div class="export-btns">
            <button mat-raised-button color="primary" [matMenuTriggerFor]="exportMenu"><mat-icon>download</mat-icon> Exporter</button>
            <mat-menu #exportMenu="matMenu">
              <button mat-menu-item (click)="exportExcel()"><mat-icon>table_view</mat-icon> Excel</button>
              <button mat-menu-item (click)="exportPdf()"><mat-icon>picture_as_pdf</mat-icon> PDF</button>
              <button mat-menu-item (click)="exportCsv()"><mat-icon>description</mat-icon> CSV</button>
              <button mat-menu-item (click)="imprimer()"><mat-icon>print</mat-icon> Imprimer</button>
            </mat-menu>
            <button mat-button (click)="step = 1; resetReport()"><mat-icon>refresh</mat-icon> Nouveau</button>
          </div>
        </div>
        <div class="step-body" *ngIf="reportRows.length > 0">
          <!-- Graphique -->
          <div class="chart-wrapper" *ngIf="selectedChart !== 'none'">
            <canvas #customChart width="600" height="200"></canvas>
          </div>
          <!-- Tableau résultat -->
          <div class="table-container">
            <table mat-table [dataSource]="reportRows" class="tms-table">
              <ng-container *ngFor="let c of selectedCols" [matColumnDef]="c.key">
                <th mat-header-cell *matHeaderCellDef>{{ c.label }}</th>
                <td mat-cell *matCellDef="let r">{{ r[c.key] ?? '—' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="selectedColKeys"></tr>
              <tr mat-row *matRowDef="let row; columns: selectedColKeys;" class="table-row"></tr>
            </table>
          </div>
          <p class="row-count">{{ reportRows.length }} enregistrement(s)</p>
        </div>
        <div *ngIf="reportRows.length === 0" class="no-data">
          <mat-icon>inbox</mat-icon><p>Aucune donnée disponible pour cette sélection.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rapport-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
    .back-title { display:flex; align-items:center; gap:8px; }
    .back-title h1 { display:flex; align-items:center; gap:8px; font-size:22px; color:#1B4F72; margin:0; }
    .back-title p { margin:4px 0 0; color:#666; font-size:13px; }
    .wizard-container { display:flex; flex-direction:column; gap:16px; }
    .wizard-step { padding:0; overflow:hidden; transition:all .3s; }
    .wizard-step.active { border:2px solid #1B4F72; }
    .step-header { display:flex; align-items:center; gap:12px; padding:16px 20px; cursor:pointer; background:#f8fafc; }
    .step-header h3 { flex:1; margin:0; font-size:16px; color:#1B4F72; }
    .step-num { width:30px; height:30px; border-radius:50%; background:#1B4F72; color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; flex-shrink:0; }
    .step-num.done { background:#27AE60; }
    .step-body { padding:20px; border-top:1px solid #e0e0e0; }
    .sources-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:12px; margin-bottom:20px; }
    .source-card { border:2px solid #e0e0e0; border-radius:12px; padding:16px 12px; text-align:center; cursor:pointer; transition:all .2s; display:flex; flex-direction:column; align-items:center; gap:8px; }
    .source-card:hover { border-color:#1B4F72; background:#f0f6fb; }
    .source-card.selected { border-color:#1B4F72; background:#e3f2fd; }
    .source-card mat-icon { font-size:32px; width:32px; height:32px; }
    .source-card span { font-size:13px; font-weight:600; color:#1B4F72; }
    .cols-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; margin-bottom:20px; }
    .chart-types { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
    .chart-type { border:2px solid #e0e0e0; border-radius:12px; padding:14px 18px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px; transition:all .2s; min-width:90px; }
    .chart-type:hover { border-color:#1B4F72; }
    .chart-type.selected { border-color:#1B4F72; background:#e3f2fd; }
    .chart-type mat-icon { font-size:28px; width:28px; height:28px; color:#1B4F72; }
    .chart-type span { font-size:12px; font-weight:600; color:#1B4F72; }
    .step-actions { display:flex; gap:12px; }
    .export-btns { margin-left:auto; display:flex; gap:8px; }
    .chart-wrapper { margin-bottom:20px; max-height:260px; }
    .table-container { overflow-x:auto; }
    .tms-table { width:100%; } .tms-table th { background:#1B4F72; color:white; font-weight:600; }
    .table-row:hover { background:#f5f9fc; }
    .row-count { color:#666; font-size:13px; margin-top:8px; }
    .no-data { text-align:center; padding:40px; color:#999; }
    @media print { .wizard-step:not(:last-child) { display:none; } .step-header { cursor:default; } }
  `]
})
export class RapportPersonnaliseComponent implements OnInit, OnDestroy {
  @ViewChild('customChart') chartRef!: ElementRef;

  step = 1;
  selectedSource = '';
  selectedChart = 'bar';
  reportRows: any[] = [];
  availableColumns: { key: string; label: string; selected: boolean }[] = [];
  private rawData: any[] = [];
  private chart: Chart | null = null;

  sources = [
    { key: 'livraisons', label: 'Commandes', icon: 'assignment', color: '#1B4F72' },
    { key: 'chauffeurs', label: 'Chauffeurs', icon: 'person', color: '#27AE60' },
    { key: 'vehicules',  label: 'Véhicules',  icon: 'directions_car', color: '#E67E22' },
    { key: 'clients',    label: 'Clients',    icon: 'people', color: '#8e44ad' },
    { key: 'tournees',   label: 'Tournées',   icon: 'map', color: '#E74C3C' },
  ];

  chartTypes = [
    { key: 'bar',       label: 'Barres',   icon: 'bar_chart' },
    { key: 'line',      label: 'Ligne',    icon: 'show_chart' },
    { key: 'pie',       label: 'Secteurs', icon: 'pie_chart' },
    { key: 'doughnut',  label: 'Donut',    icon: 'donut_large' },
  ];

  private colsMap: Record<string, { key: string; label: string }[]> = {
    livraisons: [
      { key:'numero',label:'N° Commande' }, { key:'client',label:'Client' },
      { key:'date',label:'Date' }, { key:'poids',label:'Poids' },
      { key:'cout',label:'Coût' }, { key:'statut',label:'Statut' }
    ],
    chauffeurs: [
      { key:'nom',label:'Nom' }, { key:'telephone',label:'Téléphone' },
      { key:'permis',label:'N° Permis' }, { key:'validite',label:'Validité permis' },
      { key:'tournees',label:'Tournées' }, { key:'disponible',label:'Disponibilité' }
    ],
    vehicules: [
      { key:'immat',label:'Immatriculation' }, { key:'marque',label:'Marque' },
      { key:'capacite',label:'Capacité' }, { key:'km',label:'Kilométrage' },
      { key:'statut',label:'Statut' }, { key:'miseEnService',label:'Mise en service' }
    ],
    clients: [
      { key:'raisonSociale',label:'Client' }, { key:'ville',label:'Ville' },
      { key:'commandes',label:'Commandes' }, { key:'livrees',label:'Livrées' },
      { key:'tauxLivraison',label:'Taux' }, { key:'ca',label:'CA (DT)' }
    ],
    tournees: [
      { key:'date',label:'Date' }, { key:'chauffeur',label:'Chauffeur' },
      { key:'vehicule',label:'Véhicule' }, { key:'distance',label:'Distance' },
      { key:'statut',label:'Statut' }, { key:'livraisons',label:'Livraisons' }
    ]
  };

  get hasSelectedCols(): boolean { return this.availableColumns.some(c => c.selected); }
  get selectedCols(): { key: string; label: string }[] { return this.availableColumns.filter(c => c.selected); }
  get selectedColKeys(): string[] { return this.selectedCols.map(c => c.key); }

  constructor(
    public router: Router,
    private rapportSvc: RapportService,
    private excelSvc: ExcelExportService,
    private pdfSvc: PdfExportService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {}
  ngOnDestroy(): void { this.chart?.destroy(); }

  selectSource(key: string): void {
    this.selectedSource = key;
    this.availableColumns = (this.colsMap[key] || []).map(c => ({ ...c, selected: true }));
  }

  loadData(): void {
    const obs: Record<string, any> = {
      livraisons: this.rapportSvc.getRapportLivraisons(),
      chauffeurs: this.rapportSvc.getRapportChauffeurs(),
      vehicules:  this.rapportSvc.getRapportVehicules(),
      clients:    this.rapportSvc.getRapportClients(),
      tournees:   this.rapportSvc.getRapportTournees(),
    };
    obs[this.selectedSource]?.subscribe({ next: (d: any) => { this.rawData = d.rows || []; } });
  }

  generateReport(): void {
    this.reportRows = this.rawData;
    setTimeout(() => this.buildChart(), 150);
  }

  private buildChart(): void {
    this.chart?.destroy();
    if (!this.chartRef || this.selectedChart === 'none' || !this.reportRows.length) return;
    const firstNumericCol = this.selectedCols.find(c => !isNaN(parseInt(this.reportRows[0]?.[c.key])));
    if (!firstNumericCol) return;
    const labelCol = this.selectedCols[0];
    const labels = this.reportRows.slice(0, 10).map(r => String(r[labelCol.key]).substring(0, 15));
    const values = this.reportRows.slice(0, 10).map(r => parseFloat(r[firstNumericCol.key]) || 0);
    const COLORS = ['#1B4F72','#E67E22','#27AE60','#E74C3C','#8e44ad','#16a085','#2980b9','#f39c12','#c0392b','#2ecc71'];
    this.chart = new Chart(this.chartRef.nativeElement, {
      type: this.selectedChart as any,
      data: { labels, datasets: [{ label: firstNumericCol.label, data: values, backgroundColor: COLORS, borderColor: this.selectedChart === 'line' ? '#1B4F72' : COLORS, borderRadius: 4, fill: this.selectedChart === 'line', tension: .4 }] },
      options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: this.selectedChart !== 'pie' && this.selectedChart !== 'doughnut' ? { y: { beginAtZero: true } } : undefined }
    });
  }

  resetReport(): void {
    this.selectedSource = ''; this.selectedChart = 'bar';
    this.reportRows = []; this.rawData = []; this.availableColumns = [];
    this.chart?.destroy(); this.chart = null;
  }

  exportExcel(): void { this.excelSvc.exportToExcelStyled(this.reportRows, this.selectedCols, 'rapport_personnalise', 'Rapport Personnalisé'); }
  exportPdf(): void {
    const cols = this.selectedCols.map(c => ({ key: c.key, label: c.label }));
    this.pdfSvc.exportRapportPdf('Rapport Personnalisé', this.selectedSource, [], this.reportRows, cols, 'rapport_personnalise');
  }
  exportCsv(): void { this.excelSvc.exportCsv(this.reportRows,'rapport_personnalise'); }
  imprimer(): void { window.print(); }
}
