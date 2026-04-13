export type StatusCategory = 'office' | 'onsite_cm' | 'wfh' | 'leave' | 'holiday' | 'vn'

export interface Member {
  id: string
  name: string
  baseLocation: string
  scope: string | null
  isActive: boolean
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  category: StatusCategory
  colorHex: string
  isDefault: boolean
  createdAt: string
}

export interface Location {
  id: string
  name: string
  type: 'office' | 'cm_site' | 'overseas'
  isBase: boolean
  createdAt: string
}

export interface StatusEntry {
  id: string
  memberId: string
  tagId: string
  locationId: string | null
  startDate: string
  endDate: string
  notes: string | null
  createdAt: string
  updatedAt: string
  // Joined fields
  tagName?: string
  tagColor?: string
  tagCategory?: StatusCategory
  locationName?: string | null
  memberName?: string
}

export interface PublicHoliday {
  id: string
  date: string
  name: string
  isWorkday: boolean
  year: number
  createdAt: string
}

export interface RTOSummary {
  memberId: string
  memberName: string
  weekRtoCount: number
  weekRtoRequired: number
  monthRtoCount: number
  monthRtoRequired: number
  status: 'complete' | 'on_track' | 'at_risk' | 'not_met'
}

export interface InsightData {
  date: string
  officeCount: number
  wfhCount: number
  leaveCount: number
  travelCount: number  // onsite_cm + vn
  noEntryCount: number
  totalMembers: number
  alerts: InsightAlert[]
  weekHolidayCount: number
  weekRtoRequired: number
}

export interface InsightAlert {
  type: 'warning' | 'info' | 'danger'
  message: string
}
