create or replace function public.current_app_role()
returns text
language sql
stable
as $$
select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'VISITANTE');
$$;

comment on function public.current_app_role is 'Rol de negocio leído de app_metadata del JWT';

alter table public."Usuario" enable row level security;

drop policy if exists usuario_select_self_or_admin on public."Usuario";
create policy usuario_select_self_or_admin
on public."Usuario"
for select
to authenticated
using (
id = auth.uid()
or public.current_app_role() in ('ROOT', 'ADMINISTRADOR')
);

drop policy if exists usuario_insert_self_or_admin on public."Usuario";
create policy usuario_insert_self_or_admin
on public."Usuario"
for insert
to authenticated
with check (
id = auth.uid()
or public.current_app_role() in ('ROOT', 'ADMINISTRADOR')
);

drop policy if exists usuario_update_self_or_admin on public."Usuario";
create policy usuario_update_self_or_admin
on public."Usuario"
for update
to authenticated
using (
id = auth.uid()
or public.current_app_role() in ('ROOT', 'ADMINISTRADOR')
)
with check (
id = auth.uid()
or public.current_app_role() in ('ROOT', 'ADMINISTRADOR')
);