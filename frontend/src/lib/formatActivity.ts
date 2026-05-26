import type { ActivityGender } from '../types/activity'

export function formatActivityGender(value?: ActivityGender | null) {
  if (value === 'MALE') return 'Nam'
  if (value === 'FEMALE') return 'Nữ'
  return 'Không yêu cầu'
}

export function formatActivityDateShort(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const dayLabel = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][date.getDay()] ?? 'Thứ'
  return `${dayLabel}, ${date.getDate()} thg ${date.getMonth() + 1}`
}

export function formatActivityTimeOnly(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatActivityDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return `${formatActivityDateShort(value)} • ${formatActivityTimeOnly(value)}`
}

export function formatActivityTimeRange(startTime: string, endTime?: string | null) {
  const startLabel = formatActivityDateTime(startTime)
  if (!endTime) {
    return startLabel
  }

  const endDate = new Date(endTime)
  if (Number.isNaN(endDate.getTime())) {
    return startLabel
  }

  return `${startLabel} – ${formatActivityTimeOnly(endTime)}`
}

export function formatActivityTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const day = date.getDay()
  const dayLabel = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'][day] ?? 'Th'
  const dateLabel = `${date.getDate()}/${date.getMonth() + 1}`
  const timeLabel = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${dayLabel}, ${dateLabel} • ${timeLabel}`
}
