# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
import os

def generer_donnees_simulees(n_samples=500):
    np.random.seed(42)
    data = {"distance_km": [], "nb_commandes": [], "temps_reel_minutes": [], "cout_reel_dt": []}
    for _ in range(n_samples):
        distance = np.random.normal(loc=85, scale=25)
        distance = max(30, min(200, distance))
        nb_commandes = np.random.randint(3, 9)
        temps_base = (distance / 50) * 60
        temps_arrets = nb_commandes * 15
        facteur_traffic = np.random.uniform(0.9, 1.3)
        facteur_experience = np.random.uniform(0.95, 1.05)
        temps_reel = (temps_base + temps_arrets) * facteur_traffic * facteur_experience
        temps_reel = max(45, min(500, temps_reel))
        cout_carburant = distance * 0.85
        cout_chauffeur = (temps_reel / 60) * 12
        cout_reel = cout_carburant + cout_chauffeur
        data["distance_km"].append(round(distance, 2))
        data["nb_commandes"].append(nb_commandes)
        data["temps_reel_minutes"].append(int(temps_reel))
        data["cout_reel_dt"].append(round(cout_reel, 2))
    os.makedirs("data", exist_ok=True)
    df = pd.DataFrame(data)
    df.to_csv("data/training_data.csv", index=False)
    print(f"✅ {n_samples} données générées → data/training_data.csv")

if __name__ == "__main__":
    generer_donnees_simulees(500)
