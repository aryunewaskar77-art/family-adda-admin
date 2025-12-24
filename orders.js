// Import Firebase configuration
import { db } from './firebase-config.js';
import { collection, onSnapshot, doc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Check if user is logged in
if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'index.html';
}

// Get orders grid container
const ordersGrid = document.querySelector('.orders-grid');

// Listen to orders collection in real-time
onSnapshot(collection(db, 'orders'), (snapshot) => {
    // Clear existing cards
    ordersGrid.innerHTML = '';
    
    // Array to store orders with timestamps for sorting
    const ordersArray = [];
    
    snapshot.forEach((docSnap) => {
        const tableNumber = docSnap.id;
        const orderData = docSnap.data();
        
        // Only process if 'preparing' field exists and has items
        if (orderData.preparing && Object.keys(orderData.preparing).length > 0) {
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
        renderOrderCard(tableNumber, orderData.preparing, timestamp);
    });
    
    // If no orders, show message
    if (ordersArray.length === 0) {
        ordersGrid.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.2rem; grid-column: 1/-1; padding: 3rem;">No pending orders</p>';
    }
});

// Render individual order card
function renderOrderCard(tableNumber, preparingItems, timestamp) {
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
    
    // Create items list HTML
    let itemsHTML = '';
    let itemIndex = 1;
    for (const [itemKey, itemData] of Object.entries(preparingItems)) {
        itemsHTML += `<li>${itemData.name} × ${itemData.qty}</li>`;
        itemIndex++;
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
            <button class="prepared-btn" onclick="markAsPrepared('${tableNumber}')">PREPARED</button>
        </div>
    `;
    
    ordersGrid.appendChild(card);
}

// Mark order as prepared (move from preparing to done)
window.markAsPrepared = async function(tableNumber) {
    try {
        const orderRef = doc(db, 'orders', tableNumber);
        
        // Get current order data
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) return;
        
        const orderData = orderSnap.data();
        const preparingItems = orderData.preparing || {};
        
        // Prepare update object
        const updates = {
            preparing: deleteField() // Remove preparing field
        };
        
        // If done doesn't exist, create it; otherwise merge with existing
        if (orderData.done) {
            // Merge with existing done items
            updates.done = { ...orderData.done, ...preparingItems };
        } else {
            // Create new done field
            updates.done = preparingItems;
        }
        
        // Update Firestore
        await updateDoc(orderRef, updates);
        
        // Add fade-out animation to card
        const card = document.querySelector(`[data-table="${tableNumber}"]`);
        if (card) {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
        }
        
    } catch (error) {
        console.error('Error marking order as prepared:', error);
        alert('Failed to update order. Please try again.');
    }
};

// Import getDoc for reading document
import { getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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
