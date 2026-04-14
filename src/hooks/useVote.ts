'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VoteType } from '@/types'

interface UseVoteOptions {
  issueId: string
  initialUpvotes: number
  initialUserVote?: VoteType | null
}

interface UseVoteResult {
  upvotes: number
  userVote: VoteType | null
  isSubmitting: boolean
  vote: (type: VoteType) => Promise<void>
}

/**
 * Manages upvote / downvote state for a single issue with optimistic UI.
 *
 * Optimistic update: the count changes immediately in the UI; if the server
 * request fails the local state is rolled back.
 *
 * The `votes` table uses an UPSERT on (user_id, issue_id) — re-voting
 * with the same type removes the vote (toggle behaviour).
 *
 * TODO: Add geo-validation to tag the vote as 'local' if the user is
 *       within the active radius of the issue (see docs/ux-flow.md Flow 8).
 */
export function useVote({
  issueId,
  initialUpvotes,
  initialUserVote = null,
}: UseVoteOptions): UseVoteResult {
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [userVote, setUserVote] = useState<VoteType | null>(initialUserVote)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const vote = useCallback(
    async (type: VoteType) => {
      if (isSubmitting) return

      // --- Optimistic update ---
      const prevUpvotes = upvotes
      const prevVote = userVote

      const isToggleOff = userVote === type
      const newVote = isToggleOff ? null : type
      const upvoteDelta =
        type === 'up'
          ? isToggleOff
            ? -1   // removing an upvote
            : prevVote === 'down'
              ? 2  // switching down→up
              : 1  // fresh upvote
          : prevVote === 'up'
            ? -2   // switching up→down
            : isToggleOff
              ? 0  // removing a downvote (no upvote change)
              : 0

      setUserVote(newVote)
      setUpvotes((v) => v + upvoteDelta)
      setIsSubmitting(true)

      try {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Must be logged in to vote')

        if (isToggleOff) {
          // Remove vote
          await supabase
            .from('votes')
            .delete()
            .eq('user_id', user.id)
            .eq('issue_id', issueId)
        } else {
          // Upsert vote
          await supabase
            .from('votes')
            .upsert(
              { user_id: user.id, issue_id: issueId, type },
              { onConflict: 'user_id, issue_id' }
            )
        }

        // TODO: Update the denormalised `upvotes` column on the `issues` row
        //       via a Supabase Edge Function or Postgres trigger.
      } catch {
        // Rollback optimistic update
        setUserVote(prevVote)
        setUpvotes(prevUpvotes)
      } finally {
        setIsSubmitting(false)
      }
    },
    [issueId, upvotes, userVote, isSubmitting]
  )

  return { upvotes, userVote, isSubmitting, vote }
}
