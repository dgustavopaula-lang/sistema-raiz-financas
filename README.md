# Gustavo Finanças — MVP

Painel financeiro simples feito com HTML, CSS e JavaScript puro.

## Estado atual

O projeto já evoluiu do primeiro dashboard para uma segunda etapa funcional, ainda sem backend.

Funcionalidades atuais:

- receitas e despesas;
- saldo financeiro;
- metas;
- gráficos com Chart.js;
- histórico de lançamentos;
- contas a pagar;
- contas a receber;
- status de contas em aberto e concluídas;
- agenda financeira automática por vencimento;
- identificação de contas atrasadas, vencendo hoje e próximas;
- botão de WhatsApp para contatos cadastrados nas contas;
- conclusão de uma conta gerando automaticamente o lançamento financeiro correspondente;
- persistência com localStorage;
- layout responsivo e mobile-first.

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

### VS Code + Live Server

1. Abra a pasta no VS Code.
2. Use a extensão Live Server.
3. Abra `index.html` com Live Server.

### Terminal

```bash
python3 -m http.server 5500
```

Depois acesse:

```text
http://localhost:5500
```

## Persistência

Os dados ficam no navegador em:

```text
gustavo_financas_mvp_v2
```

O código também migra automaticamente os dados encontrados na chave antiga:

```text
gustavo_financas_mvp_v1
```

O `data.json` é usado como carga inicial quando não existe informação salva no navegador.

## Contas e agenda

Cada conta pode ser definida como:

- `pagar`;
- `receber`.

A agenda é derivada das contas em aberto e prioriza automaticamente:

1. atrasadas;
2. vencendo hoje;
3. vencendo amanhã;
4. próximos sete dias;
5. vencimentos futuros.

Ao marcar uma conta como concluída, o sistema gera um lançamento de receita ou despesa automaticamente.

## WhatsApp

Cada conta pode receber um telefone de contato com DDI. Quando houver telefone cadastrado, o sistema gera um link `wa.me` com uma mensagem financeira pré-preenchida.

Nesta fase não existe API oficial do WhatsApp nem envio automático. O usuário confirma o envio no próprio WhatsApp.

## Próxima fase — backend

Somente depois de validar esta etapa local:

- Node.js / Express;
- PostgreSQL;
- autenticação;
- usuários e permissões;
- persistência real no banco;
- API REST;
- contas recorrentes;
- agenda persistente;
- integração oficial com WhatsApp;
- exportação CSV/PDF;
- multiempresa/multicliente.

## Stack atual

- HTML5
- CSS3
- JavaScript
- Chart.js
- JSON
- localStorage

## Conceito

Produto interno simples para validar o fluxo financeiro real de uma pequena operação antes de adicionar infraestrutura, banco de dados e integrações externas.
