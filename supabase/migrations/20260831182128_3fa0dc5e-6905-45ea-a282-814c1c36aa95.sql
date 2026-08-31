-- 1. profiles auto-creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- backfill existing users
insert into public.profiles (id, full_name)
select u.id, nullif(u.raw_user_meta_data->>'full_name', '')
from auth.users u
on conflict (id) do nothing;

-- 2. order number prefix
alter table public.orders
  alter column order_number set default ('IP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)));

-- 3. storage policies for boutique-medias
create policy "boutique medias readable by everyone"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'boutique-medias');

create policy "owners can upload boutique medias"
on storage.objects for insert
to authenticated
with check (bucket_id = 'boutique-medias' and owner = auth.uid());

create policy "owners can update boutique medias"
on storage.objects for update
to authenticated
using (bucket_id = 'boutique-medias' and owner = auth.uid());

create policy "owners can delete boutique medias"
on storage.objects for delete
to authenticated
using (bucket_id = 'boutique-medias' and owner = auth.uid());