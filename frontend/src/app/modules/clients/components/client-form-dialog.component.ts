import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientService } from '../../../core/services/crud.services';
import { Client } from '../../../core/models/models';

@Component({
  selector: 'app-client-form-dialog',
  template: `
    <!-- EN-TÊTE DIALOG -->
    <div class="dialog-en-tete">
      <h2>
        <mat-icon>{{ estModification ? 'edit' : 'add_business' }}</mat-icon>
        {{ estModification ? 'Modifier le client' : 'Ajouter un nouveau client' }}
      </h2>
      <button class="btn-icone" mat-dialog-close matTooltip="Fermer">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <!-- CORPS -->
    <div mat-dialog-content style="max-height:72vh; overflow-y:auto; padding:0;">
      <form [formGroup]="formulaire">

        <!-- SECTION 1 : IDENTITÉ DE L'ENTREPRISE -->
        <div class="form-corps">
          <div class="form-titre-section">🏢 Identité de l'entreprise</div>

          <div class="form-ligne">
            <div class="form-champ">
              <label class="form-label">Raison sociale <span class="requis">*</span></label>
              <input class="form-input" formControlName="raisonSociale"
                     [class.invalide]="inv('raisonSociale')"
                     placeholder="Ex : GRPO Consulting SARL">
              <span class="form-erreur" *ngIf="inv('raisonSociale')">
                La raison sociale est obligatoire (min. 3 caractères)
              </span>
            </div>

            <div class="form-champ">
              <label class="form-label">Matricule fiscale <span class="requis">*</span></label>
              <input class="form-input" formControlName="matriculeFiscale"
                     [class.invalide]="inv('matriculeFiscale')"
                     placeholder="Ex : 1234567ABC"
                     style="font-family:monospace; letter-spacing:.04em">
              <span class="form-aide">Format : 7 chiffres suivis de 3 lettres majuscules</span>
              <span class="form-erreur" *ngIf="inv('matriculeFiscale')">
                Format invalide — exemple correct : 1234567MFN
              </span>
            </div>
          </div>

          <div class="form-ligne">
            <div class="form-champ">
              <label class="form-label">Responsable de l'entreprise <span class="requis">*</span></label>
              <input class="form-input" formControlName="responsableEntreprise"
                     [class.invalide]="inv('responsableEntreprise')"
                     placeholder="Ex : Ahmed Ben Ali">
              <span class="form-erreur" *ngIf="inv('responsableEntreprise')">
                Le nom du responsable est obligatoire
              </span>
            </div>

            <div class="form-champ">
              <label class="form-label">Secteur d'activité <span class="requis">*</span></label>
              <select class="form-select" formControlName="activite"
                      [class.invalide]="inv('activite')">
                <option value="">-- Sélectionnez un secteur --</option>
                <option value="Transport">🚛 Transport</option>
                <option value="Logistique">📦 Logistique</option>
                <option value="Commerce">🏪 Commerce</option>
                <option value="Distribution">🔄 Distribution</option>
                <option value="Import/Export">🌍 Import / Export</option>
                <option value="Industrie">🏭 Industrie</option>
                <option value="Agriculture">🌾 Agriculture</option>
                <option value="Services">⚙️ Services</option>
                <option value="Autre">📋 Autre</option>
              </select>
              <span class="form-erreur" *ngIf="inv('activite')">
                Veuillez sélectionner un secteur d'activité
              </span>
            </div>
          </div>
        </div>

        <!-- SECTION 2 : COORDONNÉES DE CONTACT -->
        <div class="form-corps" style="padding-top:0;">
          <div class="form-titre-section">📞 Coordonnées de contact</div>

          <div class="form-ligne">
            <div class="form-champ">
              <label class="form-label">Adresse email professionnelle <span class="requis">*</span></label>
              <input class="form-input" type="email" formControlName="email"
                     [class.invalide]="inv('email')"
                     placeholder="contact@entreprise.tn">
              <span class="form-erreur" *ngIf="inv('email')">
                Adresse email invalide
              </span>
            </div>

            <div class="form-champ">
              <label class="form-label">Numéro de téléphone <span class="requis">*</span></label>
              <input class="form-input" formControlName="telephone"
                     [class.invalide]="inv('telephone')"
                     placeholder="+21612345678">
              <span class="form-aide">Format : +216 suivi de 8 chiffres</span>
              <span class="form-erreur" *ngIf="inv('telephone')">
                Format invalide — exemple : +21671234567
              </span>
            </div>
          </div>

          <div class="form-champ pleine">
            <label class="form-label">Adresse complète <span class="requis">*</span></label>
            <textarea class="form-textarea" formControlName="adresseComplete"
                      [class.invalide]="inv('adresseComplete')"
                      rows="3"
                      placeholder="Numéro de rue, Rue, Code postal, Ville, Pays — Ex : 12 Rue de la Liberté, 1002 Tunis, Tunisie"></textarea>
            <span class="form-aide">Incluez le numéro, la rue, le code postal, la ville et le pays</span>
            <span class="form-erreur" *ngIf="inv('adresseComplete')">
              L'adresse complète est obligatoire (min. 10 caractères)
            </span>
          </div>
        </div>

      </form>
    </div>

    <!-- PIED -->
    <div class="dialog-pied">
      <span style="font-size:12px;color:#94a3b8;margin-right:auto">
        <span style="color:#dc2626">*</span> Champs obligatoires
      </span>
      <button class="btn-secondaire" mat-dialog-close>
        <mat-icon>close</mat-icon> Annuler
      </button>
      <button class="btn-primaire" (click)="enregistrer()"
              [disabled]="formulaire.invalid || enregistrement">
        <mat-spinner *ngIf="enregistrement" diameter="16" style="margin-right:6px"></mat-spinner>
        <mat-icon *ngIf="!enregistrement">{{ estModification ? 'save' : 'add_business' }}</mat-icon>
        {{ enregistrement ? 'Enregistrement...' : (estModification ? 'Enregistrer les modifications' : 'Ajouter le client') }}
      </button>
    </div>
  `,
  styles: [``]
})
export class ClientFormDialogComponent implements OnInit {
  formulaire: FormGroup;
  estModification = false;
  enregistrement = false;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ClientFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { client?: Client }
  ) {
    this.formulaire = this.fb.group({
      raisonSociale:          ['', [Validators.required, Validators.minLength(3)]],
      matriculeFiscale:       ['', [Validators.required, Validators.pattern(/^[0-9]{7}[A-Za-z]{3}$/)]],
      responsableEntreprise:  ['', Validators.required],
      activite:               ['', Validators.required],
      email:                  ['', [Validators.required, Validators.email]],
      telephone:              ['', [Validators.required, Validators.pattern(/^\+216[0-9]{8}$/)]],
      adresseComplete:        ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnInit(): void {
    if (this.data?.client) {
      this.estModification = true;
      this.formulaire.patchValue(this.data.client);
    }
  }

  inv(champ: string): boolean {
    const c = this.formulaire.get(champ);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  enregistrer(): void {
    if (this.formulaire.invalid) { this.formulaire.markAllAsTouched(); return; }
    this.enregistrement = true;
    const obs = this.estModification
      ? this.clientService.update(this.data.client!.id!, this.formulaire.value)
      : this.clientService.create(this.formulaire.value);

    obs.subscribe({
      next: () => {
        this.snackBar.open(
          this.estModification ? '✅ Client modifié avec succès' : '✅ Client ajouté avec succès',
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
