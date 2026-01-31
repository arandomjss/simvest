import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use Service Role Key to bypass RLS

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDevUser() {
    console.log('🌱 Seeding Dev User...');

    const devUserId = '11111111-1111-1111-1111-111111111111';
    const devEmail = 'dev@simvest.com';

    // Check if profile exists
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', devUserId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Is empty"
        console.error('Error fetching profile:', fetchError);
        return;
    }

    if (profile) {
        console.log('✅ Dev user profile already exists:', profile);
        console.log('⚠️ Dev user profile missing. Creating...');

        // 1. Create Auth User first (to satisfy FK constraint)
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            id: devUserId,
            email: devEmail,
            email_confirm: true
        });

        if (authError) {
            console.warn('⚠️ Could not create auth user (might already exist):', authError.message);
        } else {
            console.log('✅ Auth user created');
        }

        // 2. Create Profile
        const { error: insertError } = await supabase
            .from('profiles')
            .insert({
                id: devUserId,
                email: devEmail,
                virtual_balance: 1000000.00
            });

        if (insertError) {
            console.error('Failed to create dev profile:', insertError.message);
        } else {
            console.log('✅ Dev user profile created with ₹10,00,000 balance');
        }
    }
}

seedDevUser();
