# motorMensal.gs helper functions

This Apps Script file centralizes helpers that manage the monthly accounts sheet (`CONTAS_MENSAL`) using data from the fixed accounts sheet (`CONTAS_FIXAS`). Use these functions in bounded scripts attached to the spreadsheet.

## Sheet expectations
- `CONTAS_FIXAS` columns (index-based):
  1. `ID_CONTA`
  2. `NOME_CONTA`
  3. `CATEGORIA`
  4. `TIPO_PESSOA`
  5. `VALOR_PREVISTO`
  6. `DIA_RECORRENCIA` (day of month)
  7. `METODO_PAGAMENTO`
  8. `OBSERVACOES`
  9. `ATIVA` (`SIM`/`NAO`)
- `CONTAS_MENSAL` header matches `CONTAS_MENSAL_HEADERS` in the script. Ensure the sheet starts with this header row.

## Functions
### `gerarMes(referenciaDate)`
- Normalizes the reference date to midnight and targets that month.
- Clears rows in `CONTAS_MENSAL` for the target month, **preserving** variable entries (`ORIGEM = VARIAVEL`) that already belong to that month.
- Keeps rows from other months untouched.
- Replicates active fixed accounts (`ATIVA = SIM`) into the target month with calculated `VENCIMENTO` using `DIA_RECORRENCIA`.
- Defaults `PAGO` and `ATRASADO` to `NAO`, sets `ORIGEM` to `FIXA`, and copies `VALOR_PREVISTO`, `METODO_PAGAMENTO`, and `OBSERVACOES`.
- Calls `recalcularAtrasos()` to refresh overdue flags.

Usage example:
```js
function rebuildCurrentMonth() {
  gerarMes(new Date());
}
```

### `recalcularAtrasos()`
- Normalizes today and marks rows as overdue (`ATRASADO = SIM`) when `VENCIMENTO` is before today and `PAGO` is not `SIM`.
- Leaves sheets with only the header untouched.

### `criarContaPontual(payload)`
- Appends a manual monthly entry with `ORIGEM = VARIAVEL` and defaults `PAGO`/`ATRASADO` to `NAO`.
- Expects `payload` fields: `nomeConta`, `categoria`, `tipoPessoa`, `valorPrevisto`, `valorReal`, `vencimento`, `dataPagamento`, `metodoPagamento`, and `observacoes`. Missing fields default to empty strings. `vencimento` is normalized to midnight.
- Triggers `recalcularAtrasos()` after insertion.

## Operational notes
- Run `gerarMes` once per target month to refresh fixed items; manual variable entries remain intact for that month.
- Ensure the script has permission to read/write both sheets.
- Future improvements could include input validation (e.g., rejecting invalid `DIA_RECORRENCIA`) and logging to aid troubleshooting, but the current implementation is ready for day-to-day use.
