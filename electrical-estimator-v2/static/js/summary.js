document.addEventListener('DOMContentLoaded', function () {
    // Load existing data from previous estimations
    loadEstimationData();

    // Set up event listeners
    setupEventListeners();
});

function loadEstimationData() {
    const projectId = document.getElementById('projectId').value;

    fetch(`/portfolio/get_estimation_data?project_id=${projectId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Populate base costs
                document.getElementById('awg-base-cost').textContent = `$${data.awg_total.toFixed(2)}`;
                document.getElementById('conduit-base-cost').textContent = `$${data.conduit_total.toFixed(2)}`;
                document.getElementById('misc-base-cost').textContent = `$${data.misc_total.toFixed(2)}`;
                document.getElementById('equipment-base-cost').textContent = `$${data.equipment_total.toFixed(2)}`;
                document.getElementById('labor-base-cost').textContent = `$${data.labor_total.toFixed(2)}`;
                document.getElementById('low-voltage-base-cost').textContent = `$${data.low_voltage_total.toFixed(2)}`;

                // Set charger count if available
                if (data.chargers_count) {
                    document.getElementById('chargers-count').textContent = data.chargers_count;
                }

                // Set approval radio buttons
                if (data.approved !== undefined) {
                    const radioId = data.approved ? 'approved-yes' : 'approved-no';
                    document.getElementById(radioId).checked = true;
                }

                // Set total submitted and approved amount if available
                if (data.total_submitted !== undefined) {
                    document.getElementById('total-submitted').value = data.total_submitted;
                }
                if (data.approved_amount !== undefined) {
                    document.getElementById('approved-amount').value = data.approved_amount;
                }

                // Calculate initial totals
                calculateAllTotals();
            }
        });
}

function setupEventListeners() {
    // Markup inputs
    document.querySelectorAll('.markup-input').forEach(input => {
        input.addEventListener('input', calculateAllTotals);
    });

    // Base cost inputs
    document.querySelectorAll('.base-input').forEach(input => {
        input.addEventListener('input', calculateAllTotals);
    });

    // Percentage inputs for tax and overhead
    document.getElementById('tax-percentage').addEventListener('input', calculateAllTotals);
    document.getElementById('overhead-percentage').addEventListener('input', calculateAllTotals);
}

function calculateAllTotals() {
    // Calculate each category
    calculateCategoryTotal('awg');
    calculateCategoryTotal('conduit');
    calculateCategoryTotal('misc');
    calculateCategoryTotal('equipment');
    calculateCategoryTotal('labor');
    calculateCategoryTotal('low-voltage');
    calculateCategoryTotal('permits');

    // Calculate Income Tax (30% of sum of profits from specific categories)
    calculateIncomeTax();

    // Calculate Overhead Margin (8.5% of grand subtotal of specific categories)
    calculateOverheadMargin();

    // Calculate grand totals
    calculateGrandTotals();

    // Calculate price per charger
    calculatePricePerCharger(grandTotal);
}

function calculateCategoryTotal(category) {
    const baseCostElement = document.getElementById(`${category}-base-cost`);
    const baseCost = parseFloat(baseCostElement.textContent.replace('$', '')) ||
        parseFloat(baseCostElement.value) || 0;
    const markup = parseFloat(document.getElementById(`${category}-markup`).value) || 1.0;

    const subtotal = baseCost * markup;
    const profit = subtotal - baseCost;

    document.getElementById(`${category}-subtotal`).textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById(`${category}-profit`).textContent = `$${profit.toFixed(2)}`;
}

function calculateIncomeTax() {
    const taxableCategories = ['awg', 'conduit', 'misc', 'equipment', 'labor', 'low-voltage', 'permits'];
    let totalProfit = 0;

    taxableCategories.forEach(category => {
        const profit = parseFloat(document.getElementById(`${category}-profit`).textContent.replace('$', '')) || 0;
        totalProfit += profit;
    });

    const taxPercentage = parseFloat(document.getElementById('tax-percentage').value) || 30;
    const incomeTax = totalProfit * (taxPercentage / 100);

    // Update percentage display
    document.getElementById('tax-percentage-display').textContent = taxPercentage;

    // Update tax fields
    document.getElementById('tax-base-cost').textContent = `$${totalProfit.toFixed(2)}`;
    document.getElementById('tax-base-cost1').textContent = `$${totalProfit.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
    document.getElementById('tax-subtotal').textContent = `$${incomeTax.toFixed(2)}`;
    //document.getElementById('tax-profit').textContent = `$${incomeTax.toFixed(2)}`;
    document.getElementById('tax-summary').textContent = `$${incomeTax.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
}


function calculateOverheadMargin() {
    const overheadCategories = ['awg', 'conduit', 'misc', 'equipment', 'labor', 'low-voltage', 'permits'];
    let grandSubtotal = 0;

    overheadCategories.forEach(category => {
        const subtotal = parseFloat(document.getElementById(`${category}-subtotal`).textContent.replace('$', '')) || 0;
        grandSubtotal += subtotal;
    });

    const overheadPercentage = parseFloat(document.getElementById('overhead-percentage').value) || 8.5;
    const overheadMargin = grandSubtotal * (overheadPercentage / 100);

    // Update percentage display
    document.getElementById('overhead-percentage-display').textContent = overheadPercentage;

    // Update overhead fields
    document.getElementById('overhead-base-cost').textContent = `$${grandSubtotal.toFixed(2)}`;
    document.getElementById('overhead-subtotal').textContent = `$${overheadMargin.toFixed(2)}`;
    //document.getElementById('overhead-profit').textContent = `$${overheadMargin.toFixed(2)}`;
    document.getElementById('overhead-summary').textContent = `$${overheadMargin.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
}

function calculateGrandTotals() {
    const categories = ['awg', 'conduit', 'misc', 'equipment', 'labor', 'low-voltage', 'permits', 'tax', 'overhead'];
    let grandSubtotal = 0;
    let grandTotal = 0;

    // Calculate grand subtotal (without tax and overhead)
    const mainCategories = ['awg', 'conduit', 'misc', 'equipment', 'labor', 'low-voltage', 'permits'];
    mainCategories.forEach(category => {
        const subtotal = parseFloat(document.getElementById(`${category}-subtotal`).textContent.replace('$', '')) || 0;
        grandSubtotal += subtotal;
    });

    // Calculate grand total (including tax and overhead)
    categories.forEach(category => {
        const subtotal = parseFloat(document.getElementById(`${category}-subtotal`).textContent.replace('$', '')) || 0;
        grandTotal += subtotal;
    });

    // Update displays
    document.getElementById('grand-subtotal').textContent = `$${grandSubtotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
    document.getElementById('grand-total').textContent = `$${grandTotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;

    // Pass the value directly to the other function
    calculatePricePerCharger(grandTotal);
}

function calculatePricePerCharger(grandTotal) {
    const chargersCount = parseInt(document.getElementById('chargers-count').textContent) || 0;

    if (chargersCount > 0) {
        const pricePerCharger = grandTotal / chargersCount;
        document.getElementById('price-per-charger').textContent = `$${pricePerCharger.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
    } else {
        document.getElementById('price-per-charger').textContent = '$0.00';
    }
}


// Form submission
document.getElementById('summaryForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = {
        project_id: document.getElementById('projectId').value,

        // AWG
        awg_base_cost: parseFloat(document.getElementById('awg-base-cost').textContent.replace('$', '')) || 0,
        awg_markup: parseFloat(document.getElementById('awg-markup').value) || 1.0,
        awg_subtotal: parseFloat(document.getElementById('awg-subtotal').textContent.replace('$', '')) || 0,
        awg_profit: parseFloat(document.getElementById('awg-profit').textContent.replace('$', '')) || 0,

        // Conduit
        conduit_base_cost: parseFloat(document.getElementById('conduit-base-cost').textContent.replace('$', '')) || 0,
        conduit_markup: parseFloat(document.getElementById('conduit-markup').value) || 1.0,
        conduit_subtotal: parseFloat(document.getElementById('conduit-subtotal').textContent.replace('$', '')) || 0,
        conduit_profit: parseFloat(document.getElementById('conduit-profit').textContent.replace('$', '')) || 0,

        // Miscellaneous
        misc_base_cost: parseFloat(document.getElementById('misc-base-cost').textContent.replace('$', '')) || 0,
        misc_markup: parseFloat(document.getElementById('misc-markup').value) || 1.0,
        misc_subtotal: parseFloat(document.getElementById('misc-subtotal').textContent.replace('$', '')) || 0,
        misc_profit: parseFloat(document.getElementById('misc-profit').textContent.replace('$', '')) || 0,

        // Equipment
        equipment_base_cost: parseFloat(document.getElementById('equipment-base-cost').textContent.replace('$', '')) || 0,
        equipment_markup: parseFloat(document.getElementById('equipment-markup').value) || 1.0,
        equipment_subtotal: parseFloat(document.getElementById('equipment-subtotal').textContent.replace('$', '')) || 0,
        equipment_profit: parseFloat(document.getElementById('equipment-profit').textContent.replace('$', '')) || 0,

        // Labor
        labor_base_cost: parseFloat(document.getElementById('labor-base-cost').textContent.replace('$', '')) || 0,
        labor_markup: parseFloat(document.getElementById('labor-markup').value) || 1.0,
        labor_subtotal: parseFloat(document.getElementById('labor-subtotal').textContent.replace('$', '')) || 0,
        labor_profit: parseFloat(document.getElementById('labor-profit').textContent.replace('$', '')) || 0,

        // Low Voltage
        low_voltage_base_cost: parseFloat(document.getElementById('low-voltage-base-cost').textContent.replace('$', '')) || 0,
        low_voltage_markup: parseFloat(document.getElementById('low-voltage-markup').value) || 1.0,
        low_voltage_subtotal: parseFloat(document.getElementById('low-voltage-subtotal').textContent.replace('$', '')) || 0,
        low_voltage_profit: parseFloat(document.getElementById('low-voltage-profit').textContent.replace('$', '')) || 0,

        // Permits
        permits_base_cost: parseFloat(document.getElementById('permits-base-cost').value) || 0,
        permits_markup: parseFloat(document.getElementById('permits-markup').value) || 1.0,
        permits_subtotal: parseFloat(document.getElementById('permits-subtotal').textContent.replace('$', '')) || 0,
        permits_profit: parseFloat(document.getElementById('permits-profit').textContent.replace('$', '')) || 0,

        // Income Tax
        tax_base_cost: parseFloat(document.getElementById('tax-base-cost').textContent.replace('$', '')) || 0,
        tax_percentage: parseFloat(document.getElementById('tax-percentage').value) || 0,
        tax_subtotal: parseFloat(document.getElementById('tax-subtotal').textContent.replace('$', '')) || 0,

        // Overhead
        overhead_base_cost: parseFloat(document.getElementById('overhead-base-cost').textContent.replace('$', '')) || 0,
        overhead_percentage: parseFloat(document.getElementById('overhead-percentage').value) || 0,
        overhead_subtotal: parseFloat(document.getElementById('overhead-subtotal').textContent.replace('$', '')) || 0,

        // Totals
        grand_subtotal: parseFloat(document.getElementById('grand-subtotal').textContent.replace(/[$,]/g, '')) || 0,
        grand_total: parseFloat(document.getElementById('grand-total').textContent.replace(/[$,]/g, '')) || 0,

        // Charger Information
        price_per_charger: parseFloat(document.getElementById('price-per-charger').textContent.replace(/[$,]/g, '')) || 0,

        // Approval
        approved: document.querySelector('input[name="approved"]:checked')?.value === 'true',

        total_submitted: parseFloat(document.getElementById('total-submitted').value) || 0,
        approved_amount: parseFloat(document.getElementById('approved-amount').value) || 0,

        // Notes
        notes: document.getElementById('summary-notes').value
    };

    saveSummary(formData);
});

function saveSummary(formData) {
    fetch('/portfolio/save_summary', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Project summary saved successfully!'
                }).then(() => {
                    // Redirect to the next tab or wherever appropriate
                    window.location.href = `/portfolio/projects?project_id=${formData.project_id}`;
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Failed to save summary'
                });
            }
        });
}