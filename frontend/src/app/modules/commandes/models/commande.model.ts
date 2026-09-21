export type StatutCommande =
  'EN_ATTENTE' | 'ASSIGNEE' | 'EN_COURS' | 'LIVREE' | 'ANNULEE';

export type PrioriteCommande = 'URGENT' | 'HAUTE' | 'NORMALE' | 'BASSE';

// ─── Points de départ GRPO — liste unique partagée entre commandes et tournées ──
export interface PointDepart {
  label: string;        // Affiché dans le select
  gouvernorat: string;  // Pour le filtre tournée
  adresse: string;      // Valeur stockée dans adresseChargement
}

export const POINTS_DEPART_GRPO: PointDepart[] = [
  { label: 'Dépôt Monastir — Zone Industrielle',        gouvernorat: 'Monastir', adresse: 'Zone Industrielle Monastir'                },
  { label: 'Dépôt Sousse — Route de Tunis',             gouvernorat: 'Sousse',   adresse: 'Zone Industrielle Sousse, Route de Tunis'   },
  { label: 'Dépôt Sfax — Zone Industrielle',            gouvernorat: 'Sfax',     adresse: 'Zone Industrielle Sfax, Route de Tunis'     },
  { label: 'Dépôt Tunis — Avenue Bourguiba',            gouvernorat: 'Tunis',    adresse: 'Avenue Habib Bourguiba, Tunis'              },
  { label: 'Dépôt Ben Arous — Zone Industrielle',       gouvernorat: 'Ben Arous',adresse: 'Zone Industrielle Ben Arous'                },
  { label: 'Dépôt Nabeul — Centre Ville',               gouvernorat: 'Nabeul',   adresse: 'Centre Ville Nabeul'                        },
  { label: 'Dépôt Bizerte — Zone Industrielle',         gouvernorat: 'Bizerte',  adresse: 'Zone Industrielle Bizerte'                  },
  { label: 'Dépôt Mahdia — Route de Sfax',              gouvernorat: 'Mahdia',   adresse: 'Route de Sfax, Mahdia'                      },
  { label: 'Dépôt Kairouan — Zone Industrielle',        gouvernorat: 'Kairouan', adresse: 'Zone Industrielle Kairouan'                 },
  { label: 'Dépôt Gabès — Zone Industrielle',           gouvernorat: 'Gabès',    adresse: 'Zone Industrielle Gabès'                    },
];

export const PRIORITE_CONFIG: Record<PrioriteCommande, {
  label: string; couleur: string; bg: string; icon: string; ordre: number
}> = {
  URGENT:  { label: 'Urgent',  couleur: '#c62828', bg: '#ffebee', icon: '🔴', ordre: 1 },
  HAUTE:   { label: 'Haute',   couleur: '#e65100', bg: '#fff3e0', icon: '🟠', ordre: 2 },
  NORMALE: { label: 'Normale', couleur: '#f57f17', bg: '#fffde7', icon: '🟡', ordre: 3 },
  BASSE:   { label: 'Basse',   couleur: '#2e7d32', bg: '#e8f5e9', icon: '🟢', ordre: 4 },
};

// ─── Coordonnées GPS précises par gouvernorat ──────────────────────────────
export const GPS_GOUVERNORATS: Record<string, [number, number]> = {
  'Tunis':       [36.8065, 10.1815],
  'Ariana':      [36.8625, 10.1956],
  'Ben Arous':   [36.7533, 10.2282],
  'Manouba':     [36.8100, 10.1000],
  'Nabeul':      [36.4561, 10.7376],
  'Zaghouan':    [36.4025, 10.1432],
  'Bizerte':     [37.2744,  9.8739],
  'Béja':        [36.7333,  9.1833],
  'Jendouba':    [36.5011,  8.7803],
  'Le Kef':      [36.1745,  8.7047],
  'Siliana':     [36.0820,  9.3706],
  'Kairouan':    [35.6781, 10.0963],
  'Kasserine':   [35.1719,  8.8307],
  'Sidi Bouzid': [35.0380,  9.4842],
  'Sousse':      [35.8245, 10.6346],
  'Monastir':    [35.7643, 10.8113],
  'Mahdia':      [35.5047, 11.0622],
  'Sfax':        [34.7406, 10.7603],
  'Gabès':       [33.8881, 10.0975],
  'Médenine':    [33.3549, 10.5055],
  'Tataouine':   [32.9211, 10.4512],
  'Gafsa':       [34.4250,  8.7842],
  'Tozeur':      [33.9191,  8.1335],
  'Kébili':      [33.7043,  8.9693],
};

// ─── Base géographique complète: Gouvernorat → Quartier → Rues avec GPS ───
export interface QuartierGPS {
  rues: string[];
  coords: [number, number]; // coordonnées GPS du quartier
}

export const TUNISIE_GEO: Record<string, Record<string, QuartierGPS>> = {
  'Tunis': {
    'Bab Bhar (Ville Nouvelle)': {
      coords: [36.8008, 10.1797],
      rues: ['Avenue Habib Bourguiba','Rue de Rome','Rue de Marseille','Avenue de Paris','Rue de Hollande','Rue de Grèce','Rue Ibn Khaldoun','Place de la Victoire','Rue Charles de Gaulle'],
    },
    'La Médina': {
      coords: [36.7985, 10.1714],
      rues: ['Rue de la Kasbah','Souk El Attarine','Rue Sidi Ben Arous','Rue Tourbet El Bey','Rue El Halfaouine','Rue Sidi Mehrez','Rue de la Zitouna'],
    },
    'Bab Souika / Halfaouine': {
      coords: [36.8042, 10.1735],
      rues: ['Place Halfaouine','Rue du Tribunal','Rue de la Zarka','Rue Sidi Mansour','Avenue Farhat Hached','Rue El Bey'],
    },
    'El Menzah': {
      coords: [36.8470, 10.1830],
      rues: ['Avenue de l\'Environnement','Rue du Stade','Cité El Menzah 1','Cité El Menzah 6','Cité El Menzah 9','Avenue Omar Ibn El Khattab'],
    },
    'El Manar': {
      coords: [36.8390, 10.1998],
      rues: ['Avenue de la Terre','Rue 8611','Cité El Manar 1','Cité El Manar 2','Avenue Tahar Ben Achour','Rue de la Recherche'],
    },
    'Les Berges du Lac': {
      coords: [36.8336, 10.2317],
      rues: ['Rue du Lac Biwa','Rue du Lac Malaren','Rue du Lac de Tunis','Avenue Kheireddine Pacha','Rue du Lac Victoria'],
    },
    'La Marsa': {
      coords: [36.8778, 10.3247],
      rues: ['Avenue Habib Bourguiba','Rue de la Plage','Cité des Oliviers','Avenue Taieb Mhiri','Rue de Carthage','Rue Ali Belhouane'],
    },
    'Ariana Ville': {
      coords: [36.8625, 10.1956],
      rues: ['Avenue de la République','Rue Mongi Slim','Cité Ennasr 1','Cité Ennasr 2','Avenue de l\'Indépendance'],
    },
    'Cité Ennasr': {
      coords: [36.8697, 10.1893],
      rues: ['Cité Ennasr 1','Cité Ennasr 2','Avenue Tahar Sfar','Rue des Pins','Rue des Eucalyptus'],
    },
    'Ettadhamen': {
      coords: [36.8428, 10.1356],
      rues: ['Cité Ettadhamen','Avenue de la Liberté','Souk Populaire','Rue des Roses'],
    },
  },
  'Monastir': {
    'Cité Omrane': {
      coords: [35.7710, 10.8011],
      rues: ['Rue Ibn Sina','Rue Ibn Rochd','Rue de l\'Indépendance','Avenue Habib Thameur','Rue Béchir Sfar','Rue Avicenne','Passage Ibn Khaldoun'],
    },
    'Cité Riadh': {
      coords: [35.7689, 10.7987],
      rues: ['Avenue Habib Bourguiba','Rue des Roses','Rue des Jasmins','Rue des Tulipes','Avenue Mongi Slim','Allée des Orangers'],
    },
    'Cité Fattouma Bourguiba': {
      coords: [35.7652, 10.8055],
      rues: ['Rue 14 Janvier','Rue des Palmiers','Cité Fattouma Bourguiba 1','Cité Fattouma Bourguiba 2','Avenue du Millénaire'],
    },
    'Médina de Monastir': {
      coords: [35.7673, 10.8182],
      rues: ['Rue de l\'Indépendance','Skifa El Khol','Rue Bourguiba','Place du 3 Août 1903','Rue des Armes'],
    },
    'Quartier Corniche': {
      coords: [35.7722, 10.8263],
      rues: ['Avenue de la Corniche','Rue du Port','Route Touristique','Rue de la Plage','Promenade du Bord de Mer'],
    },
    'Bembla': {
      coords: [35.6869, 10.8753], // ← CORRIGÉ OSM (était 35.6844,10.8968 = en mer)
      rues: ['Route de Bembla','Rue de l\'École','Rue Principale','Cité El Wafa','Impasse des Figuiers'],
    },
    'Ksar Hellal': {
      coords: [35.6432, 10.8917],
      rues: ['Avenue Habib Bourguiba','Rue du Textile','Cité des Ouvriers','Zone Industrielle','Rue de la Fabrique'],
    },
    'Moknine': {
      coords: [35.6281, 10.9003],
      rues: ['Avenue de la République','Rue de l\'Artisanat','Souk de Moknine','Rue Ibn Khaldoun','Rue des Potiers'],
    },
    'Jemmal': {
      coords: [35.6200, 10.7681],
      rues: ['Avenue Farhat Hached','Rue Hedi Chaker','Zone Commerciale','Cité Nouvelle','Marché Municipal'],
    },
    'Téboulba': {
      coords: [35.6608, 10.8722],
      rues: ['Port de Téboulba','Rue des Pêcheurs','Avenue Principale','Cité El Bahri','Quartier du Port'],
    },
    'Sayada': {
      coords: [35.7164, 10.7567],
      rues: ['Front de Mer','Rue des Pêcheurs','Cité Touristique','Route de Sayada','Avenue de la Mer'],
    },
    'Ouerdanine': {
      coords: [35.7069, 10.6945], // ← CORRIGÉ (ancienne valeur : 35.6967, 10.7250)
      rues: ['Route d\'Ouerdanine','Rue Centrale','Avenue de la Liberté','Cité Principale'],
    },
  },
  'Sousse': {
    'Sousse Médina': {
      coords: [35.8280, 10.6360],
      rues: ['Rue de la Kasbah','Place Farhat Hached','Souk de Sousse','Rue de la République','Boulevard du 7 Novembre'],
    },
    'Khezama': {
      coords: [35.8106, 10.5933],
      rues: ['Cité Khezama Est','Cité Khezama Ouest','Rue des Orangers','Avenue du Stade','Rue des Hibiscus'],
    },
    'Sahloul': {
      coords: [35.8472, 10.5811],
      rues: ['Cité Sahloul 1','Cité Sahloul 2','Cité Sahloul 3','Cité Sahloul 4','Avenue de l\'Hôpital','Rue Ibn Nafis'],
    },
    'Hammam Sousse': {
      coords: [35.8614, 10.5956],
      rues: ['Cité des Fleurs','Route Touristique','Rue de la Mer','Résidence Yasmine','Boulevard Côtier'],
    },
    'Akouda': {
      coords: [35.8839, 10.5753],
      rues: ['Cité Akouda','Avenue Principale','Front de Mer','Rue du Stade','Cité Olympique'],
    },
    'Msaken': {
      coords: [35.7306, 10.5794],
      rues: ['Avenue Habib Bourguiba','Zone d\'Artisanat','Marché de Msaken','Rue de l\'Olivier','Cité Nouvelle'],
    },
    'Kalaa Kebira': {
      coords: [35.8636, 10.5358],
      rues: ['Avenue Habib Bourguiba','Zone Industrielle','Cité Nouvelle','Rue du Marché'],
    },
  },
  'Sfax': {
    'Sfax Ville': {
      coords: [34.7406, 10.7603],
      rues: ['Avenue Habib Bourguiba','Rue Mongi Slim','Rue de la République','Place de la République','Avenue Ali Belhouane'],
    },
    'Sakiet Ezzit': {
      coords: [34.7528, 10.7189],
      rues: ['Zone Industrielle Sakiet Ezzit','Rue de l\'Industrie','Cité Ennasr','Avenue des Entrepreneurs'],
    },
    'Thyna': {
      coords: [34.7111, 10.7406],
      rues: ['Cité Thyna','Route Nationale','Zone Industrielle Sud','Rue des Artisans'],
    },
    'El Ain': {
      coords: [34.7728, 10.7836],
      rues: ['Cité El Ain','Avenue Principale','Rue de la Fontaine'],
    },
    'Sfax Sud': {
      coords: [34.7150, 10.7750],
      rues: ['Route de Gabès','Zone Commerciale','Cité Populaire','Avenue du Port'],
    },
  },
  'Nabeul': {
    'Nabeul Ville': {
      coords: [36.4561, 10.7376],
      rues: ['Avenue Habib Bourguiba','Rue des Potiers','Marché de Nabeul','Place du 7 Novembre','Rue des Artisans'],
    },
    'Hammamet': {
      coords: [36.4000, 10.6167],
      rues: ['Zone Touristique Hammamet','Avenue de la Liberté','Médina de Hammamet','Plage de Hammamet','Rue de la Mer'],
    },
    'Kelibia': {
      coords: [36.8472, 11.1044],
      rues: ['Port de Kelibia','Rue de la Citadelle','Cité des Pêcheurs','Avenue Principale'],
    },
    'Grombalia': {
      coords: [36.6033, 10.5039],
      rues: ['Marché de Grombalia','Zone Agricole','Avenue de la Vigne','Rue des Vignerons'],
    },
    'Soliman': {
      coords: [36.6989, 10.4900],
      rues: ['Zone Industrielle Soliman','Cité Nouvelle','Avenue Principale','Rue des Usines'],
    },
  },
  'Bizerte': {
    'Bizerte Ville': {
      coords: [37.2744, 9.8739],
      rues: ['Avenue Habib Bourguiba','Port de Bizerte','Place des Martyrs','Rue de la République','Boulevard du Bord de Mer'],
    },
    'Zarzouna': {
      coords: [37.2556, 9.8481],
      rues: ['Zone Industrielle','Route de Carthage','Cité Populaire','Rue des Usines'],
    },
    'Menzel Bourguiba': {
      coords: [37.1553, 9.7906],
      rues: ['Avenue Principale','Zone Industrielle','Cité Ouvrière','Rue de l\'Arsenal'],
    },
    'Mateur': {
      coords: [37.0411, 9.6633],
      rues: ['Route de Mateur','Marché de Mateur','Cité Agricole','Avenue de la Liberté'],
    },
  },
  'Kairouan': {
    'Kairouan Ville': {
      coords: [35.6781, 10.0963],
      rues: ['Avenue Habib Bourguiba','Médina de Kairouan','Souk El Blaghja','Rue de la Grande Mosquée','Rue Erriadh'],
    },
    'Sbikha': {
      coords: [35.9114, 9.9469],
      rues: ['Route Nationale','Cité Principale','Rue du Marché'],
    },
    'Haffouz': {
      coords: [35.6372, 9.6681],
      rues: ['Route de Haffouz','Zone Agricole','Cité Nouvelle'],
    },
  },
  'Gabès': {
    'Gabès Ville': {
      coords: [33.8881, 10.0975],
      rues: ['Avenue Habib Bourguiba','Zone Industrielle','Oasis de Gabès','Rue des Palmiers','Avenue de la Liberté'],
    },
    'Ghannouch': {
      coords: [33.9389, 10.0494],
      rues: ['Zone Industrielle','Zone Chimique','Port de Ghannouch','Rue des Industries'],
    },
    'El Hamma': {
      coords: [33.8872, 9.7989],
      rues: ['Sources Thermales','Zone Oasienne','Avenue Principale'],
    },
  },
  'Médenine': {
    'Médenine Ville': {
      coords: [33.3549, 10.5055],
      rues: ['Avenue Habib Bourguiba','Zone Centrale','Ghorfas de Médenine','Rue des Greniers'],
    },
    'Djerba - Houmt Souk': {
      coords: [33.8753, 10.8572],
      rues: ['Marché de Houmt Souk','Port de Djerba','Zone Touristique','Rue du Souk','Avenue Abou Ibrahim'],
    },
    'Djerba - Midoun': {
      coords: [33.8139, 10.9939],
      rues: ['Village de Midoun','Marché de Midoun','Zone Touristique','Route de la Plage'],
    },
    'Zarzis': {
      coords: [33.5056, 11.1111],
      rues: ['Port de Zarzis','Zone Touristique','Plage de Zarzis','Avenue de la Mer'],
    },
  },
  'Gafsa': {
    'Gafsa Ville': {
      coords: [34.4250, 8.7842],
      rues: ['Avenue Habib Bourguiba','Zone Minière','Piscines Romaines','Rue des Mines'],
    },
    'Metlaoui': {
      coords: [34.3267, 8.4033],
      rues: ['Mines de Phosphate','Gorges de Selja','Route Nationale','Cité Minière'],
    },
  },
  'Tozeur': {
    'Tozeur Ville': {
      coords: [33.9191, 8.1335],
      rues: ['Avenue Habib Bourguiba','Zone Touristique','Oasis de Tozeur','Rue des Dattiers'],
    },
    'Nefta': {
      coords: [33.8706, 7.8775],
      rues: ['Oasis de Nefta','Zone Touristique','La Corbeille','Rue des Palmiers'],
    },
  },
  'Kébili': {
    'Kébili Ville': {
      coords: [33.7043, 8.9693],
      rues: ['Avenue Habib Bourguiba','Oasis de Kébili','Rue Principale'],
    },
    'Douz': {
      coords: [33.4567, 9.0233],
      rues: ['Porte du Désert','Zone Touristique','Grand Erg Oriental','Avenue des Dunes'],
    },
  },
  'Mahdia': {
    'Mahdia Ville': {
      coords: [35.5047, 11.0622],
      rues: ['Cap Afrique','Médina de Mahdia','Port de Mahdia','Avenue Habib Bourguiba','Rue des Pêcheurs'],
    },
    'El Jem': {
      coords: [35.2961, 10.7153],
      rues: ['Amphithéâtre d\'El Jem','Zone Touristique','Avenue Principale','Rue du Colisée'],
    },
    'Chebba': {
      coords: [35.2400, 11.1133],
      rues: ['Port de Chebba','Zone des Pêcheurs','Rue du Port'],
    },
  },
  'Ben Arous': {
    'Ben Arous Ville': {
      coords: [36.7533, 10.2282],
      rues: ['Avenue Habib Bourguiba','Route de Grombalia','Place Centrale','Rue des Jasmins'],
    },
    'Radès': {
      coords: [36.7700, 10.2778],
      rues: ['Port de Radès','Zone Industrielle','Cité de la Plage','Boulevard du Port'],
    },
    'El Mourouj': {
      coords: [36.7228, 10.1817],
      rues: ['Cité El Mourouj 1','Cité El Mourouj 2','Cité El Mourouj 3','Avenue Principale'],
    },
    'Hammam Lif': {
      coords: [36.7267, 10.3378],
      rues: ['Front de Mer','Avenue de la Corniche','Cité Thermale','Rue du Bord de Mer'],
    },
  },
  'Manouba': {
    'Manouba Ville': {
      coords: [36.8100, 10.1000],
      rues: ['Avenue Habib Bourguiba','Route de Tunis','Place de la Municipalité'],
    },
    'Den Den': {
      coords: [36.8292, 10.1525],
      rues: ['Zone Industrielle Den Den','Cité Populaire','Route de Tunis','Rue de l\'Industrie'],
    },
    'Oued Ellil': {
      coords: [36.8381, 10.0544],
      rues: ['Zone Industrielle','Cité Résidentielle','Route Nationale'],
    },
  },
  'Béja': {
    'Béja Ville': {
      coords: [36.7333, 9.1833],
      rues: ['Avenue Habib Bourguiba','Place du 7 Novembre','Zone Céréalière','Rue de la Médina'],
    },
    'Testour': {
      coords: [36.5539, 9.4500],
      rues: ['Site Archéologique','Cité Historique','Festival Malouf','Rue Principale'],
    },
  },
  'Jendouba': {
    'Jendouba Ville': {
      coords: [36.5011, 8.7803],
      rues: ['Avenue Habib Bourguiba','Zone Agricole','Place de la République'],
    },
    'Tabarka': {
      coords: [36.9544, 8.7589],
      rues: ['Port de Tabarka','Zone Touristique','La Galite','Rue du Port','Avenue du Corail'],
    },
    'Aïn Draham': {
      coords: [36.7819, 8.6878],
      rues: ['Zone Montagneuse','Forêt d\'Aïn Draham','Station Touristique','Route Forestière'],
    },
  },
  'Le Kef': {
    'Le Kef Ville': {
      coords: [36.1745, 8.7047],
      rues: ['Citadelle du Kef','Avenue Habib Bourguiba','Zone Historique','Rue de la Kasbah'],
    },
  },
  'Siliana': {
    'Siliana Ville': {
      coords: [36.0820, 9.3706],
      rues: ['Avenue Habib Bourguiba','Zone Centrale','Marché de Siliana'],
    },
    'Maktar': {
      coords: [35.8589, 9.2044],
      rues: ['Site Archéologique de Mactaris','Zone Touristique','Route Principale'],
    },
  },
  'Zaghouan': {
    'Zaghouan Ville': {
      coords: [36.4025, 10.1432],
      rues: ['Avenue Habib Bourguiba','Temple des Eaux','Cité Principale','Rue de la Source'],
    },
    'El Fahs': {
      coords: [36.3744, 10.0033],
      rues: ['Marché El Fahs','Zone Agricole','Route Nationale'],
    },
  },
  'Kasserine': {
    'Kasserine Ville': {
      coords: [35.1719, 8.8307],
      rues: ['Avenue Habib Bourguiba','Zone Industrielle','Place de la République'],
    },
    'Sbeitla': {
      coords: [35.2361, 9.1161],
      rues: ['Site de Sbeitla (Sufetula)','Zone Agricole','Route Nationale','Avenue Principale'],
    },
  },
  'Sidi Bouzid': {
    'Sidi Bouzid Ville': {
      coords: [35.0380, 9.4842],
      rues: ['Avenue Habib Bourguiba','Zone Commerciale','Place Centrale'],
    },
    'Regueb': {
      coords: [34.8236, 9.7956],
      rues: ['Zone Agricole','Route de Regueb','Cité Principale'],
    },
  },
  'Tataouine': {
    'Tataouine Ville': {
      coords: [32.9211, 10.4512],
      rues: ['Avenue Habib Bourguiba','Zone Centrale','Rue des Ksour'],
    },
    'Ghomrassen': {
      coords: [33.0594, 10.4519],
      rues: ['Ksour de Ghomrassen','Zone Rurale','Piste Principale'],
    },
  },
};

// ─── Interfaces ────────────────────────────────────────────────────────────
export interface Client {
  id: number;
  raisonSociale: string;
  matriculeFiscale?: string;
  responsableEntreprise?: string;
  email: string;
  telephone?: string;
  adresseComplete?: string;
  activite?: string;
}

export interface Commande {
  id: number;
  numeroCommande: string;
  clientId: number;
  clientNom?: string;
  clientEmail?: string;
  client?: Client;
  dateCommande: string;
  dateLivraisonPrevue: string;
  adresseLivraison: string;
  villeLivraison: string;
  codePostalLivraison: string;
  paysLivraison?: string;
  contactLivraison: string;
  telephoneContactLivraison: string;
  adresseChargement?: string;
  dateSouhaitee?: string;
  distance?: number;
  coutEstime?: number;
  descriptionMarchandise?: string;
  poids?: number;
  volume?: number;
  remarques?: string;
  statut: StatutCommande;
  priorite?: PrioriteCommande;
  // Nouveaux champs géographiques
  gouvernoratLivraison?: string;
  quartierLivraison?: string;
  rueLivraison?: string;
  latitudeLivraison?: number;
  longitudeLivraison?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CommandeFormData {
  clientId: number;
  adresseLivraison: string;
  villeLivraison: string;
  gouvernoratLivraison?: string;
  quartierLivraison?: string;
  rueLivraison?: string;
  latitudeLivraison?: number;
  longitudeLivraison?: number;
  codePostalLivraison: string;
  paysLivraison?: string;
  contactLivraison: string;
  telephoneContactLivraison: string;
  dateLivraisonPrevue: string;
  descriptionMarchandise?: string;
  poids?: number;
  volume?: number;
  remarques?: string;
  priorite?: PrioriteCommande;
}

export interface CommandePage {
  content: Commande[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CommandeStats {
  total: number;
  enAttente: number;
  assignee: number;
  enCours: number;
  livree: number;
  annulee: number;
}

export const STATUT_CONFIG: Record<StatutCommande, {
  label: string; icon: string; bg: string; color: string; border: string;
}> = {
  EN_ATTENTE: { label: 'En attente', icon: 'schedule',       bg: '#EBF5FB', color: '#1B4F72', border: '#bee3f8' },
  ASSIGNEE:   { label: 'Assignée',   icon: 'assignment_ind', bg: '#FEF9E7', color: '#D68910', border: '#f5cba7' },
  EN_COURS:   { label: 'En cours',   icon: 'local_shipping', bg: '#FEF3E2', color: '#E67E22', border: '#f5b461' },
  LIVREE:     { label: 'Livrée',     icon: 'check_circle',   bg: '#E8F8F5', color: '#1E8449', border: '#a9dfbf' },
  ANNULEE:    { label: 'Annulée',    icon: 'cancel',         bg: '#FADBD8', color: '#CB4335', border: '#f1948a' },
};

// ─── Codes postaux par gouvernorat ─────────────────────────────────────────
export const CODES_POSTAUX: Record<string, string> = {
  'Tunis': '1000', 'Ariana': '2080', 'Ben Arous': '2013', 'Manouba': '2010',
  'Nabeul': '8000', 'Zaghouan': '1100', 'Bizerte': '7000', 'Béja': '9000',
  'Jendouba': '8100', 'Le Kef': '7100', 'Siliana': '6100', 'Kairouan': '3100',
  'Kasserine': '1200', 'Sidi Bouzid': '9100', 'Sousse': '4000', 'Monastir': '5000',
  'Mahdia': '5100', 'Sfax': '3000', 'Gabès': '6000', 'Médenine': '4100',
  'Tataouine': '3200', 'Gafsa': '2100', 'Tozeur': '2200', 'Kébili': '4200',
};

export const VILLES_TUNISIE: string[] = Object.keys(GPS_GOUVERNORATS);