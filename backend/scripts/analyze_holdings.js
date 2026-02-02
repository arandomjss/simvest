import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from backend root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const devUserId = '11111111-1111-1111-1111-111111111111';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAdanient() {
    console.log(`🔍 Forensics for ADANIENT (Dev User)`);

    // 1. Fetch Actual Holding
    const { data: holding } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', devUserId)
        .eq('symbol', 'ADANIENT')
        .maybeSingle();

    console.log(`\n📊 Actual DB Holding: ${holding ? holding.quantity : '0 (Record missing)'}`);

    // 2. Fetch All Orders
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', devUserId)
        .eq('symbol', 'ADANIENT') // Filter only ADANIENT
        .order('created_at', { ascending: true });

    console.log(`\n📝 Order History (${orders ? orders.length : 0}):`);

    let calculatedQty = 0;
    if (orders) {
        orders.forEach(o => {
            let change = 0;
            if (o.status === 'EXECUTED') {
                if (o.type === 'BUY') {
                    change = o.quantity;
                    calculatedQty += o.quantity;
                } else if (o.type === 'SELL') {
                    change = -o.quantity;
                    calculatedQty -= o.quantity;
                }
            }
            console.log(`  [${o.created_at ? o.created_at.slice(0, 19) : 'N/A'}] ${o.status.padEnd(8)} ${o.type.padEnd(4)} ${String(o.quantity).padStart(3)} @ ${String(o.execution_price).padStart(7)} | Change: ${String(change).padStart(3)} | Net: ${calculatedQty}`);
        });
    }

    console.log(`\n🧮 Calculated Net Quantity: ${calculatedQty}`);
    console.log(`🚨 Mismatch: ${calculatedQty !== (holding ? holding.quantity : 0) ? 'YES' : 'NO'}`);
}

analyzeAdanient();
