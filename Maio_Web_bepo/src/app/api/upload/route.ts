import { NextRequest, NextResponse } from 'next/server';
import { fetchJson, API_BASE_URL } from '../../../utils/fetcher';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, message: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    const data = await fetchJson<{ total_count?: number; message?: string }>(`${API_BASE_URL}/input_npy_data`, {
      method: 'POST',
      body: formData,
    });

    return NextResponse.json({
      success: true,
      total_count: data.total_count,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, message: errMsg },
      { status: 500 }
    );
  }
}