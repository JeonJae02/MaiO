// app/api/csv/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchJson, API_BASE_URL } from '../../../../utils/fetcher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await fetchJson(`${API_BASE_URL}/validate_parameters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, message: '파라미터 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
