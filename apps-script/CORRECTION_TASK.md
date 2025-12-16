# SPEC v1.0 – Code-Generation-Ready Correction Task for the Apps Script Finance System

## Objective
Rebuild the Apps Script solution so monthly bills are auto-materialized from recurring templates, one-off bills are handled alongside them, and an operational month view supports payment status, edits, and KPI readiness—all inside Google Sheets + bound Apps Script.

## Deliverable Structure
- **Sheets**: `BILLS_RECURRING`, `BILLS_INSTANCES`, `CONFIG`, `DASHBOARD_DATA`.
- **Backend**: `Config.gs`, `Db.gs`, `RecurringService.gs`, `InstanceService.gs`, `KpiService.gs`, `WebApp.gs` (or reuse existing filenames but align responsibilities).
- **Frontend**: Month Operations view as the primary workflow; optional views for recurring management, one-offs, and dashboard.

## Single Cohesive Task
The scope below is **one architectural unit**, but implementation must proceed in layers: **data model → services → UI → triggers**. Keep each layer idempotent where possible.

### Column-by-column schema contract (all columns are required unless marked optional)

**BILLS_RECURRING**
- `recurring_id` (UUID, string)
- `name` (string)
- `account` (string)
- `category` (string)
- `recurrence_day` (number 1–31)
- `predicted_value` (number)
- `value_rule` (enum: `FIXED`, `VARIABLE`; informational only v1)
- `payment_method` (string)
- `supplier` (string, optional)
- `notes` (string, optional)
- `active` (boolean)
- `created_at` (datetime)
- `updated_at` (datetime)

**BILLS_INSTANCES** (instances inherit schema normalization from recurring and must conform even for one-offs)
- `instance_id` (UUID, string)
- `month_ref` (string, ISO `YYYY-MM`)
- `origin` (enum: `RECURRING`, `ONE_OFF`)
- `recurring_id` (string, blank for one-off)
- `name` (string)
- `account` (string)
- `category` (string)
- `due_date` (date)
- `predicted_value` (number)
- `actual_value` (number, optional)
- `status` (enum: `OPEN`, `PAID`, `CANCELLED`)
- `paid_at` (datetime, optional)
- `payment_method` (string)
- `supplier` (string, optional)
- `notes` (string, optional)
- `is_overdue` (boolean; stored and recomputed on writes/triggers)
- `created_at` (datetime)
- `updated_at` (datetime)

**CONFIG**
- `timezone` (string; e.g., `America/Sao_Paulo`)
- `currency_locale` (string; e.g., `pt-BR`)
- `short_month_rule` (enum: `CLAMP_LAST_DAY`, `ROLL_NEXT_MONTH`)
- `month_ref_format` (string constant `YYYY-MM`)
- `dashboard_trigger_day` (number; default 1)
- `dashboard_trigger_hour` (number; default 0)

**DASHBOARD_DATA** (persisted single source of truth for KPIs; rows/columns per your KPI design, but must be populated by `computeMonthKpis` and never diverge from the same logic used in UI)
- At minimum: `month_ref`, `total_predicted`, `total_actual`, `total_paid`, `total_open`, `total_overdue`, `count_paid`, `count_open`, `count_overdue`, `last_computed_at`.

1. **Recurring Templates (Master Data)**
   - Expand recurrence validation to accept days **1–31** with a documented rule for short months (recommended: clamp to last day). Define `month_ref` everywhere as **ISO string `YYYY-MM`**.
   - Capture richer template fields per schema: `value_rule`, `supplier`, `payment_method`, `notes`, `active`, timestamps.
   - Persist in `BILLS_RECURRING` (or existing `CONTAS_FIXAS`) with UUID `recurring_id`.
   - Define `value_rule` accepted values and scope: `FIXED` or `VARIABLE` **informational only (v1)**.

2. **Month Materialization Engine**
   - Create an idempotent `ensureMonthInstances(month_ref)` that:
     - Reads active recurring templates.
     - Computes due dates per recurrence day using the chosen short-month rule.
     - Inserts missing rows into `BILLS_INSTANCES` with `instance_id`, `month_ref`, `origin=RECURRING`, `recurring_id`, `predicted_value`, `status=OPEN`, normalized to the schema (timestamps, payment_method, supplier, notes).
     - Accepts one-off entries **only through the same normalization path** and appends rows with `origin=ONE_OFF`; required fields: `month_ref`, `due_date`, `predicted_value`, `status`, `name`, `account`, `category`.
   - Guard with `LockService.getScriptLock()` around inserts (5–10s timeout) to prevent duplicates; allow safe re-runs.
   - `month_ref` is always the ISO string; never compute ad hoc from dates.

3. **Operational Month View (Payment Workflow)**
   - On load: call `ensureMonthInstances(selectedMonth)` then list instances with filters (month, status, account, category).
   - Render table columns: bill name, account, due date, predicted vs actual value, status, payment date, payment method, notes, overdue.
   - Actions:
     - Mark paid (`status=PAID`, `paid_at`, `actual_value`).
     - Edit **allowed fields only**: `actual_value`, `notes`, `payment_method`; edits apply only to the instance and never propagate back to recurring templates.
     - Cancel (soft): set `status=CANCELLED`; never delete rows.
   - Backend endpoints: `markPaid(instance_id, actual_value, paid_at)` and `patchInstance(instance_id, patch)` that update rows in batch and recompute **stored** `is_overdue`.

4. **KPIs & Dashboard Support**
   - Provide lightweight aggregation (`computeMonthKpis(month_ref)`) for totals (paid, open, overdue), forecast vs actual, and counts by category/account.
   - Persist KPI outputs in `DASHBOARD_DATA` as the **single source of truth**; cache may be used as a read-through layer but must always derive from the persisted table.

5. **Config & Triggers**
   - Maintain `CONFIG` for timezone, currency/locale, short-month rule, and defaults. Include `month_ref_format="YYYY-MM"` as contract.
   - Monthly trigger: run on day 1 at configured hour (default 00:00) in `CONFIG.timezone`, calling `ensureMonthInstances` for the **current month**. UI also calls the same function on load—**no divergent logic paths**.
   - Define overdue rule: **stored boolean** `is_overdue = (due_date < today && status = OPEN)`; recompute on writes and during `ensureMonthInstances` to keep data consistent.
   - Notifications: out of scope for v1 unless explicitly added; if kept, read from `BILLS_INSTANCES` and `DASHBOARD_DATA` using the same overdue rule.

## Execution Notes
- Batch reads/writes via utility helpers (`Db.gs`) to avoid cell-by-cell loops.
- Keep functions idempotent where possible to simplify retries and triggers.
- Avoid heavy sheet formulas; compute in Apps Script and cache when needed.
- UI should update rows client-side after operations rather than full page reloads.
