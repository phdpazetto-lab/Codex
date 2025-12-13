# Guia de Configuração das Funções de Contas e Notificações

Este guia explica como preparar sua planilha e o projeto do Apps Script para usar as funções de CRUD, notificação e auditoria por logs implementadas nos arquivos `crud.gs`, `notifications.gs` e `logs.gs`.

## Visão geral das funcionalidades
- **Logs centralizados** (`logs.gs`): função `registrarEvento` grava data/hora, tipo (INFO/SUCCESS/ERROR) e payload opcional na aba `LOGS`. O helper `executarComLog` envolve operações para registrar início, sucesso e falha.
- **CRUD de contas** (`crud.gs`): criação e atualização das abas `CONTAS_FIXAS` e `CONTAS_MENSAL`, incluindo geração de IDs, inclusão de registros, atualização de status de pagamento e exclusão de contas mensais. As abas são criadas automaticamente com cabeçalhos padrão se não existirem.
- **Notificações** (`notifications.gs`): envio de avisos de vencimento individuais e resumos diários por e-mail, sempre validando configuração e registrando logs de auditoria.

## Preparando o ambiente
1. **Crie ou abra sua planilha** no Google Sheets. Todas as abas citadas serão criadas/atualizadas nela.
2. **Acesse Extensões → Apps Script** e crie um projeto vinculado à planilha.
3. **Adicione os arquivos** `crud.gs`, `logs.gs` e `notifications.gs` ao projeto (copiando o conteúdo deste repositório ou importando os arquivos).
4. **Autorização inicial**: na primeira execução de qualquer função que acesse Sheets ou Gmail, o Apps Script pedirá permissões. Aceite para liberar o funcionamento.

## Estrutura das abas
As funções criam cabeçalhos automaticamente quando a aba está vazia. Use estas referências para entender cada coluna ou para migrar dados existentes.

### Aba CONTAS_FIXAS
| Coluna            | Descrição                                   |
| ----------------- | ------------------------------------------- |
| ID_CONTA          | ID gerado automaticamente (prefixo `CF`).   |
| NOME_CONTA        | Nome da conta fixa.                         |
| CATEGORIA         | Categoria/etiqueta.                         |
| TIPO_PESSOA       | Tipo de pessoa (F/J).                       |
| VALOR_PREVISTO    | Valor previsto.                             |
| DIA_RECORRENCIA   | Dia de recorrência do pagamento.            |
| METODO_PAGAMENTO  | Meio de pagamento.                          |
| OBSERVACOES       | Observações gerais.                         |
| ATIVA             | Indica se a conta está ativa (`SIM/NAO`).   |

### Aba CONTAS_MENSAL
| Coluna              | Descrição                                                        |
| ------------------- | ---------------------------------------------------------------- |
| ID_MENSAL           | ID gerado automaticamente (prefixo `CM`).                        |
| ID_CONTA_ORIGEM     | Referência à conta fixa (`CF-...`) ou `MANUAL`.                   |
| NOME_CONTA          | Nome da conta mensal.                                            |
| CATEGORIA           | Categoria/etiqueta.                                              |
| TIPO_PESSOA         | Tipo de pessoa (F/J).                                            |
| VALOR_PREVISTO      | Valor previsto.                                                  |
| VALOR_REAL          | Valor pago.                                                      |
| VENCIMENTO          | Data de vencimento.                                              |
| DATA_PAGAMENTO      | Data em que foi pago.                                            |
| PAGO                | Status (`SIM/NAO`).                                              |
| ATRASADO            | Status de atraso (`SIM/NAO`).                                    |
| METODO_PAGAMENTO    | Meio de pagamento.                                               |
| ORIGEM              | Origem do lançamento.                                            |
| NOTIFICACAO_ENVIADA | Controle interno de aviso já enviado.                            |
| OBSERVACOES         | Observações gerais.                                              |

### Aba LOGS
Criada automaticamente (se não existir) com cabeçalhos `timestamp`, `tipo`, `mensagem` e `payload`. Cada operação relevante adiciona uma linha com horário no fuso da planilha.

### Aba CONFIG
Crie manualmente a aba `CONFIG` com a seguinte estrutura mínima:
| Coluna               | Exemplo de valor                    | Observação                                                |
| -------------------- | ---------------------------------- | --------------------------------------------------------- |
| EMAILS_NOTIFICACAO   | `usuario@dominio.com;outro@dom.com` | Lista de destinatários separada por ponto e vírgula (;)   |

As funções de notificação usarão a linha 2 da coluna indicada (`EMAILS_NOTIFICACAO`) para buscar os e-mails.

## Como usar as funções
Todas as funções são globais e podem ser executadas via editor do Apps Script, triggers ou chamadas de outras funções.

### Exemplos de CRUD
- **Criar conta fixa**:
  ```javascript
  criarContaFixa({
    nomeConta: 'Academia',
    categoria: 'Saúde',
    diaRecorrencia: 5,
    valorPrevisto: 120,
    metodoPagamento: 'Cartão'
  });
  ```
- **Criar conta mensal**:
  ```javascript
  criarContaMensal({
    idContaOrigem: 'CF-123',
    nomeConta: 'Academia',
    vencimento: new Date(),
    valorPrevisto: 120
  });
  ```
- **Atualizar conta mensal**:
  ```javascript
  atualizarContaMensal('CM-456', { PAGO: 'SIM', VALOR_REAL: 110 });
  ```
- **Registrar pagamento** (atualiza pago, valor real e data):
  ```javascript
  registrarPagamento('CM-456', 110, new Date());
  ```
- **Excluir conta mensal**:
  ```javascript
  excluirContaMensal('CM-456');
  ```

### Notificações
- **Aviso de vencimento de uma conta**:
  ```javascript
  enviarAvisoVencimento({
    idMensal: 'CM-456',
    nomeConta: 'Academia',
    valorPrevisto: 120,
    vencimento: '2024-06-10'
  });
  ```
- **Resumo diário** (enviando um array de contas):
  ```javascript
  notificarResumoDiario([
    { nomeConta: 'Academia', vencimento: '2024-06-10', valorPrevisto: 120 },
    { nomeConta: 'Internet', vencimento: '2024-06-12', valorPrevisto: 99.9 }
  ]);
  ```

Ambas as funções validam se há destinatários configurados na aba `CONFIG`. Caso não haja, um erro será lançado e registrado em `LOGS`.

## Automação por gatilhos
- **Alertas de vencimento**: crie um gatilho do tipo "Acionador baseado em tempo" no Apps Script que execute uma função customizada (ex.: `verificarVencimentos` se você tiver essa lógica) e, ao encontrar contas próximas do vencimento, chame `enviarAvisoVencimento` para cada uma.
- **Resumo diário**: use um gatilho diário para chamar `notificarResumoDiario` com a lista de contas do dia.

## Boas práticas e resolução de problemas
- Verifique se a planilha está com o fuso horário correto (Arquivo → Configurações) para que os timestamps dos logs fiquem precisos.
- Sempre mantenha a aba `CONFIG` preenchida; sem ela as funções de notificação falham por design para evitar envios incorretos.
- Consulte a aba `LOGS` para rastrear erros e confirmar o sucesso de operações (ex.: criação/atualização de registros e envios de e-mail).
- Ao migrar dados antigos, garanta que os cabeçalhos correspondam exatamente aos listados acima para que as funções localizem as colunas.

Com essas etapas, sua planilha fica pronta para operar com os fluxos de contas, notificações e auditoria de logs disponíveis neste projeto.
