import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ClientService, ChauffeurService, VehiculeService } from './crud.services';

// ── Tentative d'import de CommandeService / TourneeService ──
// Ils peuvent venir du module généré précédemment ou du crud.services enrichi
// On les importe conditionnellement via HttpClient pour éviter les erreurs de compilation
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RapportService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private clientSvc: ClientService,
    private chauffeurSvc: ChauffeurService,
    private vehiculeSvc: VehiculeService,
  ) {}

  // ── Commandes (accès direct HTTP pour éviter dépendance circulaire) ──
  private getCommandes(page = 0, size = 1000, statut = '') {
    let p = new HttpParams().set('page', page).set('size', size);
    if (statut) p = p.set('statut', statut);
    return this.http.get<any>(`${this.api}/commandes`, { params: p });
  }

  private getTournees(page = 0, size = 1000, statut = '') {
    let p = new HttpParams().set('page', page).set('size', size);
    if (statut) p = p.set('statut', statut);
    return this.http.get<any>(`${this.api}/tournees`, { params: p });
  }

  // ────────────────────────────────────────────
  // RAPPORT LIVRAISONS
  // ────────────────────────────────────────────
  getRapportLivraisons(): Observable<any> {
    return this.getCommandes(0, 1000).pipe(
      map(page => {
        const list = page.content || [];
        const total    = list.length;
        const livrees  = list.filter((c: any) => c.statut === 'LIVREE').length;
        const annulees = list.filter((c: any) => c.statut === 'ANNULEE').length;
        const enCours  = list.filter((c: any) => c.statut === 'EN_COURS').length;
        const enAttente= list.filter((c: any) => c.statut === 'EN_ATTENTE').length;
        const assignees= list.filter((c: any) => c.statut === 'ASSIGNEE').length;
        const revenu   = list.filter((c: any) => c.statut === 'LIVREE')
                            .reduce((s: number, c: any) => s + (c.coutEstime || 0), 0);

        // Evolution par mois
        const parMois: Record<string, any> = {};
        list.forEach((c: any) => {
          const k = (c.dateSouhaitee || c.createdAt || '').substring(0, 7);
          if (!k) return;
          if (!parMois[k]) parMois[k] = { total: 0, livrees: 0, annulees: 0, revenu: 0 };
          parMois[k].total++;
          if (c.statut === 'LIVREE')  { parMois[k].livrees++; parMois[k].revenu += c.coutEstime || 0; }
          if (c.statut === 'ANNULEE') { parMois[k].annulees++; }
        });
        const evolution = Object.entries(parMois)
          .map(([mois, v]: any) => ({
            mois,
            label: this.moisLabel(mois),
            total: v.total, livrees: v.livrees, annulees: v.annulees,
            revenu: Math.round(v.revenu),
            taux: v.total > 0 ? Math.round((v.livrees / v.total) * 100) : 0
          }))
          .sort((a, b) => a.mois.localeCompare(b.mois));

        return {
          total, livrees, annulees, enCours, enAttente, assignees,
          revenu: Math.round(revenu),
          taux: total > 0 ? Math.round((livrees / total) * 100) : 0,
          evolution,
          rows: list.map((c: any) => ({
            numero:    c.numeroCommande || '—',
            client:    c.clientNom || `Client #${c.clientId}`,
            livraison: c.adresseLivraison || '—',
            date:      c.dateSouhaitee ? new Date(c.dateSouhaitee).toLocaleDateString('fr-FR') : '—',
            statut:    c.statut || '—',
            poids:     c.poids ? `${c.poids} kg` : '—',
            cout:      c.coutEstime ? `${c.coutEstime} DT` : '—',
          }))
        };
      }),
      catchError(() => of({ total:0,livrees:0,annulees:0,enCours:0,enAttente:0,assignees:0,revenu:0,taux:0,evolution:[],rows:[] }))
    );
  }

  // ────────────────────────────────────────────
  // RAPPORT CHAUFFEURS
  // ────────────────────────────────────────────
  getRapportChauffeurs(): Observable<any> {
    return forkJoin({
      chauffeurs: this.chauffeurSvc.getAll(0, 200),
      tournees:   this.getTournees(0, 1000)
    }).pipe(
      map(({ chauffeurs, tournees }) => {
        const list = chauffeurs.content || [];
        const tList = tournees.content || [];
        const dispos = list.filter((c: any) => c.disponible).length;

        const rows = list.map((c: any) => {
          const myTournees = tList.filter((t: any) => t.chauffeurId === c.id);
          const terminees  = myTournees.filter((t: any) => t.statut === 'TERMINEE').length;
          const kmTotal    = myTournees.reduce((s: number, t: any) => s + (t.distanceTotale || 0), 0);
          const permisDays = c.dateValiditePermis
            ? Math.ceil((new Date(c.dateValiditePermis).getTime() - Date.now()) / 86400000) : null;
          return {
            nom:        `${c.prenom} ${c.nom}`,
            email:      c.email || '—',
            telephone:  c.telephone || '—',
            permis:     c.numeroPermis || '—',
            validite:   c.dateValiditePermis ? new Date(c.dateValiditePermis).toLocaleDateString('fr-FR') : '—',
            disponible: c.disponible ? 'Disponible' : 'Indisponible',
            tournees:   myTournees.length,
            terminees,
            distance:   kmTotal > 0 ? `${kmTotal} km` : '—',
            permisDays
          };
        });

        return {
          total: list.length, dispos, indispos: list.length - dispos,
          totalTournees: tList.length,
          rows
        };
      }),
      catchError(() => of({ total:0, dispos:0, indispos:0, totalTournees:0, rows:[] }))
    );
  }

  // ────────────────────────────────────────────
  // RAPPORT VEHICULES
  // ────────────────────────────────────────────
  getRapportVehicules(): Observable<any> {
    return forkJoin({
      vehicules: this.vehiculeSvc.getAll(0, 200),
      tournees:  this.getTournees(0, 1000)
    }).pipe(
      map(({ vehicules, tournees }) => {
        const list  = vehicules.content || [];
        const tList = tournees.content  || [];
        const dispos  = list.filter((v: any) => v.statut === 'DISPONIBLE').length;
        const service = list.filter((v: any) => v.statut === 'EN_SERVICE').length;
        const maint   = list.filter((v: any) => v.statut === 'EN_MAINTENANCE').length;
        const kmTotal = list.reduce((s: number, v: any) => s + (v.kilometrage || 0), 0);

        const rows = list.map((v: any) => {
          const myT = tList.filter((t: any) => t.vehiculeId === v.id);
          return {
            immat:    v.immatriculation,
            marque:   `${v.marque || ''} ${v.modele || ''}`.trim() || '—',
            capacite: v.capaciteCharge ? `${v.capaciteCharge} kg` : '—',
            km:       v.kilometrage ? v.kilometrage.toLocaleString('fr-FR') + ' km' : '—',
            statut:   v.statut || '—',
            tournees: myT.length,
            miseEnService: v.dateMiseEnService ? new Date(v.dateMiseEnService).toLocaleDateString('fr-FR') : '—'
          };
        });

        return { total: list.length, dispos, service, maint, kmTotal, rows };
      }),
      catchError(() => of({ total:0, dispos:0, service:0, maint:0, kmTotal:0, rows:[] }))
    );
  }

  // ────────────────────────────────────────────
  // RAPPORT CLIENTS
  // ────────────────────────────────────────────
  getRapportClients(): Observable<any> {
    return forkJoin({
      clients:   this.clientSvc.getAll(0, 200),
      commandes: this.getCommandes(0, 1000)
    }).pipe(
      map(({ clients, commandes }) => {
        const cList = clients.content   || [];
        const kList = commandes.content || [];

        const rows = cList.map((c: any) => {
          const myCmds    = kList.filter((k: any) => k.clientId === c.id);
          const livrees   = myCmds.filter((k: any) => k.statut === 'LIVREE').length;
          const ca        = myCmds.filter((k: any) => k.statut === 'LIVREE')
                              .reduce((s: number, k: any) => s + (k.coutEstime || 0), 0);
          return {
            raisonSociale: c.raisonSociale,
            ville:         c.ville || '—',
            email:         c.email || '—',
            telephone:     c.telephone || '—',
            commandes:     myCmds.length,
            livrees,
            ca:            Math.round(ca) + ' DT',
            tauxLivraison: myCmds.length > 0 ? Math.round((livrees / myCmds.length) * 100) + ' %' : '0 %'
          };
        });

        const totalCA = rows.reduce((s: number, r: any) => s + parseInt(r.ca), 0);
        return { total: cList.length, totalCommandes: kList.length, totalCA, rows };
      }),
      catchError(() => of({ total:0, totalCommandes:0, totalCA:0, rows:[] }))
    );
  }

  // ────────────────────────────────────────────
  // RAPPORT TOURNEES
  // ────────────────────────────────────────────
  getRapportTournees(): Observable<any> {
    return this.getTournees(0, 1000).pipe(
      map(page => {
        const list = page.content || [];
        const plan = list.filter((t: any) => t.statut === 'PLANIFIEE').length;
        const enc  = list.filter((t: any) => t.statut === 'EN_COURS').length;
        const term = list.filter((t: any) => t.statut === 'TERMINEE').length;
        const km   = list.reduce((s: number, t: any) => s + (t.distanceTotale || 0), 0);
        const rows = list.map((t: any) => ({
          date:      t.dateTournee ? new Date(t.dateTournee).toLocaleDateString('fr-FR') : '—',
          chauffeur: t.chauffeurNom || `Chauffeur #${t.chauffeurId}`,
          vehicule:  t.vehiculeImmat || `Véhicule #${t.vehiculeId}`,
          distance:  t.distanceTotale ? `${t.distanceTotale} km` : '—',
          statut:    t.statut || '—',
          livraisons: t.commandeIds?.length || t.nbCommandes || 0,
          horaires:  t.heureDebut && t.heureFin ? `${t.heureDebut} → ${t.heureFin}` : '—'
        }));
        return { total: list.length, planifiees: plan, enCours: enc, terminees: term, kmTotal: km, rows };
      }),
      catchError(() => of({ total:0, planifiees:0, enCours:0, terminees:0, kmTotal:0, rows:[] }))
    );
  }

  private moisLabel(ym: string): string {
    if (!ym || ym.length < 7) return ym;
    const mois = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const m = parseInt(ym.substring(5, 7)) - 1;
    return `${mois[m]} ${ym.substring(0, 4)}`;
  }
}
