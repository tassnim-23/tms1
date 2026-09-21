import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-client-detail-dialog',
  standalone: true,  // ✅ Ajouter cette ligne
  imports: [         // ✅ Ajouter les imports nécessaires
    CommonModule,
    MatDialogModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-en-tete">
      <h2><mat-icon>business</mat-icon> {{ data.client.raisonSociale }}</h2>
      <button class="btn-icone" mat-dialog-close><mat-icon>close</mat-icon></button>
    </div>

    <div mat-dialog-content style="max-height:75vh;overflow-y:auto;padding:16px 24px">

      <!-- Infos client -->
      <div class="section">
        <div class="section-titre">📋 Informations</div>
        <div class="info-grid">
          <div><span class="label">Email</span><span>{{ data.client.email }}</span></div>
          <div><span class="label">Téléphone</span><span>{{ data.client.telephone }}</span></div>
          <div><span class="label">Responsable</span><span>{{ data.client.responsableEntreprise }}</span></div>
          <div><span class="label">Matricule</span><span>{{ data.client.matriculeFiscale }}</span></div>
          <div class="full"><span class="label">Adresse</span><span>{{ data.client.adresseComplete }}</span></div>
        </div>
      </div>

      <!-- Commandes -->
      <div class="section">
        <div class="section-titre">📦 Commandes ({{ commandes.length }})</div>
        <div *ngIf="loadingCommandes" class="loading">Chargement...</div>
        <div *ngIf="!loadingCommandes && commandes.length === 0" class="vide">Aucune commande</div>
        <table *ngIf="commandes.length > 0" class="mini-table">
          <thead><tr><th>N°</th><th>Date</th><th>Destination</th><th>Statut</th></tr></thead>
          <tbody>
            <tr *ngFor="let c of commandes">
              <td>{{ c.numeroCommande || c.id }}</td>
              <td>{{ c.dateCommande | date:'dd/MM/yyyy' }}</td>
              <td>{{ c.villeLivraison }}</td>
              <td><span class="badge" [class]="'badge-' + (c.statut || '').toLowerCase()">{{ c.statut }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Factures -->
      <div class="section">
        <div class="section-titre">🧾 Factures ({{ factures.length }})</div>
        <div *ngIf="loadingFactures" class="loading">Chargement...</div>
        <div *ngIf="!loadingFactures && factures.length === 0" class="vide">Aucune facture</div>
        <table *ngIf="factures.length > 0" class="mini-table">
          <thead><tr><th>N°</th><th>Date</th><th>Montant</th><th>Statut</th></tr></thead>
          <tbody>
            <tr *ngFor="let f of factures">
              <td>{{ f.numero }}</td>
              <td>{{ f.dateFacture | date:'dd/MM/yyyy' }}</td>
              <td>{{ f.montant | number:'1.2-2' }} DT</td>
              <td><span class="badge" [class]="'badge-' + (f.statut || '').toLowerCase()">{{ f.statut }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Messages support -->
      <div class="section">
        <div class="section-titre">💬 Messages support ({{ messages.length }})</div>
        <div *ngIf="loadingMessages" class="loading">Chargement...</div>
        <div *ngIf="!loadingMessages && messages.length === 0" class="vide">Aucun message</div>
        <div *ngFor="let m of messages" class="message-card">
          <div class="message-header">
            <strong>{{ m.sujet }}</strong>
            <span class="badge" [class]="'badge-' + (m.statut || '').toLowerCase()">{{ m.statut }}</span>
          </div>
          <div class="message-body">{{ m.contenu }}</div>
          <div class="message-date">{{ m.dateEnvoi | date:'dd/MM/yyyy HH:mm' }}</div>
        </div>
      </div>

    </div>

    <div class="dialog-pied">
      <button class="btn-secondaire" mat-dialog-close>Fermer</button>
    </div>
  `,
  styles: [`
    .section { margin-bottom: 24px; }
    .section-titre { font-weight: 700; font-size: 14px; color: #1a237e; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #e8eaf6; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .info-grid .full { grid-column: 1/-1; }
    .info-grid div { display: flex; flex-direction: column; gap: 2px; }
    .label { font-size: 11px; text-transform: uppercase; color: #999; font-weight: 600; }
    .loading { color: #888; font-size: 13px; }
    .vide { color: #aaa; font-size: 13px; font-style: italic; }
    .mini-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .mini-table th { background: #f8f9ff; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; }
    .mini-table td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; }
    .badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-en_attente { background: #fff8e1; color: #e65100; }
    .badge-approuvee, .badge-payee, .badge-livree, .badge-resolu { background: #e8f5e9; color: #2e7d32; }
    .badge-rejetee, .badge-annulee, .badge-retard { background: #ffebee; color: #c62828; }
    .badge-en_cours, .badge-assignee, .badge-nouveau { background: #e3f2fd; color: #1565c0; }
    .message-card { background: #f8f9ff; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 3px solid #3f51b5; }
    .message-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .message-body { font-size: 13px; color: #555; margin-bottom: 4px; }
    .message-date { font-size: 11px; color: #999; }
  `]
})
export class ClientDetailDialogComponent implements OnInit {

  commandes: any[] = [];
  factures: any[] = [];
  messages: any[] = [];
  loadingCommandes = true;
  loadingFactures = true;
  loadingMessages = true;

  private get hdrs(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { client: any },
    public dialogRef: MatDialogRef<ClientDetailDialogComponent>,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const clientId = this.data.client.id;
    const api = environment.apiUrl;

    // Charger commandes
    this.http.get<any[]>(`${api}/commandes/client/${clientId}`, { headers: this.hdrs })
      .subscribe({
        next: d => { this.commandes = d; this.loadingCommandes = false; },
        error: () => this.loadingCommandes = false
      });

    // Charger factures
    this.http.get<any[]>(`${api}/factures/client/${clientId}`, { headers: this.hdrs })
      .subscribe({
        next: d => { this.factures = d; this.loadingFactures = false; },
        error: () => this.loadingFactures = false
      });

    // Charger messages support
    this.http.get<any[]>(`${api}/support/client/${clientId}`, { headers: this.hdrs })
      .subscribe({
        next: d => { this.messages = d; this.loadingMessages = false; },
        error: () => this.loadingMessages = false
      });
  }
}