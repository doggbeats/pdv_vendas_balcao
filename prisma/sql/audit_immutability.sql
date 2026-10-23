-- Registros de auditoria são imutáveis: nem ADMIN pode alterar ou excluir.
CREATE OR REPLACE FUNCTION code_ph_bloqueia_alteracao_auditoria()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Registros de auditoria são imutáveis.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditoria_sem_update_delete ON "AuditoriaExclusaoVenda";
CREATE TRIGGER trg_auditoria_sem_update_delete
BEFORE UPDATE OR DELETE ON "AuditoriaExclusaoVenda"
FOR EACH ROW EXECUTE FUNCTION code_ph_bloqueia_alteracao_auditoria();

DROP TRIGGER IF EXISTS trg_auditoria_sem_truncate ON "AuditoriaExclusaoVenda";
CREATE TRIGGER trg_auditoria_sem_truncate
BEFORE TRUNCATE ON "AuditoriaExclusaoVenda"
FOR EACH STATEMENT EXECUTE FUNCTION code_ph_bloqueia_alteracao_auditoria();
