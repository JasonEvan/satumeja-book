alter table public.store_settings
add column if not exists payment_gateway_enabled boolean not null default true;

alter table public.rentals
add column if not exists payment_proof_path text;

alter table public.rentals
add column if not exists payment_proof_uploaded_at timestamptz;

alter table public.rentals
add column if not exists payment_proof_mime_type text;

alter table public.rentals
add column if not exists payment_proof_size_bytes bigint;

alter table public.rentals
add column if not exists payment_verification_status text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rentals_payment_verification_status_check'
      and conrelid = 'public.rentals'::regclass
  ) then
    alter table public.rentals
    add constraint rentals_payment_verification_status_check
    check (
      payment_verification_status is null
      or payment_verification_status in ('pending_review', 'approved', 'rejected')
    );
  end if;
end $$;

create index if not exists rentals_payment_verification_status_idx
on public.rentals (payment_verification_status);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
