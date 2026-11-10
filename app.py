"""
Flask Backend API
RESTful endpoints for the Fake Review Detection and Quality Grading System.
"""

import os
import sys
import traceback
import mimetypes
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

from ml_pipeline.feature_extraction import (
    FeatureExtractor,
    extract_handcrafted_features,
    preprocess_text,
)
from ml_pipeline.sentiment_analysis import get_sentiment_features
from ml_pipeline.anomaly_detection import ReviewAnomalyDetector
from ml_pipeline.ensemble_classifier import EnsembleClassifier
from ml_pipeline.quality_grading import compute_quality_grade

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app)

# --- Load models on startup ---
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

feature_extractor = FeatureExtractor()
anomaly_detector = ReviewAnomalyDetector()
ensemble_classifier = EnsembleClassifier()

models_loaded = False

def load_models():
    """Load pre-trained models from disk."""
    global models_loaded
    try:
        feature_extractor.load()
        anomaly_detector.load()
        ensemble_classifier.load()
        models_loaded = True
        print("[✓] All models loaded successfully.")
    except FileNotFoundError as e:
        print(f"[!] Models not found: {e}")
        print("[!] Run 'python ml_pipeline/train.py' to train models first.")
        models_loaded = False
    except Exception as e:
        print(f"[!] Error loading models: {e}")
        models_loaded = False


# Load on import
load_models()


# --- Frontend Routes ---
@app.route("/")
def serve_frontend():
    """Serve the frontend application."""
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    """Serve static files (CSS, JS, etc.)."""
    return send_from_directory(FRONTEND_DIR, filename)


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "models_loaded": models_loaded,
        "version": "1.0.0",
    })


@app.route("/api/analyze", methods=["POST"])
def analyze_review():
    """
    Analyze a single review for authenticity.

    Expected JSON payload:
    {
        "review_text": "This product is amazing!",
        "star_rating": 5,
        "user_id": "user123"  (optional)
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        review_text = data.get("review_text", "").strip()
        star_rating = data.get("star_rating", 3)
        user_id = data.get("user_id", "anonymous")

        # Validate inputs
        if not review_text:
            return jsonify({"error": "review_text is required"}), 400

        if not isinstance(star_rating, int) or star_rating < 1 or star_rating > 5:
            return jsonify({"error": "star_rating must be an integer between 1 and 5"}), 400

        if not models_loaded:
            return jsonify({"error": "Models not loaded. Run training first."}), 503

        # --- 1. Feature Extraction ---
        features = feature_extractor.transform([review_text])
        handcrafted = extract_handcrafted_features(review_text)

        # --- 2. Sentiment Analysis ---
        sentiment = get_sentiment_features(review_text, star_rating)

        # --- 3. Anomaly Detection ---
        anomaly_result = anomaly_detector.predict_single(features[0])

        # --- 4. Ensemble Classification ---
        classification = ensemble_classifier.predict_single(features[0])

        # --- 5. Quality Grading ---
        quality = compute_quality_grade(
            authentic_probability=classification["authentic_probability"],
            sentiment_polarity=sentiment["sentiment_polarity"],
            mismatch_score=sentiment["mismatch_score"],
            anomaly_score=anomaly_result["anomaly_score"],
            star_rating=star_rating,
        )

        # --- Build response ---
        response = {
            "success": True,
            "input": {
                "review_text": review_text,
                "star_rating": star_rating,
                "user_id": user_id,
                "processed_text": preprocess_text(review_text),
            },
            "classification": {
                "prediction": classification["prediction"],
                "authentic_probability": classification["authentic_probability"],
                "fake_probability": classification["fake_probability"],
                "individual_models": classification["individual_models"],
            },
            "sentiment": {
                "polarity": sentiment["sentiment_polarity"],
                "subjectivity": sentiment["sentiment_subjectivity"],
                "label": sentiment["sentiment_label"],
                "mismatch_score": sentiment["mismatch_score"],
                "is_mismatched": sentiment["is_sentiment_mismatched"],
            },
            "anomaly": {
                "is_anomaly": anomaly_result["is_anomaly"],
                "anomaly_score": anomaly_result["anomaly_score"],
                "confidence": anomaly_result["anomaly_confidence"],
            },
            "quality_grade": {
                "grade": quality["grade"],
                "label": quality["grade_label"],
                "color": quality["grade_color"],
                "score": quality["numeric_score"],
                "breakdown": quality["breakdown"],
                "weights": quality["weights"],
            },
            "text_features": handcrafted,
        }

        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/batch-analyze", methods=["POST"])
def batch_analyze():
    """
    Analyze multiple reviews at once.

    Expected JSON payload:
    {
        "reviews": [
            {"review_text": "...", "star_rating": 5, "user_id": "user1"},
            {"review_text": "...", "star_rating": 3, "user_id": "user2"}
        ]
    }
    """
    try:
        data = request.get_json()
        if not data or "reviews" not in data:
            return jsonify({"error": "reviews array is required"}), 400

        reviews = data["reviews"]
        if len(reviews) > 50:
            return jsonify({"error": "Maximum 50 reviews per batch"}), 400

        results = []
        for review_data in reviews:
            review_text = review_data.get("review_text", "").strip()
            star_rating = review_data.get("star_rating", 3)

            if not review_text:
                results.append({"error": "Empty review text", "success": False})
                continue

            star_rating = max(1, min(5, int(star_rating)))

            # Run through pipeline
            features = feature_extractor.transform([review_text])
            sentiment = get_sentiment_features(review_text, star_rating)
            anomaly_result = anomaly_detector.predict_single(features[0])
            classification = ensemble_classifier.predict_single(features[0])
            quality = compute_quality_grade(
                authentic_probability=classification["authentic_probability"],
                sentiment_polarity=sentiment["sentiment_polarity"],
                mismatch_score=sentiment["mismatch_score"],
                anomaly_score=anomaly_result["anomaly_score"],
                star_rating=star_rating,
            )

            results.append({
                "success": True,
                "review_text": review_text[:100] + "..." if len(review_text) > 100 else review_text,
                "prediction": classification["prediction"],
                "authentic_probability": classification["authentic_probability"],
                "fake_probability": classification["fake_probability"],
                "sentiment_label": sentiment["sentiment_label"],
                "is_anomaly": anomaly_result["is_anomaly"],
                "grade": quality["grade"],
                "score": quality["numeric_score"],
            })

        return jsonify({
            "success": True,
            "count": len(results),
            "results": results,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  FAKE REVIEW DETECTION API SERVER")
    print("=" * 60)
    print(f"  Models loaded: {models_loaded}")
    print(f"  Server: http://localhost:5000")
    print("=" * 60 + "\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
