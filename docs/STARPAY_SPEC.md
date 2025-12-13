# Codex
This Repository was created  to be a white canvas for Codex. 
A seguir está o **SPEC PROFISSIONAL COMPLETO** do sistema que estamos criando:
uma plataforma financeira de **controle de contas fixas, contas pontuais, pagamentos mensais, lembretes automáticos e dashboard**, construída com **Google Sheets + Google Apps Script WebApp + HTML/CSS/JS**, com layout corporativo centrado em UX.

Esse documento consolida:

* O que já foi feito
* O que está sendo construído
* O que ainda será implementado
* Arquitetura, módulos, fluxos, arquivos, integrações e SVGs
* Especificações técnicas completas

Ele serve como referência para você, para desenvolvimento contínuo e para ser usado no CODEX como “fonte da verdade” do projeto.

---

# **STARPAY – SPEC TÉCNICO DO SISTEMA DE CONTROLE DE CONTAS (PF/PJ)**

**Versão:** 1.0 (documento base)
**Stack:** Google Apps Script + Google Sheets + HTML/CSS/JS (WebApp UI)
**Com foco em experiência profissional (UserX-first)**

---

# **1. OBJETIVO DO SISTEMA**

Criar um sistema financeiro centralizado para:

1. **Cadastrar contas fixas** (recorrentes mensais).
2. **Cadastrar contas pontuais** (eventuais do mês).
3. **Gerar automaticamente a estrutura mensal de contas**.
4. **Controlar pagamentos e datas de vencimento**.
5. **Enviar lembretes por e-mail** com base no vencimento.
6. **Apresentar uma UI profissional**, evitando edits diretos na planilha.
7. **Permitir duas categorias de usuários:**

   * Administrador (você): acesso total.
   * Operadores (2 usuários): acesso apenas via WebApp.

O sistema funciona como um **mini-ERP financeiro**, com governança e UX refinado.

---

# **2. ARQUITETURA DO SISTEMA**

### **2.1 Camadas**

| Camada       | Tecnologia               | Função                                            |
| ------------ | ------------------------ | ------------------------------------------------- |
| Backend      | Google Apps Script (GS)  | CRUD de contas, pagamentos, lógica de recorrência |
| Database     | Google Sheets            | Armazenamento 100% estruturado                    |
| Frontend     | HTML + CSS + JS (WebApp) | UI + interação dos usuários                       |
| Automações   | Apps Script              | Triggers para lembretes, geração mensal           |
| Notificações | Apps Script + Gmail      | Envio de e-mails automatizados                    |

---

# **3. ESTRUTURA DA PLANILHA (DATABASE)**

A planilha contém quatro abas:

---

## **3.1 Aba CONFIG**

Parâmetros globais:

| Parâmetro                    | Valor                  |
| ---------------------------- | ---------------------- |
| EMAILS_NOTIFICACAO           | lista separada por “;” |
| DIAS_ANTES_VENCIMENTO        | ex.: 3                 |
| ENVIAR_NO_DIA_DO_VENCIMENTO  | SIM                    |
| ENVIAR_AVISO_APOS_VENCIMENTO | SIM                    |
| HORA_ENVIO_DIARIO            | 09:00                  |
| FUSO_HORARIO                 | America/Sao_Paulo      |
| MODO_CONTROLE_PF_PJ          | JUNTOS                 |

---

## **3.2 Aba CONTAS_FIXAS**

Colunas:

1. **ID_CONTA**
2. **NOME_CONTA**
3. **CATEGORIA**
4. **TIPO_PESSOA (PF/PJ)**
5. **VALOR_PREVISTO**
6. **DIA_RECORRENCIA**
7. **METODO_PAGAMENTO**
8. **OBSERVACOES**
9. **ATIVA (SIM/NÃO)**

Inserção realizada pelo módulo **Cadastrar Conta Fixa**.

---

## **3.3 Aba CONTAS_MENSAL**

Colunas (estrutura padronizada):

1. **ID_MENSAL**
2. **ID_CONTA_ORIGEM** (ID_CONTA ou MANUAL)
3. **NOME_CONTA**
4. **CATEGORIA**
5. **TIPO_PESSOA**
6. **VALOR_PREVISTO**
7. **VALOR_REAL**
8. **VENCIMENTO (data)**
9. **DATA_PAGAMENTO**
10. **PAGO (SIM/NÃO)**
11. **ATRASADO (SIM/NÃO)**
12. **METODO_PAGAMENTO**
13. **ORIGEM (FIXA/VARIAVEL)**
14. **NOTIFICACAO_ENVIADA**
15. **OBSERVACOES**

É manipulada exclusivamente pelo WebApp.

---

## **3.4 Aba DASHBOARD**

Reservada para cálculos internos do futuro dashboard.

---

# **4. ARQUITETURA DO WEBAPP (UI/UX)**

### **4.1 Layout Corporativo**

Componentes:

* Sidebar vertical
* Header dinâmico
* Conteúdo modular por view
* Design orientado a cards e tabelas
* Cores neutras (verde = pago, vermelho = atrasado, amarelo = vencendo, laranja = hoje)

### **4.2 Páginas do WebApp**

| Página                  | Função                                  |
| ----------------------- | --------------------------------------- |
| Home                    | Atalhos e visão geral                   |
| Cadastrar Conta Fixa    | Formulário → CONTAS_FIXAS               |
| Cadastrar Conta Pontual | Formulário → CONTAS_MENSAL              |
| Contas do Mês           | Tabela profissional com filtros e ações |
| Dashboard Financeiro    | Gráficos e KPIs (a desenvolver)         |

---

# **5. FLUXO COMPLETO DO SISTEMA**

### **5.1 Fluxo de Cadastro de Conta Fixa**

1. Usuário abre WebApp → “Cadastrar Conta Fixa”
2. Preenche formulário
3. Submete
4. JS → google.script.run → addContaFixa()
5. Apps Script grava na aba CONTAS_FIXAS
6. Confirmação visual

---

### **5.2 Fluxo de Cadastro de Conta Pontual**

1. Acessa módulo → “Cadastrar Conta Pontual”
2. Preenche dados (nome, categoria, vencimento etc.)
3. JS envia dados ao backend
4. Apps Script insere linha nova em CONTAS_MENSAL
5. ID gerado no formato `YYYY-MM-numeroDaLinha`

---

### **5.3 Fluxo de Visualização e Ação “Contas do Mês”**

1. Usuário seleciona mês (yyyy-mm)
2. Clica em “Atualizar”
3. JS chama getContasDoMes()
4. Backend filtra as contas do mês
5. Frontend exibe tabela colorida
6. Botões por linha:

   * **Pagar**
   * (futuro: editar, excluir)

---

### **5.4 Fluxo de Marcar Conta Como Paga**

1. JS pergunta a data de pagamento
2. Envia ao backend
3. Backend:

   * Preenche VALOR_REAL
   * Preenche DATA_PAGAMENTO
   * Marca PAGO = SIM
4. Front recarrega

---

### **5.5 Fluxo futuro — Geração Automática do Mês**

Será implementado:

* Função gerarMensal()
* Lê CONTAS_FIXAS
* Replica em CONTAS_MENSAL
* Ajusta o vencimento para o mês atual
* Marca ORIGEM = FIXA

---

# **6. BACKEND – APPS SCRIPT (ARQUIVOS E FUNÇÕES)**

### **Arquivos recomendados:**

```
Code.gs
contasFixas.gs
contasPontuais.gs
contasMensal.gs
dashboard.gs (futuro)
utils.gs (futuro)
```

---

## **6.1 Funções já implementadas**

### **addContaPontual(data)**

Insere conta variável na CONTAS_MENSAL.

### **addContaFixa(data)**

Insere conta fixa na CONTAS_FIXAS.

### **getContasDoMes(mes, status, tipoPessoa)**

Filtra e retorna lista para renderização no front.

### **marcarContaComoPaga(idMensal, dataPag)**

Atualiza status de pagamento.

---

## **6.2 Funções a implementar**

### Mês automático

* gerarMensal()
* gerarRecorrentes()
* replicarFixasParaMensal()

### Lembretes

* sendLembretes()
* sendEmail()
* lógica de DIAS_ANTES_VENCIMENTO

### Dashboard

* calcularTotais()
* calcularAtrasos()
* gráficos e KPIs

---

# **7. FRONT-END (index.html)**

## **7.1 Estrutura recomendada de arquivos**

```
index.html
styles.css (opcional)
script.js (opcional; atualmente inline)
```

O WebApp está estruturado com:

* Sidebar fixa
* Content-area dinâmica
* Menu via `navigate(view)`
* Views carregadas por blocos HTML dentro do script

---

# **8. CÓDIGOS COMPLETOS DO FRONT-END**

### **8.1 SVGs embutidos (inline)** — já integrados no script

```javascript
const svgCheck = `<svg width="18" height="18" ...></svg>`;
const svgLate = `<svg width="18" height="18" ...></svg>`;
const svgWarn = `<svg width="18" height="18" ...></svg>`;
const svgToday = `<svg width="18" height="18" ...></svg>`;
const svgTrash = `<svg width="16" height="16" ...></svg>`;
const svgEdit = `<svg width="16" height="16" ...></svg>`;
```

Eles ficam no topo do `<script>` do index.html.

---

### **8.2 Módulo de Cadastro de Conta Pontual**

✔ HTML do formulário
✔ Função submitContaPontual()
✔ Chamadas ao Apps Script

---

### **8.3 Módulo de Cadastro de Conta Fixa**

✔ HTML do formulário
✔ Função submitContaFixa()
✔ Chamadas ao Apps Script

---

### **8.4 Módulo Contas do Mês**

✔ HTML com filtros
✔ Função carregarContasMes()
✔ Função renderTabelaContasMes()
✔ Função marcarPago()
✔ Indicadores visuais + SVGs + UX aprimorado

---

# **9. DESIGN UX (UserX-first)**

Princípios utilizados:

1. **Zero exposição da planilha ao usuário final**
2. **Interface limpa com foco em produtividade**
3. **Feedback imediato** (alertas, recarregamento automático)
4. **Cores universais para status**
5. **Tabela responsiva para leitura fácil**
6. **Ações por linha, sem menu complicado**
7. **Redução de atrito**: formulários simples, Botões grandes
8. **Consistência visual** em toda a aplicação

---

# **10. ROADMAP – O QUE AINDA SERÁ FEITO**

## **10.1 ALTAMENTE PRIORITÁRIO**

(Para o sistema ficar completo)

1. **Motor de geração automática do mês**

   * replicar contas fixas
   * limpar contas antigas
   * manter contas pontuais

2. **Sistema de lembretes (email)**

   * DIAS_ANTES
   * NO_DIA
   * APÓS_VENCIMENTO
   * Configuração via aba CONFIG

3. **Dashboard financeiro**

   * Gráficos: Pizza, linha e barra
   * KPIs: total previsto, total pago, total em aberto
   * Indicadores PF x PJ
   * Contadores de atrasados e vencendo

---

## **10.2 OPCIONAIS / FUTUROS**

* Modo “Editar conta”
* Modo “Excluir conta”
* Logs de auditoria
* Autenticação de usuários (Google Login)
* Exportação para PDF
* Integração WhatsApp API
* Interface mobile (PWA)
* Tema personalizado (dark mode)

---

# **11. ESTADO ATUAL DO PROJETO**

### ✔ O que já está funcional:

* WebApp base
* Navegação entre módulos
* Cadastro de contas fixas
* Cadastro de contas pontuais
* Gravação estruturada na planilha
* Renderização profissional da tabela mensal
* Marcar como Pago

### 🚧 Em andamento:

* Dashboard
* Geração automática de mês
* Lembretes automáticos

---

# **12. CONCLUSÃO**

Este SPEC define de forma técnica e funcional todo o sistema construído e o caminho para completá-lo.
Com ele, você tem:

* Documentação para si
* Base para entregar ao CODEX
* Padrão para evoluir o sistema
* Visão clara de escopo, módulos e arquitetura

---

# Deseja agora que eu:

1. Gere um arquivo **STARPAY_SPEC.md** pronto para download?
2. Prossiga para a **ETAPA 8 – Motor Automático de Geração Mensal**?
3. Comece a montar o **Dashboard profissional**?

É só escolher: **1**, **2**, **3**, ou “todos”.
