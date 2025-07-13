'use client';

import { useState, useEffect } from 'react';
import { fetchJson, API_BASE_URL } from '../../utils/fetcher';

export default function LabelInput() {
  const [labels, setLabels] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);

  const initializeClientId = async () => {
    try {
      const data = await fetchJson<{ client_id?: string }>(`${API_BASE_URL}/initialize`, {
        credentials: 'include',
      });
      if (data.client_id) {
        setClientId(data.client_id);
        return true;
      } else {
        console.error('클라이언트 ID 초기화 실패');
        return false;
      }
    } catch (error) {
      console.error('초기화 오류:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!clientId) {
      const isInitialized = await initializeClientId();
      if (!isInitialized) {
        alert('서버 연결에 실패했습니다. 다시 시도해주세요.');
        return;
      }
    }
    try {
      const data = await fetchJson<{ message?: string }>(`${API_BASE_URL}/submit-labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ labels }),
      });
      alert(data.message);
      setLabels([]);
    } catch (error) {
      console.error('오류 발생:', error);
      alert('라벨 저장 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    initializeClientId();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="라벨을 입력하세요 (예: 걷기)"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={() => {
            if (inputValue.trim()) {
              setLabels([...labels, inputValue.trim()]);
              setInputValue('');
            }
          }}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          추가
        </button>
      </div>
      
      {labels.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-3">입력된 라벨:</p>
          <div className="flex flex-wrap gap-2">
            {labels.map((label, index) => (
              <div key={index} className="bg-green-50 px-3 py-1.5 rounded-lg flex items-center">
                <span className="text-green-700">{label}</span>
                <button
                  onClick={() => setLabels(labels.filter((_, i) => i !== index))}
                  className="ml-2 text-green-600 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {labels.length > 0 && (
        <button
          onClick={handleSubmit}
          className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          라벨 저장하기
        </button>
      )}
    </div>
  );
}