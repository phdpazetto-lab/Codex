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

## Requirements for a perfect run
- The user running `configurarTriggers()` has permission to create time-based triggers in the project.
- The spreadsheet is accessible (i.e., `SpreadsheetApp.getActiveSpreadsheet()` is available when running bound to the sheet).
- The `CONFIG` sheet exists and contains a valid `HORA_ENVIO_DIARIO` value.
- No conflicting manual triggers remain; `removerTriggersAntigos()` is called first to keep only the intended trigger set.

## Troubleshooting tips
- **Triggers not firing**: Check the Apps Script project's Triggers dashboard to confirm the triggers were created and are not paused because of authorization errors.
- **Wrong time**: Verify `HORA_ENVIO_DIARIO` is a valid `HH:MM` string and re-run `configurarTriggers()`.
- **Duplicate runs**: Ensure `configurarTriggers()` is used exclusively to manage these triggers so cleanup runs consistently.
