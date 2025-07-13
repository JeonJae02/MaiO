import { API_BASE_URL } from '../../../utils/fetcher';

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${API_BASE_URL}/train_data`);
        const reader = response.body?.getReader();

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          controller.enqueue(encoder.encode(`data: ${text}\n\n`));
        }
      } catch {
        controller.enqueue(encoder.encode(`data: 학습 중 오류가 발생했습니다.\n\n`));
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