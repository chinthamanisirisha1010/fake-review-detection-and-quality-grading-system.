/* ============================================
   ReviewGuard AI — Application Logic
   ============================================ */

const API_BASE = "http://localhost:5000/api";

// --- State ---
let currentRating = 4;
let isAnalyzing = false;

// --- Elements ---
const reviewTextEl = document.getElementById("reviewText");
const charCountEl = document.getElementById("charCount");
const analyzeBtnEl = document.getElementById("analyzeBtn");
const btnContentEl = document.getElementById("btnContent");
const btnLoadingEl = document.getElementById("btnLoading");
const resultsSectionEl = document.getElementById("resultsSection");
const statusDotEl = document.getElementById("statusDot");
const statusTextEl = document.getElementById("statusText");

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
    checkHealth();
    setupListeners();
    setRating(4);
});

// --- Health Check ---
async function checkHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        const data = await res.json();
        if (data.status === "healthy" && data.models_loaded) {
            statusDotEl.className = "status-dot online";
            statusTextEl.textContent = "Models Ready";
        } else {
            statusDotEl.className = "status-dot offline";
            statusTextEl.textContent = "Models Not Loaded";
        }
    } catch (e) {
        statusDotEl.className = "status-dot offline";
        statusTextEl.textContent = "API Offline";
    }
}

// --- Event Listeners ---
function setupListeners() {
    reviewTextEl.addEventListener("input", () => {
        charCountEl.textContent = reviewTextEl.value.length;
    });

    // Paste auto-analyze
    reviewTextEl.addEventListener("paste", () => {
        setTimeout(() => {
            charCountEl.textContent = reviewTextEl.value.length;
            if (reviewTextEl.value.trim().length > 10) {
                analyzeReview();
            }
        }, 100);
    });
}

// --- Star Rating ---
function setRating(rating) {
    currentRating = rating;
    const buttons = document.querySelectorAll(".star-btn");
    buttons.forEach((btn) => {
        const r = parseInt(btn.getAttribute("data-rating"));
        btn.classList.toggle("active", r <= rating);
    });
    document.getElementById("ratingLabel").textContent = `${rating} Star${rating > 1 ? "s" : ""}`;
}

// --- Clear ---
function clearAll() {
    reviewTextEl.value = "";
    charCountEl.textContent = "0";
    document.getElementById("userId").value = "";
    resultsSectionEl.style.display = "none";
    setRating(4);
}

// --- Load Example ---
function loadExample(type) {
    const examples = {
        authentic:
            "I bought this phone case about 3 weeks ago and overall I'm pretty satisfied. The material feels sturdy and the fit is snug on my Galaxy S24. The buttons are easy to press through the case. One minor gripe is that the matte finish picks up fingerprints more than I expected, but it's not a dealbreaker. Shipping took 5 days which was reasonable. For the price point, I think it's a solid buy. Would probably recommend to a friend looking for basic protection.",
        fake:
            "BEST PRODUCT EVER!!!!! OMG I CANNOT BELIEVE HOW AMAZING THIS IS!!!!! BUY BUY BUY!!!!! EVERYONE NEEDS THIS IN THEIR LIFE!!!!! 5 STARS IS NOT ENOUGH I WOULD GIVE 100 STARS IF I COULD!!!!! ABSOLUTELY PERFECT IN EVERY SINGLE WAY!!!!! THIS CHANGED MY ENTIRE LIFE!!!!! MUST HAVE MUST HAVE MUST HAVE!!!!!",
        suspicious:
            "This product is terrible, it broke on the first day and the quality is awful. I hate everything about it. Definitely the worst purchase I have ever made. Total waste of money.",
    };

    const ratings = {
        authentic: 4,
        fake: 5,
        suspicious: 5, // Suspicious: negative text but 5 stars
    };

    reviewTextEl.value = examples[type];
    charCountEl.textContent = examples[type].length;
    setRating(ratings[type]);

    // Auto-analyze
    analyzeReview();
}

// --- Analyze Review ---
async function analyzeReview() {
    const text = reviewTextEl.value.trim();
    if (!text) {
        showToast("Please enter a review to analyze.", "error");
        return;
    }

    if (text.length < 5) {
        showToast("Review text is too short. Please enter at least 5 characters.", "error");
        return;
    }

    if (isAnalyzing) return;
    isAnalyzing = true;

    // UI: loading state
    analyzeBtnEl.disabled = true;
    btnContentEl.style.display = "none";
    btnLoadingEl.style.display = "flex";

    try {
        const payload = {
            review_text: text,
            star_rating: currentRating,
            user_id: document.getElementById("userId").value.trim() || "anonymous",
        };

        const res = await fetch(`${API_BASE}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || `Server error: ${res.status}`);
        }

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.error || "Analysis failed");
        }

        renderResults(data);
    } catch (err) {
        console.error("Analysis error:", err);
        showToast(err.message || "Failed to connect to API. Is the server running?", "error");
    } finally {
        isAnalyzing = false;
        analyzeBtnEl.disabled = false;
        btnContentEl.style.display = "flex";
        btnLoadingEl.style.display = "none";
    }
}

// --- Render Results ---
function renderResults(data) {
    resultsSectionEl.style.display = "block";
    resultsSectionEl.scrollIntoView({ behavior: "smooth", block: "start" });

    const { classification, sentiment, anomaly, quality_grade, text_features } = data;

    // --- Verdict Banner ---
    const isAuthentic = classification.prediction === "authentic";
    const verdictBanner = document.getElementById("verdictBanner");
    verdictBanner.className = `verdict-banner ${isAuthentic ? "authentic" : "fake"}`;

    document.getElementById("verdictIcon").textContent = isAuthentic ? "✅" : "🚨";
    document.getElementById("verdictTitle").textContent = isAuthentic
        ? "Review Appears Authentic"
        : "Review Flagged as Potentially Fake";
    document.getElementById("verdictDesc").textContent = isAuthentic
        ? "Our ensemble model indicates this review shows patterns consistent with genuine user feedback."
        : "Our ensemble model detected patterns commonly associated with fake, incentivized, or manipulated reviews.";

    const confidencePct = Math.round(
        Math.max(classification.authentic_probability, classification.fake_probability) * 100
    );
    document.getElementById("confidenceValue").textContent = `${confidencePct}%`;

    // --- Authenticity Gauge ---
    const authPct = Math.round(classification.authentic_probability * 100);
    document.getElementById("authValue").textContent = `${authPct}%`;
    document.getElementById("authLabel").textContent = isAuthentic ? "Authentic" : "Fake";

    // Animate gauge arc
    const gaugeEl = document.getElementById("authGauge");
    const arcLength = 251.3; // Approximate arc length for the SVG path
    gaugeEl.style.strokeDasharray = `${arcLength}`;
    gaugeEl.style.strokeDashoffset = `${arcLength}`;
    gaugeEl.style.stroke = isAuthentic ? "#10b981" : "#ef4444";

    requestAnimationFrame(() => {
        setTimeout(() => {
            const offset = arcLength * (1 - authPct / 100);
            gaugeEl.style.strokeDashoffset = `${offset}`;
        }, 100);
    });

    // Model breakdown
    const breakdownEl = document.getElementById("modelBreakdown");
    if (classification.individual_models && Object.keys(classification.individual_models).length > 0) {
        const modelNames = {
            logistic_regression: "Logistic Regression",
            random_forest: "Random Forest",
            xgboost: "XGBoost",
        };
        breakdownEl.innerHTML = Object.entries(classification.individual_models)
            .map(([key, val]) => {
                const name = modelNames[key] || key;
                const authP = Math.round(val.authentic_prob * 100);
                const fakeP = Math.round(val.fake_prob * 100);
                const cls = authP > fakeP ? "authentic" : "fake";
                return `<div class="model-row">
                    <span class="model-name">${name}</span>
                    <span class="model-value ${cls}">${cls === "authentic" ? authP : fakeP}% ${cls}</span>
                </div>`;
            })
            .join("");
    }

    // --- Quality Grade ---
    const gradeCircle = document.getElementById("gradeCircle");
    const gradeLetter = document.getElementById("gradeLetter");
    const gradeLabel = document.getElementById("gradeLabel");
    const gradeScore = document.getElementById("gradeScore");
    const gradeBreakdown = document.getElementById("gradeBreakdown");

    gradeLetter.textContent = quality_grade.grade;
    gradeCircle.style.borderColor = quality_grade.color;
    gradeLetter.style.color = quality_grade.color;
    gradeLabel.textContent = quality_grade.label;
    gradeLabel.style.color = quality_grade.color;
    gradeScore.textContent = `Score: ${quality_grade.score}/100`;

    // Grade breakdown bars
    const breakdownLabels = {
        authenticity: "Authenticity",
        sentiment_consistency: "Sentiment Match",
        anomaly_safety: "Anomaly Safety",
        rating_component: "Rating Score",
    };

    const breakdownColors = {
        authenticity: "#818cf8",
        sentiment_consistency: "#22d3ee",
        anomaly_safety: "#34d399",
        rating_component: "#f59e0b",
    };

    gradeBreakdown.innerHTML = Object.entries(quality_grade.breakdown)
        .map(([key, val]) => {
            const label = breakdownLabels[key] || key;
            const color = breakdownColors[key] || "#818cf8";
            return `<div class="breakdown-row">
                <span class="breakdown-label">${label}</span>
                <div class="breakdown-bar">
                    <div class="breakdown-bar-fill" style="width: 0%; background: ${color};"></div>
                </div>
                <span class="breakdown-value">${Math.round(val)}</span>
            </div>`;
        })
        .join("");

    // Animate breakdown bars
    requestAnimationFrame(() => {
        setTimeout(() => {
            const fills = gradeBreakdown.querySelectorAll(".breakdown-bar-fill");
            const values = Object.values(quality_grade.breakdown);
            fills.forEach((fill, i) => {
                fill.style.width = `${values[i]}%`;
            });
        }, 200);
    });

    // --- Sentiment ---
    const polarityPct = ((sentiment.polarity + 1) / 2) * 100; // Map -1..1 to 0..100
    document.getElementById("sentimentIndicator").style.left = `${polarityPct}%`;
    document.getElementById("polarityValue").textContent = sentiment.polarity.toFixed(3);
    document.getElementById("subjectivityValue").textContent = sentiment.subjectivity.toFixed(3);

    const labelEl = document.getElementById("sentimentLabelValue");
    labelEl.textContent = capitalize(sentiment.label);
    labelEl.style.color =
        sentiment.label === "positive"
            ? "#10b981"
            : sentiment.label === "negative"
            ? "#ef4444"
            : "#f59e0b";

    const mismatchBadge = document.getElementById("mismatchBadge");
    if (sentiment.is_mismatched) {
        mismatchBadge.style.display = "block";
        mismatchBadge.textContent = `⚠️ Sentiment-Rating Mismatch Detected (score: ${sentiment.mismatch_score.toFixed(2)})`;
    } else {
        mismatchBadge.style.display = "none";
    }

    // --- Anomaly ---
    const anomalyStatus = document.getElementById("anomalyStatus");
    const anomalyIconLarge = document.getElementById("anomalyIconLarge");
    const anomalyLabel = document.getElementById("anomalyLabel");

    if (anomaly.is_anomaly) {
        anomalyStatus.className = "anomaly-status anomalous";
        anomalyIconLarge.textContent = "🚨";
        anomalyLabel.textContent = "Anomalous Pattern Detected";
        anomalyLabel.style.color = "#ef4444";
    } else {
        anomalyStatus.className = "anomaly-status normal";
        anomalyIconLarge.textContent = "✅";
        anomalyLabel.textContent = "Normal Pattern";
        anomalyLabel.style.color = "#10b981";
    }

    const anomalyBarFill = document.getElementById("anomalyBarFill");
    anomalyBarFill.style.width = "0%";
    setTimeout(() => {
        anomalyBarFill.style.width = `${Math.round(anomaly.anomaly_score * 100)}%`;
        if (anomaly.anomaly_score > 0.5) {
            anomalyBarFill.style.background = "linear-gradient(90deg, #f59e0b, #ef4444)";
        }
    }, 200);
    document.getElementById("anomalyScoreValue").textContent = (anomaly.anomaly_score * 100).toFixed(1) + "%";
    document.getElementById("anomalyConfidenceValue").textContent = (anomaly.confidence * 100).toFixed(1) + "%";

    // --- Text Features ---
    const featuresGrid = document.getElementById("featuresGrid");
    const featureLabels = {
        word_count: "Words",
        char_count: "Characters",
        avg_word_length: "Avg Word Len",
        sentence_count: "Sentences",
        avg_sentence_length: "Avg Sent Len",
        caps_ratio: "Caps Ratio",
        exclamation_count: "Exclamations",
        question_count: "Questions",
        unique_word_ratio: "Lexical Diversity",
        digit_ratio: "Digit Ratio",
        repeated_word_ratio: "Repeat Ratio",
    };

    featuresGrid.innerHTML = Object.entries(text_features)
        .map(([key, val]) => {
            const label = featureLabels[key] || key;
            const displayVal = typeof val === "number" ? (val % 1 === 0 ? val : val.toFixed(3)) : val;
            return `<div class="feature-item">
                <span class="feature-value">${displayVal}</span>
                <span class="feature-name">${label}</span>
            </div>`;
        })
        .join("");
}

// --- Utilities ---
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

function showToast(message, type = "error") {
    // Remove existing toasts
    document.querySelectorAll(".toast").forEach((t) => t.remove());

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
