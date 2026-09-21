// ─────────────────────────────────────────────────────────────────────────────
// commande-form.component.ts  — VERSION AVEC ZONE GPS
// ─────────────────────────────────────────────────────────────────────────────
import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import {
  FormBuilder, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import {
  debounceTime, distinctUntilChanged, takeUntil
} from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommandeService } from '../../services/commande.service';
import {
  Client, Commande, CommandeFormData,
  TUNISIE_GEO, GPS_GOUVERNORATS, CODES_POSTAUX, POINTS_DEPART_GRPO
} from '../../models/commande.model';

@Component({
  selector: 'app-commande-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="form-shell">

  <!-- HEADER -->
  <header class="form-header">
    <button class="back-btn" (click)="retour()">
      <mat-icon>arrow_back</mat-icon> Retour
    </button>
    <div class="form-header__title">
      <mat-icon>{{ isEdit ? 'edit' : 'add_circle' }}</mat-icon>
      <h1>{{ isEdit ? 'Modifier la commande' : 'Nouvelle commande' }}</h1>
      <span class="num-preview" *ngIf="!isEdit">{{ numeroPreview }}</span>
    </div>
    <div class="form-header__actions">
      <span class="autosave-hint" *ngIf="autoSaved">
        <mat-icon>cloud_done</mat-icon> Brouillon sauvegardé
      </span>
      <button mat-stroked-button type="button" (click)="retour()">Annuler</button>
      <button mat-flat-button class="btn-submit" type="button" (click)="soumettre()" [disabled]="saving">
        <mat-icon *ngIf="!saving">{{ isEdit ? 'save' : 'check_circle' }}</mat-icon>
        {{ isEdit ? 'Enregistrer' : 'Créer la commande' }}
      </button>
    </div>
  </header>

  <form [formGroup]="form" (ngSubmit)="soumettre()" class="form-body">

    <!-- ══ SECTION 1 : CLIENT ══════════════════════════════════ -->
    <div class="form-section">
      <div class="section-header">
        <div class="section-num">1</div>
        <div>
          <h2>Client</h2>
          <p>Sélectionner le client de la commande</p>
        </div>
      </div>
      <div class="section-body">
        <div class="field field--full">
          <label class="field-label">
            <mat-icon class="lbl-ico">corporate_fare</mat-icon>
            Client <span class="req">*</span>
          </label>
          <div class="autocomplete-wrap" [class.invalid]="submitted && form.get('clientId')?.invalid">
            <mat-icon>search</mat-icon>
            <input type="text" class="field-input"
                   [formControl]="clientSearch"
                   placeholder="Rechercher par raison sociale, matricule..."
                   autocomplete="off">
            <mat-icon *ngIf="clientSelected" class="check-ico">check_circle</mat-icon>
          </div>
          <div class="suggestions" *ngIf="clientsFiltres.length > 0 && !clientSelected">
            <div *ngFor="let cl of clientsFiltres" class="suggestion-item" (click)="selectionnerClient(cl)">
              <div class="sugg-avatar" [style.background]="avatarColor(cl.raisonSociale)">{{ cl.raisonSociale[0] }}</div>
              <div class="sugg-info">
                <span class="sugg-name">{{ cl.raisonSociale }}</span>
                <span class="sugg-meta">Mat. {{ cl.matriculeFiscale }} · {{ cl.responsableEntreprise }}</span>
              </div>
            </div>
          </div>
          <div class="client-card" *ngIf="clientSelected">
            <div class="client-card__avatar" [style.background]="avatarColor(clientSelected.raisonSociale)">
              {{ clientSelected.raisonSociale[0] }}
            </div>
            <div class="client-card__info">
              <strong>{{ clientSelected?.raisonSociale }}</strong>
              <span>Matricule : {{ clientSelected?.matriculeFiscale }}</span>
              <span>Resp. : {{ clientSelected?.responsableEntreprise }} — {{ clientSelected?.telephone }}</span>
            </div>
            <button type="button" class="client-card__change" (click)="changerClient()">
              <mat-icon>swap_horiz</mat-icon> Changer
            </button>
          </div>
          <span class="field-error" *ngIf="submitted && form.get('clientId')?.invalid">
            Veuillez sélectionner un client
          </span>
        </div>
      </div>
    </div>

    <!-- ══ SECTION 2 : ADRESSE DE LIVRAISON (ZONE GPS) ═════════ -->
    <div class="form-section zone-section">
      <div class="section-header">
        <div class="section-num zone-num">2</div>
        <div>
          <h2>📍 Adresse de livraison</h2>
          <p>Sélectionnez gouvernorat → quartier → rue — l'adresse GPS complète sera enregistrée automatiquement</p>
        </div>
      </div>
      <div class="section-body">

        <!-- Ligne 1: Gouvernorat -->
        <div class="geo-row">
          <div class="field geo-field">
            <label class="field-label">
              <mat-icon class="lbl-ico">map</mat-icon>
              Gouvernorat <span class="req">*</span>
            </label>
            <div class="field-select-wrap" [class.invalid]="submitted && !gouvernoratSelectionne">
              <mat-icon class="sel-ico">location_city</mat-icon>
              <select class="field-select" (change)="onGouvernoratChange($any($event.target).value)">
                <option value="">— Sélectionner le gouvernorat —</option>
                <option *ngFor="let g of gouvernorats" [value]="g" [selected]="g === gouvernoratSelectionne">{{ g }}</option>
              </select>
            </div>
            <span class="field-error" *ngIf="submitted && !gouvernoratSelectionne">Gouvernorat requis</span>
          </div>

          <!-- Code postal auto -->
          <div class="field geo-field--sm">
            <label class="field-label"><mat-icon class="lbl-ico">markunread_mailbox</mat-icon> Code postal</label>
            <div class="field-input-wrap readonly-wrap">
              <mat-icon>tag</mat-icon>
              <input type="text" formControlName="codePostalLivraison" class="field-input" placeholder="Auto" readonly>
            </div>
          </div>
        </div>

        <!-- Ligne 2: Quartier / Délégation -->
        <div class="geo-row" *ngIf="gouvernoratSelectionne">
          <div class="field geo-field">
            <label class="field-label">
              <mat-icon class="lbl-ico">holiday_village</mat-icon>
              Quartier / Délégation <span class="req">*</span>
            </label>
            <div class="field-select-wrap" [class.invalid]="submitted && !quartierSelectionne">
              <mat-icon class="sel-ico">place</mat-icon>
              <select class="field-select" (change)="onQuartierChange($any($event.target).value)">
                <option value="">— Sélectionner le quartier —</option>
                <option *ngFor="let q of quartiersDisponibles" [value]="q" [selected]="q === quartierSelectionne">{{ q }}</option>
              </select>
            </div>
            <span class="field-error" *ngIf="submitted && !quartierSelectionne">Quartier requis</span>
          </div>
        </div>

        <!-- Ligne 3: Rue / Avenue -->
        <div class="geo-row" *ngIf="quartierSelectionne && ruesDisponibles.length > 0">
          <div class="field geo-field">
            <label class="field-label">
              <mat-icon class="lbl-ico">signpost</mat-icon>
              Rue / Avenue <span class="req">*</span>
            </label>
            <div class="field-select-wrap" [class.invalid]="submitted && !rueSelectionnee">
              <mat-icon class="sel-ico">directions</mat-icon>
              <select class="field-select" (change)="onRueChange($any($event.target).value)">
                <option value="">— Sélectionner la rue —</option>
                <option *ngFor="let r of ruesDisponibles" [value]="r" [selected]="r === rueSelectionnee">{{ r }}</option>
              </select>
            </div>
            <span class="field-error" *ngIf="submitted && !rueSelectionnee">Rue requise</span>
          </div>
        </div>

        <!-- Numéro + Complément -->
        <div class="geo-row" *ngIf="rueSelectionnee">
          <div class="field geo-field--sm">
            <label class="field-label"><mat-icon class="lbl-ico">tag</mat-icon> N° / Bâtiment</label>
            <div class="field-input-wrap">
              <mat-icon>home</mat-icon>
              <input type="text" [formControl]="numeroBatiment" class="field-input"
                     placeholder="Ex: 12, Apt 3B" (input)="construireAdresse()">
            </div>
          </div>
          <div class="field geo-field">
            <label class="field-label"><mat-icon class="lbl-ico">notes</mat-icon> Complément (optionnel)</label>
            <div class="field-input-wrap">
              <mat-icon>info_outline</mat-icon>
              <input type="text" [formControl]="complementAdresse" class="field-input"
                     placeholder="Ex: Face à la mosquée, 2ème étage" (input)="construireAdresse()">
            </div>
          </div>
        </div>

        <!-- Adresse complète résultante -->
        <div class="adresse-complete-box" *ngIf="gouvernoratSelectionne">
          <div class="adresse-complete-box__header">
            <mat-icon>pin_drop</mat-icon>
            <span>Adresse complète enregistrée</span>
            <div class="gps-badge" *ngIf="coordsGPS">
              <mat-icon>gps_fixed</mat-icon>
              GPS : {{ coordsGPS[0].toFixed(4) }}, {{ coordsGPS[1].toFixed(4) }}
            </div>
          </div>
          <div class="adresse-complete-box__value">
            {{ adresseComplete || '— Complétez les champs ci-dessus —' }}
          </div>
        </div>

        <!-- Ville (lecture seule, remplie automatiquement) -->
        <div class="field" style="display:none">
          <input type="text" formControlName="villeLivraison" class="field-input">
        </div>

        <!-- Contact + Téléphone -->
        <div class="field-group two-cols" style="margin-top:16px">
          <div class="field">
            <label class="field-label">
              <mat-icon class="lbl-ico">person_pin</mat-icon>
              Contact sur place <span class="req">*</span>
            </label>
            <div class="field-input-wrap" [class.invalid]="submitted && form.get('contactLivraison')?.invalid">
              <mat-icon>person</mat-icon>
              <input type="text" formControlName="contactLivraison" class="field-input" placeholder="Ex: Mohamed Ben Ali">
            </div>
            <span class="field-error" *ngIf="submitted && form.get('contactLivraison')?.invalid">Contact requis</span>
          </div>
          <div class="field">
            <label class="field-label">
              <mat-icon class="lbl-ico">phone</mat-icon>
              Téléphone contact <span class="req">*</span>
            </label>
            <div class="field-input-wrap" [class.invalid]="submitted && form.get('telephoneContactLivraison')?.invalid">
              <mat-icon>call</mat-icon>
              <input type="tel" formControlName="telephoneContactLivraison" class="field-input" placeholder="+21650123456">
            </div>
            <span class="field-error" *ngIf="submitted && form.get('telephoneContactLivraison')?.invalid">
              {{ getError('telephoneContactLivraison') }}
            </span>
          </div>
        </div>

        <!-- Date souhaitée -->
        <div class="field" style="margin-top:8px">
          <label class="field-label">
            <mat-icon class="lbl-ico">event</mat-icon>
            Date de livraison souhaitée <span class="req">*</span>
          </label>
          <div class="field-input-wrap" [class.invalid]="submitted && form.get('dateLivraisonPrevue')?.invalid">
            <mat-icon>calendar_today</mat-icon>
            <input type="date" formControlName="dateLivraisonPrevue" class="field-input" [min]="today">
          </div>
          <div class="date-shortcuts">
            <button type="button" class="shortcut" (click)="setDateSouhaitee(1)">Demain</button>
            <button type="button" class="shortcut" (click)="setDateSouhaitee(3)">+3 jours</button>
            <button type="button" class="shortcut" (click)="setDateSouhaitee(7)">+1 semaine</button>
          </div>
          <span class="field-error" *ngIf="submitted && form.get('dateLivraisonPrevue')?.invalid">
            {{ getError('dateLivraisonPrevue') }}
          </span>
        </div>

      </div>
    </div>

    <!-- ══ SECTION 3 : ADRESSE DE CHARGEMENT ═══════════════════ -->
    <div class="form-section">
      <div class="section-header">
        <div class="section-num">3</div>
        <div>
          <h2>Point de départ / Chargement</h2>
          <p>Dépôt d'où la marchandise sera chargée — filtre les tournées correspondantes</p>
        </div>
      </div>
      <div class="section-body">
        <div class="field field--full">
          <label class="field-label">
            <mat-icon class="lbl-ico">warehouse</mat-icon>
            Point de départ <span class="req">*</span>
          </label>
          <div class="field-select-wrap" [class.invalid]="submitted && form.get('adresseChargement')?.invalid">
            <mat-icon class="select-ico">my_location</mat-icon>
            <select formControlName="adresseChargement" class="field-select">
              <option value="" disabled>— Sélectionner un dépôt —</option>
              <option *ngFor="let pt of pointsDepartGrpo" [value]="pt.adresse">
                {{ pt.label }}
              </option>
            </select>
          </div>
          <span class="field-hint">
            <mat-icon style="font-size:13px;width:13px;height:13px">info</mat-icon>
            Choisissez le dépôt de collecte — la tournée doit avoir le même point de départ
          </span>
          <span class="field-error" *ngIf="submitted && form.get('adresseChargement')?.invalid">
            {{ getError('adresseChargement') }}
          </span>
        </div>
      </div>
    </div>

    <!-- ══ SECTION 4 : MARCHANDISE ═════════════════════════════ -->
    <div class="form-section">
      <div class="section-header">
        <div class="section-num">4</div>
        <div>
          <h2>Marchandise</h2>
          <p>Description, dimensions et coût estimé</p>
        </div>
      </div>
      <div class="section-body">
        <div class="field field--full">
          <label class="field-label">
            <mat-icon class="lbl-ico">inventory</mat-icon>
            Description de la marchandise
          </label>
          <textarea formControlName="descriptionMarchandise" class="field-textarea" rows="3"
                    placeholder="Ex: 10 cartons de vêtements, 5 palettes..."></textarea>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Poids <span class="unit-hint">(kg)</span></label>
            <div class="field-input-wrap">
              <mat-icon>scale</mat-icon>
              <input type="number" formControlName="poids" class="field-input" (input)="calculerCout()"
                     placeholder="0.0" min="0" step="0.1">
              <span class="unit-badge">kg</span>
            </div>
          </div>
          <div class="field">
            <label class="field-label">Volume <span class="unit-hint">(m³)</span></label>
            <div class="field-input-wrap">
              <mat-icon>straighten</mat-icon>
              <input type="number" formControlName="volume" class="field-input" (input)="calculerCout()"
                     placeholder="0.00" min="0" step="0.01">
              <span class="unit-badge">m³</span>
            </div>
          </div>
          <div class="field">
            <label class="field-label">Distance <span class="unit-hint">(km)</span></label>
            <div class="field-input-wrap">
              <mat-icon>route</mat-icon>
              <input type="number" formControlName="distance" class="field-input" (input)="calculerCout()"
                     placeholder="0" min="0">
              <span class="unit-badge">km</span>
            </div>
          </div>
          <div class="field">
            <label class="field-label">Coût estimé <span class="unit-hint">(DT)</span></label>
            <div class="field-input-wrap" [class.auto-calc]="coutDetail">
              <mat-icon>payments</mat-icon>
              <input type="number" formControlName="coutEstime" class="field-input" placeholder="0.00"
                     min="0" step="0.01" [readonly]="!!coutDetail">
              <span class="unit-badge">DT</span>
              <span class="auto-badge" *ngIf="coutDetail">AUTO</span>
            </div>
          </div>
        </div>

        <div class="cout-detail" *ngIf="coutDetail">
          <div class="cout-detail__title"><mat-icon>calculate</mat-icon> Détail du calcul</div>
          <div class="cout-detail__rows">
            <div class="cout-row"><span>Forfait de base</span><span>{{ coutDetail.base | number:'1.2-2' }} DT</span></div>
            <div class="cout-row" *ngIf="coutDetail.km > 0">
              <span>Distance ({{ form.get('distance')?.value }} km × 0.45 DT)</span>
              <span>{{ coutDetail.km | number:'1.2-2' }} DT</span>
            </div>
            <div class="cout-row" *ngIf="coutDetail.poids > 0">
              <span>Poids ({{ form.get('poids')?.value }} kg × 0.02 DT)</span>
              <span>{{ coutDetail.poids | number:'1.2-2' }} DT</span>
            </div>
            <div class="cout-row cout-row--separator"><span>Sous-total HT</span><span>{{ coutDetail.sousTotal | number:'1.2-2' }} DT</span></div>
            <div class="cout-row cout-row--tva"><span>TVA 19%</span><span>{{ coutDetail.tva | number:'1.2-2' }} DT</span></div>
            <div class="cout-row cout-row--total"><span>TOTAL TTC</span><span>{{ coutDetail.total | number:'1.2-2' }} DT</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ SECTION 5 : PRIORITÉ ════════════════════════════════ -->
    <div class="form-section">
      <div class="section-header">
        <div class="section-num">5</div>
        <div>
          <h2>Priorité de livraison</h2>
          <p>Définit l'ordre de traitement dans l'optimisation ML des tournées</p>
        </div>
      </div>
      <div class="section-body">
        <div class="priorite-grid">
          <div *ngFor="let p of priorites"
               class="priorite-card"
               [class.priorite-card--active]="form.get('priorite')?.value === p.value"
               [style.border-color]="form.get('priorite')?.value === p.value ? p.couleur : ''"
               [style.background]="form.get('priorite')?.value === p.value ? p.bg : ''"
               (click)="form.get('priorite')?.setValue(p.value)">
            <span class="priorite-icon">{{ p.icon }}</span>
            <div class="priorite-info">
              <div class="priorite-label" [style.color]="p.couleur">{{ p.label }}</div>
              <div class="priorite-desc">{{ p.desc }}</div>
            </div>
            <mat-icon class="priorite-check" *ngIf="form.get('priorite')?.value === p.value"
                      [style.color]="p.couleur">check_circle</mat-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- ERREUR GLOBALE -->
    <div class="global-error" *ngIf="erreurGlobale">
      <mat-icon>error</mat-icon>{{ erreurGlobale }}
    </div>

    <!-- FOOTER -->
    <div class="form-footer">
      <button type="button" mat-stroked-button (click)="retour()">Annuler</button>
      <button type="submit" mat-flat-button class="btn-submit" [disabled]="saving">
        <mat-icon *ngIf="!saving">{{ isEdit ? 'save' : 'check_circle' }}</mat-icon>
        {{ isEdit ? 'Enregistrer les modifications' : 'Créer la commande' }}
      </button>
    </div>

  </form>
</div>
  `,
  styles: [`
    :host {
      --blue: #1B4F72; --green: #16a34a; --border: #E2E8F0;
      --text: #0F172A; --text-2: #475569; --text-3: #94A3B8;
      --card: #fff; --bg: #F0F2F5; --r: 12px;
      font-family: 'Outfit', 'Segoe UI', sans-serif;
      display: block;
    }
    .form-shell { min-height: 100vh; background: var(--bg); }

    /* HEADER */
    .form-header {
      display: flex; align-items: center; gap: 20px;
      padding: 16px 32px; background: var(--card);
      border-bottom: 1px solid var(--border);
      position: sticky; top: 0; z-index: 100;
    }
    .back-btn {
      display: flex; align-items: center; gap: 4px;
      background: none; border: none; cursor: pointer;
      color: var(--text-2); font-size: 14px; font-weight: 500;
      padding: 6px 10px; border-radius: 8px; font-family: inherit;
      &:hover { background: #f1f5f9; }
      mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }
    }
    .form-header__title {
      display: flex; align-items: center; gap: 10px; flex: 1;
      mat-icon { color: var(--blue); }
      h1 { font-size: 20px; font-weight: 800; color: var(--text); margin: 0; }
    }
    .num-preview {
      font-family: monospace; font-size: 13px; font-weight: 700;
      background: #EBF5FB; color: var(--blue); padding: 3px 10px; border-radius: 6px;
    }
    .form-header__actions { display: flex; align-items: center; gap: 12px; }
    .autosave-hint {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: var(--text-3);
    }
    .btn-submit {
      background: linear-gradient(135deg, var(--blue) 0%, #2980b9 100%) !important;
      color: white !important; border-radius: 10px !important;
      font-weight: 700 !important; height: 42px !important;
    }

    /* FORM BODY */
    .form-body { padding: 24px 32px; max-width: 900px; margin: 0 auto; }

    /* SECTIONS */
    .form-section {
      background: var(--card); border-radius: var(--r);
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
      margin-bottom: 16px; overflow: hidden;
    }
    .section-header {
      display: flex; align-items: center; gap: 16px;
      padding: 20px 24px; border-bottom: 1px solid #f1f5f9;
      h2 { font-size: 16px; font-weight: 700; color: var(--text); margin: 0 0 2px; }
      p { font-size: 12px; color: var(--text-3); margin: 0; }
    }
    .section-num {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--blue); color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 15px; flex-shrink: 0;
    }
    .section-body { padding: 20px 24px; }

    /* ZONE SECTION */
    .zone-section .section-header { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-bottom-color: #bbf7d0; }
    .zone-num { background: var(--green) !important; }

    /* FIELDS */
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .field--full { width: 100%; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    .field-group.two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    .field-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.4px;
      .lbl-ico { color: var(--blue) !important; font-size: 14px !important; width: 14px !important; height: 14px !important; }
      .req { color: #e74c3c; }
      .unit-hint { font-size: 11px; color: var(--text-3); text-transform: none; font-weight: 400; }
    }

    .field-input-wrap {
      display: flex; align-items: center; gap: 10px;
      border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px;
      background: white; transition: border-color .2s;
      mat-icon { color: var(--text-3); font-size: 18px !important; width: 18px !important; height: 18px !important; flex-shrink: 0; }
      &:focus-within { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(27,79,114,.08); }
      &.invalid { border-color: #e74c3c; }
    }
    .readonly-wrap { background: #f8fafc !important; }
    .field-input {
      flex: 1; border: none; background: transparent;
      font-size: 14px; font-family: inherit; color: var(--text); outline: none; min-width: 0;
      &::placeholder { color: var(--text-3); }
    }
    .unit-badge { font-size: 12px; font-weight: 700; color: var(--text-3); flex-shrink: 0; }
    .auto-badge { background: #27ae60; color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }

    /* GEO FIELDS */
    .geo-row { display: grid; grid-template-columns: 1fr auto; gap: 14px; margin-bottom: 14px; align-items: start; }
    .geo-field { grid-column: 1 / -1; }
    .geo-field--sm { max-width: 160px; }

    .field-select-wrap {
      display: flex; align-items: center; gap: 10px;
      border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px;
      background: white; transition: border-color .2s;
      &:focus-within { border-color: var(--green); box-shadow: 0 0 0 3px rgba(22,163,74,.08); }
      &.invalid { border-color: #e74c3c; }
      .sel-ico { color: var(--text-3); font-size: 18px !important; width: 18px !important; height: 18px !important; flex-shrink: 0; }
    }
    .field-select {
      flex: 1; border: none; background: transparent;
      font-size: 14px; font-family: inherit; color: var(--text); outline: none; cursor: pointer;
    }

    /* ADRESSE COMPLÈTE */
    .adresse-complete-box {
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border: 1.5px solid #86efac;
      border-radius: 12px; padding: 14px 16px; margin-bottom: 16px;
    }
    .adresse-complete-box__header {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .4px; color: #15803d; margin-bottom: 8px;
      mat-icon { font-size: 16px; color: var(--green); }
    }
    .gps-badge {
      margin-left: auto; display: flex; align-items: center; gap: 4px;
      background: #16a34a; color: white;
      font-size: 10px; font-weight: 700; padding: 2px 8px;
      border-radius: 20px; text-transform: none;
      mat-icon { font-size: 12px !important; width: 12px !important; height: 12px !important; }
    }
    .adresse-complete-box__value {
      font-size: 14px; font-weight: 600; color: #15803d;
    }

    /* AUTOCOMPLETE */
    .autocomplete-wrap {
      display: flex; align-items: center; gap: 10px;
      border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px;
      background: white; transition: border-color .2s;
      mat-icon { color: var(--text-3); font-size: 18px !important; width: 18px !important; height: 18px !important; flex-shrink: 0; }
      &:focus-within { border-color: var(--blue); }
      &.invalid { border-color: #e74c3c; }
    }
    .check-ico { color: #22c55e !important; }
    .suggestions {
      background: white; border: 1.5px solid var(--border); border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,.1); overflow: hidden; max-height: 280px; overflow-y: auto;
    }
    .suggestion-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; cursor: pointer; transition: background .12s;
      border-bottom: 1px solid #f8fafc;
      &:hover { background: #f0f7ff; }
      &:last-child { border-bottom: none; }
    }
    .sugg-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; color: white; font-size: 15px; flex-shrink: 0;
    }
    .sugg-info { flex: 1; }
    .sugg-name { display: block; font-size: 13.5px; font-weight: 600; color: var(--text); }
    .sugg-meta { display: block; font-size: 11.5px; color: var(--text-3); margin-top: 2px; }

    .client-card {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px; background: #f0f7ff;
      border: 1.5px solid #bee3f8; border-radius: 10px;
    }
    .client-card__avatar {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; color: white; font-size: 18px; flex-shrink: 0;
    }
    .client-card__info {
      flex: 1; display: flex; flex-direction: column; gap: 2px;
      strong { font-size: 14px; color: var(--text); }
      span { font-size: 12px; color: var(--text-2); }
    }
    .client-card__change {
      display: flex; align-items: center; gap: 4px;
      background: none; border: 1px solid #bee3f8; border-radius: 8px;
      padding: 6px 12px; cursor: pointer; font-size: 13px;
      color: var(--blue); font-family: inherit;
      &:hover { background: #EBF5FB; }
    }

    /* DATE */
    .date-shortcuts { display: flex; gap: 6px; margin-top: 6px; }
    .shortcut {
      background: var(--border); border: none; border-radius: 6px;
      padding: 3px 10px; font-size: 12px; font-weight: 600;
      color: var(--text-2); cursor: pointer; font-family: inherit;
      &:hover { background: #EBF5FB; color: var(--blue); }
    }

    /* MARCHANDISE */
    .field-textarea {
      width: 100%; padding: 12px 14px;
      border: 1.5px solid var(--border); border-radius: 10px;
      font-size: 14px; font-family: inherit; color: var(--text);
      outline: none; resize: vertical;
      &:focus { border-color: var(--blue); }
      &::placeholder { color: var(--text-3); }
      box-sizing: border-box;
    }
    .auto-calc { border-color: #27ae60 !important; background: #f0fdf4 !important; }
    .cout-detail {
      background: #f8fafc; border: 1.5px solid var(--border);
      border-radius: 12px; padding: 16px 20px; margin-top: 12px;
    }
    .cout-detail__title {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 700; color: var(--blue); margin-bottom: 12px;
    }
    .cout-detail__rows { display: flex; flex-direction: column; gap: 6px; }
    .cout-row {
      display: flex; justify-content: space-between;
      font-size: 13px; color: #475569; padding: 4px 0;
    }
    .cout-row--separator { border-top: 1px solid var(--border); padding-top: 8px; font-weight: 600; color: #1e293b; }
    .cout-row--tva { color: #64748b; font-size: 12px; }
    .cout-row--total { border-top: 2px solid var(--blue); padding-top: 8px; font-size: 15px; font-weight: 800; color: var(--blue); }

    /* PRIORITÉ */
    .priorite-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .priorite-card {
      display: flex; align-items: center; gap: 12px;
      padding: 16px; border: 2px solid #e0e0e0; border-radius: 12px;
      cursor: pointer; transition: all .2s; background: white;
      &:hover { border-color: #bbb; transform: translateY(-1px); }
      &--active { box-shadow: 0 4px 12px rgba(0,0,0,.12); }
    }
    .priorite-icon { font-size: 28px; flex-shrink: 0; }
    .priorite-info { flex: 1; }
    .priorite-label { font-size: 14px; font-weight: 700; }
    .priorite-desc { font-size: 12px; color: #888; margin-top: 2px; }
    .priorite-check { margin-left: auto; }

    /* FOOTER */
    .global-error {
      display: flex; align-items: center; gap: 10px;
      background: #FADBD8; border: 1px solid #f1948a; border-radius: 10px;
      padding: 14px 18px; margin-bottom: 16px;
      font-size: 13px; color: #CB4335;
    }
    .form-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 0; }
    .field-error { font-size: 12px; color: #e74c3c; font-weight: 500; }
    .field-hint { font-size: 12px; color: var(--text-3); }

    @media (max-width: 700px) {
      .form-header { padding: 12px 16px; flex-wrap: wrap; }
      .form-body { padding: 16px; }
      .field-row { grid-template-columns: 1fr 1fr; }
      .priorite-grid { grid-template-columns: 1fr; }
      .field-group.two-cols { grid-template-columns: 1fr; }
    }
  `]
})
export class CommandeFormComponent implements OnInit, OnDestroy {

  readonly TARIF = { BASE: 15.0, PAR_KM: 0.45, PAR_KG: 0.02, PAR_M3: 2.50, MIN_COMMANDE: 25.0 };

  coutDetail: { base: number; km: number; poids: number; volume: number; sousTotal: number; tva: number; total: number; } | null = null;

  form!: FormGroup;
  isEdit = false;
  commandeId?: number;
  submitted = false;
  readonly today = new Date().toISOString().split('T')[0];
  saving = false;
  autoSaved = false;
  erreurGlobale = '';

  clients: Client[] = [];
  clientsFiltres: Client[] = [];
  clientSelected: Client | null = null;
  clientSearch = new FormControl('');
  numeroBatiment = new FormControl('');
  complementAdresse = new FormControl('');

  pointsDepartGrpo = POINTS_DEPART_GRPO;
  numeroPreview = '';

  // ── Zone géographique ──────────────────────────────────────
  gouvernorats = Object.keys(TUNISIE_GEO);
  gouvernoratSelectionne = '';
  quartiersDisponibles: string[] = [];
  quartierSelectionne = '';
  ruesDisponibles: string[] = [];
  rueSelectionnee = '';
  adresseComplete = '';
  coordsGPS: [number, number] | null = null;

  private destroy$ = new Subject<void>();

  readonly priorites = [
    { value: 'URGENT',  label: 'Urgent',  icon: '🔴', couleur: '#c62828', bg: '#ffebee', desc: 'Livraison dans 24h' },
    { value: 'HAUTE',   label: 'Haute',   icon: '🟠', couleur: '#e65100', bg: '#fff3e0', desc: 'Livraison dans 48h' },
    { value: 'NORMALE', label: 'Normale', icon: '🟡', couleur: '#f57f17', bg: '#fffde7', desc: 'Livraison dans la semaine' },
    { value: 'BASSE',   label: 'Basse',   icon: '🟢', couleur: '#2e7d32', bg: '#e8f5e9', desc: 'Livraison flexible' },
  ];

  constructor(
    private fb: FormBuilder,
    private svc: CommandeService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.numeroPreview = this.svc.generateNumero();

    this.svc.getClients().subscribe(c => {
      this.clients = c;
      this.cd.markForCheck();

      // Charger la commande seulement après avoir les clients
      this.route.params.pipe(takeUntil(this.destroy$)).subscribe(p => {
        if (p['id'] && p['id'] !== 'new') {
          this.isEdit = true;
          this.commandeId = +p['id'];
          this.chargerCommande(this.commandeId);
        } else {
          this.restaurerBrouillon();
        }
      });
    });

    this.clientSearch.valueChanges.pipe(
      debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe((q: string | null) => {
      if (!q || q.length < 2) { this.clientsFiltres = []; }
      else {
        const query = q.toLowerCase();
        this.clientsFiltres = this.clients.filter(c =>
          c.raisonSociale.toLowerCase().includes(query) ||
          c.matriculeFiscale?.toLowerCase().includes(query) ||
          (c.responsableEntreprise || '').toLowerCase().includes(query)
        ).slice(0, 6);
      }
      this.cd.markForCheck();
    });

    this.form.valueChanges.pipe(debounceTime(30000), takeUntil(this.destroy$)).subscribe(() => {
      if (!this.isEdit) {
        localStorage.setItem('tms_draft_commande', JSON.stringify(this.form.getRawValue()));
        this.autoSaved = true; this.cd.markForCheck();
        setTimeout(() => { this.autoSaved = false; this.cd.markForCheck(); }, 3000);
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  buildForm(): void {
    this.form = this.fb.group({
      numeroCommande:              [{ value: '', disabled: true }],
      clientId:                    [null, Validators.required],
      adresseChargement:           ['', [Validators.required, Validators.minLength(5)]],
      adresseLivraison:            ['', [Validators.required, Validators.minLength(5)]],
      villeLivraison:              ['', Validators.required],
      gouvernoratLivraison:        [''],
      quartierLivraison:           [''],
      rueLivraison:                [''],
      latitudeLivraison:           [null],
      longitudeLivraison:          [null],
      codePostalLivraison:         ['', Validators.required],
      paysLivraison:               ['Tunisie'],
      contactLivraison:            ['', Validators.required],
      telephoneContactLivraison:   ['', [Validators.required, Validators.pattern(/^(\+216)?[0-9]{8}$/)]],
      dateLivraisonPrevue:         ['', [Validators.required, this.dateFutureValidator.bind(this)]],
      descriptionMarchandise:      [''],
      poids:                       [null, Validators.min(0)],
      volume:                      [null, Validators.min(0)],
      distance:                    [null, Validators.min(0)],
      coutEstime:                  [null, Validators.min(0)],
      priorite:                    ['NORMALE'],
    });
  }

  // ── Zone géographique ──────────────────────────────────────────────────────

  onGouvernoratChange(gouv: string): void {
    this.gouvernoratSelectionne = gouv;
    this.quartierSelectionne = '';
    this.rueSelectionnee = '';
    this.quartiersDisponibles = gouv ? Object.keys(TUNISIE_GEO[gouv] || {}) : [];
    this.ruesDisponibles = [];

    // Code postal automatique
    const cp = CODES_POSTAUX[gouv] || '';
    this.form.patchValue({ codePostalLivraison: cp, villeLivraison: gouv, gouvernoratLivraison: gouv });

    // Coordonnées GPS du gouvernorat
    this.coordsGPS = GPS_GOUVERNORATS[gouv] || null;
    if (this.coordsGPS) {
      this.form.patchValue({ latitudeLivraison: this.coordsGPS[0], longitudeLivraison: this.coordsGPS[1] });
    }

    this.construireAdresse();
    this.cd.markForCheck();
  }

  onQuartierChange(quartier: string): void {
    this.quartierSelectionne = quartier;
    this.rueSelectionnee = '';
    this.ruesDisponibles = quartier
      ? TUNISIE_GEO[this.gouvernoratSelectionne]?.[quartier]?.rues || []
      : [];

    // Coordonnées GPS plus précises du quartier
    const q = TUNISIE_GEO[this.gouvernoratSelectionne]?.[quartier];
    if (q?.coords) {
      this.coordsGPS = q.coords;
      this.form.patchValue({ latitudeLivraison: q.coords[0], longitudeLivraison: q.coords[1], quartierLivraison: quartier });
    }

    this.construireAdresse();
    this.cd.markForCheck();
  }

  onRueChange(rue: string): void {
    this.rueSelectionnee = rue;
    this.form.patchValue({ rueLivraison: rue });
    this.construireAdresse();
    this.cd.markForCheck();
  }

  construireAdresse(): void {
    const parties: string[] = [];
    const num = this.numeroBatiment.value;
    const complement = this.complementAdresse.value;

    if (num) parties.push(num);
    if (this.rueSelectionnee) parties.push(this.rueSelectionnee);
    if (complement) parties.push(complement);
    if (this.quartierSelectionne) parties.push(this.quartierSelectionne);
    if (this.gouvernoratSelectionne) parties.push(this.gouvernoratSelectionne);
    parties.push('Tunisie');

    this.adresseComplete = parties.join(', ');
    this.form.patchValue({ adresseLivraison: this.adresseComplete }, { emitEvent: false });
    this.cd.markForCheck();
  }

  // ── Calcul coût ────────────────────────────────────────────────────────────

  calculerCout(): void {
    const distance = parseFloat(this.form.get('distance')?.value) || 0;
    const poids    = parseFloat(this.form.get('poids')?.value)    || 0;
    const volume   = parseFloat(this.form.get('volume')?.value)   || 0;
    if (distance === 0 && poids === 0 && volume === 0) {
      this.coutDetail = null;
      this.form.get('coutEstime')?.setValue(null, { emitEvent: false });
      this.cd.markForCheck(); return;
    }
    const base = this.TARIF.BASE;
    const km = distance * this.TARIF.PAR_KM;
    const poidsC = poids * this.TARIF.PAR_KG;
    const volC = volume * this.TARIF.PAR_M3;
    let sousTotal = Math.max(base + km + poidsC + volC, this.TARIF.MIN_COMMANDE);
    const tva = Math.round(sousTotal * 0.19 * 100) / 100;
    const total = Math.round((sousTotal + tva) * 100) / 100;
    this.coutDetail = {
      base: Math.round(base * 100) / 100,
      km: Math.round(km * 100) / 100,
      poids: Math.round(poidsC * 100) / 100,
      volume: Math.round(volC * 100) / 100,
      sousTotal: Math.round(sousTotal * 100) / 100,
      tva, total,
    };
    this.form.get('coutEstime')?.setValue(total, { emitEvent: false });
    this.cd.markForCheck();
  }

  // ── Client ──────────────────────────────────────────────────────────────────

  selectionnerClient(cl: Client): void {
    this.clientSelected = cl;
    this.form.patchValue({ clientId: cl.id });
    this.clientSearch.setValue(cl.raisonSociale, { emitEvent: false });
    this.clientsFiltres = [];
    this.cd.markForCheck();
  }

  changerClient(): void {
    this.clientSelected = null;
    this.form.patchValue({ clientId: null });
    this.clientSearch.setValue('');
  }

  // ── Soumission ──────────────────────────────────────────────────────────────

  soumettre(): void {
    this.submitted = true;

    // Validation zone géographique
    if (!this.gouvernoratSelectionne) {
      this.snack.open('Veuillez sélectionner un gouvernorat', '✕', { duration: 3000 });
      return;
    }

    if (this.form.invalid) {
      this.snack.open('Veuillez remplir tous les champs obligatoires', '✕', { duration: 3000 });
      this.cd.markForCheck();
      return;
    }

    this.saving = true;
    this.erreurGlobale = '';

    const data = this.form.getRawValue() as CommandeFormData;

    const obs = this.isEdit
      ? this.svc.update(this.commandeId!, data)
      : this.svc.create(data);

    obs.subscribe({
      next: c => {
        localStorage.removeItem('tms_draft_commande');
        this.snack.open(
          this.isEdit ? 'Commande modifiée avec succès' : 'Commande créée avec succès',
          '✕', { duration: 4000, panelClass: 'snack-ok' }
        );
        this.router.navigate(['/commandes', c.id]);
      },
      error: err => {
        this.erreurGlobale = err.error?.message || `Erreur ${err.status} — Veuillez réessayer`;
        this.saving = false;
        this.cd.markForCheck();
      }
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  chargerCommande(id: number): void {
    this.svc.getById(id).subscribe({
      next: c => {
        // ── 1. Remplir les champs du formulaire ──────────────────
        this.form.patchValue({
          numeroCommande:             c.numeroCommande           || '',
          clientId:                   c.client?.id || c.clientId || null,
          adresseChargement:          c.adresseChargement        || '',
          adresseLivraison:           c.adresseLivraison         || '',
          // Bug corrigé : utiliser dateLivraisonPrevue en priorité
          dateLivraisonPrevue:        c.dateLivraisonPrevue || c.dateSouhaitee || '',
          descriptionMarchandise:     c.descriptionMarchandise   || '',
          poids:                      c.poids    ?? null,
          volume:                     c.volume   ?? null,
          distance:                   c.distance ?? null,
          coutEstime:                 c.coutEstime ?? null,
          priorite:                   c.priorite || 'NORMALE',
          villeLivraison:             c.villeLivraison            || '',
          codePostalLivraison:        c.codePostalLivraison       || '',
          contactLivraison:           c.contactLivraison          || '',
          telephoneContactLivraison:  c.telephoneContactLivraison || '',
          gouvernoratLivraison:       c.gouvernoratLivraison      || '',
          quartierLivraison:          c.quartierLivraison         || '',
          rueLivraison:               c.rueLivraison              || '',
          latitudeLivraison:          c.latitudeLivraison         ?? null,
          longitudeLivraison:         c.longitudeLivraison        ?? null,
          paysLivraison:              c.paysLivraison || 'Tunisie',
        });

        // ── 2. Restaurer les listes déroulantes géographiques ────
        const gouv    = c.gouvernoratLivraison || '';
        const quartier = c.quartierLivraison   || '';
        const rue      = c.rueLivraison        || '';

        if (gouv) {
          this.gouvernoratSelectionne = gouv;
          this.quartiersDisponibles   = Object.keys(TUNISIE_GEO[gouv] || {});

          if (quartier) {
            this.quartierSelectionne = quartier;
            this.ruesDisponibles = TUNISIE_GEO[gouv]?.[quartier]?.rues || [];
            this.rueSelectionnee = rue;
          }
        }

        // ── 3. Restaurer l'adresse complète affichée ─────────────
        this.adresseComplete = c.adresseLivraison || '';

        // ── 4. Calculer le coût si données présentes ─────────────
        if (c.distance || c.poids || c.volume) {
          this.calculerCout();
        }

        // ── 5. Restaurer le client sélectionné ───────────────────
        if (c.client) {
          this.clientSelected = c.client;
          this.clientSearch.setValue(c.client.raisonSociale, { emitEvent: false });
        } else if (c.clientId) {
          // Chercher le client dans la liste si l'objet n'est pas inclus
          const found = this.clients.find(cl => cl.id === c.clientId);
          if (found) {
            this.clientSelected = found;
            this.clientSearch.setValue(found.raisonSociale, { emitEvent: false });
          }
        }

        this.cd.markForCheck();
      },
      error: () => {
        this.snack.open('Erreur lors du chargement de la commande', '✕', { duration: 3000 });
      }
    });
  }

  restaurerBrouillon(): void {
    try {
      const draft = localStorage.getItem('tms_draft_commande');
      if (draft) {
        this.form.patchValue(JSON.parse(draft));
        this.snack.open('Brouillon restauré', '✕', { duration: 3000 });
      }
    } catch {}
  }

  dateFutureValidator(ctrl: AbstractControl): ValidationErrors | null {
    if (!ctrl.value) return null;
    const date = new Date(ctrl.value);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return date >= today ? null : { dateFuture: true };
  }

  setDateSouhaitee(jours: number): void {
    const d = new Date(); d.setDate(d.getDate() + jours);
    this.form.patchValue({ dateLivraisonPrevue: d.toISOString().split('T')[0] });
  }

  retour(): void { this.router.navigate(['/commandes']); }

  getError(field: string): string {
    const c = this.form.get(field);
    if (c?.hasError('required')) return 'Ce champ est obligatoire';
    if (c?.hasError('minlength')) return `Minimum ${c.errors?.['minlength'].requiredLength} caractères requis`;
    if (c?.hasError('min')) return 'La valeur doit être positive';
    if (c?.hasError('pattern')) return 'Format invalide (ex: 12345678 ou +21612345678)';
    if (c?.hasError('dateFuture')) return 'La date doit être dans le futur';
    return '';
  }

  avatarColor(nom: string): string {
    const colors = ['#1B4F72','#0e6655','#7d3c98','#c0392b','#1a5276'];
    return colors[(nom.charCodeAt(0) || 0) % colors.length];
  }
}