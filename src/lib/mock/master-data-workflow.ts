import { organizations as baseOrganizations, organizationStaff } from '@/lib/data/organizations-new'

export type WorkflowLifecycleStatus = '待启用' | '已启用'

export interface LiveOrganization {
  id: string
  name: string
  address: string
  phone: string
  totalBeds: number
  occupiedBeds: number
  staffCount: number
  elderlyCount: number
  status: '运营中' | '筹备中' | '暂停营业'
  establishedDate: string
  manager: string
  managerPhone: string
  description: string
  lifecycleStatus: WorkflowLifecycleStatus
  createdAt: string
  activatedAt?: string
  activationNote?: string
}

export interface RoomBedOccupant {
  id: string
  name: string
  careLevel: string
  checkIn: string
}

export interface RoomBedInfo {
  id: number
  elder?: RoomBedOccupant
  status: 'occupied' | 'available' | 'maintenance'
}

export interface LiveRoom {
  id: string
  name: string
  floor: number
  floorName: string
  type: '单人间' | '双人间' | '护理间' | '套间'
  capacity: number
  occupied: number
  status: '可入住' | '已满' | '维护中' | '待启用'
  org: string
  organizationId: string
  facilities: string[]
  cleanStatus: '已清洁' | '待清洁' | '保洁中'
  lastClean: string
  nextClean: string
  lifecycleStatus: WorkflowLifecycleStatus
  createdAt: string
  activatedAt?: string
  activationNote?: string
  bedsInfo: RoomBedInfo[]
}

export interface OrganizationCreateFormState {
  name: string
  address: string
  phone: string
  totalBeds: string
  manager: string
  managerPhone: string
  description: string
}

export interface RoomCreateFormState {
  id: string
  name: string
  organizationId: string
  floor: string
  type: LiveRoom['type']
  capacity: string
  facilities: string
}

interface MasterDataWorkflowState {
  organizationDrafts: LiveOrganization[]
  roomDrafts: LiveRoom[]
}

export interface MasterDataSnapshot {
  organizations: LiveOrganization[]
  rooms: LiveRoom[]
}

export const EMPTY_ORGANIZATION_FORM: OrganizationCreateFormState = {
  name: '',
  address: '',
  phone: '',
  totalBeds: '',
  manager: '',
  managerPhone: '',
  description: '',
}

export const EMPTY_ROOM_FORM: RoomCreateFormState = {
  id: '',
  name: '',
  organizationId: '',
  floor: '',
  type: '双人间',
  capacity: '',
  facilities: '',
}

const STORAGE_KEY = 'nursing-admin-v2/master-data-workflow'

const BASE_ORGANIZATIONS: LiveOrganization[] = baseOrganizations.map(item => ({
  ...item,
  lifecycleStatus: '已启用' as const,
  createdAt: item.establishedDate,
}))

const BASE_ROOMS: LiveRoom[] = [
  {
    id: 'R201',
    name: '静养单人间',
    floor: 2,
    floorName: '二楼东',
    type: '单人间',
    capacity: 1,
    occupied: 1,
    status: '已满',
    org: '阳光养老院（浦东店）',
    organizationId: 'O001',
    facilities: ['空调', '独立卫浴', '紧急呼叫'],
    cleanStatus: '已清洁',
    lastClean: '2026-03-31 06:00',
    nextClean: '2026-04-01 06:00',
    lifecycleStatus: '已启用',
    createdAt: '2026-01-10',
    bedsInfo: [{ id: 1, elder: { id: 'E001', name: '张秀英', careLevel: '全护理', checkIn: '2023-05-20' }, status: 'occupied' }],
  },
  {
    id: 'R202',
    name: '温馨双人间',
    floor: 2,
    floorName: '二楼东',
    type: '双人间',
    capacity: 2,
    occupied: 1,
    status: '可入住',
    org: '阳光养老院（浦东店）',
    organizationId: 'O001',
    facilities: ['空调', '共享卫浴', '紧急呼叫'],
    cleanStatus: '已清洁',
    lastClean: '2026-03-31 07:00',
    nextClean: '2026-04-01 07:00',
    lifecycleStatus: '已启用',
    createdAt: '2026-01-12',
    bedsInfo: [
      { id: 1, elder: { id: 'E002', name: '王建国', careLevel: '半自理', checkIn: '2023-03-10' }, status: 'occupied' },
      { id: 2, status: 'available' },
    ],
  },
  {
    id: 'R301',
    name: '康复护理间',
    floor: 3,
    floorName: '三楼西',
    type: '护理间',
    capacity: 1,
    occupied: 1,
    status: '已满',
    org: '康乐养老院（静安店）',
    organizationId: 'O002',
    facilities: ['电动护理床', '独立卫浴', '紧急呼叫'],
    cleanStatus: '已清洁',
    lastClean: '2026-03-31 08:30',
    nextClean: '2026-04-01 08:30',
    lifecycleStatus: '已启用',
    createdAt: '2026-01-18',
    bedsInfo: [{ id: 1, elder: { id: 'E003', name: '李淑芳', careLevel: '特级护理', checkIn: '2022-12-01' }, status: 'occupied' }],
  },
  {
    id: 'R405',
    name: '花园套间',
    floor: 4,
    floorName: '四楼南',
    type: '套间',
    capacity: 2,
    occupied: 1,
    status: '可入住',
    org: '福寿养老院（徐汇店）',
    organizationId: 'O003',
    facilities: ['会客区', '独立卫浴', '紧急呼叫'],
    cleanStatus: '待清洁',
    lastClean: '2026-03-30 17:00',
    nextClean: '2026-04-01 09:00',
    lifecycleStatus: '已启用',
    createdAt: '2026-02-01',
    bedsInfo: [
      { id: 1, elder: { id: 'E004', name: '赵德明', careLevel: '自理', checkIn: '2024-01-15' }, status: 'occupied' },
      { id: 2, status: 'available' },
    ],
  },
  {
    id: 'R102',
    name: '标准双人间',
    floor: 1,
    floorName: '一楼北',
    type: '双人间',
    capacity: 2,
    occupied: 2,
    status: '已满',
    org: '仁爱养老院（虹口店）',
    organizationId: 'O004',
    facilities: ['共享卫浴', '紧急呼叫'],
    cleanStatus: '已清洁',
    lastClean: '2026-03-31 05:30',
    nextClean: '2026-04-01 05:30',
    lifecycleStatus: '已启用',
    createdAt: '2026-01-22',
    bedsInfo: [
      { id: 1, elder: { id: 'E005', name: '陈丽华', careLevel: '半自理', checkIn: '2024-03-01' }, status: 'occupied' },
      { id: 2, elder: { id: 'E006', name: '周玉兰', careLevel: '全护理', checkIn: '2024-02-12' }, status: 'occupied' },
    ],
  },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function splitList(value: string) {
  return value
    .split(/[，,、\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function formatFloorName(floor: number) {
  const labels = ['一楼', '二楼', '三楼', '四楼', '五楼', '六楼']
  return labels[floor - 1] ?? `${floor}楼`
}

function buildEmptyBeds(capacity: number): RoomBedInfo[] {
  return Array.from({ length: capacity }, (_, index) => ({ id: index + 1, status: 'available' as const }))
}

function createInitialState(): MasterDataWorkflowState {
  return {
    organizationDrafts: [],
    roomDrafts: [],
  }
}

let workflowState = createInitialState()
let hydrated = false
const listeners = new Set<() => void>()
let cachedSnapshotState: MasterDataWorkflowState | undefined
let cachedSnapshot: MasterDataSnapshot | undefined

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
    const parsed = JSON.parse(raw) as MasterDataWorkflowState
    workflowState = {
      organizationDrafts: Array.isArray(parsed.organizationDrafts) ? parsed.organizationDrafts : [],
      roomDrafts: Array.isArray(parsed.roomDrafts) ? parsed.roomDrafts : [],
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

function getLiveOrganizationsFromState(state: MasterDataWorkflowState) {
  return [...state.organizationDrafts, ...BASE_ORGANIZATIONS].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

function getLiveRoomsFromState(state: MasterDataWorkflowState) {
  return [...state.roomDrafts, ...BASE_ROOMS].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export function subscribeMasterDataWorkflow(listener: () => void) {
  hydrateState()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getMasterDataSnapshot(): MasterDataSnapshot {
  hydrateState()

  if (cachedSnapshot && cachedSnapshotState === workflowState) {
    return cachedSnapshot
  }

  cachedSnapshot = {
    organizations: getLiveOrganizationsFromState(workflowState),
    rooms: getLiveRoomsFromState(workflowState),
  }
  cachedSnapshotState = workflowState

  return cachedSnapshot
}

export function validateOrganizationForm(form: OrganizationCreateFormState) {
  if (!form.name.trim() || !form.address.trim() || !form.phone.trim() || !form.totalBeds.trim() || !form.manager.trim() || !form.managerPhone.trim()) {
    return '请先补齐机构名称、地址、联系电话、床位数、负责人和负责人电话。'
  }

  const beds = Number(form.totalBeds)
  if (Number.isNaN(beds) || beds < 10 || beds > 1000) {
    return '床位数需填写为 10 到 1000 之间的有效数字。'
  }

  if (form.phone.trim().replace(/\D/g, '').length < 10) {
    return '机构联系电话格式无效。'
  }

  if (form.managerPhone.trim().replace(/\D/g, '').length < 11) {
    return '负责人电话至少填写 11 位有效手机号。'
  }

  return ''
}

export function validateRoomForm(form: RoomCreateFormState) {
  if (!form.id.trim() || !form.name.trim() || !form.organizationId.trim() || !form.floor.trim() || !form.capacity.trim()) {
    return '请先补齐房间编号、房间名称、所属机构、楼层和床位数。'
  }

  const floor = Number(form.floor)
  const capacity = Number(form.capacity)
  if (Number.isNaN(floor) || floor < 1 || floor > 20) {
    return '楼层需填写为 1 到 20 之间的有效数字。'
  }

  if (Number.isNaN(capacity) || capacity < 1 || capacity > 8) {
    return '床位数需填写为 1 到 8 之间的有效数字。'
  }

  const snapshot = getMasterDataSnapshot()
  if (snapshot.rooms.some(room => room.id === form.id.trim())) {
    return '房间编号已存在，请更换编号。'
  }

  if (!snapshot.organizations.some(item => item.id === form.organizationId)) {
    return '请选择有效的所属机构。'
  }

  return ''
}

export function addOrganizationDraft(form: OrganizationCreateFormState) {
  hydrateState()
  const draft: LiveOrganization = {
    id: `O${Date.now().toString().slice(-4)}`,
    name: form.name.trim(),
    address: form.address.trim(),
    phone: form.phone.trim(),
    totalBeds: Number(form.totalBeds),
    occupiedBeds: 0,
    staffCount: 0,
    elderlyCount: 0,
    status: '筹备中',
    establishedDate: today(),
    manager: form.manager.trim(),
    managerPhone: form.managerPhone.trim(),
    description: form.description.trim() || '待补充机构简介',
    lifecycleStatus: '待启用',
    createdAt: today(),
  }

  workflowState = {
    ...workflowState,
    organizationDrafts: [draft, ...workflowState.organizationDrafts],
  }
  notifyListeners()
  return draft
}

export function activateOrganizationDraft(id: string, activationNote = '机构资料已复核，允许进入运营台账。') {
  hydrateState()
  let updated: LiveOrganization | undefined
  workflowState = {
    ...workflowState,
    organizationDrafts: workflowState.organizationDrafts.map(item => {
      if (item.id !== id) {
        return item
      }

      updated = {
        ...item,
        status: '运营中',
        lifecycleStatus: '已启用',
        activatedAt: nowStamp(),
        activationNote,
      }
      return updated
    }),
  }
  notifyListeners()
  return updated
}

export function addRoomDraft(form: RoomCreateFormState) {
  hydrateState()
  const snapshot = getMasterDataSnapshot()
  const organization = snapshot.organizations.find(item => item.id === form.organizationId)
  const capacity = Number(form.capacity)
  const floor = Number(form.floor)
  const draft: LiveRoom = {
    id: form.id.trim(),
    name: form.name.trim(),
    floor,
    floorName: formatFloorName(floor),
    type: form.type,
    capacity,
    occupied: 0,
    status: '待启用',
    org: organization?.name ?? '待补录机构',
    organizationId: form.organizationId,
    facilities: splitList(form.facilities).length > 0 ? splitList(form.facilities) : ['紧急呼叫'],
    cleanStatus: '待清洁',
    lastClean: '待首轮保洁',
    nextClean: '启用后生成',
    lifecycleStatus: '待启用',
    createdAt: today(),
    bedsInfo: buildEmptyBeds(capacity),
  }

  workflowState = {
    ...workflowState,
    roomDrafts: [draft, ...workflowState.roomDrafts],
  }
  notifyListeners()
  return draft
}

export function activateRoomDraft(id: string, activationNote = '房间资料已复核，允许进入排房资源池。') {
  hydrateState()
  let updated: LiveRoom | undefined
  workflowState = {
    ...workflowState,
    roomDrafts: workflowState.roomDrafts.map(item => {
      if (item.id !== id) {
        return item
      }

      updated = {
        ...item,
        status: '可入住',
        lifecycleStatus: '已启用',
        cleanStatus: '已清洁',
        lastClean: nowStamp(),
        nextClean: `${today()} 22:00`,
        activatedAt: nowStamp(),
        activationNote,
      }
      return updated
    }),
  }
  notifyListeners()
  return updated
}

export function getOrganizationStats(organizations: LiveOrganization[]) {
  const totalBeds = organizations.reduce((sum, item) => sum + item.totalBeds, 0)
  const totalElderly = organizations.reduce((sum, item) => sum + item.elderlyCount, 0)
  const totalStaff = organizations.reduce((sum, item) => sum + item.staffCount, 0)
  const avgOccupancy = organizations.length > 0
    ? Math.round(organizations.reduce((sum, item) => sum + (item.totalBeds > 0 ? (item.occupiedBeds / item.totalBeds) * 100 : 0), 0) / organizations.length)
    : 0

  return {
    totalOrgs: organizations.length,
    totalBeds,
    totalElderly,
    totalStaff,
    avgOccupancy,
    pendingActivation: organizations.filter(item => item.lifecycleStatus === '待启用').length,
  }
}

export function getRoomStats(rooms: LiveRoom[]) {
  const totalBeds = rooms.reduce((sum, item) => sum + item.capacity, 0)
  const occupied = rooms.reduce((sum, item) => sum + item.occupied, 0)
  return {
    totalRooms: rooms.length,
    totalBeds,
    occupied,
    occupancy: totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0,
    availableRooms: rooms.filter(item => item.status === '可入住').length,
    pendingActivation: rooms.filter(item => item.lifecycleStatus === '待启用').length,
  }
}

export function getOrganizationStaffRecords(organizationId: string) {
  return organizationStaff[organizationId] ?? []
}

export function findLiveOrganizationById(id: string, snapshot = getMasterDataSnapshot()) {
  return snapshot.organizations.find(item => item.id === id)
}

export function findLiveRoomById(id: string, snapshot = getMasterDataSnapshot()) {
  return snapshot.rooms.find(item => item.id === id)
}

export function resetMasterDataWorkflowMock() {
  workflowState = createInitialState()
  hydrated = true
  notifyListeners()
}