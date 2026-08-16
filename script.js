// DOM Elements
const form = document.querySelector('#exception-form');
const tableBody = document.querySelector('#table-body');
const filterType = document.querySelector('#filter-type');
const filterStatus = document.querySelector('#filter-status');
const openCountEl = document.querySelector('#open-count');
const resolvedCountEl = document.querySelector('#resolved-count');
const emptyStateRow = document.querySelector('#empty-state');

// Modal Elements
const modal = document.getElementById('ticket-modal');
const closeModalBtn = document.getElementById('close-modal');

// Toast Popup Elements
const toastPopup = document.getElementById('toast-popup');
const toastMessage = document.getElementById('toast-message');
let toastTimeout; // Variable to store timeout so we can reset it

// Dynamic Function to Show Toast
function showToast(message, type = 'success') {
    // Update text
    toastMessage.textContent = message;
    
    // Reset classes and apply the correct color type
    toastPopup.className = 'toast-popup'; 
    toastPopup.classList.add(`toast-${type}`);
    
    // Show the popup
    toastPopup.classList.add('show');
    
    // Clear existing timeout if the user clicks multiple actions fast
    if (toastTimeout) clearTimeout(toastTimeout);
    
    // Hide toast automatically after 3 seconds
    toastTimeout = setTimeout(() => {
        toastPopup.classList.remove('show');
    }, 3000);
}

// Generate Badge HTML string based on type/value
function createBadge(type, value) {
    return `<span class="badge badge-${value}">${value}</span>`;
}

// Check Empty State
function checkEmptyState() {
    const rows = tableBody.querySelectorAll('tr.data-row');
    let visibleCount = 0;

    rows.forEach(row => {
        if (row.style.display !== 'none') {
            visibleCount++;
        }
    });

    if (visibleCount === 0) {
        emptyStateRow.style.display = '';
    } else {
        emptyStateRow.style.display = 'none';
    }
}

// Update Counters
function updateCounters() {
    let open = 0;
    let resolved = 0;
    
    const rows = tableBody.querySelectorAll('tr.data-row');
    rows.forEach(row => {
        const status = row.dataset.status;
        if (status === 'Open') open++;
        if (status === 'Resolved') resolved++;
    });

    openCountEl.textContent = open;
    resolvedCountEl.textContent = resolved;
}

// Apply Filters
function applyFilters() {
    const selectedType = filterType.value;
    const selectedStatus = filterStatus.value;
    
    const rows = tableBody.querySelectorAll('tr.data-row');
    
    rows.forEach(row => {
        const typeValue = row.dataset.type;
        const statusValue = row.dataset.status;
        
        let typeMatch = (selectedType === 'All' || selectedType === typeValue);
        let statusMatch = (selectedStatus === 'All' || selectedStatus === statusValue);
        
        if (typeMatch && statusMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    checkEmptyState();
}

// Form Submission Event
form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Read form values and force uppercase on ID
    const deliveryId = document.querySelector('#delivery-id').value.trim().toUpperCase(); 
    const customerName = document.querySelector('#customer-name').value.trim();
    const issueType = document.querySelector('#issue-type').value;
    const priority = document.querySelector('input[name="priority"]:checked').value;
    const notes = document.querySelector('#notes').value.trim();
    
    // Custom JS Regex check to ensure format is strictly DEL-[numbers] (Secondary Validation)
    const idRegex = /^DEL-\d+$/;
    if (!idRegex.test(deliveryId)) {
        alert("Delivery ID must exactly match the format: DEL- followed by numbers (e.g., DEL-1237)");
        return;
    }

    if (!deliveryId || !customerName || !issueType || !priority) {
        alert("Please fill in all required fields.");
        return;
    }

    // Create a new table row
    const tr = document.createElement('tr');
    tr.classList.add('data-row');
    
    // Store all data as HTML dataset attributes (used for filtering AND the View Modal)
    tr.dataset.deliveryId = deliveryId;
    tr.dataset.customerName = customerName;
    tr.dataset.type = issueType;
    tr.dataset.priority = priority;
    tr.dataset.status = 'Open';
    tr.dataset.notes = notes || "No additional notes provided.";

    // Build Row HTML mapped with badges and action buttons
    tr.innerHTML = `
        <td><strong>${deliveryId}</strong></td>
        <td>${customerName}</td>
        <td>${issueType}</td>
        <td>${createBadge('priority', priority)}</td>
        <td class="status-cell">${createBadge('status', 'Open')}</td>
        <td style="white-space: nowrap;">
            <button class="btn-view">View</button>
            <button class="btn-resolve">Resolve</button>
            <button class="btn-delete">Delete</button>
        </td>
    `;

    // Append to body
    tableBody.appendChild(tr);
    
    // Reset Form, re-apply filters, update counters, and show Success Popup
    form.reset();
    applyFilters();
    updateCounters();
    
    // Call the new dynamic toast
    showToast('Exception submitted successfully!', 'success');
});

// Event Delegation for Table Row Actions (View, Resolve, Delete)
tableBody.addEventListener('click', function(e) {
    const target = e.target;
    
    // View Action (Opens Modal)
    if (target.classList.contains('btn-view')) {
        const row = target.closest('tr');
        
        // Populate Modal Fields using the stored dataset on the row
        document.getElementById('modal-id').textContent = row.dataset.deliveryId;
        document.getElementById('modal-name').textContent = row.dataset.customerName;
        document.getElementById('modal-type').textContent = row.dataset.type;
        document.getElementById('modal-priority').innerHTML = createBadge('priority', row.dataset.priority);
        document.getElementById('modal-status').innerHTML = createBadge('status', row.dataset.status);
        document.getElementById('modal-notes').textContent = row.dataset.notes;

        // Show Modal
        modal.style.display = 'flex';
    }

    // Resolve Action
    if (target.classList.contains('btn-resolve')) {
        const row = target.closest('tr');
        const statusCell = row.querySelector('.status-cell');
        
        row.dataset.status = 'Resolved';
        statusCell.innerHTML = createBadge('status', 'Resolved');
        row.classList.add('resolved-row');
        
        target.disabled = true; // Disable Resolve button
        
        applyFilters();
        updateCounters();
        
        // Add resolve toast!
        showToast('Issue marked as resolved!', 'success');
    }
    
    // Delete Action
    if (target.classList.contains('btn-delete')) {
        const confirmDelete = confirm("Are you sure you want to delete this record? This action cannot be undone.");
        if (confirmDelete) {
            const row = target.closest('tr');
            row.remove();
            
            applyFilters();
            updateCounters();
            
            // Add delete toast!
            showToast('Record deleted successfully.', 'danger');
        }
    }
});

// Modal Close Handlers
closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
modal.addEventListener('click', (e) => {
    // Close modal if user clicks outside the modal content box
    if (e.target === modal) modal.style.display = 'none';
});

// Attach Filter Events
filterType.addEventListener('change', applyFilters);
filterStatus.addEventListener('change', applyFilters);

// Initialize Empty State check on load
checkEmptyState();