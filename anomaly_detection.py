"""
Anomaly Detection Module
Uses Isolation Forest to flag statistically unusual review patterns.
"""

import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")


class ReviewAnomalyDetector:
    """
    Isolation Forest-based anomaly detector for review patterns.
    Detects unusual reviews such as repetitive text, suspicious timing,
    or statistical outliers in feature space.
    """

    def __init__(self, contamination: float = 0.1, random_state: int = 42):
        self.model = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            random_state=random_state,
            max_samples="auto",
            bootstrap=True,
        )
        self._fitted = False

    def fit(self, features: np.ndarray):
        """Fit the anomaly detector on training feature matrix."""
        self.model.fit(features)
        self._fitted = True

    def predict(self, features: np.ndarray) -> dict:
        """
        Predict anomaly scores for review features.
        Returns anomaly labels, scores, and flags.
        """
        if not self._fitted:
            # Return default (not anomalous) if not fitted
            n = features.shape[0] if len(features.shape) > 1 else 1
            return {
                "is_anomaly": [False] * n,
                "anomaly_score": [0.0] * n,
                "anomaly_confidence": [0.0] * n,
            }

        # Isolation Forest: -1 = anomaly, 1 = normal
        labels = self.model.predict(features)
        scores = self.model.decision_function(features)

        # Convert to boolean flags and normalize scores
        is_anomaly = [bool(l == -1) for l in labels]

        # Normalize anomaly score to 0-1 (higher = more anomalous)
        min_score = scores.min() if len(scores) > 1 else -0.5
        max_score = scores.max() if len(scores) > 1 else 0.5
        score_range = max(max_score - min_score, 1e-6)
        normalized_scores = [
            round(1.0 - (s - min_score) / score_range, 4) for s in scores
        ]

        # Confidence: how far from the decision boundary
        anomaly_confidence = [round(min(abs(s) * 2, 1.0), 4) for s in scores]

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": normalized_scores,
            "anomaly_confidence": anomaly_confidence,
        }

    def predict_single(self, features: np.ndarray) -> dict:
        """Predict for a single review. Features should be a 1D or 2D array."""
        if features.ndim == 1:
            features = features.reshape(1, -1)

        result = self.predict(features)
        return {
            "is_anomaly": result["is_anomaly"][0],
            "anomaly_score": result["anomaly_score"][0],
            "anomaly_confidence": result["anomaly_confidence"][0],
        }

    def save(self, path: str = None):
        """Save the fitted model."""
        if path is None:
            os.makedirs(MODEL_DIR, exist_ok=True)
            path = os.path.join(MODEL_DIR, "anomaly_detector.pkl")
        joblib.dump(self.model, path)

    def load(self, path: str = None):
        """Load a pre-fitted model."""
        if path is None:
            path = os.path.join(MODEL_DIR, "anomaly_detector.pkl")
        self.model = joblib.load(path)
        self._fitted = True
