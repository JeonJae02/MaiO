'use client';

import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL, fetchJson } from '../../utils/fetcher';

export default function TestingPage() {
  const [isTraining, setIsTraining] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string>('확인 중...');
  const eventSourceRef = useRef<EventSource | null>(null);

  // 세션 상태 확인
  useEffect(() => {
    checkSessionStatus();
  }, []);

  const checkSessionStatus = async () => {
    try {
      const response = await fetchJson<any>(`${API_BASE_URL}/debug_session`, {
        credentials: 'include'
      });
      
      if (response.client_id && response.has_data_set && response.has_model) {
        setSessionStatus('✅ 세션 상태 정상');
      } else {
        setSessionStatus('❌ 세션 데이터 부족 - 처음부터 다시 시작해주세요');
      }
    } catch (error) {
      setSessionStatus('❌ 세션 확인 실패');
      console.error('세션 확인 오류:', error);
    }
  };

  const handleStartTraining = async () => {
    // 학습 시작 전 세션 재확인
    await checkSessionStatus();
    
    if (sessionStatus.includes('❌')) {
      alert('세션에 문제가 있습니다. 처음부터 다시 시작해주세요.');
      return;
    }

    setIsTraining(true);
    setLogs([]);
    setIsCompleted(false);

    // 직접 fetch를 사용하여 EventSource 대신 스트리밍 처리
    try {
      const response = await fetch(`${API_BASE_URL}/train_data`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data.trim()) {
              if (data.includes('학습이 완료되었습니다') || data.includes('Training completed')) {
                setIsCompleted(true);
                setIsTraining(false);
                setLogs(prev => [...prev, '🎉 학습이 완료되었습니다!']);
                return;
              } else {
                setLogs(prev => [...prev, data]);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('학습 오류:', error);
      setLogs(prev => [...prev, `❌ 학습 중 오류 발생: ${error}`]);
      setIsTraining(false);
    }
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
        
        {/* 세션 상태 표시 */}
        <div className="text-sm p-2 rounded bg-gray-100">
          세션 상태: {sessionStatus}
        </div>
      </div>

      <div className="w-full bg-gray-50 shadow-md border border-gray-200 rounded-2xl p-8 flex flex-col items-center space-y-6">
        <button
          onClick={handleStartTraining}
          disabled={isTraining || isCompleted || sessionStatus.includes('❌')}
          className={`w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-all ${(isTraining || isCompleted || sessionStatus.includes('❌')) ? 'opacity-50 cursor-not-allowed' : ''}`}
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

      {isCompleted && (
        <div className="flex justify-center w-full mt-8">
          <button
            type="button"
            onClick={() => window.location.href = "/testing"}
            className="text-center bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition"
          >
            다음 단계로 넘어가기
          </button>
        </div>
      )}

      <p className="text-gray-500 text-sm text-center">
        학습이 완료되면 테스트 페이지로 이동할 수 있습니다.
      </p>
    </div>
  );
}