import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const devUserId = '11111111-1111-1111-1111-111111111111';

async function repair() {
    console.log('🛠️ Repairing ADANIENT Holding...');

    // 1. Check if it appeared (race condition check)
    const { data: existing } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', devUserId)
        .eq('symbol', 'ADANIENT')
        .maybeSingle();

    if (existing) {
        console.log('⚠️ Holding already exists:', existing);
        return;
    }

    // 2. Insert Missing Holding
    const { data, error } = await supabase
        .from('holdings')
        .insert({
            user_id: devUserId,
            symbol: 'ADANIENT',
            instrument_key: 'NSE_EQ|INE423A01024',
            quantity: 10,
            avg_price: 1942.80 // Based on recent bulk buy
        })
        .select();

    if (error) {
        console.error('❌ Repair Failed:', error.message);
    } else {
        console.log('✅ Repair Successful! Restored 10 shares of ADANIENT.');
        console.log(data);
    }
}

repair();
