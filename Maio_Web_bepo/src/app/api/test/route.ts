// route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchJson, API_BASE_URL } from '../../../utils/fetcher';

// 기존 NPY 파일 업로드
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = await fetchJson(`${API_BASE_URL}/input_npy_data_test`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, message: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


// 기존 테스트 실행 (SSE)
export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${API_BASE_URL}/test`, {
          credentials: 'include',
        });
        
        const reader = response.body?.getReader();
        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          
          const text = new TextDecoder().decode(value);
          controller.enqueue(encoder.encode(text));
        }
      } catch {
        controller.enqueue(encoder.encode('data: 테스트 중 오류가 발생했습니다.\n\n'));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
