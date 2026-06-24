// ============================================================
// Core domain types for DevSignal Matching Engine
// ============================================================

export type Seniority = 'junior' | 'mid' | 'senior' | 'staff' | 'principal'
export type Availability = 'immediate' | '2_weeks' | '1_month'
export type EnglishLevel = 'basic' | 'conversational' | 'fluent' | 'native'

// ---- Developer (from DB) ------------------------------------
export interface Developer {
  id: string
  name: string
  avatar_initials: string
  location_city: string
  location_country: string
  timezone: string
  utc_offset: number
  role_title: string
  seniority: Seniority
  years_experience: number
  primary_stack: string[]
  secondary_stack: string[]
  specializations: string[]
  hourly_rate_usd: number
  availability: Availability
  weekly_hours: number
  english_level: EnglishLevel
  startup_experience: boolean
  ai_experience: boolean
  bio: string
  is_active: boolean
  created_at: string
}

// Developer as returned by match_developers() SQL function
// (same as Developer but without is_active/created_at, plus semantic_score)
export interface DeveloperSearchResult {
  id: string
  name: string
  avatar_initials: string
  location_city: string
  location_country: string
  timezone: string
  utc_offset: number
  role_title: string
  seniority: Seniority
  years_experience: number
  primary_stack: string[]
  secondary_stack: string[]
  specializations: string[]
  hourly_rate_usd: number
  availability: Availability
  english_level: EnglishLevel
  startup_experience: boolean
  ai_experience: boolean
  bio: string
  semantic_score: number
}

// ---- Role (client requirement) ------------------------------
export interface Role {
  id: string
  client_name: string
  contact_email?: string
  raw_description: string
  parsed_spec: ParsedSpec
  required_stack: string[]
  preferred_stack: string[]
  seniority_min: Seniority
  budget_min_usd?: number
  budget_max_usd?: number
  timezone_min_utc: number
  timezone_max_utc: number
  start_date?: string
  team_size?: number
  status: 'pending' | 'matched' | 'sent_to_client' | 'filled' | 'closed'
  created_at: string
}

// AI-parsed spec returned by Groq
export interface ParsedSpec {
  summary: string
  required_stack: string[]
  preferred_stack: string[]
  red_flags: string[]
  seniority_recommendation: Seniority
  reasoning: string
}

// ---- Match result --------------------------------------------
export interface MatchResult {
  developer: DeveloperSearchResult
  scores: {
    semantic: number      // 0–1
    stack: number         // 0–1
    timezone: number      // 0–1
    rate: number          // 0–1
    seniority: number     // 0–1
    composite: number     // 0–1 (final weighted)
  }
  rank: number
  match_explanation?: string
}

// ---- API request/response -----------------------------------
export interface MatchRequest {
  raw_description: string
  client_name: string
  budget_max_usd?: number
  timezone_min_utc?: number
  timezone_max_utc?: number
  seniority_min?: Seniority
}

export interface MatchResponse {
  role_id: string
  matches: MatchResult[]
  parsed_spec: ParsedSpec
  total_pool_size: number
  matched_count: number
}