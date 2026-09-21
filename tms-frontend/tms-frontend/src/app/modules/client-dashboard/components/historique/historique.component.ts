import { Component, OnInit } from '@angular/core';
import { HistoriqueService } from '@app/core/services/historique.service';
import { Historique } from '@app/core/models/models';

@Component({
  selector: 'app-historique',
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.scss']
})
export class HistoriqueComponent implements OnInit {
  
  historiques: Historique[] = [];
  loading = true;
  error: string | null = null;

  constructor(private historiqueService: HistoriqueService) {}

  ngOnInit(): void {
    this.loadHistorique();
  }

  loadHistorique(): void {
    this.historiqueService.getMonHistorique().subscribe({
      next: (data) => {
        this.historiques = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de l\'historique';
        this.loading = false;
        console.error(err);
      }
    });
  }

  exportPDF(): void {
    this.historiqueService.exportPDF().subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'historique.pdf';
        link.click();
        window.URL.revokeObjectURL(link.href);
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  exportCSV(): void {
    this.historiqueService.exportCSV().subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'historique.csv';
        link.click();
        window.URL.revokeObjectURL(link.href);
      },
      error: (err) => console.error('Erreur:', err)
    });
  }
}
