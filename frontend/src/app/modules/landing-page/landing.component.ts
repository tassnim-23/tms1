import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  standalone: false,
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingPageComponent implements OnInit {

  isScrolled   = false;
  heroVisible  = false;

  // ── Stats bar
  statsBar = [
    { val: '250+', lbl: 'Clients accompagnés' },
    { val: '15+',  lbl: 'Années d\'expertise'  },
    { val: '98%',  lbl: 'Satisfaction client'  },
    { val: '24/7', lbl: 'Support disponible'   },
  ];

  // ── Feature cards (✅ AVEC VOS VRAIES IMAGES)
  features = [
    { 
      img: 'assets/im1.png',      // ✅ PNG
      bg: '#e8f4fd', 
      title: 'Gestion des Clients',
      desc: 'Enregistrez vos clients entreprise avec raison sociale, matricule fiscale et responsable dédié.' 
    },
    { 
      img: 'assets/im2.jpg',      // ✅ JPG
      bg: '#eaf7ef', 
      title: 'Gestion des Chauffeurs',
      desc: 'Suivez vos chauffeurs, leurs permis et leurs disponibilités pour les affectations de tournées.' 
    },
    { 
      img: 'assets/im3.jpeg',     // ✅ JPEG
      bg: '#fef9e7', 
      title: 'Parc de Véhicules',
      desc: 'Gérez votre flotte : camions, fourgons, état technique, capacité et disponibilité.' 
    },
    { 
      img: 'assets/im4.png',      // ✅ PNG
      bg: '#f5f3ff', 
      title: 'Commandes de Transport',
      desc: 'Créez et suivez chaque commande avec statut en temps réel, coût estimé et traçabilité complète.' 
    },
    { 
      img: 'assets/im5.jpg',      // ✅ JPG
      bg: '#f0fdf4', 
      title: 'Planification des Tournées',
      desc: 'Organisez les itinéraires et optimisez vos tournées de livraison quotidiennes efficacement.' 
    },
    { 
      img: 'assets/im6.jpg',      // ✅ JPG
      bg: '#f0fdfa', 
      title: 'Rapports & Statistiques',
      desc: 'Analysez vos performances : taux de livraison, revenus, graphiques clairs et exports PDF/Excel.' 
    },
  ];

  // ── Process steps (✅ AVEC VOS IMAGES)
  steps = [
    { 
      img: 'assets/im1.png',
      title: 'Créez votre compte',
      desc: 'Inscription rapide en quelques minutes. Configurez votre entreprise et vos préférences.' 
    },
    { 
      img: 'assets/im2.jpg',
      title: 'Configurez votre flotte',
      desc: 'Ajoutez vos véhicules, chauffeurs et clients. L\'interface intuitive vous guide pas à pas.' 
    },
    { 
      img: 'assets/im3.jpeg',
      title: 'Pilotez votre activité',
      desc: 'Créez des commandes, planifiez les tournées et suivez vos KPIs depuis le tableau de bord.' 
    },
  ];

  // ── Modules (✅ AVEC VOS IMAGES)
  modules = [
    { img: 'assets/im1.png',  title: 'Tableau de bord',      desc: 'Vue synthétique de toute votre activité en temps réel' },
    { img: 'assets/im2.jpg',  title: 'Clients',               desc: 'Gestion complète de votre portefeuille clients' },
    { img: 'assets/im3.jpeg', title: 'Commandes',             desc: 'Suivi et traitement de toutes vos commandes transport' },
    { img: 'assets/im4.png',  title: 'Tournées',              desc: 'Planification et optimisation des itinéraires' },
    { img: 'assets/im5.jpg',  title: 'Véhicules',             desc: 'Gestion et maintenance de votre parc de véhicules' },
    { img: 'assets/im6.jpg',  title: 'Chauffeurs',            desc: 'Gestion des équipes et affectations conducteurs' },
    { img: 'assets/im1.png',  title: 'Rapports & Exports',   desc: 'Analyses approfondies et exports automatisés' },
    { img: 'assets/im2.jpg',  title: 'Notifications',         desc: 'Alertes email et SMS pour vous et vos clients' },
    { img: 'assets/im3.jpeg', title: 'Demandes d\'inscription', desc: 'Traitement des demandes d\'accès à la plateforme' },
  ];

  ngOnInit(): void {
    setTimeout(() => { this.heroVisible = true; }, 120);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }
}