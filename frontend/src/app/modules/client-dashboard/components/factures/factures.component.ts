import { Component, OnInit } from '@angular/core';
import { FacturesService } from '@app/core/services/factures.service';
import { Facture } from '@app/core/models/models';

@Component({
  selector: 'app-factures',
  templateUrl: './factures.component.html',
  styleUrls: ['./factures.component.scss']
})
export class FacturesComponent implements OnInit {
  
  factures: Facture[] = [];
  loading = true;
  error: string | null = null;

  constructor(private facturesService: FacturesService) {}

  ngOnInit(): void {
    this.loadFactures();
  }

  loadFactures(): void {
    this.facturesService.getMesFactures().subscribe({
      next: (data) => {
        this.factures = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des factures';
        this.loading = false;
        console.error(err);
      }
    });
  }

  telechargerFacture(facture: Facture): void {
    this.facturesService.telechargerFacture(facture.id).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${facture.numero}.pdf`;
        link.click();
        window.URL.revokeObjectURL(link.href);
      },
      error: (err) => {
        console.error('Erreur lors du téléchargement:', err);
      }
    });
  }

  marquerCommePayee(facture: Facture): void {
    this.facturesService.marquerCommePayee(facture.id).subscribe({
      next: () => {
        facture.statut = 'PAYEE';
      },
      error: (err) => {
        console.error('Erreur:', err);
      }
    });
  }
}
