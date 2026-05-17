import { createClient } from '@supabase/supabase-js';

// These tests require a real Supabase instance (staging) to verify RLS.
// They will be skipped if the environment variables are not provided.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const userAEmail = process.env.TEST_USER_A_EMAIL || '';
const userAPassword = process.env.TEST_USER_A_PASSWORD || '';
const userBEmail = process.env.TEST_USER_B_EMAIL || '';
const userBPassword = process.env.TEST_USER_B_PASSWORD || '';

const shouldRunTests = supabaseUrl && supabaseKey && userAEmail && userBEmail;

(shouldRunTests ? describe : describe.skip)('Supabase RLS Verification', () => {
    let clientA;
    let clientB;
    let userAId;
    let userBId;

    beforeAll(async () => {
        clientA = createClient(supabaseUrl, supabaseKey);
        clientB = createClient(supabaseUrl, supabaseKey);

        const { data: authA, error: errA } = await clientA.auth.signInWithPassword({ email: userAEmail, password: userAPassword });
        if (errA) throw new Error(`User A login failed: ${errA.message}`);
        userAId = authA.user.id;

        const { data: authB, error: errB } = await clientB.auth.signInWithPassword({ email: userBEmail, password: userBPassword });
        if (errB) throw new Error(`User B login failed: ${errB.message}`);
        userBId = authB.user.id;
    });

    test('User A cannot read User B profile', async () => {
        const { data, error } = await clientA.from('profiles').select('*').eq('id', userBId);
        expect(error).toBeNull();
        expect(data).toHaveLength(0); // RLS should hide the row
    });

    test('User B cannot read User A portfolio holdings', async () => {
        const { data, error } = await clientB.from('holdings').select('*').eq('user_id', userAId);
        expect(error).toBeNull();
        expect(data).toHaveLength(0);
    });

    test('User A cannot update User B orders', async () => {
        // Attempt to update a non-existent/hidden order belonging to User B
        const { data, error } = await clientA.from('orders')
            .update({ status: 'CANCELLED' })
            .eq('user_id', userBId)
            .select();
        
        expect(error).toBeNull();
        expect(data).toHaveLength(0);
    });
});
