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
