/**
 * Auto-generated Supabase database types.
 *
 * To regenerate after schema changes run:
 *   npx supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/database.types.ts
 *
 * Or locally (if using Supabase CLI):
 *   npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type IssueCategory = 'water_logging' | 'uncleanliness' | 'traffic'
export type IssueStatus = 'open' | 'resolved' | 'under_review'
export type VoteType = 'up' | 'down'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone: string | null
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          phone?: string | null
          display_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string | null
          display_name?: string | null
          created_at?: string
        }
      }
      issues: {
        Row: {
          id: string
          user_id: string | null
          category: IssueCategory
          title: string | null
          description: string | null
          lat: number
          lng: number
          address: string | null
          image_urls: string[]
          upvotes: number
          status: IssueStatus
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          category: IssueCategory
          title?: string | null
          description?: string | null
          lat: number
          lng: number
          address?: string | null
          image_urls?: string[]
          upvotes?: number
          status?: IssueStatus
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          category?: IssueCategory
          title?: string | null
          description?: string | null
          lat?: number
          lng?: number
          address?: string | null
          image_urls?: string[]
          upvotes?: number
          status?: IssueStatus
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          issue_id: string
          user_id: string | null
          body: string
          parent_id: string | null
          upvotes: number
          comment_lat: number | null
          comment_lng: number | null
          created_at: string
        }
        Insert: {
          id?: string
          issue_id: string
          user_id?: string | null
          body: string
          parent_id?: string | null
          upvotes?: number
          comment_lat?: number | null
          comment_lng?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          issue_id?: string
          user_id?: string | null
          body?: string
          parent_id?: string | null
          upvotes?: number
          comment_lat?: number | null
          comment_lng?: number | null
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          issue_id: string
          type: VoteType
          vote_lat: number | null
          vote_lng: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          issue_id: string
          type: VoteType
          vote_lat?: number | null
          vote_lng?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          issue_id?: string
          type?: VoteType
          vote_lat?: number | null
          vote_lng?: number | null
          created_at?: string
        }
      }
    }
    Functions: {
      get_issues_within_radius: {
        Args: {
          user_lat: number
          user_lng: number
          radius_km: number
          category_filter?: IssueCategory | null
        }
        Returns: {
          id: string
          user_id: string | null
          category: IssueCategory
          title: string | null
          description: string | null
          lat: number
          lng: number
          address: string | null
          image_urls: string[]
          upvotes: number
          status: IssueStatus
          created_at: string
          distance_km: number
        }[]
      }
      get_local_upvote_count: {
        Args: { p_issue_id: string; radius_km: number }
        Returns: number
      }
      get_area_pulse: {
        Args: { user_lat: number; user_lng: number; radius_km: number; days_back?: number }
        Returns: { category: IssueCategory; issue_count: number }[]
      }
    }
    Enums: {
      issue_category: IssueCategory
      issue_status: IssueStatus
      vote_type: VoteType
    }
  }
}
