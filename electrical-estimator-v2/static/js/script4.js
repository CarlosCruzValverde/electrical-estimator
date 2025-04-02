// Add event listener to the form
document.getElementById('laborCostForm').addEventListener('submit', function (event) {
    event.preventDefault();

    if (!validateLaborFields()) return;

    const formData = calculateLaborTotals();
    if (formData) submitLaborFormData(formData);
});

// Main calculation function (updated)
function calculateLaborTotals() {
    let laborTotal = 0;
    let hasLaborData = false;
    const laborData = [];

    // Calculate labor costs for all positions
    for (let i = 1; i <= 7; i++) {
        const rate = parseFloat(document.getElementById(`position-${i}-rate`).value) || 0;
        const workers = parseInt(document.getElementById(`position-${i}-workers`).value) || 0;
        const hours = parseFloat(document.getElementById(`position-${i}-hours`).value) || 0;
        const days = parseFloat(document.getElementById(`position-${i}-days`).value) || 0;
        const subtotal = rate * workers * hours * days;

        // Update position subtotal display
        document.getElementById(`position-${i}-subtotal`).textContent =
            `Subtotal: $${subtotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;

        laborTotal += subtotal;
        if (subtotal > 0) hasLaborData = true;

        laborData.push({
            position: document.querySelector(`label[for="position-${i}"]`).textContent.trim(),
            rate, workers, hours, days, subtotal
        });
    }

    // Validate labor data
    if (!hasLaborData) {
        showError('Please fill out at least one labor position field.');
        return null;
    }

    // Calculate low voltage costs
    const chargersCount = parseInt(document.getElementById('chargers-count').value) || 0;
    const chargerPrice = parseFloat(document.getElementById('charger-price').value) || 0;
    const lowVoltageTotal = chargersCount * chargerPrice;
    const hasLowVoltageData = lowVoltageTotal > 0;

    // Update all displays
    updateDisplays(laborTotal, lowVoltageTotal);

    // Validate low voltage data
    if (!hasLowVoltageData) {
        showError('Please fill out low voltage fields.');
        return null;
    }

    // Return form data
    return {
        project_id: new URLSearchParams(window.location.search).get('project_id'),
        laborData,
        lowVoltageData: { chargersCount, chargerPrice, subtotal: lowVoltageTotal },
        laborTotal,
        lowVoltageTotal,
        grandTotal: laborTotal + lowVoltageTotal
    };
}

// Update all displays (new helper function)
function updateDisplays(laborTotal, lowVoltageTotal) {
    // Labor section
    document.getElementById('labor-total').textContent = `$${laborTotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;

    // Low Voltage section
    document.getElementById('low-voltage-subtotal').textContent = `$${lowVoltageTotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
    document.getElementById('low-voltage-total-display').textContent = `$${lowVoltageTotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;

    // Grand Total
    const grandTotal = laborTotal + lowVoltageTotal;
    document.getElementById('labor-grand-total').textContent = `$${grandTotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
}

// Validation function (updated)
function validateLaborFields() {
    let isValid = true;

    for (let i = 1; i <= 7; i++) {
        const rate = document.getElementById(`position-${i}-rate`).value;
        const workers = document.getElementById(`position-${i}-workers`).value;
        const hours = document.getElementById(`position-${i}-hours`).value;
        const days = document.getElementById(`position-${i}-days`).value;

        if ((rate || workers || hours || days) && (!rate || !workers || !hours || !days)) {
            isValid = false;
            const positionName = document.querySelector(`label[for="position-${i}"]`).textContent.trim();
            showError(`Please fill out all fields for ${positionName} or leave all empty.`);
        }
    }

    return isValid;
}

// Error display helper
function showError(message) {
    Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: message
    });
}

// Function to submit labor form data to Flask
function submitLaborFormData(formData) {
    fetch('/portfolio/estimate_labor_cost', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Labor estimation saved successfully!',
                }).then(() => {
                    // Redirect to the next tab or wherever appropriate
                    window.location.href = `/portfolio/save_summary?project_id=${formData.project_id}`;
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to save labor estimation.',
                });
            }
        })
        .catch(error => {
            console.error("Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while saving the labor estimation.',
            });
        });
}

// Real-time update function (updated)
function updateLaborTotals() {
    // Calculate totals without validation
    let laborTotal = 0;
    let lowVoltageTotal = 0;

    // Calculate labor costs
    for (let i = 1; i <= 7; i++) {
        const rate = parseFloat(document.getElementById(`position-${i}-rate`).value) || 0;
        const workers = parseInt(document.getElementById(`position-${i}-workers`).value) || 0;
        const hours = parseFloat(document.getElementById(`position-${i}-hours`).value) || 0;
        const days = parseFloat(document.getElementById(`position-${i}-days`).value) || 0;
        const subtotal = rate * workers * hours * days;

        document.getElementById(`position-${i}-subtotal`).textContent =
            `Subtotal: $${subtotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
        laborTotal += subtotal;
    }

    // Calculate low voltage
    const chargersCount = parseInt(document.getElementById('chargers-count').value) || 0;
    const chargerPrice = parseFloat(document.getElementById('charger-price').value) || 0;
    lowVoltageTotal = chargersCount * chargerPrice;

    // Update displays
    updateDisplays(laborTotal, lowVoltageTotal);
}

// Set up event listeners for real-time updates
function setupEventListeners() {
    // Labor fields
    for (let i = 1; i <= 7; i++) {
        document.getElementById(`position-${i}-rate`).addEventListener('input', updateLaborTotals);
        document.getElementById(`position-${i}-workers`).addEventListener('input', updateLaborTotals);
        document.getElementById(`position-${i}-hours`).addEventListener('input', updateLaborTotals);
        document.getElementById(`position-${i}-days`).addEventListener('input', updateLaborTotals);
    }

    // Low voltage fields
    document.getElementById('chargers-count').addEventListener('input', updateLaborTotals);
    document.getElementById('charger-price').addEventListener('input', updateLaborTotals);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    updateLaborTotals(); // Initial calculation
});