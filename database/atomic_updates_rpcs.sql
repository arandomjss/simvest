--SimVest Database Atomic Update RPCs
-- Run this in Supabase SQL Editor

-- 1. Adjust user balance (supports addition/subtraction)
CREATE OR REPLACE FUNCTION public.adjust_balance(
    p_user_id UUID,
    p_amount DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_new_balance DECIMAL;
BEGIN
    UPDATE public.profiles
    SET virtual_balance = virtual_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING virtual_balance INTO v_new_balance;
    
    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Deduct user balance atomically with sufficient balance check
CREATE OR REPLACE FUNCTION public.deduct_balance(
    p_user_id UUID,
    p_amount DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_new_balance DECIMAL;
BEGIN
    UPDATE public.profiles
    SET virtual_balance = virtual_balance - p_amount,
        updated_at = NOW()
    WHERE id = p_user_id AND virtual_balance >= p_amount
    RETURNING virtual_balance INTO v_new_balance;
    
    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Deduct holding quantity atomically, deleting the row if quantity drops to 0 to satisfy check constraints
CREATE OR REPLACE FUNCTION public.deduct_holding(
    p_user_id UUID,
    p_instrument_key TEXT,
    p_quantity INT
) RETURNS json AS $$
DECLARE
    v_current_qty INT;
    v_result json;
BEGIN
    -- Lock the row to prevent race conditions
    SELECT quantity INTO v_current_qty
    FROM public.holdings
    WHERE user_id = p_user_id AND instrument_key = p_instrument_key
    FOR UPDATE;
    
    IF v_current_qty IS NULL OR v_current_qty < p_quantity THEN
        RETURN NULL;
    END IF;
    
    IF v_current_qty = p_quantity THEN
        DELETE FROM public.holdings
        WHERE user_id = p_user_id AND instrument_key = p_instrument_key;
        
        v_result := json_build_object('status', 'DELETED', 'quantity', 0);
    ELSE
        UPDATE public.holdings
        SET quantity = quantity - p_quantity,
            updated_at = NOW()
        WHERE user_id = p_user_id AND instrument_key = p_instrument_key
        RETURNING json_build_object('status', 'UPDATED', 'quantity', quantity) INTO v_result;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Atomically restore/upsert holding on sell order cancellation
CREATE OR REPLACE FUNCTION public.return_holding(
    p_user_id UUID,
    p_symbol TEXT,
    p_instrument_key TEXT,
    p_quantity INT,
    p_avg_price DECIMAL
) RETURNS void AS $$
BEGIN
    INSERT INTO public.holdings (user_id, symbol, instrument_key, quantity, avg_price)
    VALUES (p_user_id, p_symbol, p_instrument_key, p_quantity, p_avg_price)
    ON CONFLICT (user_id, instrument_key)
    DO UPDATE SET
        avg_price = ((holdings.avg_price * holdings.quantity) + (p_avg_price * p_quantity)) / (holdings.quantity + p_quantity),
        quantity = holdings.quantity + p_quantity,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
