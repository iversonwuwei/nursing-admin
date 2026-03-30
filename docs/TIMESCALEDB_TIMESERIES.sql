-- 养老数字化平台 TimescaleDB 时序脚本
-- 版本: v1.0
-- 日期: 2026-03-29
-- 说明: 为生命体征、设备遥测、设备心跳提供 hypertable、索引与保留策略初稿

create extension if not exists timescaledb;

-- 前置条件:
-- 1. 已执行 POSTGRESQL_DDL_CORE.sql
-- 2. 已存在 organization / elder_profile / device / staff_profile 等基础表
-- 3. 当前脚本面向 TimescaleDB 环境执行

-- -----------------------------------------------------------------------------
-- 1. 生命体征时序化
-- -----------------------------------------------------------------------------

-- 如果 health_vital_record 已由主库脚本创建为普通表，这里直接转换为 hypertable。
select create_hypertable(
  'health_vital_record',
  'measured_at',
  if_not_exists => true,
  migrate_data => true,
  chunk_time_interval => interval '7 days'
);

create index if not exists idx_health_vital_record_time_desc
  on health_vital_record (measured_at desc);

create index if not exists idx_health_vital_record_metric_time
  on health_vital_record (metric_code, measured_at desc);

create index if not exists idx_health_vital_record_org_time
  on health_vital_record (elder_id, measured_at desc);

-- -----------------------------------------------------------------------------
-- 2. 设备遥测时序表
-- -----------------------------------------------------------------------------

create table if not exists device_telemetry (
  id uuid not null default gen_random_uuid(),
  device_id uuid not null references device(id),
  organization_id uuid not null references organization(id),
  metric_code varchar(64) not null,
  metric_value_numeric numeric(14, 4),
  metric_value_text varchar(255),
  payload jsonb,
  collected_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (id, collected_at)
);

select create_hypertable(
  'device_telemetry',
  'collected_at',
  if_not_exists => true,
  migrate_data => true,
  chunk_time_interval => interval '1 day'
);

create index if not exists idx_device_telemetry_device_time
  on device_telemetry (device_id, collected_at desc);

create index if not exists idx_device_telemetry_metric_time
  on device_telemetry (metric_code, collected_at desc);

create index if not exists idx_device_telemetry_org_time
  on device_telemetry (organization_id, collected_at desc);

create index if not exists idx_device_telemetry_payload_gin
  on device_telemetry using gin (payload);

-- -----------------------------------------------------------------------------
-- 3. 设备心跳时序表
-- -----------------------------------------------------------------------------

create table if not exists device_heartbeat (
  id uuid not null default gen_random_uuid(),
  device_id uuid not null references device(id),
  organization_id uuid not null references organization(id),
  online_status varchar(32) not null,
  battery_level integer,
  signal_strength integer,
  heartbeat_at timestamptz not null,
  payload jsonb,
  created_at timestamptz not null default now(),
  primary key (id, heartbeat_at)
);

select create_hypertable(
  'device_heartbeat',
  'heartbeat_at',
  if_not_exists => true,
  migrate_data => true,
  chunk_time_interval => interval '1 day'
);

create index if not exists idx_device_heartbeat_device_time
  on device_heartbeat (device_id, heartbeat_at desc);

create index if not exists idx_device_heartbeat_org_time
  on device_heartbeat (organization_id, heartbeat_at desc);

create index if not exists idx_device_heartbeat_status_time
  on device_heartbeat (online_status, heartbeat_at desc);

-- -----------------------------------------------------------------------------
-- 4. 连续聚合视图示例
-- -----------------------------------------------------------------------------

create materialized view if not exists health_vital_hourly_summary
with (timescaledb.continuous) as
select
  elder_id,
  metric_code,
  time_bucket(interval '1 hour', measured_at) as bucket,
  avg(metric_value_numeric) as avg_value,
  min(metric_value_numeric) as min_value,
  max(metric_value_numeric) as max_value,
  count(*) as sample_count
from health_vital_record
where metric_value_numeric is not null
group by elder_id, metric_code, bucket
with no data;

create materialized view if not exists device_telemetry_hourly_summary
with (timescaledb.continuous) as
select
  device_id,
  metric_code,
  time_bucket(interval '1 hour', collected_at) as bucket,
  avg(metric_value_numeric) as avg_value,
  min(metric_value_numeric) as min_value,
  max(metric_value_numeric) as max_value,
  count(*) as sample_count
from device_telemetry
where metric_value_numeric is not null
group by device_id, metric_code, bucket
with no data;

-- -----------------------------------------------------------------------------
-- 5. 刷新与保留策略建议
-- -----------------------------------------------------------------------------

select add_continuous_aggregate_policy(
  'health_vital_hourly_summary',
  start_offset => interval '30 days',
  end_offset => interval '1 hour',
  schedule_interval => interval '15 minutes'
)
where not exists (
  select 1
  from timescaledb_information.jobs
  where hypertable_name = 'health_vital_hourly_summary'
);

select add_continuous_aggregate_policy(
  'device_telemetry_hourly_summary',
  start_offset => interval '30 days',
  end_offset => interval '10 minutes',
  schedule_interval => interval '10 minutes'
)
where not exists (
  select 1
  from timescaledb_information.jobs
  where hypertable_name = 'device_telemetry_hourly_summary'
);

select add_retention_policy(
  'health_vital_record',
  drop_after => interval '730 days'
)
where not exists (
  select 1
  from timescaledb_information.jobs
  where hypertable_name = 'health_vital_record'
    and proc_name = 'policy_retention'
);

select add_retention_policy(
  'device_telemetry',
  drop_after => interval '180 days'
)
where not exists (
  select 1
  from timescaledb_information.jobs
  where hypertable_name = 'device_telemetry'
    and proc_name = 'policy_retention'
);

select add_retention_policy(
  'device_heartbeat',
  drop_after => interval '90 days'
)
where not exists (
  select 1
  from timescaledb_information.jobs
  where hypertable_name = 'device_heartbeat'
    and proc_name = 'policy_retention'
);

-- -----------------------------------------------------------------------------
-- 6. 使用建议
-- -----------------------------------------------------------------------------

-- 建议查询分层:
-- 1. Dashboard / 趋势页优先读 continuous aggregate
-- 2. 详情页最近 24h / 7d 读原始 hypertable
-- 3. AI 风险预测读原始采样 + 小时级聚合
-- 4. 报表与训练数据通过离线同步进入数仓
