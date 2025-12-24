// Import Firebase configuration
import { db } from './firebase-config.js';
import { collection, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Check if user is logged in
if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'index.html';
}

// Get orders grid container and modal elements
const ordersGrid = document.querySelector('.orders-grid');
const paymentModal = document.getElementById('paymentModal');
const modalMessage = document.getElementById('modalMessage');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');

let currentTableToDelete = null;
let currentTotal = 0;

// Listen to orders collection in real-time
onSnapshot(collection(db, 'orders'), (snapshot) => {
    // Clear existing cards
    ordersGrid.innerHTML = '';
    
    // Array to store orders with timestamps for sorting
    const ordersArray = [];
    
    snapshot.forEach((docSnap) => {
        const tableNumber = docSnap.id;
        const orderData = docSnap.data();
        
        // Only process if 'done' field exists and has items
        if (orderData.done && Object.keys(orderData.done).length > 0) {
            ordersArray.push({
                tableNumber,
                orderData,
                timestamp: orderData.createdAt || null
            });
        }
    });
    
    // Sort by timestamp (oldest first)
    ordersArray.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return a.timestamp.seconds - b.timestamp.seconds;
    });
    
    // Render cards
    ordersArray.forEach(({ tableNumber, orderData, timestamp }) => {
        renderOrderCard(tableNumber, orderData.done, timestamp);
    });
    
    // If no orders, show message
    if (ordersArray.length === 0) {
        ordersGrid.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.2rem; grid-column: 1/-1; padding: 3rem;">No orders ready for payment</p>';
    }
});

// Render individual order card
function renderOrderCard(tableNumber, doneItems, timestamp) {
    // Create card element
    const card = document.createElement('div');
    card.className = 'order-card';
    card.dataset.table = tableNumber;
    
    // Format timestamp
    let timeString = 'Now';
    if (timestamp && timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000);
        timeString = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }
    
    // Calculate total and create items list HTML
    let itemsHTML = '';
    let total = 0;
    
    for (const [itemKey, itemData] of Object.entries(doneItems)) {
        itemsHTML += `<li>${itemData.name} × ${itemData.qty}</li>`;
        // Add to total (use itemTotal if available, otherwise calculate)
        total += itemData.total || (itemData.price * itemData.qty) || 0;
    }
    
    // Build card HTML
    card.innerHTML = `
        <div class="card-header">
            <span class="timestamp">${timeString}</span>
            <h2 class="table-number">${tableNumber}</h2>
        </div>
        <div class="card-body">
            <ol class="items-list">
                ${itemsHTML}
            </ol>
        </div>
        <div class="card-footer">
            <button class="complete-btn" onclick="showPaymentModal('${tableNumber}', ${total})">COMPLETE</button>
        </div>
    `;
    
    ordersGrid.appendChild(card);
}

// Show payment modal
window.showPaymentModal = function(tableNumber, total) {
    currentTableToDelete = tableNumber;
    currentTotal = total;
    
    // Extract just the number from table name (e.g., "TABLE 05" -> "5")
    const tableNum = tableNumber.replace(/[^\d]/g, '');
    
    modalMessage.innerHTML = `
        <strong>Table ${tableNum}</strong> final amount is <strong>₹${total}</strong>.<br>
        Please collect the payment.
    `;
    
    paymentModal.classList.add('show');
};

// Confirm payment and delete order
confirmBtn.addEventListener('click', async function() {
    if (!currentTableToDelete) return;
    
    try {
        // Delete the entire table document from Firestore
        await deleteDoc(doc(db, 'orders', currentTableToDelete));
        
        // Close modal
        paymentModal.classList.remove('show');
        
        // Reset current values
        currentTableToDelete = null;
        currentTotal = 0;
        
    } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to complete order. Please try again.');
    }
});

// Cancel payment modal
cancelBtn.addEventListener('click', function() {
    paymentModal.classList.remove('show');
    currentTableToDelete = null;
    currentTotal = 0;
});

// Close modal when clicking outside
paymentModal.addEventListener('click', function(e) {
    if (e.target === paymentModal) {
        paymentModal.classList.remove('show');
        currentTableToDelete = null;
        currentTotal = 0;
    }
});

// Logout functionality
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        });
    }
});
