'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'

import { useMutation } from '@tanstack/react-query'

import { useAdminStore } from '@repo/store' // adjust path

export default function AdminDashboard() {
  const router = useRouter()

  // Zustand state
  const {
    loading,
    isAdmin,
    stats,
    setLoading,
    setIsAdmin,
    setStats,
    reset,
  } = useAdminStore()

  
   const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (!res.ok) throw new Error('Logout failed')

      return res.json()
    },

    onSuccess: () => {
      reset()
      router.push('/')
    },
  })

  // Check admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const meRes = await fetch('/api/me', {
          credentials: 'include',
        })

        if (meRes.status === 401) {
          router.push('/')
          return
        }

        const me = await meRes.json()

        if (me.role !== 'admin') {
          router.push('/work')
          return
        }

        setIsAdmin(true)

        const statsRes = await fetch(
          '/api/admin/user-count',
          {
            credentials: 'include',
          }
        )

        const data = await statsRes.json()

        setStats(data)
      } catch {
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [
    router,
    setIsAdmin,
    setLoading,
    setStats,
  ])

  // Loading
  if (loading) {
    return (
      <p className="p-6">
        Checking permission...
      </p>
    )
  }

  // Not admin
  if (!isAdmin) {
    return null
  }

  // UI
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold">
        Admin Dashboard
      </h1>

      <button
        onClick={() => logoutMutation.mutate()}
        className="bg-black text-white p-3 mt-4"
      >
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
