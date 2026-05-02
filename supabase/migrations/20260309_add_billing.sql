-- Create billing table to track system subscription status
create table if not exists public.system_billing (
    id uuid primary key default uuid_generate_v4(),
    stripe_customer_id text,
    stripe_subscription_id text,
    subscription_active boolean default false,
    current_period_end timestamp with time zone,
    updated_at timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Ensure there is only ever one row in this table (singleton pattern)
create unique index if not exists system_billing_id_idx on public.system_billing ((id is not null));

-- Insert initial row if not exists
insert into public.system_billing (subscription_active)
select false
where not exists (select 1 from public.system_billing);

-- RLS
alter table public.system_billing enable row level security;

-- Only authenticated admins should be able to read this
-- In this system, all authenticated users seem to be treated as admins in the backend policies seen earlier,
-- but we'll stick to authenticated access for now.
create policy "Allow authenticated users to read billing status"
on public.system_billing for select
to authenticated
using (true);

-- Functions to update timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger on_system_billing_updated
    before update on public.system_billing
    for each row
    execute procedure public.handle_updated_at();
