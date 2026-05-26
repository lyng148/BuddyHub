import { useEffect, useState } from 'react'
import { fetchActivities } from '../api'
import { ActivityBrowseCard } from '../components/activities/ActivityBrowseCard'
import { AppNav } from '../components/layout/AppNav'
import { getApiErrorMessage } from '../lib/errors'
import type { ActivityListItem } from '../types/activity'
import '../App.css'
import './ActivityListPage.css'

export default function ActivityListPage() {
  const [activities, setActivities] = useState<ActivityListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchActivities()
        if (!alive) return
        setActivities(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!alive) return
        setError(getApiErrorMessage(err, 'Không thể tải danh sách hoạt động'))
        setActivities([])
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="activity-browse-page">
      <div className="auth-orb auth-orb-one" aria-hidden />
      <div className="auth-orb auth-orb-two" aria-hidden />

      <div className="activity-browse-shell">
        <AppNav active="activities" />

        <div className="activity-browse-intro">
          <h1>Hoạt động có thể tham gia</h1>
          <p>Khám phá các hoạt động do sinh viên HUST tạo và tham gia cùng nhóm phù hợp với bạn.</p>
        </div>

        {loading && <div className="activity-browse-status">Đang tải danh sách…</div>}

        {error && !loading && (
          <div className="activity-browse-error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && activities.length === 0 && (
          <div className="activity-browse-empty">Không có hoạt động phù hợp</div>
        )}

        {!loading && !error && activities.length > 0 && (
          <div className="activity-browse-grid">
            {activities.map((activity) => (
              <ActivityBrowseCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
