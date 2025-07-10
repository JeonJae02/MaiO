export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch('http://127.0.0.1:5000/train_data');
        const reader = response.body?.getReader();

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          controller.enqueue(encoder.encode(`data: ${text}\n\n`));
        }
      } catch (error) {
        console.error('Error:', error);
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