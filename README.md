# CATAT - Cerdas Administrasi Toolset Alat Transmisi

Sistem peminjaman dan pengembalian barang toolset transmisi Kalimantan Tengah.

## Panduan Penggunaan dan Konfigurasi

### 1. Struktur Proyek

Proyek ini terdiri dari tiga file utama:
- `index.html` - Struktur halaman web
- `styles.css` - Styling untuk tampilan responsif
- `script.js` - Fungsionalitas dan integrasi dengan Google Sheets

### 2. Konfigurasi Google Sheets

#### 2.1 Membuat Google Sheets

1. Buka [Google Sheets](https://sheets.google.com) dan buat spreadsheet baru
2. Buat dua sheet dengan nama:
   - Sheet 1: `peminjaman`
   - Sheet 2: `pengembalian`

3. Pada sheet `peminjaman`, buat kolom-kolom berikut:
   - ID (A)
   - Nama Lengkap (B)
   - Unit/Bagian (C)
   - Kontak Informasi (D)
   - Tanggal & Waktu Peminjaman (E)
   - Barang yang Dipinjam (F)
   - Kondisi Barang Saat Dipinjam (G)
   - Tujuan Peminjaman (H)

4. Pada sheet `pengembalian`, buat kolom-kolom berikut:
   - ID Peminjaman (A)
   - Nama Peminjam (B)
   - Tanggal & Waktu Pengembalian (C)
   - Barang yang Dikembalikan (D)
   - Kondisi Barang Saat Dikembalikan (E)
   - Catatan Tambahan (F)

#### 2.2 Membuat Google Apps Script

1. Buka spreadsheet yang telah dibuat
2. Klik menu `Extensions` > `Apps Script`
3. Hapus kode default dan paste kode berikut:

```javascript
// Konfigurasi ID Spreadsheet
const SPREADSHEET_ID = 'MASUKKAN_ID_SPREADSHEET_ANDA_DI_SINI';
const PEMINJAMAN_SHEET_NAME = 'peminjaman';
const PENGEMBALIAN_SHEET_NAME = 'pengembalian';

// Fungsi untuk menangani permintaan web
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getBorrowers') {
    return getBorrowers();
  } else if (action === 'getBorrowerDetails') {
    return getBorrowerDetails(e.parameter.id);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Invalid action'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const action = e.parameter.action;
  const data = JSON.parse(e.postData.contents);
  
  if (action === 'saveBorrow') {
    return saveBorrowData(data);
  } else if (action === 'saveReturn') {
    return saveReturnData(data);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Invalid action'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Fungsi untuk mendapatkan daftar peminjam
function getBorrowers() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(PEMINJAMAN_SHEET_NAME);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // Skip header row
  const borrowers = values.slice(1).map((row, index) => {
    return {
      id: row[0] || (index + 1).toString(),
      name: row[1]
    };
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: borrowers
  })).setMimeType(ContentService.MimeType.JSON);
}

// Fungsi untuk mendapatkan detail peminjam
function getBorrowerDetails(id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(PEMINJAMAN_SHEET_NAME);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // Skip header row and find the borrower
  let borrowerDetails = null;
  values.slice(1).forEach(row => {
    if (row[0] == id) {
      borrowerDetails = {
        id: row[0],
        name: row[1],
        unit: row[2],
        contact: row[3],
        borrowDate: row[4],
        items: row[5],
        condition: row[6],
        purpose: row[7]
      };
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: borrowerDetails
  })).setMimeType(ContentService.MimeType.JSON);
}

// Fungsi untuk menyimpan data peminjaman
function saveBorrowData(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(PEMINJAMAN_SHEET_NAME);
    
    // Generate ID (timestamp)
    const id = new Date().getTime().toString();
    
    // Append data to sheet
    sheet.appendRow([
      id,
      data.fullName,
      data.unit,
      data.contact,
      data.borrowDate,
      data.items,
      data.condition,
      data.purpose
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data peminjaman berhasil disimpan',
      id: id
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi untuk menyimpan data pengembalian
function saveReturnData(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const peminjamanSheet = ss.getSheetByName(PEMINJAMAN_SHEET_NAME);
    const pengembalianSheet = ss.getSheetByName(PENGEMBALIAN_SHEET_NAME);
    
    // Get borrower details
    const dataRange = peminjamanSheet.getDataRange();
    const values = dataRange.getValues();
    
    let borrowerDetails = null;
    values.slice(1).forEach(row => {
      if (row[0] == data.borrower) {
        borrowerDetails = {
          id: row[0],
          name: row[1],
          items: row[5]
        };
      }
    });
    
    if (!borrowerDetails) {
      throw new Error('Peminjam tidak ditemukan');
    }
    
    // Append data to pengembalian sheet
    pengembalianSheet.appendRow([
      borrowerDetails.id,
      borrowerDetails.name,
      data.returnDate,
      borrowerDetails.items,
      data.returnCondition,
      data.returnNotes
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data pengembalian berhasil disimpan'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Ganti `MASUKKAN_ID_SPREADSHEET_ANDA_DI_SINI` dengan ID spreadsheet Anda
   - ID spreadsheet dapat ditemukan di URL spreadsheet: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`

5. Klik `Save` (ikon disket) dan beri nama proyek, misalnya "CATAT API"

#### 2.3 Deploy sebagai Web App

1. Klik tombol `Deploy` > `New deployment`
2. Pilih `Web app` sebagai jenis deployment
3. Isi informasi berikut:
   - Description: "CATAT API v1"
   - Execute as: "Me"
   - Who has access: "Anyone"
4. Klik `Deploy`
5. Salin URL yang muncul (Web app URL) untuk digunakan di aplikasi web

### 3. Mengintegrasikan Google Sheets API dengan Website

Buka file `script.js` dan perbarui bagian Google Sheets API dengan kode berikut:

```javascript
// Google Sheets API Integration
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzEpJqdQ7HhoyOdiNMVbYd9JMtI7FcfyamORuc1JgU6UkdcsFpVdrC3LHcaTW7SscY/exec';

function loadBorrowers() {
    fetch(`${GOOGLE_SCRIPT_URL}?action=getBorrowers`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                borrowerSelect.innerHTML = '<option value="">-- Pilih Nama Peminjam --</option>';
                
                data.data.forEach(borrower => {
                    const option = document.createElement('option');
                    option.value = borrower.id;
                    option.textContent = borrower.name;
                    borrowerSelect.appendChild(option);
                });
            } else {
                showNotification('Gagal memuat data peminjam', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading borrowers:', error);
            showNotification('Terjadi kesalahan saat memuat data', 'error');
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
            } else {
                showNotification(`Gagal menyimpan data: ${result.message}`, 'error');
            }
        })
        .catch(error => {
            console.error('Error submitting return data:', error);
            showNotification('Terjadi kesalahan saat menyimpan data', 'error');
        });
}
```

Ganti `MASUKKAN_WEB_APP_URL_ANDA_DI_SINI` dengan URL web app yang Anda dapatkan dari langkah 2.3.

### 4. Deployment Website ke Vercel

#### 4.1 Persiapan

1. Pastikan Anda memiliki akun [GitHub](https://github.com)
2. Buat repository baru di GitHub
3. Upload semua file proyek (index.html, styles.css, script.js, README.md) ke repository

#### 4.2 Deployment dengan Vercel

1. Buat akun di [Vercel](https://vercel.com) (bisa login dengan GitHub)
2. Klik tombol "New Project"
3. Import repository GitHub yang berisi proyek CATAT
4. Konfigurasi deployment:
   - Framework Preset: pilih "Other"
   - Root Directory: ./
   - Build Command: kosongkan
   - Output Directory: kosongkan
5. Klik "Deploy"
6. Tunggu proses deployment selesai
7. Vercel akan memberikan URL untuk website Anda (misalnya: catat-toolset.vercel.app)

### 5. Pengujian

Setelah website di-deploy, lakukan pengujian berikut:

1. Buka website di perangkat mobile dan desktop
2. Uji form peminjaman:
   - Isi semua field yang diperlukan
   - Pilih beberapa barang
   - Kirim form
   - Verifikasi data tersimpan di Google Sheets (sheet "peminjaman")
3. Uji form pengembalian:
   - Pilih nama peminjam
   - Verifikasi informasi peminjaman muncul
   - Pilih kondisi pengembalian
   - Kirim form
   - Verifikasi data tersimpan di Google Sheets (sheet "pengembalian")

### 6. Pemeliharaan

Untuk memelihara dan mengembangkan sistem:

1. Backup Google Sheets secara berkala
2. Pantau penggunaan API (Google Apps Script memiliki kuota harian)
3. Jika diperlukan, tambahkan fitur seperti:
   - Autentikasi pengguna
   - Laporan dan statistik peminjaman
   - Notifikasi email untuk peminjaman yang terlambat dikembalikan

## Catatan Penting

- Pastikan spreadsheet diatur agar dapat diakses oleh script (minimal "Anyone with the link can view")
- Jika terjadi error, periksa Console browser untuk detail error
- Untuk keamanan lebih baik, pertimbangkan untuk menambahkan autentikasi di masa depan