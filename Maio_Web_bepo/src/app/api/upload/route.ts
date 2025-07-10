import { NextRequest, NextResponse } from 'next/server';

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

    const response = await fetch('http://127.0.0.1:5000/input_npy_data', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json({
      success: true,
      total_count: data.total_count,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}