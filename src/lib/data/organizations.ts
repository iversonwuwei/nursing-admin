import { Organization } from "@/lib/types"

export const organizations: Organization[] = [
  {
    id: "O001",
    name: "阳光养老院（浦东店）",
    address: "上海市浦东新区张江镇科苑路888号",
    phone: "021-58881234",
    totalBeds: 120,
    occupiedBeds: 98,
    staffCount: 45,
    elderlyCount: 98,
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
  },
]

export const totalStats = {
  totalOrgs: organizations.length,
  totalBeds: organizations.reduce((sum, o) => sum + o.totalBeds, 0),
  totalElderly: organizations.reduce((sum, o) => sum + o.elderlyCount, 0),
  totalStaff: organizations.reduce((sum, o) => sum + o.staffCount, 0),
  avgOccupancy: Math.round(
    organizations.reduce((sum, o) => sum + (o.occupiedBeds / o.totalBeds) * 100, 0) / organizations.length
  ),
}
