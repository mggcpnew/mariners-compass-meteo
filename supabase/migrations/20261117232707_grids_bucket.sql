-- Bucket privado dos arquivos de grade (ESPECIFICACAO.md, B4 e B8: Storage privado).
-- Nome [PROPOSTA]: 'grids' (GRID_BUCKET). Nenhuma política em storage.objects:
-- só o service_role (Functions e job) lê e grava.
insert into storage.buckets (id, name, public)
values ('grids', 'grids', false)
on conflict (id) do nothing;
