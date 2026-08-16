const exceptionForm = document.querySelector('#exception-form');
const tableBody = document.querySelector('#table-body');
const typeFilter = document.querySelector('#filter-type');
const statusFilter = document.querySelector('#filter-status');
const openIssueCount = document.querySelector('#open-count');
const resolvedIssueCount = document.querySelector('#resolved-count');
const emptyState = document.querySelector('#empty-state');

const ticketModal = document.getElementById('ticket-modal');
const closeModalButton = document.getElementById('close-modal');

const toast = document.getElementById('toast-popup');
const toastText = document.getElementById('toast-message');
let toastTimer;

function showToast(message, type = 'success') {
    toastText.textContent = message;

    toast.className = 'toast-popup';
    toast.classList.add(`toast-${type}`);
    toast.classList.add('show');

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function createBadge(type, value) {
    return `<span class="badge badge-${value}">${value}</span>`;
}

function updateEmptyState() {
    const issueRows = tableBody.querySelectorAll('tr.data-row');
    let visibleRows = 0;

    issueRows.forEach(row => {
        if (row.style.display !== 'none') {
            visibleRows++;
        }
    });

    if (visibleRows === 0) {
        emptyState.style.display = '';
    } else {
        emptyState.style.display = 'none';
    }
}

function updateIssueCounts() {
    let openIssues = 0;
    let resolvedIssues = 0;

    const issueRows = tableBody.querySelectorAll('tr.data-row');

    issueRows.forEach(row => {
        const currentStatus = row.dataset.status;

        if (currentStatus === 'Open') {
            openIssues++;
        }

        if (currentStatus === 'Resolved') {
            resolvedIssues++;
        }
    });

    openIssueCount.textContent = openIssues;
    resolvedIssueCount.textContent = resolvedIssues;
}

function filterIssues() {
    const chosenType = typeFilter.value;
    const chosenStatus = statusFilter.value;

    const issueRows = tableBody.querySelectorAll('tr.data-row');

    issueRows.forEach(row => {
        const issueType = row.dataset.type;
        const issueStatus = row.dataset.status;

        const matchesType =
            chosenType === 'All' || chosenType === issueType;

        const matchesStatus =
            chosenStatus === 'All' || chosenStatus === issueStatus;

        if (matchesType && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    updateEmptyState();
}

exceptionForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const deliveryId = document.querySelector('#delivery-id').value.trim().toUpperCase();
    const customerName = document.querySelector('#customer-name').value.trim();
    const issueType = document.querySelector('#issue-type').value;
    const priority = document.querySelector('input[name="priority"]:checked').value;
    const notes = document.querySelector('#notes').value.trim();

    const deliveryIdPattern = /^DEL-\d+$/;

    if (!deliveryIdPattern.test(deliveryId)) {
        alert('Delivery ID must exactly match the format: DEL- followed by numbers (e.g., DEL-1237)');
        return;
    }

    if (!deliveryId || !customerName || !issueType || !priority) {
        alert('Please fill in all required fields.');
        return;
    }

    const issueRow = document.createElement('tr');
    issueRow.classList.add('data-row');

    issueRow.dataset.deliveryId = deliveryId;
    issueRow.dataset.customerName = customerName;
    issueRow.dataset.type = issueType;
    issueRow.dataset.priority = priority;
    issueRow.dataset.status = 'Open';
    issueRow.dataset.notes = notes || 'No additional notes provided.';

    issueRow.innerHTML = `
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

    tableBody.appendChild(issueRow);

    exceptionForm.reset();
    filterIssues();
    updateIssueCounts();

    showToast('Exception submitted successfully!', 'success');
});

tableBody.addEventListener('click', function (event) {
    const clickedElement = event.target;

    if (clickedElement.classList.contains('btn-view')) {
        const issueRow = clickedElement.closest('tr');

        document.getElementById('modal-id').textContent = issueRow.dataset.deliveryId;
        document.getElementById('modal-name').textContent = issueRow.dataset.customerName;
        document.getElementById('modal-type').textContent = issueRow.dataset.type;
        document.getElementById('modal-priority').innerHTML =
            createBadge('priority', issueRow.dataset.priority);
        document.getElementById('modal-status').innerHTML =
            createBadge('status', issueRow.dataset.status);
        document.getElementById('modal-notes').textContent =
            issueRow.dataset.notes;

        ticketModal.style.display = 'flex';
    }

    if (clickedElement.classList.contains('btn-resolve')) {
        const issueRow = clickedElement.closest('tr');
        const statusCell = issueRow.querySelector('.status-cell');

        issueRow.dataset.status = 'Resolved';
        statusCell.innerHTML = createBadge('status', 'Resolved');
        issueRow.classList.add('resolved-row');

        clickedElement.disabled = true;

        filterIssues();
        updateIssueCounts();

        showToast('Issue marked as resolved!', 'success');
    }

    if (clickedElement.classList.contains('btn-delete')) {
        const shouldDelete = confirm(
            'Are you sure you want to delete this record? This action cannot be undone.'
        );

        if (shouldDelete) {
            const issueRow = clickedElement.closest('tr');
            issueRow.remove();

            filterIssues();
            updateIssueCounts();

            showToast('Record deleted successfully.', 'danger');
        }
    }
});

closeModalButton.addEventListener('click', () => {
    ticketModal.style.display = 'none';
});

ticketModal.addEventListener('click', (event) => {
    if (event.target === ticketModal) {
        ticketModal.style.display = 'none';
    }
});

typeFilter.addEventListener('change', filterIssues);
statusFilter.addEventListener('change', filterIssues);

updateEmptyState();