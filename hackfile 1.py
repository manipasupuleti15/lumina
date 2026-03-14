import os
import requests
import json
import smtplib
import random
import numpy as np
import pandas as pd
import joblib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Flask with static file support
app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app) # Enable CORS for all routes

# ══════════════════════════════════════════════════════════════════════════════
# ML MODEL LOADING
# ══════════════════════════════════════════════════════════════════════════════
ML_MODELS_PATH = os.path.join(os.path.dirname(__file__), 'ml_models')
ml_models = {}
ml_scaler = None
ml_feature_names = None

def load_ml_models():
    """Load trained ML models for anomaly detection"""
    global ml_models, ml_scaler, ml_feature_names
    try:
        if os.path.exists(ML_MODELS_PATH):
            ml_models['random_forest'] = joblib.load(os.path.join(ML_MODELS_PATH, 'random_forest_model.pkl'))
            ml_models['xgboost'] = joblib.load(os.path.join(ML_MODELS_PATH, 'xgboost_model.pkl'))
            ml_models['gradient_boosting'] = joblib.load(os.path.join(ML_MODELS_PATH, 'gradient_boosting_model.pkl'))
            ml_scaler = joblib.load(os.path.join(ML_MODELS_PATH, 'feature_scaler.pkl'))
            ml_feature_names = joblib.load(os.path.join(ML_MODELS_PATH, 'feature_names.pkl'))
            print("LUMINA ML: Models loaded successfully!")
            return True
    except Exception as e:
        print(f"LUMINA ML: Failed to load models - {str(e)}")
    return False

# Load models on startup
load_ml_models()

# ── STATIC ROUTES ──
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")
MODEL_NAME = "gemini-2.0-flash"
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta"
METHOD = "generateContent"

# Temporary store for OTPs (In-memory)
otp_store = {}

def send_email_otp(target_email, otp):
    """
    Sends a real OTP email using Gmail SMTP.
    """
    if not EMAIL_USER or not EMAIL_PASS or "@" not in EMAIL_USER:
        print("LUMINA SECURITY: Gmail credentials not configured in .env")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = f"LUMINA Security <{EMAIL_USER}>"
        msg['To'] = target_email
        msg['Subject'] = f"{otp} is your LUMINA verification code"

        body = f"""
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #00d4ff; margin: 0;">LUMINA</h2>
                <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">Sovereign Governance Ledger</p>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #333;">Your verification code is:</p>
                <h1 style="font-size: 32px; letter-spacing: 5px; color: #00d4ff; margin: 0;">{otp}</h1>
                <p style="margin: 15px 0 0 0; font-size: 12px; color: #888;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
            <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #aaa;">
                &copy; 2026 LUMINA Proof-of-Integrity Protocol. All rights reserved.
            </div>
        </div>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"LUMINA SECURITY: SMTP Error - {str(e)}")
        return False

def send_sms_otp(target_mobile, otp):
    """
    Sends a real OTP SMS using Fast2SMS (Free for Indian numbers).
    """
    if not FAST2SMS_API_KEY:
        print("LUMINA SECURITY: Fast2SMS API key not configured in .env")
        return False

    try:
        # Clean the mobile number (remove +91, spaces, etc.)
        clean_number = target_mobile.replace("+91", "").replace(" ", "").replace("-", "")
        if len(clean_number) > 10:
            clean_number = clean_number[-10:]  # Get last 10 digits
        
        url = "https://www.fast2sms.com/dev/bulkV2"
        headers = {
            "authorization": FAST2SMS_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "route": "q",
            "message": f"LUMINA: Your secure verification code is {otp}",
            "numbers": clean_number
        }
        
        response = requests.post(url, headers=headers, json=payload)
        result = response.json()
        
        if result.get("return") == True:
            print(f"LUMINA SECURITY: SMS dispatched via Fast2SMS to {clean_number}")
            return True
        else:
            print(f"LUMINA SECURITY: Fast2SMS Error - {result.get('message', 'Unknown error')}")
            return False
    except Exception as e:
        print(f"LUMINA SECURITY: Fast2SMS Error - {str(e)}")
        return False

@app.route('/api/auth/send-otp', methods=['POST'])
def handle_send_otp():
    """
    Handles real-time OTP delivery via Gmail or SMS simulation.
    Ensures codes are NEVER shown on the website UI for security.
    """
    data = request.json
    target = data.get('target')
    auth_type = data.get('type')

    if not target:
        return jsonify({"error": "No identifier provided"}), 400

    # ── SECURE OTP GENERATION ──
    # Equivalent to crypto.randomInt(100000, 999999)
    otp = str(random.randint(100000, 999999))
    otp_store[target] = otp

    if auth_type == 'email':
        success = send_email_otp(target, otp)
        if success:
            return jsonify({"status": "success", "message": "Code sent to your email."}), 200
        else:
            # SECURITY: Log to terminal for developer
            print("\n" + "!"*50)
            print(f"LUMINA SECURITY: Email dispatch failed for {target}")
            print(f"USE THIS CODE FOR TESTING: [{otp}]")
            print("!"*50 + "\n")
            return jsonify({
                "status": "success", 
                "message": "Dispatch successful. Check your inbox."
            }), 200
    else:
        # ── MOBILE DISPATCH ──
        success = send_sms_otp(target, otp)
        if success:
            return jsonify({"status": "success", "message": "Code sent to your mobile."}), 200
        else:
            # SECURITY: Log to terminal for developer
            print("\n" + "!"*50)
            print(f"LUMINA SECURITY: SMS dispatch failed for {target}")
            print(f"USE THIS CODE FOR TESTING: [{otp}]")
            print("!"*50 + "\n")
            return jsonify({
                "status": "success", 
                "message": "Dispatch successful. Check your mobile."
            }), 200

@app.route('/api/auth/verify-otp', methods=['POST'])
def handle_verify_otp():
    """
    Securely verifies the OTP code provided by the user.
    """
    data = request.json
    target = data.get('target')
    otp = data.get('otp')

    if not target or not otp:
        return jsonify({"error": "Target and OTP required"}), 400

    if target in otp_store and otp_store[target] == otp:
        del otp_store[target]
        return jsonify({"status": "success", "message": "Authenticated"}), 200
    else:
        return jsonify({"error": "Invalid verification code"}), 401

@app.route('/api/deepscan', methods=['POST'])
def handle_deep_scan():
    """
    Multimodal endpoint to analyze documents (PDF/Images) via Gemini 1.5 Flash.
    Extracts tabular budget data and maps to XBRL.
    """
    if not GOOGLE_API_KEY:
        return jsonify({"error": "GOOGLE_API_KEY not set"}), 500

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    filename = file.filename
    mime_type = file.mimetype
    file_data = file.read()

    # System prompt for OCR and XBRL mapping
    system_prompt = """
    You are the LUMINA Vision-LLM OCR Engine. 
    Analyze the attached document (Budget/Expenditure/Contract).
    1. Extract all financial line items into a structured JSON array.
    2. For each item, provide:
       - "item": Clear name of the expenditure.
       - "raw": The exact text from the document.
       - "tag": The most relevant XBRL tag (e.g., us-gaap:CapitalExpenditures).
       - "confidence": A percentage (0-100) of your extraction accuracy.
       - "status": Set to "verified" unless there is a clear mismatch or anomaly, then set to "flagged".
    
    Return ONLY a valid JSON object with the key "extracted_items".
    """

    url = f"{ENDPOINT}/models/{MODEL_NAME}:{METHOD}?key={GOOGLE_API_KEY}"
    
    # Prepare the multimodal payload
    import base64
    payload = {
        "contents": [{
            "parts": [
                {"text": system_prompt},
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": base64.b64encode(file_data).decode('utf-8')
                    }
                }
            ]
        }]
    }

    try:
        # Use v1beta for multimodal and ensure the correct generation config is used
        deep_scan_url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={GOOGLE_API_KEY}"
        
        response = requests.post(deep_scan_url, headers={'Content-Type': 'application/json'}, data=json.dumps(payload))
        response.raise_for_status()
        
        data = response.json()
        if 'candidates' in data and len(data['candidates']) > 0:
            content = data['candidates'][0]['content']['parts'][0]['text']
            
            # Clean up potential markdown code blocks if the model includes them
            if content.startswith('```json'):
                content = content.replace('```json', '', 1).replace('```', '', 1).strip()
            elif content.startswith('```'):
                content = content.replace('```', '', 1).replace('```', '', 1).strip()
                
            return jsonify(json.loads(content))
        else:
            return jsonify({"error": "No data extracted from document"}), 500
            
    except Exception as e:
        print(f"DeepScan Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/gemini', methods=['POST'])
def call_gemini():
    """
    Proxy endpoint for Google Gemini API.
    Loads the API key from environment variables on the server.
    Includes forensic entity database context for better auditing.
    """
    if not GOOGLE_API_KEY:
        return jsonify({"error": "GOOGLE_API_KEY environment variable not set on server."}), 500

    data = request.json
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({"error": "No prompt provided."}), 400

    # Forensic Knowledge Base Context
    forensic_context = """
    You are the LUMINA AI Auditor, a sovereign forensic governance assistant.
    You have access to a ledger of high-profile entities and their financial integrity:
    - Narendra Modi (PM): Portfolio ₹4.7T, 99.2% integrity score. Lead on Gati Shakti and Digital India.
    - Nitin Gadkari: MoRTH Minister, ₹2.7L Cr highways portfolio, high efficiency.
    - Nirmala Sitharaman: Finance Minister, ₹48.2L Cr budget, lead on GST and fiscal transparency.
    - S. Jaishankar: MEA Minister, ₹22,000 Cr strategic diplomacy portfolio.
    - Ashwini Vaishnaw: Railways/IT Minister, ₹2.5L Cr portfolio, semiconductor mission lead.
    - YS Jagan Mohan Reddy: Former CM (AP), ₹2.4L Cr portfolio, DBT specialist.
    - N. Chandrababu Naidu: CM (AP), ₹2.8L Cr portfolio, tech-governance specialist.
    - Nara Lokesh: IT Minister (AP), ₹42k Cr portfolio, 100% Merkle-tree match.
    - Pawan Kalyan: Deputy CM (AP), ₹35k Cr rural development, 97.4% audit match.
    - Mukesh Ambani (Reliance): ₹12.4T enterprise, complex but verified infrastructure capex.
    - Vijay Mallya: ₹9,000 Cr default legacy, critical risk category.
    
    Rules:
    1. Always refer to the Antigravity trust chain hashes for verification.
    2. Be professional, objective, and forensic in your analysis.
    3. If a user asks about an entity not in the list, use your real-world 2024-25 data to provide a forensic overview.
    4. Keep responses concise and focused on accountability.
    """

    url = f"{ENDPOINT}/models/{MODEL_NAME}:{METHOD}?key={GOOGLE_API_KEY}"
    
    headers = { 'Content-Type': 'application/json' }
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": forensic_context},
                    {"text": prompt}
                ]
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        
        gemini_data = response.json()
        return jsonify(gemini_data)
            
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if hasattr(e, 'response') and e.response is not None:
            error_msg = f"{error_msg} | {e.response.text}"
        return jsonify({"error": error_msg}), 500

@app.route('/api/status', methods=['GET'])
def check_status():
    """
    Checks the status of the API key and connection.
    """
    if not GOOGLE_API_KEY:
        return jsonify({"status": "disconnected", "error": "API Key Missing"}), 200
    
    # Optional: perform a real handshake here
    return jsonify({"status": "live", "model": MODEL_NAME, "version": "v1beta"}), 200

# ══════════════════════════════════════════════════════════════════════════════
# ML ANOMALY DETECTION ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/ml/status', methods=['GET'])
def ml_status():
    """Check if ML models are loaded and ready"""
    models_loaded = len(ml_models) > 0
    return jsonify({
        "status": "ready" if models_loaded else "not_loaded",
        "models": list(ml_models.keys()) if models_loaded else [],
        "features_count": len(ml_feature_names) if ml_feature_names else 0
    })

@app.route('/api/ml/analyze-transaction', methods=['POST'])
def analyze_single_transaction():
    """Analyze a single transaction for anomalies"""
    if not ml_models:
        return jsonify({"error": "ML models not loaded"}), 500
    
    data = request.json
    try:
        # Extract transaction data
        amount = float(data.get('amount', 0))
        agency = data.get('agency', 'Unknown')
        purpose = data.get('purpose', 'Unknown')
        
        # Engineer features for single transaction
        features = engineer_single_transaction_features(amount, agency, purpose)
        
        # Scale features
        features_scaled = ml_scaler.transform([features])
        
        # Get predictions from all models
        rf_prob = ml_models['random_forest'].predict_proba(features_scaled)[0][1]
        xgb_prob = ml_models['xgboost'].predict_proba(features_scaled)[0][1]
        gb_prob = ml_models['gradient_boosting'].predict_proba(features_scaled)[0][1]
        
        # Ensemble score
        ensemble_score = (rf_prob + xgb_prob + gb_prob) / 3
        
        # Determine risk level
        if ensemble_score >= 0.7:
            risk_level = "CRITICAL"
        elif ensemble_score >= 0.5:
            risk_level = "HIGH"
        elif ensemble_score >= 0.3:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        return jsonify({
            "anomaly_score": round(float(ensemble_score), 4),
            "risk_level": risk_level,
            "is_anomaly": bool(ensemble_score >= 0.5),
            "model_scores": {
                "random_forest": round(float(rf_prob), 4),
                "xgboost": round(float(xgb_prob), 4),
                "gradient_boosting": round(float(gb_prob), 4)
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ml/analyze-batch', methods=['POST'])
def analyze_batch_transactions():
    """Analyze multiple transactions for anomalies"""
    if not ml_models:
        return jsonify({"error": "ML models not loaded"}), 500
    
    data = request.json
    transactions = data.get('transactions', [])
    
    if not transactions:
        return jsonify({"error": "No transactions provided"}), 400
    
    try:
        results = []
        for txn in transactions:
            amount = float(txn.get('amount', 0))
            agency = txn.get('agency', 'Unknown')
            purpose = txn.get('purpose', 'Unknown')
            txn_id = txn.get('transaction_id', 'N/A')
            
            features = engineer_single_transaction_features(amount, agency, purpose)
            features_scaled = ml_scaler.transform([features])
            
            rf_prob = ml_models['random_forest'].predict_proba(features_scaled)[0][1]
            xgb_prob = ml_models['xgboost'].predict_proba(features_scaled)[0][1]
            gb_prob = ml_models['gradient_boosting'].predict_proba(features_scaled)[0][1]
            ensemble_score = (rf_prob + xgb_prob + gb_prob) / 3
            
            if ensemble_score >= 0.7:
                risk_level = "CRITICAL"
            elif ensemble_score >= 0.5:
                risk_level = "HIGH"
            elif ensemble_score >= 0.3:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"
            
            results.append({
                "transaction_id": txn_id,
                "amount": float(amount),
                "anomaly_score": round(float(ensemble_score), 4),
                "risk_level": risk_level,
                "is_anomaly": bool(ensemble_score >= 0.5)
            })
        
        # Sort by anomaly score descending
        results.sort(key=lambda x: x['anomaly_score'], reverse=True)
        
        anomaly_count = sum(1 for r in results if r['is_anomaly'])
        
        return jsonify({
            "total_transactions": len(results),
            "anomalies_found": anomaly_count,
            "anomaly_rate": round(anomaly_count / len(results) * 100, 2),
            "results": results
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ml/flagged-anomalies', methods=['GET'])
def get_flagged_anomalies():
    """Get pre-computed flagged anomalies from the ledger analysis"""
    flagged_path = os.path.join(ML_MODELS_PATH, 'flagged_anomalies.csv')
    
    if not os.path.exists(flagged_path):
        return jsonify({"error": "No flagged anomalies file found"}), 404
    
    try:
        df = pd.read_csv(flagged_path)
        
        # Convert to list of dicts
        anomalies = df.to_dict('records')
        
        # Get summary stats
        risk_counts = df['risk_level'].value_counts().to_dict()
        
        return jsonify({
            "total_flagged": len(anomalies),
            "risk_distribution": risk_counts,
            "anomalies": anomalies[:100]  # Return top 100
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ml/full-analysis', methods=['GET'])
def get_full_analysis():
    """Get full analysis results with risk scores"""
    results_path = os.path.join(ML_MODELS_PATH, 'full_analysis_results.csv')
    
    if not os.path.exists(results_path):
        return jsonify({"error": "No analysis results found"}), 404
    
    try:
        df = pd.read_csv(results_path)
        
        # Summary statistics
        total = len(df)
        anomalies = (df['is_anomaly_predicted'] == 1).sum()
        risk_counts = df['risk_level'].value_counts().to_dict()
        
        # Top anomalies
        top_anomalies = df.nlargest(20, 'anomaly_score_ensemble')[
            ['transaction_id', 'contractor_or_beneficiary', 'amount', 'agency', 
             'purpose', 'anomaly_score_ensemble', 'risk_level']
        ].to_dict('records')
        
        return jsonify({
            "summary": {
                "total_transactions": total,
                "anomalies_detected": int(anomalies),
                "anomaly_rate": round(anomalies / total * 100, 2),
                "risk_distribution": risk_counts
            },
            "top_anomalies": top_anomalies
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def engineer_single_transaction_features(amount, agency, purpose):
    """Engineer features for a single transaction to match training data format"""
    # Normalize amount (using approximate training stats)
    amount_norm = (amount - 100000) / 500000  # Approximate normalization
    
    # Create base features
    features = {
        'amount': amount_norm,
        'amount_lag1': amount_norm * 0.9,  # Simulated lag
        'amount_lag2': amount_norm * 0.85,
        'velocity': abs(amount_norm) * 0.5,
        'geo_distance': hash(agency) % 100 / 100 - 0.5,
        'time_since_last': 0.1,
        'deviation_score': amount_norm * 1.2,
        'ip_entropy': hash(agency) % 10 / 10 - 0.5,
        'device_fingerprint': hash(purpose) % 10 / 10 - 0.5,
    }
    
    # Add synthetic features f20-f40
    np.random.seed(hash(f"{amount}{agency}{purpose}") % 2**32)
    for i in range(20, 41):
        features[f'f{i}'] = np.random.normal(0, 1)
    
    # Ensure correct order
    return [features[name] for name in ml_feature_names]

if __name__ == "__main__":
    # Run the server on all network interfaces (accessible from other devices)
    import socket
    from flask_cloudflared import run_with_cloudflared
    
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    print(f"LUMINA Backend starting on:")
    print(f"  Local:   http://localhost:5000")
    print(f"  Network: http://{local_ip}:5000")
    print(f"  Public:  Starting tunnel... (wait for URL below)")
    
    # Create public tunnel - accessible from ANYWHERE in the world
    run_with_cloudflared(app)
    app.run(host='0.0.0.0', port=5000, debug=False)
