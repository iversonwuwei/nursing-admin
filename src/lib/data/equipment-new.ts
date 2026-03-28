import type { Equipment, EquipmentAlarm } from "@/lib/types"

export interface EquipmentWithMeta extends Equipment {
  organizationName: string
  lastMaintenanceBy?: string
}

export const equipmentList: EquipmentWithMeta[] = [
  { id: "EQ001", name: "心电监护仪", category: "医疗设备", model: "迈瑞PM-9000", serialNumber: "SN20230001", location: "浦东店-101-1", status: "正常", purchaseDate: "2023-01-15", maintenanceDate: "2024-01-15", maintenanceCycle: 12, organizationId: "O001", organizationName: "阳光养老院（浦东店）", lastMaintenanceBy: "张明" },
  { id: "EQ002", name: "电动轮椅", category: "康复设备", model: "互邦HBL23", serialNumber: "SN20230102", location: "浦东店-康复中心", status: "正常", purchaseDate: "2023-03-20", maintenanceDate: "2024-02-20", maintenanceCycle: 6, organizationId: "O001", organizationName: "阳光养老院（浦东店）", lastMaintenanceBy: "刘芳" },
  { id: "EQ003", name: "血压计", category: "医疗设备", model: "欧姆龙HEM-7124", serialNumber: "SN20230103", location: "浦东店-护士站", status: "待维修", purchaseDate: "2022-06-10", maintenanceDate: "2023-06-10", maintenanceCycle: 12, organizationId: "O001", organizationName: "阳光养老院（浦东店）", remarks: "袖带老化", lastMaintenanceBy: "李红" },
  { id: "EQ004", name: "护理床", category: "生活设备", model: "八乐梦SB-321", serialNumber: "SN20230104", location: "浦东店-203-2", status: "正常", purchaseDate: "2023-05-01", maintenanceDate: "2024-01-01", maintenanceCycle: 24, organizationId: "O001", organizationName: "阳光养老院（浦东店）" },
  { id: "EQ005", name: "智能手环", category: "智能设备", model: "华为Band 7", serialNumber: "SN20230105", location: "静安店-301-1", status: "正常", purchaseDate: "2023-08-15", maintenanceDate: "2024-02-15", maintenanceCycle: 6, organizationId: "O002", organizationName: "康乐养老院（静安店）", remarks: "老人佩戴", lastMaintenanceBy: "孙丽" },
  { id: "EQ006", name: "制氧机", category: "医疗设备", model: "鱼跃8F-5W", serialNumber: "SN20230106", location: "静安店-护士站", status: "正常", purchaseDate: "2022-11-01", maintenanceDate: "2023-11-01", maintenanceCycle: 12, organizationId: "O002", organizationName: "康乐养老院（静安店）", lastMaintenanceBy: "吴涛" },
  { id: "EQ007", name: "空气波压力仪", category: "康复设备", model: "翔宇XY-QR", serialNumber: "SN20230107", location: "徐汇店-康复中心", status: "维修中", purchaseDate: "2023-02-01", maintenanceDate: "2024-02-01", maintenanceCycle: 12, organizationId: "O003", organizationName: "福寿养老院（徐汇店）", remarks: "气泵故障", lastMaintenanceBy: "黄磊" },
  { id: "EQ008", name: "呼叫系统", category: "智能设备", model: "来邦NLS-4", serialNumber: "SN20230108", location: "浦东店-全楼", status: "正常", purchaseDate: "2022-05-01", maintenanceDate: "2023-05-01", maintenanceCycle: 12, organizationId: "O001", organizationName: "阳光养老院（浦东店）" },
  { id: "EQ009", name: "血糖仪", category: "医疗设备", model: "罗氏活力型", serialNumber: "SN20230109", location: "静安店-护士站", status: "正常", purchaseDate: "2023-06-01", maintenanceDate: "2024-06-01", maintenanceCycle: 12, organizationId: "O002", organizationName: "康乐养老院（静安店）", lastMaintenanceBy: "孙丽" },
  { id: "EQ010", name: "助行器", category: "康复设备", model: "互邦L1", serialNumber: "SN20230110", location: "徐汇店-405-1", status: "正常", purchaseDate: "2024-01-15", maintenanceDate: "2025-01-15", maintenanceCycle: 24, organizationId: "O003", organizationName: "福寿养老院（徐汇店）" },
  { id: "EQ011", name: "紧急呼叫器", category: "智能设备", model: "安德IT-300", serialNumber: "SN20230111", location: "虹口店-全楼", status: "正常", purchaseDate: "2023-04-01", maintenanceDate: "2024-04-01", maintenanceCycle: 12, organizationId: "O004", organizationName: "仁爱养老院（虹口店）" },
  { id: "EQ012", name: "吸痰器", category: "医疗设备", model: "鱼跃7E-A", serialNumber: "SN20230112", location: "虹口店-医务室", status: "正常", purchaseDate: "2023-07-01", maintenanceDate: "2024-07-01", maintenanceCycle: 12, organizationId: "O004", organizationName: "仁爱养老院（虹口店）", lastMaintenanceBy: "徐斌" },
]

export const equipmentAlarms: EquipmentAlarm[] = [
  { id: "A001", equipmentId: "EQ003", equipmentName: "血压计", type: "维保到期", message: "血压计维保即将到期，请及时安排维护", createdAt: "2024-02-18", status: "待处理" },
  { id: "A002", equipmentId: "EQ007", equipmentName: "空气波压力仪", type: "故障", message: "空气波压力仪气泵故障，已报修", createdAt: "2024-02-15", status: "处理中" },
  { id: "A003", equipmentId: "EQ005", equipmentName: "智能手环", type: "电量不足", message: "智能手环电量低于20%，请及时充电", createdAt: "2024-02-20", status: "待处理" },
  { id: "A004", equipmentId: "EQ008", equipmentName: "呼叫系统", type: "维保到期", message: "呼叫系统维保即将到期，请及时安排维护", createdAt: "2024-02-10", status: "待处理" },
]

export const equipmentStats = {
  total: equipmentList.length,
  normal: equipmentList.filter((e) => e.status === "正常").length,
  maintenance: equipmentList.filter((e) => e.status === "维修中").length,
  fault: equipmentList.filter((e) => e.status === "待维修").length,
  warning: equipmentAlarms.filter((a) => a.status === "待处理").length,
}

export type EquipmentCategory = "全部" | "医疗设备" | "康复设备" | "生活设备" | "智能设备"
export const equipmentCategories: EquipmentCategory[] = ["全部", "医疗设备", "康复设备", "生活设备", "智能设备"]
