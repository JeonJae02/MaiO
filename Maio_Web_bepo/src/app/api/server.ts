import { NextApiRequest, NextApiResponse } from 'next';

// 라벨 제출 API
export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { labels } = req.body;

    const response = await fetch('http://127.0.0.1:5000/submit-labels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ labels }),
    });
    const data = await response.json();
    return res.status(200).json({ success: true, message: data.message });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: '라벨 저장 중 오류가 발생했습니다.' });
  }
}

// // 파일 업로드 API
// export async function uploadHandler(req: NextApiRequest, res: NextApiResponse) {
//   try { 
//     const formData = await req.formData();
//     const file = formData.get('file');

//     if (!file) {
//       return res.status(400).json({ success: false, message: '파일이 없습니다.' });
//     }

//     // Flask 서버로 파일 전송
//     const response = await fetch('http://127.0.0.1:5000/input_npy_data', {
//       method: 'POST',
//       body: formData,
//     });

//     const data = await response.json();
//     return res.status(200).json({
//       success: true,
//       total_count: data.total_count,
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     return res.status(500).json({ success: false, message: '파일 업로드 중 오류가 발생했습니다.' });
//   }
// }

// 학습 시작 API (Server-Sent Events)
export async function GET(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await fetch('http://127.0.0.1:5000/train_data');
    const reader = response.body?.getReader();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const text = new TextDecoder().decode(value);
      res.write(`data: ${text}\n\n`);
    }
  } catch (error) {
    console.error('Error:', error);
    res.write(`data: 학습 중 오류가 발생했습니다.\n\n`);
  } finally {
    res.end();
  }
}

// 초기화 API
export async function initialize(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch('http://127.0.0.1:5000/initialize');
    const data = await response.json();
    return res.status(200).json({ client_id: data.client_id });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: '초기화 중 오류가 발생했습니다.' });
  }
}