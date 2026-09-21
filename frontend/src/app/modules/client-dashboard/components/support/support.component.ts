import { Component, OnInit } from '@angular/core';
import { SupportService } from '@app/core/services/support.service';
import { SupportMessage } from '@app/core/models/models';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent implements OnInit {
  
  messages: SupportMessage[] = [];
  messageForm: FormGroup;
  showForm = false;
  loading = true;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private supportService: SupportService,
    private fb: FormBuilder
  ) {
    this.messageForm = this.fb.group({
      sujet: ['', Validators.required],
      contenu: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.supportService.getMesMessages().subscribe({
      next: (data) => {
        this.messages = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des messages';
        this.loading = false;
        console.error(err);
      }
    });
  }

  envoyerMessage(): void {
    if (this.messageForm.invalid) {
      this.error = 'Veuillez remplir tous les champs';
      return;
    }

    const { sujet, contenu } = this.messageForm.value;
    this.supportService.envoyerMessage(sujet, contenu).subscribe({
      next: () => {
        this.success = 'Message envoyé avec succès';
        this.messageForm.reset();
        this.showForm = false;
        this.loadMessages();
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => {
        this.error = 'Erreur lors de l\'envoi du message';
        console.error(err);
      }
    });
  }

  supprimerMessage(id: number): void {
    this.supportService.supprimerMessage(id).subscribe({
      next: () => {
        this.loadMessages();
      },
      error: (err) => console.error('Erreur:', err)
    });
  }
}
