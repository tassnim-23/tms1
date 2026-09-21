import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TransportService, ClientService } from '../../core/services/crud.services';
import { Transport, Client } from '../../core/models/models';

@Component({
  selector: 'app-transport-form-dialog',
  template: `
    <!-- EN-TÊTE -->
    <div class="dialog-en-tete">
      <h2>
        <mat-icon>{{ estModification ? 'edit' : 'add_circle' }}</mat-icon>
        {{ estModification ? 'Modifier la commande' : 'Nouvelle commande de transport' }}
      </h2>
      <button class="btn-icone" mat-dialog-close matTooltip="Fermer">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <!-- FORMULAIRE -->
    <div mat-dialog-content style="max-height:70vh;overflow-y:auto;padding:0;">
      <form [formGroup]="formulaire">

        <!-- SECTION 1 : INFORMATIONS GÉNÉRALES -->
        <div class="form-corps">
          <div class="form-titre-section">📋 Informations générales</div>

          <div class="form-ligne">
            <div class="form-champ">
              <label class="form-label">
                Client concerné <span class="requis">*</span>
              </label>
              <select class="form-select" formControlName="clientId"
                      [class.invalide]="inv('clientId')">
                <option value="">-- Sélectionnez un client --</option>
                <option *ngFor="let c of clients" [value]="c.id">
                  {{ c.raisonSociale || 'Client #' + c.id }}
                </option>
              </select>
              <span class="form-erreur" *ngIf="inv('clientId')">Veuillez sélectionner un client</span>
            </div>

            <div class="form-champ">
              <label class="form-label">Type de transport</label>
              <select class="form-select" formControlName="type">
                <option value="ROUTIER">🚛 Transport routier (camion)</option>
                <option value="MARITIME">⛵ Transport maritime (bateau)</option>
                <option value="AERIEN">✈️ Transport aérien (avion)</option>
              </select>
            </div>
          </div>

          <div class="form-champ pleine" style="margin-bottom:14px">
            <label class="form-label">Description / Remarques sur la marchandise</label>
            <textarea class="form-textarea" formControlName="description" rows="3"
                      placeholder="Décrivez le type de marchandise, les instructions spéciales, la quantité..."></textarea>
          </div>
        </div>

        <!-- SECTION 2 : TRAJET -->
        <div class="form-corps" style="padding-top:0;">
          <div class="form-titre-section">📍 Trajet de livraison</div>

          <div class="form-ligne">
            <div class="form-champ">
              <label class="form-label">
                Lieu de chargement — ville de départ <span class="requis">*</span>
              </label>
              <input class="form-input" formControlName="origine"
                     [class.invalide]="inv('origine')"
                     placeholder="Ex : Tunis, Sfax, Sousse...">
              <span class="form-erreur" *ngIf="inv('origine')">Veuillez saisir la ville de départ</span>
            </div>

            <div class="form-champ">
              <label class="form-label">
                Lieu de livraison — ville d'arrivée <span class="requis">*</span>
              </label>
              <input class="form-input" formControlName="destination"
                     [class.invalide]="inv('destination')"
                     placeholder="Ex : Bizerte, Monastir, Gabès...">
              <span class="form-erreur" *ngIf="inv('destination')">Veuillez saisir la ville d'arrivée</span>
            </div>
          </div>

          <div class="form-ligne">
            <div class="form-champ">
              <label class="form-label">Date et heure de départ</label>
              <input class="form-input" type="datetime-local" formControlName="dateDepart">
              <span class="form-aide">Quand la marchandise quitte l'entrepôt</span>
            </div>

            <div class="form-champ">
              <label class="form-label">Date de livraison prévue</label>
              <input class="form-input" type="datetime-local" formControlName="dateLivraison">
              <span class="form-aide">Date estimée d'arrivée chez le client</span>
            </div>
          </div>
        </div>

        <!-- SECTION 3 : TARIFICATION -->
        <div class="form-corps" style="padding-top:0;">
          <div class="form-titre-section">📦 Marchandise et tarification</div>

          <div class="form-ligne-3">
            <div class="form-champ">
              <label class="form-label">Poids total (kg)</label>
              <input class="form-input" type="number" formControlName="poids"
                     placeholder="0" min="0">
            </div>

            <div class="form-champ">
              <label class="form-label">Coût de transport (DT)</label>
              <input class="form-input" type="number" formControlName="cout"
                     placeholder="0.00" min="0" step="0.01">
            </div>

            <div class="form-champ">
              <label class="form-label">Statut actuel de la commande</label>
              <select class="form-select" formControlName="statut">
                <option value="EN_ATTENTE">⏳ En attente de traitement</option>
                <option value="EN_COURS">🚚 En cours de livraison</option>
                <option value="LIVRE">✅ Livré avec succès</option>
                <option value="ANNULE">❌ Annulé</option>
              </select>
            </div>
          </div>
        </div>

      </form>
    </div>

    <!-- PIED -->
    <div class="dialog-pied">
      <span style="font-size:12px;color:#94a3b8;margin-right:auto">
        <span class="requis">*</span> Champs obligatoires
      </span>
      <button class="btn-secondaire" mat-dialog-close>
        <mat-icon>close</mat-icon> Annuler
      </button>
      <button class="btn-primaire" (click)="enregistrer()"
              [disabled]="formulaire.invalid || enregistrement">
        <mat-spinner *ngIf="enregistrement" diameter="16" style="margin-right:6px"></mat-spinner>
        <mat-icon *ngIf="!enregistrement">{{ estModification ? 'save' : 'add_circle' }}</mat-icon>
        {{ enregistrement ? 'Enregistrement...' : (estModification ? 'Enregistrer les modifications' : 'Créer la commande') }}
      </button>
    </div>
  `,
  styles: [`
    .form-aide { font-size:11.5px;color:#94a3b8;margin-top:3px; }
    .form-ligne-3 { display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px; }
    @media(max-width:640px) { .form-ligne-3 { grid-template-columns:1fr; } }
  `]
})
export class TransportFormDialogComponent implements OnInit {
  formulaire: FormGroup;
  estModification = false;
  enregistrement = false;
  clients: Client[] = [];

  constructor(
    private fb: FormBuilder,
    private transportService: TransportService,
    private clientService: ClientService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<TransportFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { transport?: Transport }
  ) {
    this.formulaire = this.fb.group({
      clientId:      [null, Validators.required],
      type:          ['ROUTIER'],
      origine:       ['', Validators.required],
      destination:   ['', Validators.required],
      dateDepart:    [''],
      dateLivraison: [''],
      statut:        ['EN_ATTENTE'],
      poids:         [null],
      cout:          [null],
      description:   ['']
    });
  }

  ngOnInit(): void {
    this.chargerClients();
    if (this.data?.transport) {
      this.estModification = true;
      this.formulaire.patchValue(this.data.transport);
    }
  }

  chargerClients(): void {
    this.clientService.getAll(0, 100).subscribe({
      next: (d: any) => this.clients = d.content || [],
      error: () => {}
    });
  }

  inv(champ: string): boolean {
    const c = this.formulaire.get(champ);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  enregistrer(): void {
    if (this.formulaire.invalid) { this.formulaire.markAllAsTouched(); return; }
    this.enregistrement = true;
    const obs = this.estModification
      ? this.transportService.update(this.data.transport!.id!, this.formulaire.value)
      : this.transportService.create(this.formulaire.value);

    obs.subscribe({
      next: () => {
        this.snackBar.open(
          this.estModification ? '✅ Commande modifiée avec succès' : '✅ Commande créée avec succès',
          'Fermer', { duration: 3500 }
        );
        this.dialogRef.close(true);
      },
      error: () => {
        this.enregistrement = false;
        this.snackBar.open('❌ Erreur lors de l\'enregistrement', 'Fermer', { duration: 4000 });
      }
    });
  }
}
