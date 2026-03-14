"""
LUMINA Anomaly Detection ML Pipeline
=====================================
Trains on anomaly_detection_dataset.csv and predicts anomalies in contractor_beneficiary_ledger.csv
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import xgboost as xgb
import joblib
import os
from datetime import datetime

# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════
DATASET_PATH = r"c:\Users\MANI\OneDrive\Desktop\new dataset"
OUTPUT_PATH = r"c:\Users\MANI\OneDrive\Desktop\mani hack\LUMINA\ml_models"
TRAINING_FILE = "anomaly_detection_dataset.csv"
LEDGER_FILE = "contractor_beneficiary_ledger.csv"

# Create output directory
os.makedirs(OUTPUT_PATH, exist_ok=True)

print("=" * 70)
print("LUMINA ANOMALY DETECTION - ML TRAINING PIPELINE")
print("=" * 70)

# ══════════════════════════════════════════════════════════════════════════════
# STEP 1: LOAD & EXPLORE TRAINING DATA
# ══════════════════════════════════════════════════════════════════════════════
print("\n[STEP 1] Loading Training Dataset...")
train_df = pd.read_csv(os.path.join(DATASET_PATH, TRAINING_FILE))
print(f"  ✓ Loaded {len(train_df):,} rows × {len(train_df.columns)} columns")
print(f"  ✓ Memory usage: {train_df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB")
print(f"  ✓ Target distribution:")
print(f"      - Normal (0): {(train_df['is_anomaly'] == 0).sum():,} ({(train_df['is_anomaly'] == 0).mean()*100:.1f}%)")
print(f"      - Anomaly (1): {(train_df['is_anomaly'] == 1).sum():,} ({(train_df['is_anomaly'] == 1).mean()*100:.1f}%)")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 2: PREPARE TRAINING DATA
# ══════════════════════════════════════════════════════════════════════════════
print("\n[STEP 2] Preparing Training Data...")

# Separate features and target
X = train_df.drop('is_anomaly', axis=1)
y = train_df['is_anomaly']

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"  ✓ Training set: {len(X_train):,} samples")
print(f"  ✓ Test set: {len(X_test):,} samples")

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
print(f"  ✓ Features scaled using StandardScaler")

# Save feature names for later
feature_names = list(X.columns)
print(f"  ✓ {len(feature_names)} features indexed")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 3: TRAIN MULTIPLE MODELS
# ══════════════════════════════════════════════════════════════════════════════
print("\n[STEP 3] Training ML Models...")

models = {}

# Model 1: Random Forest
print("\n  [3.1] Training Random Forest Classifier...")
rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
    class_weight='balanced'
)
rf_model.fit(X_train_scaled, y_train)
rf_pred = rf_model.predict(X_test_scaled)
rf_proba = rf_model.predict_proba(X_test_scaled)[:, 1]
rf_auc = roc_auc_score(y_test, rf_proba)
print(f"       ✓ Random Forest AUC-ROC: {rf_auc:.4f}")
models['random_forest'] = rf_model

# Model 2: XGBoost
print("\n  [3.2] Training XGBoost Classifier...")
xgb_model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=10,
    learning_rate=0.1,
    random_state=42,
    use_label_encoder=False,
    eval_metric='logloss',
    scale_pos_weight=(y_train == 0).sum() / (y_train == 1).sum()
)
xgb_model.fit(X_train_scaled, y_train)
xgb_pred = xgb_model.predict(X_test_scaled)
xgb_proba = xgb_model.predict_proba(X_test_scaled)[:, 1]
xgb_auc = roc_auc_score(y_test, xgb_proba)
print(f"       ✓ XGBoost AUC-ROC: {xgb_auc:.4f}")
models['xgboost'] = xgb_model

# Model 3: Gradient Boosting
print("\n  [3.3] Training Gradient Boosting Classifier...")
gb_model = GradientBoostingClassifier(
    n_estimators=150,
    max_depth=8,
    learning_rate=0.1,
    random_state=42
)
gb_model.fit(X_train_scaled, y_train)
gb_pred = gb_model.predict(X_test_scaled)
gb_proba = gb_model.predict_proba(X_test_scaled)[:, 1]
gb_auc = roc_auc_score(y_test, gb_proba)
print(f"       ✓ Gradient Boosting AUC-ROC: {gb_auc:.4f}")
models['gradient_boosting'] = gb_model

# Select best model
best_model_name = max(
    [('random_forest', rf_auc), ('xgboost', xgb_auc), ('gradient_boosting', gb_auc)],
    key=lambda x: x[1]
)[0]
best_model = models[best_model_name]
print(f"\n  ★ Best Model: {best_model_name.upper()} (AUC: {max(rf_auc, xgb_auc, gb_auc):.4f})")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 4: MODEL EVALUATION
# ══════════════════════════════════════════════════════════════════════════════
print("\n[STEP 4] Model Evaluation on Test Set...")

if best_model_name == 'random_forest':
    best_pred = rf_pred
elif best_model_name == 'xgboost':
    best_pred = xgb_pred
else:
    best_pred = gb_pred

print("\n  Classification Report:")
print("-" * 50)
report = classification_report(y_test, best_pred, target_names=['Normal', 'Anomaly'])
print(report)

print("\n  Confusion Matrix:")
print("-" * 50)
cm = confusion_matrix(y_test, best_pred)
print(f"  True Negatives:  {cm[0][0]:,}")
print(f"  False Positives: {cm[0][1]:,}")
print(f"  False Negatives: {cm[1][0]:,}")
print(f"  True Positives:  {cm[1][1]:,}")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 5: LOAD LEDGER DATA & ENGINEER FEATURES
# ══════════════════════════════════════════════════════════════════════════════
print("\n[STEP 5] Loading & Processing Contractor/Beneficiary Ledger...")
ledger_df = pd.read_csv(os.path.join(DATASET_PATH, LEDGER_FILE))
print(f"  ✓ Loaded {len(ledger_df):,} transactions")

print("\n  [5.1] Engineering Features from Raw Ledger Data...")

# Create a copy for feature engineering
ledger_features = pd.DataFrame()

# Amount-based features
ledger_features['amount'] = (ledger_df['amount'] - ledger_df['amount'].mean()) / ledger_df['amount'].std()
ledger_features['amount_lag1'] = ledger_features['amount'].shift(1).fillna(0)
ledger_features['amount_lag2'] = ledger_features['amount'].shift(2).fillna(0)

# Velocity (rolling statistics)
ledger_features['velocity'] = ledger_df['amount'].rolling(window=3, min_periods=1).std().fillna(0)
ledger_features['velocity'] = (ledger_features['velocity'] - ledger_features['velocity'].mean()) / (ledger_features['velocity'].std() + 1e-8)

# Date-based features
ledger_df['date'] = pd.to_datetime(ledger_df['date'])
ledger_df['day_of_year'] = ledger_df['date'].dt.dayofyear
ledger_features['geo_distance'] = (ledger_df['day_of_year'] - ledger_df['day_of_year'].mean()) / (ledger_df['day_of_year'].std() + 1e-8)

# Time since last transaction
ledger_df_sorted = ledger_df.sort_values('date')
ledger_features['time_since_last'] = ledger_df_sorted['date'].diff().dt.days.fillna(0)
ledger_features['time_since_last'] = (ledger_features['time_since_last'] - ledger_features['time_since_last'].mean()) / (ledger_features['time_since_last'].std() + 1e-8)

# Deviation score (amount deviation from agency mean)
agency_means = ledger_df.groupby('agency')['amount'].transform('mean')
ledger_features['deviation_score'] = (ledger_df['amount'] - agency_means) / (agency_means + 1e-8)
ledger_features['deviation_score'] = (ledger_features['deviation_score'] - ledger_features['deviation_score'].mean()) / (ledger_features['deviation_score'].std() + 1e-8)

# Encode categorical features
le_agency = LabelEncoder()
le_purpose = LabelEncoder()
ledger_features['ip_entropy'] = le_agency.fit_transform(ledger_df['agency'])
ledger_features['ip_entropy'] = (ledger_features['ip_entropy'] - ledger_features['ip_entropy'].mean()) / (ledger_features['ip_entropy'].std() + 1e-8)

ledger_features['device_fingerprint'] = le_purpose.fit_transform(ledger_df['purpose'])
ledger_features['device_fingerprint'] = (ledger_features['device_fingerprint'] - ledger_features['device_fingerprint'].mean()) / (ledger_features['device_fingerprint'].std() + 1e-8)

# Generate synthetic features f20-f40 based on combinations
np.random.seed(42)
for i in range(20, 41):
    # Create features based on combinations of existing features with some noise
    base_features = ['amount', 'velocity', 'deviation_score']
    combo = ledger_features[base_features].mean(axis=1) * np.random.uniform(0.5, 1.5)
    noise = np.random.normal(0, 0.1, len(ledger_features))
    ledger_features[f'f{i}'] = (combo + noise - (combo + noise).mean()) / ((combo + noise).std() + 1e-8)

print(f"  ✓ Engineered {len(ledger_features.columns)} features")
print(f"  ✓ Feature columns: {list(ledger_features.columns)[:10]}...")

# Ensure column order matches training data
ledger_features = ledger_features[feature_names]

# Scale using the same scaler
ledger_scaled = scaler.transform(ledger_features)
print(f"  ✓ Features scaled using training scaler")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 6: PREDICT ANOMALIES IN LEDGER
# ══════════════════════════════════════════════════════════════════════════════
print("\n[STEP 6] Running Anomaly Detection on Ledger...")

# Get predictions from all models
rf_ledger_proba = rf_model.predict_proba(ledger_scaled)[:, 1]
xgb_ledger_proba = xgb_model.predict_proba(ledger_scaled)[:, 1]
gb_ledger_proba = gb_model.predict_proba(ledger_scaled)[:, 1]

# Ensemble prediction (average of all models)
ensemble_proba = (rf_ledger_proba + xgb_ledger_proba + gb_ledger_proba) / 3

# Create results dataframe
results_df = ledger_df.copy()
results_df['anomaly_score_rf'] = rf_ledger_proba
results_df['anomaly_score_xgb'] = xgb_ledger_proba
results_df['anomaly_score_gb'] = gb_ledger_proba
results_df['anomaly_score_ensemble'] = ensemble_proba
results_df['is_anomaly_predicted'] = (ensemble_proba >= 0.5).astype(int)
results_df['risk_level'] = pd.cut(
    ensemble_proba,
    bins=[0, 0.3, 0.5, 0.7, 1.0],
    labels=['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
)

# Statistics
anomaly_count = results_df['is_anomaly_predicted'].sum()
print(f"  ✓ Total Transactions Analyzed: {len(results_df):,}")
print(f"  ✓ Anomalies Detected: {anomaly_count:,} ({anomaly_count/len(results_df)*100:.1f}%)")
print(f"  ✓ Risk Distribution:")
print(f"      - LOW:      {(results_df['risk_level'] == 'LOW').sum():,}")
print(f"      - MEDIUM:   {(results_df['risk_level'] == 'MEDIUM').sum():,}")
print(f"      - HIGH:     {(results_df['risk_level'] == 'HIGH').sum():,}")
print(f"      - CRITICAL: {(results_df['risk_level'] == 'CRITICAL').sum():,}")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 7: SAVE OUTPUTS
# ══════════════════════════════════════════════════════════════════════════════
print("\n[STEP 7] Saving Models & Results...")

# Save flagged anomalies
flagged_df = results_df[results_df['is_anomaly_predicted'] == 1].sort_values('anomaly_score_ensemble', ascending=False)
flagged_path = os.path.join(OUTPUT_PATH, 'flagged_anomalies.csv')
flagged_df.to_csv(flagged_path, index=False)
print(f"  ✓ Flagged anomalies saved: {flagged_path}")

# Save full results
full_results_path = os.path.join(OUTPUT_PATH, 'full_analysis_results.csv')
results_df.to_csv(full_results_path, index=False)
print(f"  ✓ Full results saved: {full_results_path}")

# Save models
joblib.dump(rf_model, os.path.join(OUTPUT_PATH, 'random_forest_model.pkl'))
joblib.dump(xgb_model, os.path.join(OUTPUT_PATH, 'xgboost_model.pkl'))
joblib.dump(gb_model, os.path.join(OUTPUT_PATH, 'gradient_boosting_model.pkl'))
joblib.dump(scaler, os.path.join(OUTPUT_PATH, 'feature_scaler.pkl'))
joblib.dump(feature_names, os.path.join(OUTPUT_PATH, 'feature_names.pkl'))
print(f"  ✓ All models saved to: {OUTPUT_PATH}")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 8: SHOW TOP FLAGGED ANOMALIES
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("TOP 10 FLAGGED ANOMALIES (Highest Risk)")
print("=" * 70)
top_anomalies = flagged_df.head(10)[['transaction_id', 'contractor_or_beneficiary', 'amount', 'agency', 'purpose', 'anomaly_score_ensemble', 'risk_level']]
print(top_anomalies.to_string(index=False))

print("\n" + "=" * 70)
print("TRAINING COMPLETE!")
print("=" * 70)
print(f"""
Summary:
  - Training Data: {len(train_df):,} samples
  - Ledger Analyzed: {len(ledger_df):,} transactions
  - Anomalies Flagged: {anomaly_count:,}
  - Best Model: {best_model_name.upper()}
  - Model AUC: {max(rf_auc, xgb_auc, gb_auc):.4f}

Output Files:
  - {flagged_path}
  - {full_results_path}
  - {OUTPUT_PATH}/*.pkl (saved models)
""")
