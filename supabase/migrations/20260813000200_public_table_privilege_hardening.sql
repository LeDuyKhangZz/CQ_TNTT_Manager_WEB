-- ============================================================================
-- Phase 3 security hotfix — least privilege for Internet-facing DB roles.
--
-- Supabase's bootstrap default ACL had left `anon` and `authenticated` with
-- TRUNCATE/REFERENCES/TRIGGER/MAINTAIN on every table in `public`. RLS does not
-- apply to TRUNCATE, so those grants contradicted the database's append-only
-- and row-scope guarantees even though PostgREST does not expose TRUNCATE as a
-- table endpoint.
--
-- Keep the application's existing SELECT/INSERT/UPDATE/DELETE grants exactly
-- as they are. Only DDL/maintenance privileges that no browser session needs
-- are removed from existing tables and from the default ACL of `postgres`,
-- the owner used by every project migration/table in this repository.
--
-- Supabase also ships a platform-managed default ACL owned by
-- `supabase_admin`. The local migration role is deliberately not a member of
-- that role, so trying to alter its defaults makes `supabase db reset` fail
-- with SQLSTATE 42501. Do not hide that failure in an exception block: current
-- project objects are explicitly protected below, while the platform-owned
-- default remains a documented residual outside this migration's authority.
-- ============================================================================

revoke truncate, references, trigger, maintain
on all tables in schema public
from anon, authenticated;

alter default privileges for role postgres in schema public
revoke truncate, references, trigger, maintain on tables
from anon, authenticated;
