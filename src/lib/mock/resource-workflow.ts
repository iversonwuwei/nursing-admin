import { equipmentList } from '@/lib/data'
import { getMasterDataSnapshot } from '@/lib/mock/master-data-workflow'
import type { Equipment } from '@/lib/types'

export type StaffLifecycleStatus = '待入职' | '已入职'
export type EquipmentLifecycleStatus = '待验收' | '已入册'
export type SupplyLifecycleStatus = '待上架' | '已入库'
export type StaffEmploymentSource = '自营' | '第三方合作'

export interface StaffScheduleItem {
  day: string
  shift: string
}

export interface LiveStaffRecord {
  id: string
  name: string
  role: string
  department: string
  employmentSource: StaffEmploymentSource
  partnerAgencyId?: string
  partnerAgencyName?: string
  partnerAffiliationRole?: string
  phone: string
  status: '在职' | '休假' | '离职' | '待入职'
  gender: '男' | '女'
  email: string
  age: number
  performance: number
  attendance: number
  satisfaction: number
  hireDate: string
  schedule: StaffScheduleItem[]
  certificates: string[]
  bonus: string
  lifecycleStatus: StaffLifecycleStatus
  createdAt: string
  activatedAt?: string
  onboardingNote?: string
}

export interface EquipmentMetricSnapshot {
  hr: number
  bp: string
  temp: number
  spo2: number
}

export interface EquipmentHistoryPoint {
  time: string
  hr: number
  spo2: number
  note: string
}

export interface LiveEquipmentRecord extends Equipment {
  room: string
  type: Equipment['category']
  signal: number
  battery: number
  uptime: number
  metrics: EquipmentMetricSnapshot
  history: EquipmentHistoryPoint[]
  lifecycleStatus: EquipmentLifecycleStatus
  createdAt: string
  activatedAt?: string
  acceptanceNote?: string
}

export interface SupplyHistoryRecord {
  date: string
  in: number
  out: number
  balance: number
}

export interface LiveSupplyRecord {
  id: string
  name: string
  category: string
  unit: string
  stock: number
  minStock: number
  price: string
  supplier: string
  contact: string
  lastPurchase: string
  status: '库存不足' | '正常' | '待上架'
  lifecycleStatus: SupplyLifecycleStatus
  history: SupplyHistoryRecord[]
  createdAt: string
  activatedAt?: string
  intakeNote?: string
  lastIntakeQuantity?: number
}

export interface StaffCreateFormState {
  name: string
  role: string
  department: string
  employmentSource: StaffEmploymentSource
  partnerAgencyId: string
  partnerAffiliationRole: string
  gender: '男' | '女' | ''
  phone: string
  email: string
  age: string
  hireDate: string
}

export interface EquipmentCreateFormState {
  name: string
  category: Equipment['category']
  model: string
  serialNumber: string
  location: string
  purchaseDate: string
  maintenanceCycle: string
  organizationId: string
  remarks: string
}

export interface SupplyIntakeFormState {
  existingId: string
  name: string
  category: string
  unit: string
  quantity: string
  minStock: string
  price: string
  supplier: string
  contact: string
}

interface ResourceWorkflowState {
  staffRecords: LiveStaffRecord[]
  equipmentRecords: LiveEquipmentRecord[]
  supplyRecords: LiveSupplyRecord[]
}

export interface ResourceSnapshot {
  staff: LiveStaffRecord[]
  equipment: LiveEquipmentRecord[]
  supplies: LiveSupplyRecord[]
}

export const EMPTY_STAFF_FORM: StaffCreateFormState = {
  name: '',
  role: '',
  department: '',
  employmentSource: '自营',
  partnerAgencyId: '',
  partnerAffiliationRole: '',
  gender: '',
  phone: '',
  email: '',
  age: '',
  hireDate: new Date().toISOString().slice(0, 10),
}

export const EMPTY_EQUIPMENT_FORM: EquipmentCreateFormState = {
  name: '',
  category: '医疗设备',
  model: '',
  serialNumber: '',
  location: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  maintenanceCycle: '12',
  organizationId: '',
  remarks: '',
}

export const EMPTY_SUPPLY_INTAKE_FORM: SupplyIntakeFormState = {
  existingId: '',
  name: '',
  category: '',
  unit: '',
  quantity: '',
  minStock: '',
  price: '',
  supplier: '',
  contact: '',
}

const STORAGE_KEY = 'nursing-admin-v2/resource-workflow'

const WEEK_SCHEDULE: StaffScheduleItem[] = [
  { day: '周一', shift: '白班' },
  { day: '周二', shift: '白班' },
  { day: '周三', shift: '夜班' },
  { day: '周四', shift: '休息' },
  { day: '周五', shift: '白班' },
  { day: '周六', shift: '白班' },
  { day: '周日', shift: '休息' },
]

const BASE_STAFF: LiveStaffRecord[] = [
  {
    id: 'S001',
    name: '王美丽',
    role: '护理主管',
    department: '护理部',
    employmentSource: '自营',
    phone: '13800138001',
    status: '在职',
    gender: '女',
    email: 'wangml@nursinghome.com',
    age: 41,
    performance: 92,
    attendance: 98,
    satisfaction: 95,
    hireDate: '2019-06-01',
    schedule: WEEK_SCHEDULE,
    certificates: ['护士执业证书', '护理管理培训证书', '急救证书'],
    bonus: '¥2,000',
    lifecycleStatus: '已入职',
    createdAt: '2019-06-01',
  },
  {
    id: 'S002',
    name: '李建国',
    role: '护士',
    department: '护理部',
    employmentSource: '自营',
    phone: '13800138002',
    status: '在职',
    gender: '男',
    email: 'lijg@nursinghome.com',
    age: 33,
    performance: 88,
    attendance: 96,
    satisfaction: 91,
    hireDate: '2020-03-15',
    schedule: WEEK_SCHEDULE,
    certificates: ['护士执业证书'],
    bonus: '¥1,200',
    lifecycleStatus: '已入职',
    createdAt: '2020-03-15',
  },
  {
    id: 'S003',
    name: '赵晓红',
    role: '护士',
    department: '护理部',
    employmentSource: '自营',
    phone: '13800138003',
    status: '在职',
    gender: '女',
    email: 'zhaoxh@nursinghome.com',
    age: 31,
    performance: 87,
    attendance: 97,
    satisfaction: 90,
    hireDate: '2021-01-20',
    schedule: WEEK_SCHEDULE,
    certificates: ['护士执业证书', '老年照护培训证书'],
    bonus: '¥1,000',
    lifecycleStatus: '已入职',
    createdAt: '2021-01-20',
  },
  {
    id: 'S004',
    name: '周明',
    role: '后勤主管',
    department: '后勤部',
    employmentSource: '自营',
    phone: '13800138004',
    status: '在职',
    gender: '男',
    email: 'zhoum@nursinghome.com',
    age: 39,
    performance: 85,
    attendance: 95,
    satisfaction: 88,
    hireDate: '2018-10-08',
    schedule: WEEK_SCHEDULE,
    certificates: ['设备巡检证书'],
    bonus: '¥1,100',
    lifecycleStatus: '已入职',
    createdAt: '2018-10-08',
  },
  {
    id: 'S005',
    name: '吴静',
    role: '心理咨询师',
    department: '心理部',
    employmentSource: '自营',
    phone: '13800138005',
    status: '在职',
    gender: '女',
    email: 'wuj@nursinghome.com',
    age: 36,
    performance: 90,
    attendance: 94,
    satisfaction: 93,
    hireDate: '2022-05-06',
    schedule: WEEK_SCHEDULE,
    certificates: ['心理咨询师二级证书'],
    bonus: '¥1,500',
    lifecycleStatus: '已入职',
    createdAt: '2022-05-06',
  },
  {
    id: 'S006',
    name: '郑伟',
    role: '厨师长',
    department: '后勤部',
    employmentSource: '自营',
    phone: '13800138006',
    status: '休假',
    gender: '男',
    email: 'zhengw@nursinghome.com',
    age: 44,
    performance: 84,
    attendance: 90,
    satisfaction: 89,
    hireDate: '2017-08-18',
    schedule: WEEK_SCHEDULE,
    certificates: ['高级中式烹调师'],
    bonus: '¥900',
    lifecycleStatus: '已入职',
    createdAt: '2017-08-18',
  },
  {
    id: 'S007',
    name: '张护工',
    role: '护工',
    department: '护理部',
    employmentSource: '第三方合作',
    partnerAgencyId: 'P001',
    partnerAgencyName: '安心照护服务中心',
    partnerAffiliationRole: '驻场护工',
    phone: '13800138007',
    status: '在职',
    gender: '女',
    email: 'zhanghg@nursinghome.com',
    age: 46,
    performance: 86,
    attendance: 97,
    satisfaction: 90,
    hireDate: '2025-12-15',
    schedule: WEEK_SCHEDULE,
    certificates: ['养老护理员证书'],
    bonus: '¥800',
    lifecycleStatus: '已入职',
    createdAt: '2025-12-15',
    onboardingNote: '由安心照护服务中心派驻，负责夜间与全护执行计划。',
  },
  {
    id: 'S008',
    name: '黄康复师',
    role: '康复师',
    department: '康复部',
    employmentSource: '第三方合作',
    partnerAgencyId: 'P002',
    partnerAgencyName: '康益康复合作社',
    partnerAffiliationRole: '驻点康复师',
    phone: '13800138008',
    status: '在职',
    gender: '男',
    email: 'huangkf@nursinghome.com',
    age: 38,
    performance: 89,
    attendance: 95,
    satisfaction: 92,
    hireDate: '2026-02-20',
    schedule: WEEK_SCHEDULE,
    certificates: ['康复治疗师证书'],
    bonus: '¥1,300',
    lifecycleStatus: '已入职',
    createdAt: '2026-02-20',
    onboardingNote: '由康益康复合作社派驻，负责专项康复执行计划。',
  },
]

function addMonths(date: string, months: number) {
  const target = new Date(date)
  target.setMonth(target.getMonth() + months)
  return target.toISOString().slice(0, 10)
}

function createEquipmentHistory(name: string): EquipmentHistoryPoint[] {
  return [
    { time: '16:00', hr: 72, spo2: 98, note: `${name} 数据正常` },
    { time: '14:00', hr: 75, spo2: 97, note: '运行稳定' },
    { time: '12:00', hr: 70, spo2: 98, note: '例行巡检通过' },
  ]
}

const BASE_EQUIPMENT: LiveEquipmentRecord[] = equipmentList.map((item, index) => ({
  ...item,
  room: item.location,
  type: item.category,
  signal: 90 - (index % 4) * 5,
  battery: 88 - (index % 5) * 6,
  uptime: 600 + index * 24,
  metrics: {
    hr: 70 + (index % 6),
    bp: `${120 + (index % 5) * 4}/${78 + (index % 4) * 2}`,
    temp: 36.4 + (index % 3) * 0.1,
    spo2: 96 + (index % 3),
  },
  history: createEquipmentHistory(item.name),
  lifecycleStatus: '已入册',
  createdAt: item.purchaseDate,
  activatedAt: item.purchaseDate,
  acceptanceNote: '历史设备已入册。',
}))

const BASE_SUPPLIES: LiveSupplyRecord[] = [
  {
    id: 'SP001',
    name: '成人护理垫',
    category: '护理用品',
    unit: '包',
    stock: 45,
    minStock: 50,
    price: '¥38',
    supplier: '稳健医疗',
    contact: '李经理 13800001234',
    lastPurchase: '2026-03-10',
    status: '库存不足',
    lifecycleStatus: '已入库',
    createdAt: '2026-03-10',
    history: [
      { date: '2026-03-10', in: 50, out: 8, balance: 45 },
      { date: '2026-02-25', in: 0, out: 12, balance: 53 },
      { date: '2026-02-15', in: 60, out: 10, balance: 65 },
    ],
  },
  {
    id: 'SP002',
    name: '一次性手套',
    category: '防护用品',
    unit: '盒',
    stock: 120,
    minStock: 80,
    price: '¥25',
    supplier: '蓝帆医疗',
    contact: '王经理 13800001235',
    lastPurchase: '2026-03-12',
    status: '正常',
    lifecycleStatus: '已入库',
    createdAt: '2026-03-12',
    history: [
      { date: '2026-03-12', in: 40, out: 6, balance: 120 },
      { date: '2026-02-20', in: 60, out: 8, balance: 86 },
    ],
  },
  {
    id: 'SP003',
    name: '医用酒精',
    category: '消毒用品',
    unit: '瓶',
    stock: 28,
    minStock: 30,
    price: '¥15',
    supplier: '利尔康',
    contact: '周经理 13800001236',
    lastPurchase: '2026-03-05',
    status: '库存不足',
    lifecycleStatus: '已入库',
    createdAt: '2026-03-05',
    history: [
      { date: '2026-03-05', in: 30, out: 5, balance: 28 },
      { date: '2026-02-15', in: 20, out: 8, balance: 23 },
    ],
  },
  {
    id: 'SP004',
    name: '纸尿裤L码',
    category: '护理用品',
    unit: '包',
    stock: 85,
    minStock: 60,
    price: '¥68',
    supplier: '可靠股份',
    contact: '赵经理 13800001237',
    lastPurchase: '2026-03-20',
    status: '正常',
    lifecycleStatus: '已入库',
    createdAt: '2026-03-20',
    history: [
      { date: '2026-03-20', in: 40, out: 12, balance: 85 },
      { date: '2026-02-26', in: 50, out: 15, balance: 57 },
    ],
  },
  {
    id: 'SP005',
    name: '创可贴',
    category: '医疗用品',
    unit: '盒',
    stock: 200,
    minStock: 50,
    price: '¥12',
    supplier: '云南白药',
    contact: '孙经理 13800001238',
    lastPurchase: '2026-03-18',
    status: '正常',
    lifecycleStatus: '已入库',
    createdAt: '2026-03-18',
    history: [
      { date: '2026-03-18', in: 100, out: 12, balance: 200 },
      { date: '2026-02-28', in: 80, out: 10, balance: 112 },
    ],
  },
]

function nowDate() {
  return new Date().toISOString().slice(0, 10)
}

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function resolveSupplyStatus(stock: number, minStock: number, lifecycleStatus: SupplyLifecycleStatus): LiveSupplyRecord['status'] {
  if (lifecycleStatus === '待上架') {
    return '待上架'
  }

  return stock < minStock ? '库存不足' : '正常'
}

function normalizeStaffRecord(record: LiveStaffRecord): LiveStaffRecord {
  return {
    ...record,
    employmentSource: record.employmentSource ?? '自营',
    partnerAgencyId: record.partnerAgencyId,
    partnerAgencyName: record.partnerAgencyName,
    partnerAffiliationRole: record.partnerAffiliationRole,
  }
}

function createInitialState(): ResourceWorkflowState {
  return {
    staffRecords: [],
    equipmentRecords: [],
    supplyRecords: [],
  }
}

function mergeById<T extends { id: string; createdAt: string }>(base: readonly T[], overrides: readonly T[]) {
  const map = new Map(base.map(item => [item.id, item]))
  overrides.forEach(item => {
    map.set(item.id, item)
  })

  return Array.from(map.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

let workflowState = createInitialState()
let hydrated = false
const listeners = new Set<() => void>()
let cachedSnapshotState: ResourceWorkflowState | undefined
let cachedSnapshot: ResourceSnapshot | undefined

function persistState() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflowState))
}

function hydrateState() {
  if (typeof window === 'undefined' || hydrated) {
    return
  }

  hydrated = true
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    persistState()
    return
  }

  try {
    const parsed = JSON.parse(raw) as ResourceWorkflowState
    workflowState = {
      staffRecords: Array.isArray(parsed.staffRecords) ? parsed.staffRecords.map(item => normalizeStaffRecord(item as LiveStaffRecord)) : [],
      equipmentRecords: Array.isArray(parsed.equipmentRecords) ? parsed.equipmentRecords : [],
      supplyRecords: Array.isArray(parsed.supplyRecords) ? parsed.supplyRecords : [],
    }
  } catch {
    workflowState = createInitialState()
    persistState()
  }
}

function notifyListeners() {
  persistState()
  listeners.forEach(listener => listener())
}

export function subscribeResourceWorkflow(listener: () => void) {
  hydrateState()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getResourceSnapshot(): ResourceSnapshot {
  hydrateState()

  if (cachedSnapshot && cachedSnapshotState === workflowState) {
    return cachedSnapshot
  }

  cachedSnapshot = {
    staff: mergeById(BASE_STAFF, workflowState.staffRecords),
    equipment: mergeById(BASE_EQUIPMENT, workflowState.equipmentRecords),
    supplies: mergeById(BASE_SUPPLIES, workflowState.supplyRecords),
  }
  cachedSnapshotState = workflowState

  return cachedSnapshot
}

export function validateStaffForm(form: StaffCreateFormState) {
  if (!form.name.trim() || !form.role.trim() || !form.department.trim() || !form.gender || !form.phone.trim() || !form.email.trim() || !form.age.trim() || !form.hireDate.trim()) {
    return '请先补齐姓名、角色、部门、性别、联系电话、邮箱、年龄和入职日期。'
  }

  const age = Number(form.age)
  if (Number.isNaN(age) || age < 18 || age > 70) {
    return '年龄需填写为 18 到 70 岁之间的有效数字。'
  }

  if (form.phone.replace(/\D/g, '').length < 11) {
    return '联系电话至少填写 11 位有效手机号。'
  }

  if (!form.email.includes('@')) {
    return '请输入有效邮箱。'
  }

  if (form.employmentSource === '第三方合作') {
    if (!form.partnerAgencyId) {
      return '第三方员工或护工必须选择已启用的合作机构。'
    }

    if (!form.partnerAffiliationRole.trim()) {
      return '请填写第三方人员在合作机构内的角色。'
    }

    const snapshot = getMasterDataSnapshot()
    const partner = snapshot.partners.find(item => item.id === form.partnerAgencyId)
    if (!partner || partner.lifecycleStatus !== '已启用' || partner.institutionType !== '护理服务机构') {
      return '请选择有效且已启用的护理服务机构。'
    }
  }

  return ''
}

export function addStaffDraft(form: StaffCreateFormState) {
  hydrateState()
  const partner = form.employmentSource === '第三方合作'
    ? getMasterDataSnapshot().partners.find(item => item.id === form.partnerAgencyId && item.institutionType === '护理服务机构')
    : undefined
  const draft: LiveStaffRecord = {
    id: `S${Date.now().toString().slice(-4)}`,
    name: form.name.trim(),
    role: form.role.trim(),
    department: form.department.trim(),
    employmentSource: form.employmentSource,
    partnerAgencyId: partner?.id,
    partnerAgencyName: partner?.name,
    partnerAffiliationRole: form.employmentSource === '第三方合作' ? form.partnerAffiliationRole.trim() : undefined,
    phone: form.phone.trim(),
    status: '待入职',
    gender: form.gender as '男' | '女',
    email: form.email.trim(),
    age: Number(form.age),
    performance: 80,
    attendance: 100,
    satisfaction: 88,
    hireDate: form.hireDate,
    schedule: WEEK_SCHEDULE,
    certificates: ['待补充资质'],
    bonus: '¥0',
    lifecycleStatus: '待入职',
    createdAt: nowDate(),
    onboardingNote: form.employmentSource === '第三方合作'
      ? `第三方人员资料已提交，等待主管确认并绑定 ${partner?.name ?? '护理服务机构'}。`
      : '资料已提交，等待主管确认入职。',
  }

  workflowState = {
    ...workflowState,
    staffRecords: [draft, ...workflowState.staffRecords.filter(item => item.id !== draft.id)],
  }
  notifyListeners()
  return draft
}

export function confirmStaffOnboarding(id: string, onboardingNote = '员工资料已复核，允许纳入排班与任务台账。') {
  hydrateState()
  let updated: LiveStaffRecord | undefined
  workflowState = {
    ...workflowState,
    staffRecords: workflowState.staffRecords.map(item => {
      if (item.id !== id) {
        return item
      }

      updated = {
        ...item,
        status: '在职',
        lifecycleStatus: '已入职',
        activatedAt: nowStamp(),
        onboardingNote,
      }
      return updated
    }),
  }
  notifyListeners()
  return updated
}

export function validateEquipmentForm(form: EquipmentCreateFormState) {
  if (!form.name.trim() || !form.category || !form.model.trim() || !form.serialNumber.trim() || !form.location.trim() || !form.purchaseDate.trim() || !form.maintenanceCycle.trim() || !form.organizationId.trim()) {
    return '请先补齐设备名称、分类、型号、序列号、位置、采购日期、维保周期和所属机构。'
  }

  const cycle = Number(form.maintenanceCycle)
  if (Number.isNaN(cycle) || cycle < 1 || cycle > 36) {
    return '维保周期需填写为 1 到 36 个月之间的有效数字。'
  }

  const snapshot = getResourceSnapshot()
  if (snapshot.equipment.some(item => item.serialNumber === form.serialNumber.trim())) {
    return '序列号已存在，请确认是否重复录入。'
  }

  return ''
}

export function addEquipmentDraft(form: EquipmentCreateFormState) {
  hydrateState()
  const cycle = Number(form.maintenanceCycle)
  const draft: LiveEquipmentRecord = {
    id: `EQ${Date.now().toString().slice(-4)}`,
    name: form.name.trim(),
    category: form.category,
    model: form.model.trim(),
    serialNumber: form.serialNumber.trim(),
    location: form.location.trim(),
    status: '待维修',
    purchaseDate: form.purchaseDate,
    maintenanceDate: addMonths(form.purchaseDate, cycle),
    maintenanceCycle: cycle,
    organizationId: form.organizationId.trim(),
    remarks: form.remarks.trim() || '待补充设备说明',
    room: form.location.trim(),
    type: form.category,
    signal: 100,
    battery: 100,
    uptime: 0,
    metrics: { hr: 72, bp: '120/80', temp: 36.5, spo2: 98 },
    history: [{ time: '09:00', hr: 72, spo2: 98, note: '新设备待验收' }],
    lifecycleStatus: '待验收',
    createdAt: nowDate(),
    acceptanceNote: '新设备已登记，等待资产管理员验收。',
  }

  workflowState = {
    ...workflowState,
    equipmentRecords: [draft, ...workflowState.equipmentRecords.filter(item => item.id !== draft.id)],
  }
  notifyListeners()
  return draft
}

export function confirmEquipmentAcceptance(id: string, acceptanceNote = '设备资料与到货状态已复核，允许进入设备台账。') {
  hydrateState()
  let updated: LiveEquipmentRecord | undefined
  workflowState = {
    ...workflowState,
    equipmentRecords: workflowState.equipmentRecords.map(item => {
      if (item.id !== id) {
        return item
      }

      updated = {
        ...item,
        status: '正常',
        lifecycleStatus: '已入册',
        activatedAt: nowStamp(),
        acceptanceNote,
      }
      return updated
    }),
  }
  notifyListeners()
  return updated
}

export function validateSupplyIntakeForm(form: SupplyIntakeFormState) {
  if (!form.quantity.trim() || !form.minStock.trim() || !form.price.trim() || !form.supplier.trim() || !form.contact.trim()) {
    return '请先补齐入库数量、最低库存、单价、供应商和联系人。'
  }

  if (!form.existingId.trim() && (!form.name.trim() || !form.category.trim() || !form.unit.trim())) {
    return '补货现有物资时请选择物资；新增物资时请补齐名称、分类和单位。'
  }

  const quantity = Number(form.quantity)
  const minStock = Number(form.minStock)
  if (Number.isNaN(quantity) || quantity < 1 || quantity > 10000) {
    return '入库数量需填写为 1 到 10000 之间的有效数字。'
  }

  if (Number.isNaN(minStock) || minStock < 0 || minStock > 10000) {
    return '最低库存需填写为 0 到 10000 之间的有效数字。'
  }

  return ''
}

export function addSupplyIntake(form: SupplyIntakeFormState) {
  hydrateState()
  const snapshot = getResourceSnapshot()
  const quantity = Number(form.quantity)
  const minStock = Number(form.minStock)
  const existing = form.existingId ? snapshot.supplies.find(item => item.id === form.existingId) : undefined
  const createdAt = nowDate()

  const nextRecord: LiveSupplyRecord = existing
    ? {
        ...existing,
        stock: existing.stock + quantity,
        minStock,
        price: form.price.trim(),
        supplier: form.supplier.trim(),
        contact: form.contact.trim(),
        lastPurchase: createdAt,
        lifecycleStatus: '待上架',
        status: '待上架',
        createdAt: existing.createdAt,
        intakeNote: `最新一次补货 ${quantity}${existing.unit}，等待仓储确认上架。`,
        lastIntakeQuantity: quantity,
        history: [{ date: createdAt, in: quantity, out: 0, balance: existing.stock + quantity }, ...existing.history],
      }
    : {
        id: `SP${Date.now().toString().slice(-4)}`,
        name: form.name.trim(),
        category: form.category.trim(),
        unit: form.unit.trim(),
        stock: quantity,
        minStock,
        price: form.price.trim(),
        supplier: form.supplier.trim(),
        contact: form.contact.trim(),
        lastPurchase: createdAt,
        status: '待上架',
        lifecycleStatus: '待上架',
        createdAt,
        intakeNote: `新物资已入库 ${quantity}${form.unit.trim()}，等待仓储确认上架。`,
        lastIntakeQuantity: quantity,
        history: [{ date: createdAt, in: quantity, out: 0, balance: quantity }],
      }

  workflowState = {
    ...workflowState,
    supplyRecords: [nextRecord, ...workflowState.supplyRecords.filter(item => item.id !== nextRecord.id)],
  }
  notifyListeners()
  return nextRecord
}

export function confirmSupplyStocking(id: string, intakeNote = '物资已完成上架并纳入库存口径。') {
  hydrateState()
  let updated: LiveSupplyRecord | undefined
  workflowState = {
    ...workflowState,
    supplyRecords: workflowState.supplyRecords.map(item => {
      if (item.id !== id) {
        return item
      }

      updated = {
        ...item,
        lifecycleStatus: '已入库',
        status: resolveSupplyStatus(item.stock, item.minStock, '已入库'),
        activatedAt: nowStamp(),
        intakeNote,
      }
      return updated
    }),
  }
  notifyListeners()
  return updated
}

export function findLiveStaffById(id: string, snapshot = getResourceSnapshot()) {
  return snapshot.staff.find(item => item.id === id)
}

export function findLiveEquipmentById(id: string, snapshot = getResourceSnapshot()) {
  return snapshot.equipment.find(item => item.id === id)
}

export function findLiveSupplyById(id: string, snapshot = getResourceSnapshot()) {
  return snapshot.supplies.find(item => item.id === id)
}

export function getResourceWorkflowOptions() {
  const snapshot = getResourceSnapshot()
  return {
    staffRoles: Array.from(new Set(snapshot.staff.map(item => item.role))),
    staffDepartments: Array.from(new Set(snapshot.staff.map(item => item.department))),
    supplyCategories: Array.from(new Set(snapshot.supplies.map(item => item.category))),
    supplyUnits: Array.from(new Set(snapshot.supplies.map(item => item.unit))),
  }
}