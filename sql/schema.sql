create extension if not exists pgcrypto;

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 2 and 80),
  base_salary numeric(14, 2) not null check (base_salary > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_number text not null unique check (char_length(trim(employee_number)) between 1 and 40),
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  position_id uuid not null references public.positions(id) on update cascade on delete restrict,
  phone text check (phone is null or char_length(phone) <= 30),
  start_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on update cascade on delete restrict,
  attendance_date date not null,
  status text not null check (status in ('present', 'leave', 'sick', 'alpha')),
  overtime_hours numeric(6, 2) not null default 0 check (overtime_hours between 0 and 24),
  created_at timestamptz not null default now(),
  unique (employee_id, attendance_date)
);

create table if not exists public.payroll (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on update cascade on delete restrict,
  period_month date not null check (extract(day from period_month) = 1),
  base_salary numeric(14, 2) not null check (base_salary > 0),
  overtime_hours numeric(8, 2) not null default 0 check (overtime_hours >= 0),
  overtime_pay numeric(14, 2) not null default 0 check (overtime_pay >= 0),
  absence_days integer not null default 0 check (absence_days >= 0),
  deduction numeric(14, 2) not null default 0 check (deduction >= 0),
  total_net numeric(14, 2) not null check (total_net >= 0),
  status text not null default 'draft' check (status in ('draft', 'paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (employee_id, period_month),
  check ((status = 'paid' and paid_at is not null) or (status = 'draft' and paid_at is null)),
  check (total_net = greatest(0, base_salary + overtime_pay - deduction))
);

create table if not exists public.payroll_audit (
  id uuid primary key default gen_random_uuid(),
  payroll_id uuid not null references public.payroll(id) on update cascade on delete cascade,
  action text not null check (action in ('created', 'updated', 'status_changed')),
  old_status text,
  new_status text not null check (new_status in ('draft', 'paid')),
  old_values jsonb,
  new_values jsonb not null,
  actor text not null default 'prototype-user',
  created_at timestamptz not null default now()
);

create index if not exists employees_position_id_idx on public.employees(position_id);
create index if not exists attendance_employee_date_idx on public.attendance(employee_id, attendance_date desc);
create index if not exists attendance_date_idx on public.attendance(attendance_date desc);
create index if not exists payroll_period_status_idx on public.payroll(period_month desc, status);
create index if not exists payroll_employee_period_idx on public.payroll(employee_id, period_month desc);
create index if not exists payroll_audit_payroll_created_idx on public.payroll_audit(payroll_id, created_at desc);

create or replace function public.capture_payroll_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.payroll_audit (payroll_id, action, old_status, new_status, old_values, new_values, actor)
  values (
    new.id,
    case when tg_op = 'INSERT' then 'created' when old.status is distinct from new.status then 'status_changed' else 'updated' end,
    case when tg_op = 'INSERT' then null else old.status end,
    new.status,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new),
    coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), 'prototype-user')
  );
  return new;
end;
$$;

drop trigger if exists payroll_audit_capture on public.payroll;
create trigger payroll_audit_capture
after insert or update on public.payroll
for each row execute function public.capture_payroll_audit();

alter table public.positions enable row level security;
alter table public.employees enable row level security;
alter table public.attendance enable row level security;
alter table public.payroll enable row level security;
alter table public.payroll_audit enable row level security;

drop policy if exists "Prototype access positions" on public.positions;
create policy "Prototype access positions" on public.positions for all to anon using (true) with check (true);
drop policy if exists "Prototype access employees" on public.employees;
create policy "Prototype access employees" on public.employees for all to anon using (true) with check (true);
drop policy if exists "Prototype access attendance" on public.attendance;
create policy "Prototype access attendance" on public.attendance for all to anon using (true) with check (true);
drop policy if exists "Prototype access payroll" on public.payroll;
create policy "Prototype access payroll" on public.payroll for all to anon using (true) with check (true);
drop policy if exists "Prototype read payroll audit" on public.payroll_audit;
create policy "Prototype read payroll audit" on public.payroll_audit for select to anon using (true);

grant usage on schema public to anon;
grant select, insert, update, delete on public.positions, public.employees, public.attendance, public.payroll to anon;
grant select on public.payroll_audit to anon;

insert into public.positions (name, base_salary)
values
  ('Operator Cetak', 4500000),
  ('Desainer Grafis', 5000000),
  ('Finishing', 4000000),
  ('Administrasi', 4750000),
  ('Supervisor Produksi', 6500000)
on conflict (name) do nothing;

insert into public.employees (employee_number, full_name, position_id, phone, start_date, active)
select seed.employee_number, seed.full_name, positions.id, seed.phone, seed.start_date, true
from (values
  ('EMP-001', 'Andi Pratama', 'Operator Cetak', '081200000001', date '2023-02-06'),
  ('EMP-002', 'Siti Rahmawati', 'Desainer Grafis', '081200000002', date '2022-08-15'),
  ('EMP-003', 'Budi Santoso', 'Finishing', '081200000003', date '2024-01-08'),
  ('EMP-004', 'Dewi Lestari', 'Administrasi', '081200000004', date '2021-05-17'),
  ('EMP-005', 'Rizky Maulana', 'Supervisor Produksi', '081200000005', date '2020-11-02'),
  ('EMP-006', 'Nadia Putri', 'Operator Cetak', '081200000006', date '2023-07-10'),
  ('EMP-007', 'Fajar Hidayat', 'Finishing', '081200000007', date '2024-04-01'),
  ('EMP-008', 'Maya Anggraini', 'Desainer Grafis', '081200000008', date '2022-03-21')
) as seed(employee_number, full_name, position_name, phone, start_date)
join public.positions on positions.name = seed.position_name
on conflict (employee_number) do nothing;

insert into public.attendance (employee_id, attendance_date, status, overtime_hours)
select
  employees.id,
  workday.day::date,
  case
    when workday.day::date = date '2026-09-07' and employees.employee_number in ('EMP-006', 'EMP-008') then 'alpha'
    when workday.day::date = date '2026-09-21' and employees.employee_number = 'EMP-003' then 'alpha'
    when workday.day::date = date '2026-09-14' and employees.employee_number = 'EMP-005' then 'leave'
    when workday.day::date = date '2026-09-23' and employees.employee_number = 'EMP-002' then 'sick'
    else 'present'
  end,
  case
    when extract(day from workday.day) in (4, 11, 18, 25)
      and not (
        (workday.day::date = date '2026-09-07' and employees.employee_number in ('EMP-006', 'EMP-008'))
        or (workday.day::date = date '2026-09-21' and employees.employee_number = 'EMP-003')
        or (workday.day::date = date '2026-09-14' and employees.employee_number = 'EMP-005')
        or (workday.day::date = date '2026-09-23' and employees.employee_number = 'EMP-002')
      ) then 2
    else 0
  end
from public.employees
cross join generate_series(date '2026-09-01', date '2026-09-30', interval '1 day') as workday(day)
where employees.employee_number in ('EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006', 'EMP-007', 'EMP-008')
  and workday.day::date >= employees.start_date
  and extract(isodow from workday.day) between 1 and 5
on conflict (employee_id, attendance_date) do nothing;

with period_settings as (
  select date '2026-09-01' as period_month,
         (select count(*) from generate_series(date '2026-09-01', date '2026-09-30', interval '1 day') as calendar_day(day)
          where extract(isodow from calendar_day.day) between 1 and 5) as working_days
), attendance_totals as (
  select attendance.employee_id,
         coalesce(sum(attendance.overtime_hours), 0)::numeric(8, 2) as overtime_hours,
         count(*) filter (where attendance.status = 'alpha')::integer as absence_days
  from public.attendance
  cross join period_settings
  where attendance.attendance_date >= period_settings.period_month
    and attendance.attendance_date < period_settings.period_month + interval '1 month'
  group by attendance.employee_id
), calculated_payroll as (
  select employees.id as employee_id,
         period_settings.period_month,
         positions.base_salary,
         coalesce(attendance_totals.overtime_hours, 0)::numeric(8, 2) as overtime_hours,
         round((positions.base_salary / 173) * 1.5 * coalesce(attendance_totals.overtime_hours, 0), 2) as overtime_pay,
         coalesce(attendance_totals.absence_days, 0)::integer as absence_days,
         round((positions.base_salary / period_settings.working_days) * coalesce(attendance_totals.absence_days, 0), 2) as deduction
  from public.employees
  join public.positions on positions.id = employees.position_id
  cross join period_settings
  left join attendance_totals on attendance_totals.employee_id = employees.id
  where employees.active
    and employees.employee_number in ('EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006', 'EMP-007', 'EMP-008')
)
insert into public.payroll (
  employee_id, period_month, base_salary, overtime_hours, overtime_pay,
  absence_days, deduction, total_net, status, paid_at
)
select calculated_payroll.employee_id,
       calculated_payroll.period_month,
       calculated_payroll.base_salary,
       calculated_payroll.overtime_hours,
       calculated_payroll.overtime_pay,
       calculated_payroll.absence_days,
       calculated_payroll.deduction,
       greatest(0, calculated_payroll.base_salary + calculated_payroll.overtime_pay - calculated_payroll.deduction),
       case when employees.employee_number in ('EMP-001', 'EMP-004') then 'paid' else 'draft' end,
       case when employees.employee_number in ('EMP-001', 'EMP-004') then timestamptz '2026-09-28 09:00:00+07' else null end
from calculated_payroll
join public.employees on employees.id = calculated_payroll.employee_id
on conflict (employee_id, period_month) do nothing;