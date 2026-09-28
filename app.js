const STORAGE_KEY = "gustavo_financas_mvp_v2";
const LEGACY_STORAGE_KEY = "gustavo_financas_mvp_v1";

let appData = {
  transactions: [],
  goals: [],
  bills: []
};

let flowChart;
let categoryChart;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeData(data = {}) {
  return {
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    goals: Array.isArray(data.goals) ? data.goals : [],
    bills: Array.isArray(data.bills) ? data.bills : []
  };
}

async function loadInitialData() {
  const stored = localStorage.getItem(STORAGE_KEY) ||
                 localStorage.getItem(LEGACY_STORAGE_KEY);

  if (!stored) {
    appData = { transactions: [], goals: [], bills: [] };
    persistData();
    renderApp();
    return;
  }

  const dadosSalvos = normalizeData(JSON.parse(stored));
  let demonstracaoOriginal = false;

  try {
    const texto = JSON.stringify(dadosSalvos);
    const bytes = new TextEncoder().encode(texto);
    const resultado = await crypto.subtle.digest("SHA-256", bytes);
    const assinatura = Array.from(new Uint8Array(resultado))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");

    demonstracaoOriginal = assinatura === "71e90241c08ad2e3cd72d4c472dd0427dfe34ebd889c4dc9ae4af13281ab2302";
  } catch (erro) {
    console.warn("Verificação dos dados demonstrativos indisponível.", erro);
  }

  if (demonstracaoOriginal) {
    localStorage.setItem("raiz_financas_backup_demo_v1", stored);
    appData = { transactions: [], goals: [], bills: [] };
  } else {
    appData = dadosSalvos;
  }

  persistData();
  renderApp();
}

function persistData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function getTotals() {
  return appData.transactions.reduce(
    (acc, item) => {
      const amount = Number(item.amount) || 0;
      if (item.type === "receita") acc.income += amount;
      else acc.expense += amount;
      acc.balance = acc.income - acc.expense;
      return acc;
    },
    { income: 0, expense: 0, balance: 0 }
  );
}

function getOpenBillTotals() {
  return appData.bills
    .filter((bill) => bill.status !== "concluida")
    .reduce(
      (acc, bill) => {
        if (bill.type === "receber") acc.receivable += Number(bill.amount) || 0;
        if (bill.type === "pagar") acc.payable += Number(bill.amount) || 0;
        return acc;
      },
      { receivable: 0, payable: 0 }
    );
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function localDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function todayAtNoon() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
}

function daysUntil(dateString) {
  return Math.round((localDate(dateString) - todayAtNoon()) / 86400000);
}

function billPriority(bill) {
  if (bill.status === "concluida") return { label: "Concluída", className: "done", order: 9999 };
  const days = daysUntil(bill.dueDate);
  if (days < 0) return { label: `${Math.abs(days)}d atrasada`, className: "overdue", order: days };
  if (days === 0) return { label: "Vence hoje", className: "today", order: 0 };
  if (days === 1) return { label: "Vence amanhã", className: "soon", order: 1 };
  if (days <= 7) return { label: `Vence em ${days}d`, className: "soon", order: days };
  return { label: `Em ${days}d`, className: "future", order: days };
}

function renderSummary() {
  const totals = getTotals();
  const openBills = getOpenBillTotals();
  const monthlyGoal = appData.goals.find((goal) => goal.type === "receita-mensal");

  document.querySelector("#balanceValue").textContent = currency.format(totals.balance);
  document.querySelector("#incomeValue").textContent = currency.format(totals.income);
  document.querySelector("#expenseValue").textContent = currency.format(totals.expense);
  document.querySelector("#goalValue").textContent = currency.format(monthlyGoal?.target || 0);
  document.querySelector("#receivableValue").textContent = currency.format(openBills.receivable);
  document.querySelector("#payableValue").textContent = currency.format(openBills.payable);
}

function transactionRow(item, allowDelete = false) {
  const valueClass = item.type === "receita" ? "positive" : "negative";
  const signal = item.type === "receita" ? "+" : "-";

  return `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td>${escapeHtml(item.description)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td><span class="badge ${item.type}">${item.type}</span></td>
      <td class="money ${valueClass}">${signal} ${currency.format(Number(item.amount))}</td>
      ${allowDelete ? `<td><button class="delete-button" data-delete-id="${item.id}">Excluir</button></td>` : ""}
    </tr>
  `;
}

function renderTransactions() {
  const ordered = [...appData.transactions].sort((a, b) => localDate(b.date) - localDate(a.date));

  document.querySelector("#recentTransactions").innerHTML = ordered.length
    ? ordered.slice(0, 5).map((item) => transactionRow(item)).join("")
    : `<tr><td colspan="5" class="empty-state">Nenhum lançamento registrado.</td></tr>`;

  document.querySelector("#allTransactions").innerHTML = ordered.length
    ? ordered.map((item) => transactionRow(item, true)).join("")
    : `<tr><td colspan="6" class="empty-state">Nenhum lançamento registrado.</td></tr>`;

  document.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.deleteId);
      appData.transactions = appData.transactions.filter((item) => item.id !== id);
      persistData();
      renderApp();
    });
  });
}

function billCard(bill) {
  const priority = billPriority(bill);
  const direction = bill.type === "receber" ? "A receber" : "A pagar";
  const amountClass = bill.type === "receber" ? "positive" : "negative";
  const phone = String(bill.phone || "").replace(/\D/g, "");
  const message = encodeURIComponent(
    `Olá! Lembrete financeiro: ${bill.description}, valor ${currency.format(Number(bill.amount))}, vencimento ${formatDate(bill.dueDate)}.`
  );
  const whatsapp = phone
    ? `<a class="whatsapp-button" href="https://wa.me/${phone}?text=${message}" target="_blank" rel="noopener">WhatsApp</a>`
    : "";

  return `
    <article class="bill-card ${bill.status === "concluida" ? "completed" : ""}">
      <div class="bill-main">
        <div>
          <div class="bill-title-row">
            <span class="badge ${bill.type}">${direction}</span>
            <span class="priority ${priority.className}">${priority.label}</span>
          </div>
          <h3>${escapeHtml(bill.description)}</h3>
          <p>${escapeHtml(bill.category)} · vencimento ${formatDate(bill.dueDate)}</p>
        </div>
        <strong class="money ${amountClass}">${currency.format(Number(bill.amount))}</strong>
      </div>
      <div class="bill-actions">
        ${whatsapp}
        ${bill.status !== "concluida" ? `<button class="secondary-button" data-complete-bill="${bill.id}">Marcar como concluída</button>` : ""}
        <button class="delete-button" data-delete-bill="${bill.id}">Excluir</button>
      </div>
    </article>
  `;
}

function getFilteredBills() {
  const filter = document.querySelector("#billFilter")?.value || "abertas";
  return [...appData.bills]
    .filter((bill) => {
      if (filter === "abertas") return bill.status !== "concluida";
      if (filter === "pagar" || filter === "receber") return bill.type === filter;
      return true;
    })
    .sort((a, b) => localDate(a.dueDate) - localDate(b.dueDate));
}

function renderBills() {
  const bills = getFilteredBills();
  document.querySelector("#billsList").innerHTML = bills.length
    ? bills.map(billCard).join("")
    : `<div class="empty-state panel">Nenhuma conta para este filtro.</div>`;

  document.querySelectorAll("[data-complete-bill]").forEach((button) => {
    button.addEventListener("click", () => completeBill(Number(button.dataset.completeBill)));
  });

  document.querySelectorAll("[data-delete-bill]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.deleteBill);
      appData.bills = appData.bills.filter((bill) => bill.id !== id);
      persistData();
      renderApp();
    });
  });
}

function completeBill(id) {
  const bill = appData.bills.find((item) => item.id === id);
  if (!bill || bill.status === "concluida") return;

  bill.status = "concluida";
  bill.completedAt = new Date().toISOString().slice(0, 10);

  appData.transactions.push({
    id: Date.now(),
    description: bill.description,
    type: bill.type === "receber" ? "receita" : "despesa",
    category: bill.category,
    amount: Number(bill.amount),
    date: bill.completedAt,
    sourceBillId: bill.id
  });

  persistData();
  renderApp();
}

function agendaItem(bill) {
  const priority = billPriority(bill);
  const typeText = bill.type === "receber" ? "Receber" : "Pagar";
  return `
    <div class="agenda-item">
      <div>
        <strong>${escapeHtml(bill.description)}</strong>
        <span>${typeText} ${currency.format(Number(bill.amount))} · ${formatDate(bill.dueDate)}</span>
      </div>
      <span class="priority ${priority.className}">${priority.label}</span>
    </div>
  `;
}

function renderAgenda() {
  const open = appData.bills
    .filter((bill) => bill.status !== "concluida")
    .sort((a, b) => billPriority(a).order - billPriority(b).order);

  const html = open.length
    ? open.map(agendaItem).join("")
    : `<div class="empty-state">Nenhuma pendência financeira.</div>`;

  document.querySelector("#agendaList").innerHTML = html;
  document.querySelector("#dashboardAgenda").innerHTML = open.length
    ? open.slice(0, 5).map(agendaItem).join("")
    : `<div class="empty-state">Agenda livre.</div>`;

  document.querySelector("#dashboardBills").innerHTML = open.length
    ? open.slice(0, 4).map(agendaItem).join("")
    : `<div class="empty-state">Sem contas em aberto.</div>`;
}

function renderGoals() {
  document.querySelector("#goalsList").innerHTML = appData.goals.length
    ? appData.goals.map((goal) => {
        const percent = goal.target ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
        return `
          <article class="goal-card">
            <p class="eyebrow">${escapeHtml(goal.label)}</p>
            <h3>${currency.format(goal.current)} / ${currency.format(goal.target)}</h3>
            <div class="goal-progress"><div style="width: ${percent}%"></div></div>
            <div class="goal-meta"><span>${percent}% concluído</span><span>${escapeHtml(goal.deadline || "Sem prazo")}</span></div>
          </article>
        `;
      }).join("")
    : `<div class="empty-state panel">Nenhuma meta cadastrada.</div>`;
}

function buildCharts() {
  const totals = getTotals();
  if (flowChart) flowChart.destroy();
  if (categoryChart) categoryChart.destroy();

  flowChart = new Chart(document.querySelector("#flowChart"), {
    type: "bar",
    data: {
      labels: ["Receitas", "Despesas", "Saldo"],
      datasets: [{ label: "Valor", data: [totals.income, totals.expense, totals.balance] }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  const expensesByCategory = appData.transactions
    .filter((item) => item.type === "despesa")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
      return acc;
    }, {});

  const labels = Object.keys(expensesByCategory);
  categoryChart = new Chart(document.querySelector("#categoryChart"), {
    type: "doughnut",
    data: {
      labels: labels.length ? labels : ["Sem despesas"],
      datasets: [{ data: labels.length ? Object.values(expensesByCategory) : [1] }]
    },
    options: { responsive: true }
  });
}

function renderApp() {
  renderSummary();
  renderTransactions();
  renderBills();
  renderAgenda();
  renderGoals();
  buildCharts();
}

function setupNavigation() {
  const titles = {
    dashboard: "Visão geral",
    lancamentos: "Lançamentos",
    contas: "Contas a pagar e receber",
    agenda: "Agenda inteligente",
    metas: "Metas financeiras"
  };

  document.querySelectorAll(".menu-item").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".menu-item").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".page-section").forEach((section) => section.classList.remove("active"));
      button.classList.add("active");
      document.querySelector(`#${button.dataset.section}`).classList.add("active");
      document.querySelector("#pageTitle").textContent = titles[button.dataset.section];
    });
  });
}

function setupModals() {
  const transactionModal = document.querySelector("#transactionModal");
  const billModal = document.querySelector("#billModal");

  document.querySelector("#newTransactionButton").addEventListener("click", () => {
    document.querySelector("#date").value = new Date().toISOString().slice(0, 10);
    transactionModal.showModal();
  });

  document.querySelector("#newBillButton").addEventListener("click", () => {
    document.querySelector("#billDueDate").value = new Date().toISOString().slice(0, 10);
    billModal.showModal();
  });

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => document.querySelector(`#${button.dataset.close}`).close());
  });

  document.querySelector("#transactionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    appData.transactions.push({
      id: Date.now(),
      description: document.querySelector("#description").value.trim(),
      type: document.querySelector("#type").value,
      category: document.querySelector("#category").value,
      amount: Number(document.querySelector("#amount").value),
      date: document.querySelector("#date").value
    });
    persistData();
    event.target.reset();
    transactionModal.close();
    renderApp();
  });

  document.querySelector("#billForm").addEventListener("submit", (event) => {
    event.preventDefault();
    appData.bills.push({
      id: Date.now(),
      description: document.querySelector("#billDescription").value.trim(),
      type: document.querySelector("#billType").value,
      category: document.querySelector("#billCategory").value,
      amount: Number(document.querySelector("#billAmount").value),
      dueDate: document.querySelector("#billDueDate").value,
      phone: document.querySelector("#billPhone").value.trim(),
      status: "aberta",
      createdAt: new Date().toISOString().slice(0, 10)
    });
    persistData();
    event.target.reset();
    billModal.close();
    renderApp();
  });

  document.querySelector("#billFilter").addEventListener("change", renderBills);
}

setupNavigation();
setupModals();
loadInitialData();
