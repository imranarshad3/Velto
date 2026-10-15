-- Repair audit entities used by team invitation/member RPCs and resource management.
-- Existing audit history, RLS and privileges are preserved. Safe to re-run.
alter table public.admin_audit_log
  drop constraint if exists admin_audit_log_entity_check;
alter table public.admin_audit_log
  add constraint admin_audit_log_entity_check
  check (entity in ('quote', 'product', 'message', 'admin_invitation', 'admin_member', 'resource'));
