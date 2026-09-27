#!/usr/bin/env bash
# Applies all migrations + seed to a THROWAWAY local Postgres database and runs
# the RLS/trigger tests. Never point this at a real Supabase project.
# Usage: TEST_DATABASE_URL=postgres://postgres@localhost/mami_test scripts/test-db.sh
set -euo pipefail
: "${TEST_DATABASE_URL:?Set TEST_DATABASE_URL to an empty throwaway database}"
cd "$(dirname "$0")/.."
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -q -c 'drop schema if exists auth cascade; drop schema public cascade; create schema public;'
cat supabase/tests/00_supabase_stub.sql supabase/migrations/*.sql supabase/seed.sql \
  | psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -q
psql "$TEST_DATABASE_URL" -q -t -f supabase/tests/rls_test.sql | grep -E 'OK|FAIL|PASSED'
