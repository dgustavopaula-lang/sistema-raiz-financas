const STORAGE_KEY = "gustavo_financas_mvp_v1";

let appData = {
  transactions: [],
  goals: []
};

let flowChart;
let categoryChart;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

async function loadInitialData() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    appData = JSON.parse(stored);
    renderApp();
    return;
  }

  try {
    const response = await fetch("./data.json");
    appData = await response.json();
    persistData();
  } catch (error) {
    console.warn("Não foi possível carregar data.json.", error);
  }

  renderApp();
}

function persistData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function getTotals() {
  return appData.transactions.reduce(
    (acc, item) => {
      if (item.type === "receita") {
        acc.income += Number(item.amount);
      } else {
        acc.expense += Number(item.amount);
      }

      acc.balance = acc.income - acc.expense;
      return acc;
    },
    { income: 0, expense: 0, balance: 0 }
  );
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function renderSummary() {
  const totals = getTotals();
  const monthlyGoal = appData.goals.find((goal) => goal.type === "receita-mensal");

  document.querySelector("#balanceValue").textContent = currency.format(totals.balance);
  document.querySelector("#incomeValue").textContent = currency.format(totals.income);
  document.querySelector("#expenseValue").textContent = currency.format(totals.expense);
  document.querySelector("#goalValue").textContent = currency.format(monthlyGoal?.target || 0);
}

function transactionRow(item, allowDelete = false) {
  const valueClass = item.type === "receita" ? "positive" : "negative";
  const signal = item.type === "receita" ? "+" : "-";

  return `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td>${item.description}</td>
      <td>${item.category}</td>
      <td><span class="badge ${item.type}">${item.type}</span></td>
      <td class="money ${valueClass}">${signal} ${currency.format(Number(item.amount))}</td>
      ${allowDelete ? `<td><button class="delete-button" data-delete-id="${item.id}">Excluir</button></td>` : ""}
    </tr>
  `;
}

function renderTransactions() {
  const ordered = [...appData.transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  document.querySelector("#recentTransactions").innerHTML = ordered
    .slice(0, 5)
    .map((item) => transactionRow(item))
    .join("");

  document.querySelector("#allTransactions").innerHTML = ordered
    .map((item) => transactionRow(item, true))
    .join("");

  document.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.deleteId);
      appData.transactions = appData.transactions.filter((item) => item.id !== id);
      persistData();
      renderApp();
    });
  });
}

function renderGoals() {
  document.querySelector("#goalsList").innerHTML = appData.goals
    .map((goal) => {
      const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));

      return `
        <article class="goal-card">
          <p class="eyebrow">${goal.label}</p>
          <h3>${currency.format(goal.current)} / ${currency.format(goal.target)}</h3>
          <div class="goal-progress">
            <div style="width: ${percent}%"></div>
          </div>
          <div class="goal-meta">
            <span>${percent}% concluído</span>
            <span>${goal.deadline || "Sem prazo"}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function buildCharts() {
  const totals = getTotals();

  if (flowChart) flowChart.destroy();
  if (categoryChart) categoryChart.destroy();

  const flowContext = document.querySelector("#flowChart");
  const categoryContext = document.querySelector("#categoryChart");

  flowChart = new Chart(flowContext, {
    type: "bar",
    data: {
      labels: ["Receitas", "Despesas", "Saldo"],
      datasets: [
        {
          label: "Valor",
          data: [totals.income, totals.expense, totals.balance]
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });

  const expensesByCategory = appData.transactions
    .filter((item) => item.type === "despesa")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
      return acc;
    }, {});

  categoryChart = new Chart(categoryContext, {
    type: "doughnut",
    data: {
      labels: Object.keys(expensesByCategory),
      datasets: [
        {
          data: Object.values(expensesByCategory)
        }
      ]
    },
    options: {
      responsive: true
    }
  });
}

function renderApp() {
  renderSummary();
  renderTransactions();
  renderGoals();
  buildCharts();
}

function setupNavigation() {
  const menuItems = document.querySelectorAll(".menu-item");
  const sections = document.querySelectorAll(".page-section");
  const pageTitle = document.querySelector("#pageTitle");

  const titles = {
    dashboard: "Visão geral",
    lancamentos: "Lançamentos",
    metas: "Metas financeiras"
  };

  menuItems.forEach((button) => {
    button.addEventListener("click", () => {
      menuItems.forEach((item) => item.classList.remove("active"));
      sections.forEach((section) => section.classList.remove("active"));

      button.classList.add("active");
      document.querySelector(`#${button.dataset.section}`).classList.add("active");
      pageTitle.textContent = titles[button.dataset.section];
    });
  });
}

function setupTransactionModal() {
  const modal = document.querySelector("#transactionModal");
  const form = document.querySelector("#transactionForm");
  const dateInput = document.querySelector("#date");

  document.querySelector("#newTransactionButton").addEventListener("click", () => {
    dateInput.value = new Date().toISOString().slice(0, 10);
    modal.showModal();
  });

  document.querySelector("#closeModalButton").addEventListener("click", () => {
    modal.close();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const newTransaction = {
      id: Date.now(),
      description: document.querySelector("#description").value.trim(),
      type: document.querySelector("#type").value,
      category: document.querySelector("#category").value,
      amount: Number(document.querySelector("#amount").value),
      date: document.querySelector("#date").value
    };

    appData.transactions.push(newTransaction);
    persistData();
    renderApp();

    form.reset();
    modal.close();
  });
}

setupNavigation();
setupTransactionModal();
loadInitialData();
