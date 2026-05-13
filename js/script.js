const form = document.getElementById("expense-form");
const list = document.getElementById("transactionList");
const balanceDisplay = document.getElementById("balance");
const progressBar = document.getElementById("progressBar");
const sortSelect = document.getElementById("sortSelect");
const exportPDF = document.getElementById("exportPDF");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let chart;

function save() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function render() {
  list.innerHTML = "";

  let filtered = [...transactions];

  // Sort
  if (sortSelect.value === "amount") {
    filtered.sort((a, b) => b.amount - a.amount);
  } else if (sortSelect.value === "category") {
    filtered.sort((a, b) => a.category.localeCompare(b.category));
  }

  if (filtered.length === 0) {
    list.innerHTML = "<li style='text-align:center; color:#64748b;'>Belum ada transaksi</li>";
  }

  filtered.forEach((t) => {
    let li = document.createElement("li");
    li.className = "transaction-item";
    li.innerHTML = `
      <span><strong>${t.name}</strong> - ${t.category} <br> Rp${t.amount.toLocaleString("id-ID")}</span>
      <button class="delete-btn" onclick="remove(${transactions.indexOf(t)})">X</button>
    `;
    list.appendChild(li);
  });

  updateBalance();
  updateChart();
}

function updateBalance() {
  let total = transactions.reduce((a, b) => a + b.amount, 0);
  balanceDisplay.innerText = "Rp " + total.toLocaleString("id-ID");
  let percent = Math.min((total / 5000000) * 100, 100);
  progressBar.style.width = percent + "%";
}

function remove(index) {
  transactions.splice(index, 1);
  save();
  render();
}

form.addEventListener("submit", function(e) {
  e.preventDefault();

  let name = document.getElementById("itemName").value.trim();
  let amount = document.getElementById("amount").value;
  let category = document.getElementById("category").value;
  let newCategory = document.getElementById("newCategory").value.trim();

  if (newCategory) category = newCategory;
  if (!name ||!amount ||!category) return alert("Isi semua field!");

  transactions.push({
    name: name,
    amount: Number(amount),
    category: category,
    date: new Date().toISOString()
  });

  save();
  render();
  form.reset();
});

function updateChart() {
  let totals = {};
  transactions.forEach(t => {
    if (!totals[t.category]) totals[t.category] = 0;
    totals[t.category] += t.amount;
  });

  let labels = Object.keys(totals);
  let data = Object.values(totals);

  let colors = [
    '#38bdf8', '#0ea5e9', '#22c55e', '#f59e0b',
    '#ef4444', '#a855f7', '#ec4899', '#f97316',
    '#14b8a6', '#eab308'
  ];

  if (chart) chart.destroy();
  if (labels.length === 0) return;

  chart = new Chart(document.getElementById("expenseChart"), {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: '#1e293b',
            font: { size: 14, weight: '600' }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true
      }
    }
  });
}

sortSelect.addEventListener("change", render);

exportPDF.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Expense Report", 10, 15);

  let y = 30;
  doc.setFontSize(12);

  transactions.forEach(t => {
    let date = new Date(t.date).toLocaleDateString('id-ID');
    doc.text(`${date} | ${t.name} - ${t.category} | Rp${t.amount.toLocaleString("id-ID")}`, 10, y);
    y += 10;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save(`expense-report.pdf`);
});

render();