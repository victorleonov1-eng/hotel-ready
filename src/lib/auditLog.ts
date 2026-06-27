// Audit Logging System - Tracks all critical security events
import { supabase } from './supabase';

export type AuditEventType =
  | 'login_success'
  | 'login_failure'
  | 'login_lockout'
  | 'admin_access'
  | 'admin_access_denied'
  | 'staff_created'
  | 'staff_deleted'
  | 'staff_modified'
  | 'pin_changed'
  | 'password_changed'
  | 'organization_modified'
  | 'training_session'
  | 'data_export'
  | 'data_access';

export interface AuditLog {
  id?: string;
  event_type: AuditEventType;
  user_id?: string;
  user_email?: string;
  organization_id?: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure';
  details?: Record<string, any>;
  created_at?: string;
}

// Get client IP address (best effort)
function getClientIp(): string {
  if (typeof window === 'undefined') return 'unknown';

  // Try to get from various sources
  const ip = (window as any).clientIp ||
             (window as any).userIp ||
             'unknown';
  return ip;
}

// Get user agent
function getUserAgent(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  return navigator.userAgent;
}

/**
 * Log a security-relevant event
 */
export async function logAuditEvent(event: AuditLog): Promise<void> {
  try {
    const enrichedEvent = {
      ...event,
      ip_address: event.ip_address || getClientIp(),
      user_agent: event.user_agent || getUserAgent(),
      created_at: new Date().toISOString(),
    };

    console.log('[AUDIT]', enrichedEvent.event_type, enrichedEvent.status);

    // Only log to Supabase if authenticated
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // Insert into audit_logs table (you'll need to create this table)
      // For now, just log to console for audit trail
      try {
        await supabase
          .from('audit_logs')
          .insert([enrichedEvent]);
      } catch (error) {
        console.warn('[AUDIT] Could not log to database:', error);
        // Don't throw - don't let logging failures break the app
      }
    }
  } catch (error) {
    console.error('[AUDIT] Error logging event:', error);
  }
}

/**
 * Log a login attempt
 */
export async function logLoginAttempt(
  email: string,
  success: boolean,
  organizationId?: string
): Promise<void> {
  await logAuditEvent({
    event_type: success ? 'login_success' : 'login_failure',
    user_email: email,
    organization_id: organizationId,
    status: success ? 'success' : 'failure',
    details: {
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log admin dashboard access
 */
export async function logAdminAccess(
  userId: string,
  success: boolean
): Promise<void> {
  await logAuditEvent({
    event_type: success ? 'admin_access' : 'admin_access_denied',
    user_id: userId,
    status: success ? 'success' : 'failure',
  });
}

/**
 * Log staff creation
 */
export async function logStaffCreated(
  staffId: string,
  staffName: string,
  organizationId: string,
  userId: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'staff_created',
    user_id: userId,
    organization_id: organizationId,
    resource_type: 'staff',
    resource_id: staffId,
    status: 'success',
    details: { staffName },
  });
}

/**
 * Log staff deletion
 */
export async function logStaffDeleted(
  staffId: string,
  staffName: string,
  organizationId: string,
  userId: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'staff_deleted',
    user_id: userId,
    organization_id: organizationId,
    resource_type: 'staff',
    resource_id: staffId,
    status: 'success',
    details: { staffName },
  });
}

/**
 * Log training session completion
 */
export async function logTrainingSession(
  staffId: string,
  organizationId: string,
  scenarioId: string,
  score: number
): Promise<void> {
  await logAuditEvent({
    event_type: 'training_session',
    resource_type: 'training_session',
    resource_id: staffId,
    organization_id: organizationId,
    status: 'success',
    details: {
      scenarioId,
      score,
      timestamp: new Date().toISOString(),
    },
  });
}
