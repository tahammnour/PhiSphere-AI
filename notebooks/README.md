# PhiSphere AI — Notebooks

Offline analysis scripts for experiment tracking and responsible AI assessment.

## Setup

```bash
pip install -r notebooks/requirements.txt
```

## Scripts

### Azure ML Experiment Tracking

Logs PhiSphere lab session data to Azure Machine Learning for experiment versioning and reproducibility.

```bash
# Dry run (no Azure connection needed)
python notebooks/azure_ml_experiment_tracking.py --dry-run

# With exported session CSV
python notebooks/azure_ml_experiment_tracking.py --csv path/to/session.csv

# With Azure ML connection
export AZURE_SUBSCRIPTION_ID=...
export AZURE_RESOURCE_GROUP=...
export AZURE_ML_WORKSPACE_NAME=...
python notebooks/azure_ml_experiment_tracking.py --csv path/to/session.csv
```

### Responsible AI Analysis

Performs data balance analysis, correlation checks, and generates a Responsible AI report for lab session data.

```bash
# Dry run with synthetic data
python notebooks/responsible_ai_analysis.py --dry-run

# With exported session CSV
python notebooks/responsible_ai_analysis.py --csv path/to/session.csv

# Specify target column
python notebooks/responsible_ai_analysis.py --csv data.csv --target growth_mm
```

## How to export a session CSV

1. Open a lab session in PhiSphere AI
2. Load or upload CSV data
3. Click the Export button in the chat header to download the session as markdown
4. The CSV data is embedded in the export; save it separately for notebook analysis
