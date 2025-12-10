import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// POST: Create a new identity verification request
export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const name = body?.name;
  const nationalId = body?.nationalId;
  const consent = body?.consent;
  if (!name || !nationalId || consent !== true) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // 주민번호를 해시로 저장 (원문 저장은 피함)
  const nationalIdHash = crypto.createHash('sha256').update(String(nationalId)).digest('hex');

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('identity_verifications')
    .insert([
      {
        clerk_user_id: userId,
        name,
        national_id_hash: nationalIdHash,
        consent: true,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    console.error('[IdentityVerifications] insert error:', error);
    return new NextResponse(error.message, { status: 500 });
  }

  const created = data?.[0];
  return new NextResponse(
    JSON.stringify({ verificationId: created?.id, status: created?.status || 'pending' }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// GET: Fetch verifications for current Clerk user
export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('identity_verifications')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[IdentityVerifications] fetch error:', error);
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}


