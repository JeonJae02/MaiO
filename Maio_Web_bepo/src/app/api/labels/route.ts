import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { labels } = await request.json();
    
    const response = await fetch('http://127.0.0.1:5000/submit-labels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ labels }),
    });

    const data = await response.json();
    return NextResponse.json({ success: true, message: data.message });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, message: '라벨 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}