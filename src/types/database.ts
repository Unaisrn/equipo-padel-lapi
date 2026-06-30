export type PlayerPosition = 'drive' | 'reves' | 'ambos'
export type PlayerStatus = 'activo' | 'baja'
export type FeeStatus = 'pendiente' | 'pagado'
export type PaymentMethod = 'efectivo' | 'bizum' | 'transferencia' | 'otro'
export type TransactionType = 'ingreso' | 'gasto'
export type WithdrawalScope = 'equipo' | 'partido'
export type HomeAway = 'local' | 'visitante'
export type MatchStatus = 'programado' | 'jugado' | 'aplazado'
export type MatchType = 'liga' | 'entreno'

export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          email: string | null
          position: PlayerPosition | null
          level: string | null
          status: PlayerStatus
          joined_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone?: string | null
          email?: string | null
          position?: PlayerPosition | null
          level?: string | null
          status?: PlayerStatus
          joined_at: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          email?: string | null
          position?: PlayerPosition | null
          level?: string | null
          status?: PlayerStatus
          joined_at?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      player_fees: {
        Row: {
          id: string
          player_id: string
          concept: string
          amount: number
          status: FeeStatus
          paid_at: string | null
          payment_method: PaymentMethod | null
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          concept: string
          amount: number
          status?: FeeStatus
          paid_at?: string | null
          payment_method?: PaymentMethod | null
          due_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          concept?: string
          amount?: number
          status?: FeeStatus
          paid_at?: string | null
          payment_method?: PaymentMethod | null
          due_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'player_fees_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          }
        ]
      }
      team_transactions: {
        Row: {
          id: string
          type: TransactionType
          concept: string
          amount: number
          date: string
          related_player_id: string | null
          related_fee_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: TransactionType
          concept: string
          amount: number
          date: string
          related_player_id?: string | null
          related_fee_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: TransactionType
          concept?: string
          amount?: number
          date?: string
          related_player_id?: string | null
          related_fee_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'team_transactions_related_player_id_fkey'
            columns: ['related_player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_transactions_related_fee_id_fkey'
            columns: ['related_fee_id']
            isOneToOne: false
            referencedRelation: 'player_fees'
            referencedColumns: ['id']
          }
        ]
      }
      withdrawals: {
        Row: {
          id: string
          player_id: string
          scope: WithdrawalScope
          match_id: string | null
          reason: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          scope: WithdrawalScope
          match_id?: string | null
          reason?: string | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          scope?: WithdrawalScope
          match_id?: string | null
          reason?: string | null
          date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'withdrawals_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'withdrawals_match_id_fkey'
            columns: ['match_id']
            isOneToOne: false
            referencedRelation: 'matches'
            referencedColumns: ['id']
          }
        ]
      }
      matches: {
        Row: {
          id: string
          date: string
          match_type: MatchType
          opponent: string | null
          location: string | null
          home_away: HomeAway | null
          result_summary: string | null
          status: MatchStatus
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          match_type?: MatchType
          opponent?: string | null
          location?: string | null
          home_away?: HomeAway | null
          result_summary?: string | null
          status?: MatchStatus
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          match_type?: MatchType
          opponent?: string | null
          location?: string | null
          home_away?: HomeAway | null
          result_summary?: string | null
          status?: MatchStatus
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      match_sets: {
        Row: {
          id: string
          match_id: string
          pair_number: number
          player_ids: string[]
          sets_won: number
          sets_lost: number
          won: boolean
        }
        Insert: {
          id?: string
          match_id: string
          pair_number: number
          player_ids: string[]
          sets_won: number
          sets_lost: number
          won: boolean
        }
        Update: {
          id?: string
          match_id?: string
          pair_number?: number
          player_ids?: string[]
          sets_won?: number
          sets_lost?: number
          won?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'match_sets_match_id_fkey'
            columns: ['match_id']
            isOneToOne: false
            referencedRelation: 'matches'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      player_position: PlayerPosition
      player_status: PlayerStatus
      fee_status: FeeStatus
      payment_method: PaymentMethod
      transaction_type: TransactionType
      withdrawal_scope: WithdrawalScope
      home_away: HomeAway
      match_status: MatchStatus
      match_type: MatchType
    }
    CompositeTypes: { [_ in never]: never }
  }
}
