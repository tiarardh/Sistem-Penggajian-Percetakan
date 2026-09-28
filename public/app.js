const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/>',
  wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 14h2M7 5V3h11"/>',
  chart: '<path d="M4 19V5M4 19h17M8 15l4-4 3 2 5-6"/><path d="M17 7h3v3"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  money: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M7 9h.01M17 15h.01"/>',
  moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  history: '<path d="M3 12a9 9 0 1 0 2.64-6.36L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  printer: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6zM18 12h.01"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};

const pageNames = { dashboard: 'Dashboard', positions: 'Jabatan', employees: 'Karyawan', attendance: 'Absensi', payroll: 'Penggajian', reports: 'Laporan' };
const statusNames = { active: 'Aktif', inactive: 'Nonaktif', draft: 'Draft', paid: 'Dibayar', present: 'Hadir', leave: 'Izin', sick: 'Sakit', alpha: 'Alpha' };
const state = { page: 'dashboard', editing: null, submitting: false, payrollRecords: [], preview: null, confirmResolver: null };
const content = document.querySelector('#page-content');
const modal = document.querySelector('#form-modal');
const commandPalette = document.querySelector('#command-palette');
const commandQuery = document.querySelector('#command-query');
const themeToggle = document.querySelector('#theme-toggle');
const confirmModal = document.querySelector('#confirm-modal');

document.querySelectorAll('[data-icon]').forEach((node) => {
  const name = node.dataset.icon;
  if (icons[name]) node.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
});

const date = new Date();
document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(date);

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function money(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function dateLabel(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '-';
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? '-' : new Intl.DateTimeFormat('id-ID', options).format(parsed);
}

function currentPeriod() {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function monthInputValue(value = currentPeriod()) {
  return value.slice(0, 7);
}

function monthLabel(value) {
  return dateLabel(value, { month: 'long', year: 'numeric' });
}

function icon(name) {
  return `<span data-icon="${name}"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || ''}</svg></span>`;
}

async function api(path, options = {}) {
  const response = await fetch(`/api/${path}`, {
    method: options.method || 'GET',
    headers: options.body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  let data;
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) throw new Error(data.error || 'Permintaan tidak berhasil.');
  return data;
}

function notify(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' error' : ''}`;
  toast.innerHTML = `${icon(type === 'error' ? 'close' : 'check')}<span>${esc(message)}</span>`;
  document.querySelector('#toast-region').append(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

function showError(error) {
  notify(error.message || 'Terjadi kesalahan. Coba lagi.', 'error');
}

function setConnection(connected) {
  document.querySelector('#connection-dot').classList.toggle('connected', connected);
}

function navigateTo(page, params = {}) {
  const query = new URLSearchParams(params);
  history.replaceState(null, '', query.size ? `${location.pathname}?${query}` : location.pathname);
  return render(page);
}

function updateQuery(key, value) {
  const params = new URLSearchParams(location.search);
  if (value) params.set(key, value);
  else params.delete(key);
  history.replaceState(null, '', params.size ? `${location.pathname}?${params}` : location.pathname);
}

function applyTheme(theme, persist = true) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  themeToggle.innerHTML = icon(dark ? 'sun' : 'moon');
  themeToggle.setAttribute('aria-label', `Aktifkan tema ${dark ? 'terang' : 'gelap'}`);
  themeToggle.title = `Aktifkan tema ${dark ? 'terang' : 'gelap'}`;
  document.querySelector('meta[name="theme-color"]').content = dark ? '#211f23' : '#f7f4ed';
  if (persist) localStorage.setItem('payrolly-theme', dark ? 'dark' : 'light');
}

function skeletonMarkup() {
  return '<div class="skeleton-stack" role="status" aria-label="Memuat data"><div class="skeleton skeleton-hero"></div><div class="skeleton-metrics"><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div></div><div class="skeleton skeleton-row"></div></div>';
}

function heading(title, description, action = '') {
  return `<div class="page-heading"><div><span class="eyebrow">PAYROLL & ADMINISTRASI</span><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
}

function emptyState(title, detail) {
  return `<div class="empty-state"><strong>${title}</strong>${detail}</div>`;
}

function badge(status) {
  return `<span class="badge badge-${esc(status)}">${esc(statusNames[status] || status)}</span>`;
}

function headingAdd(label, action) {
  return `<button class="button button-primary" data-action="${action}">${icon('plus')}<span>${label}</span></button>`;
}

function tablePanel(title, subtitle, headers, rows, emptyTitle, emptyDetail) {
  return `<section class="panel"><div class="panel-head"><div><h2>${title}</h2><span class="panel-subtitle">${subtitle}</span></div></div>${rows.length ? `<div class="table-wrap"><table><thead><tr>${headers.map((item) => `<th>${item}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : emptyState(emptyTitle, emptyDetail)}</section>`;
}

function rowActions(id, editAction, extra = '') {
  return `<div class="table-actions"><button class="icon-button" data-action="${editAction}" data-id="${esc(id)}" title="Ubah data" aria-label="Ubah data">${icon('edit')}</button>${extra}</div>`;
}

async function render(page = state.page) {
  state.page = page;
  document.querySelectorAll('.nav-link').forEach((button) => button.classList.toggle('active', button.dataset.page === page));
  document.querySelector('#breadcrumb-current').textContent = pageNames[page];
  document.querySelector('#sidebar').classList.remove('open');
  content.innerHTML = skeletonMarkup();
  try {
    const views = { dashboard: renderDashboard, positions: renderPositions, employees: renderEmployees, attendance: renderAttendance, payroll: renderPayroll, reports: renderReports };
    await views[page]();
    setConnection(true);
  } catch (error) {
    setConnection(false);
    content.innerHTML = `${heading(pageNames[page], 'Periksa konfigurasi Supabase atau koneksi Anda.')}<section class="panel">${emptyState('Data belum dapat dimuat', esc(error.message))}<div class="panel-error-action"><button class="button button-quiet" data-action="refresh">Coba lagi</button></div></section>`;
  }
}

async function renderDashboard() {
  const period = currentPeriod();
  const [summary, payroll, employees] = await Promise.all([api(`dashboard?period=${period}`), api(`payroll?period=${period}`), api('employees')]);
  const percentPaid = summary.payrollCount ? Math.round((summary.paidCount / summary.payrollCount) * 100) : 0;
  const recent = payroll.slice(0, 6).map((record) => `<tr><td><span class="cell-primary">${esc(record.employees?.full_name || '-')}</span><span class="cell-secondary">${esc(record.employees?.employee_number || '-')}</span></td><td>${esc(record.employees?.positions?.name || '-')}</td><td>${money(record.total_net)}</td><td>${badge(record.status)}</td></tr>`);
  const roleCounts = employees.reduce((counts, employee) => {
    const role = employee.positions?.name || 'Belum ditentukan';
    counts[role] = (counts[role] || 0) + 1;
    return counts;
  }, {});
  const roles = Object.entries(roleCounts).sort((left, right) => right[1] - left[1]).slice(0, 5);
  const maxRoleCount = Math.max(1, ...roles.map(([, count]) => count));
  const roleRows = roles.map(([name, count]) => `<div class="role-row"><div class="role-label"><span>${esc(name)}</span><strong>${count}</strong></div><progress class="role-progress" max="${maxRoleCount}" value="${count}" aria-label="${esc(name)}: ${count} karyawan"></progress></div>`).join('');
  const attendance = summary.attendance;
  const alertActions = { attendance: 'filter-missing-attendance', absence: 'filter-alpha-attendance', overtime: 'filter-overtime-attendance', payroll: 'filter-draft-payroll' };
  const alerts = summary.reviewAlerts.map((alert) => `<button class="alert-item is-actionable ${esc(alert.severity)}" data-action="${alertActions[alert.type] || 'goto-payroll'}" data-period="${esc(period.slice(0, 7))}" aria-label="Tinjau: ${esc(alert.message)}"><strong class="alert-count">${alert.count}</strong><span>${esc(alert.message)}</span><span class="alert-cta">Tinjau</span></button>`).join('');
  const activities = summary.activities.map((item) => `<button class="activity-item" data-action="${item.type === 'payroll' ? 'goto-payroll' : 'goto-attendance'}">${icon(item.type === 'payroll' ? 'wallet' : 'calendar')}<span>${esc(item.label)}<time>${esc(dateLabel(item.date))}</time></span>${icon('arrow')}</button>`).join('');
  content.innerHTML = `<section class="payroll-hero">
      <div class="hero-copy"><div class="hero-meta"><span class="hero-eyebrow">PAYROLL OVERVIEW</span><span class="hero-period"><i></i>${esc(monthLabel(period))}</span></div>
        <h1>Penggajian, lebih <span>tertata.</span></h1><p>Semua angka penting timmu, dalam satu tempat.</p>
        <div class="hero-total-label">TOTAL GAJI BERSIH</div><strong class="hero-total">${money(summary.payrollTotal)}</strong>
        <div class="hero-progress"><div class="hero-progress-label"><span>Progres pembayaran</span><strong>${percentPaid}%</strong></div><progress class="payment-progress" max="100" value="${percentPaid}" aria-label="Progres pembayaran payroll ${percentPaid}%"></progress></div>
      </div>
      <div class="hero-side"><div class="hero-side-label">STATUS PERIODE</div><div class="hero-paid-count"><strong>${summary.paidCount}<span>/${summary.payrollCount}</span></strong><p>karyawan sudah<br>menerima gaji</p></div><div class="hero-status"><span><i class="status-dot paid"></i>Sudah dibayar <strong>${summary.paidCount}</strong></span><span><i class="status-dot pending"></i>Menunggu <strong>${summary.draftCount}</strong></span></div><button class="button button-hero" data-action="goto-payroll">${icon('wallet')}<span>Lihat penggajian</span></button></div>
    </section>
    <div class="metric-grid dashboard-metrics">
      <article class="metric-card metric-people" data-action="goto-employees" role="button" tabindex="0" aria-label="Lihat ${summary.employees} karyawan"><div class="metric-heading">${icon('users')}<span>UKURAN TIM</span></div><strong class="metric-value">${summary.employees}</strong><span class="metric-note">Total karyawan terdaftar</span></article>
      <article class="metric-card metric-active" data-action="goto-active-employees" role="button" tabindex="0" aria-label="Lihat ${summary.activeEmployees} karyawan aktif"><div class="metric-heading">${icon('check')}<span>STATUS KERJA</span></div><strong class="metric-value">${summary.activeEmployees}<small> / ${summary.employees}</small></strong><span class="metric-note">Karyawan aktif saat ini</span></article>
      <article class="metric-card metric-pending" data-action="filter-draft-payroll" data-period="${esc(period.slice(0, 7))}" role="button" tabindex="0" aria-label="Tinjau ${summary.draftCount} payroll yang menunggu pembayaran"><div class="metric-heading">${icon('clock')}<span>PERLU TINDAKAN</span></div><strong class="metric-value">${summary.draftCount}</strong><span class="metric-note">Payroll menunggu pembayaran</span><span class="metric-cta">Buka payroll draft ${icon('arrow')}</span></article>
    </div>
    <div class="dashboard-grid"><section class="panel workforce-panel"><div class="panel-head"><div><h2>Komposisi tim</h2><span class="panel-subtitle">Karyawan berdasarkan jabatan</span></div><span class="panel-head-count">${summary.employees} orang</span></div><div class="role-list">${roleRows || emptyState('Belum ada karyawan', 'Data komposisi tim akan muncul di sini.')}</div></section>
      ${tablePanel('Payroll terbaru', `Periode ${esc(monthLabel(period))}`, ['KARYAWAN', 'JABATAN', 'GAJI BERSIH', 'STATUS'], recent, 'Belum ada payroll', 'Buat payroll periode ini untuk melihat ringkasan.')}
    </div><div class="insight-grid">
      <section class="panel"><div class="panel-head"><div><h2>Ringkasan absensi</h2><span class="panel-subtitle">${attendance.recorded} catatan · ${attendance.expected} hari kerja</span></div></div><div class="insight-list"><button class="insight-line interactive" data-action="filter-attendance" data-status="present" data-period="${esc(period.slice(0, 7))}"><span class="insight-icon">${icon('check')}</span>Hadir<strong>${attendance.present}</strong>${icon('arrow')}</button><button class="insight-line interactive" data-action="filter-attendance" data-status="leave-sick" data-period="${esc(period.slice(0, 7))}"><span class="insight-icon blue">${icon('calendar')}</span>Izin / sakit<strong>${attendance.leave + attendance.sick}</strong>${icon('arrow')}</button><button class="insight-line interactive" data-action="filter-alpha-attendance" data-period="${esc(period.slice(0, 7))}"><span class="insight-icon rose">${icon('clock')}</span>Alpha<strong>${attendance.alpha}</strong>${icon('arrow')}</button><button class="insight-line interactive" data-action="filter-missing-attendance" data-period="${esc(period.slice(0, 7))}">Belum dicatat<strong>${attendance.missing}</strong>${icon('arrow')}</button></div></section>
      <section class="panel"><div class="panel-head"><div><h2>Insight lembur</h2><span class="panel-subtitle">Akumulasi periode ${esc(monthLabel(period))}</span></div></div><div class="insight-list"><button class="insight-line interactive" data-action="filter-overtime-attendance" data-period="${esc(period.slice(0, 7))}"><span class="insight-icon rose">${icon('clock')}</span>Total jam lembur<strong>${Number(summary.overtimeHours).toLocaleString('id-ID')} jam</strong>${icon('arrow')}</button><button class="insight-line interactive" data-action="goto-active-employees"><span class="insight-icon">${icon('users')}</span>Karyawan aktif<strong>${summary.activeEmployees}</strong>${icon('arrow')}</button><button class="action-link" data-action="goto-attendance">Lihat semua absensi</button></div></section>
      <section class="panel"><div class="panel-head"><div><h2>Review & aktivitas</h2><span class="panel-subtitle">${summary.reviewAlerts.length} perhatian · aktivitas terbaru</span></div></div>${alerts ? `<div class="alert-list">${alerts}</div>` : emptyState('Semua terlihat baik', 'Belum ada hal yang membutuhkan perhatian.')}${activities ? `<div class="activity-list">${activities.slice(0, 3)}</div>` : ''}</section>
    </div><p class="academic-title">Sistem Informasi Akuntansi Penggajian dan Administrasi Karyawan pada Usaha Percetakan</p>`;
}

async function renderPositions() {
  const positions = await api('positions');
  const query = new URLSearchParams(location.search).get('q')?.toLowerCase() || '';
  const filtered = positions.filter((item) => item.name.toLowerCase().includes(query));
  const rows = filtered.map((item, index) => `<tr><td>${String(index + 1).padStart(2, '0')}</td><td><span class="cell-primary">${esc(item.name)}</span></td><td class="currency">${money(item.base_salary)}</td><td>${dateLabel(item.created_at)}</td><td>${rowActions(item.id, 'edit-position', `<button class="icon-button" data-action="delete-position" data-id="${esc(item.id)}" title="Hapus jabatan" aria-label="Hapus jabatan">${icon('trash')}</button>`)}</td></tr>`);
  content.innerHTML = `${heading('Jabatan', 'Kelola posisi dan gaji pokok sebagai dasar perhitungan payroll.', headingAdd('Tambah jabatan', 'add-position'))}<div class="toolbar"><div class="search-wrap">${icon('search')}<input class="search-input" id="table-search" placeholder="Cari nama jabatan…" value="${esc(query)}" aria-label="Cari jabatan"></div><span class="toolbar-spacer"></span><span class="cell-secondary">${positions.length} jabatan terdaftar</span></div>${tablePanel('Daftar jabatan', 'Posisi dan nominal gaji pokok bulanan', ['NO.', 'NAMA JABATAN', 'GAJI POKOK', 'DITAMBAHKAN', 'AKSI'], rows, 'Belum ada jabatan', 'Tambahkan jabatan untuk mengatur gaji pokok karyawan.')}`;
}

async function renderEmployees() {
  const [employees, positions] = await Promise.all([api('employees'), api('positions')]);
  const params = new URLSearchParams(location.search);
  const query = params.get('q')?.toLowerCase() || '';
  const activeFilter = params.get('active') || 'all';
  const filtered = employees.filter((item) => `${item.full_name} ${item.employee_number} ${item.positions?.name || ''}`.toLowerCase().includes(query) && (activeFilter === 'all' || String(item.active) === activeFilter));
  const rows = filtered.map((item) => `<tr><td><span class="cell-primary">${esc(item.employee_number)}</span></td><td><span class="cell-primary">${esc(item.full_name)}</span><span class="cell-secondary">${esc(item.phone || 'Nomor telepon belum diisi')}</span></td><td>${esc(item.positions?.name || '-')}</td><td>${dateLabel(item.start_date)}</td><td>${badge(item.active ? 'active' : 'inactive')}</td><td><div class="table-actions"><button class="icon-button" data-action="employee-profile" data-id="${esc(item.id)}" title="Lihat profil 360" aria-label="Lihat profil ${esc(item.full_name)}">${icon('eye')}</button><button class="icon-button" data-action="edit-employee" data-id="${esc(item.id)}" title="Ubah data" aria-label="Ubah ${esc(item.full_name)}">${icon('edit')}</button><button class="action-link" data-action="toggle-employee" data-id="${esc(item.id)}" data-active="${item.active}" title="${item.active ? 'Nonaktifkan' : 'Aktifkan'}">${item.active ? 'Nonaktifkan' : 'Aktifkan'}</button></div></td></tr>`);
  content.innerHTML = `${heading('Karyawan', 'Kelola data personal, jabatan, dan status karyawan.', headingAdd('Tambah karyawan', 'add-employee'))}<div class="toolbar"><div class="search-wrap">${icon('search')}<input class="search-input" id="table-search" placeholder="Cari nama, nomor, atau jabatan…" value="${esc(query)}" aria-label="Cari karyawan"></div><select class="field-control filter-control" id="employee-filter" aria-label="Filter status karyawan"><option value="all" ${activeFilter === 'all' ? 'selected' : ''}>Semua status</option><option value="true" ${activeFilter === 'true' ? 'selected' : ''}>Aktif</option><option value="false" ${activeFilter === 'false' ? 'selected' : ''}>Nonaktif</option></select><span class="toolbar-spacer"></span><span class="cell-secondary">Menampilkan ${filtered.length} dari ${employees.length} karyawan · ${positions.length} jabatan</span></div>${tablePanel('Daftar karyawan', 'Pilih profil untuk melihat riwayat lengkap', ['NO. KARYAWAN', 'NAMA LENGKAP', 'JABATAN', 'MULAI BEKERJA', 'STATUS', 'AKSI'], rows, 'Belum ada karyawan', 'Tambahkan karyawan untuk mulai mengelola administrasi.')}`;
}

async function renderAttendance() {
  const params = new URLSearchParams(location.search);
  const period = params.get('period') || '';
  const status = params.get('status') || 'all';
  const overtimeOnly = params.get('overtime') === '1';
  const missingMode = params.get('missing') === '1';
  const periodForMissing = period || monthInputValue();
  const [allAttendance, employees] = await Promise.all([api('attendance'), api('employees')]);
  let rows = [];
  let resultCount = 0;
  if (missingMode) {
    const missing = await api(`attendance/missing?period=${encodeURIComponent(periodForMissing)}`);
    resultCount = missing.count;
    rows = missing.records.map((item) => `<tr><td>${dateLabel(item.attendance_date)}</td><td><span class="cell-primary">${esc(item.full_name)}</span><span class="cell-secondary">${esc(item.employee_number)} · ${esc(item.position_name)}</span></td><td>${badge('alpha')}</td><td>-</td><td><button class="button button-primary button-small" data-action="record-missing" data-id="${esc(item.employee_id)}" data-date="${esc(item.attendance_date)}">${icon('plus')}<span>Catat</span></button></td></tr>`);
  } else {
    const filtered = allAttendance.filter((item) => (!period || item.attendance_date.startsWith(period)) && (status === 'all' || (status === 'leave-sick' ? ['leave', 'sick'].includes(item.status) : item.status === status)) && (!overtimeOnly || Number(item.overtime_hours) > 0));
    resultCount = filtered.length;
    rows = filtered.map((item) => `<tr><td>${dateLabel(item.attendance_date)}</td><td><span class="cell-primary">${esc(item.employees?.full_name || '-')}</span><span class="cell-secondary">${esc(item.employees?.employee_number || '-')}</span></td><td>${badge(item.status)}</td><td>${Number(item.overtime_hours).toLocaleString('id-ID')} jam</td><td>${rowActions(item.id, 'edit-attendance', `<button class="icon-button" data-action="delete-attendance" data-id="${esc(item.id)}" title="Hapus absensi" aria-label="Hapus absensi">${icon('trash')}</button>`)}</td></tr>`);
  }
  const description = missingMode ? `Hari kerja tanpa catatan absensi · ${monthLabel(`${periodForMissing}-01`)}` : 'Catat kehadiran, izin, sakit, alpha, dan jam lembur.';
  const toolbar = `<div class="toolbar"><label class="eyebrow toolbar-label" for="attendance-period">PERIODE</label><input class="field-control filter-control" id="attendance-period" type="month" value="${esc(period)}"><select class="field-control filter-control" id="attendance-status" aria-label="Filter status absensi" ${missingMode ? 'disabled' : ''}><option value="all" ${status === 'all' ? 'selected' : ''}>Semua status</option><option value="present" ${status === 'present' ? 'selected' : ''}>Hadir</option><option value="leave-sick" ${status === 'leave-sick' ? 'selected' : ''}>Izin / sakit</option><option value="alpha" ${status === 'alpha' ? 'selected' : ''}>Alpha</option></select><label class="check-filter"><input id="overtime-only" type="checkbox" ${overtimeOnly ? 'checked' : ''} ${missingMode ? 'disabled' : ''}><span>Lembur saja</span></label><button class="button button-quiet" data-action="toggle-missing" data-missing="${missingMode}">${missingMode ? 'Lihat riwayat absensi' : 'Cek absensi kosong'}</button><span class="toolbar-spacer"></span><span class="cell-secondary">${resultCount} catatan · ${employees.filter((item) => item.active).length} karyawan aktif</span></div>`;
  const emptyTitle = missingMode ? 'Semua absensi sudah tercatat' : 'Tidak ada absensi yang cocok';
  const emptyDetail = missingMode ? 'Tidak ada hari kerja kosong pada periode ini.' : 'Ubah filter periode atau status untuk melihat catatan lain.';
  content.innerHTML = `${heading('Absensi', description, `<button class="button button-primary" data-action="add-attendance">${icon('plus')}<span>Absensi cepat</span></button>`)}${toolbar}${tablePanel(missingMode ? 'Absensi yang perlu dilengkapi' : 'Riwayat absensi', missingMode ? 'Pilih Catat untuk membuka formulir dengan karyawan dan tanggal terisi.' : `Maksimal 500 catatan terbaru · ${resultCount} hasil filter`, ['TANGGAL', 'KARYAWAN', 'STATUS', 'LEMBUR', 'AKSI'], rows, emptyTitle, emptyDetail)}`;
}

async function renderPayroll() {
  const params = new URLSearchParams(location.search);
  const period = monthInputValue(params.get('period') ? `${params.get('period')}-01` : currentPeriod());
  const statusFilter = params.get('status') || 'all';
  const records = await api(`payroll?period=${period}-01`);
  state.payrollRecords = records;
  const filteredRecords = records.filter((item) => statusFilter === 'all' || item.status === statusFilter);
  const total = filteredRecords.reduce((sum, row) => sum + Number(row.total_net), 0);
  const rows = filteredRecords.map((item) => `<tr><td><span class="cell-primary">${esc(item.employees?.employee_number || '-')}</span></td><td><span class="cell-primary">${esc(item.employees?.full_name || '-')}</span><span class="cell-secondary">${esc(item.employees?.positions?.name || '-')}</span></td><td class="currency">${money(item.base_salary)}</td><td>${money(item.overtime_pay)}<span class="cell-secondary">${Number(item.overtime_hours).toLocaleString('id-ID')} jam</span></td><td>${money(item.deduction)}<span class="cell-secondary">${item.absence_days} hari alpha</span></td><td class="currency">${money(item.total_net)}</td><td>${badge(item.status)}</td><td><div class="table-actions">${item.status === 'draft' ? `<button class="button button-quiet button-small" data-action="mark-paid" data-id="${esc(item.id)}">${icon('check')}<span>Bayar</span></button>` : ''}<button class="icon-button" data-action="view-slip" data-id="${esc(item.id)}" title="Lihat slip gaji" aria-label="Lihat slip ${esc(item.employees?.full_name || '')}">${icon('file')}</button><button class="icon-button" data-action="view-audit" data-id="${esc(item.id)}" title="Riwayat perubahan" aria-label="Riwayat payroll ${esc(item.employees?.full_name || '')}">${icon('history')}</button></div></td></tr>`);
  content.innerHTML = `${heading('Penggajian', 'Hitung gaji bulanan berdasarkan jabatan, absensi, lembur, dan potongan.', `<button class="button button-primary" data-action="preview-payroll">${icon('check')}<span>Preview & validasi</span></button>`)}<div class="toolbar"><label class="eyebrow toolbar-label" for="period-filter">PERIODE</label><input class="field-control filter-control" id="period-filter" type="month" value="${esc(period)}"><select class="field-control filter-control" id="payroll-status" aria-label="Filter status payroll"><option value="all" ${statusFilter === 'all' ? 'selected' : ''}>Semua status</option><option value="draft" ${statusFilter === 'draft' ? 'selected' : ''}>Draft</option><option value="paid" ${statusFilter === 'paid' ? 'selected' : ''}>Sudah dibayar</option></select><span class="toolbar-spacer"></span><span class="cell-secondary">${filteredRecords.length} dari ${records.length} karyawan · total ${money(total)}</span></div>${tablePanel('Rincian payroll', `Periode ${esc(monthLabel(`${period}-01`))} · gaji pokok + lembur - potongan alpha`, ['NO. KARYAWAN', 'KARYAWAN', 'GAJI POKOK', 'PEMBAYARAN LEMBUR', 'POTONGAN', 'GAJI BERSIH', 'STATUS', 'AKSI'], rows, 'Tidak ada payroll sesuai filter', 'Pilih status lain atau hitung payroll untuk periode ini.')}`;
}

async function renderReports() {
  const params = new URLSearchParams(location.search);
  const filter = params.get('period') === 'all' ? '' : params.get('period') || monthInputValue();
  const periodQuery = filter ? `?period=${filter}-01` : '';
  const report = await api(`reports${periodQuery}`);
  const rows = report.records.map((item) => `<tr><td>${esc(monthLabel(item.period_month))}</td><td><span class="cell-primary">${esc(item.employees?.employee_number || '-')}</span></td><td><span class="cell-primary">${esc(item.employees?.full_name || '-')}</span></td><td>${esc(item.employees?.positions?.name || '-')}</td><td>${money(item.base_salary)}</td><td>${money(item.overtime_pay)}</td><td>${money(item.deduction)}</td><td class="currency">${money(item.total_net)}</td><td>${badge(item.status)}</td></tr>`);
  content.innerHTML = `${heading('Laporan payroll', 'Tinjau rincian gaji, lembur, dan potongan per periode.')}
    <div class="toolbar"><label class="eyebrow toolbar-label" for="report-period">FILTER PERIODE</label><input class="field-control filter-control" id="report-period" type="month" value="${esc(filter)}"><button class="button button-quiet" data-action="report-all">Semua periode</button><span class="toolbar-spacer"></span><button class="button button-quiet" data-action="print-report">Cetak laporan</button></div>
    <div class="report-summary"><div class="report-chip"><span>Gaji pokok</span><strong>${money(report.baseSalary)}</strong></div><div class="report-chip"><span>Pembayaran lembur</span><strong>${money(report.overtimePay)}</strong></div><div class="report-chip"><span>Total potongan</span><strong>${money(report.deductions)}</strong></div><div class="report-chip"><span>Total gaji bersih</span><strong>${money(report.netTotal)}</strong></div></div>
    ${tablePanel('Rincian laporan', report.period === 'all' ? `${report.count} data payroll seluruh periode` : `Periode ${esc(monthLabel(`${filter}-01`))} · ${report.count} data payroll`, ['PERIODE', 'NO. KARYAWAN', 'NAMA KARYAWAN', 'JABATAN', 'GAJI POKOK', 'LEMBUR', 'POTONGAN', 'GAJI BERSIH', 'STATUS'], rows, 'Belum ada data payroll', 'Data laporan muncul setelah payroll dihitung.')}`;
}

function renderPayrollReview(preview) {
  state.preview = preview;
  const summary = preview.summary;
  const alerts = preview.records.flatMap((record) => record.alerts.map((alert) => ({ ...alert, employee_id: record.employee_id, full_name: record.full_name })));
  const alertMarkup = alerts.length
    ? alerts.map((alert) => `<button class="alert-item is-actionable ${alert.severity === 'warning' ? 'warning' : 'info'}" data-action="${alert.code === 'missing_attendance' ? 'review-missing-attendance' : 'review-employee-profile'}" data-id="${esc(alert.employee_id)}" data-period="${esc(preview.period_month.slice(0, 7))}"><span class="alert-count">${esc(alert.full_name)}</span><span>${esc(alert.message)}</span><span class="alert-cta">Tinjau</span></button>`).join('')
    : '<div class="alert-item info"><span class="alert-count">OK</span><span>Tidak ada anomali yang terdeteksi pada data payroll ini.</span></div>';
  const rows = preview.records.map((record) => `<tr><td><strong>${esc(record.full_name)}</strong><span class="cell-secondary">${esc(record.employee_number)} · ${esc(record.position_name)}</span></td><td>${money(record.base_salary)}</td><td>${Number(record.overtime_hours).toLocaleString('id-ID')} jam<br><span class="cell-secondary">${money(record.overtime_pay)}</span></td><td>${record.absence_days} hari<br><span class="cell-secondary">${money(record.deduction)}</span></td><td><strong>${money(record.total_net)}</strong></td><td>${record.missing_attendance_days ? `<span class="record-alert">${record.missing_attendance_days} absensi kosong</span>` : badge('active')} ${record.alerts.some((alert) => alert.severity === 'warning') ? '<span class="record-alert">Perlu review</span>' : ''}</td></tr>`);
  document.querySelector('#review-title').textContent = `Preview payroll · ${monthLabel(preview.period_month)}`;
  document.querySelector('#review-content').innerHTML = `<div class="review-summary"><div class="review-stat"><span>Karyawan aktif</span><strong>${summary.count}</strong></div><div class="review-stat"><span>Payroll draft</span><strong>${summary.draftCount}</strong></div><div class="review-stat"><span>Total gaji bersih</span><strong>${money(summary.netTotal)}</strong></div><div class="review-stat"><span>Perlu perhatian</span><strong>${summary.warningCount}</strong></div></div><div class="payroll-formula">Gaji bersih = Gaji pokok + Lembur - Potongan alpha</div><h3 class="workflow-section-title">Validasi dan anomaly check</h3><div class="review-alerts">${alertMarkup}</div><h3 class="workflow-section-title">Salary breakdown per karyawan</h3>${rows.length ? `<div class="review-table-wrap"><table class="review-table"><thead><tr><th>KARYAWAN</th><th>GAJI POKOK</th><th>LEMBUR</th><th>POTONGAN</th><th>GAJI BERSIH</th><th>VALIDASI</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : emptyState('Belum ada karyawan aktif', 'Payroll preview belum dapat dibuat.')}`;
  const saveButton = document.querySelector('#save-preview');
  saveButton.disabled = !summary.draftCount;
  saveButton.textContent = summary.draftCount ? `Simpan ${summary.draftCount} draft payroll` : 'Tidak ada draft untuk disimpan';
}

async function openPayrollReview(period) {
  const preview = await api('payroll/preview', { method: 'POST', body: { period_month: `${period}-01` } });
  renderPayrollReview(preview);
  document.querySelector('#review-modal').showModal();
}

async function openEmployeeProfile(id) {
  const data = await api(`employees/${id}/profile`);
  const employee = data.employee;
  const initials = employee.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const attendance = data.attendance;
  const payrollRows = data.payroll.records.slice(0, 6).map((record) => `<tr><td>${esc(monthLabel(record.period_month))}</td><td>${money(record.base_salary)}</td><td>${money(record.overtime_pay)}</td><td>${money(record.deduction)}</td><td><strong>${money(record.total_net)}</strong></td><td>${badge(record.status)}</td></tr>`);
  const attendanceRows = data.recentAttendance.slice(0, 5).map((record) => `<tr><td>${dateLabel(record.attendance_date)}</td><td>${badge(record.status)}</td><td>${Number(record.overtime_hours).toLocaleString('id-ID')} jam</td></tr>`);
  document.querySelector('#profile-title').textContent = employee.full_name;
  document.querySelector('#profile-content').innerHTML = `<div class="profile-hero"><span class="profile-avatar">${esc(initials)}</span><div><h3>${esc(employee.full_name)}</h3><p>${esc(employee.employee_number)} · ${esc(employee.positions?.name || 'Tanpa jabatan')} · ${badge(employee.active ? 'active' : 'inactive')}</p><p>${esc(employee.phone || 'Nomor telepon belum diisi')} · Bergabung ${dateLabel(employee.start_date)}</p></div></div><div class="profile-stats"><div class="profile-stat"><span>Gaji pokok</span><strong>${money(employee.positions?.base_salary)}</strong></div><div class="profile-stat"><span>Total payroll</span><strong>${data.payroll.count} periode</strong></div><div class="profile-stat"><span>Total diterima</span><strong>${money(data.payroll.totalNet)}</strong></div><div class="profile-stat"><span>Total lembur</span><strong>${Number(attendance.overtimeHours).toLocaleString('id-ID')} jam</strong></div></div><h3 class="workflow-section-title">Ringkasan kehadiran</h3><div class="profile-stats"><div class="profile-stat"><span>Hadir</span><strong>${attendance.present}</strong></div><div class="profile-stat"><span>Izin</span><strong>${attendance.leave}</strong></div><div class="profile-stat"><span>Sakit</span><strong>${attendance.sick}</strong></div><div class="profile-stat"><span>Alpha</span><strong>${attendance.alpha}</strong></div></div><h3 class="workflow-section-title">Riwayat payroll</h3>${payrollRows.length ? `<div class="review-table-wrap"><table class="review-table"><thead><tr><th>PERIODE</th><th>POKOK</th><th>LEMBUR</th><th>POTONGAN</th><th>BERSIH</th><th>STATUS</th></tr></thead><tbody>${payrollRows.join('')}</tbody></table></div>` : emptyState('Belum ada riwayat payroll', 'Payroll karyawan akan tampil setelah dihitung.')}${attendanceRows.length ? `<h3 class="workflow-section-title">Absensi terbaru</h3><div class="review-table-wrap"><table><thead><tr><th>TANGGAL</th><th>STATUS</th><th>LEMBUR</th></tr></thead><tbody>${attendanceRows.join('')}</tbody></table></div>` : ''}`;
  document.querySelector('#profile-modal').showModal();
}

async function openPayrollAudit(id) {
  let audit;
  try {
    audit = await api(`payroll/${id}/audit`);
  } catch (error) {
    if (/payroll_audit|schema cache|does not exist/i.test(error.message)) {
      document.querySelector('#audit-content').innerHTML = emptyState('Audit trail belum diaktifkan', 'Jalankan ulang sql/schema.sql di Supabase SQL Editor untuk menambahkan tabel dan trigger audit. Data payroll yang ada tidak akan ditimpa.');
      document.querySelector('#audit-modal').showModal();
      return;
    }
    throw error;
  }
  const records = audit.map((entry) => {
    const actionLabel = { created: 'Payroll dibuat', updated: 'Payroll diperbarui', status_changed: 'Status payroll berubah' }[entry.action] || entry.action;
    const beforeAfter = entry.old_values || entry.new_values;
    return `<article class="audit-item"><span class="audit-marker"></span><div><strong>${esc(actionLabel)}${entry.old_status ? ` · ${esc(statusNames[entry.old_status])} → ${esc(statusNames[entry.new_status])}` : ''}</strong><time>${dateLabel(entry.created_at)} · ${esc(entry.actor || 'Sistem')}</time>${beforeAfter ? `<details><summary>Lihat snapshot perubahan</summary><pre>${esc(JSON.stringify({ sebelum: entry.old_values, sesudah: entry.new_values }, null, 2))}</pre></details>` : ''}</div></article>`;
  });
  document.querySelector('#audit-content').innerHTML = records.length ? `<div class="audit-list">${records.join('')}</div>` : emptyState('Belum ada riwayat audit', 'Jejak perubahan dibuat saat payroll tersimpan atau statusnya berubah. Jalankan pembaruan schema.sql jika tabel audit baru ditambahkan.');
  document.querySelector('#audit-modal').showModal();
}

function payrollSlipMarkup(record) {
  const employee = record.employees || {};
  return `<article class="slip-paper"><header class="slip-brand"><strong>PAYROLLY</strong><span>SLIP GAJI · ${esc(monthLabel(record.period_month))}</span></header><div class="slip-employee"><div class="slip-field"><span>Nama karyawan</span><strong>${esc(employee.full_name || '-')}</strong></div><div class="slip-field"><span>Nomor karyawan</span><strong>${esc(employee.employee_number || '-')}</strong></div><div class="slip-field"><span>Jabatan</span><strong>${esc(employee.positions?.name || '-')}</strong></div><div class="slip-field"><span>Status payroll</span><strong>${esc(statusNames[record.status] || record.status)}</strong></div></div><table class="slip-lines"><tbody><tr><td>Gaji pokok</td><td>${money(record.base_salary)}</td></tr><tr><td>Pembayaran lembur <span class="cell-secondary">${Number(record.overtime_hours).toLocaleString('id-ID')} jam</span></td><td>${money(record.overtime_pay)}</td></tr><tr><td>Potongan alpha <span class="cell-secondary">${record.absence_days} hari</span></td><td>- ${money(record.deduction)}</td></tr></tbody></table><div class="slip-total"><span>GAJI BERSIH</span><strong>${money(record.total_net)}</strong></div><p class="slip-note">Gaji bersih = gaji pokok + pembayaran lembur - potongan. Dokumen ini diterbitkan secara digital oleh PAYROLLY.</p></article>`;
}

function openPayrollSlip(id) {
  const record = state.payrollRecords.find((item) => item.id === id);
  if (!record) throw new Error('Data payroll tidak ditemukan. Muat ulang halaman.');
  document.querySelector('#slip-title').textContent = `Slip gaji · ${record.employees?.full_name || 'Karyawan'}`;
  document.querySelector('#slip-content').innerHTML = payrollSlipMarkup(record);
  document.querySelector('#slip-modal').showModal();
}

function requestConfirmation(message, title = 'Konfirmasi tindakan', actionLabel = 'Lanjutkan') {
  document.querySelector('#confirm-title').textContent = title;
  document.querySelector('#confirm-message').textContent = message;
  document.querySelector('#confirm-accept').textContent = actionLabel;
  confirmModal.showModal();
  return new Promise((resolve) => { state.confirmResolver = resolve; });
}

function settleConfirmation(confirmed) {
  if (confirmModal.open) confirmModal.close();
  const resolve = state.confirmResolver;
  state.confirmResolver = null;
  resolve?.(confirmed);
}

function printPayrollSlip() {
  const slip = document.querySelector('#slip-content .slip-paper');
  if (!slip) return notify('Buka slip gaji terlebih dahulu.', 'error');
  const printRoot = document.querySelector('#print-root');
  printRoot.replaceChildren(slip.cloneNode(true));
  printRoot.hidden = false;
  document.querySelector('#slip-modal').close();
  document.body.classList.add('printing-slip');
  window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing-slip');
    printRoot.hidden = true;
    printRoot.replaceChildren();
  }, { once: true });
  window.setTimeout(() => window.print(), 100);
}

function field(label, name, type = 'text', value = '', options = {}) {
  const required = options.required === false ? '' : 'required';
  const full = options.full ? ' full' : '';
  const hint = options.hint ? `<span class="field-hint">${esc(options.hint)}</span>` : '';
  let control;
  if (options.choices) {
    control = `<select class="field-control field-select" id="field-${name}" name="${name}" ${required}>${options.choices.map((choice) => `<option value="${esc(choice.value)}" ${String(value) === String(choice.value) ? 'selected' : ''}>${esc(choice.label)}</option>`).join('')}</select>`;
  } else {
    control = `<input class="field-control" id="field-${name}" name="${name}" type="${type}" value="${esc(value)}" ${required} ${options.min !== undefined ? `min="${options.min}"` : ''} ${options.max !== undefined ? `max="${options.max}"` : ''} ${options.step ? `step="${options.step}"` : ''} ${options.placeholder ? `placeholder="${esc(options.placeholder)}"` : ''} ${options.autocomplete ? `autocomplete="${options.autocomplete}"` : ''}>`;
  }
  return `<div class="field${full}"><label for="field-${name}">${label}</label>${control}${hint}</div>`;
}

async function openForm(kind, id = null, initial = {}) {
  state.editing = id ? { kind, id } : null;
  state.submitting = false;
  const record = id ? await loadRecord(kind, id) : null;
  const fields = [];
  let title = 'Tambah data';
  if (kind === 'position') {
    title = record ? 'Ubah jabatan' : 'Tambah jabatan';
    fields.push(field('Nama jabatan', 'name', 'text', record?.name || '', { placeholder: 'Contoh: Operator Cetak', autocomplete: 'organization-title' }));
    fields.push(field('Gaji pokok per bulan', 'base_salary', 'number', record?.base_salary || '', { min: '1', step: '1000', placeholder: '4500000', hint: 'Masukkan nominal dalam rupiah.' }));
  }
  if (kind === 'employee') {
    const positions = await api('positions');
    title = record ? 'Ubah data karyawan' : 'Tambah karyawan';
    const choices = positions.map((item) => ({ value: item.id, label: `${item.name} · ${money(item.base_salary)}` }));
    fields.push(field('Nomor karyawan', 'employee_number', 'text', record?.employee_number || '', { placeholder: 'EMP-001', autocomplete: 'off' }));
    fields.push(field('Nama lengkap', 'full_name', 'text', record?.full_name || '', { autocomplete: 'name' }));
    fields.push(field('Jabatan', 'position_id', 'select', record?.position_id || record?.positions?.id || '', { choices: [{ value: '', label: 'Pilih jabatan' }, ...choices] }));
    fields.push(field('Nomor telepon', 'phone', 'tel', record?.phone || '', { required: false, placeholder: '08xxxxxxxxxx', autocomplete: 'tel' }));
    fields.push(field('Tanggal mulai bekerja', 'start_date', 'date', record?.start_date || new Date().toISOString().slice(0, 10)));
    fields.push(field('Status karyawan', 'active', 'select', String(record?.active ?? true), { choices: [{ value: 'true', label: 'Aktif' }, { value: 'false', label: 'Nonaktif' }] }));
  }
  if (kind === 'attendance') {
    const employees = await api('employees');
    title = record ? 'Ubah absensi' : 'Catat absensi';
    const choices = employees.filter((item) => item.active).map((item) => ({ value: item.id, label: `${item.employee_number} · ${item.full_name}` }));
    fields.push(field('Karyawan', 'employee_id', 'select', record?.employee_id || initial.employee_id || '', { choices: [{ value: '', label: 'Pilih karyawan' }, ...choices], full: true }));
    fields.push(field('Tanggal', 'attendance_date', 'date', record?.attendance_date || initial.attendance_date || new Date().toISOString().slice(0, 10)));
    fields.push(field('Status kehadiran', 'status', 'select', record?.status || 'present', { choices: [{ value: 'present', label: 'Hadir' }, { value: 'leave', label: 'Izin' }, { value: 'sick', label: 'Sakit' }, { value: 'alpha', label: 'Alpha' }] }));
    fields.push(field('Jam lembur', 'overtime_hours', 'number', record?.overtime_hours ?? 0, { min: '0', max: '24', step: '0.25', hint: 'Isi 0 bila tidak ada lembur.' }));
  }
  document.querySelector('#modal-title').textContent = title;
  document.querySelector('#submit-label').textContent = record ? 'Simpan perubahan' : 'Simpan data';
  document.querySelector('#modal-fields').innerHTML = `<div class="form-grid">${fields.join('')}</div>`;
  modal.showModal();
  document.querySelector('#modal-fields input, #modal-fields select')?.focus();
}

async function loadRecord(kind, id) {
  const endpoints = { position: 'positions', employee: 'employees', attendance: 'attendance' };
  const rows = await api(endpoints[kind]);
  const record = rows.find((item) => item.id === id);
  if (!record) throw new Error('Data tidak ditemukan. Muat ulang halaman lalu coba lagi.');
  return record;
}

function closeModal() {
  modal.close();
  state.editing = null;
}

function openCommandPalette() {
  if (modal.open || commandPalette.open) return;
  commandQuery.value = '';
  filterCommands('');
  commandPalette.showModal();
  commandQuery.focus();
}

function filterCommands(query) {
  const normalized = query.trim().toLowerCase();
  const items = [...document.querySelectorAll('.command-item')];
  let firstVisible = null;
  for (const item of items) {
    const visible = !normalized || `${item.textContent} ${item.dataset.search}`.toLowerCase().includes(normalized);
    item.hidden = !visible;
    item.classList.remove('selected');
    if (visible && !firstVisible) firstVisible = item;
  }
  firstVisible?.classList.add('selected');
  document.querySelector('#command-empty').hidden = Boolean(firstVisible);
}

function moveCommandSelection(direction) {
  const items = [...document.querySelectorAll('.command-item:not([hidden])')];
  if (!items.length) return;
  const selectedIndex = items.findIndex((item) => item.classList.contains('selected'));
  const nextIndex = (selectedIndex + direction + items.length) % items.length;
  items.forEach((item, index) => item.classList.toggle('selected', index === nextIndex));
  items[nextIndex].focus();
}

document.querySelectorAll('.nav-link').forEach((button) => button.addEventListener('click', () => navigateTo(button.dataset.page)));
document.querySelector('#menu-toggle').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('open'));
themeToggle.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => document.querySelector(`#${button.dataset.closeDialog}`).close()));
document.querySelectorAll('[data-confirm-cancel]').forEach((button) => button.addEventListener('click', () => settleConfirmation(false)));
document.querySelector('#confirm-accept').addEventListener('click', () => settleConfirmation(true));
confirmModal.addEventListener('cancel', (event) => { event.preventDefault(); settleConfirmation(false); });
document.querySelector('#save-preview').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  if (!state.preview || !state.preview.summary.draftCount) return;
  button.disabled = true;
  try {
    const result = await api('payroll/generate', { method: 'POST', body: { period_month: state.preview.period_month } });
    document.querySelector('#review-modal').close();
    notify(`${result.count} payroll draft berhasil disimpan.${result.skipped_paid ? ` ${result.skipped_paid} payroll yang sudah dibayar tetap aman.` : ''}`);
    await render('payroll');
  } catch (error) {
    showError(error);
  } finally {
    button.disabled = !state.preview?.summary.draftCount;
  }
});
document.querySelector('#command-trigger').addEventListener('click', openCommandPalette);
commandPalette.addEventListener('click', (event) => { if (event.target === commandPalette) commandPalette.close(); });
commandQuery.addEventListener('input', () => filterCommands(commandQuery.value));
commandQuery.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    commandPalette.close();
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    moveCommandSelection(1);
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    moveCommandSelection(-1);
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    document.querySelector('.command-item.selected:not([hidden])')?.click();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.target.matches('[data-action][role="button"]') && ['Enter', ' '].includes(event.key)) {
    event.preventDefault();
    event.target.click();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openCommandPalette();
  }
});
document.querySelectorAll('[data-command]').forEach((button) => button.addEventListener('click', async () => {
  const { command, target } = button.dataset;
  commandPalette.close();
  if (command === 'page') return navigateTo(target);
  try {
    if (target === 'add-employee') return await openForm('employee');
    if (target === 'add-attendance') return await openForm('attendance');
    if (target === 'preview-payroll') return await openPayrollReview(monthInputValue());
  } catch (error) {
    showError(error);
  }
}));
document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', closeModal));
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });

document.querySelector('#record-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.submitting) return;
  const form = new FormData(event.currentTarget);
  const kind = state.editing?.kind || (state.page === 'positions' ? 'position' : state.page === 'employees' ? 'employee' : 'attendance');
  const payload = Object.fromEntries(form.entries());
  const wasEditing = Boolean(state.editing);
  if (kind === 'position') payload.base_salary = Number(payload.base_salary);
  if (kind === 'employee') payload.active = payload.active === 'true';
  if (kind === 'attendance') {
    payload.overtime_hours = Number(payload.overtime_hours);
    if (!payload.employee_id) return notify('Pilih karyawan terlebih dahulu.', 'error');
  }
  state.submitting = true;
  const submit = event.currentTarget.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    const endpoint = { position: 'positions', employee: 'employees', attendance: 'attendance' }[kind];
    const suffix = state.editing ? `/${state.editing.id}` : '';
    await api(`${endpoint}${suffix}`, { method: state.editing ? 'PATCH' : 'POST', body: payload });
    closeModal();
    notify(wasEditing ? 'Perubahan berhasil disimpan.' : 'Data berhasil ditambahkan.');
    await render(state.page);
  } catch (error) {
    showError(error);
  } finally {
    state.submitting = false;
    submit.disabled = false;
  }
});

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  try {
    if (action === 'add-position') return await openForm('position');
    if (action === 'edit-position') return await openForm('position', id);
    if (action === 'add-employee') return await openForm('employee');
    if (action === 'edit-employee') return await openForm('employee', id);
    if (action === 'add-attendance') return await openForm('attendance');
    if (action === 'edit-attendance') return await openForm('attendance', id);
    if (action === 'refresh') return await render(state.page);
    if (action === 'goto-payroll') return await navigateTo('payroll');
    if (action === 'goto-attendance') return await navigateTo('attendance');
    if (action === 'goto-employees') return await navigateTo('employees');
    if (action === 'goto-active-employees') return await navigateTo('employees', { active: 'true' });
    if (action === 'filter-draft-payroll') return await navigateTo('payroll', { period: button.dataset.period || monthInputValue(), status: 'draft' });
    if (action === 'filter-missing-attendance') return await navigateTo('attendance', { period: button.dataset.period || monthInputValue(), missing: '1' });
    if (action === 'filter-alpha-attendance') return await navigateTo('attendance', { period: button.dataset.period || monthInputValue(), status: 'alpha' });
    if (action === 'filter-overtime-attendance') return await navigateTo('attendance', { period: button.dataset.period || monthInputValue(), overtime: '1' });
    if (action === 'filter-attendance') return await navigateTo('attendance', { period: button.dataset.period || monthInputValue(), status: button.dataset.status || 'all' });
    if (action === 'toggle-missing') {
      const period = document.querySelector('#attendance-period')?.value || monthInputValue();
      return await navigateTo('attendance', button.dataset.missing === 'true' ? { period } : { period, missing: '1' });
    }
    if (action === 'record-missing') return await openForm('attendance', null, { employee_id: id, attendance_date: button.dataset.date });
    if (action === 'preview-payroll') return await openPayrollReview(document.querySelector('#period-filter')?.value || monthInputValue());
    if (action === 'employee-profile') return await openEmployeeProfile(id);
    if (action === 'view-slip') return openPayrollSlip(id);
    if (action === 'view-audit') return await openPayrollAudit(id);
    if (action === 'print-slip') return printPayrollSlip();
    if (action === 'review-employee-profile') {
      document.querySelector('#review-modal').close();
      return await openEmployeeProfile(id);
    }
    if (action === 'review-missing-attendance') {
      document.querySelector('#review-modal').close();
      return await navigateTo('attendance', { period: button.dataset.period || monthInputValue(), missing: '1' });
    }
    if (action === 'delete-position') {
      if (!await requestConfirmation('Hapus jabatan ini? Jabatan yang masih digunakan karyawan tidak dapat dihapus.', 'Hapus jabatan', 'Hapus jabatan')) return;
      await api(`positions/${id}`, { method: 'DELETE' });
      notify('Jabatan berhasil dihapus.');
      return await render('positions');
    }
    if (action === 'toggle-employee') {
      const active = button.dataset.active === 'true';
      if (active && !await requestConfirmation('Nonaktifkan karyawan ini? Data absensi dan payroll tetap tersimpan.', 'Nonaktifkan karyawan', 'Nonaktifkan')) return;
      await api(`employees/${id}`, { method: 'PATCH', body: { active: !active } });
      notify(active ? 'Karyawan dinonaktifkan.' : 'Karyawan diaktifkan kembali.');
      return await render('employees');
    }
    if (action === 'delete-attendance') {
      if (!await requestConfirmation('Hapus catatan absensi ini?', 'Hapus absensi', 'Hapus catatan')) return;
      await api(`attendance/${id}`, { method: 'DELETE' });
      notify('Catatan absensi dihapus.');
      return await render('attendance');
    }
    if (action === 'generate-payroll') {
      const period = document.querySelector('#period-filter')?.value || monthInputValue();
      const result = await api('payroll/generate', { method: 'POST', body: { period_month: `${period}-01` } });
      notify(result.count ? `${result.count} payroll berhasil dihitung.${result.skipped_paid ? ` ${result.skipped_paid} payroll berstatus dibayar tidak diubah.` : ''}` : 'Tidak ada karyawan aktif yang dapat dihitung.');
      return await render('payroll');
    }
    if (action === 'mark-paid') {
      if (!await requestConfirmation('Tandai payroll ini sebagai sudah dibayar? Payroll berstatus dibayar tidak dapat dihitung ulang.', 'Tandai sudah dibayar', 'Tandai dibayar')) return;
      await api(`payroll/${id}/paid`, { method: 'PATCH', body: {} });
      notify('Payroll ditandai sudah dibayar.');
      return await render('payroll');
    }
    if (action === 'report-all') {
      history.replaceState(null, '', `${location.pathname}?period=all`);
      return await render('reports');
    }
    if (action === 'print-report') return window.print();
  } catch (error) {
    showError(error);
  }
});

document.addEventListener('change', async (event) => {
  if (event.target.id === 'period-filter') {
    const value = event.target.value;
    if (!value) return;
    updateQuery('period', value);
    await render('payroll');
  }
  if (event.target.id === 'payroll-status') {
    updateQuery('status', event.target.value === 'all' ? '' : event.target.value);
    await render('payroll');
  }
  if (event.target.id === 'employee-filter') {
    updateQuery('active', event.target.value === 'all' ? '' : event.target.value);
    await render('employees');
  }
  if (event.target.id === 'attendance-period') {
    updateQuery('period', event.target.value);
    await render('attendance');
  }
  if (event.target.id === 'attendance-status') {
    updateQuery('status', event.target.value === 'all' ? '' : event.target.value);
    await render('attendance');
  }
  if (event.target.id === 'overtime-only') {
    updateQuery('overtime', event.target.checked ? '1' : '');
    await render('attendance');
  }
  if (event.target.id === 'report-period') {
    const value = event.target.value;
    updateQuery('period', value);
    await render('reports');
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id !== 'table-search') return;
  const params = new URLSearchParams(location.search);
  if (event.target.value) params.set('q', event.target.value);
  else params.delete('q');
  history.replaceState(null, '', params.size ? `?${params}` : location.pathname);
  const selection = event.target.value;
  window.clearTimeout(state.searchTimer);
  state.searchTimer = window.setTimeout(async () => {
    const cursor = selection.length;
    await render(state.page);
    const search = document.querySelector('#table-search');
    if (search) { search.focus(); search.setSelectionRange(cursor, cursor); }
  }, 220);
});

api('health').then((health) => setConnection(health.configured)).catch(() => setConnection(false));
const savedTheme = localStorage.getItem('payrolly-theme');
const preferredTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(preferredTheme, false);
render();