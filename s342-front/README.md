# Service Description

I want to build a website called **Risk Assessment Simulator**. The product supports running **experiments** that evaluate the financial risk/viability of investments in building energy upgrades. The UI consists of three main areas:

* **Dashboard**: list and manage experiments.
* **Input**: a guided flow with three stages:

  1. add buildings
  2. add energy efficiency measures (EEMs) per building
  3. select and configure financing schemes (FS)
* **Output**: run the experiment (algorithm already implemented) and display results.

### Core workflow

1. **Experiments**

* A user creates and runs experiments.
* Each experiment should have at minimum:

  * `id`
  * `name` (user-defined, otherwise default `Experiment_<timestamp>`)
  * `created_at` (full timestamp)
  * `status` (draft / ready / running / completed / failed) to support the “run” lifecycle and UI state

2. **Inputs per experiment**
   For each experiment, the user provides:

**A. Buildings**
For each building:

* General details:

  * `name`
  * `country`
  * `region`
  * `year_of_construction`
  * `floor_area`

**B. Energy Efficiency Measures (EEMs)**
For each building, the user adds EEM data:

* `name`
* `capex`
* `energy_savings`
* `maintenance_cost`
* `lifetime`

Multiple EEMs per building are supported in the product design.
**Version 1 constraint:** each building will include **exactly one aggregated EEM** representing the combined effect of all hypothetical measures. Therefore, in the Verson 1, the fields `capex`, `energy_savings`, `maintenance_cost`, `lifetime` will be included inside the Building entity (no EEM feature at all).

**C. Financing Schemes (FS)**
The user selects one or more financing schemes from a predefined list (dropdown).
Each scheme has its own **required inputs**, and the UI should dynamically reveal only the fields needed for the selected scheme(s).

3. **Run + Output**
   Once buildings, EEMs, and financing inputs are complete, the user runs the experiment. The backend algorithm returns financial KPIs (e.g., **NPV**, **IRR**, **ROI**), which are shown in the Output area.

* Output has two tabs:

  * **General results** (Version 1): aggregated results for the experiment as a whole
  * **Per-building results** (Version 2): detailed results per building

## Frontend API notes

> Practical notes for frontend development. Read this before implementing API calls.

**Base URL**: `http://localhost:8000/api` (development)

**Trailing slashes**: Django/DRF requires a trailing slash on every URL. Always append `/` (e.g. `/api/experiments/`, `/api/experiments/exp_123/buildings/`).

**Authentication**: All endpoints require a JWT access token except `/api/auth/register/` and `/api/auth/login/`. Send it as:
```
Authorization: Bearer <access_token>
```
Access tokens expire after 60 minutes. Use `/api/auth/refresh/` with the refresh token (7-day lifetime) to get a new one.

**Decimal fields**: Returned as JSON numbers, not strings (e.g. `"floor_area": 1200.0`, `"eem_energy_savings": 0.22`).

**Error envelope**: All errors follow the same shape:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [{ "path": "field", "message": "..." }] } }
```

**Scheme POST body**: Use `scheme_type` (not `scheme_key`) as the field name when creating a financing scheme instance:
```json
{ "scheme_type": "bank_loan", "params": { "loan_amount": 250000, "term_years": 10 } }
```
The response uses `scheme_key` for the same value (the type identifier).

**Building response**: The parent experiment identifier is returned as `experiment_id` (e.g. `"experiment_id": "exp_abc123"`). This field is read-only; do not send it in POST/PATCH requests.

**Pagination**: All list endpoints return:
```json
{ "items": [...], "page": { "limit": 20, "offset": 0, "total": 5 } }
```
Default limit is 20, maximum is 100. Use `?limit=N&offset=N` query params to paginate.

**Run action URL**: `POST /api/experiments/{id}/run/` (not `/runs/`). Returns `{ "run_id", "status", "started_at" }`. Returns HTTP 400 if the experiment has no buildings or no financing schemes.

---

## Endpoints of Version 1
Base: `/api`
All resources are scoped to the authenticated user (server enforces `user_id` ownership).

### Experiments (Dashboard + navigation)

| Method | Path                          | Purpose                                         |
| ------ | ----------------------------- | ----------------------------------------------- |
| GET    | `/experiments`                | List experiments for dashboard                  |
| POST   | `/experiments`                | Create new experiment (default name if omitted) |
| GET    | `/experiments/{experimentId}` | Fetch experiment header + status                |
| PATCH  | `/experiments/{experimentId}` | Rename experiment (and any editable metadata)   |
| DELETE | `/experiments/{experimentId}` | Delete experiment + all children                |

**GET `/experiments` response (dashboard rows)**

```json
{
  "items": [
    {
      "id": "exp_123",
      "name": "Experiment_2026-03-03T10:12:13Z",
      "created_at": "2026-03-03T10:12:13Z",
      "status": "draft",
      "last_run": {
        "run_id": "run_9",
        "status": "completed",
        "finished_at": "2026-03-03T10:20:00Z"
      }
    }
  ],
  "page": { "limit": 20, "offset": 0, "total": 1 }
}
```

### Buildings (Input stage 1, plus aggregated EEM fields inside Building for v1)

| Method | Path                                                 | Purpose         |
| ------ | ---------------------------------------------------- | --------------- |
| GET    | `/experiments/{experimentId}/buildings`              | List buildings  |
| POST   | `/experiments/{experimentId}/buildings`              | Create building |
| GET    | `/experiments/{experimentId}/buildings/{buildingId}` | Fetch building  |
| PATCH  | `/experiments/{experimentId}/buildings/{buildingId}` | Update building |
| DELETE | `/experiments/{experimentId}/buildings/{buildingId}` | Delete building |

**Building payload (v1 includes aggregated EEM fields)**

```json
{
  "id": "bld_1",
  "experiment_id": "exp_123",
  "name": "Building A",
  "country": "GR",
  "region": "Attica",
  "year_of_construction": 1995,
  "floor_area": 1200,

  "eem_capex": 250000,
  "eem_energy_savings": 0.22,
  "eem_maintenance_cost": 3000,
  "eem_lifetime": 20
}
```

### Financing schemes (Input stage 3)

#### A) Catalog endpoints (static list + schemas used to render the dynamic form)

| Method | Path                             | Purpose                                  |
| ------ | -------------------------------- | ---------------------------------------- |
| GET    | `/financing-schemes`             | List available schemes (dropdown source) |
| GET    | `/financing-schemes/{schemeKey}` | Get scheme definition + input schema     |

**GET `/financing-schemes`**

```json
{
  "items": [
    { "key": "loan_amortizing_v1", "name": "Loan (Amortizing)", "version": 1, "category": "debt" },
    { "key": "grant_fixed_v1", "name": "Grant (Fixed)", "version": 1, "category": "subsidy" }
  ]
}
```

#### B) Experiment-selected schemes (instances + user-provided params)

| Method | Path                                                   | Purpose                                 |
| ------ | ------------------------------------------------------ | --------------------------------------- |
| GET    | `/experiments/{experimentId}/financing-schemes`        | List selected scheme instances + params |
| POST   | `/experiments/{experimentId}/financing-schemes`        | Select/add a scheme instance            |
| PATCH  | `/experiments/{experimentId}/financing-schemes/{fsId}` | Update params for that instance         |
| DELETE | `/experiments/{experimentId}/financing-schemes/{fsId}` | Remove instance                         |

**POST `/experiments/{experimentId}/financing-schemes` request**

```json
{
  "scheme_key": "loan_amortizing_v1",
  "params": {
    "principal": 250000,
    "interest_rate": 0.045,
    "tenor_years": 10,
    "grace_period_months": 6
  }
}
```

**GET `/experiments/{experimentId}/financing-schemes`**

```json
{
  "items": [
    {
      "id": "fs_77",
      "scheme_key": "loan_amortizing_v1",
      "scheme_version": 1,
      "display_name": "Loan (Amortizing)",
      "params": { "principal": 250000, "interest_rate": 0.045, "tenor_years": 10, "grace_period_months": 6 },
      "created_at": "2026-03-03T10:14:00Z",
      "updated_at": "2026-03-03T10:15:00Z"
    }
  ]
}
```

### Readiness + run lifecycle (Input completion → Run → Output)

| Method | Path                                                       | Purpose                                                        |
| ------ | ---------------------------------------------------------- | -------------------------------------------------------------- |
| GET    | `/experiments/{experimentId}/readiness`                    | Server-side completeness check (drives “Run” enabled/disabled) |
| POST   | `/experiments/{experimentId}/run`                          | Start a run (creates a run record)                             |
| GET    | `/experiments/{experimentId}/runs/{runId}`                 | Poll run status (running/completed/failed)                     |
| GET    | `/experiments/{experimentId}/runs/{runId}/results/general` | Output tab “General results”                                   |
| GET    | `/experiments/{experimentId}/results/general`              | Convenience: latest completed run results                      |

**GET `/experiments/{experimentId}/readiness`**

```json
{
  "is_ready": false,
  "missing": [
    { "path": "buildings", "message": "At least one building is required." },
    { "path": "financing_schemes", "message": "Select at least one financing scheme." }
  ]
}
```

**POST `/experiments/{experimentId}/run` response**

```json
{ "run_id": "run_9", "status": "running", "started_at": "2026-03-03T10:18:00Z" }
```

**GET results (general)**

```json
{
  "run_id": "run_9",
  "status": "completed",
  "kpis": { "npv": 123456.78, "irr": 0.11, "roi": 0.35 },
  "meta": { "currency": "EUR" }
}
```

**Error format (consistent across endpoints)**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid financing scheme params.",
    "details": [{ "path": "params.interest_rate", "message": "Must be between 0 and 1." }]
  }
}
```

---

## Financing schemes entity

Financing schemes are modeled using a **base + type-specific table** design. Each scheme type has its own dedicated table containing only the fields relevant to that type.

### 1) Scheme catalog (static, in-code)

The catalog is **not stored in the database**. It is defined in code (`views/financing_schemes.py`) as a static dictionary keyed by `scheme_type`. Each entry describes:

* `key` — stable identifier matching the `scheme_type` stored in the DB (e.g. `bank_loan`, `epc_shared_savings`)
* `name` — display name
* `category` — grouping label (`debt`, `crowdfunding`, `epc`, `green_bond`, `utility`, `lease`, `equity`)
* `fields` — ordered list of field descriptors used by the frontend to render the dynamic input form: `name`, `type` (`number` or `integer`), `label`, `required`, `minimum`, `maximum`

The catalog is served by `GET /financing-schemes/` and `GET /financing-schemes/{key}/`.

### 2) Scheme instances (user selections, in the DB)

When a user adds a financing scheme to an experiment, the backend creates:

1. A **`Scheme`** base record (`schemes` table): `id` (`fs_<hex>`), `experiment_id`, `scheme_type`, `created_at`, `updated_at`
2. A **type-specific child record** linked via OneToOne:

| `scheme_type`              | Child table                     | Fields |
|----------------------------|---------------------------------|--------|
| `equity`                   | `scheme_equity`                 | _(none)_ |
| `bank_loan`                | `scheme_bank_loan`              | `loan_amount`, `term_years` |
| `equity_crowdfunding`      | `scheme_equity_crowdfunding`    | `platform_fee_percent`, `crowd_share_percent` |
| `lending_crowdfunding`     | `scheme_lending_crowdfunding`   | `platform_fee_percent`, `loan_amount`, `term_years`, `fixed_interest_rate` |
| `royalty_crowdfunding`     | `scheme_royalty_crowdfunding`   | `platform_fee_percent`, `loan_amount`, `term_years`, `fixed_interest_rate` |
| `epc_first_out`            | `scheme_epc_first_out`          | _(none)_ |
| `epc_shared_savings`       | `scheme_epc_shared_savings`     | `esco_fee_percent`, `term_years` |
| `epc_guaranteed_savings`   | `scheme_epc_guaranteed_savings` | `guaranteed_savings_amount`, `term_years` |
| `green_bond_loan`          | `scheme_green_bond_loan`        | `loan_amount`, `term_years`, `fixed_interest_rate`, `maintenance_cost` |
| `green_bond_bullet`        | `scheme_green_bond_bullet`      | `loan_amount`, `term_years`, `fixed_interest_rate`, `maintenance_cost` |
| `on_bill`                  | `scheme_on_bill`                | `fixed_interest_rate`, `term_years` |
| `operational_lease`        | `scheme_operational_lease`      | `lease_payment`, `term_years` |

### Validation

On `POST /experiments/{id}/financing-schemes`, the backend validates submitted `params` against the catalog field definitions (required fields, types, min/max ranges). Unknown fields are rejected.

### API request/response shape

**POST request body**

```json
{
  “scheme_type”: “bank_loan”,
  “params”: { “loan_amount”: 250000, “term_years”: 10 }
}
```

**GET/POST/PATCH response item**

```json
{
  “id”: “fs_abc123”,
  “scheme_key”: “bank_loan”,
  “display_name”: “Bank Loan”,
  “params”: { “loan_amount”: 250000, “term_years”: 10 },
  “created_at”: “2026-03-09T10:00:00Z”,
  “updated_at”: “2026-03-09T10:05:00Z”
}
```

> Note: the API uses `scheme_key` / `scheme_type` interchangeably in request body and response. Internally the DB column is named `scheme_type`.
