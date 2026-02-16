// Import Firebase configuration
import { db } from './firebase-config.js';
import { collection, onSnapshot, doc, deleteDoc, addDoc, updateDoc, setDoc, query, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Check login status
if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'index.html?role=admin';
}

// --- DOM ELEMENTS ---
// Navigation
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');
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
const weekFilterBtn = document.getElementById('weekFilterBtn');
const monthFilter = document.getElementById('monthFilter');
const yearFilter = document.getElementById('yearFilter');
const salesChartCanvas = document.getElementById('salesChart');

// Menu Section
const menuItemsList = document.getElementById('menuItemsList');
const addMenuItemBtn = document.getElementById('addMenuItemBtn');
const menuModal = document.getElementById('menuModal');
const menuForm = document.getElementById('menuForm');
const saveMenuItemBtn = document.getElementById('saveMenuItemBtn');
const cancelMenuBtn = document.getElementById('cancelMenuBtn');
const menuModalTitle = document.getElementById('menuModalTitle');
const menuItemIdInput = document.getElementById('menuItemId');
const itemNameInput = document.getElementById('itemName');
const itemPriceInput = document.getElementById('itemPrice');

const itemCategoryInput = document.getElementById('itemCategory');
const menuSearchInput = document.getElementById('menuSearchInput');

let allMenuItems = []; // Store all menu items for searching

const INITIAL_MENU_DATA = [
    { "category": "Beverages", "items": [{ "name": "Hot Coffee", "price": 50 }, { "name": "Hot Coffee with Ginger", "price": 60 }, { "name": "Hot Chocolate", "price": 70 }, { "name": "Cold Coffee", "price": 140 }, { "name": "Cold Coffee with Ice Cream", "price": 160 }, { "name": "Kit Kat Shake", "price": 180 }, { "name": "Oreo Shake", "price": 180 }, { "name": "Butter Milk", "price": 30 }, { "name": "Fresh Lime Water", "price": 30 }, { "name": "Fresh Lime Soda", "price": 40 }, { "name": "Water Bottle", "price": 0 }] },
    { "category": "Crispy Dosa", "items": [{ "name": "Masala Dosa", "price": 130 }, { "name": "Sada Dosa", "price": 100 }, { "name": "Mysore Masala Dosa", "price": 150 }, { "name": "Mysore Sada Dosa", "price": 120 }, { "name": "Paneer Masala Dosa", "price": 160 }, { "name": "Paneer Punjabi Dosa", "price": 170 }, { "name": "Cheese Masala Dosa", "price": 170 }, { "name": "Cheese Sada Dosa", "price": 150 }, { "name": "Rawa Masala Dosa", "price": 160 }, { "name": "Rawa Onion Dosa", "price": 150 }, { "name": "Rawa Onion Masala Dosa", "price": 170 }, { "name": "Spring Masala Dosa", "price": 160 }, { "name": "Paper Masala Dosa", "price": 180 }, { "name": "Paper Sada Dosa", "price": 160 }] },
    { "category": "Spongy Idli", "items": [{ "name": "Idli Sambar", "price": 90 }, { "name": "Masala Idli", "price": 130 }, { "name": "Fried Idli", "price": 110 }, { "name": "Vada Sambar", "price": 140 }, { "name": "Idli / Vada Combo", "price": 120 }] },
    { "category": "Fluffy Uthappam", "items": [{ "name": "Jeera Uthappam", "price": 120 }, { "name": "Onion Uthappam", "price": 140 }, { "name": "Tomato Uthappam", "price": 140 }, { "name": "Garlic Uthappam", "price": 140 }, { "name": "Jain Uthappam", "price": 160 }, { "name": "Mix Uthappam", "price": 160 }, { "name": "Masala Uthappam", "price": 160 }, { "name": "Paneer Uthappam", "price": 170 }, { "name": "Cheese Uthappam", "price": 170 }] },
    { "category": "Chatpati Pav Bhaji", "items": [{ "name": "Pav Bhaji", "price": 140 }, { "name": "Paneer Pav Bhaji", "price": 170 }, { "name": "Cheese Pav Bhaji", "price": 170 }, { "name": "Jain Pav Bhaji", "price": 170 }, { "name": "Extra Pav", "price": 20 }] },
    { "category": "Chole Bhature", "items": [{ "name": "Chole Bhature", "price": 150 }, { "name": "Extra Bhature", "price": 30 }] },
    { "category": "Noodles", "items": [{ "name": "Veg Noodles / Veg Chowmein", "price": 180 }, { "name": "Veg. Hakka Noodles", "price": 180 }, { "name": "Chatpata Noodles", "price": 220 }, { "name": "Chilli Garlic Noodles", "price": 120 }, { "name": "Burnt Garlic Noodles", "price": 230 }, { "name": "Schezwan Noodles", "price": 230 }, { "name": "Smoky Noodles", "price": 220 }, { "name": "Noodles with Manchurian Balls", "price": 220 }, { "name": "American Chopsuey", "price": 270 }, { "name": "Noodles with Mushroom", "price": 270 }, { "name": "Malasiyan Noodles", "price": 280 }, { "name": "Singapori Noodles", "price": 280 }] },
    { "category": "Maggi", "items": [{ "name": "Simple Maggi", "price": 120 }, { "name": "Chilli Garlic Maggi", "price": 140 }, { "name": "Maggi in Punjabi Tadka", "price": 150 }, { "name": "Cheese Maggi", "price": 170 }, { "name": "Schezwan Maggi", "price": 160 }, { "name": "Manchurian Maggi", "price": 170 }] },
    { "category": "Chinese Rice", "items": [{ "name": "Veg Fried Rice", "price": 190 }, { "name": "Schezwan Fried Rice", "price": 220 }, { "name": "Rice with Manchurian Balls", "price": 230 }, { "name": "Burnt Garlic Rice", "price": 220 }, { "name": "Mix Fried Rice", "price": 270 }, { "name": "Mushroom Fried Rice", "price": 240 }, { "name": "Triple Schezwan Fried Rice", "price": 260 }, { "name": "Paneer Fried Rice", "price": 240 }] },
    { "category": "Fresh Soup", "items": [{ "name": "Veg. Clear Soup", "price": 140 }, { "name": "Tomato Soup", "price": 140 }, { "name": "Sweet Corn Soup", "price": 160 }, { "name": "Hot and Sour", "price": 160 }, { "name": "Manchow Soup", "price": 180 }, { "name": "Vegetables Noodles Soup", "price": 160 }, { "name": "Lemon Coriander", "price": 160 }, { "name": "Cream of Mushroom Soup", "price": 180 }, { "name": "Cream of Vegetable Soup", "price": 170 }] },
    { "category": "Salad", "items": [{ "name": "Onion Salad", "price": 60 }, { "name": "Green Salad", "price": 70 }, { "name": "Kachumber Salad", "price": 70 }] },
    { "category": "Starters", "items": [{ "name": "Papad Roasted", "price": 30 }, { "name": "Papad Fried", "price": 40 }, { "name": "Masala Papad Roasted", "price": 40 }, { "name": "Masala Papad Fried", "price": 50 }, { "name": "Peanut Chat", "price": 110 }, { "name": "Corn Chat", "price": 110 }, { "name": "Onion Pakoda", "price": 140 }, { "name": "Veg. Pakoda", "price": 140 }, { "name": "Paneer Pakoda", "price": 180 }, { "name": "Kalali Pakoda", "price": 180 }, { "name": "Finger Chips", "price": 130 }, { "name": "Peri Peri Finger Chips", "price": 150 }, { "name": "Crispy Honey Potato", "price": 170 }, { "name": "Chinese Bhel", "price": 170 }, { "name": "Crispy Veg.", "price": 190 }, { "name": "Crispy Corn", "price": 180 }, { "name": "Veg. Kothe", "price": 170 }, { "name": "Chilli Potato", "price": 190 }, { "name": "Soya Chilli", "price": 200 }, { "name": "Manchow Soup", "price": 180 }, { "name": "Veg. Lollipop", "price": 190 }, { "name": "Baby Corn Stir Fried", "price": 240 }, { "name": "Mix Bhel", "price": 270 }, { "name": "Paneer Black Pepper", "price": 270 }, { "name": "Crispy Chilli Baby Corn", "price": 270 }, { "name": "Mushroom Chilli", "price": 250 }, { "name": "Mushroom Garlic", "price": 250 }, { "name": "Crispy Chilli Baby Corn", "price": 270 }, { "name": "Crispy Chilli Baby Corn", "price": 270 }, { "name": "Cheese Balls in Hot Garlic Sauce", "price": 280 }] },
    { "category": "Chinese Main Course", "items": [{ "name": "Veg. Manchurian", "price": 180 }, { "name": "Chilli Manchurian", "price": 190 }, { "name": "Paneer Manchurian", "price": 230 }, { "name": "Chilli Paneer", "price": 240 }, { "name": "Paneer in hot Garlic Sauce", "price": 260 }, { "name": "Paneer Schezwan", "price": 260 }, { "name": "Paneer Crispy", "price": 240 }, { "name": "Paneer 65", "price": 270 }, { "name": "Paneer Camlin", "price": 370 }, { "name": "Garlic Paneer", "price": 260 }, { "name": "Vegetable Sweet n Sour", "price": 250 }, { "name": "Chinese Platter", "price": 360 }] },
    { "category": "Rolls", "items": [{ "name": "Veg Spring Roll", "price": 170 }, { "name": "Spider Roll", "price": 170 }, { "name": "Paneer Mexican Roll", "price": 300 }] },
    { "category": "Momos (8 Pcs)", "items": [{ "name": "Steamed Momos", "price": 130 }, { "name": "Fried Momos", "price": 150 }, { "name": "Cheese Corn Momos", "price": 200 }, { "name": "Paneer Momos", "price": 180 }] },
    { "category": "Pasta", "items": [{ "name": "Macaroni Hot n Pot", "price": 220 }, { "name": "Macaroni in Red Sauce", "price": 260 }, { "name": "Pasta in White / Red Sauce", "price": 280 }, { "name": "Vegetable Pasta White Sauce", "price": 330 }, { "name": "Corn White Pasta", "price": 350 }, { "name": "Pasta Cheese Creamy Sauce", "price": 320 }, { "name": "Pink Pasta", "price": 300 }, { "name": "Mushroom Broccoli Pasta", "price": 350 }] },
    { "category": "Paneer Main Course", "items": [{ "name": "Butter Paneer Masala", "price": 250 }, { "name": "Mutter Paneer", "price": 220 }, { "name": "Kadhai Paneer", "price": 250 }, { "name": "Shahi Paneer", "price": 280 }] },
    { "category": "Veg Main Course", "items": [{ "name": "Aloo Jeera", "price": 140 }, { "name": "Aloo Gobhi", "price": 140 }, { "name": "Aloo Mutter", "price": 140 }, { "name": "Aloo Palak", "price": 140 }, { "name": "Lahsuni Palak", "price": 180 }, { "name": "Bhindi Masala", "price": 180 }, { "name": "Kadhai Veg", "price": 200 }, { "name": "Veg Kolhapuri", "price": 200 }, { "name": "Mix Veg", "price": 200 }, { "name": "Sev Tamatar", "price": 180 }, { "name": "Chana Masala", "price": 220 }, { "name": "Rajma Masala", "price": 220 }, { "name": "Methi Mutter Malai", "price": 280 }, { "name": "Kaju Curry", "price": 280 }, { "name": "Malai Kofta", "price": 280 }, { "name": "Navratna Korma", "price": 280 }] },
    { "category": "Dal", "items": [{ "name": "Butter Dal Fry", "price": 180 }, { "name": "Dal Fry", "price": 150 }, { "name": "Green Chilli Dal Fry", "price": 150 }, { "name": "Dal Tadka", "price": 170 }, { "name": "Dal Makhani", "price": 220 }] },
    { "category": "Rice", "items": [{ "name": "Steam Rice", "price": 130 }, { "name": "Jeera Rice", "price": 150 }, { "name": "Curd Rice", "price": 170 }, { "name": "Butter Khichdi", "price": 220 }, { "name": "Veg Pulao", "price": 150 }, { "name": "Paneer Pulao", "price": 170 }, { "name": "Cheese Pulao", "price": 170 }] },
    { "category": "Roti & Paratha", "items": [{ "name": "Tawa Roti", "price": 10 }, { "name": "Butter Roti", "price": 15 }, { "name": "Plain Paratha", "price": 25 }, { "name": "Butter Paratha", "price": 35 }, { "name": "Aloo / Methi / Pyaz Paratha", "price": 50 }, { "name": "Paneer Paratha", "price": 80 }] },
    { "category": "Raita", "items": [{ "name": "Plain Curd", "price": 80 }, { "name": "Boondi Raita", "price": 110 }, { "name": "Mix Veg Raita", "price": 130 }, { "name": "Pineapple Raita", "price": 150 }] },
    { "category": "Mini Meals", "items": [{ "name": "Rajma Chawal", "price": 140 }, { "name": "Chhole Chawal", "price": 140 }, { "name": "Dal Makhani + Jeera Rice", "price": 180 }, { "name": "Paneer Butter Masala + 2 Tawa Paratha", "price": 180 }, { "name": "Rice with Manchurian Gravy", "price": 290 }, { "name": "Rice with Chilli Paneer Gravy", "price": 310 }, { "name": "Veg Noodles with Manchurian Gravy", "price": 290 }, { "name": "Smoky Noodles with Chilli Paneer Gravy", "price": 330 }] },
    { "category": "Sweets", "items": [{ "name": "Rasgulla (2 Pieces)", "price": 55 }, { "name": "Gulab Jamun (2 Pieces)", "price": 55 }, { "name": "Shrikhand (100 gm)", "price": 55 }, { "name": "Moong Ka Halwa (100 gm)", "price": 65 }] },
    { "category": "Home Made Moong Ka Halwa", "items": [{ "name": "250 gm", "price": 160 }, { "name": "500 gm", "price": 320 }, { "name": "1 kg", "price": 640 }] },
    { "category": "Home Made Shrikhand", "items": [{ "name": "250 gm", "price": 135 }, { "name": "500 gm", "price": 270 }, { "name": "1 kg", "price": 540 }] }
];

// State
let currentTableToDelete = null;
let currentTotal = 0;
let currentOrderData = null;
let chartInstance = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initOrdersListener();
    initSalesChart();
    initHistoryListener();
    await seedMenu();
    initMenuListener();
});

async function seedMenu() {
    try {
        const snapshot = await getDocs(collection(db, 'menu'));
        if (snapshot.empty) {
            console.log('Seeding menu database...');
            const batch = [];
            for (const categoryData of INITIAL_MENU_DATA) {
                for (const item of categoryData.items) {
                    await addDoc(collection(db, 'menu'), {
                        name: item.name,
                        price: item.price,
                        category: categoryData.category,
                        createdAt: Timestamp.now()
                    });
                }
            }
            console.log('Menu seeded successfully.');
        }
    } catch (error) {
        console.error('Error seeding menu:', error);
    }
}

// --- NAVIGATION LOGIC ---
function initNavigation() {
    const toggleSidebar = () => sidebar.classList.toggle('open');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.dataset.section;

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            contentSections.forEach(sec => sec.classList.remove('active'));
            document.getElementById(`${sectionId}-section`).classList.add('active');

            pageTitle.textContent = item.innerText.trim();

            if (window.innerWidth <= 1024) sidebar.classList.remove('open');

            if (sectionId === 'sales') {
                const activeFilter = document.querySelector('.filter-btn.active');
                if (activeFilter) updateChart(activeFilter.dataset.range || 'week');
            }

            if (sectionId === 'history') {
                if (historyDateFilter && historyDateFilter.value) {
                    loadHistory(historyDateFilter.value);
                }
            }
        });
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
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

    const tableNum = tableNumber.replace(/[^\d]/g, '');
    modalMessage.innerHTML = `<strong>Table ${tableNum}</strong> final amount is <strong>₹${total}</strong>.<br>Please collect the payment.`;
    paymentModal.classList.add('show');
}

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
        paymentModal.classList.remove('show');
        currentTableToDelete = null;
    } catch (error) {
        console.error('Error completing order:', error);
        alert('Failed. Try again.');
    }
});

const closePaymentModal = () => { paymentModal.classList.remove('show'); currentTableToDelete = null; };
cancelBtn.addEventListener('click', closePaymentModal);
paymentModal.addEventListener('click', (e) => { if (e.target === paymentModal) closePaymentModal(); });

// --- MENU MANAGEMENT LOGIC ---
function initMenuListener() {
    onSnapshot(collection(db, 'menu'), (snapshot) => {
        allMenuItems = [];
        snapshot.forEach((docSnap) => {
            const item = docSnap.data();
            allMenuItems.push({ id: docSnap.id, ...item });
        });
        renderMenu(allMenuItems);
    });

    if (menuSearchInput) {
        menuSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredItems = allMenuItems.filter(item =>
                item.name.toLowerCase().includes(searchTerm) ||
                (item.category && item.category.toLowerCase().includes(searchTerm))
            );
            renderMenu(filteredItems);
        });
    }
}

function renderMenu(itemsToRender) {
    menuItemsList.innerHTML = '';
    if (itemsToRender.length === 0) {
        menuItemsList.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 2rem;">No items found.</td></tr>';
        return;
    }

    const itemsByCategory = {};
    itemsToRender.forEach(item => {
        const category = item.category || 'Other';
        if (!itemsByCategory[category]) itemsByCategory[category] = [];
        itemsByCategory[category].push(item);
    });

    // Sort categories alphabetically or by a predefined order if needed
    // For now, let's just sort the keys
    const sortedCategories = Object.keys(itemsByCategory).sort();

    sortedCategories.forEach(category => {
        const items = itemsByCategory[category];
        // Sort items by name within category
        items.sort((a, b) => a.name.localeCompare(b.name));

        // Category Header Row
        const folderRow = document.createElement('tr');
        folderRow.className = 'category-header-row';
        folderRow.innerHTML = `<td colspan="3" style="background-color: #f3f4f6; font-weight: bold; padding: 1rem;">${category}</td>`;
        menuItemsList.appendChild(folderRow);

        items.forEach(item => renderMenuItem(item));
    });
}

function renderMenuItem(item) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${item.name}</td>
        <td>₹${item.price}</td>
        <td>
            <div class="action-btns">
                <button class="edit-btn" onclick="editMenuItem('${item.id}', '${item.name}', ${item.price}, '${item.category}')">Edit</button>
                <button class="delete-btn" onclick="deleteMenuItem('${item.id}')">Delete</button>
            </div>
        </td>
    `;
    menuItemsList.appendChild(tr);
}

window.editMenuItem = (id, name, price, category) => {
    menuModalTitle.textContent = 'Edit Menu Item';
    menuItemIdInput.value = id;
    itemNameInput.value = name;
    itemPriceInput.value = price;
    if (category) itemCategoryInput.value = category;
    menuModal.classList.add('show');
};

window.deleteMenuItem = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            await deleteDoc(doc(db, 'menu', id));
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item.');
        }
    }
};

addMenuItemBtn.addEventListener('click', () => {
    menuModalTitle.textContent = 'Add New Item';
    menuForm.reset();
    menuItemIdInput.value = '';
    menuModal.classList.add('show');
});

saveMenuItemBtn.addEventListener('click', async () => {
    const id = menuItemIdInput.value;
    const name = itemNameInput.value.trim();
    const price = parseFloat(itemPriceInput.value);
    const category = itemCategoryInput.value;

    if (!name || isNaN(price)) {
        alert('Please enter valid name and price.');
        return;
    }

    try {
        if (id) {
            // Update
            await updateDoc(doc(db, 'menu', id), { name, price, category });
        } else {
            // Add
            await addDoc(collection(db, 'menu'), { name, price, category, createdAt: Timestamp.now() });
        }
        menuModal.classList.remove('show');
    } catch (error) {
        console.error('Error saving item:', error);
        alert('Failed to save item.');
    }
});

cancelMenuBtn.addEventListener('click', () => menuModal.classList.remove('show'));

// --- SALES ANALYTICS LOGIC ---
function initSalesChart() {
    populateFilters();
    if (weekFilterBtn) {
        weekFilterBtn.addEventListener('click', () => {
            setActiveFilter('week');
            updateChart('week');
        });
    }
    if (monthFilter) {
        monthFilter.addEventListener('change', () => {
            if (monthFilter.value !== "") {
                setActiveFilter('month');
                if (!yearFilter.value) yearFilter.value = new Date().getFullYear();
                updateChart('month_specific', { year: parseInt(yearFilter.value), month: parseInt(monthFilter.value) });
            }
        });
    }
    if (yearFilter) {
        yearFilter.addEventListener('change', () => {
            if (yearFilter.value) {
                setActiveFilter('year');
                updateChart('year_specific', { year: parseInt(yearFilter.value) });
            }
        });
    }
    updateChart('week');
}

function populateFilters() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const baseYear = 2024;
    const endYear = currentYear + 1;

    yearFilter.innerHTML = '<option value="" disabled selected>Select Year</option>';
    for (let y = baseYear; y <= endYear; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        yearFilter.appendChild(option);
    }

    monthFilter.innerHTML = '<option value="" disabled selected>Select Month</option>';
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    months.forEach((m, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = m;
        monthFilter.appendChild(option);
    });
}

function setActiveFilter(type) {
    weekFilterBtn.classList.remove('active');
    monthFilter.classList.remove('active');
    yearFilter.classList.remove('active');
    if (type === 'week') {
        weekFilterBtn.classList.add('active');
        monthFilter.value = "";
        yearFilter.value = "";
    } else if (type === 'month') {
        monthFilter.classList.add('active');
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
    } else if (viewType === 'month_specific') {
        const y = params.year;
        const m = params.month;
        startDate = new Date(y, m, 1);
        endDate = new Date(y, m + 1, 0, 23, 59, 59);
        q = query(collection(db, 'sales'), where('completedAt', '>=', Timestamp.fromDate(startDate)), where('completedAt', '<=', Timestamp.fromDate(endDate)));
        labelFormat = 'month_daily';
        const mName = new Date(y, m).toLocaleString('default', { month: 'long' });
        chartLabel = `Daily Sales - ${mName} ${y}`;
    } else if (viewType === 'year_specific') {
        const y = params.year;
        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31, 23, 59, 59);
        q = query(collection(db, 'sales'), where('completedAt', '>=', Timestamp.fromDate(startDate)), where('completedAt', '<=', Timestamp.fromDate(endDate)));
        labelFormat = 'monthly';
        chartLabel = `Monthly Sales - ${y}`;
    }

    try {
        const snapshot = await getDocs(q);
        const salesData = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            salesData.push({ amount: d.totalAmount, date: d.completedAt.toDate() });
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
    } else if (format === 'month_daily') {
        const daysInMonth = new Date(params.year, params.month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) map.set(i, 0);
        salesData.forEach(s => {
            const d = s.date.getDate();
            map.set(d, (map.get(d) || 0) + s.amount);
        });
    } else if (format === 'monthly') {
        const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        monthsShort.forEach(m => map.set(m, 0));
        salesData.forEach(s => {
            const mLabel = s.date.toLocaleDateString('en-US', { month: 'short' });
            map.set(mLabel, (map.get(mLabel) || 0) + s.amount);
        });
        return { labels: monthsShort, data: monthsShort.map(m => map.get(m)), label: chartLabel };
    }
    const labels = [];
    const data = [];
    map.forEach((val, key) => { labels.push(key); data.push(val); });
    return { labels, data, label: chartLabel };
}

function renderChart({ labels, data, label }) {
    if (chartInstance) chartInstance.destroy();
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
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true, ticks: { callback: (v) => '₹' + v } },
                y: { grid: { display: false } }
            },
            plugins: {
                legend: { display: true },
                tooltip: { callbacks: { label: (c) => ` Sales: ₹${c.raw}` } }
            }
        }
    });
}

// --- HISTORY SECTION LOGIC ---
const historyDateFilter = document.getElementById('historyDateFilter');
const historyGrid = document.getElementById('historyGrid');

function initHistoryListener() {
    const today = new Date().toISOString().split('T')[0];
    if (historyDateFilter) {
        historyDateFilter.value = today;
        historyDateFilter.addEventListener('change', () => loadHistory(historyDateFilter.value));
    }
}

async function loadHistory(dateStr) {
    if (!historyGrid) return;
    historyGrid.innerHTML = '<div class="empty-state">Loading...</div>';
    try {
        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateStr);
        endOfDay.setHours(23, 59, 59, 999);
        const q = query(collection(db, 'sales'), where('completedAt', '>=', Timestamp.fromDate(startOfDay)), where('completedAt', '<=', Timestamp.fromDate(endOfDay)));
        const snapshot = await getDocs(q);
        const historyData = [];
        snapshot.forEach(docSnap => { historyData.push({ id: docSnap.id, ...docSnap.data() }); });
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
        card.className = 'history-card';
        const timeString = item.completedAt ? new Date(item.completedAt.seconds * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
        let itemsHTML = '';
        if (item.items) {
            for (const [key, detail] of Object.entries(item.items)) {
                itemsHTML += `<li>${detail.name} × ${detail.qty}</li>`;
            }
        }
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
