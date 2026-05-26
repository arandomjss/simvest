import TradingEngine from '../src/services/TradingEngine.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const devUserId = '11111111-1111-1111-1111-111111111111';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock MarketStreamService
class MockMarketStream {
    constructor() {
        this.prices = {
            'NSE_EQ|INE002A01018': 2400.00 // Mock price for RELIANCE
        };
    }
    getCachedPrice(key) {
        return this.prices[key];
    }
    on() {}
}

async function runTests() {
    console.log('🧪 Starting TradingEngine RPC Integration Tests...');
    
    // 1. Initialize TradingEngine with Mocked Market Stream
    const mockMarketStream = new MockMarketStream();
    const engine = new TradingEngine(mockMarketStream);
    
    // Override isMarketOpen to always return true for testing
    engine.isMarketOpen = () => true;

    try {
        // 2. Fetch current balance before trade
        const { data: profileBefore, error: pError } = await supabase
            .from('profiles')
            .select('virtual_balance')
            .eq('id', devUserId)
            .single();
            
        if (pError) throw pError;
        
        const balanceBefore = parseFloat(profileBefore.virtual_balance);
        console.log(`💰 Current Dev User Virtual Balance: ₹${balanceBefore}`);

        // Set symbol and keys for mock stock
        const symbol = 'RELIANCE';
        const instrumentKey = 'NSE_EQ|INE002A01018';
        const qty = 5;
        const buyPrice = 2400.00;
        const totalCost = buyPrice * qty; // ₹12,000

        console.log(`📈 Placing MARKET BUY Order of ${qty} ${symbol} @ ₹${buyPrice} (Total: ₹${totalCost})...`);
        
        // 3. Execute BUY order
        const buyResult = await engine.executeTrade(devUserId, {
            symbol,
            instrumentKey,
            type: 'BUY',
            quantity: qty,
            orderType: 'MARKET',
            strategy: 'Test RPC Buy',
            notes: 'Testing deduct_balance and upsert_holding RPCs'
        });

        console.log('✅ BUY Order Execution Result:', buyResult);

        // 4. Verify balance is correctly decremented
        const { data: profileAfterBuy } = await supabase
            .from('profiles')
            .select('virtual_balance')
            .eq('id', devUserId)
            .single();
            
        const balanceAfterBuy = parseFloat(profileAfterBuy.virtual_balance);
        console.log(`💰 Balance After BUY: ₹${balanceAfterBuy}`);
        const balanceDiff = Math.abs(balanceBefore - balanceAfterBuy - totalCost);
        
        if (balanceDiff < 0.01) {
            console.log('🎉 SUCCESS: Balance was decremented atomically by exact total cost!');
        } else {
            console.error(`❌ FAILURE: Expected balance to be ₹${balanceBefore - totalCost}, but got ₹${balanceAfterBuy}`);
        }

        // 5. Verify holdings got updated
        const { data: holding } = await supabase
            .from('holdings')
            .select('*')
            .eq('user_id', devUserId)
            .eq('instrument_key', instrumentKey)
            .maybeSingle();

        console.log('📦 Holding Record after BUY:', holding);
        if (holding && parseInt(holding.quantity) >= qty) {
            console.log('🎉 SUCCESS: Holding was atomically granted/updated via RPC!');
        } else {
            console.error('❌ FAILURE: Holding not found or quantity mismatch');
        }

        // 6. Test SELL order
        console.log(`📉 Placing MARKET SELL Order of ${qty} ${symbol} @ ₹${buyPrice} (Total: ₹${totalCost})...`);
        const sellResult = await engine.executeTrade(devUserId, {
            symbol,
            instrumentKey,
            type: 'SELL',
            quantity: qty,
            orderType: 'MARKET',
            strategy: 'Test RPC Sell',
            notes: 'Testing deduct_holding and adjust_balance RPCs'
        });

        console.log('✅ SELL Order Execution Result:', sellResult);

        // 7. Verify balance is correctly incremented back
        const { data: profileAfterSell } = await supabase
            .from('profiles')
            .select('virtual_balance')
            .eq('id', devUserId)
            .single();

        const balanceAfterSell = parseFloat(profileAfterSell.virtual_balance);
        console.log(`💰 Balance After SELL: ₹${balanceAfterSell}`);
        
        if (Math.abs(balanceAfterSell - balanceBefore) < 0.01) {
            console.log('🎉 SUCCESS: Balance was incremented atomically back to starting value!');
        } else {
            console.error(`❌ FAILURE: Expected balance to be close to ₹${balanceBefore}, but got ₹${balanceAfterSell}`);
        }

        // 8. Verify holding is removed or reduced
        const { data: holdingAfterSell } = await supabase
            .from('holdings')
            .select('*')
            .eq('user_id', devUserId)
            .eq('instrument_key', instrumentKey)
            .maybeSingle();

        console.log('📦 Holding Record after SELL:', holdingAfterSell);
        if (!holdingAfterSell || parseInt(holdingAfterSell.quantity) === 0) {
            console.log('🎉 SUCCESS: Holding was atomically deducted/deleted to comply with constraints!');
        } else {
            console.error('❌ FAILURE: Holding was not fully cleared');
        }

    } catch (e) {
        console.error('❌ Test failed with error:', e);
    }
}

runTests();
