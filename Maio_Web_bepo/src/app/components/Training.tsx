'use client';

import { useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import LabelInput from '../components/LabelInput';
import { fetchJson, API_BASE_URL } from '../../utils/fetcher';

export default function TrainingPage() {
  useEffect(() => {
    const initialize = async () => {
      try {
        const data = await fetchJson<{ client_id?: string }>(`${API_BASE_URL}/initialize`);
        if (data.client_id) {
          // 클라이언트 ID 처리
          console.log('Client ID:', data.client_id);
        }
      } catch (error) {
        console.error('초기화 오류:', error);
      }
    };

    initialize();
  }, []);

  const handleTrain = async () => {
    try {
      await fetchJson<{ message?: string }>(`${API_BASE_URL}/train_data`, {
        method: 'GET',
        credentials: 'include',
      });
      // 결과 처리
    } catch {
      // 에러 처리
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">모델 학습</h1>
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">라벨 입력</h2>
          <LabelInput />
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">데이터 업로드</h2>
          <FileUpload />
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">학습 시작</h2>
          <button
            id="startTraining"
            className="bg-green-500 text-white px-6 py-3 rounded"
            onClick={handleTrain}
          >
            학습 시작
          </button>
        </section>
      </div>
    </div>
  );
}