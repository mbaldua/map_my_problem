import { redirect } from 'next/navigation'

/**
 * Root route "/" — redirects immediately to the Map view.
 *
 * The map is the default and primary view per docs/project-discussion.md:
 * "Map is the default view — it makes locality feel real and tangible."
 *
 * TODO: If SHOW_ONBOARDING is true (src/config/onboarding.ts) and the user
 *       has not seen onboarding, redirect to /onboarding instead.
 */
export default function RootPage() {
  redirect('/map')
}
