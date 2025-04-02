// Add event listener to the New Project form
document.getElementById('newProjectForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission

    // Validate fields before proceeding
    if (!validateFields()) {
        return; // Stop submission if validation fails
    }

    // Collect form data
    const formData = {
        user_id: parseInt(document.getElementById('userId').value), // Actual user ID
        address: document.getElementById('address').value.trim(), // Project address
        company: document.getElementById('company').value.trim(), // Company name
        start_date: document.getElementById('start_date').value, // Start date
        p_type: document.getElementById('p_type').value === 'custom' ?
            document.getElementById('customOption').value.trim() : // Custom project type
            document.getElementById('p_type').value, // Predefined project type
    };

    // Submit form data to Flask
    submitFormData(formData);
});

// Function to handle project type change
function handleChange() {
    const select = document.getElementById('p_type');
    const customInput = document.getElementById('customOption');

    if (select.value === 'custom') {
        customInput.style.display = 'block';
    } else {
        customInput.style.display = 'none';
        customInput.value = ''; // Clear custom input when not in use
    }
}

// Function to validate fields
function validateFields() {
    let isValid = true;

    // Validate required fields
    const address = document.getElementById('address').value.trim();
    const startDate = document.getElementById('start_date').value;
    const pType = document.getElementById('p_type').value;
    const customOption = document.getElementById('customOption').value;

    if (!address || !startDate) {
        isValid = false;
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please fill out all required fields.',
        });
    }

    // Validate custom project type
    if (pType === 'custom' && !customOption.trim()) {
        isValid = false;
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please enter a custom project type.',
        });
    }

    return isValid;
}

// Function to submit form data to Flask
function submitFormData(formData) {
    fetch('/portfolio/new_project', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.project_id) {
                // Redirect to the Wire & Conduit Estimator tab
                window.location.href = `/portfolio/estimate_awg_cond?project_id=${data.project_id}`;
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to create project. Please try again.',
                });
            }
        })
        .catch(error => {
            console.error("Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while creating the project.',
            });
        });
}