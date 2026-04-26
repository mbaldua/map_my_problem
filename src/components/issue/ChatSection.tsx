'use client'

/**
 * ChatSection — Reddit-style discussion thread under an issue.
 *
 * Features:
 * - Top-level comments + 1-level nested replies
 * - Upvote / downvote on comments
 * - Local badge (🏠) for commenters within the active radius
 * - Sort: Top | New | Locals First
 * - Sticky comment input at the bottom
 * - Realtime updates via Supabase Realtime channel (TODO)
 *
 * See: docs/ui-specs.md — Section 5 (Issue Detail + Chat)
 *      docs/ux-flow.md  — Flow 7 (Geo-Validated Chat & Voting)
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { clsx } from 'clsx'
import type { CommentWithMeta } from '@/types'

type CommentSort = 'top' | 'new' | 'locals'

interface ChatSectionProps {
  issueId: string
}

export function ChatSection({ issueId }: ChatSectionProps) {
  const [comments, setComments] = useState<CommentWithMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sort, setSort] = useState<CommentSort>('top')
  const [newComment, setNewComment] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  // ── Fetch comments ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchComments() {
      setIsLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('comments')
        .select('id, issue_id, user_id, body, parent_id, upvotes, created_at')
        .eq('issue_id', issueId)
        .is('parent_id', null)  // Top-level only; replies fetched separately
        .order(sort === 'new' ? 'created_at' : 'upvotes', {
          ascending: sort === 'new',
        })

      if (!error && data) {
        // TODO: Fetch replies for each comment
        // TODO: Fetch author info (join with users table)
        // TODO: Set is_local based on commenter geo vs issue location
        setComments(data as CommentWithMeta[])
      }
      setIsLoading(false)
    }

    fetchComments()
  }, [issueId, sort])

  // ── Post comment ───────────────────────────────────────────────────────────
  async function handlePost() {
    if (!newComment.trim()) return

    setIsPosting(true)

    const res = await fetch('/api/post-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issue_id: issueId,
        body: newComment.trim(),
        parent_id: replyingTo ?? null,
      }),
    })

    if (res.ok) {
      const posted = await res.json() as CommentWithMeta
      setComments((prev) => [posted, ...prev])
      setNewComment('')
      setReplyingTo(null)
    }
    setIsPosting(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const SORT_OPTIONS: { value: CommentSort; label: string }[] = [
    { value: 'top',    label: 'Top' },
    { value: 'new',    label: 'New' },
    { value: 'locals', label: 'Locals First' },
  ]

  return (
    <div className="flex flex-col">
      {/* Sort bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700 mr-2">Discussion</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={clsx(
              'rounded-pill px-3 py-1 text-xs font-medium transition-colors',
              sort === opt.value
                ? 'bg-brand-primary text-white'
                : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Comment list */}
      <div className="flex flex-col divide-y divide-gray-50">
        {isLoading ? (
          // Skeleton rows
          [1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-4 space-y-2 animate-pulse">
              <div className="h-3 w-32 rounded bg-gray-200" />
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-4/5 rounded bg-gray-100" />
            </div>
          ))
        ) : comments.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            Be the first to comment.
          </div>
        ) : (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={() => setReplyingTo(comment.id)}
            />
          ))
        )}
      </div>

      {/* Sticky input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-2">
        {replyingTo && (
          <div className="text-xs text-gray-400 mb-1">
            Replying to comment…{' '}
            <button onClick={() => setReplyingTo(null)} className="text-brand-primary">cancel</button>
          </div>
        )}
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePost()}
          placeholder="Add to discussion…"
          disabled={isPosting}
          className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-brand-primary disabled:opacity-50"
        />
        <button
          onClick={handlePost}
          disabled={!newComment.trim() || isPosting}
          className="rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Post
        </button>
      </div>
    </div>
  )
}

// ─── Comment Card ─────────────────────────────────────────────────────────────

function CommentCard({
  comment,
  onReply,
}: {
  comment: CommentWithMeta
  onReply: () => void
}) {
  const displayName = comment.author?.display_name ?? 'Anonymous'

  return (
    <div className="px-4 py-3 space-y-1">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {comment.is_local && (
          <span className="inline-flex items-center gap-0.5 rounded-pill bg-blue-50 px-2 py-0.5 text-blue-600 font-medium">
            🏠 Local
          </span>
        )}
        <span className="font-medium text-gray-700">{displayName}</span>
        <span>·</span>
        <span>{formatRelativeTime(comment.created_at)}</span>
      </div>

      <p className="text-sm text-gray-800 leading-relaxed">{comment.body}</p>

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <button className="hover:text-brand-primary">▲ {comment.upvotes}</button>
        <button className="hover:text-red-400">▼</button>
        <button onClick={onReply} className="hover:text-gray-600">Reply</button>
      </div>

      {/* Nested replies (1 level) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 border-l-2 border-gray-100 pl-3 mt-2 space-y-3">
          {comment.replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} onReply={() => {}} />
          ))}
        </div>
      )}
    </div>
  )
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}
