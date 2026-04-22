const API_URL = window.location.origin;
let total = 0;
let budget = localStorage.getItem("userBudget") ? parseFloat(localStorage.getItem("userBudget")) : 0;
let myChart;
let allExpenses = []; // Global store for PDF export

const userId = localStorage.getItem("userId");
const username = localStorage.getItem("username");

window.onload = function() {
    if (!userId) { window.location.href = "auth.html"; return; }
    document.getElementById("welcomeMessage").innerText = `Welcome back, ${username}!`;
    document.getElementById("currentBudgetText").innerText = `Current Budget: ₹${budget}`;
    
    const ctx = document.getElementById('expenseChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: [], datasets: [{ data: [], backgroundColor: ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '75%' }
    });
    fetchExpenses();
};

async function fetchExpenses() {
    try {
        const response = await fetch(`http://localhost:5001/api/expenses/${userId}`);
        allExpenses = await response.json();
        
        total = 0;
        const chartMap = {};
        const list = document.getElementById("expenseList");
        list.innerHTML = "";

        allExpenses.forEach(exp => {
            updateUIList(exp.description, exp.amount, exp._id);
            total += exp.amount;
            chartMap[exp.description] = (chartMap[exp.description] || 0) + exp.amount;
        });

        document.getElementById("total").innerText = total;
        myChart.data.labels = Object.keys(chartMap);
        myChart.data.datasets[0].data = Object.values(chartMap);
        myChart.update();
        updateRemaining();
    } catch (error) { console.error(error); }
}

// FEATURE 1: Smart Budget Logic
function calculateSmartBudget() {
    const income = parseFloat(document.getElementById("incomeInput").value);
    const suggestion = document.getElementById("smart-suggestion-text");
    
    if (income > 0) {
        const needs = (income * 0.5).toFixed(0);
        const wants = (income * 0.3).toFixed(0);
        const savings = (income * 0.2).toFixed(0);
        suggestion.innerHTML = `Based on ₹${income}: Spend <b>₹${needs}</b> on Needs, <b>₹${wants}</b> on Wants, and save <b>₹${savings}</b>.`;
    } else {
        suggestion.innerText = "Enter your total income to see recommended limits.";
    }
}

// FEATURE 2: PDF Export Logic
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // PDF Header
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.text("SmartSpend Financial Report", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`User: ${username}`, 20, 30);
    doc.text(`Total Monthly Spend: Rs. ${total}`, 20, 37);
    doc.text(`Current Budget Status: Rs. ${budget}`, 20, 44);

    // Table Data
    const tableData = allExpenses.map(exp => [
        exp.description, 
        `Rs. ${exp.amount}`, 
        new Date(exp.date).toLocaleDateString()
    ]);

    doc.autoTable({
        startY: 55,
        head: [['Description', 'Amount', 'Date']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save(`${username}_Financial_Report.pdf`);
}

async function addExpense() {
    const desc = document.getElementById("desc").value;
    const amount = parseFloat(document.getElementById("amount").value);
    if (!desc || isNaN(amount)) return;
    try {
        const response = await fetch('http://localhost:5001/api/expenses', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: desc, amount: amount, userId: userId })
        });
        if (response.ok) {
            document.getElementById("input-container").style.display = "none";
            document.getElementById("success-container").style.display = "block";
            fetchExpenses(); 
        }
    } catch (error) { alert("Error"); }
}

async function deleteExpense(id) {
    if (!confirm("Delete?")) return;
    try {
        const response = await fetch(`http://localhost:5001/api/expenses/${id}`, { method: 'DELETE' });
        if (response.ok) fetchExpenses(); 
    } catch (error) { alert("Error"); }
}

function updateUIList(desc, amount, id) {
    const list = document.getElementById("expenseList");
    const li = document.createElement("li");
    li.id = `exp-${id}`;
    li.innerHTML = `
        <div class="exp-details">
            <span class="exp-name">${desc}</span>
            <span class="exp-price">₹${amount}</span>
        </div>
        <button class="delete-btn-red" onclick="deleteExpense('${id}')">Delete</button>
    `;
    list.appendChild(li);
}

function resetAddForm() {
    document.getElementById("desc").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("input-container").style.display = "block";
    document.getElementById("success-container").style.display = "none";
}

function setBudget() {
    const val = parseFloat(document.getElementById("budgetInput").value);
    if (isNaN(val) || val <= 0) return;
    budget = val;
    localStorage.setItem("userBudget", budget);
    document.getElementById("currentBudgetText").innerText = `Current Budget: ₹${budget}`;
    updateRemaining();
    alert("Budget Updated!");
}

function resetBudget() {
    budget = 0;
    localStorage.removeItem("userBudget");
    document.getElementById("currentBudgetText").innerText = `Current Budget: ₹0`;
    document.getElementById("remaining").innerText = "Set Budget First";
}

function updateRemaining() {
    const remDisplay = document.getElementById("remaining");
    if (budget > 0) {
        const rem = budget - total;
        remDisplay.innerText = `₹${rem}`;
        remDisplay.style.color = rem < 0 ? "#f43f5e" : "#6366f1";
    } else { remDisplay.innerText = "Set Budget First"; }
}

function showSection(sectionId) {
    if (sectionId === 'add-expense') resetAddForm();
    if (sectionId === 'history' || sectionId === 'overview') fetchExpenses();
    document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
    document.getElementById(sectionId).style.display = "block";
    document.querySelectorAll(".sidebar li").forEach(li => li.classList.remove("active"));
    document.getElementById(`nav-${sectionId}`).classList.add("active");
}

function logout() { localStorage.clear(); window.location.href = "auth.html"; }
