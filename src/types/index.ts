export type Seniority = 'junior' | 'mid' | 'senior' | 'staff' | 'principal'
export type Availability = 'immediate' | '2_weeks' | '1_month'
export type EnglishLevel = 'basic' | 'conversational' | 'fluent' | 'native'

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

export interface ParsedSpec {
  summary: string
  required_stack: string[]
  preferred_stack: string[]
  seniority_recommendation: Seniority
  budget_signal: 'low' | 'mid' | 'high' | 'unknown'
  red_flags: string[]
  reasoning: string
}

export interface MatchResult {
  developer: DeveloperSearchResult
  scores: {
    semantic: number
    stack: number
    timezone: number
    rate: number
    seniority: number
    composite: number
  }
  rank: number
  match_explanation?: string
}

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