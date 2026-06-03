import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (process.env.VERCEL_ENV === 'production') {
        return NextResponse.json(
            { error: 'Debug routes are not available in production' },
            { status: 403 }
        );
    }

    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');

    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 });
    }

    const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!refMatch) {
        return NextResponse.json({ error: 'Cannot parse SUPABASE_URL' }, { status: 500 });
    }
    const projectRef = refMatch[1];

    const dbUrl = process.env.DATABASE_URL
        || process.env.SUPABASE_DB_URL
        || `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD || serviceKey}@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`;

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
    });

    try {
        const client = await pool.connect();
        try {
            await client.query(`
                -- 1. DROP UNIQUE INDEXES
                DROP INDEX IF EXISTS public.idx_chronicles_unique_quest;
                DROP INDEX IF EXISTS public.idx_chronicles_unique_ugc_quest;

                -- 2. RE-CREATE VIEW DISTINCT ON
                CREATE OR REPLACE VIEW public.user_completed_quests AS
                SELECT DISTINCT ON (user_id, COALESCE(scenario_id::text, ugc_scenario_id::text))
                    id,
                    user_id,
                    scenario_id,
                    ugc_scenario_id,
                    created_at AS completed_at,
                    accumulated_days AS accumulated_days_at_completion
                FROM public.user_chronicles
                WHERE event_type = 'quest_success'
                ORDER BY user_id, COALESCE(scenario_id::text, ugc_scenario_id::text), created_at DESC;

                -- 3. RE-CREATE TRIGGER FUNCTION
                CREATE OR REPLACE FUNCTION public.insert_completed_quests_trigger()
                RETURNS TRIGGER AS $$
                DECLARE
                    v_loc_id UUID;
                    v_loc_name TEXT;
                    v_title TEXT;
                BEGIN
                    SELECT p.current_location_id, l.name 
                    INTO v_loc_id, v_loc_name
                    FROM public.user_profiles p
                    LEFT JOIN public.locations l ON l.id = p.current_location_id
                    WHERE p.id = NEW.user_id;

                    IF v_loc_id IS NULL AND NEW.scenario_id IS NOT NULL THEN
                        SELECT location_id, (SELECT name FROM public.locations WHERE id = s.location_id)
                        INTO v_loc_id, v_loc_name
                        FROM public.scenarios s
                        WHERE s.id = NEW.scenario_id;
                    END IF;

                    IF NEW.ugc_scenario_id IS NOT NULL THEN
                        v_title := COALESCE((SELECT title FROM public.ugc_scenarios WHERE id = NEW.ugc_scenario_id), 'クエスト完了');
                        INSERT INTO public.user_chronicles (
                            user_id, event_type, accumulated_days, scenario_id, ugc_scenario_id, location_id, location_name, title, description, created_at
                        ) VALUES (
                            NEW.user_id, 
                            'quest_success', 
                            COALESCE(NEW.accumulated_days_at_completion, (SELECT accumulated_days FROM public.user_profiles WHERE id = NEW.user_id), 0), 
                            NULL, 
                            NEW.ugc_scenario_id,
                            v_loc_id,
                            v_loc_name,
                            'クエストクリア: ' || v_title,
                            'クエストを成功させた。',
                            COALESCE(NEW.completed_at, NOW())
                        );
                    ELSE
                        v_title := COALESCE((SELECT title FROM public.scenarios WHERE id = NEW.scenario_id), 'クエスト完了');
                        INSERT INTO public.user_chronicles (
                            user_id, event_type, accumulated_days, scenario_id, ugc_scenario_id, location_id, location_name, title, description, created_at
                        ) VALUES (
                            NEW.user_id, 
                            'quest_success', 
                            COALESCE(NEW.accumulated_days_at_completion, (SELECT accumulated_days FROM public.user_profiles WHERE id = NEW.user_id), 0), 
                            NEW.scenario_id, 
                            NULL,
                            v_loc_id,
                            v_loc_name,
                            'クエストクリア: ' || v_title,
                            'クエストを成功させた。',
                            COALESCE(NEW.completed_at, NOW())
                        );
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `);
        } finally {
            client.release();
        }

        return NextResponse.json({ success: true, message: 'Migration applied successfully.' });
    } catch (e: any) {
        console.error('[run-migration] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    } finally {
        await pool.end();
    }
}
