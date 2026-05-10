-- Función para obtener el rol actual desde el JWT
create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'VISITANTE');
$$;

comment on function public.current_app_role is 'Filtra y devuelve el rol del JWT o asume que no esta logueado (VISITANTE)';


-- 1. TRIGGER: Asignar rol por defecto (CLIENTE) ANTES de insertar en auth.users
create or replace function public.handle_new_user_role()
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $$
begin
  -- Si no viene un rol asignado al crearse, poner uno por defecto (CLIENTE)
  if new.raw_app_meta_data is null or not new.raw_app_meta_data ? 'role' then
    new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb) || '{"role": "CLIENTE"}'::jsonb;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_set_role on auth.users;
create trigger on_auth_user_created_set_role
  before insert on auth.users
  for each row execute procedure public.handle_new_user_role();


-- 2. TRIGGER: Crear un perfil vacio en public.usuario DESPUÉS de guardar en auth.users
create or replace function public.handle_new_user_profile()
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $$
begin
  -- ROOT no utiliza un campo de registro público. Solo ADMINS y CLIENTES.
  if new.raw_app_meta_data->>'role' != 'ROOT' then
    -- Cambiado a minúsculas y sin comillas dobles
    insert into public.usuario (id)
    values (new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();


-- 3. POLÍTICAS DE SEGURIDAD PARA public.usuario (RLS)
-- Cambiado a minúsculas y sin comillas dobles
alter table public.usuario enable row level security;

-- Limpieza de políticas previas (usando el nombre en minúsculas)
drop policy if exists usuario_insert_self_or_admin on public.usuario;
drop policy if exists usuario_select_self_or_admin on public.usuario;
drop policy if exists usuario_update_self_or_admin on public.usuario;
drop policy if exists usuario_select_policy on public.usuario;
drop policy if exists usuario_update_policy on public.usuario;


-- SELECT: Quién puede VER perfiles en public.usuario?
create policy usuario_select_policy
on public.usuario
for select
to authenticated
using (
  id = auth.uid()
  or public.current_app_role() in ('ROOT', 'ADMINISTRADOR')
);

-- UPDATE: Quién puede ACTUALIZAR perfiles en public.usuario?
create policy usuario_update_policy
on public.usuario
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);