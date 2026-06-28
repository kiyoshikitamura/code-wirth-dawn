-- Update slot CHECK constraint for equipped_items and migrate existing data

DO $$
DECLARE
    constraint_name_var TEXT;
BEGIN
    -- Get the name of the CHECK constraint related to the slot column in equipped_items table
    SELECT conname INTO constraint_name_var
    FROM pg_constraint con
    JOIN pg_class cl ON cl.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE cl.relname = 'equipped_items'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%slot%';

    -- Drop the constraint if it exists
    IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE equipped_items DROP CONSTRAINT ' || quote_ident(constraint_name_var);
    END IF;
END $$;

-- Add new CHECK constraint that allows weapon, armor, accessory, accessory_1, accessory_2, accessory_3
ALTER TABLE equipped_items ADD CONSTRAINT equipped_items_slot_check 
    CHECK (slot IN ('weapon', 'armor', 'accessory', 'accessory_1', 'accessory_2', 'accessory_3'));

-- Migrate existing 'accessory' slot data to 'accessory_1'
UPDATE equipped_items SET slot = 'accessory_1' WHERE slot = 'accessory';
