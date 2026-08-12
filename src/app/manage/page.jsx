'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ManageDashboard from '@/sections/manage/ManageDashboard'

export default function ManagePage() {
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        try {
            const session = JSON.parse(localStorage.getItem('session') || 'null')
            const user = JSON.parse(localStorage.getItem('user') || 'null')
            const token = session?.access_token || localStorage.getItem('token') || ''
            const role = session?.role || user?.role || ''

            if (!token) {
                router.replace('/login')
                return
            }

            if (role !== 'admin' && role !== 'super_admin') {
                router.replace('/assistant')
                return
            }

            setIsAuthorized(true)
        } catch (error) {
            router.replace('/login')
        }
    }, [router])

    if (!isAuthorized) {
        return null
    }

    return <ManageDashboard />
}
