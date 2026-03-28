export interface Elderly {
  id: string
  name: string
  age: number
  gender: "男" | "女"
  idCard: string
  birthDate: string
  phone: string
  emergencyContact: string
  emergencyPhone: string
  careLevel: "自理" | "半自理" | "全护理" | "特级护理"
  status: "入住" | "离院" | "待入住"
  organizationId: string
  roomNumber: string
  bedNumber: string
  checkInDate: string
  avatar?: string
  medicalHistory: string[]
  allergies: string[]
  remarks?: string
}

export interface HealthRecord {
  id: string
  elderlyId: string
  date: string
  temperature?: number // 体温 (°C)
  bloodPressureHigh?: number // 血压高压 (mmHg)
  bloodPressureLow?: number // 血压低压 (mmHg)
  bloodSugar?: number // 血糖 (mmol/L)
  heartRate?: number // 心率 (次/分)
  weight?: number // 体重 (kg)
  remarks?: string
}

export interface Organization {
  id: string
  name: string
  address: string
  phone: string
  totalBeds: number
  occupiedBeds: number
  staffCount: number
  elderlyCount: number
  image?: string
  status?: string
  establishedDate?: string
}

export interface Equipment {
  id: string
  name: string
  category: "医疗设备" | "康复设备" | "生活设备" | "智能设备"
  model: string
  serialNumber: string
  location: string
  status: "正常" | "维修中" | "已报废" | "待维修"
  purchaseDate: string
  maintenanceDate: string
  maintenanceCycle: number // 月
  organizationId: string
  remarks?: string
}

export interface EquipmentAlarm {
  id: string
  equipmentId: string
  equipmentName: string
  type: "故障" | "维保到期" | "电量不足" | "异常"
  message: string
  createdAt: string
  status: "待处理" | "处理中" | "已解决"
}

export interface CarePlan {
  id: string
  elderlyId: string
  title: string
  content: string
  startDate: string
  endDate?: string
  status: "进行中" | "已完成" | "已暂停"
  createdAt: string
}

export interface Medication {
  id: string
  elderlyId: string
  name: string
  dosage: string
  frequency: string
  startDate: string
  endDate?: string
  remarks?: string
}

export interface VisitRecord {
  id: string
  elderlyId: string
  visitorName: string
  relation: string
  visitTime: string
  leaveTime?: string
  remarks?: string
}

export interface FeeRecord {
  id: string
  elderlyId: string
  month: string
  accommodationFee: number
  careFee: number
  medicalFee: number
  mealFee: number
  otherFee: number
  total: number
  status: "待支付" | "已支付" | "逾期"
  payDate?: string
}
