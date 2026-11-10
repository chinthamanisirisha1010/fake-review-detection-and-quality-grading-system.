"""
Quality Grading Module
Computes a final quality grade (A-F) based on aggregated authentic review analysis.
"""


def compute_quality_grade(
    authentic_probability: float,
    sentiment_polarity: float,
    mismatch_score: float,
    anomaly_score: float,
    star_rating: int,
) -> dict:
    """
    Compute a quality grade for the product review.

    Scoring breakdown:
    - Authenticity score (40%): How likely the review is genuine
    - Sentiment consistency (20%): How well sentiment matches rating
    - Anomaly score (20%): Lower anomaly = better (inverted)
    - Rating weight (20%): Star rating normalized

    Returns grade (A-F), numeric score, and breakdown.
    """
    # Authenticity component (0-100)
    auth_score = authentic_probability * 100

    # Sentiment consistency (0-100): inverse of mismatch
    consistency_score = (1.0 - mismatch_score) * 100

    # Anomaly component (0-100): inverse of anomaly score
    anomaly_component = (1.0 - anomaly_score) * 100

    # Star rating component (0-100)
    rating_component = (star_rating / 5.0) * 100

    # Weighted final score
    final_score = (
        0.40 * auth_score
        + 0.20 * consistency_score
        + 0.20 * anomaly_component
        + 0.20 * rating_component
    )

    # Clamp to 0-100
    final_score = max(0, min(100, final_score))

    # Map to letter grade
    if final_score >= 90:
        grade = "A"
        grade_label = "Excellent"
        grade_color = "#10b981"
    elif final_score >= 80:
        grade = "B"
        grade_label = "Good"
        grade_color = "#3b82f6"
    elif final_score >= 65:
        grade = "C"
        grade_label = "Average"
        grade_color = "#f59e0b"
    elif final_score >= 50:
        grade = "D"
        grade_label = "Below Average"
        grade_color = "#f97316"
    else:
        grade = "F"
        grade_label = "Poor"
        grade_color = "#ef4444"

    return {
        "grade": grade,
        "grade_label": grade_label,
        "grade_color": grade_color,
        "numeric_score": round(final_score, 2),
        "breakdown": {
            "authenticity": round(auth_score, 2),
            "sentiment_consistency": round(consistency_score, 2),
            "anomaly_safety": round(anomaly_component, 2),
            "rating_component": round(rating_component, 2),
        },
        "weights": {
            "authenticity": 0.40,
            "sentiment_consistency": 0.20,
            "anomaly_safety": 0.20,
            "rating_component": 0.20,
        },
    }
