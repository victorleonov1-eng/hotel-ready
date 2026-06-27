import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logLoginAttempt } from '../lib/auditLog';
import { isLoginRateLimited, recordFailedLoginAttempt, clearLoginAttempts } from '../lib/rateLimiter';

export type UserRole = 'staff' | 'manager' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id?: string;
  property_id?: string;
  password_expires_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, orgName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data as UserProfile || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const login = async (email: string, password: string) => {
    // Check rate limiting
    const rateLimit = isLoginRateLimited(email);
    if (rateLimit.limited) {
      const error = new Error(
        `Too many login attempts. Please try again in ${rateLimit.minutesRemaining} minute(s).`
      );
      await logLoginAttempt(email, false);
      throw error;
    }

    // Attempt login
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      recordFailedLoginAttempt(email);
      await logLoginAttempt(email, false);
      throw error;
    }

    // Success - clear rate limit counter
    clearLoginAttempts(email);
    await logLoginAttempt(email, true);
  };

  const register = async (email: string, password: string, fullName: string, orgName: string) => {
    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      console.log('User created:', authData.user.id);

      // Create organization with PIN expiry set to today (0 days = expired/pending approval)
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          admin_id: authData.user.id,
          pin_expires_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orgError) {
        console.error('Organization creation error:', orgError);
        throw orgError;
      }

      console.log('Organization created:', orgData.id);

      // Create user profile - use upsert to avoid RLS issues
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role: 'admin',
          organization_id: orgData.id,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('Profile created successfully');

      // Sign out after registration so they see the approval screen
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
