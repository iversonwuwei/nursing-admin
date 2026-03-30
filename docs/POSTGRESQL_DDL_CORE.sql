-- 养老数字化平台 PostgreSQL DDL 初稿
-- 版本: v1.0
-- 日期: 2026-03-29
-- 说明: 面向核心业务域的首批可执行表结构草案

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists tenant (
  id uuid primary key default gen_random_uuid(),
  tenant_code varchar(64) not null unique,
  tenant_name varchar(128) not null,
  status varchar(32) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id),
  organization_code varchar(64) not null unique,
  organization_name varchar(128) not null,
  organization_type varchar(32) not null default 'nursing_home',
  contact_phone varchar(32),
  address text,
  status varchar(32) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists branch (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organization(id),
  branch_code varchar(64) not null unique,
  branch_name varchar(128) not null,
  region varchar(128),
  status varchar(32) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists room (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id),
  room_code varchar(64) not null unique,
  room_name varchar(128) not null,
  floor_no integer,
  room_type varchar(32) not null,
  capacity integer not null default 1,
  status varchar(32) not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bed (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references room(id),
  bed_code varchar(64) not null unique,
  bed_label varchar(64) not null,
  status varchar(32) not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_user (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id),
  organization_id uuid references organization(id),
  username varchar(64) not null unique,
  password_hash text,
  display_name varchar(128) not null,
  phone varchar(32),
  email varchar(255),
  user_type varchar(32) not null,
  status varchar(32) not null default 'active',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists role (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id),
  role_code varchar(64) not null,
  role_name varchar(128) not null,
  role_scope varchar(32) not null default 'organization',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, role_code)
);

create table if not exists user_role (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user(id),
  role_id uuid not null references role(id),
  assigned_at timestamptz not null default now(),
  assigned_by uuid references app_user(id),
  unique (user_id, role_id)
);

create table if not exists staff_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references app_user(id),
  organization_id uuid not null references organization(id),
  staff_code varchar(64) not null unique,
  full_name varchar(128) not null,
  role_title varchar(64) not null,
  department varchar(64),
  employment_status varchar(32) not null default 'active',
  hire_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists family_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references app_user(id),
  tenant_id uuid not null references tenant(id),
  full_name varchar(128) not null,
  phone varchar(32),
  relation_note varchar(128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists care_level (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id),
  level_code varchar(64) not null,
  level_name varchar(128) not null,
  severity_rank integer not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, level_code)
);

create table if not exists elder_profile (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id),
  organization_id uuid not null references organization(id),
  elder_code varchar(64) not null unique,
  full_name varchar(128) not null,
  gender varchar(16) not null,
  birth_date date,
  id_card_masked varchar(64),
  phone varchar(32),
  care_level_id uuid references care_level(id),
  current_status varchar(32) not null,
  risk_level varchar(32),
  avatar_url text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists elder_guardian_relation (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references elder_profile(id),
  family_id uuid not null references family_profile(id),
  relation_type varchar(64) not null,
  is_primary boolean not null default false,
  authorized_scope jsonb,
  created_at timestamptz not null default now(),
  unique (elder_id, family_id)
);

create table if not exists elder_admission (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references elder_profile(id),
  admission_no varchar(64) not null unique,
  room_id uuid references room(id),
  bed_id uuid references bed(id),
  admitted_at timestamptz not null,
  admitted_by uuid references app_user(id),
  status varchar(32) not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admission_assessment (
  id uuid primary key default gen_random_uuid(),
  admission_id uuid not null references elder_admission(id) on delete cascade,
  elder_id uuid not null references elder_profile(id),
  assessment_source varchar(32) not null,
  adl_score numeric(10, 2),
  cognitive_level varchar(32),
  chronic_conditions jsonb,
  medication_summary jsonb,
  allergy_summary jsonb,
  risk_notes text,
  assessed_at timestamptz not null,
  assessed_by uuid references app_user(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bed_occupancy (
  id uuid primary key default gen_random_uuid(),
  bed_id uuid not null references bed(id),
  elder_id uuid not null references elder_profile(id),
  admission_id uuid references elder_admission(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  status varchar(32) not null default 'occupied',
  created_at timestamptz not null default now()
);

create table if not exists care_service_catalog (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id),
  service_code varchar(64) not null,
  service_name varchar(128) not null,
  category varchar(64) not null,
  standard_duration_minutes integer,
  required_role varchar(64),
  description text,
  status varchar(32) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, service_code)
);

create table if not exists elder_care_plan (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references elder_profile(id),
  plan_name varchar(128) not null,
  plan_cycle varchar(32) not null,
  status varchar(32) not null,
  effective_from date not null,
  effective_to date,
  created_by uuid references app_user(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_care_level_recommendation (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references admission_assessment(id) on delete cascade,
  elder_id uuid not null references elder_profile(id),
  recommended_care_level_id uuid not null references care_level(id),
  confidence_score numeric(5, 2),
  reasoning_summary text,
  suggested_plan_template_code varchar(64),
  confirmation_status varchar(32) not null default 'pending',
  confirmed_care_level_id uuid references care_level(id),
  confirmed_by uuid references app_user(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists care_plan_item (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references elder_care_plan(id) on delete cascade,
  service_id uuid not null references care_service_catalog(id),
  frequency_rule varchar(128) not null,
  scheduled_time time,
  priority varchar(32) not null default 'normal',
  status varchar(32) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists care_plan_generation_record (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references elder_profile(id),
  recommendation_id uuid references ai_care_level_recommendation(id),
  plan_id uuid not null references elder_care_plan(id),
  generation_source varchar(32) not null,
  template_code varchar(64),
  generated_by uuid references app_user(id),
  generated_at timestamptz not null,
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists care_task (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references elder_profile(id),
  plan_item_id uuid references care_plan_item(id),
  organization_id uuid not null references organization(id),
  task_type varchar(64) not null,
  task_title varchar(255) not null,
  priority varchar(32) not null,
  scheduled_at timestamptz not null,
  due_at timestamptz,
  assigned_staff_id uuid references staff_profile(id),
  status varchar(32) not null,
  source_type varchar(32) not null,
  source_ref_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists care_task_execution (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references care_task(id) on delete cascade,
  executed_by uuid not null references staff_profile(id),
  executed_at timestamptz not null,
  execution_status varchar(32) not null,
  duration_seconds integer,
  result_summary text,
  abnormal_flag boolean not null default false,
  abnormal_reason text,
  created_at timestamptz not null default now()
);

create table if not exists task_reminder_schedule (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references care_task(id) on delete cascade,
  reminder_channel varchar(32) not null,
  recipient_staff_id uuid not null references staff_profile(id),
  remind_at timestamptz not null,
  reminder_status varchar(32) not null default 'pending',
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists health_metric_definition (
  id uuid primary key default gen_random_uuid(),
  metric_code varchar(64) not null unique,
  metric_name varchar(128) not null,
  value_type varchar(32) not null,
  unit varchar(32),
  normal_range jsonb,
  created_at timestamptz not null default now()
);

create table if not exists health_vital_record (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references elder_profile(id),
  metric_code varchar(64) not null references health_metric_definition(metric_code),
  metric_value_numeric numeric(12, 4),
  metric_value_text varchar(255),
  unit varchar(32),
  measured_at timestamptz not null,
  source_type varchar(32) not null,
  source_device_id uuid,
  source_staff_id uuid references staff_profile(id),
  risk_flag boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists risk_assessment (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references elder_profile(id),
  assessment_type varchar(64) not null,
  risk_level varchar(32) not null,
  score numeric(10, 2),
  summary text,
  assessed_at timestamptz not null,
  assessed_by uuid references app_user(id),
  created_at timestamptz not null default now()
);

create table if not exists device_model (
  id uuid primary key default gen_random_uuid(),
  vendor_name varchar(128) not null,
  model_code varchar(64) not null unique,
  model_name varchar(128) not null,
  device_type varchar(64) not null,
  protocol_type varchar(32) not null default 'mqtt',
  capability_schema jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists device (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id),
  organization_id uuid not null references organization(id),
  device_code varchar(64) not null unique,
  device_model_id uuid not null references device_model(id),
  device_type varchar(64) not null,
  status varchar(32) not null,
  online_status varchar(32) not null,
  battery_level integer,
  signal_strength integer,
  room_id uuid references room(id),
  purchased_at date,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists device_binding (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references device(id),
  elder_id uuid references elder_profile(id),
  room_id uuid references room(id),
  binding_type varchar(32) not null,
  bound_at timestamptz not null default now(),
  unbound_at timestamptz,
  status varchar(32) not null default 'active'
);

create table if not exists maintenance_work_order (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references device(id),
  work_order_no varchar(64) not null unique,
  issue_type varchar(64) not null,
  priority varchar(32) not null,
  status varchar(32) not null,
  reported_at timestamptz not null,
  assigned_to uuid references staff_profile(id),
  resolved_at timestamptz,
  resolution_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists alert_event (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id),
  organization_id uuid not null references organization(id),
  alert_no varchar(64) not null unique,
  source_type varchar(32) not null,
  source_ref_id uuid,
  elder_id uuid references elder_profile(id),
  room_id uuid references room(id),
  device_id uuid references device(id),
  alert_type varchar(64) not null,
  alert_level varchar(32) not null,
  status varchar(32) not null,
  occurred_at timestamptz not null,
  acknowledged_at timestamptz,
  closed_at timestamptz,
  summary text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists alert_assignment (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references alert_event(id) on delete cascade,
  assigned_to uuid not null references staff_profile(id),
  assigned_by uuid references app_user(id),
  assigned_at timestamptz not null default now(),
  status varchar(32) not null default 'assigned',
  unique (alert_id, assigned_to)
);

create table if not exists alert_resolution (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null unique references alert_event(id) on delete cascade,
  resolved_by uuid references staff_profile(id),
  resolved_at timestamptz not null,
  resolution_type varchar(64) not null,
  resolution_summary text,
  followup_required boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists notification_template (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id),
  template_code varchar(64) not null,
  template_name varchar(128) not null,
  channel varchar(32) not null,
  title_template text,
  body_template text not null,
  status varchar(32) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, template_code, channel)
);

create table if not exists notification_message (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id),
  template_id uuid references notification_template(id),
  recipient_user_id uuid references app_user(id),
  recipient_staff_id uuid references staff_profile(id),
  recipient_family_id uuid references family_profile(id),
  message_type varchar(32) not null,
  channel varchar(32) not null,
  title text,
  body text not null,
  payload jsonb,
  related_task_id uuid references care_task(id),
  related_alert_id uuid references alert_event(id),
  send_status varchar(32) not null default 'pending',
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notification_receipt (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references notification_message(id) on delete cascade,
  receipt_status varchar(32) not null,
  provider_message_id varchar(128),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists billing_account (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null unique references elder_profile(id),
  primary_family_id uuid references family_profile(id),
  account_status varchar(32) not null default 'active',
  balance_amount numeric(14, 2) not null default 0,
  credit_limit numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bill (
  id uuid primary key default gen_random_uuid(),
  billing_account_id uuid not null references billing_account(id),
  elder_id uuid not null references elder_profile(id),
  bill_no varchar(64) not null unique,
  bill_period_start date not null,
  bill_period_end date not null,
  total_amount numeric(14, 2) not null,
  payable_amount numeric(14, 2) not null,
  status varchar(32) not null,
  issued_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payment_record (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bill(id),
  payment_no varchar(64) not null unique,
  amount numeric(14, 2) not null,
  payment_method varchar(32) not null,
  payment_status varchar(32) not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenant(id),
  actor_user_id uuid references app_user(id),
  target_type varchar(64) not null,
  target_id uuid,
  action varchar(64) not null,
  before_snapshot jsonb,
  after_snapshot jsonb,
  request_id varchar(128),
  created_at timestamptz not null default now()
);

create index if not exists idx_organization_tenant_id on organization(tenant_id);
create index if not exists idx_branch_organization_id on branch(organization_id);
create index if not exists idx_room_branch_id on room(branch_id);
create index if not exists idx_bed_room_id on bed(room_id);
create index if not exists idx_elder_profile_org_status on elder_profile(organization_id, current_status);
create index if not exists idx_elder_profile_org_risk on elder_profile(organization_id, risk_level);
create index if not exists idx_admission_assessment_admission on admission_assessment(admission_id, assessed_at desc);
create index if not exists idx_ai_care_level_recommendation_elder_status on ai_care_level_recommendation(elder_id, confirmation_status, created_at desc);
create index if not exists idx_bed_occupancy_bed_status on bed_occupancy(bed_id, status);
create index if not exists idx_care_task_staff_status_schedule on care_task(assigned_staff_id, status, scheduled_at);
create index if not exists idx_care_task_elder_schedule on care_task(elder_id, scheduled_at desc);
create index if not exists idx_task_reminder_schedule_task_time on task_reminder_schedule(task_id, remind_at asc);
create index if not exists idx_task_reminder_schedule_staff_status on task_reminder_schedule(recipient_staff_id, reminder_status, remind_at asc);
create index if not exists idx_health_vital_record_elder_metric_time on health_vital_record(elder_id, metric_code, measured_at desc);
create index if not exists idx_risk_assessment_elder_time on risk_assessment(elder_id, assessed_at desc);
create index if not exists idx_device_org_status_online on device(organization_id, status, online_status);
create index if not exists idx_alert_event_org_status_time on alert_event(organization_id, status, occurred_at desc);
create index if not exists idx_alert_event_elder_time on alert_event(elder_id, occurred_at desc);
create index if not exists idx_notification_message_recipient_status on notification_message(recipient_staff_id, send_status, scheduled_at);
create index if not exists idx_notification_message_task_status on notification_message(related_task_id, send_status);
create index if not exists idx_bill_account_status on bill(billing_account_id, status);
create index if not exists idx_payment_record_bill_status on payment_record(bill_id, payment_status);
create index if not exists idx_audit_log_target on audit_log(target_type, target_id, created_at desc);

create trigger trg_tenant_set_updated_at before update on tenant for each row execute function set_updated_at();
create trigger trg_organization_set_updated_at before update on organization for each row execute function set_updated_at();
create trigger trg_branch_set_updated_at before update on branch for each row execute function set_updated_at();
create trigger trg_room_set_updated_at before update on room for each row execute function set_updated_at();
create trigger trg_bed_set_updated_at before update on bed for each row execute function set_updated_at();
create trigger trg_app_user_set_updated_at before update on app_user for each row execute function set_updated_at();
create trigger trg_role_set_updated_at before update on role for each row execute function set_updated_at();
create trigger trg_staff_profile_set_updated_at before update on staff_profile for each row execute function set_updated_at();
create trigger trg_family_profile_set_updated_at before update on family_profile for each row execute function set_updated_at();
create trigger trg_care_level_set_updated_at before update on care_level for each row execute function set_updated_at();
create trigger trg_elder_profile_set_updated_at before update on elder_profile for each row execute function set_updated_at();
create trigger trg_elder_admission_set_updated_at before update on elder_admission for each row execute function set_updated_at();
create trigger trg_admission_assessment_set_updated_at before update on admission_assessment for each row execute function set_updated_at();
create trigger trg_care_service_catalog_set_updated_at before update on care_service_catalog for each row execute function set_updated_at();
create trigger trg_elder_care_plan_set_updated_at before update on elder_care_plan for each row execute function set_updated_at();
create trigger trg_ai_care_level_recommendation_set_updated_at before update on ai_care_level_recommendation for each row execute function set_updated_at();
create trigger trg_care_plan_item_set_updated_at before update on care_plan_item for each row execute function set_updated_at();
create trigger trg_care_task_set_updated_at before update on care_task for each row execute function set_updated_at();
create trigger trg_task_reminder_schedule_set_updated_at before update on task_reminder_schedule for each row execute function set_updated_at();
create trigger trg_device_model_set_updated_at before update on device_model for each row execute function set_updated_at();
create trigger trg_device_set_updated_at before update on device for each row execute function set_updated_at();
create trigger trg_maintenance_work_order_set_updated_at before update on maintenance_work_order for each row execute function set_updated_at();
create trigger trg_notification_template_set_updated_at before update on notification_template for each row execute function set_updated_at();
create trigger trg_notification_message_set_updated_at before update on notification_message for each row execute function set_updated_at();
create trigger trg_billing_account_set_updated_at before update on billing_account for each row execute function set_updated_at();
create trigger trg_bill_set_updated_at before update on bill for each row execute function set_updated_at();
create trigger trg_payment_record_set_updated_at before update on payment_record for each row execute function set_updated_at();
