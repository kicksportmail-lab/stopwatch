create table public.todos (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  title text not null,
  is_completed boolean not null default false,
  date date not null default current_date,
  user_id uuid not null default auth.uid (),
  constraint todos_pkey primary key (id),
  constraint todos_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

alter table public.todos enable row level security;

create policy "Users can view their own todos" on public.todos as permissive for select to authenticated using ((auth.uid() = user_id));

create policy "Users can insert their own todos" on public.todos as permissive for insert to authenticated with check ((auth.uid() = user_id));

create policy "Users can update their own todos" on public.todos as permissive for update to authenticated using ((auth.uid() = user_id));

create policy "Users can delete their own todos" on public.todos as permissive for delete to authenticated using ((auth.uid() = user_id));
