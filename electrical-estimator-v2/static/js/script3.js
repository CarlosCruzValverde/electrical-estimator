// Add event listener to the form
document.getElementById('miscEquipmentForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form submission

    // Validate fields before proceeding
    if (!validateFields()) {
        return; // Stop submission if validation fails
    }

    const formData = calculateTotals(); // Calculate totals and get form data
    if (formData) {
        submitFormData(formData); // Submit data to Flask
    }
});


// Function to calculate subtotals and totals
function calculateTotals() {

    let miscTotal = 0;
    let equipmentTotal = 0;
    let hasMiscData = false; // Flag to check if any Miscellaneous field is filled
    let hasEquipData = false; // Flag to check if any Equipment field is filled

    // Collect Miscellaneous data
    const miscData = [];
    document.querySelectorAll('#misc-fields .input-group').forEach(group => {
        // Check if the name is an editable text input
        const nameInput = group.querySelector('.input-row .input-with-label:first-child input[type="text"]');
        // Check if the name is a fixed label
        const nameLabel = group.querySelector('label');

        // Determine the name value
        let name;
        if (nameInput) {
            // If an editable text input exists, use its value
            name = nameInput.value.trim();
        } else if (nameLabel) {
            // If a fixed label exists, use its text content
            name = nameLabel.textContent.trim();
        } else {
            // If neither exists, log an error and skip this group
            console.error("Name field not found in the Miscellaneous group:", group);
            return;
        }

        // Find the cost and quantity input fields
        const costInput = group.querySelector('.input-row .input-with-label:first-child input[type="number"]');
        const quantityInput = group.querySelector('.input-row .input-with-label:last-child input[type="number"]');
        const subtotalElement = group.querySelector('.subtotal');

        if (!costInput || !quantityInput || !subtotalElement) {
            console.error("One or more elements not found in the Miscellaneous group:", group);
            return;
        }

        const cost = parseFloat(costInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;
        const subtotal = cost * quantity;

        // Check if at least one Miscellaneous field is filled
        if (cost > 0 || quantity > 0) {
            hasMiscData = true;
        }

        subtotalElement.textContent = `Subtotal: $${subtotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
        miscTotal += subtotal;

        // Add Miscellaneous data to array
        miscData.push({
            name: name,
            cost: cost,
            quantity: quantity,
            subtotal: subtotal.toFixed(2),
        });
    });

    // Collect Main Equipment data
    const equipmentData = [];
    document.querySelectorAll('#equipment-fields .input-group').forEach(group => {
        // Check if the name is an editable text input
        const nameInput = group.querySelector('.input-row .input-with-label:first-child input[type="text"]');
        // Check if the name is a fixed label
        const nameLabel = group.querySelector('label');

        // Determine the name value
        let name;
        if (nameInput) {
            // If an editable text input exists, use its value
            name = nameInput.value.trim();
        } else if (nameLabel) {
            // If a fixed label exists, use its text content
            name = nameLabel.textContent.trim();
        } else {
            // If neither exists, log an error and skip this group
            console.error("Name field not found in the Equipment group:", group);
            return;
        }

        // Find the cost and quantity input fields
        const costInput = group.querySelector('.input-row .input-with-label:first-child input[type="number"]');
        const quantityInput = group.querySelector('.input-row .input-with-label:last-child input[type="number"]');
        const subtotalElement = group.querySelector('.subtotal');

        // Check if all required elements are found
        if (!costInput || !quantityInput || !subtotalElement) {
            console.error("One or more elements not found in the Equipment group:", group);
            return; // Skip this group if any element is missing
        }

        // Get the values from the inputs
        const cost = parseFloat(costInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;
        const subtotal = cost * quantity;

        // Check if at least one Equipment field is filled
        if (cost > 0 || quantity > 0) {
            hasEquipData = true;
        }

        subtotalElement.textContent = `Subtotal: $${subtotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
        equipmentTotal += subtotal;

        // Add Equipment data to array
        equipmentData.push({
            name: name,
            cost: cost,
            quantity: quantity,
            subtotal: subtotal.toFixed(2),
        });
    });

    // Check if no Miscellaneous or Equipment fields are filled
    if (!hasMiscData && !hasEquipData) {
        Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: 'Please fill out at least one Miscellaneous or Equipment field.',
        });
        return null; // Stop further execution
    }

    // Display Miscellaneous and Equipment totals
    document.getElementById('misc-total').textContent = `Total Miscellaneous Cost: $${miscTotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
    document.getElementById('equipment-total').textContent = `Total Main Equipment Cost: $${equipmentTotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;

    // Calculate TAX and Grand Total
    const tax = parseFloat(document.getElementById('tax').value) || 0;
    const taxAmount = (miscTotal + equipmentTotal) * (tax / 100);
    const grandTotal = miscTotal + equipmentTotal + taxAmount;

    // Display TAX and Grand Total
    document.getElementById('tax-amount').textContent = `$${taxAmount.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
    document.getElementById('grand-total').textContent = `$${grandTotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;

    // Collect other fields
    const notes_misc = document.getElementById('notes_misc').value;
    const notes_equip = document.getElementById('notes_equip').value;

    // Extract project_id from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');

    // Return form data
    return {
        project_id: projectId, // Include project_id
        miscData: miscData,
        equipmentData: equipmentData,
        tax: tax,
        taxAmount: taxAmount,
        grandTotal: grandTotal,
        miscTotal: miscTotal,
        equipmentTotal: equipmentTotal,
        notes_misc: notes_misc,
        notes_equip: notes_equip,
    };
}

// Function to validate fields
function validateFields() {
    let isValid = true;

    // Validate Miscellaneous fields
    document.querySelectorAll('#misc-fields .input-group').forEach(group => {
        const costInput = group.querySelector('.input-row .input-with-label:first-child input[type="number"]');
        const quantityInput = group.querySelector('.input-row .input-with-label:last-child input[type="number"]');

        if ((costInput.value && !quantityInput.value) || (!costInput.value && quantityInput.value)) {
            isValid = false;
            Swal.fire({
                icon: 'warning',
                title: 'Validation Error',
                text: `Please fill out both cost and quantity for ${group.querySelector('label').textContent}.`,
            });
        }
    });

    // Validate Equipment fields
    document.querySelectorAll('#equipment-fields .input-group').forEach(group => {
        const costInput = group.querySelector('.input-row .input-with-label:first-child input[type="number"]');
        const quantityInput = group.querySelector('.input-row .input-with-label:last-child input[type="number"]');

        if ((costInput.value && !quantityInput.value) || (!costInput.value && quantityInput.value)) {
            isValid = false;
            Swal.fire({
                icon: 'warning',
                title: 'Validation Error',
                text: `Please fill out both cost and quantity for ${group.querySelector('label').textContent}.`,
            });
        }
    });

    return isValid;
}

// Function to submit form data to Flask
function submitFormData(formData) {
    fetch('/portfolio/estimate_misc_equip', {
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
                    text: 'Estimation saved successfully!',
                }).then(() => {
                    // Redirect to the next tab (Labor Cost)
                    window.location.href = `/portfolio/estimate_labor_cost?project_id=${formData.project_id}`;
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to save estimation.',
                });
            }
        })
        .catch(error => {
            console.error("Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while saving the estimation.',
            });
        });
}

// Function to clear the form
function clearForm() {
    document.getElementById('estimator-form').reset(); // Reset all form fields
    document.querySelectorAll('.subtotal').forEach(el => el.textContent = 'Subtotal: $0.00'); // Reset subtotals
    document.getElementById('misc-total').textContent = 'Total Miscellaneous Cost: $0.00'; // Reset Misc total
    document.getElementById('equipment-total').textContent = 'Total Main Equipment Cost: $0.00'; // Reset Conduit total
    document.getElementById('tax-amount').textContent = '$0.00'; // Reset tax amount
    document.getElementById('grand-total').textContent = '$0.00'; // Reset grand total
}

// Add dynamic Misc field
document.getElementById('add-misc').addEventListener('click', function () {
    const miscFields = document.getElementById('misc-fields');
    const newField = document.createElement('div');
    newField.className = 'input-group';
    newField.innerHTML = `
        <div class="input-row">
            <div class="input-with-label">
                <label for="new-misc-name">Custom Miscellaneous</label>
                <input type="text" placeholder="Enter miscellaneous name">
            </div>
        </div>
        <div class="input-row">
            <div class="input-with-label">
                <label for="new-misc-cost">Cost per unit ($)</label>
                <input type="number" placeholder="Cost per unit ($)" step="0.01">
            </div>
            <div class="input-with-label">
                <label for="new-misc-quantity">Quantity</label>
                <input type="number" placeholder="Quantity">
            </div>
        </div>
        <div class="subtotal">Subtotal: $0.00</div>
    `;
    miscFields.appendChild(newField);

    // Add event listeners to the new inputs for real-time validation
    newField.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', updateTotals);
    });
});

// Add dynamic Equipment field
document.getElementById('add-equipment').addEventListener('click', function () {
    const equipFields = document.getElementById('equipment-fields');
    const newField = document.createElement('div');
    newField.className = 'input-group';
    newField.innerHTML = `
        <div class="input-row">
            <div class="input-with-label">
                <label for="new-equipment-name">Custom Equipment</label>
                <input type="text" placeholder="Enter Equipment name">
            </div>
        </div>
        <div class="input-row">
            <div class="input-with-label">
                <label for="new-equipment-cost">Cost per unit ($)</label>
                <input type="number" placeholder="Cost per unit ($)" step="0.01">
            </div>
            <div class="input-with-label">
                <label for="new-equipment-length">Quantity</label>
                <input type="number" placeholder="Quantity">
            </div>
        </div>
        <div class="subtotal">Subtotal: $0.00</div>
    `;
    equipFields.appendChild(newField);

    // Add event listeners to the new inputs for real-time validation
    newField.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', updateTotals);
    });
});

// Function to update subtotals and totals in real-time
function updateTotals() {
    calculateTotals(); // Recalculate and update totals
}

// Add event listeners to Misc and Equip fields for real-time updates
document.querySelectorAll('#misc-fields input[type="number"]').forEach(input => {
    input.addEventListener('input', updateTotals);
});

document.querySelectorAll('#equipment-fields input[type="number"]').forEach(input => {
    input.addEventListener('input', updateTotals);
});

// Add event listener to the tax input for real-time updates
document.getElementById('tax').addEventListener('input', updateTotals);