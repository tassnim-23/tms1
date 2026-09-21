import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { GpsService, PositionGPS } from '../../core/services/gps.service';

// ── IMPORTANT : Leaflet est chargé via CDN dans index.html ──────
declare const L: any;

@Component({
  selector: 'app-gps-carte',
  standalone: false, // false car tu utilises AppModule
  template: `
<div class="gps-page">

  <!-- ══════════ EN-TÊTE ══════════ -->
  <div class="gps-header">
    <div class="header-left">
      <div class="header-icon">🗺️</div>
      <div>
        <h1>Suivi GPS en temps réel</h1>
        <p class="subtitle">
          {{ positions.length }} camion(s) suivi(s)
          <span class="dot" [class.live]="polling"></span>
          {{ polling ? 'Mise à jour toutes les 5s' : 'Arrêté' }}
        </p>
      </div>
    </div>
    <div class="header-actions">
      <button class="btn-toggle" (click)="togglePolling()" [class.actif]="polling">
        {{ polling ? '⏸ Pause' : '▶ Démarrer' }}
      </button>
      <button class="btn-refresh" (click)="chargerPositions()">🔄 Actualiser</button>
    </div>
  </div>

  <!-- ══════════ CONTENU PRINCIPAL ══════════ -->
  <div class="gps-layout">

    <!-- ── PANNEAU GAUCHE : liste des camions ── -->
    <div class="panneau-camions">
      <div class="panneau-titre">🚛 Camions actifs</div>

      <div *ngIf="chargement" class="chargement">
        <div class="spinner"></div> Chargement...
      </div>

      <div *ngIf="!chargement && positions.length === 0" class="vide">
        <div>📭</div>
        <p>Aucune position disponible</p>
        <small>Lancez une simulation pour tester</small>
      </div>

      <div class="camion-liste">
        <div *ngFor="let pos of positions"
             class="camion-card"
             [class.selectionne]="camionSelectionne === pos.chauffeurId"
             (click)="selectionnerCamion(pos)">

          <div class="camion-icone" [style.background]="gpsService.getCouleurStatut(pos.statut)">
            🚛
          </div>
          <div class="camion-info">
            <div class="camion-nom">{{ pos.chauffeurNom || 'Chauffeur #' + pos.chauffeurId }}</div>
            <div class="camion-statut" [style.color]="gpsService.getCouleurStatut(pos.statut)">
              {{ gpsService.getLabelStatut(pos.statut) }}
            </div>
            <div class="camion-details">
              <span *ngIf="pos.vitesse != null">⚡ {{ pos.vitesse | number:'1.0-0' }} km/h</span>
              <span *ngIf="pos.tourneeId">📋 Tournée #{{ pos.tourneeId }}</span>
            </div>
            <div class="camion-maj">🕐 {{ pos.derniereMaj || 'À l\'instant' }}</div>
          </div>
          <button class="btn-centrer" (click)="centrerSurCamion(pos); $event.stopPropagation()" title="Centrer sur la carte">
            🎯
          </button>
        </div>
      </div>

      <!-- ── SIMULATION ── -->
      <div class="sim-section">
        <div class="panneau-titre">🧪 Simulation de trajet</div>
        <div class="sim-form">
          <label>Chauffeur ID</label>
          <input type="number" [(ngModel)]="sim.chauffeurId" placeholder="1">

          <label>Tournée ID</label>
          <input type="number" [(ngModel)]="sim.tourneeId" placeholder="1">

          <label>Trajet prédéfini</label>
          <select [(ngModel)]="trajetChoisi" (change)="appliquerTrajet()">
            <option value="">-- Choisir --</option>
            <option value="tunis-sousse">Tunis → Sousse</option>
            <option value="tunis-bizerte">Tunis → Bizerte</option>
            <option value="sousse-sfax">Sousse → Sfax</option>
          </select>

          <label>Nombre de points</label>
          <input type="number" [(ngModel)]="sim.nbPoints" placeholder="20" min="5" max="100">

          <button class="btn-simuler" (click)="lancerSimulation()" [disabled]="simEnCours">
            {{ simEnCours ? '⏳ Simulation...' : '🚀 Lancer la simulation' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── CARTE LEAFLET ── -->
    <div class="carte-wrapper">
      <div id="carte-gps" class="carte-leaflet"></div>

      <!-- Légende -->
      <div class="legende">
        <div class="legende-titre">Légende</div>
        <div class="legende-item"><span class="dot-vert"></span> En route</div>
        <div class="legende-item"><span class="dot-orange"></span> À l'arrêt</div>
        <div class="legende-item"><span class="dot-bleu"></span> En livraison</div>
        <div class="legende-item"><span class="dot-gris"></span> En pause</div>
      </div>

      <!-- Infos camion sélectionné -->
      <div class="info-camion" *ngIf="positionSelectionnee">
        <div class="info-close" (click)="positionSelectionnee = null">✕</div>
        <div class="info-titre">{{ positionSelectionnee.chauffeurNom }}</div>
        <div class="info-ligne">📍 {{ positionSelectionnee.latitude | number:'1.4-4' }}, {{ positionSelectionnee.longitude | number:'1.4-4' }}</div>
        <div class="info-ligne">⚡ {{ positionSelectionnee.vitesse || 0 | number:'1.0-0' }} km/h</div>
        <div class="info-ligne">🕐 {{ positionSelectionnee.derniereMaj }}</div>
        <div class="info-ligne" *ngIf="positionSelectionnee.tourneeId">
          📋 Tournée #{{ positionSelectionnee.tourneeId }}
        </div>
        <div class="info-statut" [style.color]="gpsService.getCouleurStatut(positionSelectionnee.statut)">
          {{ gpsService.getLabelStatut(positionSelectionnee.statut) }}
        </div>
      </div>
    </div>

  </div>

  <!-- Toast notifications -->
  <div class="toast" *ngIf="toastMsg" [class.toast-ok]="toastType==='ok'" [class.toast-ko]="toastType==='ko'">
    {{ toastMsg }}
  </div>

</div>
  `,
  styles: [`
    .gps-page { padding: 0; height: 100vh; display: flex; flex-direction: column; }

    /* ── HEADER ── */
    .gps-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 24px; background: white;
      border-bottom: 2px solid #e2e8f0;
      flex-shrink: 0;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header-icon { font-size: 32px; line-height: 1; }
    h1 { margin: 0; font-size: 20px; font-weight: 700; color: #1B4F72; }
    .subtitle { margin: 2px 0 0; font-size: 13px; color: #888; display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #ccc; display: inline-block; }
    .dot.live { background: #27ae60; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
    .header-actions { display: flex; gap: 10px; }
    .btn-toggle {
      padding: 9px 18px; border-radius: 8px; border: none; cursor: pointer;
      font-weight: 700; font-size: 13px;
      background: #e2e8f0; color: #64748b; transition: all .2s;
    }
    .btn-toggle.actif { background: #27ae60; color: white; }
    .btn-refresh {
      padding: 9px 16px; border-radius: 8px; border: 1.5px solid #e2e8f0;
      background: white; cursor: pointer; font-size: 13px; transition: all .2s;
    }
    .btn-refresh:hover { border-color: #1B4F72; color: #1B4F72; }

    /* ── LAYOUT ── */
    .gps-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      flex: 1;
      height: 100%;
      overflow: hidden;
    }

    /* ── PANNEAU GAUCHE ── */
    .panneau-camions {
      background: #f8fafc; border-right: 1.5px solid #e2e8f0;
      overflow-y: auto; display: flex; flex-direction: column; gap: 0;
    }
    .panneau-titre {
      padding: 12px 16px; font-size: 13px; font-weight: 700;
      color: #1B4F72; background: #EBF5FB;
      border-bottom: 1px solid #d6eaf8;
      text-transform: uppercase; letter-spacing: .5px;
    }
    .chargement, .vide {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 40px 20px; color: #aaa; gap: 8px;
    }
    .spinner {
      width: 28px; height: 28px;
      border: 3px solid #e2e8f0; border-top-color: #1B4F72;
      border-radius: 50%; animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .camion-liste { padding: 8px; display: flex; flex-direction: column; gap: 6px; }
    .camion-card {
      display: flex; align-items: center; gap: 10px;
      background: white; border: 1.5px solid #e2e8f0; border-radius: 10px;
      padding: 10px 12px; cursor: pointer; transition: all .2s;
    }
    .camion-card:hover, .camion-card.selectionne {
      border-color: #1B4F72; box-shadow: 0 2px 10px rgba(27,79,114,.15);
    }
    .camion-icone {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    .camion-info { flex: 1; min-width: 0; }
    .camion-nom { font-size: 13.5px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .camion-statut { font-size: 12px; font-weight: 600; margin-top: 2px; }
    .camion-details { display: flex; gap: 8px; font-size: 11px; color: #64748b; margin-top: 3px; }
    .camion-maj { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .btn-centrer {
      background: none; border: 1.5px solid #e2e8f0; border-radius: 6px;
      padding: 4px 8px; cursor: pointer; font-size: 14px; flex-shrink: 0;
      transition: all .2s;
    }
    .btn-centrer:hover { background: #EBF5FB; border-color: #1B4F72; }

    /* ── SIMULATION ── */
    .sim-section { border-top: 1.5px solid #e2e8f0; }
    .sim-form { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
    .sim-form label { font-size: 12px; font-weight: 600; color: #64748b; }
    .sim-form input, .sim-form select {
      padding: 7px 10px; border: 1.5px solid #e2e8f0; border-radius: 7px;
      font-size: 13px; width: 100%; box-sizing: border-box;
    }
    .sim-form input:focus, .sim-form select:focus { outline: none; border-color: #1B4F72; }
    .btn-simuler {
      padding: 10px; background: linear-gradient(135deg, #E67E22, #f39c12);
      color: white; border: none; border-radius: 8px; cursor: pointer;
      font-weight: 700; font-size: 13px; transition: all .2s; margin-top: 4px;
    }
    .btn-simuler:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-simuler:disabled { opacity: .6; cursor: not-allowed; }

    /* ── CARTE ── */
    .carte-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .carte-leaflet {
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    /* ── LÉGENDE ── */
    .legende {
      position: absolute; bottom: 20px; left: 20px; z-index: 1000;
      background: white; border-radius: 10px; padding: 12px 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,.15);
      font-size: 12px;
    }
    .legende-titre { font-weight: 700; color: #1e293b; margin-bottom: 8px; }
    .legende-item { display: flex; align-items: center; gap: 7px; margin: 4px 0; color: #475569; }
    .dot-vert   { width:10px;height:10px;border-radius:50%;background:#27ae60;flex-shrink:0; }
    .dot-orange { width:10px;height:10px;border-radius:50%;background:#e67e22;flex-shrink:0; }
    .dot-bleu   { width:10px;height:10px;border-radius:50%;background:#3498db;flex-shrink:0; }
    .dot-gris   { width:10px;height:10px;border-radius:50%;background:#95a5a6;flex-shrink:0; }

    /* ── INFO CAMION ── */
    .info-camion {
      position: absolute; top: 20px; right: 20px; z-index: 1000;
      background: white; border-radius: 12px; padding: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,.2); min-width: 220px;
    }
    .info-close {
      position: absolute; top: 10px; right: 12px; cursor: pointer;
      font-size: 14px; color: #999;
    }
    .info-titre { font-size: 15px; font-weight: 700; color: #1B4F72; margin-bottom: 10px; }
    .info-ligne { font-size: 13px; color: #475569; margin: 5px 0; }
    .info-statut { font-weight: 700; margin-top: 10px; font-size: 14px; }

    /* ── TOAST ── */
    .toast {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      padding: 12px 20px; border-radius: 10px; font-weight: 600; font-size: 14px;
      box-shadow: 0 4px 20px rgba(0,0,0,.2); animation: slideUp .3s ease;
    }
    .toast-ok { background: #27ae60; color: white; }
    .toast-ko { background: #e74c3c; color: white; }
    @keyframes slideUp { from{transform:translateY(12px);opacity:0} to{transform:none;opacity:1} }

    @media (max-width: 768px) {
      .gps-layout { grid-template-columns: 1fr; }
      .panneau-camions { max-height: 300px; }
    }
  `]
})
export class GpsCarteComponent implements OnInit, OnDestroy, AfterViewInit {

  positions: PositionGPS[] = [];
  positionSelectionnee: PositionGPS | null = null;
  camionSelectionne: number | null = null;
  chargement = false;
  polling = false;
  simEnCours = false;
  trajetChoisi = '';

  // Données simulation
  sim = {
    chauffeurId: 1,
    tourneeId: 1,
    latDepart: 36.8189,
    lonDepart: 10.1658,
    latArrivee: 35.8333,
    lonArrivee: 10.6333,
    nbPoints: 20
  };

  // Trajets prédéfinis (coordonnées Tunisie)
  private trajets: Record<string, any> = {
    'tunis-sousse':  { latDep: 36.8189, lonDep: 10.1658, latArr: 35.8333, lonArr: 10.6333 },
    'tunis-bizerte': { latDep: 36.8189, lonDep: 10.1658, latArr: 37.2744, lonArr: 9.8739  },
    'sousse-sfax':   { latDep: 35.8333, lonDep: 10.6333, latArr: 34.7400, lonArr: 10.7600 },
  };

  toastMsg = '';
  toastType: 'ok' | 'ko' = 'ok';
  private toastTimer: any;

  // Leaflet
  private map: any;
  private markers: Map<number, any> = new Map();
  private pollingSubscription?: Subscription;

  constructor(
    public gpsService: GpsService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Premier chargement
    this.chargerPositions();
  }

  ngAfterViewInit(): void {
    // Initialiser la carte Leaflet après que le DOM soit prêt et que Leaflet soit chargé
    this.attendreLeafletEtInitialiser();
  }

  private attendreLeafletEtInitialiser(): void {
    const maxAttempts = 50;
    let attempts = 0;

    const verifier = () => {
      if (typeof L !== 'undefined') {
        setTimeout(() => this.initCarte(), 100);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(verifier, 100);
      } else {
        console.error('Leaflet n\'a pas pu être chargé');
        this.showToast('Erreur : Impossible de charger la carte', 'ko');
      }
    };

    verifier();
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
    if (this.map) this.map.remove();
  }

  // ─── CARTE LEAFLET ─────────────────────────────────────────────

  private initCarte(): void {
    if (this.map) return;

    if (typeof L === 'undefined') {
      console.error('Leaflet (L) n\'est pas défini');
      return;
    }

    // Centrer sur la Tunisie par défaut
    this.map = L.map('carte-gps').setView([36.8, 10.18], 8);

    // Tuile OpenStreetMap (gratuit, pas de clé API)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Correction : forcer le recalcul de la taille après un court délai
    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);

    console.log('✅ Carte Leaflet initialisée');
  }

  private creerIconeCamion(statut: string, nom: string): any {
    const couleur = this.gpsService.getCouleurStatut(statut);
    const html = `
      <div style="
        background:${couleur};
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:3px solid white;
        box-shadow:0 3px 10px rgba(0,0,0,.3);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:16px;">🚛</span>
      </div>
    `;
    return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 36] });
  }

  private mettreAJourMarqueurs(): void {
    if (!this.map) return;

    this.positions.forEach(pos => {
      const icone = this.creerIconeCamion(pos.statut || '', pos.chauffeurNom || '');
      const popup = `
        <div style="font-family:Arial;min-width:180px">
          <div style="font-weight:700;color:#1B4F72;font-size:14px;margin-bottom:6px">
            🚛 ${pos.chauffeurNom || 'Chauffeur #' + pos.chauffeurId}
          </div>
          <div style="font-size:12px;color:#666">
            📍 ${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}<br>
            ⚡ ${pos.vitesse?.toFixed(0) || 0} km/h<br>
            ${this.gpsService.getLabelStatut(pos.statut)}<br>
            🕐 ${pos.derniereMaj || 'À l\'instant'}
          </div>
        </div>
      `;

      if (this.markers.has(pos.chauffeurId)) {
        // Mise à jour du marqueur existant
        const marker = this.markers.get(pos.chauffeurId);
        marker.setLatLng([pos.latitude, pos.longitude]);
        marker.setIcon(icone);
        marker.getPopup()?.setContent(popup);
      } else {
        // Nouveau marqueur
        const marker = L.marker([pos.latitude, pos.longitude], { icon: icone })
          .bindPopup(popup)
          .on('click', () => {
            this.positionSelectionnee = pos;
            this.camionSelectionne = pos.chauffeurId;
          })
          .addTo(this.map);
        this.markers.set(pos.chauffeurId, marker);
      }
    });
  }

  // ─── ACTIONS ───────────────────────────────────────────────────

  chargerPositions(): void {
    this.chargement = true;
    this.gpsService.getDernieresPositions().subscribe({
      next: (data) => {
        this.positions = data;
        this.mettreAJourMarqueurs();
        this.chargement = false;
      },
      error: () => {
        this.chargement = false;
        // Pas d'erreur visible si aucune position (base vide = normal)
      }
    });
  }

  togglePolling(): void {
    if (this.polling) {
      this.pollingSubscription?.unsubscribe();
      this.polling = false;
    } else {
      this.polling = true;
      this.pollingSubscription = this.gpsService.demarrerPolling().subscribe({
        next: (data) => {
          this.positions = data;
          this.mettreAJourMarqueurs();
        }
      });
    }
  }

  selectionnerCamion(pos: PositionGPS): void {
    this.positionSelectionnee = pos;
    this.camionSelectionne = pos.chauffeurId;
    this.centrerSurCamion(pos);
  }

  centrerSurCamion(pos: PositionGPS): void {
    if (this.map) {
      this.map.flyTo([pos.latitude, pos.longitude], 14, { duration: 1.2 });
      this.markers.get(pos.chauffeurId)?.openPopup();
    }
  }

  appliquerTrajet(): void {
    if (!this.trajetChoisi || !this.trajets[this.trajetChoisi]) return;
    const t = this.trajets[this.trajetChoisi];
    this.sim.latDepart  = t.latDep;
    this.sim.lonDepart  = t.lonDep;
    this.sim.latArrivee = t.latArr;
    this.sim.lonArrivee = t.lonArr;
  }

  lancerSimulation(): void {
    this.simEnCours = true;
    this.gpsService.simulerTrajet({
      chauffeurId: Number(this.sim.chauffeurId),
      tourneeId:   Number(this.sim.tourneeId),
      latDepart:   this.sim.latDepart,
      lonDepart:   this.sim.lonDepart,
      latArrivee:  this.sim.latArrivee,
      lonArrivee:  this.sim.lonArrivee,
      nbPoints:    Number(this.sim.nbPoints)
    }).subscribe({
      next: (res) => {
        this.simEnCours = false;
        this.showToast(`✅ ${res.nbPoints} positions simulées !`, 'ok');
        this.chargerPositions();
      },
      error: (err) => {
        this.simEnCours = false;
        this.showToast('❌ ' + (err.error?.message || 'Erreur simulation'), 'ko');
      }
    });
  }

  private showToast(msg: string, type: 'ok' | 'ko'): void {
    clearTimeout(this.toastTimer);
    this.toastMsg = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => this.toastMsg = '', 4000);
  }
}