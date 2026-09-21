import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { TourneeService } from '../../services/tournee.service';
import { OptimisationService, OptimisationTourneeResult } from '../../services/optimisation.service';
import { Chauffeur, Vehicule, CommandeDisponible } from '../../models/tournee.model';
import * as L from 'leaflet';

// ─── Base de données géographique tunisienne complète ─────────────────────────
export const TUNISIE_ZONES: Record<string, Record<string, string[]>> = {
  'Tunis': {
    'Bab Bhar (Ville Nouvelle)': ['Avenue Habib Bourguiba','Rue de Rome','Rue de Marseille','Avenue de Paris','Rue de Hollande','Rue de Grèce','Rue Ibn Khaldoun','Place de la Victoire'],
    'La Médina': ['Rue de la Kasbah','Souk El Attarine','Rue Sidi Ben Arous','Rue Tourbet El Bey','Rue El Halfaouine','Rue Sidi Mehrez'],
    'Bab Souika / Halfaouine': ['Place Halfaouine','Rue du Tribunal','Rue de la Zarka','Rue Sidi Mansour','Avenue Farhat Hached'],
    'El Menzah': ['Avenue de l\'Environnement','Rue du Stade','Cité El Menzah 1','Cité El Menzah 6','Cité El Menzah 9'],
    'El Manar': ['Avenue de la Terre','Rue 8611','Cité El Manar 1','Cité El Manar 2','Avenue Tahar Ben Achour'],
    'Les Berges du Lac': ['Rue du Lac Biwa','Rue du Lac Malaren','Rue du Lac de Tunis','Avenue Kheireddine Pacha'],
    'La Marsa': ['Avenue Habib Bourguiba','Rue de la Plage','Cité des Oliviers','Avenue Taieb Mhiri','Rue de Carthage'],
    'Sidi Bou Saïd': ['Rue Habib Thameur','Route Touristique Sidi Bou Said','Rue 2 Mars 1934'],
    'Carthage': ['Avenue de Carthage','Cité des Princes','Rue Hannibal','Route Carthage Byrsa'],
    'Ariana': ['Avenue de la République','Rue Mongi Slim','Cité Ennasr 1','Cité Ennasr 2','Cité Ghazela'],
    'Ben Arous': ['Avenue Habib Bourguiba','Route de Grombalia','Cité Nouvelle','Rue des Jasmins'],
    'La Soukra': ['Route de Raoued','Cité Olympique','Avenue du Stade','Rue de la Forêt'],
  },
  'Monastir': {
    'Cité Omrane': ['Rue Ibn Sina','Rue Ibn Rochd','Rue de l\'Indépendance','Avenue Habib Thameur','Rue Béchir Sfar'],
    'Cité Riadh': ['Avenue Habib Bourguiba','Rue des Roses','Rue des Jasmins','Rue des Tulipes','Avenue Mongi Slim'],
    'Cité Fattouma Bourguiba': ['Rue 14 Janvier','Rue des Palmiers','Cité Fattouma Bourguiba 1','Cité Fattouma Bourguiba 2'],
    'Médina de Monastir': ['Rue de l\'Independence','Skifa El Khol','Rue Bourguiba','Place du 3 Août'],
    'Quartier Corniche': ['Avenue de la Corniche','Rue du Port','Route Touristique','Rue de la Plage'],
    'Bembla': ['Route de Bembla','Rue de l\'École','Rue Principale','Cité El Wafa'],
    'Ouerdanine': ['Route d\'Ouerdanine','Rue Centrale','Avenue de la Liberté'],
    'Sahline': ['Route de Sahline','Cité Sportive','Rue de la Coopérative'],
    'Ksar Hellal': ['Avenue Habib Bourguiba','Rue du Textile','Cité des Ouvriers','Zone Industrielle'],
    'Moknine': ['Avenue de la République','Rue de l\'Artisanat','Souk de Moknine','Rue Ibn Khaldoun'],
    'Bekalta': ['Route Nationale 1','Cité El Amel','Rue de l\'Agriculture'],
    'Téboulba': ['Port de Téboulba','Rue des Pêcheurs','Avenue Principale','Cité El Bahri'],
    'Jemmal': ['Avenue Farhat Hached','Rue Hedi Chaker','Zone Commerciale','Cité Nouvelle'],
    'Zeramdine': ['Route de Zeramdine','Cité Jeunes','Rue des Agriculteurs'],
    'Beni Hassen': ['Route de Beni Hassen','Cité Populaire','Rue Principale'],
    'Sayada': ['Front de Mer','Rue des Pêcheurs','Cité Touristique','Route de Sayada'],
    'Lamta': ['Port de Lamta','Rue du Port','Avenue Principale'],
    'Sidi Alouane': ['Route Nationale','Cité Sidi Alouane','Rue des Agriculteurs'],
    'El Masdour': ['Route d\'El Masdour','Cité Nouvelle','Zone Rurale'],
    'Touza': ['Route de Touza','Cité Résidentielle'],
    'Ksibet el Mediouni': ['Avenue Principale','Cité Nouvelle','Route Nationale'],
  },
  'Sfax': {
    'Sfax Ville': ['Avenue Habib Bourguiba','Rue Mongi Slim','Rue de la République','Place de la République'],
    'Sakiet Ezzit': ['Zone Industrielle Sakiet Ezzit','Rue de l\'Industrie','Cité Ennasr'],
    'Sakiet Eddaïer': ['Route de Gabès','Cité Populaire','Zone Commerciale'],
    'Thyna': ['Cité Thyna','Route Nationale','Zone Industrielle Sud'],
    'Agareb': ['Route d\'Agareb','Cité Nouvelle','Rue Centrale'],
    'Bir Ali Ben Khalifa': ['Avenue Principale','Cité Nouvelle'],
    'El Hencha': ['Route El Hencha','Rue des Oliviers'],
    'Graïba': ['Zone Olivière','Route Nationale'],
    'Jebiniana': ['Route de Jebiniana','Cité Agricole'],
    'Kerkennah': ['Île de Kerkennah','Rue des Pêcheurs','Front de Mer'],
    'Mahras': ['Route de Mahras','Cité Populaire'],
    'Menzel Chaker': ['Avenue Principale','Zone Agricole'],
    'Skhira': ['Port de Skhira','Zone Industrielle','Cité Ouvrière'],
    'Taparura': ['Front de Mer Taparura','Avenue de la Corniche'],
  },
  'Sousse': {
    'Sousse Médina': ['Rue de la Kasbah','Place Farhat Hached','Souk de Sousse','Rue de la République'],
    'Khezama': ['Cité Khezama Est','Cité Khezama Ouest','Rue des Orangers','Avenue du Stade'],
    'Sahloul': ['Cité Sahloul 1','Cité Sahloul 2','Cité Sahloul 3','Cité Sahloul 4','Avenue de l\'Hôpital'],
    'Hammam Sousse': ['Cité des Fleurs','Route Touristique','Rue de la Mer'],
    'Akouda': ['Cité Akouda','Avenue Principale','Front de Mer'],
    'Kalaa Kebira': ['Avenue Habib Bourguiba','Zone Industrielle','Cité Nouvelle'],
    'Sidi Bou Ali': ['Route de Sidi Bou Ali','Cité Rurale'],
    'Hergla': ['Port de Hergla','Rue des Pêcheurs'],
    'Enfidha': ['Zone Industrielle Enfidha','Aéroport d\'Enfidha','Cité Nouvelle'],
    'Bouficha': ['Route Nationale','Cité Populaire','Marché de Bouficha'],
    'Kondar': ['Route de Kondar','Cité Agricole'],
    'Msaken': ['Avenue Habib Bourguiba','Zone d\'Artisanat','Marché de Msaken'],
    'Sidi El Hani': ['Route de Sidi El Hani','Cité Agricole'],
    'Kalaa Sghira': ['Cité Kalaa Sghira','Route Nationale'],
  },
  'Nabeul': {
    'Nabeul Ville': ['Avenue Habib Bourguiba','Rue des Potiers','Marché de Nabeul','Place du 7 Novembre'],
    'Hammamet': ['Zone Touristique Hammamet','Avenue de la Liberté','Médina de Hammamet','Plage de Hammamet'],
    'Kelibia': ['Port de Kelibia','Rue de la Citadelle','Cité des Pêcheurs'],
    'Korba': ['Plage de Korba','Zone Touristique','Rue de la Mer'],
    'Menzel Temime': ['Avenue Principale','Zone Agricole','Cité Ouvrière'],
    'Dar Chaabane El Fehri': ['Rue des Artisans','Cité Populaire'],
    'Beni Khiar': ['Zone Horticole','Route Nationale'],
    'Takelsa': ['Cité Rurale','Route de Takelsa'],
    'El Haouaria': ['Cap Bon','Route Touristique','Village de Pêcheurs'],
    'Grombalia': ['Marché de Grombalia','Zone Agricole','Avenue de la Vigne'],
    'Bou Argoub': ['Cité Nouvelle','Route Nationale'],
    'Maamoura': ['Plage de Maamoura','Zone Touristique'],
    'Soliman': ['Zone Industrielle Soliman','Cité Nouvelle','Avenue Principale'],
    'Korbous': ['Thermes de Korbous','Route Touristique'],
    'Menzel Bouzelfa': ['Cité Agricole','Route Nationale'],
    'El Mida': ['Cité Rurale','Zone Agricole'],
  },
  'Bizerte': {
    'Bizerte Ville': ['Avenue Habib Bourguiba','Port de Bizerte','Place des Martyrs','Rue de la République'],
    'Zarzouna': ['Zone Industrielle','Route de Carthage','Cité Populaire'],
    'Menzel Bourguiba': ['Avenue Principale','Zone Industrielle','Cité Ouvrière'],
    'Mateur': ['Route de Mateur','Marché de Mateur','Cité Agricole'],
    'Tinja': ['Lac de Bizerte','Cité des Pêcheurs'],
    'Utique': ['Site Archéologique d\'Utique','Route Nationale'],
    'Ras Jebel': ['Route Côtière','Zone Touristique'],
    'El Alia': ['Cité Nouvelle','Route Nationale'],
    'Menzel Djemil': ['Rue de la Mer','Cité Côtière'],
    'Ghezala': ['Cité Rurale','Route de Montagne'],
    'Sejenane': ['Forêt de Sejenane','Cité Principale'],
    'Joumine': ['Zone Agricole','Route Nationale'],
  },
  'Ariana': {
    'Ariana Ville': ['Avenue de la République','Rue Mongi Slim','Place de la Municipalité'],
    'Cité Ennasr': ['Cité Ennasr 1','Cité Ennasr 2','Avenue Tahar Sfar'],
    'Ghazela': ['Technopole de Ghazela','Cité Résidentielle','Avenue des Technologies'],
    'La Soukra': ['Route de Raoued','Cité Olympique'],
    'Raoued': ['Zone Industrielle Raoued','Rue de l\'Aéroport'],
    'Kalaat el Andalous': ['Cité Nouvelle','Zone Agricole'],
    'Borj Louzir': ['Cité Populaire','Rue Principale'],
    'Mnihla': ['Cité Mnihla','Avenue de Tunis'],
    'Ettadhamen': ['Cité Ettadhamen','Avenue de la Liberté','Souk Populaire'],
  },
  'Ben Arous': {
    'Ben Arous Ville': ['Avenue Habib Bourguiba','Route de Grombalia','Place Centrale'],
    'Rades': ['Port de Radès','Zone Industrielle','Cité de la Plage'],
    'Mégrine': ['Route de Sfax','Zone Commerciale','Cité Nouvelle'],
    'Mohamedia': ['Cité Mohamedia','Route Nationale','Zone Industrielle'],
    'Bou Mhel el Bassatine': ['Cité Populaire','Vergers de Tunis'],
    'Hammam Lif': ['Front de Mer','Avenue de la Corniche','Cité Thermale'],
    'Hammam Chott': ['Route Côtière','Cité Résidentielle'],
    'Boumhel': ['Cité Agricole','Route des Vergers'],
    'Fouchana': ['Route de Zaghouan','Zone Industrielle'],
    'Mornag': ['Zone Agricole','Cave de Mornag','Route de Mornag'],
    'El Mourouj': ['Cité El Mourouj 1','Cité El Mourouj 2','Cité El Mourouj 3'],
    'Hammam el Ghezaz': ['Front de Mer','Cité Balnéaire'],
    'Chorbane': ['Route Nationale','Cité Rurale'],
  },
  'Manouba': {
    'Manouba Ville': ['Avenue Habib Bourguiba','Route de Tunis','Place de la Municipalité'],
    'Den Den': ['Zone Industrielle Den Den','Cité Populaire','Route de Tunis'],
    'Douar Hicher': ['Cité Populaire','Avenue Principale'],
    'Oued Ellil': ['Zone Industrielle','Cité Résidentielle'],
    'Tebourba': ['Avenue de l\'Indépendance','Marché de Tebourba','Route de Tunis'],
    'Borj El Amri': ['Aéroport de Tunis-Carthage','Zone Industrielle','Cité Ouvrière'],
    'El Battan': ['Cité Rurale','Route de Tunis'],
    'Jedaida': ['Zone Agricole','Route Nationale'],
    'Mornaguia': ['Zone d\'Activités','Cité Populaire'],
  },
  'Kairouan': {
    'Kairouan Ville': ['Avenue Habib Bourguiba','Médina de Kairouan','Souk El Blaghja','Rue de la Grande Mosquée'],
    'Sbikha': ['Route Nationale','Cité Principale'],
    'Haffouz': ['Route de Haffouz','Zone Agricole'],
    'El Alaa': ['Cité El Alaa','Route Nationale'],
    'Echebbi': ['Zone Agricole','Route de Kairouan'],
    'Oueslatia': ['Cité Principale','Zone Rurale'],
    'Menzel Mhiri': ['Zone Agricole','Route Nationale'],
    'El Ain': ['Cité Rurale','Source d\'El Ain'],
    'Chebika': ['Oasis de Chebika','Route Touristique'],
    'Nasrallah': ['Zone Agricole','Route de Nasrallah'],
    'Hajeb El Ayoun': ['Cité Principale','Zone Agricole'],
    'Bouhajla': ['Zone Agricole','Route Nationale'],
  },
  'Kasserine': {
    'Kasserine Ville': ['Avenue Habib Bourguiba','Zone Industrielle','Place de la République'],
    'Sbeitla': ['Site de Sbeitla (Sufetula)','Zone Agricole','Route Nationale'],
    'Sbeïtla': ['Avenue Principale','Musée de Sbeitla','Cité Nouvelle'],
    'Thala': ['Cité Principale','Zone Agricole'],
    'Foussana': ['Zone Rurale','Route de Kasserine'],
    'Feriana': ['Zone Minière','Route Nationale'],
    'Majel Bel Abbès': ['Cité Rurale','Zone Agricole'],
    'Hassi El Ferid': ['Zone Rurale'],
    'El Ayoun': ['Zone Agricole'],
    'Jedelienne': ['Route Nationale','Zone Rurale'],
  },
  'Sidi Bouzid': {
    'Sidi Bouzid Ville': ['Avenue Habib Bourguiba','Zone Commerciale','Place Centrale'],
    'Regueb': ['Zone Agricole','Route de Regueb'],
    'Ouled Haffouz': ['Cité Rurale','Zone Agricole'],
    'El Meknassi': ['Route Nationale','Zone Agricole'],
    'Souk Jedid': ['Marché de Souk Jedid','Zone Agricole'],
    'Menzel Bouzaiene': ['Zone Rurale'],
    'Jilma': ['Zone Agricole','Route de Sidi Bouzid'],
    'Bir El Hafey': ['Champs Pétroliers','Zone Industrielle'],
  },
  'Siliana': {
    'Siliana Ville': ['Avenue Habib Bourguiba','Zone Centrale','Marché de Siliana'],
    'Le Krib': ['Zone Agricole','Route Nationale'],
    'Bou Arada': ['Zone Agricole','Cité Principale'],
    'Gaafour': ['Zone Rurale','Route Nationale'],
    'Kesra': ['Village de Montagne','Site Archéologique'],
    'Maktar': ['Site Archéologique de Mactaris','Zone Touristique'],
    'Rouhia': ['Zone Agricole','Cité Principale'],
    'Bargou': ['Village de Montagne','Zone Rurale'],
    'El Aroussa': ['Zone Rurale'],
  },
  'Zaghouan': {
    'Zaghouan Ville': ['Avenue Habib Bourguiba','Temple des Eaux','Cité Principale'],
    'Zriba': ['Village de Zriba','Zone Montagneuse'],
    'Hammamet Sud': ['Zone Touristique','Plage'],
    'Nadhour': ['Zone Agricole','Route Nationale'],
    'Bir Mcherga': ['Zone Rurale'],
    'El Fahs': ['Marché El Fahs','Zone Agricole','Route Nationale'],
    'Saouaf': ['Zone Agricole'],
  },
  'Béja': {
    'Béja Ville': ['Avenue Habib Bourguiba','Place du 7 Novembre','Zone Céréalière'],
    'Testour': ['Site Archéologique','Cité Historique','Festival Malouf'],
    'Téboursouk': ['Site de Dougga (Thugga)','Zone Agricole'],
    'Nefza': ['Forêt de Nefza','Zone Rurale'],
    'Amdoun': ['Zone Montagneuse','Village d\'Amdoun'],
    'Thibar': ['Domaine Agricole de Thibar','Route Nationale'],
    'Medjez el Bab': ['Zone Agricole','Route Nationale','Cimetière Militaire'],
    'Goubellat': ['Zone Céréalière','Route Nationale'],
  },
  'Jendouba': {
    'Jendouba Ville': ['Avenue Habib Bourguiba','Zone Agricole','Place de la République'],
    'Tabarka': ['Port de Tabarka','Zone Touristique','La Galite'],
    'Bulla Regia': ['Site Archéologique','Zone Rurale'],
    'Aïn Draham': ['Zone Montagneuse','Forêt d\'Aïn Draham','Station Touristique'],
    'Fernana': ['Zone Agricole','Route Nationale'],
    'Ghardimaou': ['Frontière Algéro-Tunisienne','Gare de Ghardimaou'],
    'Bou Salem': ['Zone Agricole','Route Nationale'],
    'Oued Mliz': ['Forêt du Nord','Zone Rurale'],
  },
  'Le Kef': {
    'Le Kef Ville': ['Citadelle du Kef','Avenue Habib Bourguiba','Zone Historique'],
    'Dahmani': ['Zone Céréalière','Route Nationale'],
    'Sers': ['Zone Agricole','Village de Sers'],
    'Tajerouine': ['Zone Agricole','Route Nationale'],
    'Kalaa Khasbah': ['Site Archéologique','Zone Rurale'],
    'El Ksour': ['Village El Ksour','Zone Agricole'],
    'Sidi Aich': ['Zone Rurale'],
    'Kalaat Senan': ['Zone Agricole','Cité Principale'],
    'Nebeur': ['Zone Agricole','Route Nationale'],
  },
  'Gabès': {
    'Gabès Ville': ['Avenue Habib Bourguiba','Zone Industrielle','Oasis de Gabès'],
    'Métouia': ['Zone Agricole','Oasis','Route Nationale'],
    'El Hamma': ['Sources Thermales','Zone Oasienne'],
    'Chenini Nahal': ['Zone Rurale'],
    'Matmata': ['Villages Troglodytes','Zone Touristique','Route de Matmata'],
    'Mareth': ['Ligne Mareth','Zone Agricole'],
    'Nouvelle Matmata': ['Cité Nouvelle','Zone Touristique'],
    'Ghannouch': ['Zone Industrielle','Zone Chimique'],
    'Oudhref': ['Zone Oasienne','Route Nationale'],
  },
  'Médenine': {
    'Médenine Ville': ['Avenue Habib Bourguiba','Zone Centrale','Ghorfas de Médenine'],
    'Djerba - Houmt Souk': ['Marché de Houmt Souk','Port de Djerba','Zone Touristique'],
    'Djerba - Midoun': ['Village de Midoun','Marché de Midoun','Zone Touristique'],
    'Djerba - Ajim': ['Bac d\'Ajim','Zone des Pêcheurs'],
    'Ben Gardane': ['Zone Commerciale Frontalière','Route de Libye'],
    'Zarzis': ['Port de Zarzis','Zone Touristique','Plage de Zarzis'],
    'Beni Khedache': ['Ksour de Beni Khedache','Zone Rurale'],
    'Sidi Makhlouf': ['Zone Rurale','Lagune'],
  },
  'Tataouine': {
    'Tataouine Ville': ['Avenue Habib Bourguiba','Zone Centrale'],
    'Ghomrassen': ['Ksour de Ghomrassen','Zone Rurale'],
    'Remada': ['Zone Frontalière','Zone Militaire'],
    'Bir Lahmar': ['Zone Rurale','Piste Saharienne'],
    'Smar': ['Zone Rurale'],
    'Dehiba': ['Poste Frontière','Zone Commerciale'],
  },
  'Tozeur': {
    'Tozeur Ville': ['Avenue Habib Bourguiba','Zone Touristique','Oasis de Tozeur'],
    'Nefta': ['Oasis de Nefta','Zone Touristique','La Corbeille'],
    'Degache': ['Oasis de Degache','Zone Agricole'],
    'Hazoua': ['Poste Frontière Algérien'],
    'Tamerza': ['Canyon de Tamerza','Village Troglodyte'],
    'Midès': ['Village de Midès','Canyon'],
    'Chebika': ['Oasis de Chebika','Cascade'],
  },
  'Kébili': {
    'Kébili Ville': ['Avenue Habib Bourguiba','Oasis de Kébili'],
    'Douz': ['Porte du Désert','Zone Touristique','Grand Erg Oriental'],
    'Souk Lahad': ['Marché de Souk Lahad','Zone Oasienne'],
    'El Faouar': ['Zone Oasienne'],
    'Jemna': ['Oasis de Jemna'],
    'Rejim Maatoug': ['Zone Saharienne'],
  },
  'Gafsa': {
    'Gafsa Ville': ['Avenue Habib Bourguiba','Zone Minière','Piscines Romaines'],
    'Metlaoui': ['Mines de Phosphate','Gorges de Selja'],
    'El Guettar': ['Zone Agricole','Oasis'],
    'Redeyef': ['Zone Minière','Cité Ouvrière'],
    'Moulares': ['Zone Minière','Cité Ouvrière'],
    'Sned': ['Zone Agricole'],
    'Om El Araies': ['Zone Agricole'],
  },
  'Mahdia': {
    'Mahdia Ville': ['Cap Afrique','Médina de Mahdia','Port de Mahdia','Avenue Habib Bourguiba'],
    'Ksour Essef': ['Zone Touristique','Plage','Route Nationale'],
    'El Jem': ['Amphithéâtre d\'El Jem','Zone Touristique','Avenue Principale'],
    'Chebba': ['Port de Chebba','Zone des Pêcheurs'],
    'Bou Merdes': ['Zone Agricole','Route Nationale'],
    'Ouled Chamekh': ['Zone Agricole'],
    'Sidi Alouane': ['Zone Agricole','Route Nationale'],
    'La Chebba': ['Port de Pêche','Cité des Pêcheurs'],
    'Melloulèche': ['Zone Agricole','Route Nationale'],
    'Essouassi': ['Zone Agricole','Cité Principale'],
  },
};

// Coordonnées GPS par gouvernorat (centre)
export const GOUVERNORAT_COORDS: Record<string, [number, number]> = {
  'Tunis': [36.8065, 10.1815],
  'Ariana': [36.8625, 10.1956],
  'Ben Arous': [36.7533, 10.2282],
  'Manouba': [36.8100, 10.1000],
  'Nabeul': [36.4561, 10.7376],
  'Zaghouan': [36.4025, 10.1432],
  'Bizerte': [37.2744, 9.8739],
  'Béja': [36.7333, 9.1833],
  'Jendouba': [36.5011, 8.7803],
  'Le Kef': [36.1745, 8.7047],
  'Siliana': [36.0820, 9.3706],
  'Kairouan': [35.6781, 10.0963],
  'Kasserine': [35.1719, 8.8307],
  'Sidi Bouzid': [35.0380, 9.4842],
  'Sousse': [35.8245, 10.6346],
  'Monastir': [35.7643, 10.8113],
  'Mahdia': [35.5047, 11.0622],
  'Sfax': [34.7406, 10.7603],
  'Gabès': [33.8881, 10.0975],
  'Médenine': [33.3549, 10.5055],
  'Tataouine': [32.9211, 10.4512],
  'Gafsa': [34.4250, 8.7842],
  'Tozeur': [33.9191, 8.1335],
  'Kébili': [33.7043, 8.9693],
};

// Base de coordonnées étendue : villes, quartiers, zones tunisiennes
const VILLES_COORDS_EXTENDED: Record<string, [number, number]> = {
  // ── Tunis & banlieues ──
  'tunis': [36.8065, 10.1815],
  'la marsa': [36.8778, 10.3247],
  'la marsa plage': [36.8810, 10.3300],
  'carthage': [36.8531, 10.3217],
  'sidi bou said': [36.8683, 10.3411],
  'el menzah': [36.8394, 10.1739],
  'ennasr': [36.8927, 10.2069],
  'ettadhamen': [36.8433, 10.1461],
  'cite ettadhamen': [36.8433, 10.1461],
  'ariana': [36.8625, 10.1956],
  'ariana ville': [36.8640, 10.1970],
  'raoued': [36.8920, 10.1430],
  'borj louzir': [36.8460, 10.1620],
  'manouba': [36.8100, 10.0970],
  'den den': [36.8170, 10.1400],
  'ben arous': [36.7533, 10.2282],
  'hammam lif': [36.7167, 10.3333],
  'rades': [36.7700, 10.2800],
  'megrine': [36.7678, 10.2300],
  'ezzahra': [36.7461, 10.2950],
  'bardo': [36.8092, 10.1400],
  'cite el khadra': [36.8400, 10.2100],
  'montplaisir': [36.8350, 10.2000],
  'el omrane': [36.8200, 10.1600],
  'el ouardia': [36.8000, 10.1900],
  'medina tunis': [36.7982, 10.1701],
  'cite olympique': [36.8500, 10.2350],
  'lac': [36.8500, 10.2300],
  'berges du lac': [36.8500, 10.2400],
  'centre urbain nord': [36.8600, 10.2000],
  'ain zaghouan': [36.8700, 10.2100],

  // ── Monastir & alentours ──
  'monastir': [35.7643, 10.8113],
  'monastir ville': [35.7643, 10.8113],
  'monastir medina': [35.7660, 10.8290],
  'bembla': [35.6869, 10.8753],
  'bembla monastir': [35.6869, 10.8753],
  'korniche monastir': [35.7510, 10.8380],
  'quartier corniche': [35.7510, 10.8380],
  'corniche monastir': [35.7510, 10.8380],
  'cite omrane monastir': [35.7730, 10.7980],
  'cite riadh monastir': [35.7580, 10.8230],
  'cite el wafa': [35.7695, 10.8170],
  'cite ennour': [35.7540, 10.8310],
  'cite fattouma bourguiba': [35.7710, 10.8060],
  'ksar hellal': [35.6495, 10.8920],
  'moknine': [35.6328, 10.9025],
  'teboulba': [35.6320, 11.0903],
  'sahline': [35.7497, 10.7420],
  'ouardanine': [35.7069, 10.6945],
  'ouerdanine': [35.7069, 10.6945],
  'wardanine': [35.7069, 10.6945],
  'ouerdanin': [35.7069, 10.6945],
  'ksibet el mediouni': [35.6633, 10.8487],
  'zeramdine': [35.5924, 10.7269],
  'jammel': [35.6251, 10.7599],
  'beni hassen': [35.5679, 10.7992],
  'sayada': [35.6702, 10.9043],
  'lamta': [35.6751, 10.8817],
  'bekalta': [35.6173, 10.9961],
  // Municipalités officielles Monastir — ajoutées
  'khniss': [35.7351, 10.8230],
  'sidi ameur': [35.7541, 10.8714],
  'sahline mootmar': [35.7622, 10.7134],
  'menzel kamel': [35.6271, 10.6589],
  'zaouiet kontoch': [35.6021, 10.8304],
  'bembla-mnara': [35.6869, 10.8753],
  'bembla mnara': [35.6869, 10.8753],
  'menzel ennour': [35.6119, 10.9008],
  'el masdour': [35.5151, 11.0362],
  'sidi bennour': [35.5304, 10.9630],
  'menzel farsi': [35.5552, 10.8695],
  'amiret el fhoul': [35.5313, 10.8570],
  'amiret touazra': [35.5387, 10.8081],
  'amiret el hojjaj': [35.5227, 10.8781],
  'cherahil': [35.5916, 10.8557],
  'benen bodher': [35.6697, 10.9383],
  'touza': [35.5882, 10.8729],
  'lemta': [35.6751, 10.8817],
  'bouhjar': [35.6024, 10.9858],
  'menzel hayet': [35.7313, 10.7484],
  'ghenada': [35.6279, 10.9004],
  'jemmal': [35.6251, 10.7599],
  'djemmal': [35.6251, 10.7599],
  'skanes': [35.7586, 10.7620],
  'ksar-hellal': [35.6495, 10.8920],
  'ksibet': [35.6633, 10.8487],
  'ksibet mediouni': [35.6633, 10.8487],
  'benen bodher monastir': [35.6697, 10.9383],
  'cite hedi chaker': [35.6255, 10.7605],
  'cite hedi chaker jemmal': [35.6255, 10.7605],
  'hedi chaker': [35.6255, 10.7605],
  'rue hedi chaker': [35.6255, 10.7605],
  'cite el bassatine jemmal': [35.6220, 10.7570],

  // ── Sousse & alentours ──
  'sousse': [35.8245, 10.6346],
  'sousse ville': [35.8245, 10.6346],
  'hammam sousse': [35.8600, 10.5900],
  'msaken': [35.7306, 10.5775],
  'akouda': [35.8731, 10.5619],
  'kalaa kebira': [35.8694, 10.5397],
  'kalaa sghira': [35.8394, 10.5597],
  'bouhsina': [35.7800, 10.6200],
  'kantaoui': [35.8900, 10.5600],
  'port kantaoui': [35.8950, 10.5600],
  'khezama': [35.8400, 10.6000],
  'sidi abdelhamid': [35.8300, 10.6400],
  'ezzouhour sousse': [35.8150, 10.6200],

  // ── Sfax & alentours ──
  'sfax': [34.7406, 10.7603],
  'sfax ville': [34.7406, 10.7603],
  'sfax medina': [34.7370, 10.7600],
  'sakiet ezzit': [34.7667, 10.8000],
  'sakiet eddaier': [34.7800, 10.7700],
  'route el ain': [34.7480, 10.7650],
  'el ain': [34.7500, 10.7700],
  'thyna': [34.7100, 10.7900],
  'gremda': [34.7900, 10.7500],
  'el hencha': [34.7800, 10.5600],

  // ── Nabeul & alentours ──
  'nabeul': [36.4561, 10.7376],
  'hammamet': [36.4000, 10.6167],
  'hammamet nord': [36.4200, 10.6000],
  'hammamet sud': [36.3800, 10.6300],
  'korba': [36.5742, 10.8631],
  'kelibia': [36.8447, 11.0889],
  'menzel temime': [36.7839, 10.9789],
  'beni khiar': [36.4961, 10.7476],

  // ── Bizerte ──
  'bizerte': [37.2744, 9.8739],
  'bizerte ville': [37.2744, 9.8739],
  'menzel bourguiba': [37.1544, 9.7939],
  'mateur': [37.0394, 9.6639],
  'ras jebel': [37.2144, 10.1139],

  // ── Kairouan ──
  'kairouan': [35.6781, 10.0963],
  'kairouan ville': [35.6781, 10.0963],
  'haffouz': [35.6281, 9.6763],

  // ── Autres gouvernorats ──
  'gabes': [33.8881, 10.0975],
  'gabès': [33.8881, 10.0975],
  'gafsa': [34.4250, 8.7842],
  'tozeur': [33.9191, 8.1335],
  'kebili': [33.7043, 8.9693],
  'kébili': [33.7043, 8.9693],
  'medenine': [33.3549, 10.5055],
  'médenine': [33.3549, 10.5055],
  'tataouine': [32.9211, 10.4512],
  'mahdia': [35.5047, 11.0622],
  'kasserine': [35.1719, 8.8307],
  'sidi bouzid': [35.0380, 9.4842],
  'siliana': [36.0820, 9.3706],
  'beja': [36.7333, 9.1833],
  'béja': [36.7333, 9.1833],
  'jendouba': [36.5011, 8.7803],
  'le kef': [36.1745, 8.7047],
  'zaghouan': [36.4025, 10.1432],
};

/**
 * Résout les coordonnées GPS d'une commande.
 * Priorité : 1) adresse fine (mot entier, clé la plus longue d'abord)
 *            2) villeLivraison  3) gouvernorat  4) fallback aléatoire
 */
// ─── Cache des coordonnées résolues ──────────────────────────────────────────
const _coordsCache = new Map<string, [number, number]>();

/** Noms à exclure de l'adresse pour isoler le quartier spécifique */
const GOV_AND_COUNTRY_WORDS = new Set([
  'tunis','ariana','ben arous','manouba','nabeul','zaghouan','bizerte',
  'beja','jendouba','le kef','siliana','kairouan','kasserine','sidi bouzid',
  'sousse','monastir','mahdia','sfax','gabes','gabès','medenine','médenine',
  'tataouine','gafsa','tozeur','kebili','kébili','tunisie','tunisien','tunisienne',
  'ben arous'
]);

/**
 * Coordonnées GPS connues comme ERRONÉES (sauvegardées par l'ancienne version bugguée).
 * Ces valeurs pointent en mer ou au mauvais endroit.
 * On les ignore et on recalcule depuis le texte/quartier.
 */
const KNOWN_WRONG_GPS = new Set([
  '35.6844,10.8968',   // Bembla (en mer) — ancienne valeur erronée
  '35.6844,10.89683',  // Bembla (variante 5 décimales)
  '35.68440,10.89680', // Bembla (variante 5 décimales)
  '35.742,10.772',     // Bembla (autre valeur erronée)
  '35.7420,10.7720',   // Bembla (autre valeur erronée)
  '35.74200,10.77200', // Bembla (variante 5 décimales)
  '35.6967,10.725',    // Ouerdanine (valeur erronée)
  '35.6967,10.7250',   // Ouerdanine (valeur erronée)
  '35.69670,10.72500', // Ouerdanine (variante 5 décimales)
  '35.6608,10.8722',   // Téboulba (ancienne valeur erronée)
  '35.66080,10.87220', // Téboulba (variante 5 décimales)
]);

/**
 * Valide si une coordonnée est en Tunisie et sur terre (pas en mer).
 * Limites de Tunisie : [32.3 - 37.3 lat, 8.0 - 11.6 lon]
 * Bandes côtières à éviter (coordonnées génériques qui pointent en mer):
 *   - Nord de Bizerte : > 37.4 lat
 *   - Sud de Gabès : < 33.0 lat  
 *   - Ouest : < 8.0 lon
 *   - Est : > 11.6 lon
 */
function isValidTunisianCoordinate(lat: number, lon: number): boolean {
  if (!lat || !lon || isNaN(lat) || isNaN(lon)) return false;
  
  // Limites géographiques strictes de la Tunisie
  if (lat < 32.3 || lat > 37.4 || lon < 7.8 || lon > 11.7) return false;
  
  // Exceptions supplémentaires pour les zones côtières erronées connues :
  // Bembla en mer : coords entre 35.68-35.70 et 10.87-10.90
  if (lat > 35.68 && lat < 35.70 && lon > 10.87 && lon < 10.90) {
    // Permet [35.6869, 10.8753] mais rejette les variantes
    const isGoodBembla = Math.abs(lat - 35.6869) < 0.001 && Math.abs(lon - 10.8753) < 0.001;
    if (!isGoodBembla) return false;
  }
  
  return true;
}

/**
 * Résout les coordonnées GPS d'une commande.
 * Ordre de priorité STRICT :
 *   1. GPS stocké en BD — seulement si non présent dans KNOWN_WRONG_GPS
 *   2. Quartier exact via TUNISIE_GEO_COORDS (gouvernoratLivraison + quartierLivraison)
 *   3. Recherche textuelle sur adresse NETTOYÉE (sans gouvernorat ni "Tunisie")
 *   4. Recherche textuelle sur villeLivraison brut
 *   5. Centre du gouvernorat
 *   6. Fallback dépôt fixe (JAMAIS Math.random)
 */
function resolveCoords(
  commande: { villeLivraison: string; adresseLivraison: string;
               gouvernoratLivraison?: string; quartierLivraison?: string;
               latitudeLivraison?: number | null; longitudeLivraison?: number | null },
  fallback: [number, number]
): [number, number] {

  // ── PRIORITÉ 1 : GPS stocké — seulement si valide et fiable ──
  if (commande.latitudeLivraison && commande.longitudeLivraison) {
    const lat = commande.latitudeLivraison;
    const lon = commande.longitudeLivraison;
    
    // Valider avec les deux critères : pas dans blacklist ET dans limites tunisiennes
    const key4 = `${+lat.toFixed(4)},${+lon.toFixed(4)}`;
    const key5 = `${+lat.toFixed(5)},${+lon.toFixed(5)}`;
    
    const isBlacklisted = KNOWN_WRONG_GPS.has(`${lat},${lon}`) 
      || KNOWN_WRONG_GPS.has(key4)
      || KNOWN_WRONG_GPS.has(key5);
    
    const isValid = isValidTunisianCoordinate(lat, lon);
    
    if (!isBlacklisted && isValid) {
      return [lat, lon];
    }
  }


  const villeLivraison   = commande.villeLivraison   || '';
  const adresseLivraison = commande.adresseLivraison || '';
  const gouvernorat      = commande.gouvernoratLivraison || '';
  const quartier         = commande.quartierLivraison   || '';

  const cacheKey = `${gouvernorat}|${quartier}|${villeLivraison}|${adresseLivraison}`;
  if (_coordsCache.has(cacheKey)) return _coordsCache.get(cacheKey)!;
  const save = (c: [number, number]): [number, number] => { _coordsCache.set(cacheKey, c); return c; };

  // ── PRIORITÉ 2 : quartier exact via TUNISIE_GEO_COORDS ──────────────────
  if (gouvernorat && quartier && TUNISIE_GEO_COORDS[gouvernorat]?.[quartier]) {
    return save(TUNISIE_GEO_COORDS[gouvernorat][quartier]);
  }

  /** Normalise : minuscules + sans accents + sans ponctuation */
  const normalize = (s: string): string =>
    (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  /**
   * Nettoie l'adresse en supprimant les noms de gouvernorats et "Tunisie"
   * pour éviter que "Monastir" dans "Bembla, Monastir, Tunisie, Monastir"
   * matche la clé 'monastir' avant 'bembla'.
   * Ex: "12, Rue Principale, Bembla, Monastir, Tunisie, Monastir"
   *   → "12 rue principale bembla"
   */
  const cleanAdresse = (adresse: string, gouv: string): string => {
    let norm = normalize(adresse);
    // Supprimer le gouvernorat courant
    if (gouv) {
      const g = normalize(gouv);
      norm = norm.replace(new RegExp('\\b' + g.replace(/\s+/g, '\\s+') + '\\b', 'g'), ' ');
    }
    // Supprimer tous les noms génériques (autres gouvernorats + "tunisie")
    for (const word of GOV_AND_COUNTRY_WORDS) {
      norm = norm.replace(new RegExp('\\b' + word.replace(/\s+/g, '\\s+') + '\\b', 'g'), ' ');
    }
    return norm.replace(/\s+/g, ' ').trim();
  };

  /** wordMatch : mot-entier strict puis inclusion directe (≥5 chars) */
  const wordMatch = (text: string, keyword: string): boolean => {
    const t = normalize(text);
    const k = normalize(keyword);
    if (!k || !t) return false;
    const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\-]+');
    if (new RegExp('(^|[\\s\\-])' + esc + '([\\s\\-]|$)').test(t)) return true;
    if (k.length >= 5 && t.includes(k)) return true;
    return false;
  };

  // Entrées triées par longueur décroissante (clé plus spécifique en priorité)
  const entries = Object.entries(VILLES_COORDS_EXTENDED)
    .sort((a, b) => b[0].length - a[0].length);

  // ── PRIORITÉ 3 : adresse NETTOYÉE (quartier spécifique sans bruit gouvernorat) ──
  const adresseNettoyee = cleanAdresse(adresseLivraison, gouvernorat);
  if (adresseNettoyee) {
    for (const [key, coords] of entries) {
      if (wordMatch(adresseNettoyee, key)) return save(coords);
    }
  }

  // ── PRIORITÉ 4 : villeLivraison brut (souvent = nom du gouvernorat) ──────
  for (const [key, coords] of entries) {
    if (wordMatch(villeLivraison, key)) return save(coords);
  }

  // ── PRIORITÉ 5 : adresse brute complète (fallback textuel) ───────────────
  for (const [key, coords] of entries) {
    if (wordMatch(adresseLivraison, key)) return save(coords);
  }

  // ── PRIORITÉ 6 : centre du gouvernorat ───────────────────────────────────
  const govEntries = Object.entries(GOUVERNORAT_COORDS)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [key, coords] of govEntries) {
    if (wordMatch(gouvernorat, key) || wordMatch(villeLivraison, key)) {
      return save(coords);
    }
  }

  // ── PRIORITÉ 7 : fallback dépôt (fixe, JAMAIS Math.random) ──────────────
  return save(fallback);
}

/**
 * Coordonnées précises par quartier — miroir de TUNISIE_GEO du commande-form.
 * Permet de retrouver les coords exactes quand la commande a quartierLivraison renseigné.
 * CORRECTIONS INCLUSES : Bembla [35.6844, 10.8968] (et non 35.7420 qui est erroné)
 */
const TUNISIE_GEO_COORDS: Record<string, Record<string, [number, number]>> = {
  'Monastir': {
    'Cité Omrane':             [35.7710, 10.8011],
    'Cité Riadh':              [35.7689, 10.7987],
    'Cité Fattouma Bourguiba': [35.7652, 10.8055],
    'Médina de Monastir':      [35.7673, 10.8182],
    'Quartier Corniche':       [35.7722, 10.8263],
    'Bembla':                  [35.6869, 10.8753], // ← CORRIGÉ OSM (était 35.6844,10.8968 = en mer)
    'Ksar Hellal':             [35.6432, 10.8917],
    'Moknine':                 [35.6281, 10.9003],
    'Jemmal':                  [35.6200, 10.7681],
    'Téboulba':                [35.6633, 10.8933], // ← CORRIGÉ OSM (était 35.6608,10.8722)
    'Sayada':                  [35.7164, 10.7567],
    'Ouerdanine':              [35.7069, 10.6945], // ← CORRIGÉ (était 35.6967, 10.7250)
    'Zeramdine':               [35.5924, 10.7269],
    'Beni Hassen':             [35.5679, 10.7992],
    'Lamta':                   [35.6751, 10.8817],
    'Bekalta':                 [35.6173, 10.9961],
    'Ksibet el Mediouni':      [35.6633, 10.8487],
    'Sahline':                 [35.7497, 10.7420],
  },
  'Tunis': {
    'Bab Bhar (Ville Nouvelle)': [36.8008, 10.1797],
    'La Médina':                 [36.7985, 10.1714],
    'El Menzah':                 [36.8470, 10.1830],
    'Les Berges du Lac':         [36.8336, 10.2317],
    'La Marsa':                  [36.8778, 10.3247],
    'Ariana Ville':              [36.8625, 10.1956],
    'Cité Ennasr':               [36.8697, 10.1893],
    'Ettadhamen':                [36.8428, 10.1356],
  },
  'Sousse': {
    'Sousse Médina':  [35.8280, 10.6360],
    'Khezama':        [35.8106, 10.5933],
    'Sahloul':        [35.8472, 10.5811],
    'Hammam Sousse':  [35.8614, 10.5956],
    'Akouda':         [35.8839, 10.5753],
    'Msaken':         [35.7306, 10.5794],
    'Kalaa Kebira':   [35.8636, 10.5358],
  },
  'Sfax': {
    'Sfax Ville':   [34.7406, 10.7603],
    'Sakiet Ezzit': [34.7528, 10.7189],
    'Thyna':        [34.7111, 10.7406],
    'El Ain':       [34.7728, 10.7836],
    'Sfax Sud':     [34.7150, 10.7750],
  },
  'Nabeul': {
    'Nabeul Ville': [36.4561, 10.7376],
    'Hammamet':     [36.4000, 10.6167],
    'Kelibia':      [36.8472, 11.1044],
    'Grombalia':    [36.6033, 10.5039],
    'Soliman':      [36.6989, 10.4900],
  },
  'Bizerte': {
    'Bizerte Ville':    [37.2744,  9.8739],
    'Zarzouna':         [37.2556,  9.8481],
    'Menzel Bourguiba': [37.1553,  9.7906],
    'Mateur':           [37.0411,  9.6633],
  },
  'Kairouan': {
    'Kairouan Ville': [35.6781, 10.0963],
    'Sbikha':         [35.9114,  9.9469],
    'Haffouz':        [35.6372,  9.6681],
  },
  'Gabès': {
    'Gabès Ville': [33.8881, 10.0975],
    'Ghannouch':   [33.9389, 10.0494],
    'El Hamma':    [33.8872,  9.7989],
  },
  'Médenine': {
    'Médenine Ville':      [33.3549, 10.5055],
    'Djerba - Houmt Souk': [33.8753, 10.8572],
    'Djerba - Midoun':     [33.8139, 10.9939],
    'Zarzis':              [33.5056, 11.1111],
  },
};

// Priorité des commandes pour le ML
export type PrioriteCommande = 'URGENTE' | 'NORMALE' | 'BASSE';

@Component({
  selector: 'app-tournee-form',
  templateUrl: './tournee-form.component.html',
  styleUrls: ['./tournee-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourneeFormComponent implements OnInit, OnDestroy, AfterViewInit {

  form!: FormGroup;
  isEdit = false;
  tourneeId?: number;
  saving = false;
  loadingRessources = false;

  chauffeurs: Chauffeur[] = [];
  vehicules: Vehicule[] = [];
  commandes: CommandeDisponible[] = [];
  commandesFiltrees: CommandeDisponible[] = [];
  commandesSelectionnees: Set<number> = new Set();

  // Zone géographique
  gouvernorats = Object.keys(TUNISIE_ZONES);
  quartiersDuGouvernorat: string[] = [];
  ruesDuQuartier: string[] = [];
  gouvernoratSelectionne: string = '';
  quartierSelectionne: string = '';
  rueSelectionnee: string = '';

  // Limites et avertissements
  readonly MAX_COMMANDES_PAR_JOUR = 10;
  depassementLimite = false;
  chauffeurCapaciteAtteinte = false;

  // Optimisation ML
  optimisationEnCours = false;
  optimisationResultat: any = null;
  map: any = null;
  routeLayer: any = null;
  markersLayer: any = null;
  ordreOptimise: number[] = [];

  readonly today = new Date().toISOString().split('T')[0];
  readonly tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  showConfig = false;
  blockWeekends = true;
  blockJoursFeries = true;
  dateErreur = '';
  heureErreur = '';

  readonly HEURE_MIN = '07:00';
  readonly HEURE_MAX = '18:00';

  readonly joursFeriesFixes: string[] = [
    '01-01','03-20','04-09','05-01','07-25','08-13','10-15',
  ];
  joursFeriesVariables: string[] = [];
  joursPersonnalises: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private svc: TourneeService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
    private cd: ChangeDetectorRef,
    private optimSvc: OptimisationService
  ) {}

  ngOnInit(): void {
    this.buildForm();

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(p => {
      if (p['id'] && p['id'] !== 'new') {
        this.isEdit = true;
        this.tourneeId = +p['id'];
        this.chargerTournee(this.tourneeId);
      } else {
        this.chargerCommandesDisponibles();
      }
    });

    this.chargerJoursBloques();

    this.form.get('dateTournee')?.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(date => {
      if (date) {
        this.chargerRessourcesDisponibles(date);
        this.appliquerFiltreDateEtZone();
      }
    });
  }

  ngAfterViewInit(): void {
    // La carte sera initialisée après optimisation
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  buildForm(): void {
    this.form = this.fb.group({
      dateTournee:    ['', Validators.required],
      heureDebut:     [''],
      heureFin:       [''],
      chauffeurId:    [null, Validators.required],
      vehiculeId:     [null, Validators.required],
      distanceTotale: [null, Validators.min(0)],
      adresseDepart:  ['', Validators.required],
      remarques:      [''],
    });
  }

  // ── Zone géographique ──────────────────────────────────────────────

  onGouvernoratChange(gouv: string): void {
    this.gouvernoratSelectionne = gouv;
    this.quartierSelectionne = '';
    this.rueSelectionnee = '';
    this.quartiersDuGouvernorat = gouv ? Object.keys(TUNISIE_ZONES[gouv] || {}) : [];
    this.ruesDuQuartier = [];
    this.filtrerCommandesParZone();
    this.cd.markForCheck();
  }

  onQuartierChange(quartier: string): void {
    this.quartierSelectionne = quartier;
    this.rueSelectionnee = '';
    this.ruesDuQuartier = quartier
      ? TUNISIE_ZONES[this.gouvernoratSelectionne]?.[quartier] || []
      : [];
    this.filtrerCommandesParZone();
    this.cd.markForCheck();
  }

  onRueChange(rue: string): void {
    this.rueSelectionnee = rue;
    this.filtrerCommandesParZone();
    this.cd.markForCheck();
  }

  filtrerCommandesParZone(): void {
    this.appliquerFiltreDateEtZone();
  }

  getAdresseComplete(): string {
    const parts = [this.rueSelectionnee, this.quartierSelectionne, this.gouvernoratSelectionne].filter(Boolean);
    return parts.join(', ');
  }

  // ── Chargement données ─────────────────────────────────────────────

  chargerTournee(id: number): void {
    this.svc.getTournee(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: t => {
        this.form.patchValue({
          dateTournee: t.dateTournee,
          heureDebut: t.heureDebut || '',
          heureFin: t.heureFin || '',
          chauffeurId: t.chauffeurId,
          vehiculeId: t.vehiculeId,
          distanceTotale: t.distanceTotale,
          adresseDepart: t.adresseDepart || '',
          remarques: t.remarques || '',
        });
        this.commandesSelectionnees = new Set(t.commandeIds || []);
        this.chargerRessourcesDisponibles(t.dateTournee);
        this.chargerCommandesDisponibles(t.commandeIds);
        this.cd.markForCheck();
      },
      error: () => {
        this.snack.open('Tournée introuvable', 'Fermer', { duration: 3000 });
        this.router.navigate(['/tournees']);
      }
    });
  }

  chargerRessourcesDisponibles(date: string): void {
    if (!date) return;
    this.loadingRessources = true;
    this.cd.markForCheck();

    this.svc.getChauffeursDisponibles(date, this.tourneeId).pipe(takeUntil(this.destroy$)).subscribe({
      next: c => {
        this.chauffeurs = c;
        this.loadingRessources = false;
        this.verifierCapaciteChauffeur();
        this.cd.markForCheck();
      },
      error: () => { this.loadingRessources = false; this.cd.markForCheck(); }
    });

    this.svc.getVehiculesDisponibles(date, this.tourneeId).pipe(takeUntil(this.destroy$)).subscribe({
      next: v => { this.vehicules = v; this.cd.markForCheck(); }
    });
  }

  chargerCommandesDisponibles(inclureIds?: number[]): void {
    this.svc.getCommandesEnAttente().pipe(takeUntil(this.destroy$)).subscribe({
      next: cmds => {
        this.commandes = cmds;
        // Bug 1 corrigé : filtrer par date de tournée sélectionnée
        this.appliquerFiltreDateEtZone();
        this.cd.markForCheck();
      }
    });
  }

  appliquerFiltreDateEtZone(): void {
    const dateTournee: string = this.form.get('dateTournee')?.value || '';
    let filtrees = this.commandes;

    // Filtre par date : ne garder que les commandes dont dateLivraisonPrevue = dateTournee
    if (dateTournee) {
      filtrees = filtrees.filter(c => {
        const dateCmnd = c.dateLivraisonPrevue?.substring(0, 10);
        return dateCmnd === dateTournee;
      });
    }

    // Filtre par zone géographique
    if (this.gouvernoratSelectionne) {
      filtrees = filtrees.filter(c => {
        const ville   = (c.villeLivraison   || '').toLowerCase();
        const adresse = (c.adresseLivraison || '').toLowerCase();
        const gouv    = this.gouvernoratSelectionne.toLowerCase();
        const quartier = this.quartierSelectionne.toLowerCase();
        const rue      = this.rueSelectionnee.toLowerCase();

        let match = ville.includes(gouv) || gouv.includes(ville);
        if (match && quartier) match = adresse.includes(quartier);
        if (match && rue)      match = adresse.includes(rue);
        return match;
      });
    }

    this.commandesFiltrees = filtrees;
    this.cd.markForCheck();
  }

  // ── Sélection commandes avec limite 10/jour ───────────────────────

  toggleCommande(id: number): void {
    if (this.commandesSelectionnees.has(id)) {
      this.commandesSelectionnees.delete(id);
    } else {
      if (this.commandesSelectionnees.size >= this.MAX_COMMANDES_PAR_JOUR) {
        this.snack.open(
          `⚠️ Limite atteinte : un chauffeur ne peut faire que ${this.MAX_COMMANDES_PAR_JOUR} livraisons par jour.`,
          'OK', { duration: 4000, panelClass: 'snack-warn' }
        );
        return;
      }
      this.commandesSelectionnees.add(id);
    }
    this.depassementLimite = this.commandesSelectionnees.size > this.MAX_COMMANDES_PAR_JOUR;
    this.verifierCapaciteChauffeur();
    this.cd.markForCheck();
  }

  verifierCapaciteChauffeur(): void {
    this.chauffeurCapaciteAtteinte = this.commandesSelectionnees.size >= this.MAX_COMMANDES_PAR_JOUR;
    this.cd.markForCheck();
  }

  isCommandeSelected(id: number): boolean {
    return this.commandesSelectionnees.has(id);
  }

  getPrioriteBadge(c: CommandeDisponible): PrioriteCommande {
    // Bug 2 corrigé : lire la vraie priorité de la commande
    const p = (c.priorite || '').toUpperCase();
    if (p === 'URGENT' || p === 'URGENTE') return 'URGENTE';
    if (p === 'HAUTE')  return 'URGENTE';   // HAUTE = rouge aussi
    if (p === 'NORMALE' || p === 'NORMAL') return 'NORMALE';
    if (p === 'BASSE' || p === 'BASSE')   return 'BASSE';
    // Fallback : calculer à partir de la date si priorite absente
    const diff = (new Date(c.dateLivraisonPrevue).getTime() - Date.now()) / (1000 * 3600 * 24);
    if (diff <= 1) return 'URGENTE';
    if (diff <= 3) return 'NORMALE';
    return 'BASSE';
  }

  getPrioriteColor(p: PrioriteCommande): string {
    return { URGENTE: '#e53e3e', NORMALE: '#d69e2e', BASSE: '#48bb78' }[p];
  }

  // ── Optimisation ML ────────────────────────────────────────────────

  lancerOptimisation(): void {
    if (this.commandesSelectionnees.size === 0) {
      this.snack.open('Sélectionnez au moins une commande pour optimiser.', 'OK', { duration: 3000 });
      return;
    }

    this.optimisationEnCours = true;
    this.cd.markForCheck();

    const commandesChoisies = this.commandes.filter(c => this.commandesSelectionnees.has(c.id));

    // Appel au service ML via OptimisationService
    this.optimSvc.optimiserTournee({
      commandeIds: Array.from(this.commandesSelectionnees),
      date: this.form.get('dateTournee')?.value,
      zone: this.gouvernoratSelectionne,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: OptimisationTourneeResult) => {
        this.optimisationResultat = res;
        this.ordreOptimise = res.ordreOptimise || Array.from(this.commandesSelectionnees);
        this.optimisationEnCours = false;
        this.snack.open(`✅ Optimisation ML terminée — ${(res.distanceTotale || 0).toFixed(1)} km`, undefined, {
          duration: 4000, panelClass: 'snack-success'
        });
        this.cd.markForCheck();
        setTimeout(() => this.initialiserCarte(commandesChoisies), 300);
      },
      error: () => {
        // Fallback: algorithme du plus proche voisin local
        this.optimisationLocale(commandesChoisies);
      }
    });
  }

  optimisationLocale(commandes: CommandeDisponible[]): void {
    // Nearest Neighbor Algorithm avec coordonnées tunisiennes
    const gouvernoratCoords = GOUVERNORAT_COORDS[this.gouvernoratSelectionne] || GOUVERNORAT_COORDS['Monastir'];
    // Utiliser l'adresse de départ saisie dans le formulaire
    const adresseDepart = this.form.get('adresseDepart')?.value || '';
    const depot: [number, number] = adresseDepart
      ? resolveCoords({ villeLivraison: adresseDepart, adresseLivraison: adresseDepart,
                        gouvernoratLivraison: this.gouvernoratSelectionne }, gouvernoratCoords)
      : gouvernoratCoords;

    const getCoords = (c: CommandeDisponible): [number, number] =>
      resolveCoords(c, depot);

    const distance = (a: [number, number], b: [number, number]) => {
      // Formule de Haversine — distance en km
      const R = 6371;
      const dLat = (b[0] - a[0]) * Math.PI / 180;
      const dLon = (b[1] - a[1]) * Math.PI / 180;
      const lat1 = a[0] * Math.PI / 180;
      const lat2 = b[0] * Math.PI / 180;
      const x = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
    };

    // Trier aussi par priorité
    const priorityOrder = { URGENTE: 0, NORMALE: 1, BASSE: 2 };
    const sorted = [...commandes].sort((a, b) =>
      priorityOrder[this.getPrioriteBadge(a)] - priorityOrder[this.getPrioriteBadge(b)]
    );

    // Nearest Neighbor
    const nonVisites = [...sorted];
    const ordre: CommandeDisponible[] = [];
    let position = depot;
    let distanceTotale = 0;

    while (nonVisites.length > 0) {
      let plusProche = nonVisites[0];
      let distMin = distance(position, getCoords(nonVisites[0]));

      for (const c of nonVisites) {
        const d = distance(position, getCoords(c));
        if (d < distMin) {
          distMin = d;
          plusProche = c;
        }
      }

      ordre.push(plusProche);
      distanceTotale += distMin;
      position = getCoords(plusProche);
      nonVisites.splice(nonVisites.indexOf(plusProche), 1);
    }
    distanceTotale += distance(position, depot);

    this.ordreOptimise = ordre.map(c => c.id);
    this.optimisationResultat = { distanceTotale, ordreOptimise: this.ordreOptimise };
    this.form.patchValue({ distanceTotale: Math.round(distanceTotale) });

    this.optimisationEnCours = false;
    this.snack.open(`✅ Optimisation locale — ${distanceTotale.toFixed(1)} km — ${ordre.length} arrêts`, undefined, {
      duration: 4000, panelClass: 'snack-success'
    });
    this.cd.markForCheck();
    setTimeout(() => this.initialiserCarte(ordre), 300);
  }

  initialiserCarte(commandes: CommandeDisponible[]): void {
    const conteneur = document.getElementById('carte-optimisation-tournee');
    if (!conteneur) return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    // Vider le cache de coords pour que la carte soit cohérente avec le run courant
    _coordsCache.clear();

    const gouvernoratCoords = GOUVERNORAT_COORDS[this.gouvernoratSelectionne] || GOUVERNORAT_COORDS['Monastir'];
    const adresseDepart = this.form.get('adresseDepart')?.value || '';
    const depotCoords: [number, number] = adresseDepart
      ? resolveCoords({ villeLivraison: adresseDepart, adresseLivraison: adresseDepart,
                        gouvernoratLivraison: this.gouvernoratSelectionne }, gouvernoratCoords)
      : gouvernoratCoords;
    const depotLabel = adresseDepart || (this.gouvernoratSelectionne || 'Dépôt');

    this.map = L.map('carte-optimisation-tournee', { zoomControl: true }).setView(depotCoords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);

    const couleurs = ['#e53e3e','#dd6b20','#d69e2e','#38a169','#3182ce','#805ad5','#d53f8c','#2c7a7b','#744210','#276749'];

    // Dépôt
    const depotIcon = L.divIcon({
      className: '',
      html: `<div style="width:36px;height:36px;background:#1B4F72;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:14px;box-shadow:0 3px 10px rgba(0,0,0,0.5)">D</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    L.marker(depotCoords, { icon: depotIcon })
      .addTo(this.map)
      .bindPopup(`<strong>🏭 Point de départ</strong><br>${depotLabel}`);

    // Tracer le chemin optimisé
    const points: [number, number][] = [depotCoords];
    const getCoords = (c: CommandeDisponible): [number, number] =>
      resolveCoords(c, depotCoords);

    // Ordonner les commandes selon l'ordre optimisé
    const commandesOrdonnees = this.ordreOptimise
      .map(id => commandes.find(c => c.id === id))
      .filter(Boolean) as CommandeDisponible[];

    commandesOrdonnees.forEach((c, i) => {
      const coords = getCoords(c);
      points.push(coords);

      const priorite = this.getPrioriteBadge(c);
      const couleur = couleurs[i % couleurs.length];
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;background:${couleur};border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${i+1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker(coords, { icon })
        .addTo(this.map!)
        .bindPopup(`
          <div style="font-family:'Outfit',sans-serif;min-width:180px">
            <strong style="color:${couleur}">Arrêt ${i+1}</strong><br>
            <code>${c.numeroCommande}</code><br>
            📍 ${c.adresseLivraison}, ${c.villeLivraison}<br>
            👤 ${c.clientNom || '—'}<br>
            <span style="background:${this.getPrioriteColor(priorite)};color:white;padding:1px 6px;border-radius:10px;font-size:10px">${priorite}</span>
          </div>
        `);
    });

    points.push(depotCoords); // Retour au point de départ

    // Polyline du chemin
    L.polyline(points, {
      color: '#1B4F72',
      weight: 3,
      opacity: 0.8,
      dashArray: '8, 4',
    }).addTo(this.map!);

    // Zoom automatique sur tous les points
    if (points.length > 1) {
      this.map!.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }

    this.map.invalidateSize();
    this.cd.markForCheck();
  }

  // ── Soumission ─────────────────────────────────────────────────────

  soumettre(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving = true;
    this.cd.markForCheck();

    const payload = {
      ...this.form.getRawValue(),
      commandeIds: this.ordreOptimise.length > 0 ? this.ordreOptimise : Array.from(this.commandesSelectionnees),
      zone: this.gouvernoratSelectionne,
      adresseComplete: this.getAdresseComplete(),
    };

    const op$ = this.isEdit
      ? this.svc.updateTournee(this.tourneeId!, payload)
      : this.svc.createTournee(payload);

    op$.pipe(takeUntil(this.destroy$)).subscribe({
      next: t => {
        this.snack.open(
          this.isEdit ? `Tournée ${t.numeroTournee} modifiée ✓` : `Tournée ${t.numeroTournee} créée ✓`,
          undefined, { duration: 3000, panelClass: 'snack-success' }
        );
        this.router.navigate(['/tournees']);
      },
      error: (e) => {
        this.saving = false;
        this.snack.open(e?.error?.message || "Erreur lors de l'enregistrement", 'Fermer', { duration: 6000 });
        this.cd.markForCheck();
      }
    });
  }

  // ── Validation date/heure ──────────────────────────────────────────

  estWeekend(dateStr: string): boolean {
    if (!dateStr) return false;
    const j = new Date(dateStr).getDay();
    return j === 0 || j === 6;
  }

  estJourFerie(dateStr: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const mmdd = String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    return this.joursFeriesFixes.includes(mmdd) || this.joursFeriesVariables.includes(dateStr) || this.joursPersonnalises.includes(dateStr);
  }

  getNomJourFerie(dateStr: string): string {
    const d = new Date(dateStr);
    const mmdd = String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    const noms: Record<string,string> = {
      '01-01': "Jour de l'An", '03-20': "Fête de l'Indépendance",
      '04-09': "Journée des Martyrs", '05-01': "Fête du Travail",
      '07-25': "Fête de la République", '08-13': "Fête de la Femme",
      '10-15': "Fête de l'Évacuation",
    };
    return noms[mmdd] || 'Jour férié';
  }

  validerDate(dateStr: string): boolean {
    this.dateErreur = '';
    if (!dateStr) return true;
    if (this.estWeekend(dateStr)) {
      this.dateErreur = new Date(dateStr).getDay() === 6 ? '⛔ Samedi — jour non travaillé' : '⛔ Dimanche — jour non travaillé';
      return false;
    }
    if (this.blockJoursFeries && this.estJourFerie(dateStr)) {
      this.dateErreur = '⛔ ' + this.getNomJourFerie(dateStr) + ' — jour férié';
      return false;
    }
    return true;
  }

  validerHeure(heureStr: string, champ: 'debut' | 'fin'): boolean {
    this.heureErreur = '';
    if (!heureStr) return true;
    const [h, m] = heureStr.split(':').map(Number);
    const minutes = h * 60 + m;
    if (minutes < 7 * 60) { this.heureErreur = `⛔ Heure avant 07h00`; return false; }
    if (minutes > 18 * 60) { this.heureErreur = `⛔ Heure après 18h00`; return false; }
    if (champ === 'fin') {
      const heureDebut = this.form.get('heureDebut')?.value;
      if (heureDebut && heureStr <= heureDebut) { this.heureErreur = "⛔ L'heure de fin doit être après le départ"; return false; }
    }
    return true;
  }

  onHeureChange(event: Event, champ: 'debut' | 'fin'): void {
    const val = (event.target as HTMLInputElement).value;
    const ctrl = champ === 'debut' ? 'heureDebut' : 'heureFin';
    if (!this.validerHeure(val, champ)) {
      this.form.get(ctrl)?.setErrors({ heureInvalide: true });
    } else {
      const errs = this.form.get(ctrl)?.errors;
      if (errs) {
        const { heureInvalide, ...reste } = errs;
        this.form.get(ctrl)?.setErrors(Object.keys(reste).length ? reste : null);
      }
    }
    this.cd.markForCheck();
  }

  onDateChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (!this.validerDate(val)) {
      this.form.get('dateTournee')?.setErrors({ jourNonTravaille: true });
    } else {
      const errs = this.form.get('dateTournee')?.errors;
      if (errs) {
        const { jourNonTravaille, ...reste } = errs;
        this.form.get('dateTournee')?.setErrors(Object.keys(reste).length ? reste : null);
      }
    }
    this.cd.markForCheck();
  }

  ajouterJourPersonnalise(dateStr: string): void {
    if (dateStr && !this.joursPersonnalises.includes(dateStr)) {
      this.joursPersonnalises.push(dateStr);
      localStorage.setItem('tms_jours_bloques', JSON.stringify(this.joursPersonnalises));
      this.snack.open('Jour bloqué ajouté ✓', '✕', { duration: 2500 });
      this.cd.markForCheck();
    }
  }

  supprimerJourPersonnalise(dateStr: string): void {
    this.joursPersonnalises = this.joursPersonnalises.filter(d => d !== dateStr);
    localStorage.setItem('tms_jours_bloques', JSON.stringify(this.joursPersonnalises));
    this.cd.markForCheck();
  }

  chargerJoursBloques(): void {
    try {
      const s = localStorage.getItem('tms_jours_bloques');
      if (s) this.joursPersonnalises = JSON.parse(s);
    } catch {}
  }

  retour(): void {
    this.router.navigate(['/tournees']);
  }

  getError(field: string): string {
    const c = this.form.get(field);
    if (!c?.invalid || !c?.touched) return '';
    if (c.hasError('required')) return 'Ce champ est obligatoire';
    if (c.hasError('min')) return 'Valeur doit être positive';
    return 'Valeur invalide';
  }
}