// Add event listener to the form
document.getElementById('awgConduitForm').addEventListener('submit', function (event) {
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

    let awgTotal = 0;
    let conduitTotal = 0;
    let hasAWGData = false; // Flag to check if any AWG field is filled
    let hasConduitData = false; // Flag to check if any Conduit field is filled

    // Collect AWG data
    const awgData = [];
    document.querySelectorAll('#awg-fields .input-group').forEach(group => {
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
            console.error("Name field not found in the AWG group:", group);
            return;
        }

        // Find the cost and length input fields
        const costInput = group.querySelector('.input-row .input-with-label:first-child input[type="number"]');
        const lengthInput = group.querySelector('.input-row .input-with-label:last-child input[type="number"]');
        const subtotalElement = group.querySelector('.subtotal');

        if (!costInput || !lengthInput || !subtotalElement) {
            console.error("One or more elements not found in the AWG group:", group);
            return;
        }

        const cost = parseFloat(costInput.value) || 0;
        const length = parseFloat(lengthInput.value) || 0;
        const subtotal = cost * length;

        // Check if at least one AWG field is filled
        if (cost > 0 || length > 0) {
            hasAWGData = true;
        }

        subtotalElement.textContent = `Subtotal: $${subtotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
        awgTotal += subtotal;

        // Add AWG data to array
        awgData.push({
            name: name,
            cost: cost,
            length: length,
            subtotal: subtotal.toFixed(2),
        });
    });

    // Collect Conduit data
    const conduitData = [];
    document.querySelectorAll('#conduit-fields .input-group').forEach(group => {
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
            console.error("Name field not found in the Conduit group:", group);
            return;
        }

        // Find the cost and length input fields
        const costInput = group.querySelector('.input-row .input-with-label:first-child input[type="number"]');
        const lengthInput = group.querySelector('.input-row .input-with-label:last-child input[type="number"]');
        const subtotalElement = group.querySelector('.subtotal');

        // Check if all required elements are found
        if (!costInput || !lengthInput || !subtotalElement) {
            console.error("One or more elements not found in the Conduit group:", group);
            return; // Skip this group if any element is missing
        }

        // Get the values from the inputs
        const cost = parseFloat(costInput.value) || 0;
        const length = parseFloat(lengthInput.value) || 0;
        const subtotal = cost * length;

        // Check if at least one Conduit field is filled
        if (cost > 0 || length > 0) {
            hasConduitData = true;
        }

        subtotalElement.textContent = `Subtotal: $${subtotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
        conduitTotal += subtotal;

        // Add Conduit data to array
        conduitData.push({
            name: name,
            cost: cost,
            length: length,
            subtotal: subtotal.toFixed(2),
        });
    });

    // Check if no AWG or Conduit fields are filled
    if (!hasAWGData && !hasConduitData) {
        Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: 'Please fill out at least one AWG or Conduit field.',
        });
        return null; // Stop further execution
    }

    // Display AWG and Conduit totals
    document.getElementById('awg-total').textContent = `Total AWG Cost: $${awgTotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
    document.getElementById('conduit-total').textContent = `Total Conduit Cost: $${conduitTotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;

    // Calculate TAX and Grand Total
    const tax = parseFloat(document.getElementById('tax').value) || 0;
    const taxAmount = (awgTotal + conduitTotal) * (tax / 100);
    const grandTotal = awgTotal + conduitTotal + taxAmount;

    // Display TAX and Grand Total
    document.getElementById('tax-amount').textContent = `$${taxAmount.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;
    document.getElementById('grand-total').textContent = `$${grandTotal.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 2 })}`;

    // Collect other fields
    const notes_awg = document.getElementById('notes_awg').value;
    const notes_conduit = document.getElementById('notes_conduit').value;

    // Extract project_id from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');

    // Return form data
    return {
        project_id: projectId, // Include project_id
        awgData: awgData,
        conduitData: conduitData,
        tax: tax,
        taxAmount: taxAmount,
        grandTotal: grandTotal,
        awgTotal: awgTotal,  // Add AWG total
        conduitTotal: conduitTotal,  // Add Conduit total
        notes_awg: notes_awg,
        notes_conduit: notes_conduit,
    };
}

// Function to validate fields
function validateFields() {
    let isValid = true;

    // Validate AWG fields
    document.querySelectorAll('#awg-fields .input-group').forEach(group => {
        const costInput = group.querySelector('.input-row .input-with-label:first-child input[type="number"]');
        const lengthInput = group.querySelector('.input-row .input-with-label:last-child input[type="number"]');

        if ((costInput.value && !lengthInput.value) || (!costInput.value && lengthInput.value)) {
            isValid = false;
            Swal.fire({
                icon: 'warning',
                title: 'Validation Error',
                text: `Please fill out both cost and length for ${group.querySelector('label').textContent}.`,
            });
        }
    });

    // Validate Conduit fields
    document.querySelectorAll('#conduit-fields .input-group').forEach(group => {
        const costInput = group.querySelector('.input-row .input-with-label:first-child input[type="number"]');
        const lengthInput = group.querySelector('.input-row .input-with-label:last-child input[type="number"]');

        if ((costInput.value && !lengthInput.value) || (!costInput.value && lengthInput.value)) {
            isValid = false;
            Swal.fire({
                icon: 'warning',
                title: 'Validation Error',
                text: `Please fill out both cost and length for ${group.querySelector('label').textContent}.`,
            });
        }
    });

    return isValid;
}

// Function to submit form data to Flask
function submitFormData(formData) {
    fetch('/portfolio/estimate_awg_cond', {
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
                    // Redirect to the next tab (Miscellaneous & Equipment)
                    window.location.href = `/portfolio/estimate_misc_equip?project_id=${formData.project_id}`;
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
    document.getElementById('awg-total').textContent = 'Total AWG Cost: $0.00'; // Reset AWG total
    document.getElementById('conduit-total').textContent = 'Total Conduit Cost: $0.00'; // Reset Conduit total
    document.getElementById('tax-amount').textContent = '$0.00'; // Reset tax amount
    document.getElementById('grand-total').textContent = '$0.00'; // Reset grand total
}

// Add dynamic AWG field
document.getElementById('add-awg').addEventListener('click', function () {
    const awgFields = document.getElementById('awg-fields');
    const newField = document.createElement('div');
    newField.className = 'input-group';
    newField.innerHTML = `
        <div class="input-row">
            <div class="input-with-label">
                <label for="new-awg-name">Custom AWG</label>
                <input type="text" placeholder="Enter AWG name">
            </div>
        </div>
        <div class="input-row">
            <div class="input-with-label">
                <label for="new-awg-cost">Cost per foot ($)</label>
                <input type="number" placeholder="Cost per foot ($)" step="0.01">
            </div>
            <div class="input-with-label">
                <label for="new-awg-length">Length (feet)</label>
                <input type="number" placeholder="Length (feet)">
            </div>
        </div>
        <div class="subtotal">Subtotal: $0.00</div>
    `;
    awgFields.appendChild(newField);

    // Add event listeners to the new inputs for real-time validation
    newField.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', updateTotals);
    });
});

// Add dynamic Conduit field
document.getElementById('add-conduit').addEventListener('click', function () {
    const conduitFields = document.getElementById('conduit-fields');
    const newField = document.createElement('div');
    newField.className = 'input-group';
    newField.innerHTML = `
        <div class="input-row">
            <div class="input-with-label">
                <label for="new-conduit-name">Custom Conduit</label>
                <input type="text" placeholder="Enter Conduit name">
            </div>
        </div>
        <div class="input-row">
            <div class="input-with-label">
                <label for="new-conduit-cost">Cost per foot ($)</label>
                <input type="number" placeholder="Cost per foot ($)" step="0.01">
            </div>
            <div class="input-with-label">
                <label for="new-conduit-length">Length (feet)</label>
                <input type="number" placeholder="Length (feet)">
            </div>
        </div>
        <div class="subtotal">Subtotal: $0.00</div>
    `;
    conduitFields.appendChild(newField);

    // Add event listeners to the new inputs for real-time validation
    newField.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', updateTotals);
    });
});

// Function to update subtotals and totals in real-time
function updateTotals() {
    calculateTotals(); // Recalculate and update totals
}

// Add event listeners to AWG and Conduit fields for real-time updates
document.querySelectorAll('#awg-fields input[type="number"]').forEach(input => {
    input.addEventListener('input', updateTotals);
});

document.querySelectorAll('#conduit-fields input[type="number"]').forEach(input => {
    input.addEventListener('input', updateTotals);
});

// Add event listener to the tax input for real-time updates
document.getElementById('tax').addEventListener('input', updateTotals);