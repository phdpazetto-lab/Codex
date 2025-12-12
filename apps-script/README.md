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
