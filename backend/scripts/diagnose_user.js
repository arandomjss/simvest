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

async function diagnose() {
    console.log('🔍 Diagnosing User:', devUserId);

    // 1. Check Auth User
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(devUserId);
    if (authError) {
        console.log('❌ Auth User Fetch Error:', authError.message);
    } else if (!user) {
        console.log('❌ Auth User NOT FOUND');
    } else {
        console.log('✅ Auth User EXISTS:', user.id, user.email);
    }

    // 2. Check Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', devUserId)
        .maybeSingle();

    if (profileError) {
        console.log('❌ Profile Fetch Error:', profileError.message);
    } else if (!profile) {
        console.log('❌ Profile NOT FOUND in public.profiles');
    } else {
        console.log('✅ Profile EXISTS:', profile);
    }

    // Attempt repair if missing
    if (!user) {
        console.log('🛠️  Attempting to create Auth User...');
        const { data, error } = await supabase.auth.admin.createUser({
            id: devUserId,
            email: 'dev@simvest.com',
            email_confirm: true,
            user_metadata: { name: 'Dev User' }
        });
        if (error) console.error('❌ Creation Failed:', error.message);
        else console.log('✅ Auth User Created!', data.user.id);
    }
}

diagnose();
