const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://vcwrbgnhwddtdptfofcl.supabase.co').replace(/\/$/, '');
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_2O9jutNo02owmqkG8z1sIQ_HH3UKAOs';
const PUBLIC_DIR = path.join(__dirname, 'public');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function configured() {
  return !SUPABASE_URL.includes('YOUR_PROJECT_REF') && !SUPABASE_PUBLISHABLE_KEY.includes('REPLACE_WITH_YOUR_KEY');
}

async function supabase(table, options = {}) {
  if (!configured()) {
    throw new HttpError(503, 'Konfigurasikan Project URL dan Publishable Key Supabase di app.js terlebih dahulu.');
  }

  const endpoint = new URL(`/rest/v1/${table}`, SUPABASE_URL);
  for (const [key, value] of Object.entries(options.params || {})) endpoint.searchParams.set(key, value);
  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    Accept: 'application/json',
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.prefer) headers.Prefer = options.prefer;

  let response;
  try {
    response = await fetch(endpoint, {
      method: options.method || 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new HttpError(502, 'Tidak dapat terhubung ke Supabase. Periksa Project URL dan koneksi internet.');
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) {
    const message = data && typeof data === 'object' ? data.message || data.details || data.hint : data;
    throw new HttpError(response.status, message || `Supabase mengembalikan status ${response.status}.`);
  }
  return data;
}

function send(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(data));
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 100_000) throw new HttpError(413, 'Ukuran data terlalu besar.');
  }
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new HttpError(400, 'Format JSON tidak valid.');
  }
}

function requiredString(value, label, max = 120) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new HttpError(400, `${label} wajib diisi (maksimal ${max} karakter).`);
  }
  return value.trim();
}

function positiveNumber(value, label, allowZero = false) {
  const number = Number(value);
  if (!Number.isFinite(number) || (allowZero ? number < 0 : number <= 0)) {
    throw new HttpError(400, `${label} harus berupa angka ${allowZero ? 'nol atau lebih' : 'lebih dari nol'}.`);
  }
  return number;
}

function validDate(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, `${label} harus menggunakan tanggal yang valid.`);
  }
  return value;
}

function validPeriod(value) {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])-01$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new HttpError(400, 'Periode harus menggunakan format bulan yang valid.');
  }
  return value;
}

function countWeekdays(startDate, endDate) {
  if (startDate > endDate) return 0;
  let count = 0;
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (current <= end) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return count;
}

function weekdayDates(startDate, endDate) {
  if (startDate > endDate) return [];
  const dates = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (current <= end) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

async function calculatePayrollPreview(periodValue) {
  const period = validPeriod(periodValue);
  const monthStart = new Date(`${period}T00:00:00Z`);
  const nextMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
  const end = nextMonth.toISOString().slice(0, 10);
  const endOfMonth = new Date(nextMonth.getTime() - 86_400_000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = `${today.slice(0, 7)}-01`;
  const cutoff = period === currentMonth ? today : period < currentMonth ? endOfMonth : `${period.slice(0, 7)}-00`;
  const previousMonthDate = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1));
  const previousPeriod = `${previousMonthDate.toISOString().slice(0, 7)}-01`;
  const [employees, attendance, existing, previous] = await Promise.all([
    supabase('employees', { params: { select: 'id,employee_number,full_name,start_date,positions(id,name,base_salary)', active: 'eq.true', order: 'full_name.asc' } }),
    supabase('attendance', { params: { select: 'employee_id,attendance_date,status,overtime_hours', attendance_date: `gte.${period}`, and: `(attendance_date.lt.${end})`, order: 'attendance_date.asc', limit: '10000' } }),
    supabase('payroll', { params: { select: 'id,employee_id,status,base_salary,total_net', period_month: `eq.${period}` } }),
    supabase('payroll', { params: { select: 'employee_id,total_net,base_salary', period_month: `eq.${previousPeriod}` } }),
  ]);
  const existingByEmployee = new Map(existing.map((record) => [record.employee_id, record]));
  const previousByEmployee = new Map(previous.map((record) => [record.employee_id, record]));
  const records = employees.map((employee) => {
    const rows = attendance.filter((row) => row.employee_id === employee.id);
    const salary = Number(employee.positions.base_salary);
    const overtimeHours = rows.reduce((sum, row) => sum + Number(row.overtime_hours), 0);
    const absenceDays = rows.filter((row) => row.status === 'alpha').length;
    const overtimePay = Math.round((salary / 173) * 1.5 * overtimeHours);
    const monthDays = new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), 0)).getUTCDate();
    const workingDays = countWeekdays(period, endOfMonth);
    const deduction = Math.round((salary / Math.max(workingDays, 1)) * absenceDays);
    const totalNet = Math.max(0, salary + overtimePay - deduction);
    const existingRecord = existingByEmployee.get(employee.id);
    const previousRecord = previousByEmployee.get(employee.id);
    const expectedDays = cutoff < period ? 0 : countWeekdays(employee.start_date > period ? employee.start_date : period, cutoff);
    const missingDays = Math.max(0, expectedDays - rows.filter((row) => row.attendance_date <= cutoff).length);
    const alerts = [];

    if (existingRecord?.status === 'paid') alerts.push({ severity: 'info', code: 'already_paid', message: 'Payroll periode ini sudah dibayar dan tidak akan diubah.' });
    if (missingDays > 0) alerts.push({ severity: missingDays > 3 ? 'warning' : 'info', code: 'missing_attendance', message: `${missingDays} hari kerja belum memiliki catatan absensi.` });
    if (overtimeHours > 40) alerts.push({ severity: 'warning', code: 'high_overtime', message: `Lembur ${overtimeHours} jam melebihi ambang review 40 jam.` });
    if (absenceDays > 3) alerts.push({ severity: 'warning', code: 'high_absence', message: `${absenceDays} hari alpha; periksa kembali catatan absensi.` });
    if (previousRecord && Number(previousRecord.total_net) > 0 && Math.abs(totalNet - Number(previousRecord.total_net)) / Number(previousRecord.total_net) > .25) {
      alerts.push({ severity: 'warning', code: 'pay_change', message: 'Gaji bersih berubah lebih dari 25% dibanding periode sebelumnya.' });
    }
    if (existingRecord && Number(existingRecord.base_salary) !== salary) alerts.push({ severity: 'info', code: 'salary_changed', message: 'Gaji pokok jabatan berubah sejak draft payroll terakhir.' });

    return {
      employee_id: employee.id,
      employee_number: employee.employee_number,
      full_name: employee.full_name,
      position_name: employee.positions.name,
      period_month: period,
      base_salary: salary,
      overtime_hours: overtimeHours,
      overtime_pay: overtimePay,
      absence_days: absenceDays,
      deduction,
      total_net: totalNet,
      expected_attendance_days: expectedDays,
      missing_attendance_days: missingDays,
      status: existingRecord?.status || 'draft',
      existing_payroll_id: existingRecord?.id || null,
      alerts,
      days_in_month: monthDays,
    };
  });
  const writableRecords = records.filter((record) => record.status !== 'paid').map((record) => ({
    employee_id: record.employee_id,
    period_month: record.period_month,
    base_salary: record.base_salary,
    overtime_hours: record.overtime_hours,
    overtime_pay: record.overtime_pay,
    absence_days: record.absence_days,
    deduction: record.deduction,
    total_net: record.total_net,
    status: 'draft',
  }));
  const summary = records.reduce((totals, record) => {
    totals.baseSalary += record.base_salary;
    totals.overtimePay += record.overtime_pay;
    totals.deductions += record.deduction;
    totals.netTotal += record.total_net;
    totals.paidCount += record.status === 'paid' ? 1 : 0;
    totals.draftCount += record.status === 'paid' ? 0 : 1;
    totals.warningCount += record.alerts.filter((alert) => alert.severity === 'warning').length;
    totals.missingAttendance += record.missing_attendance_days;
    totals.overtimeHours += record.overtime_hours;
    return totals;
  }, { count: records.length, baseSalary: 0, overtimePay: 0, deductions: 0, netTotal: 0, paidCount: 0, draftCount: 0, warningCount: 0, missingAttendance: 0, overtimeHours: 0 });
  return { period_month: period, records, writableRecords, summary, valid: true };
}

function employeePayload(body, partial = false) {
  const payload = {};
  if (!partial || 'employee_number' in body) payload.employee_number = requiredString(body.employee_number, 'Nomor karyawan', 40);
  if (!partial || 'full_name' in body) payload.full_name = requiredString(body.full_name, 'Nama lengkap', 120);
  if (!partial || 'position_id' in body) payload.position_id = requiredString(body.position_id, 'Jabatan', 60);
  if (!partial || 'phone' in body) payload.phone = body.phone === '' || body.phone == null ? null : requiredString(body.phone, 'Nomor telepon', 30);
  if (!partial || 'start_date' in body) payload.start_date = validDate(body.start_date, 'Tanggal mulai bekerja');
  if ('active' in body) payload.active = Boolean(body.active);
  return payload;
}

function attendancePayload(body, partial = false) {
  const payload = {};
  if (!partial || 'employee_id' in body) payload.employee_id = requiredString(body.employee_id, 'Karyawan', 60);
  if (!partial || 'attendance_date' in body) payload.attendance_date = validDate(body.attendance_date, 'Tanggal absensi');
  if (!partial || 'status' in body) {
    if (!['present', 'leave', 'sick', 'alpha'].includes(body.status)) throw new HttpError(400, 'Status absensi tidak valid.');
    payload.status = body.status;
  }
  if (!partial || 'overtime_hours' in body) payload.overtime_hours = positiveNumber(body.overtime_hours, 'Jam lembur', true);
  if (payload.overtime_hours > 24) throw new HttpError(400, 'Jam lembur tidak boleh lebih dari 24 jam per hari.');
  return payload;
}

async function routeApi(request, response, url) {
  const segments = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const [resource, id, action] = segments;
  const method = request.method;
  const body = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) ? await readBody(request) : {};

  if (resource === 'health' && method === 'GET') {
    await supabase('positions', { params: { select: 'id', limit: '1' } });
    return send(response, 200, { ok: true, configured: true });
  }

  if (resource === 'dashboard' && method === 'GET') {
    const period = url.searchParams.get('period') || `${new Date().toISOString().slice(0, 7)}-01`;
    validPeriod(period);
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date(`${period}T00:00:00Z`);
    const nextMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
    const endOfMonth = new Date(nextMonth.getTime() - 86_400_000).toISOString().slice(0, 10);
    const cutoff = period.slice(0, 7) === today.slice(0, 7) ? today : period > `${today.slice(0, 7)}-01` ? null : endOfMonth;
    const [employees, payroll, attendance] = await Promise.all([
      supabase('employees', { params: { select: 'id,active,start_date,full_name' } }),
      supabase('payroll', { params: { select: 'employee_id,total_net,status,created_at,employees(full_name)', period_month: `eq.${period}` } }),
      cutoff ? supabase('attendance', { params: { select: 'employee_id,attendance_date,status,overtime_hours,created_at', attendance_date: `gte.${period}`, and: `(attendance_date.lte.${cutoff})`, order: 'attendance_date.desc', limit: '10000' } }) : Promise.resolve([]),
    ]);
    const activeEmployees = employees.filter((employee) => employee.active);
    const activeCount = activeEmployees.length;
    const paid = payroll.filter((row) => row.status === 'paid');
    const attendanceSummary = { present: 0, leave: 0, sick: 0, alpha: 0, recorded: attendance.length, expected: 0, missing: 0 };
    for (const row of attendance) attendanceSummary[row.status] += 1;
    if (cutoff) {
      attendanceSummary.expected = activeEmployees.reduce((total, employee) => total + countWeekdays(employee.start_date > period ? employee.start_date : period, cutoff), 0);
      attendanceSummary.missing = Math.max(0, attendanceSummary.expected - attendanceSummary.recorded);
    }
    const overtimeHours = attendance.reduce((total, row) => total + Number(row.overtime_hours), 0);
    const reviewAlerts = [];
    if (attendanceSummary.missing > 0) reviewAlerts.push({ type: 'attendance', severity: attendanceSummary.missing > 3 ? 'warning' : 'info', count: attendanceSummary.missing, message: `${attendanceSummary.missing} hari kerja belum memiliki catatan absensi.` });
    if (attendanceSummary.alpha > 0) reviewAlerts.push({ type: 'absence', severity: 'warning', count: attendanceSummary.alpha, message: `${attendanceSummary.alpha} catatan alpha perlu diperiksa.` });
    if (overtimeHours > 40) reviewAlerts.push({ type: 'overtime', severity: 'warning', count: overtimeHours, message: `Total lembur ${overtimeHours} jam melewati ambang review.` });
    if (payroll.some((row) => row.status === 'draft')) reviewAlerts.push({ type: 'payroll', severity: 'info', count: payroll.filter((row) => row.status === 'draft').length, message: 'Payroll draft menunggu review dan pembayaran.' });
    const activities = [
      ...payroll.map((row) => ({ type: 'payroll', label: `Payroll ${row.status === 'paid' ? 'dibayar' : 'dibuat'} untuk ${row.employees?.full_name || 'karyawan'}`, date: row.created_at })),
      ...attendance.slice(0, 8).map((row) => ({ type: 'attendance', label: `Absensi ${row.status} dicatat`, date: row.created_at || row.attendance_date })),
    ].sort((left, right) => String(right.date || '').localeCompare(String(left.date || ''))).slice(0, 5);
    return send(response, 200, {
      employees: employees.length,
      activeEmployees: activeCount,
      payrollTotal: payroll.reduce((sum, row) => sum + Number(row.total_net), 0),
      paidTotal: paid.reduce((sum, row) => sum + Number(row.total_net), 0),
      payrollCount: payroll.length,
      paidCount: paid.length,
      draftCount: payroll.length - paid.length,
      period,
      attendance: attendanceSummary,
      overtimeHours,
      reviewAlerts,
      activities,
    });
  }

  if (resource === 'positions') {
    if (method === 'GET') return send(response, 200, await supabase('positions', { params: { select: '*', order: 'name.asc' } }));
    if (method === 'POST') {
      const payload = {
        name: requiredString(body.name, 'Nama jabatan', 80),
        base_salary: positiveNumber(body.base_salary, 'Gaji pokok'),
      };
      return send(response, 201, await supabase('positions', { method: 'POST', body: payload, prefer: 'return=representation' }));
    }
    if (id && method === 'PATCH') {
      const payload = {};
      if ('name' in body) payload.name = requiredString(body.name, 'Nama jabatan', 80);
      if ('base_salary' in body) payload.base_salary = positiveNumber(body.base_salary, 'Gaji pokok');
      if (!Object.keys(payload).length) throw new HttpError(400, 'Tidak ada perubahan untuk disimpan.');
      return send(response, 200, await supabase('positions', { method: 'PATCH', params: { id: `eq.${id}` }, body: payload, prefer: 'return=representation' }));
    }
    if (id && method === 'DELETE') {
      const employees = await supabase('employees', { params: { select: 'id', position_id: `eq.${id}`, limit: '1' } });
      if (employees.length) throw new HttpError(409, 'Jabatan masih digunakan karyawan dan tidak dapat dihapus.');
      await supabase('positions', { method: 'DELETE', params: { id: `eq.${id}` } });
      return send(response, 200, { message: 'Jabatan dihapus.' });
    }
  }

  if (resource === 'employees') {
    if (id && action === 'profile' && method === 'GET') {
      const [matches, attendance, payroll] = await Promise.all([
        supabase('employees', { params: { select: '*,positions(id,name,base_salary)', id: `eq.${id}`, limit: '1' } }),
        supabase('attendance', { params: { select: 'attendance_date,status,overtime_hours', employee_id: `eq.${id}`, order: 'attendance_date.desc', limit: '1000' } }),
        supabase('payroll', { params: { select: '*', employee_id: `eq.${id}`, order: 'period_month.desc', limit: '120' } }),
      ]);
      const employee = matches[0];
      if (!employee) throw new HttpError(404, 'Karyawan tidak ditemukan.');
      const attendanceSummary = attendance.reduce((summary, row) => {
        summary[row.status] += 1;
        summary.overtimeHours += Number(row.overtime_hours);
        return summary;
      }, { present: 0, leave: 0, sick: 0, alpha: 0, overtimeHours: 0 });
      return send(response, 200, {
        employee,
        attendance: attendanceSummary,
        payroll: {
          count: payroll.length,
          totalNet: payroll.reduce((sum, row) => sum + Number(row.total_net), 0),
          paidCount: payroll.filter((row) => row.status === 'paid').length,
          records: payroll,
        },
        recentAttendance: attendance.slice(0, 12),
      });
    }
    if (method === 'GET') return send(response, 200, await supabase('employees', { params: { select: '*,positions(id,name,base_salary)', order: 'full_name.asc' } }));
    if (method === 'POST') return send(response, 201, await supabase('employees', { method: 'POST', body: employeePayload(body), prefer: 'return=representation' }));
    if (id && method === 'PATCH') return send(response, 200, await supabase('employees', { method: 'PATCH', params: { id: `eq.${id}` }, body: employeePayload(body, true), prefer: 'return=representation' }));
    if (id && method === 'DELETE') {
      return send(response, 200, await supabase('employees', { method: 'PATCH', params: { id: `eq.${id}` }, body: { active: false }, prefer: 'return=representation' }));
    }
  }

  if (resource === 'attendance') {
    if (id === 'missing' && method === 'GET') {
      const requestedPeriod = url.searchParams.get('period') || `${new Date().toISOString().slice(0, 7)}-01`;
      const period = /^\d{4}-\d{2}$/.test(requestedPeriod) ? `${requestedPeriod}-01` : validPeriod(requestedPeriod);
      validPeriod(period);
      const today = new Date().toISOString().slice(0, 10);
      const start = new Date(`${period}T00:00:00Z`);
      const nextMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
      const monthEnd = new Date(nextMonth.getTime() - 86_400_000).toISOString().slice(0, 10);
      const cutoff = period.slice(0, 7) === today.slice(0, 7) ? today : period > `${today.slice(0, 7)}-01` ? null : monthEnd;
      if (!cutoff) return send(response, 200, { period, count: 0, records: [] });
      const [employees, attendance] = await Promise.all([
        supabase('employees', { params: { select: 'id,employee_number,full_name,start_date,positions(name)', active: 'eq.true', order: 'full_name.asc' } }),
        supabase('attendance', { params: { select: 'employee_id,attendance_date', attendance_date: `gte.${period}`, and: `(attendance_date.lte.${cutoff})`, limit: '10000' } }),
      ]);
      const recorded = new Set(attendance.map((row) => `${row.employee_id}:${row.attendance_date}`));
      const records = employees.flatMap((employee) => weekdayDates(employee.start_date > period ? employee.start_date : period, cutoff)
        .filter((day) => !recorded.has(`${employee.id}:${day}`))
        .map((day) => ({ employee_id: employee.id, employee_number: employee.employee_number, full_name: employee.full_name, position_name: employee.positions?.name || '-', attendance_date: day })));
      return send(response, 200, { period, count: records.length, records });
    }
    if (method === 'GET') return send(response, 200, await supabase('attendance', { params: { select: '*,employees(id,employee_number,full_name)', order: 'attendance_date.desc', limit: '500' } }));
    if (method === 'POST') return send(response, 201, await supabase('attendance', { method: 'POST', body: attendancePayload(body), prefer: 'return=representation' }));
    if (id && method === 'PATCH') return send(response, 200, await supabase('attendance', { method: 'PATCH', params: { id: `eq.${id}` }, body: attendancePayload(body, true), prefer: 'return=representation' }));
    if (id && method === 'DELETE') {
      await supabase('attendance', { method: 'DELETE', params: { id: `eq.${id}` } });
      return send(response, 200, { message: 'Absensi dihapus.' });
    }
  }

  if (resource === 'payroll' && id === 'preview' && method === 'POST') {
    return send(response, 200, await calculatePayrollPreview(body.period_month));
  }

  if (resource === 'payroll' && !id && method === 'GET') {
    const params = { select: '*,employees(id,employee_number,full_name,positions(name))', order: 'period_month.desc,created_at.desc', limit: '1000' };
    if (url.searchParams.has('period')) params.period_month = `eq.${validPeriod(url.searchParams.get('period'))}`;
    return send(response, 200, await supabase('payroll', { params }));
  }

  if (resource === 'payroll' && id === 'generate' && method === 'POST') {
    const preview = await calculatePayrollPreview(body.period_month);
    if (!preview.writableRecords.length) {
      return send(response, 200, { ...preview, preview_records: preview.records, count: 0, skipped_paid: preview.summary.paidCount, records: [] });
    }
    const saved = await supabase('payroll', {
      method: 'POST',
      params: { on_conflict: 'employee_id,period_month' },
      body: preview.writableRecords,
      prefer: 'resolution=merge-duplicates,return=representation',
    });
    return send(response, 200, { ...preview, preview_records: preview.records, count: saved.length, skipped_paid: preview.summary.paidCount, records: saved });
  }

  if (resource === 'payroll' && id && action === 'paid' && method === 'PATCH') {
    const rows = await supabase('payroll', { method: 'PATCH', params: { id: `eq.${id}`, status: 'eq.draft' }, body: { status: 'paid', paid_at: new Date().toISOString() }, prefer: 'return=representation' });
    if (!rows.length) throw new HttpError(409, 'Payroll tidak ditemukan atau sudah dibayar.');
    return send(response, 200, rows);
  }

  if (resource === 'payroll' && id && action === 'audit' && method === 'GET') {
    return send(response, 200, await supabase('payroll_audit', { params: { select: '*', payroll_id: `eq.${id}`, order: 'created_at.desc', limit: '100' } }));
  }

  if (resource === 'reports' && method === 'GET') {
    const period = url.searchParams.get('period');
    const params = { select: '*,employees(employee_number,full_name,positions(name))', order: 'period_month.desc,employees(full_name).asc', limit: '1000' };
    if (period) params.period_month = `eq.${validPeriod(period)}`;
    const records = await supabase('payroll', { params });
    return send(response, 200, {
      period: period || 'all',
      count: records.length,
      baseSalary: records.reduce((sum, row) => sum + Number(row.base_salary), 0),
      overtimePay: records.reduce((sum, row) => sum + Number(row.overtime_pay), 0),
      deductions: records.reduce((sum, row) => sum + Number(row.deduction), 0),
      netTotal: records.reduce((sum, row) => sum + Number(row.total_net), 0),
      records,
    });
  }

  throw new HttpError(404, 'Endpoint tidak ditemukan.');
}

async function handle(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await routeApi(request, response, url);
    if (request.method !== 'GET' && request.method !== 'HEAD') throw new HttpError(405, 'Metode tidak didukung.');
    const requested = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    const filePath = path.resolve(PUBLIC_DIR, requested);
    if (!filePath.startsWith(`${PUBLIC_DIR}${path.sep}`) && filePath !== path.join(PUBLIC_DIR, 'index.html')) throw new HttpError(403, 'Akses ditolak.');
    const content = await fs.promises.readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; img-src 'self' data:; connect-src 'self'",
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    const status = error.code === 'ENOENT' ? 404 : error.status || 500;
    send(response, status, { error: error.code === 'ENOENT' ? 'File tidak ditemukan.' : error.message || 'Terjadi kesalahan pada server.' });
  }
}

http.createServer(handle).listen(PORT, () => {
  console.log(`PAYROLLY berjalan di http://localhost:${PORT}`);
  if (!configured()) console.log('Lengkapi SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY di app.js.');
});