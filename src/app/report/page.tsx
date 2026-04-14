'use client'

/**
 * /report — Report flow entry page.
 *
 * This page is the standalone URL for the report wizard.
 * The same <ReportFlow> is also rendered as a modal overlay on /map.
 *
 * Users can deep-link to /report directly (e.g. from a PWA shortcut).
 *
 * See: docs/ux-flow.md — Flow 2 (Reporting an Issue)
 */

import { useRouter } from 'next/navigation'
import { ReportFlow } from '@/components/report/ReportFlow'

export default function ReportPage() {
  const router = useRouter()

  function handleClose() {
    // Return to map after closing the report flow
    router.push('/map')
  }

  return (
    <div className="flex flex-col h-dvh bg-white">
      <ReportFlow onClose={handleClose} />
    </div>
  )
}
