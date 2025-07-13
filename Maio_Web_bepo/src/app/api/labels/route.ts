import { NextRequest, NextResponse } from 'next/server';
import { fetchJson, API_BASE_URL } from '../../../utils/fetcher';

export async function POST(request: NextRequest) {
  try {
    const { labels } = await request.json();
    const data = await fetchJson<{ message?: string; error?: string }>(`${API_BASE_URL}/submit-labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labels }),
    });
    return NextResponse.json({ success: true, message: data.message });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : '라벨 저장 중 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, message: errMsg },
      { status: 500 }
    );
  }
}