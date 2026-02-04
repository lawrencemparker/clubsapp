// src/types/database.ts

export type UserRole = 'super_admin' | 'org_admin' | 'member';

export interface BrandColors {
  primary: string;    // The main orb color
  secondary: string;  // The secondary orb color
  accent?: string;    // Optional highlight
}

export interface Organization {
  id: number;
  name: string;
  subdomain: string;
  custom_domain?: string | null;
  brand_colors: BrandColors; // JSONB from SQL becomes this object
  logo_url?: string | null;
  created_at: string;
}

export interface Profile {
  id: string; // UUID from auth.users
  organization_id: number;
  role: UserRole;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface Membership {
  id: number;
  user_id: string;
  organization_id: number;
  status: 'active' | 'lapsed' | 'pending';
  expiry_date?: string | null;
  last_payment_date?: string | null;
}