import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Page publique (sans login) affichée quand le client clique sur
 * "Oui je confirme" ou "Non je ne serai pas là" dans l'email.
 *
 * URL reçue : http://localhost:4200/confirmation?token=xxx&action=confirmer
 *          ou http://localhost:4200/confirmation?token=xxx&action=refuser
 */
@Component({
  selector: 'app-confirmation-livraison',
  templateUrl: './confirmation-livraison.component.html',
  styleUrls: ['./confirmation-livraison.component.scss']
})
export class ConfirmationLivraisonComponent implements OnInit {

  etat: 'chargement' | 'formulaire_refus' | 'succes_confirme' | 'succes_refuse' | 'erreur' = 'chargement';

  token  = '';
  action = '';
  message = '';
  numeroCommande = '';
  motifRefus = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.token  = this.route.snapshot.queryParamMap.get('token')  || '';
    this.action = this.route.snapshot.queryParamMap.get('action') || '';

    if (!this.token) {
      this.etat    = 'erreur';
      this.message = 'Lien invalide : token manquant.';
      return;
    }

    if (this.action === 'confirmer') {
      this.confirmer();
    } else if (this.action === 'refuser') {
      this.etat = 'formulaire_refus';
    } else {
      this.etat    = 'erreur';
      this.message = "Action inconnue. Veuillez utiliser les boutons de l'email.";
    }
  }

  confirmer(): void {
    this.etat = 'chargement';
    this.http.get<any>(`${environment.apiUrl}/public/livraison/confirmer?token=${this.token}`)
      .subscribe({
        next: (res) => {
          this.etat           = 'succes_confirme';
          this.numeroCommande = res.commande || '';
        },
        error: (err) => {
          this.etat    = 'erreur';
          this.message = err.error?.message || 'Une erreur est survenue. Veuillez contacter notre service client.';
        }
      });
  }

  refuser(): void {
    this.etat = 'chargement';
    this.http.post<any>(`${environment.apiUrl}/public/livraison/refuser`, {
      token: this.token,
      motif: this.motifRefus || 'Aucun motif précisé'
    }).subscribe({
      next: (res) => {
        this.etat           = 'succes_refuse';
        this.numeroCommande = res.commande || '';
      },
      error: (err) => {
        this.etat    = 'erreur';
        this.message = err.error?.message || 'Une erreur est survenue. Veuillez contacter notre service client.';
      }
    });
  }

  retourConfirmer(): void {
    this.confirmer();
  }
}