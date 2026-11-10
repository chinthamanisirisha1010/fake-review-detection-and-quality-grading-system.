"""
Ensemble Classifier Module
Combines Logistic Regression, Random Forest, and XGBoost for fake review detection.
"""

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
import joblib
import os

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")


class EnsembleClassifier:
    """
    Ensemble classifier combining Logistic Regression, Random Forest, and XGBoost.
    Uses soft voting (probability averaging) for final prediction.
    """

    def __init__(self):
        self.logistic = LogisticRegression(
            max_iter=1000,
            C=1.0,
            class_weight="balanced",
            random_state=42,
            solver="lbfgs",
        )
        self.random_forest = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )
        self.xgboost = XGBClassifier(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.1,
            random_state=42,
            use_label_encoder=False,
            eval_metric="logloss",
            scale_pos_weight=1.0,
        )
        # Weights for ensemble (can be tuned based on validation performance)
        self.weights = {
            "logistic": 0.25,
            "random_forest": 0.35,
            "xgboost": 0.40,
        }
        self._fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray):
        """Train all three classifiers."""
        print("  Training Logistic Regression...")
        self.logistic.fit(X, y)
        print("  Training Random Forest...")
        self.random_forest.fit(X, y)
        print("  Training XGBoost...")
        self.xgboost.fit(X, y)
        self._fitted = True
        print("  Ensemble training complete.")

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Get weighted average probability predictions from all models.
        Returns probabilities for [Authentic, Fake].
        """
        if not self._fitted:
            # Return 50/50 default
            n = X.shape[0]
            return np.full((n, 2), 0.5)

        prob_lr = self.logistic.predict_proba(X)
        prob_rf = self.random_forest.predict_proba(X)
        prob_xgb = self.xgboost.predict_proba(X)

        # Weighted average
        weighted_prob = (
            self.weights["logistic"] * prob_lr
            + self.weights["random_forest"] * prob_rf
            + self.weights["xgboost"] * prob_xgb
        )
        return weighted_prob

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict class labels (0 = Authentic, 1 = Fake)."""
        proba = self.predict_proba(X)
        return (proba[:, 1] >= 0.5).astype(int)

    def predict_single(self, X: np.ndarray) -> dict:
        """
        Predict for a single review.
        Returns detailed breakdown of each model's opinion.
        """
        if X.ndim == 1:
            X = X.reshape(1, -1)

        proba = self.predict_proba(X)[0]
        prediction = int(proba[1] >= 0.5)

        # Individual model probabilities for transparency
        individual = {}
        if self._fitted:
            individual["logistic_regression"] = {
                "authentic_prob": round(float(self.logistic.predict_proba(X)[0][0]), 4),
                "fake_prob": round(float(self.logistic.predict_proba(X)[0][1]), 4),
            }
            individual["random_forest"] = {
                "authentic_prob": round(float(self.random_forest.predict_proba(X)[0][0]), 4),
                "fake_prob": round(float(self.random_forest.predict_proba(X)[0][1]), 4),
            }
            individual["xgboost"] = {
                "authentic_prob": round(float(self.xgboost.predict_proba(X)[0][0]), 4),
                "fake_prob": round(float(self.xgboost.predict_proba(X)[0][1]), 4),
            }

        return {
            "prediction": "fake" if prediction == 1 else "authentic",
            "authentic_probability": round(float(proba[0]), 4),
            "fake_probability": round(float(proba[1]), 4),
            "individual_models": individual,
        }

    def save(self, path: str = None):
        """Save all three models."""
        if path is None:
            os.makedirs(MODEL_DIR, exist_ok=True)
            path = MODEL_DIR
        joblib.dump(self.logistic, os.path.join(path, "logistic_regression.pkl"))
        joblib.dump(self.random_forest, os.path.join(path, "random_forest.pkl"))
        joblib.dump(self.xgboost, os.path.join(path, "xgboost_model.pkl"))
        joblib.dump(self.weights, os.path.join(path, "ensemble_weights.pkl"))

    def load(self, path: str = None):
        """Load all three models."""
        if path is None:
            path = MODEL_DIR
        self.logistic = joblib.load(os.path.join(path, "logistic_regression.pkl"))
        self.random_forest = joblib.load(os.path.join(path, "random_forest.pkl"))
        self.xgboost = joblib.load(os.path.join(path, "xgboost_model.pkl"))
        self.weights = joblib.load(os.path.join(path, "ensemble_weights.pkl"))
        self._fitted = True
