'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useMutation } from '@tanstack/react-query'
type Stats = {
  totalUsers: number
}

export default function AdminDashboard() {
  const router = useRouter()
 

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      })

      if (!res.ok) throw new Error("Logout failed")

      return res.json()
    },

    onSuccess: () => {
      router.push("/") 
    },
  })
 
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
          router.push('/')
          return null
        }

        return res.json()
      })
      .then((me) => {
        if (!me) return

        if (me.role !== 'admin') {
          router.push('/work')
          return
        }

        setIsAdmin(true)

        return fetch('/api/admin/user-count', {
          credentials: 'include',
        })
      })
      .then((res) => {
        if (!res) return
        return res.json()
      })
      .then((data) => {
        if (data) setStats(data)
        setLoading(false)
      })
      .catch(() => router.push('/'))
  }, [])


  if (loading) {
    return <p className="p-6">Checking permission...</p>
  }

  if (!isAdmin) {
    return null
  }


  // 🔹 Render
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold">
        Admin Dashboard
      </h1>
  <button onClick={() => logoutMutation.mutate()} className="bg-black  text-white p-3 mt-10 ml-4">
      Logout
    </button>
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Total Users</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-4xl font-bold">
            {stats?.totalUsers ?? 0}
          </p>
        </CardContent>
      </Card>

    </div>
  )
}
