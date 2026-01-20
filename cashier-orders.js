// Import Firebase configuration
import { db } from './firebase-config.js';
import { collection, onSnapshot, doc, deleteDoc, addDoc, query, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Check login status
if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'index.html?role=cashier';
}

// --- DOM ELEMENTS ---
// Navigation
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar'); // Note: Added to HTML?
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('pageTitle');
const logoutBtn = document.getElementById('logoutBtn');

// Payment Section
const ordersGrid = document.querySelector('.orders-grid');
const paymentModal = document.getElementById('paymentModal');
const modalMessage = document.getElementById('modalMessage');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');

// Sales Section
const salesFilters = document.querySelectorAll('.filter-btn');
const salesChartCanvas = document.getElementById('salesChart');

// State
let currentTableToDelete = null;
let currentTotal = 0;
let currentOrderData = null;
let chartInstance = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initOrdersListener();
    initSalesChart(); // Initialize with default view
    initHistoryListener(); // Initialize History

});

// --- NAVIGATION LOGIC ---
function initNavigation() {
    // Sidebar Toggle
    const toggleSidebar = () => sidebar.classList.toggle('open');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);

    // Section Switching
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.dataset.section;

            // Update Active Nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update Active Section
            contentSections.forEach(sec => sec.classList.remove('active'));
            document.getElementById(`${sectionId}-section`).classList.add('active');

            // Update Title
            pageTitle.textContent = item.innerText.trim();

            // Close sidebar on mobile after selection
            if (window.innerWidth <= 1024) sidebar.classList.remove('open');

            // Trigger chart update if sales section
            if (sectionId === 'sales') {
                const activeFilter = document.querySelector('.filter-btn.active');
                if (activeFilter) updateChart(activeFilter.dataset.range);
            }

            // Trigger history load if history section
            if (sectionId === 'history') {
                if (historyDateFilter && historyDateFilter.value) {
                    loadHistory(historyDateFilter.value);
                }
            }
        });
    });

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html?role=cashier';
        });
    }
}

// --- ORDERS & PAYMENT LOGIC ---
function initOrdersListener() {
    onSnapshot(collection(db, 'orders'), (snapshot) => {
        ordersGrid.innerHTML = '';
        const ordersArray = [];

        snapshot.forEach((docSnap) => {
            const tableNumber = docSnap.id;
            const orderData = docSnap.data();
            if (orderData.done && Object.keys(orderData.done).length > 0) {
                ordersArray.push({
                    tableNumber,
                    orderData,
                    timestamp: orderData.createdAt || null
                });
            }
        });

        // Sort: Oldest First
        ordersArray.sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return a.timestamp.seconds - b.timestamp.seconds;
        });

        ordersArray.forEach(({ tableNumber, orderData, timestamp }) => {
            renderOrderCard(tableNumber, orderData.done, timestamp);
        });

        if (ordersArray.length === 0) {
            ordersGrid.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.2rem; grid-column: 1/-1; padding: 3rem;">No orders ready for payment</p>';
        }
    });
}

function renderOrderCard(tableNumber, doneItems, timestamp) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.dataset.table = tableNumber;

    let timeString = 'Now';
    if (timestamp && timestamp.seconds) {
        timeString = new Date(timestamp.seconds * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    }

    let itemsHTML = '';
    let total = 0;
    for (const [key, item] of Object.entries(doneItems)) {
        itemsHTML += `<li>${item.name} × ${item.qty}</li>`;
        total += item.total || (item.price * item.qty) || 0;
    }

    card.innerHTML = `
        <div class="card-header">
            <span class="timestamp">${timeString}</span>
            <h2 class="table-number">Table #${tableNumber}</h2>
        </div>
        <div class="card-body">
            <ol class="items-list">${itemsHTML}</ol>
        </div>
        <div class="card-footer">
            <button class="complete-btn">COMPLETE</button>
        </div>
    `;

    card.querySelector('.complete-btn').onclick = () => showPaymentModal(tableNumber, total, doneItems);
    ordersGrid.appendChild(card);
}

window.showPaymentModal = function (tableNumber, total, orderItems) {
    currentTableToDelete = tableNumber;
    currentTotal = total;
    currentOrderData = orderItems;

    // Extract number: "TABLE 05" -> "5"
    const tableNum = tableNumber.replace(/[^\d]/g, '');
    modalMessage.innerHTML = `<strong>Table ${tableNum}</strong> final amount is <strong>₹${total}</strong>.<br>Please collect the payment.`;
    paymentModal.classList.add('show');
}

// Modal Actions
confirmBtn.addEventListener('click', async () => {
    if (!currentTableToDelete) return;
    try {
        await addDoc(collection(db, 'sales'), {
            tableNumber: currentTableToDelete,
            items: currentOrderData,
            totalAmount: currentTotal,
            completedAt: Timestamp.now(),
            date: new Date().toISOString()
        });
        await deleteDoc(doc(db, 'orders', currentTableToDelete));

        // Reset and Close
        paymentModal.classList.remove('show');
        currentTableToDelete = null;

        // Refresh chart if visible
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection && activeSection.id === 'sales-section') {
            const activeFilter = document.querySelector('.filter-btn.active');
            if (activeFilter) updateChart(activeFilter.dataset.range);
        }

    } catch (error) {
        console.error('Error completing order:', error);
        alert('Failed. Try again.');
    }
});

const closePaymentModal = () => { paymentModal.classList.remove('show'); currentTableToDelete = null; };
cancelBtn.addEventListener('click', closePaymentModal);
paymentModal.addEventListener('click', (e) => { if (e.target === paymentModal) closePaymentModal(); });


// --- SALES ANALYTICS LOGIC ---

const weekFilterBtn = document.getElementById('weekFilterBtn');
const monthFilter = document.getElementById('monthFilter');
const yearFilter = document.getElementById('yearFilter');

function initSalesChart() {
    populateFilters();

    // Event: Click Week
    if (weekFilterBtn) {
        weekFilterBtn.addEventListener('click', () => {
            setActiveFilter('week');
            updateChart('week');
        });
    }

    // Event: Select Month
    if (monthFilter) {
        monthFilter.addEventListener('change', () => {
            if (monthFilter.value !== "") {
                setActiveFilter('month');
                // Ensure year is selected, defaulting to current if not
                if (!yearFilter.value) {
                    yearFilter.value = new Date().getFullYear();
                }
                const year = parseInt(yearFilter.value);
                const month = parseInt(monthFilter.value);
                updateChart('month_specific', { year, month });
            }
        });
    }

    // Event: Select Year
    if (yearFilter) {
        yearFilter.addEventListener('change', () => {
            if (yearFilter.value) {
                // If a month is currently selected, stay in 'month' mode but update year
                // Otherwise switch to 'year' mode (monthly stats for that year)
                if (monthFilter.value !== "" && monthFilter.classList.contains('active-context')) {
                    // This 'active-context' check is a bit complex, strictly:
                    // If the user explicitly clicked Month before, they want Month view.
                    // But usually changing Year implies "Show me that Year".
                    // Let's implement: Changing year switches to Year View UNLESS we stick to the last active filter logic.
                    // Simpler: changing Year switches to Yearly View for that year, resetting month?
                    // OR: If Month is active, show that Month of the new Year. 

                    // Let's go with: Changing Year -> Show Yearly Stats (reset Month selection visual only or logical?)
                    // Implementation: If I select 2025, show me 2025 monthly stats. 
                    // If I then select January, show me Jan 2025.

                    setActiveFilter('year');
                    updateChart('year_specific', { year: parseInt(yearFilter.value) });
                } else {
                    // Update Month view if Month was active? 
                    // Let's simplify: Selecting Year always triggers Yearly View. 
                    // Selecting Month always triggers Monthly View (for selected Year).
                    setActiveFilter('year');
                    updateChart('year_specific', { year: parseInt(yearFilter.value) });
                }
            }
        });
    }

    // Default: Show Week
    updateChart('week');
}

function populateFilters() {
    const today = new Date();
    const currentYear = today.getFullYear();

    // 1. Populate Year Filter (Base Year 2024 to Current + 1)
    const baseYear = 2024;
    const endYear = currentYear + 1;

    yearFilter.innerHTML = '<option value="" disabled selected>Select Year</option>';
    for (let y = baseYear; y <= endYear; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = false; // Don't auto-select yet
        yearFilter.appendChild(option);
    }

    // 2. Populate Week/Month
    monthFilter.innerHTML = '<option value="" disabled selected>Select Month</option>';
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    months.forEach((m, index) => {
        const option = document.createElement('option');
        option.value = index; // 0 = Jan
        option.textContent = m;
        monthFilter.appendChild(option);
    });
}

function setActiveFilter(type) {
    // Reset UI states
    weekFilterBtn.classList.remove('active');
    monthFilter.classList.remove('active');
    yearFilter.classList.remove('active');

    // Helper class to track if month is intended
    monthFilter.classList.remove('active-context');

    if (type === 'week') {
        weekFilterBtn.classList.add('active');
        monthFilter.value = "";
        yearFilter.value = "";
    } else if (type === 'month') {
        monthFilter.classList.add('active');
        monthFilter.classList.add('active-context');
        yearFilter.classList.add('active');
    } else if (type === 'year') {
        yearFilter.classList.add('active');
        monthFilter.value = "";
    }
}

async function updateChart(viewType, params = {}) {
    if (!salesChartCanvas) return;

    let q;
    let startDate, endDate;
    let labelFormat = 'daily';
    let chartLabel = 'Sales';

    const now = new Date();

    if (viewType === 'week') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);

        q = query(collection(db, 'sales'), where('completedAt', '>=', Timestamp.fromDate(startDate)));
        labelFormat = 'week_daily';
        chartLabel = 'Daily Sales (Last 7 Days)';
    }
    else if (viewType === 'month_specific') {
        const y = params.year;
        const m = params.month;

        startDate = new Date(y, m, 1);
        endDate = new Date(y, m + 1, 0, 23, 59, 59);

        q = query(collection(db, 'sales'),
            where('completedAt', '>=', Timestamp.fromDate(startDate)),
            where('completedAt', '<=', Timestamp.fromDate(endDate))
        );
        labelFormat = 'month_daily';
        const mName = new Date(y, m).toLocaleString('default', { month: 'long' });
        chartLabel = `Daily Sales - ${mName} ${y}`;
    }
    else if (viewType === 'year_specific') {
        const y = params.year;

        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31, 23, 59, 59);

        q = query(collection(db, 'sales'),
            where('completedAt', '>=', Timestamp.fromDate(startDate)),
            where('completedAt', '<=', Timestamp.fromDate(endDate))
        );
        labelFormat = 'monthly';
        chartLabel = `Monthly Sales - ${y}`;
    }

    try {
        const snapshot = await getDocs(q);
        const salesData = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            salesData.push({
                amount: d.totalAmount,
                date: d.completedAt.toDate()
            });
        });

        const chartData = processDataForChart(salesData, labelFormat, params, chartLabel);
        renderChart(chartData);

    } catch (err) {
        console.error("Chart Error:", err);
    }
}

function processDataForChart(salesData, format, params, chartLabel) {
    const map = new Map();
    salesData.sort((a, b) => a.date - b.date);

    if (format === 'week_daily') {
        salesData.forEach(s => {
            const label = s.date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
            map.set(label, (map.get(label) || 0) + s.amount);
        });
        // We use the data as exists
    }
    else if (format === 'month_daily') {
        // Prepare all days in month
        const daysInMonth = new Date(params.year, params.month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            map.set(i, 0);
        }

        salesData.forEach(s => {
            const d = s.date.getDate();
            map.set(d, (map.get(d) || 0) + s.amount);
        });
    }
    else if (format === 'monthly') {
        const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        monthsShort.forEach(m => map.set(m, 0));

        salesData.forEach(s => {
            const mLabel = s.date.toLocaleDateString('en-US', { month: 'short' });
            map.set(mLabel, (map.get(mLabel) || 0) + s.amount);
        });

        // Return strict order
        return {
            labels: monthsShort,
            data: monthsShort.map(m => map.get(m)),
            label: chartLabel
        };
    }

    // Default Map to Array
    const labels = [];
    const data = [];
    map.forEach((val, key) => {
        labels.push(key);
        data.push(val);
    });

    return { labels, data, label: chartLabel };
}

function renderChart({ labels, data, label }) {
    if (chartInstance) {
        chartInstance.destroy();
    }

    const ctx = salesChartCanvas.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: 'rgba(45, 122, 79, 0.7)',
                borderColor: 'rgba(45, 122, 79, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // Makes bars horizontal (stack vertically)
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { callback: (v) => '₹' + v }
                },
                y: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: true }, // Show dataset label as title
                tooltip: {
                    callbacks: { label: (c) => ` Sales: ₹${c.raw}` }
                }
            }
        }
    });
}
// --- HISTORY SECTION LOGIC ---
const historySection = document.getElementById('history-section');
const historyDateFilter = document.getElementById('historyDateFilter');
const historyGrid = document.getElementById('historyGrid');

function initHistoryListener() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    if (historyDateFilter) {
        historyDateFilter.value = today;
        historyDateFilter.addEventListener('change', () => {
            loadHistory(historyDateFilter.value);
        });
    }
}

async function loadHistory(dateStr) {
    if (!historyGrid) return;

    // Clear current grid
    historyGrid.innerHTML = '<div class="empty-state">Loading...</div>';

    try {
        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(dateStr);
        endOfDay.setHours(23, 59, 59, 999);

        const q = query(collection(db, 'sales'),
            where('completedAt', '>=', Timestamp.fromDate(startOfDay)),
            where('completedAt', '<=', Timestamp.fromDate(endOfDay))
        );

        const snapshot = await getDocs(q);
        const historyData = [];

        snapshot.forEach(docSnap => {
            historyData.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        // Sort by time descending (newest first)
        historyData.sort((a, b) => b.completedAt.seconds - a.completedAt.seconds);

        renderHistoryGrid(historyData);

    } catch (error) {
        console.error("Error loading history:", error);
        historyGrid.innerHTML = '<div class="empty-state">Error loading history.</div>';
    }
}

function renderHistoryGrid(historyData) {
    historyGrid.innerHTML = '';

    if (historyData.length === 0) {
        historyGrid.innerHTML = '<div class="empty-state">No transactions found for this date.</div>';
        return;
    }

    historyData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-card'; // Use specific class or reuse order-card if similar styles applied

        const timeString = item.completedAt ? new Date(item.completedAt.seconds * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
        }) : 'N/A';

        let itemsHTML = '';
        if (item.items) {
            for (const [key, detail] of Object.entries(item.items)) {
                itemsHTML += `<li>${detail.name} × ${detail.qty}</li>`;
            }
        }

        // Handle case where tableNumber string might be just a digit
        const tableDisplay = item.tableNumber.includes('TABLE') ? item.tableNumber : `Table #${item.tableNumber}`;

        card.innerHTML = `
            <div class="card-header">
                <span class="timestamp">${timeString}</span>
                <h2 class="table-number">${tableDisplay}</h2>
            </div>
            <div class="card-body">
                <ol class="items-list">${itemsHTML}</ol>
            </div>
            <div class="card-footer">
                <span>Total Amount:</span>
                <span class="history-total">₹${item.totalAmount}</span>
            </div>
        `;
        historyGrid.appendChild(card);
    });
}
