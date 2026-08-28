# Gustavo Finanças — MVP

Painel financeiro simples feito com HTML, CSS e JavaScript puro.

## Objetivo

Resolver o controle financeiro inicial do Gustavo e da operação da empresa, com foco em:

- receitas;
- despesas;
- saldo;
- metas;
- gráficos;
- histórico de lançamentos;
- armazenamento local no navegador.

## Estrutura

```text
gustavo-financas-mvp/
├── index.html
├── styles.css
├── app.js
├── data.json
└── README.md
```

## Como executar

### Opção recomendada — VS Code + Live Server

1. Abra a pasta no VS Code.
2. Instale a extensão **Live Server**.
3. Clique com o botão direito em `index.html`.
4. Escolha **Open with Live Server**.

O `data.json` funciona melhor por servidor local do que abrindo o HTML diretamente pelo arquivo.

### Outra opção

No terminal, dentro da pasta:

```bash
python3 -m http.server 5500
```

Depois abra:

```text
http://localhost:5500
```

## Persistência

Na primeira execução, o sistema lê `data.json`.

Depois disso, as alterações feitas pelo usuário são gravadas no `localStorage` do navegador com a chave:

```text
gustavo_financas_mvp_v1
```

Isso permite usar o sistema sem banco de dados nesta primeira fase.

## Próximas versões

- filtros por mês e período;
- categorias personalizadas;
- editar lançamentos;
- contas a pagar e receber;
- agenda inteligente;
- lembretes;
- integração com WhatsApp;
- exportação CSV/PDF;
- autenticação;
- PostgreSQL;
- backend Node.js;
- multiempresa/multicliente;
- painel para pequenos clientes.

## Stack atual

- HTML5
- CSS3
- JavaScript
- Chart.js
- JSON
- localStorage

## Conceito

MVP interno e mobile-first para validar o fluxo real antes de adicionar backend, autenticação, APIs ou automações.
