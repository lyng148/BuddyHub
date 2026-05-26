export type DashboardActivity = {
  id: string
  title: string
  location: string
  startTime: string
  maxSlots: number
  currentParticipants: number
  role: 'host' | 'joined'
  categoryName: string
}

export type DashboardResponse = {
  message: string
  profile: {
    id: string
    email: string
    studentId: string
    name: string
    faculty?: string | null
    schoolYear?: number | null
    gender?: 'MALE' | 'FEMALE' | 'ALL' | null
    avatarUrl?: string | null
    bio?: string | null
    interests: string[]
    hostedCount: number
    joinedCount: number
    isVerified: boolean
  }
  activities: {
    upcoming: DashboardActivity[]
    history: DashboardActivity[]
  }
}
