-- Stage 5a: crew role (barista, waiter, part-timer). Own file: a new enum value cannot be used in the
-- transaction that adds it.
alter type public.app_role add value if not exists 'crew';
