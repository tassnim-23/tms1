import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommandesService } from '@app/core/services/commandes.service';
import { Commande } from '@app/core/models/models';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  TUNISIE_GEO, GPS_GOUVERNORATS, CODES_POSTAUX, POINTS_DEPART_GRPO
} from '../../../commandes/models/commande.model';

export const GOUVERNORATS_TN = Object.keys(TUNISIE_GEO);

const STATUT_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  EN_ATTENTE:  { label: 'En attente',              color: '#1B4F72', bg: '#EBF5FB', icon: '📋' },
  ASSIGNEE:    { label: 'Assignée à une tournée',  color: '#D68910', bg: '#FEF9E7', icon: '📌' },
  EN_COURS:    { label: 'En cours de livraison',   color: '#E67E22', bg: '#FEF3E2', icon: '🚚' },
  LIVREE:      { label: 'Livrée',                  color: '#1E8449', bg: '#E8F8F5', icon: '✅' },
  ANNULEE:     { label: 'Annulée / Rejetée',       color: '#CB4335', bg: '#FADBD8', icon: '❌' },
};

@Component({
  selector: 'app-commandes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './commandes.component.html',
  styleUrls: ['./commandes.component.scss'],
})
export class CommandesComponent implements OnInit, OnDestroy {

  commandes: Commande[] = [];
  commandeForm!: FormGroup;
  showForm   = false;
  loading    = true;
  submitting = false;
  submitted  = false;
  successMsg: string | null = null;
  error:      string | null = null;

  pointsDepart = POINTS_DEPART_GRPO;
  gouvernorats = GOUVERNORATS_TN;

  quartiersDisponibles: string[] = [];
  quartierSelectionne = '';
  ruesDisponibles: string[] = [];
  rueSelectionnee = '';
  adresseComplete = '';
  coordsGPS: [number, number] | null = null;

  numeroBatiment    = new FormControl('');
  complementAdresse = new FormControl('');

  readonly priorites = [
    { value: 'URGENT',  label: 'Urgent',  icon: '🔴', couleur: '#c62828', bg: '#ffebee', desc: 'Livraison dans 24h' },
    { value: 'HAUTE',   label: 'Haute',   icon: '🟠', couleur: '#e65100', bg: '#fff3e0', desc: 'Livraison dans 48h' },
    { value: 'NORMALE', label: 'Normale', icon: '🟡', couleur: '#f57f17', bg: '#fffde7', desc: 'Livraison dans la semaine' },
    { value: 'BASSE',   label: 'Basse',   icon: '🟢', couleur: '#2e7d32', bg: '#e8f5e9', desc: 'Livraison flexible' },
  ];

  readonly today = new Date().toISOString().split('T')[0];
  private destroy$ = new Subject<void>();

  constructor(
    private commandesService: CommandesService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCommandes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.commandeForm = this.fb.group({
      adresseChargement:          ['', Validators.required],
      gouvernoratLivraison:       ['', Validators.required],
      quartierLivraison:          ['', Validators.required],
      rueLivraison:               ['', Validators.required],
      latitudeLivraison:          [null],
      longitudeLivraison:         [null],
      adresseLivraison:           ['', Validators.required],
      villeLivraison:             ['', Validators.required],
      codePostalLivraison:        [''],
      contactLivraison:           ['', Validators.required],
      telephoneContactLivraison:  ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]],
      dateLivraisonPrevue:        ['', Validators.required],
      descriptionMarchandise:     ['', Validators.required],
      poids:                      [null, [Validators.required, Validators.min(0.1)]],
      volume:                     [null],
      remarques:                  [''],
      priorite:                   ['NORMALE'],
    });

    // ── Écoute gouvernorat via valueChanges — évite (change) natif ──
    this.commandeForm.get('gouvernoratLivraison')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(gouv => this._onGouvernoratChange(gouv));

    this.commandeForm.get('quartierLivraison')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(quartier => this._onQuartierChange(quartier));

    this.commandeForm.get('rueLivraison')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(rue => this._onRueChange(rue));
  }

  // ── Zone géographique — appelée via valueChanges, pas via (change) ──

  private _onGouvernoratChange(gouv: string): void {
    if (!gouv) return;
    this.quartierSelectionne = '';
    this.rueSelectionnee = '';
    this.quartiersDisponibles = Object.keys(TUNISIE_GEO[gouv] || {});
    this.ruesDisponibles = [];

    const cp = CODES_POSTAUX[gouv] || '';
    // patchValue sans émettre d'événement pour éviter boucle
    this.commandeForm.patchValue({
      codePostalLivraison: cp,
      villeLivraison: gouv,
      quartierLivraison: '',
      rueLivraison: '',
    }, { emitEvent: false });

    this.coordsGPS = GPS_GOUVERNORATS[gouv] as [number, number] || null;
    if (this.coordsGPS) {
      this.commandeForm.patchValue(
        { latitudeLivraison: this.coordsGPS[0], longitudeLivraison: this.coordsGPS[1] },
        { emitEvent: false }
      );
    }
    this.construireAdresse();
    this.cd.markForCheck();
  }

  private _onQuartierChange(quartier: string): void {
    if (!quartier) return;
    const gouv = this.commandeForm.get('gouvernoratLivraison')!.value;
    this.quartierSelectionne = quartier;
    this.rueSelectionnee = '';
    this.ruesDisponibles = TUNISIE_GEO[gouv]?.[quartier]?.rues || [];

    const q = TUNISIE_GEO[gouv]?.[quartier];
    if (q?.coords) {
      this.coordsGPS = q.coords;
      this.commandeForm.patchValue(
        { latitudeLivraison: q.coords[0], longitudeLivraison: q.coords[1], rueLivraison: '' },
        { emitEvent: false }
      );
    }
    this.construireAdresse();
    this.cd.markForCheck();
  }

  private _onRueChange(rue: string): void {
    if (!rue) return;
    this.rueSelectionnee = rue;
    this.construireAdresse();
    this.cd.markForCheck();
  }

  construireAdresse(): void {
    const gouv    = this.commandeForm.get('gouvernoratLivraison')!.value || '';
    const parties: string[] = [];
    const num        = this.numeroBatiment.value;
    const complement = this.complementAdresse.value;
    if (num) parties.push(num);
    if (this.rueSelectionnee) parties.push(this.rueSelectionnee);
    if (complement) parties.push(complement);
    if (this.quartierSelectionne) parties.push(this.quartierSelectionne);
    if (gouv) parties.push(gouv);
    parties.push('Tunisie');
    this.adresseComplete = parties.join(', ');
    this.commandeForm.patchValue({ adresseLivraison: this.adresseComplete }, { emitEvent: false });
    this.cd.markForCheck();
  }

  setDateSouhaitee(jours: number): void {
    const d = new Date(); d.setDate(d.getDate() + jours);
    this.commandeForm.patchValue({ dateLivraisonPrevue: d.toISOString().split('T')[0] });
  }

  // ── CRUD ───────────────────────────────────────────────────

  loadCommandes(): void {
    this.loading = true;
    this.cd.markForCheck();
    this.commandesService.getMesCommandes().subscribe({
      next:  d => { this.commandes = d; this.loading = false; this.cd.markForCheck(); },
      error: () => { this.error = 'Erreur de chargement'; this.loading = false; this.cd.markForCheck(); },
    });
  }

  ouvrirFormulaire(): void {
    this.showForm = true; this.submitted = false;
    this.error = null; this.successMsg = null;
    this.commandeForm.reset({ priorite: 'NORMALE' }, { emitEvent: false });
    this.quartiersDisponibles = [];
    this.ruesDisponibles = [];
    this.quartierSelectionne = '';
    this.rueSelectionnee = '';
    this.adresseComplete = '';
    this.coordsGPS = null;
    this.numeroBatiment.reset();
    this.complementAdresse.reset();
    this.cd.markForCheck();
  }

  fermerFormulaire(): void {
    this.showForm = false; this.submitted = false; this.error = null;
    this.cd.markForCheck();
  }

  creerCommande(): void {
    this.submitted = true;
    if (this.commandeForm.invalid) {
      this.error = 'Veuillez remplir tous les champs obligatoires.';
      this.cd.markForCheck(); return;
    }
    this.submitting = true; this.error = null; this.cd.markForCheck();

    const payload = { ...this.commandeForm.value, statut: 'EN_ATTENTE' };

    this.commandesService.creerCommande(payload).subscribe({
      next: () => {
        this.submitting = false; this.showForm = false; this.submitted = false;
        this.successMsg = '✅ Commande soumise avec succès !';
        this.loadCommandes();
      },
      error: () => {
        this.submitting = false;
        this.error = 'Erreur lors de la création. Veuillez réessayer.';
        this.cd.markForCheck();
      },
    });
  }

  annulerCommande(id: number | undefined): void {
    if (!id) return;
    this.commandesService.annulerCommande(id).subscribe({
      next: () => this.loadCommandes(),
      error: () => { this.error = "Erreur lors de l'annulation."; this.cd.markForCheck(); },
    });
  }

  getStatutInfo(statut?: string) {
    return STATUT_LABELS[statut || ''] || { label: statut || '—', color: '#64748b', bg: '#f1f5f9', icon: '•' };
  }

  getError(field: string): string {
    const ctrl = this.commandeForm.get(field);
    if (!ctrl?.errors) return '';
    if (ctrl.errors['required']) return 'Ce champ est requis';
    if (ctrl.errors['min'])      return 'Valeur trop faible';
    if (ctrl.errors['pattern'])  return 'Format invalide (ex: +21698000000)';
    return 'Valeur incorrecte';
  }
}