"""
Training Script
Generates synthetic training data and trains all ML models.
Run this once to create the model artifacts.
"""

import numpy as np
import os
import sys
import random

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from ml_pipeline.feature_extraction import FeatureExtractor, extract_handcrafted_features
from ml_pipeline.anomaly_detection import ReviewAnomalyDetector
from ml_pipeline.ensemble_classifier import EnsembleClassifier

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")

# --- Synthetic data generation ---

AUTHENTIC_TEMPLATES = [
    "I bought this product last month and it has been working great. The quality is decent for the price.",
    "Pretty good purchase overall. The delivery was on time and the product matches the description.",
    "Not bad, but not amazing either. It does what it's supposed to do. Would consider buying again.",
    "After using this for two weeks, I can say it's a solid product. Minor issues with packaging.",
    "Good value for money. My family loves using it. The design could be improved though.",
    "This exceeded my expectations. Build quality is excellent and customer service was responsive.",
    "Average product. It works fine but I've seen better alternatives at a similar price point.",
    "I ordered this as a gift and the recipient was really happy with it. Good quality materials.",
    "Decent quality for the price. It's not premium but gets the job done. Shipping was fast.",
    "Honestly, I'm quite pleased with this purchase. It came well-packaged and works as described.",
    "The product is okay. Nothing special but it serves its purpose. Would give it 3.5 stars if I could.",
    "Really happy with this. My third purchase from this brand and they never disappoint.",
    "It took a while to arrive but the product itself is great. Sturdy construction and nice finish.",
    "I've been using this for about a month now. Works well, no complaints so far.",
    "Not what I expected honestly. The color was slightly different from the pictures. Otherwise okay.",
    "Great product! I compared it with many others before buying and this was the best option.",
    "The quality is satisfactory. I would recommend it to friends who are looking for something basic.",
    "This is my second one because the first lasted over 3 years. That says a lot about the quality.",
    "Fair price and decent quality. Assembly instructions could have been clearer though.",
    "I researched this for weeks before purchasing. Glad I made the choice, it works perfectly.",
    "My experience has been mostly positive. The product is well-made and functional.",
    "Ordered for my home office setup. Fits perfectly and the quality is above average for the price.",
    "Took a star off because shipping was delayed, but the actual product is excellent.",
    "Good enough for everyday use. Don't expect luxury quality at this price but it's reliable.",
    "I was skeptical at first but this product proved me wrong. Solid build and great performance.",
    "The packaging was a bit damaged but the product inside was fine. Works as advertised.",
    "Compared to similar products I've tried, this one stands out for its durability.",
    "It's a simple product that does its job well. No frills but no issues either.",
    "Very practical purchase. I use it daily and it has held up well over the past few months.",
    "Would definitely purchase again. The quality-to-price ratio is hard to beat.",
]

FAKE_TEMPLATES = [
    "BEST PRODUCT EVER!!!!! BUY NOW BUY NOW BUY NOW!!!!! 5 stars is not enough!!!!!",
    "This product changed my life completely!!! I cannot believe how amazing it is!!!!! Perfect in every way!!!!!",
    "Amazing amazing amazing!! Best purchase I have ever made in my entire life!! Everyone must buy this!!",
    "I got this for free to review and wow it is the most incredible thing!! 5 stars definitely!!",
    "Perfect perfect perfect! Nothing wrong at all! Best best best! Everyone needs this product!!!",
    "This product is absolutely terrible do not buy!! Worst thing ever!! Complete scam!!!! Avoid avoid avoid!!",
    "DO NOT BUY THIS PRODUCT!! It broke immediately!! Scam!! Reported to authorities!! BEWARE!!",
    "Horrible product horrible seller horrible everything!! I want my money back right now!!!! SCAM ALERT!!!!",
    "Wow just wow this product is so so so amazing I can't even describe how perfect it is wow!!",
    "Best product best price best quality best everything!! Nothing compares!! Must have!! Buy immediately!!",
    "I have never been so satisfied with any product before. This is literally perfection. 10 out of 10.",
    "SCAM SCAM SCAM!! Do not purchase!! They will steal your money!! BEWARE OF THIS SELLER!!",
    "Greatest invention of the century!! This will revolutionize everything!! Buy now before stock runs out!!",
    "This product cured all my problems!! Incredible results within minutes!! Unbelievable!!",
    "I bought 10 of these because they are so amazing!! Everyone in my family got one!! Perfect gift!!",
    "WORST PRODUCT ON THE MARKET!! ZERO STARS IF I COULD!! ABSOLUTELY DISGUSTING QUALITY!!",
    "OMG OMG OMG this is SO good!! I'm literally crying because of how perfect this product is!!",
    "This seller is a fraud!! Product is fake!! Contact customer service they won't respond!!",
    "Five stars five stars five stars!! Best purchase ever made!! Thank you seller!! Amazing!!",
    "Incredible product incredible price incredible quality!! I recommend to everyone!! Buy buy buy!!",
    "Total garbage! I want a full refund! This should be illegal to sell! Disgusting!",
    "The best the best the best!! I've told all my friends and they all agree!! Must buy!!",
    "WARNING: DO NOT BUY THIS!! It exploded on first use!! Dangerous product!! Report this listing!!",
    "I am a verified buyer and this product is 100% perfect with zero defects whatsoever absolutely flawless",
    "Buy this now! Limited stock! Best deal ever! You won't find anything better anywhere! Act fast!",
    "This product is sent from heaven!! Angels made this!! I feel blessed to own it!! Hallelujah!!",
    "Fake product fake reviews fake seller!! Everything about this listing is a lie!! Boycott!!",
    "I work for a review company and even I think this product is genuinely the best in its category!!",
    "Absolutely positively the greatest most wonderful fantastic product that has ever existed in history!!",
    "My neighbor my friend my sister my mom all use this product and we ALL give it 5 stars!! Amazing!!",
]


def generate_training_data(n_samples: int = 800):
    """Generate synthetic training data with authentic and fake reviews."""
    print(f"Generating {n_samples} synthetic training samples...")

    reviews = []
    labels = []  # 0 = authentic, 1 = fake
    ratings = []

    half = n_samples // 2

    # Generate authentic reviews
    for i in range(half):
        template = random.choice(AUTHENTIC_TEMPLATES)
        # Add small variations
        variations = [
            f"{template} Overall rating: good.",
            f"Update: {template}",
            f"{template} Will update my review later.",
            template,
            f"After careful consideration, {template.lower()}",
        ]
        review = random.choice(variations)
        reviews.append(review)
        labels.append(0)
        ratings.append(random.choice([3, 4, 5, 4, 3, 4, 5]))

    # Generate fake reviews
    for i in range(n_samples - half):
        template = random.choice(FAKE_TEMPLATES)
        # Add repetition patterns (common in fake reviews)
        variations = [
            template,
            f"{template} {template}",
            template.upper(),
            f"{'! '.join(template.split('!'))}!",
            template.replace("!", "!!!"),
        ]
        review = random.choice(variations)
        reviews.append(review)
        labels.append(1)
        # Fake reviews tend to be extreme ratings
        ratings.append(random.choice([1, 1, 5, 5, 5, 5, 1]))

    return reviews, np.array(labels), ratings


def train_all_models():
    """Train all ML models and save them."""
    os.makedirs(MODEL_DIR, exist_ok=True)

    print("=" * 60)
    print("  FAKE REVIEW DETECTION - MODEL TRAINING")
    print("=" * 60)

    # 1. Generate training data
    reviews, labels, ratings = generate_training_data(800)
    print(f"  Generated {len(reviews)} training samples")
    print(f"  Authentic: {sum(labels == 0)}, Fake: {sum(labels == 1)}")

    # 2. Feature extraction
    print("\n[1/4] Training Feature Extractor (TF-IDF)...")
    feature_extractor = FeatureExtractor()
    feature_extractor.fit(reviews)
    X = feature_extractor.transform(reviews)
    print(f"  Feature matrix shape: {X.shape}")
    feature_extractor.save()
    print("  Saved TF-IDF vectorizer.")

    # 3. Anomaly detection
    print("\n[2/4] Training Anomaly Detector (Isolation Forest)...")
    anomaly_detector = ReviewAnomalyDetector(contamination=0.1)
    anomaly_detector.fit(X)
    anomaly_detector.save()
    print("  Saved anomaly detector.")

    # 4. Ensemble classifier
    print("\n[3/4] Training Ensemble Classifier...")
    ensemble = EnsembleClassifier()
    ensemble.fit(X, labels)
    ensemble.save()
    print("  Saved ensemble models.")

    # 5. Evaluate on training data (basic check)
    print("\n[4/4] Quick Training Accuracy Check...")
    predictions = ensemble.predict(X)
    accuracy = np.mean(predictions == labels)
    print(f"  Training accuracy: {accuracy:.4f}")

    # Check individual models
    from sklearn.metrics import classification_report
    print("\n  Classification Report (Training Set):")
    print(classification_report(labels, predictions, target_names=["Authentic", "Fake"]))

    print("=" * 60)
    print("  ALL MODELS TRAINED AND SAVED SUCCESSFULLY!")
    print(f"  Model directory: {MODEL_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    random.seed(42)
    np.random.seed(42)
    train_all_models()
