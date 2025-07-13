import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL } from '../../utils/fetcher';

// 라벨 제출 API
export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { labels } = req.body;

    const response = await fetch(`${API_BASE_URL}/submit-labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ labels }),
    });
    const data = await response.json();
    return res.status(200).json({ success: true, message: data.message });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: '라벨 저장 중 오류가 발생했습니다.' });
  }
}

// 학습 시작 API (Server-Sent Events)
export async function GET(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await fetch(`${API_BASE_URL}/train_data`);
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
    const response = await fetch(`${API_BASE_URL}/initialize`);
    const data = await response.json();
    return res.status(200).json({ client_id: data.client_id });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: '초기화 중 오류가 발생했습니다.' });
  }
}