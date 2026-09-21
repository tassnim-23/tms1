# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
import os
import sys
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import joblib

def train_model():
    os.makedirs("models", exist_ok=True)
    if not os.path.exists("data/training_data.csv"):
        print("❌ data/training_data.csv n'existe pas! Exécutez: python generate_data.py")
        sys.exit(1)
    df = pd.read_csv("data/training_data.csv")
    print(f"📊 Chargement {len(df)} données...")
    X = df[["distance_km", "nb_commandes"]].values
    y = df["temps_reel_minutes"].values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    model = LinearRegression()
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    print(f"🎯 RMSE: {rmse:.2f}min, R²: {r2:.3f}")
    joblib.dump(model, "models/model.pkl")
    joblib.dump(scaler, "models/scaler.pkl")
    print("✅ Modèle sauvegardé → models/")

if __name__ == "__main__":
    train_model()
