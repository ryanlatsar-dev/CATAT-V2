// CATAT - Cerdas Administrasi Toolset Alat Transmisi
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const borrowBtn = document.getElementById('borrowBtn');
    const returnBtn = document.getElementById('returnBtn');
    const borrowForm = document.getElementById('borrowForm');
    const returnForm = document.getElementById('returnForm');
    const borrowingForm = document.getElementById('borrowingForm');
    const returningForm = document.getElementById('returningForm');
    const borrowerSelect = document.getElementById('borrowerSelect');
    const borrowedItemsInfo = document.getElementById('borrowedItemsInfo');
    const borrowerDetails = document.getElementById('borrowerDetails');
    const borrowedItems = document.getElementById('borrowedItems');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const closeNotification = document.getElementById('closeNotification');
    const borrowDate = document.getElementById('borrowDate');
    const itemOther = document.getElementById('itemOther');
    const otherItemText = document.getElementById('otherItemText');

    // Set current date and time for borrowing
    const now = new Date();
    borrowDate.value = now.toLocaleString('id-ID');

    // Toggle between borrow and return forms
    borrowBtn.addEventListener('click', function() {
        borrowBtn.classList.add('active');
        returnBtn.classList.remove('active');
        borrowForm.style.display = 'block';
        returnForm.style.display = 'none';
    });

    returnBtn.addEventListener('click', function() {
        returnBtn.classList.add('active');
        borrowBtn.classList.remove('active');
        returnForm.style.display = 'block';
        borrowForm.style.display = 'none';
        loadBorrowers();
    });

    // Handle "Other" item checkbox
    itemOther.addEventListener('change', function() {
        otherItemText.disabled = !this.checked;
        if (!this.checked) {
            otherItemText.value = '';
        }
    });

    // Initialize otherItemText as disabled
    otherItemText.disabled = true;

    // Close notification
    closeNotification.addEventListener('click', function() {
        notification.style.display = 'none';
    });

    // Handle borrowing form submission
    borrowingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateBorrowForm()) {
            return;
        }

        // Get form data
        const formData = new FormData(borrowingForm);
        const borrowData = {
            fullName: formData.get('fullName'),
            unit: formData.get('unit'),
            contact: formData.get('contact'),
            borrowDate: formData.get('borrowDate'),
            items: getSelectedItems(),
            condition: formData.get('condition'),
            purpose: formData.get('purpose')
        };

        // Send data to Google Sheets
        submitBorrowData(borrowData);
    });

    // Handle returning form submission
    returningForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateReturnForm()) {
            return;
        }

        // Get form data
        const formData = new FormData(returningForm);
        const returnData = {
            borrower: formData.get('borrowerSelect'),
            returnDate: new Date().toLocaleString('id-ID'),
            returnCondition: formData.get('returnCondition'),
            returnNotes: formData.get('returnNotes')
        };

        // Send data to Google Sheets
        submitReturnData(returnData);
    });

    // Load borrowers for return form
    borrowerSelect.addEventListener('change', function() {
        const selectedBorrower = this.value;
        if (selectedBorrower) {
            fetchBorrowerDetails(selectedBorrower);
            borrowedItemsInfo.style.display = 'block';
        } else {
            borrowedItemsInfo.style.display = 'none';
        }
    });

    // Form validation functions
    function validateBorrowForm() {
        // Check if at least one item is selected
        const items = document.querySelectorAll('input[name="items"]:checked');
        if (items.length === 0) {
            showNotification('Pilih minimal satu barang yang akan dipinjam', 'error');
            return false;
        }

        // Check if "Other" is selected but no text is provided
        if (itemOther.checked && otherItemText.value.trim() === '') {
            showNotification('Harap sebutkan barang lainnya yang akan dipinjam', 'error');
            return false;
        }

        return true;
    }

    function validateReturnForm() {
        if (!borrowerSelect.value) {
            showNotification('Pilih nama peminjam', 'error');
            return false;
        }

        const returnCondition = document.querySelector('input[name="returnCondition"]:checked');
        if (!returnCondition) {
            showNotification('Pilih kondisi barang saat dikembalikan', 'error');
            return false;
        }

        return true;
    }

    // Helper functions
    function getSelectedItems() {
        const checkboxes = document.querySelectorAll('input[name="items"]:checked');
        let items = [];
        
        checkboxes.forEach(checkbox => {
            if (checkbox.value === 'Other') {
                items.push(otherItemText.value);
            } else {
                items.push(checkbox.value);
            }
        });
        
        return items.join(', ');
    }

    function showNotification(message, type = 'success') {
        notificationMessage.textContent = message;
        notification.className = 'notification';
        if (type) {
            notification.classList.add(type);
        }
        notification.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }

    // Google Sheets API Integration
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzLwOSDz1xBr0H0J-ZYx0Z21chWGi706vl0mHhlca_8FBdHgcJqJJ3faeDt0tb5zdoz/exec';

    function loadBorrowers() {
        // Reset dropdown
        borrowerSelect.innerHTML = '<option value="">-- Pilih Nama Peminjam --</option>';
        
        // Ambil data dari API
        fetch(`${GOOGLE_SCRIPT_URL}?action=getActiveBorrowers`)
            .then(response => response.json())
            .then(data => {
                console.log('Data dari API:', data); // Debugging
                
                if (data.status === 'success') {
                    if (data.data && data.data.length > 0) {
                        // Hapus opsi default dan tambahkan data sebenarnya
                        borrowerSelect.innerHTML = '<option value="">-- Pilih Nama Peminjam --</option>';
                        
                        data.data.forEach(borrower => {
                            const option = document.createElement('option');
                            option.value = borrower.id;
                            option.textContent = borrower.name;
                            borrowerSelect.appendChild(option);
                        });
                        
                        console.log('Berhasil memuat', data.data.length, 'peminjam aktif');
                    } else {
                        console.log('Tidak ada peminjam aktif');
                        showNotification('Tidak ada peminjam aktif saat ini', 'info');
                    }
                } else {
                    console.error('API mengembalikan status error:', data);
                    showNotification('Gagal memuat data peminjam: ' + (data.message || 'Unknown error'), 'error');
                }
            })
            .catch(error => {
                console.error('Error loading borrowers:', error);
                showNotification('Terjadi kesalahan saat memuat data peminjam', 'error');
            });
    }

    function fetchBorrowerDetails(borrowerId) {
        fetch(`${GOOGLE_SCRIPT_URL}?action=getBorrowerDetails&id=${borrowerId}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.data) {
                    const details = data.data;
                    borrowerDetails.innerHTML = `
                        <p><strong>Nama:</strong> ${details.name}</p>
                        <p><strong>Unit/Bagian:</strong> ${details.unit}</p>
                        <p><strong>Kontak:</strong> ${details.contact}</p>
                        <p><strong>Tanggal Peminjaman:</strong> ${details.borrowDate}</p>
                        <p><strong>Tujuan Peminjaman:</strong> ${details.purpose}</p>
                        <p><strong>Kondisi Saat Dipinjam:</strong> ${details.condition}</p>
                    `;
                    
                    borrowedItems.innerHTML = `
                        <p><strong>Barang yang Dipinjam:</strong> ${details.items}</p>
                    `;
                } else {
                    showNotification('Gagal memuat detail peminjam', 'error');
                }
            })
            .catch(error => {
                console.error('Error fetching borrower details:', error);
                showNotification('Terjadi kesalahan saat memuat detail', 'error');
            });
    }

    function submitBorrowData(data) {
        fetch(`${GOOGLE_SCRIPT_URL}?action=saveBorrow`, {
            method: 'POST',
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success') {
                    showNotification('Data peminjaman berhasil disimpan!');
                    borrowingForm.reset();
                    borrowDate.value = new Date().toLocaleString('id-ID');
                    otherItemText.disabled = true;
                } else {
                    showNotification(`Gagal menyimpan data: ${result.message}`, 'error');
                }
            })
            .catch(error => {
                console.error('Error submitting borrow data:', error);
                showNotification('Terjadi kesalahan saat menyimpan data', 'error');
            });
    }

    function submitReturnData(data) {
        fetch(`${GOOGLE_SCRIPT_URL}?action=saveReturn`, {
            method: 'POST',
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success') {
                    showNotification('Data pengembalian berhasil disimpan!');
                    returningForm.reset();
                    borrowedItemsInfo.style.display = 'none';
                    
                    // Reload borrowers list to remove the returned item
                    loadBorrowers();
                } else {
                    showNotification(`Gagal menyimpan data: ${result.message}`, 'error');
                }
            })
            .catch(error => {
                console.error('Error submitting return data:', error);
                showNotification('Terjadi kesalahan saat menyimpan data', 'error');
            });
    }
});

// Google Sheets API Integration
// The following functions will be implemented to connect with Google Sheets

// 1. Function to set up Google Sheets API
function setupGoogleSheetsAPI() {
    // This will be implemented based on Google Sheets API documentation
    // It will include authentication and API initialization
}

// 2. Function to read data from Google Sheets
function readFromGoogleSheets(sheetName) {
    // This will fetch data from the specified sheet
    // It will be used to load borrowers and their details
}

// 3. Function to write data to Google Sheets
function writeToGoogleSheets(sheetName, data) {
    // This will write data to the specified sheet
    // It will be used to save borrowing and returning data
}

/*
IMPLEMENTATION GUIDE:

1. Google Sheets Setup:
   - Create a new Google Sheets document
   - Create two sheets: "peminjaman" and "pengembalian"
   - For "peminjaman" sheet, create columns:
     * ID (auto-increment or timestamp)
     * Nama Lengkap
     * Unit/Bagian
     * Kontak Informasi
     * Tanggal & Waktu Peminjaman
     * Barang yang Dipinjam
     * Kondisi Barang Saat Dipinjam
     * Tujuan Peminjaman
   - For "pengembalian" sheet, create columns:
     * ID Peminjaman (reference to peminjaman sheet)
     * Nama Peminjam
     * Tanggal & Waktu Pengembalian
     * Barang yang Dikembalikan
     * Kondisi Barang Saat Dikembalikan
     * Catatan Tambahan

2. Google Apps Script Setup:
   - In your Google Sheets, go to Extensions > Apps Script
   - Create a new script with functions to:
     * Handle GET requests to fetch borrowers data
     * Handle POST requests to save borrowing data
     * Handle POST requests to save returning data
   - Deploy the script as a web app
   - Set access to "Anyone, even anonymous"
   - Copy the web app URL for use in the JavaScript code

3. Update the JavaScript Code:
   - Replace the mock functions with actual API calls
   - Use the web app URL from step 2
   - Implement proper error handling

4. Deployment:
   - Host the website on a platform like Vercel
   - Make sure all files (HTML, CSS, JS) are included
   - Test the integration with Google Sheets

*/