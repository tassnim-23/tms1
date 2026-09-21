import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OptimisationService, TourneeOptimisee } from '../../services/optimisation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';
import * as L from 'leaflet';

// Coordonnées GPS précises — gouvernorats + quartiers de Tunisie
const VILLES_COORDS: {[key: string]: [number, number]} = {
  // Gouvernorats
  'tunis': [36.8065, 10.1815],
  'sfax': [34.7406, 10.7603],
  'sousse': [35.8245, 10.6346],
  'bizerte': [37.2744, 9.8739],
  'nabeul': [36.4561, 10.7376],
  'kairouan': [35.6781, 10.0963],
  'gabes': [33.8881, 10.0975],
  'gafsa': [34.4250, 8.7842],
  'monastir': [35.7775, 10.8331],
  'mahdia': [35.5047, 11.0622],
  'beja': [36.7333, 9.1833],
  'jendouba': [36.5011, 8.7803],
  'ariana': [36.8625, 10.1956],
  'la marsa': [36.8778, 10.3247],
  'hammamet': [36.4000, 10.6167],
  'medenine': [33.3549, 10.5055],
  'tataouine': [32.9211, 10.4508],
  'kasserine': [35.1671, 8.8309],
  'sidi bouzid': [35.0383, 9.4858],
  'siliana': [36.0847, 9.3708],
  'le kef': [36.1674, 8.7047],
  'kebili': [33.7042, 8.9689],
  'tozeur': [33.9197, 8.1335],
  'ben arous': [36.7531, 10.2184],
  'la manouba': [36.8094, 10.0967],
  'zaghouan': [36.4028, 9.9797],

  // Quartiers de Monastir (coordonnées distinctes)
  'cite omrane': [35.7720, 10.8050],
  'cite omrane monastir': [35.7720, 10.8050],
  'cite riadh': [35.7590, 10.8200],
  'cite riadh monastir': [35.7590, 10.8200],
  'cite el wafa': [35.7680, 10.8160],
  'cite ennour': [35.7550, 10.8300],
  'cite fattouma bourguiba': [35.7700, 10.8080],
  'corniche monastir': [35.7520, 10.8350],
  'quartier corniche': [35.7520, 10.8350],
  'bembla': [35.6844, 10.8968],
  'bembla monastir': [35.6844, 10.8968],
  'bembla-mnara': [35.6844, 10.8968],
  'mnara': [35.6844, 10.8968],
  'monastir medina': [35.7660, 10.8290],
  'khniss': [35.7351, 10.8230],
  'sidi ameur': [35.7541, 10.8714],
  'beni hassen': [35.5679, 10.7992],
  'ghenada': [35.6279, 10.9004],
  'menzel kamel': [35.6271, 10.6589],
  'zaouiet kontoch': [35.6021, 10.8304],
  'menzel ennour': [35.6119, 10.9008],
  'el masdour': [35.5151, 11.0362],
  'sidi bennour': [35.5304, 10.9630],
  'menzel farsi': [35.5552, 10.8695],
  'amiret el fhoul': [35.5313, 10.8570],
  'amiret touazra': [35.5387, 10.8081],
  'amiret el hojjaj': [35.5227, 10.8781],
  'cherahil': [35.5916, 10.8557],
  'benen bodher': [35.6697, 10.9383],
  'touza': [35.5882, 10.8729],
  'sayada': [35.6702, 10.9043],
  'lemta': [35.6751, 10.8817],
  'lamta': [35.6751, 10.8817],
  'cite hedi chaker': [35.6255, 10.7605],
  'cite hedi chaker jemmal': [35.6255, 10.7605],
  'hedi chaker': [35.6255, 10.7605],
  'rue hedi chaker': [35.6255, 10.7605],
  'bouhjar': [35.6024, 10.9858],
  'bekalta': [35.6173, 10.9961],
  'bekalta monastir': [35.6173, 10.9961],
  'menzel hayet': [35.7313, 10.7484],
  'ksar hellal': [35.6495, 10.8920],
  'ksar-hellal': [35.6495, 10.8920],
  'moknine': [35.6328, 10.9025],
  'teboulba': [35.6320, 11.0903],
  'téboulba': [35.6320, 11.0903],
  'port teboulba': [35.6285, 11.0950],
  'sahline': [35.7622, 10.7134],
  'ouardanine': [35.7069, 10.6945],
  'ouerdanin': [35.7069, 10.6945],
  'ouerdanine': [35.7069, 10.6945],
  'ksibet el mediouni': [35.6633, 10.8487],
  'ksibet': [35.6633, 10.8487],
  'ksibet mediouni': [35.6633, 10.8487],
  'zeramdine': [35.5924, 10.7269],
  'jammel': [35.6251, 10.7599],
  'jemmal': [35.6251, 10.7599],
  'djemmal': [35.6251, 10.7599],

  // Quartiers de Sousse
  'hammam sousse': [35.8600, 10.5900],
  'msaken': [35.7306, 10.5775],
  'akouda': [35.8700, 10.5500],

  // Quartiers de Sfax
  'sfax ville': [34.7406, 10.7603],
  'route el ain': [34.7480, 10.7650],
  'sakiet ezzit': [34.7667, 10.8000],

  // Quartiers de Tunis
  'carthage': [36.8531, 10.3217],
  'sidi bou said': [36.8683, 10.3411],
  'el menzah': [36.8394, 10.1739],
  'ennasr': [36.8927, 10.2069],
  'ettadhamen': [36.8433, 10.1461],
  'cite ettadhamen': [36.8433, 10.1461],
  'hammam lif': [36.7167, 10.3333],
  'rades': [36.7700, 10.2800],

  // Nabeul
  'korba': [36.5742, 10.8631],
  'kelibia': [36.8447, 11.0889],
  'zone touristique hammamet': [36.3950, 10.6300],
};

const DEPOT: [number, number] = [35.7775, 10.8331]; // ✅ Monastir

@Component({
  selector: 'app-optimisation',
  template: `
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="header-icon">🤖</div>
      <div>
        <h1>Optimisation des Tournées</h1>
        <p class="subtitle">Algorithme Nearest Neighbor + Machine Learning</p>
      </div>
    </div>
    <button class="btn-optimiser" (click)="lancer()" [disabled]="loading">
      <span *ngIf="!loading">⚡ Lancer l'optimisation</span>
      <span *ngIf="loading">⟳ En cours...</span>
    </button>
  </div>

  <!-- Info box -->
  <div class="info-box" *ngIf="!resultats.length && !loading">
    <div class="info-steps">
      <div class="step"><div class="step-icon">📦</div><div class="step-text"><strong>Étape 1</strong><span>Commandes EN_ATTENTE</span></div></div>
      <div class="step-arrow">→</div>
      <div class="step"><div class="step-icon">🗺️</div><div class="step-text"><strong>Étape 2</strong><span>Groupement GPS</span></div></div>
      <div class="step-arrow">→</div>
      <div class="step"><div class="step-icon">🤖</div><div class="step-text"><strong>Étape 3</strong><span>Prédiction ML</span></div></div>
      <div class="step-arrow">→</div>
      <div class="step"><div class="step-icon">✅</div><div class="step-text"><strong>Étape 4</strong><span>Appliquer</span></div></div>
    </div>
  </div>

  <!-- Loading -->
  <div class="loading-box" *ngIf="loading">
    <div class="loader"></div>
    <div><div class="loading-title">Optimisation en cours...</div><div class="loading-sub">{{ loadingStep }}</div></div>
  </div>

  <!-- Vide -->
  <div class="vide" *ngIf="!loading && resultats.length === 0 && lancee">
    <div class="vide-icon">📭</div>
    <p>Aucune commande EN_ATTENTE à optimiser</p>
  </div>

  <!-- Résultats -->
  <div *ngIf="!loading && resultats.length > 0">

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card"><div class="stat-val">{{ resultats.length }}</div><div class="stat-label">Tournées</div></div>
      <div class="stat-card"><div class="stat-val">{{ totalCommandes }}</div><div class="stat-label">Commandes</div></div>
      <div class="stat-card"><div class="stat-val">{{ totalDistance | number:'1.0-0' }} km</div><div class="stat-label">Distance</div></div>
      <div class="stat-card"><div class="stat-val">{{ totalCout | number:'1.0-0' }} DT</div><div class="stat-label">Coût estimé</div></div>
    </div>

    <!-- Carte -->
    <div class="carte-section">
      <div class="carte-header">
        <h3>🗺️ Carte des routes optimisées — chemin le plus court par priorité</h3>
        <div class="carte-legende">
          <span class="legende-item"><span class="dot" style="background:#c62828"></span> 🔴 URGENT</span>
          <span class="legende-item"><span class="dot" style="background:#e65100"></span> 🟠 Haute</span>
          <span class="legende-item"><span class="dot" style="background:#1565c0"></span> 🔵 Normale</span>
          <span class="legende-item"><span class="dot" style="background:#2e7d32"></span> 🟢 Basse</span>
          <span class="legende-item"><span class="dot depot"></span> 🏭 Dépôt</span>
          <span class="legende-item" *ngFor="let c of couleursTournees; let i = index">
            <span class="dot" [style.background]="c"></span> Tournée {{ i + 1 }}
          </span>
        </div>
      </div>
      <div id="carte-optimisation" class="carte-container"></div>
    </div>

    <!-- Tournées avec sélection chauffeur/véhicule -->
    <div class="tournees-grid">
      <div *ngFor="let t of resultats; let i = index" class="tournee-card" [style.border-top-color]="couleursTournees[i]">

        <div class="card-header" [style.border-left]="'4px solid ' + couleursTournees[i]">
          <div class="card-numero">{{ t.numero }}</div>
          <div class="card-badge">{{ t.nbCommandes }} commande(s)</div>
        </div>

        <div class="card-metrics">
          <div class="metric"><span class="metric-icon">📍</span><div><div class="metric-val">{{ t.distanceKm | number:'1.0-0' }} km</div><div class="metric-label">Distance</div></div></div>
          <div class="metric"><span class="metric-icon">⏱️</span><div>
            <div class="metric-val">{{ t.tempsML ? (t.tempsML | number:'1.0-0') : t.tempsEstimeMinutes }} min
              <span class="ml-badge" *ngIf="t.tempsML">ML</span>
            </div><div class="metric-label">Temps</div></div>
          </div>
          <div class="metric"><span class="metric-icon">💰</span><div>
            <div class="metric-val">{{ (t.coutML ? t.coutML : t.coutEstimeDT) | number:'1.0-2' }} DT
              <span class="ml-badge" *ngIf="t.coutML">ML</span>
            </div><div class="metric-label">Coût</div></div>
          </div>
        </div>

        <!-- Sélection chauffeur/véhicule -->
        <div class="ressources-section">
          <div class="ressource-field">
            <label>👤 Chauffeur <span class="auto-badge" *ngIf="selections[i]?.autoAssigne">AUTO</span></label>
            <select [(ngModel)]="selections[i].chauffeurId" class="ressource-select"
                    [class.auto]="selections[i]?.autoAssigne"
                    (change)="onRessourceChange(i)">
              <option value="">-- Sélectionnez un chauffeur --</option>
              <option *ngFor="let c of chauffeurs" [value]="c.id">
                {{ c.prenom }} {{ c.nom }} ({{ c.disponible ? 'Disponible' : 'Indisponible' }})
              </option>
            </select>
          </div>
          <div class="ressource-field">
            <label>🚛 Véhicule <span class="auto-badge" *ngIf="selections[i]?.autoAssigne">AUTO</span></label>
            <select [(ngModel)]="selections[i].vehiculeId" class="ressource-select"
                    [class.auto]="selections[i]?.autoAssigne"
                    (change)="onRessourceChange(i)">
              <option value="">-- Sélectionnez un véhicule --</option>
              <option *ngFor="let v of vehicules" [value]="v.id">
                {{ v.marque }} {{ v.modele }} — {{ v.immatriculation }} ({{ v.statut === 'DISPONIBLE' ? 'Disponible' : 'Indisponible' }})
              </option>
            </select>
          </div>
        </div>

        <!-- Arrêts -->
        <div class="commandes-list">
          <div class="commandes-titre">Arrêts (ordre optimisé ML) :</div>
          <div *ngFor="let c of t.commandes; let j = index" class="commande-item">
            <span class="arret-num" [style.background]="couleursTournees[i]">{{ j + 1 }}</span>
            <div class="arret-info">
              <div class="arret-ville">{{ c.adresseLivraison || c.villeLivraison || '—' }}</div>
              <div class="arret-client">{{ c.client }} — {{ c.poids || 0 }} kg</div>
            </div>
            <span class="priorite-badge"
              [style.background]="getPrioriteCouleur(c.priorite)"
              [style.color]="'white'">
              {{ c.priorite || 'NORMALE' }}
            </span>
          </div>
        </div>

      </div>
    </div>

    <!-- Bouton appliquer -->
    <div class="actions-footer">
      <button class="btn-appliquer" (click)="appliquer()" [disabled]="applique || !selectionsValides">
        {{ applique ? '✅ Tournées créées !' : '✅ Appliquer — Créer les tournées' }}
      </button>
      <p class="aide" *ngIf="!selectionsValides">⚠️ Veuillez sélectionner un chauffeur et un véhicule pour chaque tournée</p>
    </div>

  </div>
</div>
  `,
  styles: [`
    .page { padding: 20px; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px; }
    .header-left { display:flex; align-items:center; gap:14px; }
    .header-icon { font-size:36px; }
    h1 { margin:0; font-size:22px; font-weight:700; color:#1a237e; }
    .subtitle { margin:2px 0 0; font-size:13px; color:#888; }
    .btn-optimiser { padding:12px 24px; background:linear-gradient(135deg,#1a237e,#3f51b5); color:white; border:none; border-radius:10px; cursor:pointer; font-size:15px; font-weight:700; }
    .btn-optimiser:disabled { opacity:.6; cursor:not-allowed; }
    .auto-badge { background:#e3f2fd; color:#1565c0; font-size:10px; padding:2px 6px; border-radius:8px; margin-left:4px; font-weight:600; }
    .ressource-select.auto { border-color:#1565c0; background:#f0f7ff; }

    .info-box { background:white; border-radius:14px; padding:28px; box-shadow:0 2px 12px rgba(0,0,0,.07); margin-bottom:24px; }
    .info-steps { display:flex; align-items:center; gap:12px; flex-wrap:wrap; justify-content:center; }
    .step { display:flex; align-items:center; gap:10px; background:#f8f9ff; border-radius:10px; padding:14px 18px; }
    .step-icon { font-size:28px; }
    .step-text { display:flex; flex-direction:column; }
    .step-text strong { font-size:13px; color:#1a237e; }
    .step-text span { font-size:12px; color:#666; }
    .step-arrow { font-size:20px; color:#bbb; }

    .loading-box { display:flex; align-items:center; gap:20px; background:white; border-radius:14px; padding:32px; box-shadow:0 2px 12px rgba(0,0,0,.07); }
    .loader { width:40px; height:40px; border:4px solid #e0e0e0; border-top-color:#3f51b5; border-radius:50%; animation:spin .8s linear infinite; flex-shrink:0; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .loading-title { font-size:16px; font-weight:700; color:#1a237e; }
    .loading-sub { font-size:13px; color:#888; margin-top:4px; }

    .vide { text-align:center; padding:80px 20px; color:#aaa; }
    .vide-icon { font-size:56px; margin-bottom:12px; }

    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
    .stat-card { background:white; border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,.07); text-align:center; }
    .stat-val { font-size:28px; font-weight:800; color:#1a237e; }
    .stat-label { font-size:12px; color:#888; margin-top:4px; text-transform:uppercase; }

    .carte-section { background:white; border-radius:14px; padding:20px; box-shadow:0 2px 12px rgba(0,0,0,.08); margin-bottom:24px; }
    .carte-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px; }
    .carte-header h3 { margin:0; font-size:16px; color:#1a237e; }
    .carte-legende { display:flex; gap:12px; flex-wrap:wrap; }
    .legende-item { display:flex; align-items:center; gap:6px; font-size:12px; color:#666; }
    .dot { width:12px; height:12px; border-radius:50%; display:inline-block; }
    .dot.depot { background:#e53935; }
    .carte-container { height:400px; border-radius:10px; overflow:hidden; border:1px solid #e0e0e0; }

    .tournees-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(420px,1fr)); gap:16px; margin-bottom:24px; }
    .tournee-card { background:white; border-radius:14px; box-shadow:0 2px 12px rgba(0,0,0,.08); overflow:hidden; border-top:4px solid #3f51b5; }
    .card-header { display:flex; justify-content:space-between; align-items:center; padding:14px 20px; background:#f8f9ff; }
    .card-numero { font-size:16px; font-weight:700; color:#1a237e; }
    .card-badge { background:#e8eaf6; color:#3f51b5; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; }
    .card-metrics { display:grid; grid-template-columns:repeat(3,1fr); padding:14px 20px; border-bottom:1px solid #f0f0f0; }
    .metric { display:flex; align-items:center; gap:8px; }
    .metric-icon { font-size:18px; }
    .metric-val { font-size:14px; font-weight:700; color:#333; }
    .metric-label { font-size:11px; color:#888; }
    .ml-badge { background:#e8f5e9; color:#2e7d32; font-size:10px; padding:1px 6px; border-radius:8px; font-weight:600; }

    .ressources-section { padding:14px 20px; background:#fafafa; border-bottom:1px solid #f0f0f0; display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .ressource-field label { display:block; font-size:11px; font-weight:600; color:#666; margin-bottom:4px; }
    .ressource-select { width:100%; padding:8px 10px; border:1.5px solid #e0e0e0; border-radius:8px; font-size:13px; background:white; cursor:pointer; }
    .ressource-select:focus { outline:none; border-color:#3f51b5; }

    .commandes-list { padding:14px 20px; }
    .commandes-titre { font-size:11px; font-weight:600; text-transform:uppercase; color:#999; margin-bottom:8px; }
    .commande-item { display:flex; align-items:center; gap:10px; padding:5px 0; border-bottom:1px dashed #f0f0f0; }
    .arret-num { width:22px; height:22px; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }
    .arret-ville { font-size:13px; font-weight:600; color:#333; }
    .arret-client { font-size:11px; color:#888; }
    .priorite-badge { font-size:10px; font-weight:700; padding:3px 8px; border-radius:10px; white-space:nowrap; flex-shrink:0; margin-left:auto; }

    .actions-footer { text-align:center; padding:20px; }
    .btn-appliquer { padding:14px 40px; background:linear-gradient(135deg,#2e7d32,#4caf50); color:white; border:none; border-radius:12px; cursor:pointer; font-size:16px; font-weight:700; }
    .btn-appliquer:disabled { background:#ccc; cursor:not-allowed; }
    .aide { color:#e65100; font-size:13px; margin-top:8px; }
  `]
})
export class OptimisationComponent implements OnInit, AfterViewInit, OnDestroy {

  resultats: TourneeOptimisee[] = [];
  loading = false;
  lancee = false;
  applique = false;
  loadingStep = '';

  chauffeurs: any[] = [];
  vehicules: any[] = [];
  selections: {chauffeurId: any, vehiculeId: any, autoAssigne: boolean}[] = [];

  couleursTournees = ['#3f51b5','#e91e63','#ff9800','#4caf50','#9c27b0','#00bcd4','#ff5722','#607d8b'];

  private carte: L.Map | null = null;

  constructor(
    private optimService: OptimisationService,
    private snack: MatSnackBar,
    private http: HttpClient,
    private auth: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerRessources();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.carte) {
      this.carte.remove();
      this.carte = null;
    }
  }

  private get hdrs(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  chargerRessources(): void {
    // Charger chauffeurs disponibles
    this.http.get<any>(`${environment.apiUrl}/chauffeurs?size=100`, { headers: this.hdrs }).subscribe({
      next: (data) => {
        this.chauffeurs = data.content || data;
        this.autoAssigner();
      },
      error: () => {
        console.error('Erreur chargement chauffeurs');
      }
    });

    // Charger véhicules disponibles
    this.http.get<any>(`${environment.apiUrl}/vehicules?size=100`, { headers: this.hdrs }).subscribe({
      next: (data) => {
        this.vehicules = data.content || data;
        this.autoAssigner();
      },
      error: () => {
        console.error('Erreur chargement véhicules');
      }
    });
  }

  private autoAssigner(): void {
    if (!this.resultats.length || !this.chauffeurs.length || !this.vehicules.length) return;

    // Chauffeurs disponibles uniquement
    const chauffeursDispos = this.chauffeurs.filter(c => c.disponible !== false);
    const vehiculesDispos = this.vehicules.filter(v => v.statut === 'DISPONIBLE');

    this.resultats.forEach((t, i) => {
      // Initialiser la sélection si non existante
      if (!this.selections[i]) {
        this.selections[i] = { chauffeurId: '', vehiculeId: '', autoAssigne: false };
      }
      
      // Ne pas écraser une sélection manuelle
      if (this.selections[i].autoAssigne === false && this.selections[i].chauffeurId && this.selections[i].vehiculeId) {
        return;
      }

      const chauffeur = chauffeursDispos[i % Math.max(chauffeursDispos.length, 1)];
      const vehicule = vehiculesDispos[i % Math.max(vehiculesDispos.length, 1)];

      this.selections[i] = {
        chauffeurId: chauffeur?.id || '',
        vehiculeId: vehicule?.id || '',
        autoAssigne: !!(chauffeur && vehicule)
      };
    });

    this.cd.markForCheck();
  }

  onRessourceChange(index: number): void {
    if (this.selections[index]) {
      this.selections[index].autoAssigne = false;
    }
    this.cd.markForCheck();
  }

  get totalCommandes(): number { 
    return this.resultats.reduce((s, t) => s + t.nbCommandes, 0); 
  }
  
  get totalDistance(): number { 
    return this.resultats.reduce((s, t) => s + t.distanceKm, 0); 
  }
  
  get totalCout(): number { 
    return this.resultats.reduce((s, t) => s + (t.coutML || t.coutEstimeDT), 0); 
  }

  get selectionsValides(): boolean {
    return this.selections.length > 0 && this.selections.every(s => s && s.chauffeurId && s.vehiculeId);
  }

  lancer(): void {
    this.loading = true;
    this.lancee = true;
    this.resultats = [];
    this.applique = false;
    this.selections = [];
    this.loadingStep = 'Récupération des commandes...';

    // Détruire carte existante
    if (this.carte) { 
      this.carte.remove(); 
      this.carte = null; 
    }

    this.optimService.optimiser().subscribe({
      next: (tournees: TourneeOptimisee[]) => {
        this.resultats = tournees;
        this.selections = tournees.map(() => ({ chauffeurId: '', vehiculeId: '', autoAssigne: false }));
        this.loadingStep = 'Prédiction ML...';

        if (tournees.length === 0) { 
          this.loading = false; 
          this.cd.markForCheck(); 
          return; 
        }

        let restants = tournees.length;

        tournees.forEach((t: TourneeOptimisee, i: number) => {
          this.optimService.predireML(t.distanceKm, t.nbCommandes).subscribe({
            next: (r: any) => {
              if (this.resultats[i]) {
                this.resultats[i].tempsML = r.temps_estime_ml || r.temps_minutes;
                this.resultats[i].coutML = r.cout_estime_dt || r.cout_dt;
              }
              restants--;
              if (restants === 0) { 
                this.finOptimisation(); 
              }
            },
            error: () => { 
              restants--; 
              if (restants === 0) { 
                this.finOptimisation(); 
              }
            }
          });
        });
      },
      error: (err) => {
        console.error('Erreur optimisation:', err);
        this.loading = false;
        this.snack.open('Erreur optimisation', 'Fermer', { duration: 4000 });
        this.cd.markForCheck();
      }
    });
  }

  private finOptimisation(): void {
    this.loading = false;
    this.autoAssigner();
    this.cd.markForCheck();
    // Initialiser la carte après rendu
    setTimeout(() => this.initialiserCarte(), 300);
  }

  private initialiserCarte(): void {
    const el = document.getElementById('carte-optimisation');
    if (!el || !this.resultats.length) return;

    if (this.carte) {
      this.carte.remove();
      this.carte = null;
    }

    // Centrer sur le dépôt par défaut, puis ajuster sur les points réels
    this.carte = L.map('carte-optimisation').setView(DEPOT, 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.carte);

    // ── Marqueur dépôt ─────────────────────────────────────────────
    const iconDepot = L.divIcon({
      html: `<div style="
        background:#1a237e;color:white;width:36px;height:36px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;font-size:16px;
        border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,.5);
      ">🏭</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      className: 'depot-icon'
    });
    L.marker(DEPOT, { icon: iconDepot }).addTo(this.carte!)
      .bindPopup('<b>🏭 Dépôt — Monastir</b>');

    // Collecter tous les points pour le zoom automatique
    const tousLesPoints: [number, number][] = [DEPOT];

    // ── Dessiner chaque tournée ────────────────────────────────────
    this.resultats.forEach((t, i) => {
      const couleur = this.couleursTournees[i % this.couleursTournees.length];
      const points: [number, number][] = [DEPOT];

      t.commandes.forEach((c, j) => {
        // PRIORITÉ 1 : coordonnées GPS exactes de la commande (retournées par le backend)
        let lat: number | null = c.latitude ?? null;
        let lon: number | null = c.longitude ?? null;

        // PRIORITÉ 2 : résolution multi-niveaux (exact → partiel → mot-clé)
        if (lat == null || lon == null) {
          const normalise = (s: string) => (s || '').toLowerCase().trim()
            .replace(/[àâä]/g,'a').replace(/[éèêë]/g,'e')
            .replace(/[îï]/g,'i').replace(/[ôö]/g,'o')
            .replace(/[ùûü]/g,'u').replace(/ç/g,'c')
            .replace(/-/g,' ');
          const chercher = (terme: string): [number,number] | null => {
            const k = normalise(terme);
            if (!k) return null;
            if (VILLES_COORDS[k]) return VILLES_COORDS[k];
            for (const key of Object.keys(VILLES_COORDS)) { if (k.includes(key)) return VILLES_COORDS[key]; }
            if (k.length >= 4) { for (const key of Object.keys(VILLES_COORDS)) { if (key.includes(k)) return VILLES_COORDS[key]; } }
            return null;
          };
          const found = chercher(c.villeLivraison || '') || chercher(c.adresseLivraison || '');
          if (found) { lat = found[0] + (Math.random()-0.5)*0.004; lon = found[1] + (Math.random()-0.5)*0.004; }
        }

        if (lat == null || lon == null) return; // Skip si toujours pas de coords

        const coords: [number, number] = [lat, lon];
        points.push(coords);
        tousLesPoints.push(coords);

        // Couleur selon priorité de la commande
        const prioriteCouleur = this.getPrioriteCouleur(c.priorite);
        const labelNumero = j + 1;

        const icon = L.divIcon({
          html: `<div style="
            background:${prioriteCouleur};color:white;
            width:32px;height:32px;border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:13px;font-weight:800;
            border:3px solid white;
            box-shadow:0 3px 8px rgba(0,0,0,.4);
            position:relative;
          ">${labelNumero}
            <div style="
              position:absolute;top:-6px;right:-6px;
              background:${couleur};width:14px;height:14px;
              border-radius:50%;border:2px solid white;font-size:7px;
              display:flex;align-items:center;justify-content:center;color:white;font-weight:700;
            ">T${i+1}</div>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          className: 'marker-arret'
        });

        const prioriteLabel = this.getPrioriteLabel(c.priorite);
        const popupContent = `
          <div style="font-family:sans-serif;min-width:200px;">
            <div style="background:${prioriteCouleur};color:white;padding:6px 10px;border-radius:6px 6px 0 0;font-weight:700;font-size:13px;">
              Arrêt ${labelNumero} — Tournée ${i+1}
            </div>
            <div style="padding:8px 10px;">
              <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:4px;">📦 ${c.numeroCommande}</div>
              <div style="font-size:12px;color:#555;margin-bottom:2px;">👤 ${c.client}</div>
              <div style="font-size:12px;color:#555;margin-bottom:2px;">📍 ${c.adresseLivraison || '—'}, ${c.villeLivraison}</div>
              <div style="font-size:12px;color:#555;margin-bottom:4px;">⚖️ ${c.poids || 0} kg</div>
              <span style="background:${prioriteCouleur};color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">${prioriteLabel}</span>
            </div>
          </div>
        `;

        if (this.carte) {
          L.marker(coords, { icon }).addTo(this.carte).bindPopup(popupContent);
        }
      });

      points.push(DEPOT); // Retour au dépôt

      // Tracer le chemin avec flèches directionnelles
      if (points.length > 2 && this.carte) {
        L.polyline(points, {
          color: couleur,
          weight: 4,
          opacity: 0.85,
          dashArray: undefined
        }).addTo(this.carte);

        // Flèches de direction sur le chemin
        // (nécessite leaflet-arrowheads ou simulation avec markers)
        // On ajoute des petits cercles mi-chemin pour indiquer la direction
        for (let k = 0; k < points.length - 1; k++) {
          const midLat = (points[k][0] + points[k+1][0]) / 2;
          const midLon = (points[k][1] + points[k+1][1]) / 2;
          const arrowIcon = L.divIcon({
            html: `<div style="color:${couleur};font-size:16px;font-weight:900;line-height:1;">→</div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            className: 'arrow-icon'
          });
          if (this.carte) {
            L.marker([midLat, midLon], { icon: arrowIcon }).addTo(this.carte);
          }
        }
      }
    });

    // ── Zoom automatique sur tous les points ───────────────────────
    if (tousLesPoints.length > 1 && this.carte) {
      this.carte.fitBounds(L.latLngBounds(tousLesPoints), { padding: [40, 40] });
    }

    if (this.carte) {
      this.carte.invalidateSize();
    }
  }

  /** Retourne la couleur selon la priorité de la commande */
  private getPrioriteCouleur(priorite: string): string {
    switch ((priorite || '').toUpperCase()) {
      case 'URGENT':  return '#c62828';  // Rouge vif
      case 'HAUTE':   return '#e65100';  // Orange foncé
      case 'NORMALE': return '#1565c0';  // Bleu
      case 'BASSE':   return '#2e7d32';  // Vert
      default:        return '#1565c0';
    }
  }

  /** Retourne le label français de la priorité */
  private getPrioriteLabel(priorite: string): string {
    switch ((priorite || '').toUpperCase()) {
      case 'URGENT':  return '🔴 URGENT';
      case 'haute':
      case 'HAUTE':   return '🟠 Haute';
      case 'NORMALE': return '🔵 Normale';
      case 'BASSE':   return '🟢 Basse';
      default:        return '🔵 Normale';
    }
  }

  appliquer(): void {
    if (!this.selectionsValides) {
      this.snack.open('⚠️ Sélectionnez un chauffeur et un véhicule pour chaque tournée', 'Fermer', { duration: 4000 });
      return;
    }

    // Préparer le payload avec toutes les propriétés requises par TourneeOptimisee
    const payload = this.resultats.map((t, i) => ({
      ...t, // Garder toutes les propriétés originales
      chauffeurId: this.selections[i].chauffeurId,
      vehiculeId: this.selections[i].vehiculeId,
      tempsML: t.tempsML || t.tempsEstimeMinutes,
      coutML: t.coutML || t.coutEstimeDT
    }));

    this.optimService.appliquer(payload).subscribe({
      next: () => {
        this.applique = true;
        this.snack.open('✅ Tournées créées avec succès !', 'Fermer', { duration: 4000 });
      },
      error: (err) => {
        console.error('Erreur création tournées:', err);
        this.snack.open('❌ Erreur création tournées', 'Fermer', { duration: 4000 });
      }
    });
  }
}