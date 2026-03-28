import type { Organization } from "@/lib/types"

export interface OrganizationWithMeta extends Organization {
  status: "运营中" | "筹备中" | "暂停营业"
  establishedDate: string
  manager: string
  managerPhone: string
  description: string
}

export const organizations: OrganizationWithMeta[] = [
  {
    id: "O001",
    name: "阳光养老院（浦东店）",
    address: "上海市浦东新区张江镇科苑路888号",
    phone: "021-58881234",
    totalBeds: 120,
    occupiedBeds: 98,
    staffCount: 45,
    elderlyCount: 98,
    status: "运营中",
    establishedDate: "2018-03-15",
    manager: "王建国",
    managerPhone: "13812340001",
    description: "位于张江高科技园区，环境优美，设施齐全",
  },
  {
    id: "O002",
    name: "康乐养老院（静安店）",
    address: "上海市静安区南京西路1088号",
    phone: "021-62881234",
    totalBeds: 80,
    occupiedBeds: 72,
    staffCount: 32,
    elderlyCount: 72,
    status: "运营中",
    establishedDate: "2019-06-20",
    manager: "李秀英",
    managerPhone: "13812340002",
    description: "地处南京西路核心地段，交通便利，医疗服务完善",
  },
  {
    id: "O003",
    name: "福寿养老院（徐汇店）",
    address: "上海市徐汇区漕河泾开发区宜山路888号",
    phone: "021-64891234",
    totalBeds: 100,
    occupiedBeds: 65,
    staffCount: 38,
    elderlyCount: 65,
    status: "运营中",
    establishedDate: "2020-09-01",
    manager: "张伟明",
    managerPhone: "13812340003",
    description: "漕河泾开发区内现代化养老机构，配备智能管理系统",
  },
  {
    id: "O004",
    name: "仁爱养老院（虹口店）",
    address: "上海市虹口区四川北路888号",
    phone: "021-65431234",
    totalBeds: 60,
    occupiedBeds: 58,
    staffCount: 25,
    elderlyCount: 58,
    status: "运营中",
    establishedDate: "2017-11-10",
    manager: "陈丽华",
    managerPhone: "13812340004",
    description: "虹口区老牌养老机构，口碑良好，一床难求",
  },
]

export const organizationStaff: Record<string, Array<{
  id: string
  name: string
  role: string
  department: string
  phone: string
  status: "在职" | "休假" | "离职"
}>> = {
  O001: [
    { id: "S001", name: "王建国", role: "院长", department: "管理", phone: "13812340001", status: "在职" },
    { id: "S002", name: "刘芳", role: "护理部主任", department: "护理部", phone: "13812340011", status: "在职" },
    { id: "S003", name: "张明", role: "医生", department: "医疗部", phone: "13812340012", status: "在职" },
    { id: "S004", name: "李红", role: "护士长", department: "护理部", phone: "13812340013", status: "在职" },
    { id: "S005", name: "赵强", role: "后勤主管", department: "后勤部", phone: "13812340014", status: "在职" },
  ],
  O002: [
    { id: "S006", name: "李秀英", role: "院长", department: "管理", phone: "13812340002", status: "在职" },
    { id: "S007", name: "周敏", role: "护理部主任", department: "护理部", phone: "13812340021", status: "在职" },
    { id: "S008", name: "吴涛", role: "医生", department: "医疗部", phone: "13812340022", status: "在职" },
    { id: "S009", name: "孙丽", role: "护士长", department: "护理部", phone: "13812340023", status: "在职" },
  ],
  O003: [
    { id: "S010", name: "张伟明", role: "院长", department: "管理", phone: "13812340003", status: "在职" },
    { id: "S011", name: "郑洁", role: "护理部主任", department: "护理部", phone: "13812340031", status: "在职" },
    { id: "S012", name: "黄磊", role: "康复师", department: "康复部", phone: "13812340032", status: "在职" },
    { id: "S013", name: "林梅", role: "护士长", department: "护理部", phone: "13812340033", status: "在职" },
  ],
  O004: [
    { id: "S014", name: "陈丽华", role: "院长", department: "管理", phone: "13812340004", status: "在职" },
    { id: "S015", name: "杨洋", role: "护理部主任", department: "护理部", phone: "13812340041", status: "在职" },
    { id: "S016", name: "徐斌", role: "医生", department: "医疗部", phone: "13812340042", status: "在职" },
    { id: "S017", name: "何娟", role: "护士长", department: "护理部", phone: "13812340043", status: "在职" },
  ],
}

export interface Activity {
  id: string
  organizationId: string
  type: "入住" | "退房" | "活动" | "健康" | "设备" | "通知"
  title: string
  description: string
  time: string
  actor?: string
}

export const organizationActivities: Record<string, Activity[]> = {
  O001: [
    { id: "A001", organizationId: "O001", type: "入住", title: "新老人入住", description: "陈奶奶入住 203 房间", time: "2024-02-26 10:30", actor: "刘芳" },
    { id: "A002", organizationId: "O001", type: "健康", title: "月度健康检查", description: "完成全院老人血压、血糖检测", time: "2024-02-24 09:00", actor: "张明" },
    { id: "A003", organizationId: "O001", type: "活动", title: "春季联欢会", description: "成功举办春季联欢会，满意度 98%", time: "2024-02-22 14:00" },
    { id: "A004", organizationId: "O001", type: "设备", title: "设备保养", description: "心电监护仪完成季度保养", time: "2024-02-20 11:00", actor: "赵强" },
    { id: "A005", organizationId: "O001", type: "通知", title: "家属探视开放", description: "开放周日探视，每位老人限 2 位家属", time: "2024-02-18 08:00" },
  ],
  O002: [
    { id: "A006", organizationId: "O002", type: "退房", title: "老人退院", description: "张爷爷退院回家休养", time: "2024-02-25 15:00", actor: "周敏" },
    { id: "A007", organizationId: "O002", type: "健康", title: "疫苗接种", description: "流感疫苗集体接种完成", time: "2024-02-23 10:00", actor: "吴涛" },
    { id: "A008", organizationId: "O002", type: "入住", title: "新老人入住", description: "王奶奶入住 301 房间", time: "2024-02-21 11:30", actor: "周敏" },
  ],
  O003: [
    { id: "A009", organizationId: "O003", type: "设备", title: "智能系统升级", description: "呼叫系统完成软件升级", time: "2024-02-27 09:00", actor: "张伟明" },
    { id: "A010", organizationId: "O003", type: "健康", title: "康复评估", description: "完成 15 位老人月度康复评估", time: "2024-02-25 14:00", actor: "黄磊" },
    { id: "A011", organizationId: "O003", type: "活动", title: "书画兴趣班", description: "新开设书画兴趣班，32 位老人参与", time: "2024-02-20 16:00" },
  ],
  O004: [
    { id: "A012", organizationId: "O004", type: "入住", title: "新老人入住", description: "赵爷爷入住 102 房间", time: "2024-02-26 14:00", actor: "杨洋" },
    { id: "A013", organizationId: "O004", type: "通知", title: "食堂改造", description: "食堂完成无障碍改造", time: "2024-02-24 08:00" },
    { id: "A014", organizationId: "O004", type: "健康", title: "年度体检", description: "配合社区医院完成年度体检", time: "2024-02-22 08:30", actor: "徐斌" },
  ],
}
