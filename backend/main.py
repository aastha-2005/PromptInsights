"""
PromptInsights — FastAPI Backend
=================================
AI-powered Exploratory Data Analysis API.
Powered by Groq (llama3-8b-8192) via the official Groq SDK.

Run locally:
    uvicorn main:app --reload --port 8000
"""

import io
import os
import json
import logging
import textwrap
from typing import Optional

import pandas as pd
from google import genai
from google.genai.errors import ClientError as GeminiClientError, ServerError as GeminiServerError
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from groq import Groq, APIError, APIConnectionError, RateLimitError
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------

# Load environment variables from .env (GROQ_API_KEY, GEMINI_API_KEY, etc.)
load_dotenv()

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("promptinsights")

# Groq client — will raise at import-time if key is missing
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise EnvironmentError(
        "GROQ_API_KEY is not set. "
        "Add it to your .env file or export it as an environment variable."
    )

groq_client = Groq(api_key=GROQ_API_KEY)

# Gemini client — optional fallback; gracefully disabled if key is absent
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None   # initialised below if key is present

if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Gemini fallback client ready (google-genai SDK, model: gemini-1.5-flash).")
    except Exception as _ge:
        logger.error("Failed to initialise Gemini client: %s", _ge)
else:
    logger.warning("GEMINI_API_KEY not set — Gemini fallback will not be available.")

# Two model name variants to try — the new google-genai SDK sometimes requires
# the plain name, sometimes the versioned alias. We try both automatically.
GEMINI_MODEL          = "gemini-1.5-flash"        # primary
GEMINI_MODEL_FALLBACK = "gemini-1.5-flash-latest" # stable fallback alias


def _gemini_generate(prompt: str) -> str:
    """
    Call Gemini via the google-genai SDK (google-genai package).

    Strategy
    --------
    1. Try GEMINI_MODEL ('gemini-1.5-flash').
    2. If the SDK raises a ClientError with HTTP 404 (model not found),
       retry once with GEMINI_MODEL_FALLBACK ('gemini-1.5-flash-latest').
    3. Any other error (rate-limit, auth, server error) is re-raised
       immediately so the caller can log and return a 503 response.

    Returns
    -------
    str  — the model's text response, stripped of leading/trailing whitespace.

    Raises
    ------
    RuntimeError        if gemini_client was not initialised (missing API key).
    GeminiClientError   on 4xx responses other than 404 (auth, bad-request …).
    GeminiServerError   on 5xx responses (Gemini service degraded).
    Exception           any other unexpected error.
    """
    if not gemini_client:
        raise RuntimeError(
            "Gemini client not initialised — GEMINI_API_KEY is missing or invalid."
        )

    def _call(model_name: str) -> str:
        """Single generate_content call; extracts the text from the response."""
        response = gemini_client.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        # GenerateContentResponse exposes .text as a convenience property
        text = getattr(response, "text", None)
        if text is None:
            # Belt-and-suspenders: walk the candidates list
            text = response.candidates[0].content.parts[0].text
        return text.strip()

    try:
        return _call(GEMINI_MODEL)

    except GeminiClientError as exc:
        # .status holds the HTTP status code (404, 400, 403 …)
        http_status = getattr(exc, "status", None)
        if http_status == 404:
            logger.warning(
                "Gemini model '%s' returned 404 — retrying with '%s'…",
                GEMINI_MODEL, GEMINI_MODEL_FALLBACK,
            )
            # Any exception from the fallback propagates directly to the caller
            return _call(GEMINI_MODEL_FALLBACK)
        # 400 bad-request, 401/403 auth errors — no point retrying
        logger.error("Gemini ClientError HTTP %s: %s", http_status, exc)
        raise

    except GeminiServerError as exc:
        # 5xx from Gemini — service is degraded, fail fast
        logger.error("Gemini ServerError: %s", exc)
        raise


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="PromptInsights API",
    description="AI-driven Exploratory Data Analysis powered by Groq.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS Middleware
# Allow the React dev server (localhost:3000) and any production origin you
# add later. Adjust `allow_origins` before deploying to production.
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React dev server (CRA / Vite)
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are PromptInsights AI, a senior professional data analyst and statistician.

Your role is to help users understand their datasets through clear, precise, and actionable analysis.

## Response Format
- Use **bold** for key metrics, column names, and important values.
- Use bullet points for lists of findings.
- Use numbered lists for step-by-step recommendations.
- Keep responses concise yet comprehensive — avoid filler text.
- If code is needed, use clean Python (pandas / NumPy / matplotlib).

## Visual Rules

### Rule 1 — When to generate a chart
Whenever the user asks for a **comparison**, **distribution**, or **trend**, you MUST follow your written text analysis with one or more JSON chart blocks.
Additionally, automatically trigger a chart if the user's message contains any of these words: **compare**, **trend**, **distribution**, **spread**, **relationship**, **breakdown**, **proportion**, **correlation**, **top**, **ranking**.

### Rule 2 — How to choose the chart type
- `"bar"` → categorical comparisons, distributions across categories, rankings.
- `"line"` → time-series data, sequential trends, changes over an ordered axis.
- `"pie"` → parts-of-a-whole, proportions, percentage breakdowns.
- `"scatter"` → correlations or relationships between two numerical variables.

### Rule 3 — Strict JSON format
Every chart block MUST be a standalone, valid JSON object on its own line(s) with exactly these keys:
```
{"type": "chart", "chart_type": "<bar|line|pie|scatter>", "title": "<Short descriptive title>", "data": [<data points>]}
```
- For bar / line / pie: each data point is `{"name": "Label", "value": 123}`.
- For scatter: each data point is `{"x": 1.2, "y": 3.4, "name": "optional label"}`.
- Do NOT wrap the JSON in markdown code fences — output the raw JSON object directly.

### Rule 4 — Data precision
Populate chart `data` values using the **actual statistics** from the Pandas summary provided in the context (mean, min, max, count, std, quartiles). Never estimate or fabricate values when the statistical summary is available. Round numeric values to 2 decimal places.

### Rule 5 — Multiple charts
You may include multiple chart blocks in a single response if the analysis warrants it. Each chart block must be a separate, complete JSON object.

### Example response
Here is the revenue breakdown by category:

**Key findings:**
- **Electronics** leads with a mean of **$45.2K**
- **Clothing** follows at **$32.1K**

{"type": "chart", "chart_type": "bar", "title": "Mean Revenue by Category", "data": [{"name": "Electronics", "value": 45200}, {"name": "Clothing", "value": 32100}, {"name": "Food", "value": 18400}]}

The monthly trend shows steady growth:

{"type": "chart", "chart_type": "line", "title": "Monthly Revenue Trend", "data": [{"name": "Jan", "value": 12000}, {"name": "Feb", "value": 14500}, {"name": "Mar", "value": 17800}]}

## Behaviour
- Always acknowledge what the user asked before answering.
- Flag data quality issues (nulls, outliers, type mismatches) proactively.
- Recommend appropriate statistical tests when relevant.
- Never fabricate data or statistics — if you cannot determine something from the provided context, say so clearly.
"""

# ---------------------------------------------------------------------------
# Statistical summary helper
# ---------------------------------------------------------------------------


def build_statistical_summary(csv_text: str) -> str:
    """
    Parse *csv_text* into a DataFrame and return a compact statistical
    summary string suitable for injection into the system prompt.

    Returns an empty string when parsing fails so the caller can
    gracefully fall back to the raw CSV preview.
    """
    try:
        df = pd.read_csv(io.StringIO(csv_text.strip()))
    except Exception as exc:  # noqa: BLE001
        logger.warning("CSV parse failed in build_statistical_summary: %s", exc)
        return ""

    rows, cols = df.shape

    # Numerical describe — round to 4 d.p. for readability
    describe_str = df.describe(include="all").round(4).to_string()

    # Column types
    dtypes_str = df.dtypes.to_string()

    # Null / missing counts
    null_counts = df.isnull().sum()
    null_str = null_counts[null_counts > 0].to_string() if null_counts.any() else "None"

    summary = textwrap.dedent(f"""\
        DATASET OVERVIEW
        ================
        Rows : {rows:,}
        Columns : {cols}  →  {list(df.columns)}

        COLUMN TYPES
        ------------
        {dtypes_str}

        MISSING VALUES (columns with nulls only)
        ----------------------------------------
        {null_str}

        STATISTICAL SUMMARY  (describe)
        --------------------------------
        {describe_str}
    """)

    logger.info(
        "Statistical summary built — %d rows × %d cols, summary length %d chars",
        rows, cols, len(summary),
    )
    return summary


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class ChatRequest(BaseModel):
    """Incoming chat message from the frontend."""

    message: str
    context: Optional[str] = None   # Legacy: raw CSV preview rows (first N rows)
    csv_data: Optional[str] = None  # Full CSV text for statistical analysis

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Show me the top 5 correlations in my dataset.",
                "csv_data": "col_a,col_b,col_c\n1,foo,0.5\n2,bar,1.2",
            }
        }


class ChatResponse(BaseModel):
    """Successful AI response."""

    reply: str


class ErrorResponse(BaseModel):
    """Structured error payload."""

    error: str
    detail: str


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/", tags=["Health"])
async def root():
    """Basic health-check endpoint."""
    return {"status": "ok", "service": "PromptInsights API", "model": MODEL}


# ---------------------------------------------------------------------------
# /api/chat  —  Main inference endpoint
# ---------------------------------------------------------------------------


@app.post(
    "/api/chat",
    response_model=ChatResponse,
    tags=["Chat"],
    summary="Send a message to PromptInsights AI",
    responses={
        200: {"description": "AI response returned successfully."},
        422: {"description": "Validation error — `message` field is required."},
        429: {"description": "Groq rate limit exceeded. Retry after a short delay."},
        502: {"description": "Upstream Groq API error."},
    },
)
async def chat(request: ChatRequest):
    """
    Accept a plain-text message and return an AI-generated analysis.

    **Request body**
    ```json
    { "message": "What are the key trends in my data?" }
    ```

    **Response body**
    ```json
    { "reply": "..." }
    ```
    """
    user_message = request.message.strip()

    if not user_message:
        raise HTTPException(
            status_code=422,
            detail="The `message` field must not be empty.",
        )

    # ── Build a statistically-enriched system prompt ──────────────────────
    #
    # Priority:
    #   1. csv_data  → full Pandas statistical summary  (preferred)
    #   2. context   → legacy raw CSV preview rows       (fallback)
    #   3. Neither   → use the base system prompt

    raw_csv   = (request.csv_data or "").strip()
    legacy_ctx = (request.context or "").strip()

    if raw_csv:
        stat_summary = build_statistical_summary(raw_csv)

        if stat_summary:
            system_prompt = (
                SYSTEM_PROMPT
                + "\n\n## Full Dataset — Statistical Analysis\n"
                "You are a professional data analyst. "
                "Use the following statistical summary of the **ENTIRE** dataset "
                "to answer the user's questions. "
                "Do NOT say you cannot see the data — the summary below gives you "
                "all the numerical facts you need.\n"
                "When generating chart JSON blocks, populate the `data` array with "
                "**real values** from this summary (mean, min, max, count, std, "
                "quartiles). Never guess or fabricate numbers.\n\n"
                f"```\n{stat_summary}\n```"
            )
            logger.info(
                "Statistical context injected — %d summary chars", len(stat_summary)
            )
        else:
            # Pandas failed (e.g. malformed CSV) — fall back to raw text
            system_prompt = (
                SYSTEM_PROMPT
                + "\n\n## Dataset Context (raw CSV)\n"
                f"```csv\n{raw_csv[:4000]}\n```"  # hard cap to avoid token overflow
            )
            logger.warning("Statistical summary unavailable; injecting raw CSV preview.")

    elif legacy_ctx:
        system_prompt = (
            SYSTEM_PROMPT
            + "\n\n## Dataset Context\n"
            "You are analysing a specific dataset. "
            "Below is the schema (column headers) and a sample of the first rows.\n"
            "Use this information to give precise, data-specific answers.\n\n"
            f"```csv\n{legacy_ctx}\n```"
        )
        logger.info("Legacy context-aware prompt — %d context chars", len(legacy_ctx))

    else:
        system_prompt = SYSTEM_PROMPT

    logger.info("Incoming chat request — %d chars", len(user_message))

    try:
        completion = groq_client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            temperature=0.45,      # balanced: creative yet precise
            max_tokens=1024,
            top_p=0.95,
            stream=False,
        )

        reply = completion.choices[0].message.content.strip()
        logger.info("Response generated — %d chars", len(reply))
        return ChatResponse(reply=reply)

    except RateLimitError as exc:
        logger.warning("Groq rate limit hit: %s", exc)
        raise HTTPException(
            status_code=429,
            detail="The AI service is temporarily busy. Please wait a moment and try again.",
        ) from exc

    except APIConnectionError as exc:
        logger.error("Groq connection error: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Unable to reach the AI service. Check your network connection.",
        ) from exc

    except APIError as exc:
        logger.error("Groq API error [%s]: %s", exc.status_code, exc.message)
        raise HTTPException(
            status_code=502,
            detail=f"AI service returned an error: {exc.message}",
        ) from exc

    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error during chat completion")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again.",
        ) from exc


# ===========================================================================
#  REPORT GENERATION ENGINE
# ===========================================================================
#  Everything below is additive — no existing code above has been modified.
# ===========================================================================


# ---------------------------------------------------------------------------
# Report-specific constants
# ---------------------------------------------------------------------------

REPORT_MODEL = "llama-3.3-70b-versatile"

REPORT_SYSTEM_PROMPT = textwrap.dedent("""\
    You are an expert Data Consultant.

    You will receive a **Fact Sheet** of raw statistics derived from a real
    dataset.  Your job is to write a formal, four-section analytical report
    using **only** the data provided — never fabricate numbers.

    ## Report Structure (use these exact Markdown headings)

    ### 1. Executive Summary
    A concise overview of the dataset, its size, scope, and the most
    important takeaway in 3–4 sentences.

    ### 2. Key Statistical Trends
    Highlight the most significant patterns — top correlations, notable
    means / medians, and any skewed distributions.  Use bullet points with
    bold metric names.

    ### 3. Critical Risk Factors
    Identify anomalies, outliers, data-quality issues, or any findings that
    could mislead analysis if ignored.  Be specific (column names, values).

    ### 4. Actionable Recommendations
    Provide 3–5 numbered, concrete next-steps a data team should take based
    on the findings above.

    ## Formatting Rules
    - Use professional, objective language.
    - Format the entire report in clean Markdown.
    - Bold all column names and key statistics.
    - Keep the total length under 800 words.
""")

VISUALIZATION_SYSTEM_PROMPT = textwrap.dedent("""\
    You are a Data Visualization Expert.
    Given a summary of a dataset (column types and key statistics), your goal is to select the 4 most insightful, non-repeating chart types to represent the data.
    
    ## Supported Chart Types:
    - "bar": Best for categorical comparisons or distributions.
    - "line": Best for trends or sequential data.
    - "pie": Best for proportions/parts-of-a-whole (limit to columns with < 10 unique values).
    - "area": Best for cumulative trends or showing volume over time.
    - "scatter": Best for showing relationships between two numeric variables.

    ## Requirements:
    1. Select exactly 4 charts.
    2. Do NOT repeat chart types.
    3. For each chart, provide a title and the data points.
    4. For "bar", "line", "pie", and "area", the data should be a list of {"name": string, "value": number}.
    5. For "scatter", the data should be a list of {"x": number, "y": number, "name": string}.
    6. Use the provided statistics (means, medians, top correlations, value counts) to populate the data. Round numbers to 2 decimal places.
    7. Return ONLY a JSON object with a single key "visualizations" which is an array of the 4 chart objects.
    
    Example Output:
    {
      "visualizations": [
        {
          "type": "pie",
          "title": "Market Share",
          "data": [{"name": "A", "value": 40}, {"name": "B", "value": 60}]
        },
        ...
      ]
    }
""")



# ---------------------------------------------------------------------------
# Deep-scan helper — builds the "Fact Sheet" from raw CSV
# ---------------------------------------------------------------------------

def build_fact_sheet(csv_text: str) -> str:
    """
    Perform a deep statistical scan of *csv_text* and return a compact
    'Fact Sheet' string optimised for large files (300k+ rows).

    Strategy
    --------
    1.  Schema + dtypes are always included first so the AI sees the full
        column map even when rows are sampled.
    2.  df.describe(include='all') is always computed over the FULL dataset
        so statistics are accurate regardless of row count.
    3.  Row samples: head(5) + tail(5) + random 20 rows when df > 1,000 rows;
        all rows otherwise.
    4.  Per-column null % is reported explicitly for data-quality analysis.
    5.  The final string is hard-capped at 4,000 characters; if it exceeds
        this the middle section is replaced with '[Data truncated for brevity]'.
    """
    import numpy as np

    MAX_CHARS = 4_000
    SAMPLE_THRESHOLD = 1_000
    RANDOM_SAMPLE_N = 20

    df = pd.read_csv(io.StringIO(csv_text.strip()))
    rows, cols = df.shape

    numeric_df  = df.select_dtypes(include="number")
    cat_cols    = df.select_dtypes(exclude="number").columns.tolist()

    # ── 1. Schema (always full) ───────────────────────────────────────────
    dtype_lines = "\n".join(
        f"  {col}: {dtype}" for col, dtype in df.dtypes.items()
    )

    # ── 2. Per-column null % ──────────────────────────────────────────────
    null_pct = (df.isnull().mean() * 100).round(2)
    null_lines = "\n".join(
        f"  • {col}: {pct}% missing"
        for col, pct in null_pct.items()
        if pct > 0
    )
    null_section = null_lines if null_lines else "  No missing values."

    # ── 3. Full-dataset describe ──────────────────────────────────────────
    desc_str = (
        df.describe(include="all").round(4).to_string()
        if not df.empty
        else "N/A"
    )

    # ── 4. Intelligent row sampling ───────────────────────────────────────
    if rows > SAMPLE_THRESHOLD:
        head_rows   = df.head(5)
        tail_rows   = df.tail(5)
        random_rows = df.sample(
            n=min(RANDOM_SAMPLE_N, rows), random_state=42
        )
        sample_df   = (
            pd.concat([head_rows, random_rows, tail_rows])
            .drop_duplicates()
        )
        sample_note = (
            f"(Dataset has {rows:,} rows — showing head(5), "
            f"tail(5), and {RANDOM_SAMPLE_N} random rows)"
        )
    else:
        sample_df   = df
        sample_note = f"(Full dataset — {rows:,} rows)"

    sample_str = sample_df.to_string(index=False, max_cols=20)

    # ── 5. Top-3 correlations ─────────────────────────────────────────────
    corr_section = "No numeric correlations available."
    if numeric_df.shape[1] >= 2:
        corr  = numeric_df.corr()
        mask  = ~np.eye(corr.shape[0], dtype=bool)
        pairs = corr.where(mask).stack().reset_index()
        pairs.columns = ["Var1", "Var2", "Correlation"]
        pairs["key"] = pairs.apply(
            lambda r: tuple(sorted([r["Var1"], r["Var2"]])), axis=1
        )
        pairs = pairs.drop_duplicates(subset="key").drop(columns="key")
        pairs["AbsCorr"] = pairs["Correlation"].abs()
        top3  = pairs.nlargest(3, "AbsCorr")
        corr_lines = [
            f"  • {r['Var1']} ↔ {r['Var2']}: r = {r['Correlation']:.4f}"
            for _, r in top3.iterrows()
        ]
        corr_section = "\n".join(corr_lines)

    # ── 6. Outlier summary (IQR) ──────────────────────────────────────────
    outlier_lines = []
    for col in numeric_df.columns:
        q1, q3 = numeric_df[col].quantile(0.25), numeric_df[col].quantile(0.75)
        iqr     = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        n_out = int(((numeric_df[col] < lower) | (numeric_df[col] > upper)).sum())
        if n_out:
            outlier_lines.append(
                f"  • {col}: {n_out} outlier(s) [bounds: {lower:.2f} – {upper:.2f}]"
            )
    outlier_section = (
        "\n".join(outlier_lines) if outlier_lines else "  No significant outliers."
    )

    # ── 7. Top categorical values ─────────────────────────────────────────
    cat_summary = []
    for col in cat_cols:
        top_v = df[col].value_counts().head(5)
        v_str = ", ".join(f"{k}: {v}" for k, v in top_v.items())
        cat_summary.append(f"  • {col}: {v_str}")
    cat_section = "\n".join(cat_summary) if cat_summary else "  No categorical columns."

    # ── Assemble ──────────────────────────────────────────────────────────
    fact_sheet = textwrap.dedent(f"""\
        FACT SHEET — Optimised Dataset Scan
        =====================================
        Rows : {rows:,}   |   Columns : {cols}

        COLUMN SCHEMA & DTYPES
        ----------------------
        {dtype_lines}

        DATA QUALITY — NULL % PER COLUMN
        ---------------------------------
        {null_section}

        DESCRIPTIVE STATISTICS (full dataset)
        --------------------------------------
        {desc_str}

        TOP CATEGORICAL VALUES
        ----------------------
        {cat_section}

        TOP 3 CORRELATIONS
        ------------------
        {corr_section}

        OUTLIERS (IQR method)
        ---------------------
        {outlier_section}

        ROW SAMPLE {sample_note}
        --------------------------------------------------
        {sample_str}
    """)

    # ── 8. Hard 4,000-char cap with middle truncation ─────────────────────
    if len(fact_sheet) > MAX_CHARS:
        keep  = (MAX_CHARS - 40) // 2          # chars to keep on each side
        note  = "\n\n[Data truncated for brevity]\n\n"
        fact_sheet = fact_sheet[:keep] + note + fact_sheet[-keep:]

    logger.info(
        "Fact sheet built — %d rows × %d cols, %d chars (cap: %d)",
        rows, cols, len(fact_sheet), MAX_CHARS,
    )
    return fact_sheet

    logger.info(
        "Fact sheet built — %d rows × %d cols, %d chars",
        rows, cols, len(fact_sheet),
    )
    return fact_sheet


# ---------------------------------------------------------------------------
# Visual chart data builder — generates chart-ready arrays for the dashboard
# ---------------------------------------------------------------------------

async def generate_ai_visualizations(fact_sheet: str) -> list:
    """
    Calls Groq to select and generate data for 4 diverse charts based on the fact sheet.
    """
    try:
        completion = groq_client.chat.completions.create(
            model=REPORT_MODEL,
            messages=[
                {"role": "system", "content": VISUALIZATION_SYSTEM_PROMPT},
                {"role": "user", "content": f"Based on this Fact Sheet, generate the 4 charts:\n\n{fact_sheet}"},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        import json
        res = json.loads(completion.choices[0].message.content.strip())
        return res.get("visualizations", [])
    except Exception as exc:
        logger.error("AI Visualization generation failed: %s", exc)
        return []


def build_visuals(df: pd.DataFrame) -> list:
    """
    Generate exactly 4 diverse chart configurations dynamically based on the dataset.
    """
    charts = []
    if df.empty:
        return charts
        
    numerical_cols = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = df.select_dtypes(exclude="number").columns.tolist()
    
    # Try to identify date columns
    date_cols = []
    for col in categorical_cols.copy():
        if df[col].astype(str).str.match(r'^\d{4}-\d{2}-\d{2}').any() or \
           df[col].astype(str).str.match(r'^\d{2}/\d{2}/\d{4}').any():
            date_cols.append(col)
            categorical_cols.remove(col)
            
    used_cols = set()
    
    def format_data(series_or_dict):
        data = []
        for k, v in series_or_dict.items():
            if pd.isna(v): continue
            name = f"{k.left:.1f}-{k.right:.1f}" if hasattr(k, 'left') else str(k)
            data.append({"name": name, "value": float(v)})
        return data

    def get_distribution_data(col_name, num_bins=5):
        if df[col_name].nunique() < 2:
            return format_data(df[col_name].value_counts())
        try:
            return format_data(pd.cut(df[col_name], bins=num_bins).value_counts().sort_index())
        except Exception:
            return format_data(df[col_name].value_counts().head(num_bins))

    # Chart 1 (Categorical): Pie or Donut
    if categorical_cols:
        c1 = categorical_cols[0]
        used_cols.add(c1)
        counts = df[c1].value_counts().head(5)
        charts.append({"type": "pie", "title": f"Distribution of {c1}", "data": format_data(counts)})
    elif numerical_cols:
        n1 = numerical_cols[0]
        used_cols.add(n1)
        charts.append({"type": "pie", "title": f"Distribution of {n1}", "data": get_distribution_data(n1, 5)})

    # Chart 2 (Numerical): Bar chart of distribution
    num_candidates = [c for c in numerical_cols if c not in used_cols]
    if num_candidates:
        n2 = num_candidates[0]
        used_cols.add(n2)
        charts.append({"type": "bar", "title": f"{n2} Distribution", "data": get_distribution_data(n2, 7)})
    elif numerical_cols:
        n2 = numerical_cols[0]
        charts.append({"type": "bar", "title": f"{n2} Distribution", "data": get_distribution_data(n2, 7)})
    elif categorical_cols:
        c2 = categorical_cols[-1]
        counts = df[c2].value_counts().head(7)
        charts.append({"type": "bar", "title": f"Counts of {c2}", "data": format_data(counts)})

    # Chart 3 (Trend/Relationship): Line or Area
    if date_cols and numerical_cols:
        d_col = date_cols[0]
        n_col = numerical_cols[0]
        df_temp = df.copy()
        df_temp[d_col] = pd.to_datetime(df_temp[d_col], errors='coerce')
        trend = df_temp.groupby(df_temp[d_col].dt.date)[n_col].mean().dropna().head(10)
        charts.append({"type": "line", "title": f"Trend of {n_col} over Time", "data": format_data(trend)})
    elif len(numerical_cols) >= 2:
        n_col1 = numerical_cols[0]
        n_col2 = numerical_cols[1]
        temp = df[[n_col1, n_col2]].dropna().sort_values(n_col1).head(20)
        data = [{"name": str(row[n_col1]), "value": float(row[n_col2])} for _, row in temp.iterrows()]
        charts.append({"type": "area", "title": f"{n_col2} by {n_col1}", "data": data})
    elif numerical_cols:
        n_col = numerical_cols[0]
        temp = df[n_col].dropna().head(20)
        data = [{"name": str(i), "value": float(v)} for i, v in enumerate(temp)]
        charts.append({"type": "area", "title": f"{n_col} Values", "data": data})
    else:
        charts.append({"type": "line", "title": "Row Count", "data": [{"name": "Rows", "value": len(df)}]})

    # Chart 4 (Comparison): Radar
    cat_candidates = [c for c in categorical_cols if c not in used_cols]
    if cat_candidates and numerical_cols:
        c_col = cat_candidates[0]
        n_col = numerical_cols[-1]
        grouped = df.groupby(c_col)[n_col].mean().dropna().sort_values(ascending=False).head(5)
        charts.append({"type": "radar", "title": f"Avg {n_col} by {c_col}", "data": format_data(grouped)})
    elif len(categorical_cols) >= 2:
        c_col = categorical_cols[1]
        counts = df[c_col].value_counts().head(5)
        charts.append({"type": "radar", "title": f"Comparison of {c_col}", "data": format_data(counts)})
    elif len(numerical_cols) >= 2:
        stats = [{"name": col, "value": float(df[col].mean())} for col in numerical_cols[:5]]
        charts.append({"type": "radar", "title": "Mean Comparison", "data": stats})
    else:
        charts.append({"type": "radar", "title": "Total Rows", "data": [{"name": "Count", "value": len(df)}]})

    # Fallback to ensure exactly 4 charts are returned
    while len(charts) < 4:
        charts.append({"type": "bar", "title": f"Chart {len(charts)+1}", "data": [{"name": "A", "value": 1}]})

    return charts[:4]


# ---------------------------------------------------------------------------
# Request / Response schemas for Report Generation
# ---------------------------------------------------------------------------

class ReportRequest(BaseModel):
    """Incoming request for automated report generation."""
    csv_data: str  # Full CSV text

    class Config:
        json_schema_extra = {
            "example": {
                "csv_data": "col_a,col_b,col_c\n1,foo,0.5\n2,bar,1.2",
            }
        }


class ReportResponse(BaseModel):
    """Generated report payload."""
    report: str                    # Full Markdown report
    fact_sheet: str                 # Raw fact sheet used for transparency
    row_count: int                 # Total rows in the dataset
    column_count: int              # Total columns
    column_names: list             # List of column name strings
    null_percentage: float         # Overall data completeness inverse
    visuals: dict                  # Auto-generated chart data for the dashboard


# ---------------------------------------------------------------------------
# /api/generate-report  —  Automated Report Generation endpoint
# ---------------------------------------------------------------------------

@app.post(
    "/api/generate-report",
    response_model=ReportResponse,
    tags=["Report"],
    summary="Generate a formal analytical report from a CSV dataset",
    responses={
        200: {"description": "Report generated successfully."},
        422: {"description": "Validation error — `csv_data` field is required."},
        429: {"description": "Groq rate limit exceeded. Retry after a short delay."},
        502: {"description": "Upstream Groq API error."},
    },
)
async def generate_report(request: ReportRequest):
    """
    Perform a deep statistical scan of the uploaded CSV and generate a
    formal four-section analytical report via the Groq LLM.

    **Request body**
    ```json
    { "csv_data": "col_a,col_b\\n1,2\\n3,4" }
    ```

    **Response body**
    ```json
    { "report": "### 1. Executive Summary …", "fact_sheet": "…" }
    ```
    """
    csv_text = request.csv_data.strip()

    if not csv_text:
        raise HTTPException(
            status_code=422,
            detail="The `csv_data` field must not be empty.",
        )

    # ── Step 1: Deep Pandas scan → Fact Sheet ─────────────────────────────
    try:
        fact_sheet = build_fact_sheet(csv_text)
        # Also parse for metadata to return to the frontend
        df_meta = pd.read_csv(io.StringIO(csv_text))
        row_count = int(df_meta.shape[0])
        column_count = int(df_meta.shape[1])
        column_names = list(df_meta.columns)
        total_cells = row_count * column_count
        null_cells = int(df_meta.isnull().sum().sum())
        null_percentage = round((null_cells / total_cells) * 100, 2) if total_cells else 0.0
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to build fact sheet from CSV")
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse CSV data: {exc}",
        ) from exc

    logger.info("Report generation started — %d rows × %d cols, fact sheet: %d chars", row_count, column_count, len(fact_sheet))

    # ── Step 1b: Build visual chart data from the DataFrame ───────────────
    numerical_cols = df_meta.select_dtypes(include="number").columns.tolist()
    categorical_cols = df_meta.select_dtypes(exclude="number").columns.tolist()

    # Build the shared visualization prompt content
    _vis_user_content = (
        f"Numeric columns: {numerical_cols}\n"
        f"Categorical columns: {categorical_cols}\n\n"
        "Based on these column types, select the 4 most insightful, non-repeating chart types. "
        "Return a JSON object with a single key 'visualizations' whose value is an array of 4 chart objects, "
        "each having: type (bar, line, pie, area, or scatter), title, and data. "
        "For bar, line, pie, and area: data is an array of {'name': string, 'value': number}. "
        "For scatter: data is an array of {'x': number, 'y': number, 'name': string}.\n\n"
        "Populate the data array with real numbers from the Fact Sheet below:\n\n"
        f"{fact_sheet}"
    )
    _vis_system_content = "You are a Data Visualization Expert. Return ONLY a valid JSON object."

    try:
        vis_completion = groq_client.chat.completions.create(
            model=REPORT_MODEL,
            messages=[
                {"role": "system", "content": _vis_system_content},
                {"role": "user",   "content": _vis_user_content},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        vis_res = json.loads(vis_completion.choices[0].message.content.strip())
        visuals = vis_res.get("visualizations", [])
        logger.info("Visualizations generated via Groq — %d charts", len(visuals))

    except (RateLimitError, Exception) as exc:
        logger.warning("Groq failed for visualizations, switching to Gemini... (%s)", exc)
        try:
            _vis_prompt = f"{_vis_system_content}\n\n{_vis_user_content}"
            vis_text = _gemini_generate(_vis_prompt)
            vis_res  = json.loads(vis_text)
            visuals  = vis_res.get("visualizations", [])
            logger.info("Visualizations generated via Gemini fallback — %d charts", len(visuals))
        except Exception as gemini_exc:
            logger.error("Gemini visualization fallback failed: %s", gemini_exc)
            visuals = build_visuals(df_meta)

    # ── Step 2: LLM call → formal report  (Groq → Gemini fallback) ──────
    _report_user_content = (
        "Here is the Fact Sheet for the dataset. "
        "Write the formal four-section report now.\n\n"
        f"{fact_sheet}"
    )

    report_md: Optional[str] = None

    # ── 2a: Try Groq first ────────────────────────────────────────────────
    try:
        report_completion = groq_client.chat.completions.create(
            model=REPORT_MODEL,
            messages=[
                {"role": "system", "content": REPORT_SYSTEM_PROMPT},
                {"role": "user",   "content": _report_user_content},
            ],
            temperature=0.35,
            max_tokens=2048,
            top_p=0.90,
            stream=False,
        )
        report_md = report_completion.choices[0].message.content.strip()
        logger.info("Report generated via Groq — %d chars", len(report_md))

    except (RateLimitError, APIConnectionError, APIError, Exception) as exc:
        logger.warning("Groq failed, switching to Gemini... (%s: %s)", type(exc).__name__, exc)

        # ── 2b: Gemini fallback ───────────────────────────────────────────
        try:
            _full_report_prompt = f"{REPORT_SYSTEM_PROMPT}\n\n{_report_user_content}"
            report_md = _gemini_generate(_full_report_prompt)
            logger.info("Report generated via Gemini fallback — %d chars", len(report_md))

        except Exception as gemini_exc:
            logger.error("Gemini report fallback also failed: %s", gemini_exc)
            # Server stays alive — return 503 instead of crashing with a traceback
            return JSONResponse(
                status_code=503,
                content={
                    "error": "AI engines are overloaded. Please try again in 15 minutes.",
                    "detail": str(gemini_exc),
                },
            )

    # ── Step 3: Return assembled response ─────────────────────────────────
    logger.info("Report complete — %d chars, %d visualizations", len(report_md), len(visuals))
    return ReportResponse(
        report=report_md,
        fact_sheet=fact_sheet,
        row_count=row_count,
        column_count=column_count,
        column_names=column_names,
        null_percentage=null_percentage,
        visuals={"charts": visuals},
    )


# ===========================================================================
#  SECTION-BASED AI ANALYSIS ENGINE
# ===========================================================================

# ---------------------------------------------------------------------------
# Section prompt dictionary — each section type has a tailored system role
# ---------------------------------------------------------------------------

SECTION_PROMPTS: dict[str, str] = {
    "executive_summary": (
        "Act as a Senior Data Consultant. "
        "Summarize this dataset in 3 professional paragraphs. "
        "Focus on business impact."
    ),
    "trends": (
        "Analyze the statistical distributions and correlations. "
        "Identify 3 specific patterns that a stakeholder should care about."
    ),
    "risks": (
        "Identify anomalies, missing data issues, and outliers. "
        "Explain how these could lead to biased decisions."
    ),
    "roadmap": (
        "Provide a 5-step strategic roadmap based on these findings. "
        "Use professional, actionable language."
    ),
}

SECTION_MODEL = "llama-3.3-70b-versatile"


# ---------------------------------------------------------------------------
# Request / Response schemas for Section Analysis
# ---------------------------------------------------------------------------

class SectionRequest(BaseModel):
    """Incoming request for a single section of the narrative report."""

    section_type: str   # one of: executive_summary | trends | risks | roadmap
    data_summary: str   # the fact sheet / statistical summary of the dataset

    class Config:
        json_schema_extra = {
            "example": {
                "section_type": "trends",
                "data_summary": "Rows: 5000 | Columns: 12 | Mean age: 34.2 …",
            }
        }


class SectionResponse(BaseModel):
    """AI-generated content for a single report section."""

    content: str


# ---------------------------------------------------------------------------
# /analyze/section  —  Section-Based AI Analysis endpoint
# ---------------------------------------------------------------------------

@app.post(
    "/analyze/section",
    response_model=SectionResponse,
    tags=["Section Analysis"],
    summary="Generate AI analysis for a specific report section",
    responses={
        200: {"description": "Section content generated successfully."},
        400: {"description": "Unknown section_type requested."},
        422: {"description": "Validation error — required fields missing."},
        502: {"description": "Both Groq and Gemini are unavailable."},
    },
)
async def analyze_section(request: SectionRequest):
    """
    Generate professional AI analysis for a single narrative report section.

    **Supported section_type values:**
    - `executive_summary` — 3-paragraph business-impact overview
    - `trends` — 3 stakeholder-relevant statistical patterns
    - `risks` — anomalies, nulls, outliers and bias implications
    - `roadmap` — 5-step strategic action plan

    **Request body**
    ```json
    {
      "section_type": "executive_summary",
      "data_summary": "Rows: 10000 | Columns: 8 | …"
    }
    ```

    **Response body**
    ```json
    { "content": "## Executive Summary\\n\\nThis dataset …" }
    ```
    """
    section_type = request.section_type.strip().lower()
    data_summary = request.data_summary.strip()

    # ── Validate section type ──────────────────────────────────────────────
    if section_type not in SECTION_PROMPTS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown section_type '{section_type}'. "
                f"Valid values: {list(SECTION_PROMPTS.keys())}"
            ),
        )

    if not data_summary:
        raise HTTPException(
            status_code=422,
            detail="The `data_summary` field must not be empty.",
        )

    system_prompt = SECTION_PROMPTS[section_type]
    user_message = (
        f"Here is the dataset statistical summary. "
        f"Please produce the '{section_type.replace('_', ' ').title()}' section now.\n\n"
        f"{data_summary}"
    )

    logger.info(
        "Section analysis requested — type='%s', summary_len=%d",
        section_type, len(data_summary),
    )

    content: Optional[str] = None

    # ── Try Groq first ─────────────────────────────────────────────────────
    try:
        completion = groq_client.chat.completions.create(
            model=SECTION_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            temperature=0.40,
            max_tokens=1024,
            top_p=0.92,
            stream=False,
        )
        content = completion.choices[0].message.content.strip()
        logger.info(
            "Section '%s' generated via Groq — %d chars", section_type, len(content)
        )

    except (RateLimitError, APIConnectionError, APIError, Exception) as exc:
        logger.warning(
            "Groq failed for section '%s' (%s: %s) — trying Gemini fallback…",
            section_type, type(exc).__name__, exc,
        )

        # ── Gemini fallback ────────────────────────────────────────────────
        try:
            _full_prompt = f"{system_prompt}\n\n{user_message}"
            content = _gemini_generate(_full_prompt)
            logger.info(
                "Section '%s' generated via Gemini fallback — %d chars",
                section_type, len(content),
            )

        except Exception as gemini_exc:
            logger.error(
                "Gemini fallback also failed for section '%s': %s", section_type, gemini_exc
            )
            # Return 503 — server stays alive, no traceback
            return JSONResponse(
                status_code=503,
                content={
                    "error": "AI engines are overloaded. Please try again in 15 minutes.",
                    "detail": str(gemini_exc),
                },
            )

    return SectionResponse(content=content)


# ===========================================================================
#  SERVER-SIDE PDF GENERATION  (Playwright / Headless Chromium)
# ===========================================================================

from fastapi import Request as FastAPIRequest
from fastapi.responses import Response as FastAPIResponse, JSONResponse as FastAPIJSONResponse


class PDFRequest(BaseModel):
    """HTML payload for server-side PDF rendering."""

    html: str          # Full self-contained HTML of the report
    filename: str = "PromptInsights_Report.pdf"

    class Config:
        json_schema_extra = {
            "example": {
                "html": "<!DOCTYPE html><html><body><h1>Report</h1></body></html>",
                "filename": "dataset_Report.pdf",
            }
        }


@app.post(
    "/generate-pdf",
    tags=["PDF"],
    summary="Server-side PDF generation via Playwright headless Chromium",
    responses={
        200: {"description": "PDF binary returned as application/pdf."},
        500: {"description": "Playwright rendering failed."},
    },
)
async def generate_pdf(request: PDFRequest):
    """
    Accept a self-contained HTML string (with inlined CSS), render it with
    a headless Chromium browser at 800 × 1200 px viewport, and return the
    resulting A4 PDF as a binary download.

    **Request body**
    ```json
    { "html": "<!DOCTYPE html>…", "filename": "Report.pdf" }
    ```

    **Response**
    Binary PDF with Content-Disposition: attachment.
    """
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                context = await browser.new_context(
                    viewport={"width": 800, "height": 1200},
                )
                page = await context.new_page()

                # Load the self-contained HTML (no external network requests)
                await page.set_content(request.html, wait_until="networkidle")

                # Let web-fonts / SVG charts fully settle
                await page.wait_for_timeout(600)

                pdf_bytes = await page.pdf(
                    format="A4",
                    print_background=True,
                    margin={
                        "top":    "18mm",
                        "bottom": "22mm",
                        "left":   "15mm",
                        "right":  "15mm",
                    },
                )
            finally:
                # Always close the browser — even if pdf() throws
                await browser.close()

        logger.info(
            "PDF generated via Playwright — %d bytes, filename='%s'",
            len(pdf_bytes), request.filename,
        )

        return FastAPIResponse(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{request.filename}"',
                "Content-Length": str(len(pdf_bytes)),
                # Allow the browser to read the blob in a cross-origin context
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )

    except Exception as exc:
        logger.exception("Playwright PDF generation failed: %s", exc)
        # Return structured JSON so the frontend can parse err.error
        return FastAPIJSONResponse(
            status_code=500,
            content={"error": str(exc), "detail": f"PDF rendering failed: {exc}"},
        )
