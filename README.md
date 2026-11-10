Fake Review Detection & Quality Grading System

<p align="center">
  <strong>Machine Learning • NLP • Sentiment Analysis • Review Quality Assessment</strong>
</p>
<p align="center">
  A machine learning-based system for detecting fake reviews and evaluating the quality of online reviews.
</p>

⸻

📌 About the Project

The Fake Review Detection and Quality Grading System is a machine learning and Natural Language Processing (NLP) based application designed to identify fake or genuine online reviews and evaluate their overall quality.

The system analyzes review text using multiple techniques such as text feature extraction, sentiment analysis, anomaly detection, and machine learning classification. Based on the analysis, it predicts whether a review is suspicious and provides a quality score/grade.

The goal is to help users identify more trustworthy and informative reviews.

⸻

✨ Features

* 🤖 Fake Review Detection
* ✅ Genuine Review Classification
* 📝 NLP-Based Text Analysis
* 😊 Sentiment Analysis
* 🚨 Anomaly Detection
* ⭐ Review Quality Grading
* 📊 Quality Score Generation
* 🌐 Interactive Web Interface
* 🔌 API Support
* 🧠 Multiple Machine Learning Models

⸻

🛠️ Technologies Used

Technology	Purpose
🐍 Python	Backend & ML development
🤖 Scikit-learn	Machine learning
🚀 XGBoost	Classification
🧠 NLTK	Natural Language Processing
📊 NumPy	Numerical processing
🐼 Pandas	Data processing
🌐 Flask	Web/API backend
HTML	Frontend structure
CSS	Frontend styling
JavaScript	Frontend interaction
Joblib	Model loading & storage

⸻

🧠 Machine Learning Components

1. Feature Extraction

Extracts meaningful features from review text for machine learning analysis.

2. Sentiment Analysis

Determines the sentiment of the review, such as:

* Positive
* Negative
* Neutral

3. Anomaly Detection

Identifies unusual patterns in reviews that may indicate suspicious activity.

4. Ensemble Classification

Combines predictions from multiple machine learning models to improve classification.

5. Quality Grading

Evaluates the characteristics of a review and generates a quality score/grade.

⸻

🔄 System Workflow

                    USER REVIEW
                         │
                         ▼
                TEXT PREPROCESSING
                         │
                         ▼
                FEATURE EXTRACTION
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     SENTIMENT       ANOMALY          TEXT
     ANALYSIS        DETECTION       ANALYSIS
          │              │              │
          └──────────────┼──────────────┘
                         ▼
              MACHINE LEARNING MODELS
                         │
                         ▼
              FAKE / GENUINE PREDICTION
                         │
                         ▼
                  QUALITY ANALYSIS
                         │
                         ▼
                 QUALITY SCORE
                         │
                         ▼
                  FINAL RESULT

⸻

📁 Project Structure

Fake-Review-Detection/
│
├── app.py
├── requirements.txt
├── README.md
├── system_walkthrough.md
│
├── frontend/
│   ├── app.js
│   ├── index.html
│   ├── interactive-fx.js
│   ├── style.css
│   └── three-ui.js
│
├── ml_pipeline/
│   ├── _init_.py
│   ├── anomaly_detection.py
│   ├── ensemble_classifier.py
│   ├── feature_extraction.py
│   ├── quality_grading.py
│   ├── sentiment_analysis.py
│   └── train.py
│
└── models/
    ├── anomaly_detector.pkl
    ├── ensemble_weights.pkl
    ├── logistic_regression.pkl
    ├── random_forest.pkl
    ├── tfidf_vectorizer.pkl
    └── xgboost_model.pkl

⸻

⚙️ Installation

Step 1 — Clone the repository

git clone https://github.com/your-username/Fake-Review-Detection.git

Step 2 — Open the project

cd Fake-Review-Detection

Step 3 — Create a virtual environment

python -m venv .venv

Step 4 — Activate the environment

Windows:

.venv\Scripts\activate

Linux/macOS:

source .venv/bin/activate

Step 5 — Install dependencies

pip install -r requirements.txt

⸻

▶️ Running the Application

Run the Flask application:

python app.py

After starting the application, open the local URL displayed in the terminal.

⸻

🧪 Model Training

To train the machine learning models:

python ml_pipeline/train.py

The trained models are stored in the models/ directory.

⸻

📊 Example

Input

Review:
"The product is excellent and works exactly as described.
I am very happy with my purchase."
Rating:
★★★★★

Output

Review Classification : Genuine
Sentiment              : Positive
Quality Score          : High
Quality Grade          : A

The actual result depends on the trained models and input review.

⸻

🔌 API

Health Check

GET /api/health

Checks whether the application and required models are available.

Analyze Review

POST /api/analyze

Example request:

{
  "review_text": "The product is excellent and works perfectly.",
  "star_rating": 5
}

The system processes the review and returns the prediction and quality analysis.

⸻

🖥️ Screenshots

Add screenshots of your application here after uploading them to GitHub.

Example:

![Home Page](screenshots/home.png)
![Analysis Result](screenshots/result.png)

⸻

📈 Results

The system provides the following information for each review:

Result	Description
Review Type	Fake or Genuine
Sentiment	Positive, Negative, or Neutral
Quality Score	Numerical quality assessment
Quality Grade	Overall review quality

⸻

🔐 Security & GitHub Upload Guidelines

Do NOT upload:

.venv/
_pycache_/
.env
*.pyc

Never upload passwords, API keys, tokens, or other private information.

Create a .gitignore file containing:

.venv/
_pycache_/
*.pyc
.env

⸻

🚀 Future Enhancements

* 🌍 Support multiple languages
* 🧠 Integrate advanced transformer models such as BERT
* 🔎 Detect duplicate reviews
* 👤 Analyze reviewer behavior
* 📊 Add advanced visualization and analytics
* 🗄️ Add database integration
* ☁️ Deploy the application online
* 📱 Develop a mobile-friendly version
* ⚡ Improve prediction accuracy

⸻

🎓 Project Information

Project Type: Mini Project

Domain: Machine Learning & Natural Language Processing

Application: Fake Review Detection and Quality Assessment

⸻

👨‍💻 Team

Add your team members here:

1. C G sirisha
2. Mahima
3. Harsha vardhan
4. Krithika

⸻

📄 License

This project is developed for educational and academic purposes.
