-- RPC to atomically upsert a holding, adding quantity and calculating new average price
CREATE OR REPLACE FUNCTION public.upsert_holding(
    p_user_id UUID,
    p_symbol TEXT,
    p_instrument_key TEXT,
    p_quantity INT,
    p_price DECIMAL
) RETURNS void AS $$
DECLARE
    v_total_cost DECIMAL;
    v_new_quantity INT;
    v_new_avg_price DECIMAL;
BEGIN
    -- Try to insert the new holding. If it exists, we handle the conflict.
    INSERT INTO public.holdings (user_id, symbol, instrument_key, quantity, avg_price)
    VALUES (p_user_id, p_symbol, p_instrument_key, p_quantity, p_price)
    ON CONFLICT (user_id, instrument_key) 
    DO UPDATE SET 
        -- Calculate new average price: (old_avg * old_qty + new_price * new_qty) / total_qty
        avg_price = ((holdings.avg_price * holdings.quantity) + (p_price * p_quantity)) / (holdings.quantity + p_quantity),
        -- Add the new quantity
        quantity = holdings.quantity + p_quantity,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
