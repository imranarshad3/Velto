#!/usr/bin/env bash
# Backs up live orders, then applies the order-tracking migration in ONE transaction and verifies it.
set -euo pipefail
cd "$(dirname "$0")/.."
DB="$(grep -E '^SUPABASE_DB_URL=' .env | head -1 | cut -d= -f2- | sed -E "s/^[\"']//; s/[\"']$//")"
B="supabase/backups/pre_order_tracking_$(date +%Y%m%dT%H%M%S)"
umask 077
psql "$DB" -v ON_ERROR_STOP=1 -q -c "\copy (select * from public.orders) to '$B.orders.csv' csv header"
echo "Backup: $B.orders.csv"
psql "$DB" -1 -v ON_ERROR_STOP=1 -q -f supabase/migrations/20261027000100_order_tracking.sql
psql "$DB" -At -c "select status, count(*), count(tracking_number) from public.orders group by 1 order by 1" \
  -c "select string_agg(proname, ',') from pg_proc where proname in ('admin_update_order','order_status_rank','update_cod_order')" \
  -c "select has_function_privilege('anon','public.admin_update_order(text,uuid,text,text,text,boolean,text,text,date)','execute')"
echo "Applied."
