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
