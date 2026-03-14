# LUMINA — The Sovereign Governance Ledger

> Proof-of-Integrity Protocol powered by AI + Blockchain

LUMINA is a forensic governance platform that audits government budgets, detects financial anomalies, and anchors verified data to the Antigravity blockchain chain — making public spending mathematically accountable.

---

## Features

- **Deep-Scan OCR Engine** — Upload PDFs/images of budget documents; Gemini Vision-LLM extracts and maps line items to XBRL standards
- **ML Anomaly Watchdog** — Ensemble of Random Forest, XGBoost, and Gradient Boosting models detect ghost projects, bid rigging, and suspicious transactions
- **AI Auditor** — Conversational Gemini-powered auditor with forensic knowledge of government entities and portfolios
- **Trust Chain** — Every ingestion generates a Merkle hash anchored to the Antigravity blockchain
- **OTP Authentication** — Secure login via Gmail SMTP or SMS (Fast2SMS)
- **Entity Ledger** — Track politicians, contractors, and corporations with risk scores
- **Money Web** — Visual graph of financial flows between entities
- **Geographic Heatmap** — Leaflet.js map showing district-level expenditure verification

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JS, Chart.js, Leaflet.js, TensorFlow.js |
| Backend | Python, Flask, Flask-CORS |
| AI/ML | Google Gemini 2.0/2.5, scikit-learn, XGBoost |
| Auth | Gmail SMTP, Fast2SMS, OTP-based |
| Tunnel | Cloudflare (flask-cloudflared) |

---

## Setup

### 1. Install dependencies
```bash
pip install flask flask-cors python-dotenv requests numpy pandas joblib scikit-learn xgboost flask-cloudflared
```

### 2. Configure environment
Edit `.env`:
```
GOOGLE_API_KEY=your_gemini_api_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
FAST2SMS_API_KEY=your_fast2sms_key
```

### 3. Run the server
```bash
python server.py
```

Open `http://localhost:5000` in your browser.

---

## ML Models

Pre-trained models are in `ml_models/`:
- `random_forest_model.pkl`
- `xgboost_model.pkl`
- `gradient_boosting_model.pkl`
- `feature_scaler.pkl`
- `feature_names.pkl`

To retrain on new data, run `ml_trainer.py`.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to email or mobile |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/deepscan` | Scan document via Gemini Vision |
| POST | `/api/gemini` | Query AI Auditor |
| GET  | `/api/status` | Check server/API status |
| GET  | `/api/ml/status` | Check ML model status |
| POST | `/api/ml/analyze-transaction` | Analyze single transaction |
| POST | `/api/ml/analyze-batch` | Analyze batch of transactions |
| GET  | `/api/ml/flagged-anomalies` | Get pre-computed anomalies |

---

## License

MIT © 2026 LUMINA — Proof-of-Integrity Protocol
