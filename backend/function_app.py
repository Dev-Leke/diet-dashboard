import io
import json
import logging
import os
import time
from datetime import datetime, timezone

import azure.functions as func
import pandas as pd
from azure.storage.blob import BlobServiceClient

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

# config values come from azure app settings, not local.settings.json
CONN_SETTING = "DIETS_STORAGE"
CONTAINER = os.environ.get("DIETS_CONTAINER", "diets")
BLOB_NAME = os.environ.get("DIETS_BLOB", "All_Diets.csv")

nutrition_cols = ['Protein(g)', 'Carbs(g)', 'Fat(g)']

# keeps the dataframe in memory between requests so refresh doesnt re-download the blob
_cache = {"df": None}


def load_dataframe():
    if _cache["df"] is not None:
        return _cache["df"]

    conn = os.environ.get(CONN_SETTING)
    if not conn:
        raise RuntimeError(f"missing app setting {CONN_SETTING}")

    # replaces pd.read_csv, pulls the csv out of blob storage instead of off disk
    client = BlobServiceClient.from_connection_string(conn)
    blob = client.get_blob_client(container=CONTAINER, blob=BLOB_NAME)
    raw = blob.download_blob().readall()

    df = pd.read_csv(io.BytesIO(raw))
    df = clean(df)
    _cache["df"] = df
    return df


def clean(df):
    # same as phase 1, fill the missing macros with the column average
    df[nutrition_cols] = df[nutrition_cols].fillna(
        df[nutrition_cols].mean()
    )

    # lowercase the diet so the filter works no matter how its typed
    df['Diet_type'] = df['Diet_type'].astype(str).str.strip().str.lower()

    # protein to carbs ratio
    df['protein_to_carbs_ratio'] = df['Protein(g)'] / df['Carbs(g)']

    # carbs to fat ratio
    df['carbs_to_fat_ratio'] = df['Carbs(g)'] / df['Fat(g)']

    df = df.replace([float('inf'), float('-inf')], pd.NA)
    return df


def r1(v):
    if v is None or pd.isna(v):
        return 0.0
    return round(float(v), 1)


def build_payload(df, diet_filter):
    # if a diet is picked on the dashboard only look at those rows
    view = df if diet_filter == "all" else df[df['Diet_type'] == diet_filter]

    # bar chart, average macros for each diet type
    avg_macro = view.groupby('Diet_type')[nutrition_cols].mean()
    avg_macros_by_diet = [
        {
            "label": diet,
            "protein": r1(row['Protein(g)']),
            "carbs": r1(row['Carbs(g)']),
            "fat": r1(row['Fat(g)']),
        }
        for diet, row in avg_macro.iterrows()
    ]

    # scatter plot, top 5 protein recipes in each diet type
    top5 = view.sort_values('Protein(g)', ascending=False).groupby('Diet_type').head(5)
    top5_protein = [
        {
            "recipe": str(row['Recipe_name']),
            "cuisine": str(row['Cuisine_type']),
            "diet": str(row['Diet_type']),
            "protein": r1(row['Protein(g)']),
        }
        for _, row in top5.iterrows()
    ]

    # pie chart, cuisine counts
    cuisine_counts = view['Cuisine_type'].value_counts().head(8)
    cuisine_distribution = [
        {"label": str(cuisine), "value": int(count)}
        for cuisine, count in cuisine_counts.items()
    ]

    # highest protein diet, same as phase 1
    avg_protein = df.groupby('Diet_type')['Protein(g)'].mean()
    highest_protein = avg_protein.idxmax()

    return {
        "charts": {
            "avgMacrosByDietType": avg_macros_by_diet,
            "top5ProteinRecipes": top5_protein,
            "cuisineDistribution": cuisine_distribution,
        },
        "insights": {
            "highest_protein_diet": str(highest_protein),
            "avg_protein_to_carbs_ratio": r1(view['protein_to_carbs_ratio'].mean()),
            "avg_carbs_to_fat_ratio": r1(view['carbs_to_fat_ratio'].mean()),
        },
        "meta": {
            "record_count": int(len(view)),
            "filter_applied": diet_filter,
            "valid_diets": sorted(df['Diet_type'].unique().tolist()),
            "source_blob": f"{CONTAINER}/{BLOB_NAME}",
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        },
    }


def json_response(body, status=200):
    return func.HttpResponse(
        json.dumps(body), status_code=status, mimetype="application/json"
    )


@app.route(route="dashboard", methods=["GET"])
def dashboard(req: func.HttpRequest) -> func.HttpResponse:
    start = time.perf_counter()

    try:
        df = load_dataframe()
    except Exception:
        logging.exception("could not read the blob")
        return json_response({"error": "failed to read dataset from blob storage"}, 500)

    diet = (req.params.get('diet') or "all").strip().lower()
    valid = sorted(df['Diet_type'].unique().tolist())

    if diet != "all" and diet not in valid:
        return json_response({"error": f"unknown diet type {diet}", "valid_diets": valid}, 400)

    payload = build_payload(df, diet)

    # how long the function took, gets shown on the dashboard
    payload["meta"]["execution_ms"] = round((time.perf_counter() - start) * 1000, 1)
    return json_response(payload)


# quick check that the function is alive, no key needed
@app.route(route="health", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def health(req: func.HttpRequest) -> func.HttpResponse:
    return json_response({"status": "ok", "warm": _cache["df"] is not None})
