# -*- coding: utf-8 -*-
import joblib
import numpy as np
import os
import sys

class MLPredictor:
    def __init__(self):
        if not os.path.exists("models/model.pkl") or not os.path.exists("models/scaler.pkl"):
            raise FileNotFoundError("❌ Modèle non trouvé. Exécutez: python train_model.py")
        self.model = joblib.load("models/model.pkl")
        self.scaler = joblib.load("models/scaler.pkl")
        self.VITESSE_MOYENNE = 50.0
        self.TEMPS_ARRET = 15
        self.COUT_KM = 0.85
        self.COUT_HEURE = 12.0
    
    def predict(self, distance_km, nb_commandes):
        try:
            if distance_km <= 0 or nb_commandes <= 0:
                raise ValueError("Valeurs invalides")
            temps_simple = (distance_km / self.VITESSE_MOYENNE) * 60 + nb_commandes * self.TEMPS_ARRET
            cout_simple = distance_km * self.COUT_KM + (temps_simple / 60) * self.COUT_HEURE
            X_input = np.array([[distance_km, nb_commandes]])
            X_scaled = self.scaler.transform(X_input)
            temps_ml = self.model.predict(X_scaled)[0]
            facteur = temps_ml / temps_simple if temps_simple > 0 else 1.0
            cout_ml = distance_km * self.COUT_KM + (temps_ml / 60) * self.COUT_HEURE
            return {
                "temps_estime_simple": int(temps_simple),
                "temps_estime_ml": int(temps_ml),
                "cout_estime_simple": round(cout_simple, 2),
                "cout_estime_ml": round(cout_ml, 2),
                "facteur_correction": round(facteur, 3),
                "distance_km": distance_km,
                "nb_commandes": nb_commandes,
                "status": "success"
            }
        except Exception as e:
            return {"error": str(e), "status": "error", "distance_km": distance_km, "nb_commandes": nb_commandes}

try:
    predictor = MLPredictor()
except Exception as e:
    print(f"❌ Erreur: {e}")
    predictor = None
