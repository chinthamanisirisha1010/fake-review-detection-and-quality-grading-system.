"""
Sentiment Analysis Module
Determines if the review sentiment matches the given star rating.
"""

from textblob import TextBlob
import numpy as np


def analyze_sentiment(text: str) -> dict:
    """
    Perform sentiment analysis on review text.
    Returns polarity (-1 to 1), subjectivity (0 to 1), and derived label.
    """
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity  # -1 (negative) to 1 (positive)
    subjectivity = blob.sentiment.subjectivity  # 0 (objective) to 1 (subjective)

    # Map polarity to a descriptive label
    if polarity > 0.3:
        label = "positive"
    elif polarity < -0.3:
        label = "negative"
    else:
        label = "neutral"

    return {
        "polarity": round(polarity, 4),
        "subjectivity": round(subjectivity, 4),
        "label": label,
    }


def compute_sentiment_rating_mismatch(polarity: float, star_rating: int) -> dict:
    """
    Check if the sentiment matches the star rating.
    Returns a mismatch score (0 = perfect match, 1 = total mismatch)
    and a boolean flag.
    """
    # Normalize star rating (1-5) to polarity scale (-1 to 1)
    expected_polarity = (star_rating - 3) / 2.0  # 1->-1, 3->0, 5->1

    # Calculate mismatch
    mismatch_score = abs(polarity - expected_polarity)

    # Normalize to 0-1 range (max possible mismatch is 2.0)
    normalized_mismatch = min(mismatch_score / 2.0, 1.0)

    # Flag if mismatch exceeds threshold
    is_mismatched = normalized_mismatch > 0.4

    return {
        "mismatch_score": round(normalized_mismatch, 4),
        "is_mismatched": is_mismatched,
        "expected_polarity": round(expected_polarity, 4),
        "actual_polarity": round(polarity, 4),
    }


def get_sentiment_features(text: str, star_rating: int) -> dict:
    """
    Complete sentiment analysis with mismatch detection.
    Returns all sentiment-related features.
    """
    sentiment = analyze_sentiment(text)
    mismatch = compute_sentiment_rating_mismatch(sentiment["polarity"], star_rating)

    return {
        "sentiment_polarity": sentiment["polarity"],
        "sentiment_subjectivity": sentiment["subjectivity"],
        "sentiment_label": sentiment["label"],
        "mismatch_score": mismatch["mismatch_score"],
        "is_sentiment_mismatched": mismatch["is_mismatched"],
        "expected_polarity": mismatch["expected_polarity"],
    }
