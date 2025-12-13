# CONTAS_MENSAL: visão geral e requisitos

Este documento resume o comportamento do script `contasMensal.gs` usado para operar a aba **CONTAS_MENSAL** de uma planilha no Google Sheets via Google Apps Script.

## O que o código faz

### Acesso à planilha
- **`getContasMensalSheet()`**: recupera a aba `CONTAS_MENSAL`, lançando erro se não existir.
- **`getHeaderMap(sheet)`**: constrói um mapa `nome_da_coluna -> índice` a partir da primeira linha da aba, permitindo ler e escrever células por nome de coluna.

### Utilitários de normalização
- **`toSimNao(value)`**: converte valores para as strings `"SIM"` ou `"NÃO"` conforme esperado pela planilha.
- **`normalizeDate(date)`**: remove horário de datas (ou converte strings/valores em Date) para comparações consistentes.
- **`calcularAtraso(vencimento, pago, dataPagamento)`**: aplica a regra de atraso: se pago for `SIM`, só é `ATRASADO` quando o pagamento ocorrer depois do vencimento; se não houver pagamento, é `ATRASADO` quando `hoje > vencimento`.

### Operações principais
- **`listarContasMes(filtros)`**: lê todas as linhas e devolve objetos chaveados pelo cabeçalho, aceitando filtros por `status` (PAGO, ATRASADO, PENDENTE/EM_ABERTO), `categoria` (string ou lista), `tipoPessoa` (PF ou PJ) e intervalo de `vencimento` (`vencimentoInicio`/`vencimentoFim`). O campo `ATRASADO` é recalculado em memória antes dos filtros.
- **`marcarPago(id, dataPagamento, valorReal, metodo, observacoes)`**: localiza a linha pelo `ID_MENSAL`, preenche `DATA_PAGAMENTO` (padrão: data atual), atualiza `VALOR_REAL`, `METODO_PAGAMENTO`, `OBSERVACOES` quando informados, marca `PAGO` como `SIM`, recalcula `ATRASADO` e marca `NOTIFICACAO_ENVIADA` como `SIM` se ainda estiver vazia. Grava a linha alterada na planilha e retorna um objeto com os novos valores.
- **`atualizarContaMensal(payload)`**: edita campos diversos (nome, categoria, tipo de pessoa, valores, vencimento, pagamento, método, origem, observações). Se `payload.pago` for informado, define `PAGO` conforme `toSimNao`; se apenas `dataPagamento` for enviada, `PAGO` passa a `SIM`. Recalcula `ATRASADO` e garante `NOTIFICACAO_ENVIADA` (`SIM`/`NÃO`, padrão `NÃO`). Persiste e retorna a linha atualizada.

## Estrutura esperada da aba

O script depende de um cabeçalho com, ao menos, as colunas abaixo (nomes exatos, em português, com underscores onde indicado):

- `ID_MENSAL`
- `NOME_CONTA`
- `CATEGORIA`
- `TIPO_PESSOA`
- `VALOR_PREVISTO`
- `VALOR_REAL`
- `VENCIMENTO`
- `DATA_PAGAMENTO`
- `METODO_PAGAMENTO`
- `ORIGEM`
- `OBSERVACOES`
- `PAGO`
- `ATRASADO`
- `NOTIFICACAO_ENVIADA`

Caso a planilha contenha colunas adicionais, elas são preservadas ao ler e escrever linhas, desde que estejam no cabeçalho.

## Pré-requisitos para funcionar

1. **Contexto Google Apps Script**: o arquivo deve ser executado em um projeto ligado a um Google Spreadsheet. As APIs `SpreadsheetApp` precisam estar disponíveis (i.e., o script está associado à planilha ou ao seu container-bound project).
2. **Aba `CONTAS_MENSAL` existente**: a aba deve existir na planilha com o cabeçalho acima na primeira linha. A ausência da aba causa erro em `getContasMensalSheet()`.
3. **Formato das datas**: os campos de data (vencimento, pagamento) devem ser valores de data ou strings convertíveis em `Date`. A função `normalizeDate` zera horas para comparações e evita falsos positivos de atraso.
4. **Status `SIM`/`NÃO`**: os campos `PAGO`, `ATRASADO` e `NOTIFICACAO_ENVIADA` são armazenados como `SIM` ou `NÃO`. Valores booleanos passados pelas funções são convertidos.

## Como usar

1. Publique ou execute o script em um container Google Apps Script vinculado à planilha.
2. Para listar contas do mês com filtros, chame `listarContasMes({ status: 'ATRASADO', categoria: 'ALUGUEL', tipoPessoa: 'PJ', vencimentoInicio: '2024-01-01', vencimentoFim: '2024-12-31' })`.
3. Para marcar uma conta como paga: `marcarPago(id, new Date(), 1200.55, 'PIX', 'Pago com desconto')`.
4. Para atualizar uma conta (campos opcionais): `atualizarContaMensal({ id: 10, vencimento: '2024-05-05', valorPrevisto: 300, pago: false, notificacaoEnviada: true })`.

## Boas práticas

- Mantenha os nomes de coluna estáveis; mudanças exigem ajustes no script ou no cabeçalho.
- Prefira gravar datas como objetos `Date` ao invés de strings, para evitar problemas de fuso ou regionalização.
- Quando adicionar novas colunas, inclua-as no cabeçalho antes de usar as funções para garantir que `getHeaderMap` as reconheça.

