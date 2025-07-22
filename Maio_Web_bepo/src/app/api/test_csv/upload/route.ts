// app/api/csv/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchJson, API_BASE_URL } from '../../../../utils/fetcher';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = await fetchJson(`${API_BASE_URL}/input_csv_data_test`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, message: 'CSV 파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
