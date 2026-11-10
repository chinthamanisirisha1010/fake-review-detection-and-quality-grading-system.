"""
Feature Extraction Module
Processes text reviews to extract TF-IDF features and handcrafted linguistic features.
"""

import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import os

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")


def preprocess_text(text: str) -> str:
    """Clean and normalize review text."""
    text = text.lower().strip()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)  # Remove URLs
    text = re.sub(r"[^a-zA-Z0-9\s.,!?']", "", text)  # Keep basic punctuation
    text = re.sub(r"\s+", " ", text).strip()  # Collapse whitespace
    return text


def extract_handcrafted_features(text: str) -> dict:
    """
    Extract linguistic / statistical features from a single review.
    Returns a dictionary of features.
    """
    words = text.split()
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]

    word_count = len(words)
    char_count = len(text)
    avg_word_length = np.mean([len(w) for w in words]) if words else 0
    sentence_count = max(len(sentences), 1)
    avg_sentence_length = word_count / sentence_count

    # Caps ratio
    caps_count = sum(1 for c in text if c.isupper())
    caps_ratio = caps_count / max(char_count, 1)

    # Exclamation / question marks
    exclamation_count = text.count("!")
    question_count = text.count("?")

    # Unique word ratio (lexical diversity)
    unique_words = set(w.lower() for w in words)
    unique_ratio = len(unique_words) / max(word_count, 1)

    # Digit ratio
    digit_count = sum(1 for c in text if c.isdigit())
    digit_ratio = digit_count / max(char_count, 1)

    # Repeated consecutive words ratio
    repeated_pairs = sum(
        1 for i in range(len(words) - 1) if words[i].lower() == words[i + 1].lower()
    )
    repeated_ratio = repeated_pairs / max(word_count - 1, 1)

    return {
        "word_count": word_count,
        "char_count": char_count,
        "avg_word_length": round(avg_word_length, 4),
        "sentence_count": sentence_count,
        "avg_sentence_length": round(avg_sentence_length, 4),
        "caps_ratio": round(caps_ratio, 4),
        "exclamation_count": exclamation_count,
        "question_count": question_count,
        "unique_word_ratio": round(unique_ratio, 4),
        "digit_ratio": round(digit_ratio, 4),
        "repeated_word_ratio": round(repeated_ratio, 4),
    }


class FeatureExtractor:
    """Combines TF-IDF and handcrafted features for review analysis."""

    def __init__(self):
        self.tfidf = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.95,
            sublinear_tf=True,
        )
        self._fitted = False

    def fit(self, texts: list[str]):
        """Fit TF-IDF vectorizer on training texts."""
        cleaned = [preprocess_text(t) for t in texts]
        self.tfidf.fit(cleaned)
        self._fitted = True

    def transform(self, texts: list[str]) -> np.ndarray:
        """Transform texts into combined feature vectors."""
        if not self._fitted:
            # Auto-fit on provided texts (for inference mode with saved model)
            self.fit(texts)

        cleaned = [preprocess_text(t) for t in texts]
        tfidf_matrix = self.tfidf.transform(cleaned).toarray()

        # Extract handcrafted features
        handcrafted_list = []
        for text in texts:
            feats = extract_handcrafted_features(text)
            handcrafted_list.append(list(feats.values()))

        handcrafted_matrix = np.array(handcrafted_list)

        # Combine TF-IDF + handcrafted features
        combined = np.hstack([tfidf_matrix, handcrafted_matrix])
        return combined

    def save(self, path: str = None):
        """Save the fitted TF-IDF vectorizer."""
        if path is None:
            os.makedirs(MODEL_DIR, exist_ok=True)
            path = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
        joblib.dump(self.tfidf, path)

    def load(self, path: str = None):
        """Load a pre-fitted TF-IDF vectorizer."""
        if path is None:
            path = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
        self.tfidf = joblib.load(path)
        self._fitted = True
