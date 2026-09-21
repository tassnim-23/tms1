# -*- coding: utf-8 -*-
"""
TMS ML Optimizer — Flask Server
Inclut: prédiction ML + optimisation de tournée par GPS (Nearest Neighbor)
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import math
import traceback
import os

try:
    from predict import predictor
except ImportError as e:
    print(f"❌ Erreur import predict: {e}")
    predictor = None

os.makedirs("logs", exist_ok=True)
app = Flask(__name__)
CORS(app)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("logs/app.log"), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)
logger.info("🚀 Flask ML Optimizer démarré")

# ── Coordonnées GPS des gouvernorats tunisiens ─────────────────────────────
GPS_GOUVERNORATS = {
    "Tunis":       (36.8065, 10.1815),
    "Ariana":      (36.8625, 10.1956),
    "Ben Arous":   (36.7533, 10.2282),
    "Manouba":     (36.8100, 10.1000),
    "Nabeul":      (36.4561, 10.7376),
    "Zaghouan":    (36.4025, 10.1432),
    "Bizerte":     (37.2744,  9.8739),
    "Béja":        (36.7333,  9.1833),
    "Jendouba":    (36.5011,  8.7803),
    "Le Kef":      (36.1745,  8.7047),
    "Siliana":     (36.0820,  9.3706),
    "Kairouan":    (35.6781, 10.0963),
    "Kasserine":   (35.1719,  8.8307),
    "Sidi Bouzid": (35.0380,  9.4842),
    "Sousse":      (35.8245, 10.6346),
    "Monastir":    (35.7643, 10.8113),
    "Mahdia":      (35.5047, 11.0622),
    "Sfax":        (34.7406, 10.7603),
    "Gabès":       (33.8881, 10.0975),
    "Médenine":    (33.3549, 10.5055),
    "Tataouine":   (32.9211, 10.4512),
    "Gafsa":       (34.4250,  8.7842),
    "Tozeur":      (33.9191,  8.1335),
    "Kébili":      (33.7043,  8.9693),
}

def haversine(lat1, lon1, lat2, lon2):
    """Distance réelle en km entre deux coordonnées GPS (formule Haversine)."""
    R = 6371  # Rayon Terre en km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def nearest_neighbor(depot, stops, optimize_distance=True):
    """
    Algorithme du plus proche voisin — VERSION OPTIMISÉE DISTANCE.
    
    depot: (lat, lon)
    stops: liste de dict {id, lat, lon, priorite, ...}
    optimize_distance: bool
      - True (défaut) = pur algorithme distance (chemin le plus court)
      - False = applique bonus priorité (urgents visités en priorité)
    
    Retourne: liste ordonnée des stops + distance totale
    
    ALGORITHME:
    1. Si optimize_distance=True: Nearest Neighbor pur (greedy par distance)
       → Produit le chemin le plus court possible
    2. Si optimize_distance=False: Priority-guided Nearest Neighbor
       → Favorise urgents/haute mais garde le principe de proximité
    """
    PRIORITE_ORDRE = {"URGENT": 0, "HAUTE": 1, "NORMALE": 2, "BASSE": 3}

    # Phase 1: Tri initial par priorité si needed
    if not optimize_distance:
        stops_tries = sorted(stops, key=lambda s: PRIORITE_ORDRE.get(s.get("priorite", "NORMALE"), 2))
    else:
        stops_tries = stops.copy()

    non_visites = stops_tries.copy()
    ordre = []
    position = depot
    distance_totale = 0.0

    while non_visites:
        # Trouver le plus proche NON-VISITÉ
        plus_proche = None
        dist_min = float("inf")

        for stop in non_visites:
            lat = stop.get("lat") or depot[0]
            lon = stop.get("lon") or depot[1]
            dist_reelle = haversine(position[0], position[1], lat, lon)

            # CRITÈRE DE SÉLECTION:
            # - Si optimize_distance: utiliser distance réelle uniquement
            # - Si !optimize_distance: appliquer bonus priorité comme avant
            if optimize_distance:
                dist = dist_reelle  # Distance réelle sans modification
            else:
                # Ancienn logique: bonus priorité
                priorite = stop.get("priorite", "NORMALE")
                dist = dist_reelle
                if priorite == "URGENT":
                    dist *= 0.6   # Favorise urgents
                elif priorite == "HAUTE":
                    dist *= 0.8

            if dist < dist_min:
                dist_min = dist
                plus_proche = stop

        if plus_proche:
            lat = plus_proche.get("lat") or depot[0]
            lon = plus_proche.get("lon") or depot[1]
            dist_reelle = haversine(position[0], position[1], lat, lon)
            distance_totale += dist_reelle
            position = (lat, lon)
            ordre.append(plus_proche)
            non_visites.remove(plus_proche)

    # Retour au dépôt
    if ordre:
        dernier = ordre[-1]
        lat_d = dernier.get("lat") or depot[0]
        lon_d = dernier.get("lon") or depot[1]
        distance_totale += haversine(lat_d, lon_d, depot[0], depot[1])

    return ordre, distance_totale


# ── Routes API ─────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    status = "ok" if predictor is not None else "degraded"
    return jsonify({"status": status, "service": "tms-ml-optimizer", "version": "2.0"}), 200


@app.route("/predict", methods=["POST"])
def predict():
    try:
        if predictor is None:
            return jsonify({"error": "ML model not loaded"}), 500
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON required"}), 400
        distance = data.get("distance_km")
        nb_commandes = data.get("nb_commandes")
        if distance is None or nb_commandes is None:
            return jsonify({"error": "Missing: distance_km, nb_commandes"}), 400
        if distance <= 0 or nb_commandes <= 0:
            return jsonify({"error": "Invalid values"}), 400
        result = predictor.predict(float(distance), int(nb_commandes))
        if result.get("status") == "error":
            return jsonify(result), 400
        logger.info(f"✅ Prédiction: {distance}km, {nb_commandes} cdes → {result.get('temps_estime_ml')}min")
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"❌ Erreur predict: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/optimiser-tournee", methods=["POST"])
def optimiser_tournee():
    """
    Optimisation ML d'une tournée spécifique avec distance optimisée.
    
    Body JSON attendu:
    {
      "commandeIds": [1, 2, 3],
      "commandes": [
        {
          "id": 1,
          "lat": 35.7643,
          "lon": 10.8113,
          "priorite": "URGENT",
          "gouvernorat": "Monastir"
        },
        ...
      ],
      "date": "2026-05-10",
      "zone": "Monastir",
      "depotLat": 36.8065,      // optionnel
      "depotLon": 10.1815,      // optionnel
      "optimize_distance": true  // optionnel (défaut=true)
                                 // true = plus court chemin (greedy distance)
                                 // false = priorité aux urgents + distance
    }
    
    Réponse:
    {
      "ordreOptimise": [2, 1, 3],
      "distanceTotale": 45.2,
      "tempsEstime": 120,
      "arrets": [
        {"id": 2, "lat": ..., "lon": ..., "ordre": 1},
        ...
      ]
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON required"}), 400

        zone = data.get("zone", "Tunis")
        commandes = data.get("commandes", [])
        commande_ids = data.get("commandeIds", [])
        depot_lat = data.get("depotLat")
        depot_lon = data.get("depotLon")

        # Dépôt: utiliser les coordonnées fournies, sinon celles du gouvernorat
        if depot_lat and depot_lon:
            depot = (float(depot_lat), float(depot_lon))
        else:
            depot = GPS_GOUVERNORATS.get(zone, GPS_GOUVERNORATS["Tunis"])

        # Si les commandes avec coords sont fournies, les utiliser
        stops = []
        if commandes:
            for c in commandes:
                lat = c.get("lat") or c.get("latitudeLivraison")
                lon = c.get("lon") or c.get("longitudeLivraison")
                # Fallback: coordonnées du gouvernorat de la commande
                if not lat or not lon:
                    gouv = c.get("gouvernorat") or c.get("gouvernoratLivraison") or zone
                    coords = GPS_GOUVERNORATS.get(gouv, depot)
                    lat, lon = coords
                    # Légère variation pour distinguer les stops du même gouvernorat
                    import random
                    lat += random.uniform(-0.02, 0.02)
                    lon += random.uniform(-0.02, 0.02)

                stops.append({
                    "id": c.get("id"),
                    "lat": float(lat),
                    "lon": float(lon),
                    "priorite": c.get("priorite", "NORMALE"),
                    "adresse": c.get("adresseLivraison", ""),
                    "ville": c.get("villeLivraison", ""),
                })
        elif commande_ids:
            # Fallback: distribuer autour du dépôt
            import random
            for i, cid in enumerate(commande_ids):
                angle = (2 * math.pi * i) / len(commande_ids)
                rayon = 0.03 + random.uniform(0, 0.02)
                stops.append({
                    "id": cid,
                    "lat": depot[0] + rayon * math.cos(angle),
                    "lon": depot[1] + rayon * math.sin(angle),
                    "priorite": "NORMALE",
                })

        if not stops:
            return jsonify({"error": "Aucune commande à optimiser"}), 400

        # ── Algorithme Nearest Neighbor — MODE DISTANCE OPTIMISÉE ────────
        # Par défaut: optimize_distance=True (plus court chemin)
        # Pour prioritaire: envoyer optimize_distance=False dans le body JSON
        optimize_distance = data.get("optimize_distance", True)
        ordre, distance_totale = nearest_neighbor(depot, stops, optimize_distance=optimize_distance)

        # Estimation du temps (vitesse moyenne 40 km/h en ville, 15 min/arrêt)
        temps_route = (distance_totale / 40) * 60   # minutes
        temps_arrets = len(stops) * 15               # 15 min par arrêt
        temps_total = round(temps_route + temps_arrets)

        ordre_ids = [s["id"] for s in ordre]

        # Prédiction ML si disponible
        score_ml = None
        if predictor is not None:
            try:
                result_ml = predictor.predict(distance_totale, len(stops))
                temps_total = result_ml.get("temps_estime_ml", temps_total)
                score_ml = result_ml.get("score_ml")
            except Exception:
                pass

        arrets = [
            {
                "id": s["id"],
                "lat": s["lat"],
                "lon": s["lon"],
                "ordre": i + 1,
                "priorite": s.get("priorite"),
                "adresse": s.get("adresse", ""),
                "distanceDepuisPrecedent": round(
                    haversine(
                        (ordre[i-1]["lat"] if i > 0 else depot[0]),
                        (ordre[i-1]["lon"] if i > 0 else depot[1]),
                        s["lat"], s["lon"]
                    ), 2
                ),
            }
            for i, s in enumerate(ordre)
        ]

        logger.info(f"✅ Optimisation: {len(stops)} arrêts, {distance_totale:.1f}km, {temps_total}min, MODE={'DISTANCE' if optimize_distance else 'PRIORITAIRE'}")

        return jsonify({
            "ordreOptimise": ordre_ids,
            "distanceTotale": round(distance_totale, 2),
            "tempsEstime": temps_total,
            "depot": {"lat": depot[0], "lon": depot[1], "zone": zone},
            "arrets": arrets,
            "score": score_ml,
            "algorithme": "Nearest Neighbor + " + ("Distance Optimisée" if optimize_distance else "Priority Sort + ML"),
        }), 200

    except Exception as e:
        logger.error(f"❌ Erreur optimiser-tournee: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/batch-predict", methods=["POST"])
def batch_predict():
    try:
        if predictor is None:
            return jsonify({"error": "ML model not loaded"}), 500
        data = request.get_json()
        if not isinstance(data, list):
            return jsonify({"error": "Expected array"}), 400
        results = [
            predictor.predict(float(item["distance_km"]), int(item["nb_commandes"]))
            for item in data if "distance_km" in item and "nb_commandes" in item
        ]
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🔧 TMS ML Optimizer v2.0 - Flask Server")
    print("="*60)
    print("📍 API:              http://localhost:5000")
    print("🏥 Health:           GET  http://localhost:5000/health")
    print("🤖 Predict:          POST http://localhost:5000/predict")
    print("🗺️  Optimiser tournée: POST http://localhost:5000/optimiser-tournee")
    print("="*60 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=True)