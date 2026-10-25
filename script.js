// ===== Data Nilai Mahasiswa — script.js =====
const KKM = 75;                 // batas lulus
const KEY = 'dataNilaiMhs';     // kunci localStorage
let data = [];                  // array of object: {nama, nim, nilai}
let filter = 'semua';           // semua | lulus | tidak
let cari = '';                  // kata pencarian
let aksiHapus = null;           // nim yang akan dihapus, atau 'SEMUA'

const $ = id => document.getElementById(id);
const modalHapus = new bootstrap.Modal($('modalHapus'));

// Memuat data dari localStorage
function muat() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    data = Array.isArray(d) ? d : [];
  } catch (e) { data = []; }
}

// Menyimpan data ke localStorage
function simpan() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* abaikan */ }
}

// Menentukan grade dari nilai
function hitungGrade(n) {
  if (n >= 85) return 'A';
  else if (n >= 75) return 'B';
  else if (n >= 65) return 'C';
  else if (n >= 55) return 'D';
  return 'E';
}

// Mengamankan teks sebelum masuk innerHTML
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Menampilkan alert Bootstrap sementara
function tampilPesan(teks, tipe) {
  $('pesan').innerHTML = '<div class="alert alert-' + tipe + ' alert-dismissible fade show" role="alert">' + esc(teks) + '<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>';
  setTimeout(() => { $('pesan').innerHTML = ''; }, 3500);
}

// Menghitung dan menampilkan kartu statistik
function tampilStatistik() {
  let total = 0, max = 0, lulus = 0;
  for (const d of data) {
    total += d.nilai;
    if (d.nilai > max) max = d.nilai;
    if (d.nilai >= KKM) lulus++;
  }
  const n = data.length;
  $('stTotal').textContent = n;
  $('stRata').textContent = n ? (total / n).toFixed(1) : '0';
  $('stMax').textContent = max;
  $('stLulus').textContent = n ? Math.round(lulus / n * 100) + '%' : '0%';
}

// Menyaring, mengurutkan, lalu menampilkan tabel
function tampilTabel() {
  const q = cari.toLowerCase();
  let hasil = data.filter(d => {
    const lulus = d.nilai >= KKM;
    const cocok = filter === 'semua' || (filter === 'lulus' && lulus) || (filter === 'tidak' && !lulus);
    return cocok && (d.nama.toLowerCase().includes(q) || d.nim.includes(q));
  });
  const urut = $('urut').value;
  if (urut === 'tinggi') hasil.sort((a, b) => b.nilai - a.nilai);
  else if (urut === 'nama') hasil.sort((a, b) => a.nama.localeCompare(b.nama));
  else hasil.reverse();

  let html = '';
  for (let i = 0; i < hasil.length; i++) {
    const d = hasil[i], g = hitungGrade(d.nilai), lulus = d.nilai >= KKM;
    html += '<tr><td>' + (i + 1) + '</td><td>' + esc(d.nama) + '</td><td>' + esc(d.nim) + '</td>' +
      '<td>' + d.nilai + '<div class="bar"><i style="width:' + d.nilai + '%"></i></div></td>' +
      '<td><span class="grade g' + g + '">' + g + '</span></td>' +
      '<td><span class="badge ' + (lulus ? 'text-bg-success' : 'text-bg-danger') + '">' + (lulus ? 'Lulus' : 'Tidak Lulus') + '</span></td>' +
      '<td><button class="btn btn-sm btn-outline-danger btn-hapus" data-nim="' + esc(d.nim) + '" data-nama="' + esc(d.nama) + '">Hapus</button></td></tr>';
  }
  $('tbody').innerHTML = html || '<tr><td colspan="7" class="text-center text-muted py-4">Belum ada data yang cocok.</td></tr>';
  $('info').textContent = 'Menampilkan ' + hasil.length + ' dari ' + data.length + ' data';
}

// Memperbarui seluruh tampilan
function render() { tampilStatistik(); tampilTabel(); }

// Menandai kolom salah beserta pesannya
function setError(el, pesan) {
  el.classList.add('is-invalid');
  el.nextElementSibling.textContent = pesan;
}

// Menghapus tanda salah pada kolom
function bersih(el) { el.classList.remove('is-invalid'); }

// Memvalidasi form; mengembalikan true jika semua benar
function validasi() {
  const nama = $('nama'), nim = $('nim'), nilai = $('nilai');
  let ok = true;
  [nama, nim, nilai].forEach(bersih);

  if (!/^[A-Za-z\s.'-]{3,50}$/.test(nama.value.trim())) { setError(nama, 'Nama 3–50 huruf (tanpa angka).'); ok = false; }

  if (!/^\d{8,12}$/.test(nim.value.trim())) { setError(nim, 'NIM harus 8–12 digit angka.'); ok = false; }
  else if (data.some(d => d.nim === nim.value.trim())) { setError(nim, 'NIM sudah terdaftar.'); ok = false; }

  const v = nilai.value;
  if (v === '' || isNaN(v)) { setError(nilai, 'Nilai wajib diisi dengan angka.'); ok = false; }
  else if (Number(v) < 0 || Number(v) > 100) { setError(nilai, 'Nilai harus antara 0 dan 100.'); ok = false; }
  return ok;
}

// Menambah data baru saat form dikirim
$('frm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (!validasi()) { tampilPesan('Periksa kembali isian yang ditandai merah.', 'danger'); return; }
  data.push({ nama: $('nama').value.trim(), nim: $('nim').value.trim(), nilai: Number($('nilai').value) });
  simpan(); render();
  this.reset();
  tampilPesan('Data berhasil disimpan.', 'success');
});

// Menghapus tanda salah saat pengguna mengetik ulang
['nama', 'nim', 'nilai'].forEach(id => $(id).addEventListener('input', () => bersih($(id))));

// Pencarian langsung saat mengetik
$('cari').addEventListener('input', e => { cari = e.target.value.trim(); tampilTabel(); });

// Mengubah urutan tabel
$('urut').addEventListener('change', tampilTabel);

// Filter lulus / tidak lulus
document.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
  filter = btn.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b === btn));
  tampilTabel();
}));

// Tombol hapus per baris (event delegation) membuka modal
$('tbody').addEventListener('click', e => {
  const btn = e.target.closest('.btn-hapus');
  if (!btn) return;
  aksiHapus = btn.dataset.nim;
  $('modalTeks').textContent = 'Hapus data ' + btn.dataset.nama + ' (' + btn.dataset.nim + ')?';
  modalHapus.show();
});

// Tombol hapus semua membuka modal
$('btnHapusSemua').addEventListener('click', () => {
  if (!data.length) return;
  aksiHapus = 'SEMUA';
  $('modalTeks').textContent = 'Hapus SEMUA data (' + data.length + ' mahasiswa)?';
  modalHapus.show();
});

// Konfirmasi penghapusan
$('btnYa').addEventListener('click', () => {
  data = aksiHapus === 'SEMUA' ? [] : data.filter(d => d.nim !== aksiHapus);
  simpan(); render(); modalHapus.hide();
});

// Mengisi data contoh
$('btnContoh').addEventListener('click', () => {
  const contoh = [['Aulia Rahma', '20260101', 92], ['Bima Pratama', '20260102', 78], ['Citra Dewi', '20260103', 66],
    ['Dimas Saputra', '20260104', 54], ['Eka Wulandari', '20260105', 85], ['Fajar Nugroho', '20260106', 71]];
  for (const c of contoh) {
    if (!data.some(d => d.nim === c[1])) data.push({ nama: c[0], nim: c[1], nilai: c[2] });
  }
  simpan(); render();
});

muat();
render();
