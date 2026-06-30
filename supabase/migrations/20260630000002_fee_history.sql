-- ── fee_history: audit log for player_fees ─────────────────────────────────
-- fee_id carries no FK constraint by design: audit entries must survive
-- fee deletion (a FK with ON DELETE CASCADE would cascade-delete the very
-- "eliminada" row we just inserted; RESTRICT would block deletion entirely).

CREATE TYPE fee_history_action AS ENUM (
  'creada',
  'marcada_pagada',
  'pago_anulado',
  'editada',
  'eliminada'
);

CREATE TABLE fee_history (
  id               uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id           uuid               NOT NULL,
  action           fee_history_action NOT NULL,
  previous_status  text,
  new_status       text,
  notes            text,
  changed_at       timestamptz        NOT NULL DEFAULT now()
);

CREATE INDEX fee_history_fee_id_idx ON fee_history(fee_id);

-- ── Trigger function ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fee_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- INSERT → cuota creada
  IF TG_OP = 'INSERT' THEN
    INSERT INTO fee_history(fee_id, action, new_status)
    VALUES (NEW.id, 'creada', NEW.status::text);
    RETURN NEW;
  END IF;

  -- UPDATE → status change or field edit
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO fee_history(fee_id, action, previous_status, new_status)
      VALUES (
        NEW.id,
        CASE
          WHEN OLD.status = 'pendiente' AND NEW.status = 'pagado'
            THEN 'marcada_pagada'::fee_history_action
          WHEN OLD.status = 'pagado' AND NEW.status = 'pendiente'
            THEN 'pago_anulado'::fee_history_action
          ELSE
            'editada'::fee_history_action
        END,
        OLD.status::text,
        NEW.status::text
      );
    ELSE
      -- Non-status fields changed (concept, amount, due_date, etc.)
      INSERT INTO fee_history(fee_id, action, previous_status, new_status)
      VALUES (NEW.id, 'editada', OLD.status::text, NEW.status::text);
    END IF;
    RETURN NEW;
  END IF;

  -- DELETE → cuota eliminada (entry survives because there is no FK)
  IF TG_OP = 'DELETE' THEN
    INSERT INTO fee_history(fee_id, action, previous_status)
    VALUES (OLD.id, 'eliminada', OLD.status::text);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_player_fees_history
AFTER INSERT OR UPDATE OR DELETE ON player_fees
FOR EACH ROW EXECUTE FUNCTION trg_fee_history();
