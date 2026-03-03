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

Financing schemes are modeled in two layers to support dynamic (scheme-specific) input fields without creating a table/class per scheme.

### 1) Scheme definitions (catalog)

The backend maintains a **catalog** of supported financing schemes. Each definition describes *what inputs a scheme expects* using a JSON Schema (and optionally a UI schema for ordering/labels).

A definition is **not user data**; it is seeded/configured by the system.

**Core fields**

* `scheme_key` (stable identifier, e.g. `loan_amortizing_v1`)
* `version` (integer, used for backward compatibility)
* `name`, `category`, `description`
* `input_schema` (JSON Schema describing required/optional fields, types, constraints, defaults)
* `ui_schema` (optional JSON for UI hints: grouping, ordering, labels)
* `is_active` (boolean)

**Example `input_schema`**

```json
{
  "type": "object",
  "properties": {
    "principal": { "type": "number", "minimum": 0 },
    "interest_rate": { "type": "number", "minimum": 0, "maximum": 1 },
    "tenor_years": { "type": "integer", "minimum": 1, "maximum": 40 },
    "grace_period_months": { "type": "integer", "minimum": 0, "maximum": 120, "default": 0 }
  },
  "required": ["principal", "interest_rate", "tenor_years"],
  "additionalProperties": false
}
```

### 2) Experiment scheme instances (user selections)

When a user selects financing schemes for an experiment, the backend creates **instance records**. Each instance stores:

* which scheme definition was chosen (`scheme_key`, `scheme_version`)
* the user-provided inputs (`params`) as JSON (Postgres `JSONB`)

This is **user data** and is scoped to an experiment.

**Core fields**

* `id`
* `experiment_id`
* `scheme_key`
* `scheme_version`
* `params` (JSONB)
* `created_at`, `updated_at`

### Validation and versioning rules

* On `POST/PATCH` to `/experiments/{id}/financing-schemes`, the backend validates `params` against the corresponding `input_schema`.
* `additionalProperties: false` rejects unknown fields.
* `scheme_version` is stored with the instance so existing experiments remain valid if a scheme is updated (e.g., `loan_amortizing_v2`).

### Postgres mapping (conceptual)

* `financing_scheme_definitions(scheme_key, version, ..., input_schema JSONB, ui_schema JSONB)`
* `experiment_financing_schemes(id, experiment_id, scheme_key, scheme_version, params JSONB, ...)`

This avoids:

* a wide “all possible fields” table (mostly NULLs),
* a table/class per scheme,
  while keeping strong validation and dynamic UI generation.
