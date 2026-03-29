import { Tag } from '@/components/nh'
import type { StandardModulePageConfig } from '@/components/nh/StandardModulePage'
import { equipmentList } from '@/lib/data'
import { ALERT_LEVEL_LABELS, ALERT_STATUS_LABELS, ALERT_TYPE_LABELS, alertRecords } from '@/lib/data/alerts-data'
import { healthStats, healthTrends, healthVitals, VITAL_RANGES } from '@/lib/data/health-data'
import {
    Activity,
    Bell,
    CalendarDays,
    ClipboardCheck,
    FileText,
    Heart,
    Home,
    Monitor,
    Moon,
    Package,
    PieChart,
    Settings,
    ShieldAlert,
    ShieldCheck,
    Stethoscope,
    UserCheck,
    Users,
} from 'lucide-react'

const bpAbnormalCount = healthVitals.filter(v => v.bloodPressureHigh > VITAL_RANGES.bloodPressureHigh.max).length
const hrAbnormalCount = healthVitals.filter(v => v.heartRate > 80 || v.heartRate < 65).length

export const nursingPages: Record<string, StandardModulePageConfig> = {
  services: {
    title: '护理服务项目库',
    subtitle: '统一服务标准、执行时长、责任角色与物料清单，支撑排班与打卡联动。',
    actions: [
      { label: '查看老人列表', href: '/elderly', variant: 'secondary' },
      { label: '进入服务打卡', href: '/nursing/checkin', variant: 'primary' },
    ],
    stats: [
      { label: '服务项目', value: 32, sub: '基础+医疗+康复+生活', color: 'primary', icon: ClipboardCheck },
      { label: '启用流程', value: 18, sub: '已标准化 SOP', color: 'success', icon: ShieldCheck },
      { label: '待复核', value: 6, sub: '需护理主管确认', color: 'warning', icon: Bell },
      { label: '月调用量', value: '1,286', sub: '近30日服务次数', color: 'info', icon: Activity },
    ],
    highlights: [
      { title: '基础护理', description: '覆盖晨晚间照护、翻身、喂饭、陪同行走等高频项目。', meta: '高频任务占比 41%', icon: Users, tag: { label: '高频', variant: 'primary' } },
      { title: '医疗护理', description: '接入血压测量、用药复核、慢病随访等医疗动作。', meta: '需护士或医生执行', icon: Stethoscope, tag: { label: '需资质', variant: 'warning' } },
      { title: '康复护理', description: '沉淀训练计划、强度建议和家庭同步说明。', meta: '联动活动与健康模块', icon: Activity, tag: { label: '联动', variant: 'info' } },
    ],
    workflows: [
      { title: '服务项标准化', description: '按护理等级归档服务项，补齐标准时长、执行频次和注意事项。', owner: '护理主管', timeline: '本周', status: { label: '进行中', variant: 'warning' } },
      { title: '服务物料绑定', description: '为每个服务项配置耗材、设备和成本归集字段，支持后续财务分析。', owner: '后勤管理员', timeline: '本月', status: { label: '待排期', variant: 'neutral' } },
      { title: '家属可见说明', description: '整理家属侧可感知的护理说明文案，减少沟通成本。', owner: '运营专员', timeline: '本月', status: { label: '已立项', variant: 'info' } },
    ],
    table: {
      title: '服务项目样例',
      subtitle: '当前使用 mock 数据示例页面结构',
      columns: [
        { key: 'name', label: '项目名称' },
        { key: 'category', label: '分类' },
        { key: 'duration', label: '标准时长' },
        { key: 'owner', label: '执行角色' },
        { key: 'status', label: '状态' },
      ],
      rows: [
        { name: '晨间生命体征巡检', category: '医疗护理', duration: '15 分钟', owner: '护士', status: <Tag variant="success">已启用</Tag> },
        { name: '床旁翻身护理', category: '基础护理', duration: '10 分钟', owner: '护理员', status: <Tag variant="primary">执行中</Tag> },
        { name: '下肢康复训练', category: '康复护理', duration: '30 分钟', owner: '康复师', status: <Tag variant="warning">待复核</Tag> },
      ],
    },
    note: '该页面按设计系统统一为 PageHeader + KPI + 双栏 DataCard + 表格结构，可直接继续接入真实服务项目 API。',
  },
  packages: {
    title: '护理服务套餐',
    subtitle: '围绕自理、半自理、全护、特护四类套餐统一价格、服务边界和适用对象。',
    actions: [
      { label: '查看护理计划', href: '/nursing/plans', variant: 'secondary' },
      { label: '进入排班管理', href: '/nursing/schedule', variant: 'primary' },
    ],
    stats: [
      { label: '在售套餐', value: 8, sub: '含基础+升级包', color: 'primary', icon: Package },
      { label: '覆盖老人', value: 126, sub: '当前套餐生效人数', color: 'success', icon: Users },
      { label: '价格待确认', value: 2, sub: '需财务复核', color: 'warning', icon: PieChart },
      { label: '续约率', value: '92%', sub: '近三个月', color: 'info', icon: ShieldCheck },
    ],
    highlights: [
      { title: '自理套餐', description: '重点提供基础巡检、活动陪伴和健康提醒，适合低风险老人。', meta: '客单价区间 ¥2200-2800', icon: Home, tag: { label: '基础包', variant: 'success' } },
      { title: '全护套餐', description: '覆盖日常护理、医疗监测、夜间巡检和高风险干预。', meta: '含夜班响应 SLA', icon: ShieldAlert, tag: { label: '高优先级', variant: 'danger' } },
      { title: '增值服务包', description: '为康复、探视、陪诊、陪检等场景提供加购能力。', meta: '支撑家属侧增购', icon: FileText, tag: { label: '增值', variant: 'purple' } },
    ],
    workflows: [
      { title: '套餐权益梳理', description: '将当前线下套餐条目映射到标准服务项，避免执行口径不一。', owner: '产品经理', timeline: '本周', status: { label: '进行中', variant: 'warning' } },
      { title: '价格联动财务', description: '统一套餐单价、结算周期和应收规则，支撑账单生成。', owner: '财务主管', timeline: '本月', status: { label: '待确认', variant: 'neutral' } },
      { title: '家属说明模板', description: '输出套餐差异说明与变更通知模板，减少续费争议。', owner: '客户成功', timeline: '本月', status: { label: '已规划', variant: 'info' } },
    ],
    table: {
      title: '套餐配置样例',
      columns: [
        { key: 'name', label: '套餐名称' },
        { key: 'scope', label: '覆盖服务' },
        { key: 'price', label: '月费' },
        { key: 'target', label: '适用对象' },
        { key: 'status', label: '状态' },
      ],
      rows: [
        { name: '半自理标准包', scope: '用药提醒、协助就餐、基础巡房', price: '¥3,200', target: '半自理老人', status: <Tag variant="success">在售</Tag> },
        { name: '全护照护包', scope: '全天候护理、夜间巡检、体征监控', price: '¥5,800', target: '全护/失能老人', status: <Tag variant="primary">主推</Tag> },
        { name: '康复增强包', scope: '康复计划、训练记录、家属反馈', price: '¥1,800', target: '术后恢复人群', status: <Tag variant="warning">待定价</Tag> },
      ],
    },
  },
  plans: {
    title: '护理计划',
    subtitle: '按老人、护理等级和风险标签生成月度计划，并支持跨班次交付追踪。',
    actions: [
      { label: '查看健康监测', href: '/health', variant: 'secondary' },
      { label: '进入员工任务', href: '/staff/tasks', variant: 'primary' },
    ],
    stats: [
      { label: '生效计划', value: 118, sub: '本月计划数', color: 'primary', icon: ClipboardCheck },
      { label: '自动生成', value: '74%', sub: '根据套餐和风险评估', color: 'success', icon: Activity },
      { label: '待调整', value: 14, sub: '健康异常触发', color: 'warning', icon: Bell },
      { label: '跨班交接', value: 36, sub: '需关注事项', color: 'info', icon: CalendarDays },
    ],
    highlights: [
      { title: '计划生成', description: '根据套餐、护理等级、风险评分和既往记录批量生成个人计划。', meta: '支持按月滚动', icon: FileText, tag: { label: '自动化', variant: 'primary' } },
      { title: '异常追踪', description: '当健康数据或报警升级时，自动插入临时护理任务并要求复核。', meta: '与报警中心联动', icon: ShieldAlert, tag: { label: '高风险', variant: 'danger' } },
      { title: '家属同步', description: '将护理重点和执行摘要同步给家属，提升服务透明度。', meta: '支持消息中心摘要', icon: Users, tag: { label: '透明化', variant: 'info' } },
    ],
    workflows: [
      { title: '月度计划生成', description: '每月初根据在住老人和服务套餐批量生成计划模板。', owner: '系统自动 + 主管复核', timeline: '月初 T+1', status: { label: '已稳定', variant: 'success' } },
      { title: '异常插单机制', description: '对血压、血氧、跌倒等高风险事件自动插入临时计划。', owner: '值班护士', timeline: '实时', status: { label: '进行中', variant: 'warning' } },
      { title: '计划归档与回溯', description: '计划需保留执行轨迹，支撑质量分析和纠纷回溯。', owner: '运营分析', timeline: '本季度', status: { label: '待建设', variant: 'neutral' } },
    ],
    table: {
      title: '计划队列样例',
      columns: [
        { key: 'elderly', label: '老人' },
        { key: 'focus', label: '计划重点' },
        { key: 'shift', label: '执行班次' },
        { key: 'owner', label: '责任人' },
        { key: 'status', label: '状态' },
      ],
      rows: [
        { elderly: '张秀英 · 101-1', focus: '血压复测 + 午间用药提醒', shift: '早班 / 中班', owner: '李护士', status: <Tag variant="warning">待复核</Tag> },
        { elderly: '李淑芳 · 301-1', focus: '晚间血氧监测 + 夜巡', shift: '晚班', owner: '王医生', status: <Tag variant="danger">异常加急</Tag> },
        { elderly: '赵德明 · 405-1', focus: '晨练陪护 + 营养餐记录', shift: '早班', owner: '张护工', status: <Tag variant="success">执行中</Tag> },
      ],
    },
  },
  schedule: {
    title: '护理排班',
    subtitle: '围绕服务任务密度、护理等级和异常风险分配班次，降低超负荷与漏项风险。',
    actions: [
      { label: '查看员工排班', href: '/staff/schedule', variant: 'secondary' },
      { label: '查看任务中心', href: '/staff/tasks', variant: 'primary' },
    ],
    stats: [
      { label: '本周班次', value: 56, sub: '含白班/夜班', color: 'primary', icon: CalendarDays },
      { label: '排班冲突', value: 3, sub: '需主管调度', color: 'danger', icon: ShieldAlert },
      { label: '高风险覆盖', value: '100%', sub: '夜班高风险老人覆盖', color: 'success', icon: ShieldCheck },
      { label: '平均负荷', value: '8.4', sub: '人均任务数', color: 'info', icon: Activity },
    ],
    highlights: [
      { title: '按风险排班', description: '基于老人健康风险和设备报警情况，自动提高重点区域值守强度。', meta: '夜班重点覆盖 3 个区', icon: ShieldAlert, tag: { label: '风险优先', variant: 'danger' } },
      { title: '跨区调度', description: '针对请假、突发病情和设备故障，支持临时跨区补位。', meta: '支持按楼层/护理组查看', icon: Users, tag: { label: '灵活调度', variant: 'primary' } },
      { title: '导出与回看', description: '保留排班版本记录，方便复盘执行偏差和考勤争议。', meta: '支持打印和值班看板', icon: FileText, tag: { label: '可追溯', variant: 'info' } },
    ],
    workflows: [
      { title: '班次草案生成', description: '按老人分布、资质要求与历史负荷生成建议班表。', owner: '系统调度器', timeline: '每周五', status: { label: '已启用', variant: 'success' } },
      { title: '主管复核调度', description: '对冲突、缺口和夜班覆盖不足项进行人工校正。', owner: '护理主管', timeline: '每周五下午', status: { label: '进行中', variant: 'warning' } },
      { title: '班中异常回填', description: '对于临时换班、加班和缺勤进行事后回填，保障统计准确。', owner: '班组长', timeline: '当日下班前', status: { label: '待完善', variant: 'neutral' } },
    ],
    table: {
      title: '班次样例',
      columns: [
        { key: 'shift', label: '班次' },
        { key: 'area', label: '覆盖区域' },
        { key: 'focus', label: '重点任务' },
        { key: 'owner', label: '责任人' },
        { key: 'status', label: '状态' },
      ],
      rows: [
        { shift: '早班 07:00-15:00', area: 'A栋 1-2层', focus: '晨检、早餐协助、血压测量', owner: '李护士 / 张护工', status: <Tag variant="success">已发布</Tag> },
        { shift: '中班 15:00-23:00', area: 'B栋 3层', focus: '康复训练、探视陪同、晚间用药', owner: '王护士 / 刘护工', status: <Tag variant="primary">执行中</Tag> },
        { shift: '夜班 23:00-07:00', area: '全院巡查', focus: '夜巡、离床告警响应', owner: '值班小组', status: <Tag variant="warning">需复核</Tag> },
      ],
    },
  },
  checkin: {
    title: '服务打卡',
    subtitle: '沉淀护理执行记录、异常说明与责任追踪，为质量分析和家属同步提供依据。',
    actions: [
      { label: '查看历史记录', href: '/alerts/history', variant: 'secondary' },
      { label: '返回老人入住', href: '/elderly/checkin', variant: 'primary' },
    ],
    stats: [
      { label: '今日打卡', value: 268, sub: '覆盖 94% 计划任务', color: 'primary', icon: ClipboardCheck },
      { label: '异常打卡', value: 11, sub: '超时 / 漏项 / 二次上门', color: 'warning', icon: Bell },
      { label: '补录申请', value: 4, sub: '待主管审核', color: 'danger', icon: ShieldAlert },
      { label: '平均完成时长', value: '12 分钟', sub: '单次服务', color: 'info', icon: Activity },
    ],
    highlights: [
      { title: '任务闭环', description: '打卡记录与护理计划一一对应，支持异常说明和照片附件。', meta: '支持二维码/NFC/手工确认', icon: ClipboardCheck, tag: { label: '闭环', variant: 'success' } },
      { title: '异常补录', description: '针对离线、紧急抢救等场景提供补录和责任确认流程。', meta: '需主管审批', icon: ShieldCheck, tag: { label: '审批', variant: 'warning' } },
      { title: '家属可视化', description: '将关键护理动作摘要同步给家属 APP，减少重复问询。', meta: '按权限开放展示', icon: Users, tag: { label: '联动', variant: 'info' } },
    ],
    workflows: [
      { title: '当班打卡执行', description: '护理员按照任务列表完成服务后立即打卡，避免漏记。', owner: '当班护理员', timeline: '实时', status: { label: '执行中', variant: 'primary' } },
      { title: '异常补录审核', description: '对超时、补录和异常服务进行主管审核，确保可追溯。', owner: '护理主管', timeline: 'T+1', status: { label: '进行中', variant: 'warning' } },
      { title: '月度质量分析', description: '统计各班组准时率、补录率和异常类型，为绩效提供依据。', owner: '运营分析', timeline: '月末', status: { label: '待接入', variant: 'neutral' } },
    ],
    table: {
      title: '打卡记录样例',
      columns: [
        { key: 'task', label: '任务' },
        { key: 'elderly', label: '老人' },
        { key: 'time', label: '执行时间' },
        { key: 'owner', label: '执行人' },
        { key: 'status', label: '状态' },
      ],
      rows: [
        { task: '午间用药提醒', elderly: '张秀英 · 101-1', time: '11:58', owner: '李护士', status: <Tag variant="success">已完成</Tag> },
        { task: '翻身护理', elderly: '李淑芳 · 301-1', time: '14:10', owner: '张护工', status: <Tag variant="warning">补录中</Tag> },
        { task: '血氧复测', elderly: '周玉兰 · 102-2', time: '17:42', owner: '王医生', status: <Tag variant="danger">异常跟进</Tag> },
      ],
    },
  },
}

export const healthMetricPages: Record<string, StandardModulePageConfig> = {
  bp: {
    title: '血压管理',
    subtitle: '聚焦高血压风险人群，跟踪收缩压趋势、复测频次和干预状态。',
    actions: [
      { label: '返回健康总览', href: '/health', variant: 'secondary' },
      { label: '查看报警中心', href: '/alerts', variant: 'primary' },
    ],
    stats: [
      { label: '平均收缩压', value: `${healthTrends[healthTrends.length - 1].bloodPressureHighAvg} mmHg`, sub: '近7日均值', color: 'primary', icon: Activity },
      { label: '异常人数', value: bpAbnormalCount, sub: '高压超阈值', color: 'danger', icon: ShieldAlert },
      { label: '需复测', value: 5, sub: '2小时内复测', color: 'warning', icon: Bell },
      { label: '监测覆盖', value: `${healthStats.totalMonitored} 人`, sub: '当前在线', color: 'success', icon: Heart },
    ],
    highlights: [
      { title: '趋势跟踪', description: '按日查看平均高压、低压变化，发现持续抬升风险。', meta: '近7日波动 138-148 mmHg', icon: Activity, tag: { label: '趋势', variant: 'info' } },
      { title: '异常联动', description: '血压持续偏高时，自动生成复测任务并同步医生。', meta: '已接入报警中心', icon: ShieldAlert, tag: { label: '联动', variant: 'danger' } },
      { title: '重点人群', description: '按慢病、用药、既往病史筛选重点监测名单。', meta: '支撑月度随访计划', icon: Users, tag: { label: '重点', variant: 'primary' } },
    ],
    workflows: [
      { title: '晨检测压', description: '晨间统一采集基础血压，识别夜间异常后续风险。', owner: '护士', timeline: '每日 08:00 前', status: { label: '执行中', variant: 'primary' } },
      { title: '异常复测', description: '对高压超 140 的老人执行 30 分钟/2 小时双周期复测。', owner: '值班护士', timeline: '实时', status: { label: '进行中', variant: 'warning' } },
      { title: '医生干预', description: '连续两次超阈值时升级通知医生并留存干预意见。', owner: '值班医生', timeline: '30 分钟内', status: { label: '已启用', variant: 'success' } },
    ],
    table: {
      title: '重点血压记录',
      columns: [
        { key: 'elderly', label: '老人' },
        { key: 'bp', label: '当前血压' },
        { key: 'time', label: '测量时间' },
        { key: 'risk', label: '风险标签' },
        { key: 'status', label: '处置状态' },
      ],
      rows: healthVitals
        .filter(v => v.bloodPressureHigh >= 138)
        .slice(0, 5)
        .map(v => ({
          elderly: `${v.elderlyName} · ${v.roomNumber}`,
          bp: `${v.bloodPressureHigh}/${v.bloodPressureLow} mmHg`,
          time: v.timestamp,
          risk: v.bloodPressureHigh > 150 ? <Tag variant="danger">高风险</Tag> : <Tag variant="warning">需关注</Tag>,
          status: v.bloodPressureHigh > 150 ? <Tag variant="danger">升级干预</Tag> : <Tag variant="warning">待复测</Tag>,
        })),
    },
  },
  hr: {
    title: '心率管理',
    subtitle: '关注心率波动、突发增快与设备连续性，支撑夜间巡检和慢病看护。',
    actions: [
      { label: '返回健康总览', href: '/health', variant: 'secondary' },
      { label: '查看实时设备', href: '/devices/realtime', variant: 'primary' },
    ],
    stats: [
      { label: '平均心率', value: `${healthStats.avgHeartRate} bpm`, sub: '当前监测均值', color: 'primary', icon: Heart },
      { label: '波动异常', value: hrAbnormalCount, sub: '超出关注区间', color: 'warning', icon: Bell },
      { label: '夜间观察', value: 7, sub: '需夜巡跟踪', color: 'info', icon: Moon },
      { label: '严重告警', value: 2, sub: '需医生确认', color: 'danger', icon: ShieldAlert },
    ],
    highlights: [
      { title: '连续采集', description: '借助手环与监测设备持续采集心率变化，减少漏检。', meta: '采集间隔 5 分钟', icon: Monitor, tag: { label: '实时', variant: 'primary' } },
      { title: '夜间关注', description: '夜间心率异常与呼吸、离床告警联合判断，提高发现效率。', meta: '适用于夜班巡检', icon: Moon, tag: { label: '夜间', variant: 'info' } },
      { title: '事件升级', description: '连续波动超过阈值自动转报警中心，要求人工回看。', meta: '异常事件保留时间轴', icon: ShieldAlert, tag: { label: '升级', variant: 'danger' } },
    ],
    workflows: [
      { title: '日间监测', description: '对高风险老人持续采集并生成趋势片段，辅助值班判断。', owner: '护士站', timeline: '全天', status: { label: '执行中', variant: 'primary' } },
      { title: '设备连续性巡检', description: '对于手环掉线、电量低和数据间断情况优先巡检。', owner: '设备管理员', timeline: '每班次', status: { label: '进行中', variant: 'warning' } },
      { title: '临床复核', description: '出现持续过快或过慢时，由医生复核并补录处置意见。', owner: '值班医生', timeline: '30 分钟内', status: { label: '已启用', variant: 'success' } },
    ],
    table: {
      title: '心率观测样例',
      columns: [
        { key: 'elderly', label: '老人' },
        { key: 'hr', label: '当前心率' },
        { key: 'time', label: '采集时间' },
        { key: 'trend', label: '趋势' },
        { key: 'status', label: '处置状态' },
      ],
      rows: healthVitals.slice(0, 5).map(v => ({
        elderly: `${v.elderlyName} · ${v.roomNumber}`,
        hr: `${v.heartRate} bpm`,
        time: v.timestamp,
        trend: v.heartRate >= 80 ? <Tag variant="warning">偏快</Tag> : v.heartRate <= 65 ? <Tag variant="info">偏低</Tag> : <Tag variant="success">平稳</Tag>,
        status: v.heartRate >= 80 ? <Tag variant="warning">观察中</Tag> : <Tag variant="success">正常</Tag>,
      })),
    },
  },
  sleep: {
    title: '睡眠监测',
    subtitle: '结合离床、心率和夜间巡检数据，识别睡眠质量下降与异常起夜风险。',
    actions: [
      { label: '返回健康总览', href: '/health', variant: 'secondary' },
      { label: '查看设备总览', href: '/devices', variant: 'primary' },
    ],
    stats: [
      { label: '平均睡眠评分', value: 82, sub: '过去7日', color: 'primary', icon: Moon },
      { label: '夜间离床', value: 9, sub: '需关注频次', color: 'warning', icon: Bell },
      { label: '深睡不足', value: 4, sub: '连续 3 天偏低', color: 'danger', icon: ShieldAlert },
      { label: '巡检完成率', value: '96%', sub: '夜间巡房任务', color: 'success', icon: ShieldCheck },
    ],
    highlights: [
      { title: '睡眠评分', description: '综合深睡、浅睡、起夜次数和体动频率输出评分。', meta: '支持日/周/月视图', icon: Moon, tag: { label: '评分', variant: 'primary' } },
      { title: '夜间离床提醒', description: '与床位传感器联动，识别异常起夜、长时间离床和跌倒风险。', meta: '已接入告警规则', icon: ShieldAlert, tag: { label: '风险', variant: 'danger' } },
      { title: '护理干预建议', description: '对睡眠质量下降老人生成夜巡、安抚和复测建议。', meta: '支撑护理计划调整', icon: ClipboardCheck, tag: { label: '干预', variant: 'info' } },
    ],
    workflows: [
      { title: '夜间数据采集', description: '通过床垫、手环和房间传感器采集睡眠数据。', owner: 'IoT 平台', timeline: '每晚', status: { label: '稳定运行', variant: 'success' } },
      { title: '异常起夜回看', description: '对频繁离床或长时间未归床事件进行夜班回看。', owner: '夜班护理员', timeline: '次日晨会前', status: { label: '进行中', variant: 'warning' } },
      { title: '睡眠周报', description: '向家属同步睡眠趋势和重点提醒，支撑陪护沟通。', owner: '客户成功', timeline: '每周', status: { label: '待接入', variant: 'neutral' } },
    ],
    table: {
      title: '睡眠观察样例',
      columns: [
        { key: 'elderly', label: '老人' },
        { key: 'score', label: '睡眠评分' },
        { key: 'awake', label: '起夜次数' },
        { key: 'remark', label: '观察结论' },
        { key: 'status', label: '护理建议' },
      ],
      rows: [
        { elderly: '张秀英 · 101-1', score: '78', awake: '2 次', remark: '深睡不足，凌晨 03:20 有短时离床', status: <Tag variant="warning">增加夜巡</Tag> },
        { elderly: '王建国 · 203-2', score: '88', awake: '1 次', remark: '整体平稳，心率波动正常', status: <Tag variant="success">维持现状</Tag> },
        { elderly: '周玉兰 · 102-2', score: '71', awake: '3 次', remark: '疑似憋醒，建议结合血氧复核', status: <Tag variant="danger">联合复测</Tag> },
      ],
    },
  },
}

export const devicesAssetsPage: StandardModulePageConfig = {
  title: '设备资产管理',
  subtitle: '统一维护设备台账、采购信息、维护计划和生命周期状态。',
  actions: [
    { label: '查看设备总览', href: '/devices', variant: 'secondary' },
    { label: '进入实时监控', href: '/devices/realtime', variant: 'primary' },
  ],
  stats: [
    { label: '设备总数', value: equipmentList.length, sub: '在册资产', color: 'primary', icon: Monitor },
    { label: '待维保', value: equipmentList.filter(item => item.status === '待维修').length, sub: '需安排工单', color: 'warning', icon: Bell },
    { label: '维修中', value: equipmentList.filter(item => item.status === '维修中').length, sub: '当前工单', color: 'danger', icon: ShieldAlert },
    { label: '正常运行', value: equipmentList.filter(item => item.status === '正常').length, sub: '可用设备', color: 'success', icon: ShieldCheck },
  ],
  highlights: [
    { title: '设备台账', description: '记录设备 ID、型号、位置、采购日期和维保责任人。', meta: '支持多院区归档', icon: FileText, tag: { label: '台账', variant: 'primary' } },
    { title: '维保计划', description: '按设备类型设置巡检、校准、保养周期并生成提醒。', meta: '与工单流程联动', icon: CalendarDays, tag: { label: '维保', variant: 'warning' } },
    { title: '报废管理', description: '识别长期故障、高维修成本设备，保留生命周期记录。', meta: '支撑资产折旧', icon: Package, tag: { label: '生命周期', variant: 'info' } },
  ],
  workflows: [
    { title: '入库建档', description: '新设备采购后入库建档，补充院区、楼层和维保信息。', owner: '设备管理员', timeline: '采购后 T+1', status: { label: '已启用', variant: 'success' } },
    { title: '周期维保', description: '按月/季度触发巡检、校准和电池更换任务。', owner: '设备运维', timeline: '周期触发', status: { label: '进行中', variant: 'warning' } },
    { title: '异常报废评估', description: '结合故障率与维修成本进行报废评估，提交审批。', owner: '后勤主管', timeline: '按需', status: { label: '待审批', variant: 'neutral' } },
  ],
  table: {
    title: '资产台账样例',
    columns: [
      { key: 'name', label: '设备' },
      { key: 'model', label: '型号' },
      { key: 'location', label: '位置' },
      { key: 'purchaseDate', label: '采购日期' },
      { key: 'status', label: '状态' },
    ],
    rows: equipmentList.slice(0, 5).map(item => ({
      name: `${item.name} · ${item.id}`,
      model: item.model,
      location: item.location,
      purchaseDate: item.purchaseDate,
      status: item.status === '正常'
        ? <Tag variant="success">正常</Tag>
        : item.status === '维修中'
          ? <Tag variant="warning">维修中</Tag>
          : item.status === '待维修'
            ? <Tag variant="danger">待维修</Tag>
            : <Tag variant="neutral">已报废</Tag>,
    })),
  },
}

export const staffTasksPage: StandardModulePageConfig = {
  title: '任务中心',
  subtitle: '面向员工汇总今日任务、异常插单、报警响应和交接事项，形成统一执行入口。',
  actions: [
    { label: '查看员工排班', href: '/staff/schedule', variant: 'secondary' },
    { label: '查看报警中心', href: '/alerts', variant: 'primary' },
  ],
  stats: [
    { label: '今日任务', value: 86, sub: '含常规与临时任务', color: 'primary', icon: ClipboardCheck },
    { label: '待完成', value: 24, sub: '当前班次剩余', color: 'warning', icon: Bell },
    { label: '报警响应', value: 5, sub: '需优先处理', color: 'danger', icon: ShieldAlert },
    { label: '交接事项', value: 9, sub: '跨班关注', color: 'info', icon: UserCheck },
  ],
  highlights: [
    { title: '统一任务入口', description: '汇聚护理计划、临时插单和报警联动任务，减少切换成本。', meta: '按班次 / 区域 / 老人查看', icon: ClipboardCheck, tag: { label: '统一入口', variant: 'primary' } },
    { title: '优先级排序', description: '根据老人风险、任务 SLA 和事件级别自动排序。', meta: '先高风险后常规', icon: ShieldAlert, tag: { label: '优先级', variant: 'danger' } },
    { title: '交接可回溯', description: '交班事项保留责任人、确认人和完成时刻，支持追踪。', meta: '适合晚夜班交接', icon: FileText, tag: { label: '追踪', variant: 'info' } },
  ],
  workflows: [
    { title: '班前确认', description: '员工开班后先确认待办、异常和重点老人关注项。', owner: '当班员工', timeline: '上班前 10 分钟', status: { label: '已执行', variant: 'success' } },
    { title: '班中处理', description: '按 SLA 执行任务，对异常项补充原因和处置说明。', owner: '当班员工', timeline: '实时', status: { label: '进行中', variant: 'warning' } },
    { title: '班末交接', description: '对未完成事项、夜间重点观察对象进行交接并确认签收。', owner: '班组长', timeline: '下班前', status: { label: '待确认', variant: 'neutral' } },
  ],
  table: {
    title: '任务队列样例',
    columns: [
      { key: 'task', label: '任务' },
      { key: 'elderly', label: '老人' },
      { key: 'owner', label: '责任人' },
      { key: 'deadline', label: '截止时间' },
      { key: 'status', label: '状态' },
    ],
    rows: [
      { task: '晚间血氧复测', elderly: '周玉兰 · 102-2', owner: '王医生', deadline: '20:30', status: <Tag variant="danger">高优先级</Tag> },
      { task: '康复训练签到', elderly: '赵德明 · 405-1', owner: '张护工', deadline: '16:30', status: <Tag variant="primary">执行中</Tag> },
      { task: '家属探视接待', elderly: '王建国 · 203-2', owner: '值班前台', deadline: '15:00', status: <Tag variant="warning">待确认</Tag> },
    ],
  },
}

export const alertsHistoryPage: StandardModulePageConfig = {
  title: '报警历史',
  subtitle: '按类型、级别和处理状态回看历史报警，支撑复盘与响应时效分析。',
  actions: [
    { label: '返回报警中心', href: '/alerts', variant: 'secondary' },
    { label: '查看报表中心', href: '/analytics/report', variant: 'primary' },
  ],
  stats: [
    { label: '历史报警', value: alertRecords.length, sub: '当前样例记录', color: 'primary', icon: ShieldAlert },
    { label: '待处理', value: alertRecords.filter(item => item.status === 'pending').length, sub: '仍需跟进', color: 'danger', icon: Bell },
    { label: '处理中', value: alertRecords.filter(item => item.status === 'processing').length, sub: '责任人已接单', color: 'warning', icon: UserCheck },
    { label: '已解决', value: alertRecords.filter(item => item.status === 'resolved').length, sub: '可复盘样本', color: 'success', icon: ShieldCheck },
  ],
  highlights: [
    { title: '类型聚合', description: '区分跌倒、健康异常、设备告警和呼叫事件，便于回看。', meta: '支持按区域过滤', icon: ShieldAlert, tag: { label: '分类', variant: 'primary' } },
    { title: '响应复盘', description: '保留接单、处理、解决和升级全过程，支持时效分析。', meta: '用于班组绩效', icon: FileText, tag: { label: '时效', variant: 'warning' } },
    { title: '闭环追踪', description: '未解决或反复出现的报警可持续追踪并导入周报。', meta: '与报表中心联动', icon: PieChart, tag: { label: '闭环', variant: 'info' } },
  ],
  workflows: [
    { title: '历史归档', description: '每日归档当日报警并生成责任链条，方便次日晨会复盘。', owner: '值班主管', timeline: '每日 23:00', status: { label: '已执行', variant: 'success' } },
    { title: '高频问题识别', description: '对重复出现的设备、区域和老人进行问题聚类。', owner: '运营分析', timeline: '每周', status: { label: '进行中', variant: 'warning' } },
    { title: '规则回调', description: '把误报和漏报情况反馈给设备与规则配置页面。', owner: '设备运维', timeline: '双周', status: { label: '待建设', variant: 'neutral' } },
  ],
  table: {
    title: '历史记录',
    columns: [
      { key: 'type', label: '类型' },
      { key: 'elderly', label: '老人 / 房间' },
      { key: 'occurredAt', label: '发生时间' },
      { key: 'level', label: '级别' },
      { key: 'status', label: '处理状态' },
    ],
    rows: alertRecords.map(item => ({
      type: ALERT_TYPE_LABELS[item.type],
      elderly: `${item.elderlyName} · ${item.roomNumber}`,
      occurredAt: item.occurredAt,
      level: item.level === 'critical' ? <Tag variant="danger">{ALERT_LEVEL_LABELS[item.level]}</Tag> : item.level === 'warning' ? <Tag variant="warning">{ALERT_LEVEL_LABELS[item.level]}</Tag> : <Tag variant="info">{ALERT_LEVEL_LABELS[item.level]}</Tag>,
      status: item.status === 'resolved' ? <Tag variant="success">{ALERT_STATUS_LABELS[item.status]}</Tag> : item.status === 'processing' ? <Tag variant="warning">{ALERT_STATUS_LABELS[item.status]}</Tag> : <Tag variant="danger">{ALERT_STATUS_LABELS[item.status]}</Tag>,
    })),
  },
}

export const analyticsReportPage: StandardModulePageConfig = {
  title: '报表中心',
  subtitle: '统一管理日报、周报、月报和专题报表，支持订阅、导出与定时分发。',
  actions: [
    { label: '返回数据分析', href: '/analytics', variant: 'secondary' },
    { label: '查看财务页', href: '/financial', variant: 'primary' },
  ],
  stats: [
    { label: '预设报表', value: 12, sub: '日报 / 周报 / 月报', color: 'primary', icon: FileText },
    { label: '订阅任务', value: 7, sub: '邮件 / 微信发送', color: 'info', icon: Bell },
    { label: '待发布', value: 2, sub: '需运营确认', color: 'warning', icon: ClipboardCheck },
    { label: '导出频次', value: '328 次', sub: '近30日', color: 'success', icon: PieChart },
  ],
  highlights: [
    { title: '预设报表', description: '覆盖运营、护理质量、健康异常和财务表现四类核心报表。', meta: '按组织 / 时间维度切换', icon: PieChart, tag: { label: '预设', variant: 'primary' } },
    { title: '自定义视图', description: '面向管理层提供跨模块组合视图，支持筛选保存。', meta: '适配周会/月会材料', icon: FileText, tag: { label: '组合', variant: 'info' } },
    { title: '自动分发', description: '按角色订阅报表并定时分发到邮箱或消息中心。', meta: '减少人工导出', icon: Bell, tag: { label: '订阅', variant: 'success' } },
  ],
  workflows: [
    { title: '报表模板配置', description: '定义指标、维度、口径和导出格式，保持口径一致。', owner: '数据运营', timeline: '本周', status: { label: '进行中', variant: 'warning' } },
    { title: '定时任务发布', description: '按日报/周报/月报配置发送计划和接收人列表。', owner: '系统管理员', timeline: '本月', status: { label: '待确认', variant: 'neutral' } },
    { title: '复盘会沉淀', description: '将高频关注的报表固化为管理看板与追踪项。', owner: '院长办', timeline: '持续', status: { label: '已启用', variant: 'success' } },
  ],
  table: {
    title: '报表任务样例',
    columns: [
      { key: 'name', label: '报表名称' },
      { key: 'cycle', label: '周期' },
      { key: 'owner', label: '维护人' },
      { key: 'channel', label: '分发方式' },
      { key: 'status', label: '状态' },
    ],
    rows: [
      { name: '运营日报', cycle: '每日 08:30', owner: '运营分析', channel: '邮件 + 控制台', status: <Tag variant="success">已发布</Tag> },
      { name: '护理质量周报', cycle: '每周一', owner: '护理主管', channel: '邮件', status: <Tag variant="primary">订阅中</Tag> },
      { name: '健康异常月报', cycle: '每月 1 日', owner: '医疗负责人', channel: '邮件 + 微信', status: <Tag variant="warning">待复核</Tag> },
    ],
  },
}

export const settingsPage: StandardModulePageConfig = {
  title: '系统配置',
  subtitle: '集中管理组织信息、报警规则、通知方式、集成参数和安全策略。',
  actions: [
    { label: '查看组织管理', href: '/organizations', variant: 'secondary' },
    { label: '角色权限设置', href: '/settings/roles', variant: 'primary' },
  ],
  stats: [
    { label: '配置域', value: 6, sub: '组织 / 通知 / 设备 / 安全', color: 'primary', icon: Settings },
    { label: '待确认变更', value: 3, sub: '需管理员审核', color: 'warning', icon: Bell },
    { label: '已启用规则', value: 18, sub: '报警与通知规则', color: 'success', icon: ShieldCheck },
    { label: '外部集成', value: 4, sub: '短信 / 邮件 / IoT / AI', color: 'info', icon: Monitor },
  ],
  highlights: [
    { title: '组织与院区配置', description: '维护机构、楼栋、护理区域和基础编码，保证跨模块一致。', meta: '支撑多院区扩展', icon: Home, tag: { label: '基础配置', variant: 'primary' } },
    { title: '报警与通知规则', description: '统一配置阈值、升级策略与通知渠道，避免多处分散维护。', meta: '接入报警中心', icon: ShieldAlert, tag: { label: '安全优先', variant: 'danger' } },
    { title: '第三方集成', description: '管理短信、视频、设备和 AI 助手相关接入参数。', meta: '便于灰度切换', icon: Monitor, tag: { label: '集成', variant: 'info' } },
  ],
  workflows: [
    { title: '配置变更申请', description: '高风险配置变更先申请再审批，减少线上误操作。', owner: '系统管理员', timeline: '按需', status: { label: '已启用', variant: 'success' } },
    { title: '变更影响评估', description: '对通知规则、阈值和角色权限变更评估影响面。', owner: '产品 / 运营', timeline: '变更前', status: { label: '进行中', variant: 'warning' } },
    { title: '变更留痕', description: '关键配置保留操作人、时间和旧值，便于追溯回滚。', owner: '审计管理员', timeline: '持续', status: { label: '待补齐', variant: 'neutral' } },
  ],
  table: {
    title: '配置域样例',
    columns: [
      { key: 'domain', label: '配置域' },
      { key: 'scope', label: '影响范围' },
      { key: 'owner', label: '维护角色' },
      { key: 'status', label: '状态' },
    ],
    rows: [
      { domain: '报警阈值与升级', scope: '报警中心 / 护理任务 / 通知渠道', owner: '系统管理员', status: <Tag variant="success">已启用</Tag> },
      { domain: '家属消息模板', scope: 'APP 消息 / 短信提醒', owner: '运营专员', status: <Tag variant="warning">待确认</Tag> },
      { domain: 'IoT 接入参数', scope: '设备在线 / 数据采集', owner: '设备运维', status: <Tag variant="primary">运行中</Tag> },
    ],
  },
}

export const settingsRolesPage: StandardModulePageConfig = {
  title: '角色权限',
  subtitle: '管理管理员、护理主管、护理员、护士、医生等角色的可见范围与操作权限。',
  actions: [
    { label: '返回系统配置', href: '/settings', variant: 'secondary' },
    { label: '查看员工列表', href: '/staff', variant: 'primary' },
  ],
  stats: [
    { label: '系统角色', value: 6, sub: '默认角色模板', color: 'primary', icon: UserCheck },
    { label: '权限项', value: 48, sub: '页面 + 操作权限', color: 'info', icon: ShieldCheck },
    { label: '待审批授权', value: 2, sub: '临时越权申请', color: 'warning', icon: Bell },
    { label: '高危操作', value: 5, sub: '需二次确认', color: 'danger', icon: ShieldAlert },
  ],
  highlights: [
    { title: '按角色授权', description: '围绕页面访问、数据范围和敏感操作定义权限模板。', meta: '支持院区级隔离', icon: UserCheck, tag: { label: '模板化', variant: 'primary' } },
    { title: '临时授权', description: '针对代班、会诊等临时场景提供限时权限开通。', meta: '自动失效回收', icon: ShieldAlert, tag: { label: '限时', variant: 'warning' } },
    { title: '审计追踪', description: '关键权限变更留痕，支持按用户回溯授权轨迹。', meta: '符合审计要求', icon: FileText, tag: { label: '审计', variant: 'info' } },
  ],
  workflows: [
    { title: '角色模板维护', description: '统一维护默认角色的可见菜单与操作边界。', owner: '系统管理员', timeline: '双周', status: { label: '已启用', variant: 'success' } },
    { title: '临时授权审批', description: '高风险越权申请需要主管审批并自动到期回收。', owner: '护理主管 / 院长', timeline: '实时', status: { label: '进行中', variant: 'warning' } },
    { title: '权限审计', description: '定期核对敏感权限是否存在长期闲置或越权情况。', owner: '审计管理员', timeline: '每月', status: { label: '待补齐', variant: 'neutral' } },
  ],
  table: {
    title: '角色矩阵样例',
    columns: [
      { key: 'role', label: '角色' },
      { key: 'scope', label: '数据范围' },
      { key: 'abilities', label: '核心能力' },
      { key: 'status', label: '状态' },
    ],
    rows: [
      { role: '系统管理员', scope: '全院区', abilities: '配置管理、角色授权、系统规则', status: <Tag variant="danger">高危权限</Tag> },
      { role: '护理主管', scope: '所属院区 / 所属楼层', abilities: '排班、计划复核、异常处理', status: <Tag variant="primary">核心角色</Tag> },
      { role: '护理员', scope: '所属班组', abilities: '查看任务、服务打卡、交接班', status: <Tag variant="success">标准权限</Tag> },
    ],
  },
}