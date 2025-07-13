'use client';

import { useState, useRef } from 'react';
import { API_BASE_URL } from '../../utils/fetcher';

export default function TestingPage() {
  const [isTraining, setIsTraining] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleStartTraining = () => {
    setIsTraining(true);
    setLogs([]);
    setIsCompleted(false);

    const eventSource = new EventSource(`${API_BASE_URL}/train_data`, { withCredentials: true } as unknown as EventSourceInit);

    eventSource.onmessage = (event: MessageEvent) => {
      if (event.data === 'Training completed.') {
        setIsCompleted(true);
        setIsTraining(false);
        eventSource.close();
      } else {
        setLogs((prev) => [...prev, event.data]);
      }
    };

    eventSource.onerror = () => {
      setLogs((prev) => [...prev, '❌ 서버와의 연결에 문제가 발생했습니다.']);
      setIsTraining(false);
      eventSource.close();
    };

    eventSourceRef.current = eventSource;
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-6 sm:px-4 pt-32 pb-20 flex flex-col items-center space-y-12">
      <div className="flex flex-col items-center text-center space-y-4">
        <span className="px-6 py-2 bg-green-100 text-green-600 rounded-full text-sm font-medium">
          Maio ML
        </span>
        <h1 className="text-3xl font-bold">
          <span className="text-green-500">STEP 5</span> 인공지능 학습 시작
        </h1>
        <p className="text-gray-500 text-sm">
          모든 설정이 끝났다면, 아래 버튼을 눌러 인공지능 학습을 시작하세요.<br />
          학습 진행 상황과 결과가 실시간으로 표시됩니다.
        </p>
      </div>

      <div className="w-full bg-gray-50 shadow-md border border-gray-200 rounded-2xl p-8 flex flex-col items-center space-y-6">
        <button
          onClick={handleStartTraining}
          disabled={isTraining || isCompleted}
          className={`w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-all ${isTraining || isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isCompleted ? '학습 완료' : isTraining ? '학습 중...' : '학습 시작하기'}
        </button>

        <div className="w-full h-64 bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto mt-2">
          <h2 className="text-lg font-bold mb-2 text-green-600">학습 로그</h2>
          {logs.length === 0 && (
            <div className="text-gray-400 text-sm">아직 학습 로그가 없습니다.</div>
          )}
          <ul className="space-y-1 text-sm text-gray-800">
            {logs.map((log, idx) => (
              <li key={idx} className="whitespace-pre-line">{log}</li>
            ))}
          </ul>
          {isCompleted && (
            <div className="mt-4 text-green-600 font-bold text-center">
              🎉 학습이 성공적으로 완료되었습니다!
            </div>
          )}
        </div>
      </div>
     
    </div>
  );
}