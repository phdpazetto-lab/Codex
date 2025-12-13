# Triggers Helper (Apps Script)

This document explains how the helper functions in `triggers.gs` configure Google Apps Script time-based triggers, the expectations for the environment, and how to run them reliably.

## Purpose
The script sets up two automated jobs for a spreadsheet-backed workflow:

- **Monthly generation**: Calls `gerarMesAutomatico` at the configured daily time on the **1st day** of each month.
- **Daily notifications**: Calls `enviarNotificacoesDiarias` **every day** at the same configured time.

## How it works
1. `configurarTriggers()` is the entry point. It reads the configured time from the spreadsheet (see below), removes any existing triggers for the monitored handlers, and creates fresh triggers.
2. `removerTriggersAntigos()` scans project triggers and deletes those whose handlers are in `TRIGGERS_MONITORADOS` (`gerarMesAutomatico` and `enviarNotificacoesDiarias`). This prevents duplicate executions.
3. The configured time is read by `obterHorarioEnvioDiario()` from the `CONFIG` sheet cell row labeled `HORA_ENVIO_DIARIO` (column A label, column B value). If the value is missing or invalid, the script falls back to **09:00**.
4. The parsed time feeds into two time-based triggers created with `ScriptApp.newTrigger()`:
   - Monthly trigger: `onMonthDay(1)` at the configured hour and near-minute.
   - Daily trigger: `everyDays(1)` at the same hour and near-minute.

## Expected spreadsheet setup
- The script must run in a **bound** Google Spreadsheet project.
- The spreadsheet must include a sheet named **`CONFIG`**.
- In `CONFIG`, column A should contain the key `HORA_ENVIO_DIARIO`, and column B should contain a time string in the format `HH:MM` (24-hour). Example:

  | A (Chave)           | B (Valor) |
  | ------------------- | --------- |
  | HORA_ENVIO_DIARIO   | 08:30     |

- If the key is absent or the value is invalid, the script uses the fallback time **09:00**.

## Usage
- Run `configurarTriggers()` manually from the Apps Script editor or via another workflow to (re)create the triggers.
- If you change `HORA_ENVIO_DIARIO`, run `configurarTriggers()` again to update the trigger times.
- The functions `gerarMesAutomatico` and `enviarNotificacoesDiarias` must exist in the same project; otherwise, trigger execution will fail at runtime.

## Step-by-step: create the triggers with the right configuration
1. Open the **bound** spreadsheet and confirm the `CONFIG` sheet has `HORA_ENVIO_DIARIO` in column A with a `HH:MM` time in column B (for example, `08:30`).
2. In the spreadsheet, click **Extensions → Apps Script** to open the script project that contains `triggers.gs` and the handlers `gerarMesAutomatico` and `enviarNotificacoesDiarias`.
3. In the Apps Script editor, ensure the active project matches the spreadsheet (you should see the `CONFIG` sheet name in the left-side navigator under **Services → Spreadsheet** if bound).
4. Select the `configurarTriggers` function from the run dropdown, then click **Run**. Approve any authorization prompts so the script can create triggers.
5. Wait for execution to finish. Open **Triggers** (clock icon) in the left toolbar and verify two entries exist:
   - **Monthly**: event source **Time-driven**, type **Month timer**, day **1**, time set to the configured `HORA_ENVIO_DIARIO`.
   - **Daily**: event source **Time-driven**, type **Day timer**, frequency **Every day**, time set to the same `HORA_ENVIO_DIARIO`.
6. If you later change `HORA_ENVIO_DIARIO`, repeat steps 1 and 4 to recreate the triggers at the new time (the script removes old triggers automatically).

## Requirements for a perfect run
- The user running `configurarTriggers()` has permission to create time-based triggers in the project.
- The spreadsheet is accessible (i.e., `SpreadsheetApp.getActiveSpreadsheet()` is available when running bound to the sheet).
- The `CONFIG` sheet exists and contains a valid `HORA_ENVIO_DIARIO` value.
- No conflicting manual triggers remain; `removerTriggersAntigos()` is called first to keep only the intended trigger set.

## Troubleshooting tips
- **Triggers not firing**: Check the Apps Script project's Triggers dashboard to confirm the triggers were created and are not paused because of authorization errors.
- **Wrong time**: Verify `HORA_ENVIO_DIARIO` is a valid `HH:MM` string and re-run `configurarTriggers()`.
- **Duplicate runs**: Ensure `configurarTriggers()` is used exclusively to manage these triggers so cleanup runs consistently.
# Apps Script automations for contas fixas

This folder contains the Google Apps Script logic used by the spreadsheet tab `CONTAS_FIXAS` to manage recurring account records (contas fixas).

## Available functions
- `listarContasFixas()`: returns only active rows, mapping sheet columns to API fields.
- `criarContaFixa(payload)`: validates required attributes, generates a unique `ID_CONTA` when absent, and appends a new active record.
- `atualizarContaFixa(payload)`: requires an existing `ID_CONTA`, revalidates the fields, and updates the row while preserving the current active status.
- `inativarContaFixa(id)`: marks an existing row as inactive without deleting data.

## Validation rules
- `nome_conta`, `categoria`, and `tipo_pessoa` (PF/PJ) are mandatory and trimmed.
- `valor_previsto` must be numeric and non-negative.
- `dia_recorrecia` must be an integer between 1 and 28.
- Optional fields: `metodo_pagamento`, `observacoes` (trimmed when present).

## Data model
Rows are stored in the `CONTAS_FIXAS` sheet with the header order defined in `CONTAS_FIXAS_HEADERS`. The `ATIVA` column tracks whether a record is visible to `listarContasFixas()`, using `SIM` for active and `NAO` for inactive entries. The helper `localizarLinhaPorId_` ensures `ID_CONTA` values are treated as unique identifiers when updating or inactivating records.
# Apps Script helpers

This folder contains shared constants and utility functions used by the Apps Script project. They are meant to be pasted or deployed into the Apps Script editor for the spreadsheet that manages your accounts.

## What's here
- `constants.gs`: sheet names, column indices, date/time formats, status/origin enums, and notification modes.
- `utils.gs`: helper functions for loading sheets, reading/updating rows, generating IDs, date handling, and loading the `CONFIG` sheet into a structured object (with caching).

## How to use
1. Open the Apps Script editor that backs your Google Sheet.
2. Create two script files (or paste into existing ones) named `constants.gs` and `utils.gs`.
3. Copy the contents from this folder into the corresponding script files.
4. Make sure your spreadsheet contains the expected tabs and column layouts referenced in `constants.gs`.

## Configuration
- The `CONFIG` tab should have two columns: `PARAM` (column A) and `VALUE` (column B).
- Keys expected in `PARAM` include items like `EMAILS_NOTIFICACAO`, `DIAS_ANTES_VENCIMENTO`, and `FUSO_HORARIO`.
- `utils.gs` caches the CONFIG values for six hours; edits to the CONFIG sheet may take that long to be reflected unless you clear the cache manually.

## Do I need to run anything?
No build step is required. Simply copy these files into your Apps Script project. The functions will run automatically when you call them from your triggers or other script files.
