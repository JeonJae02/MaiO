'use client';

import { useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import LabelInput from '../components/LabelInput';

export default function TrainingPage() {
  useEffect(() => {
    const initialize = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/initialize');
        const data = await response.json();
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
            onClick={() => {
              const eventSource = new EventSource('/api/train');
              eventSource.onmessage = (event) => {
                console.log(event.data);
              };
            }}
          >
            학습 시작
          </button>
        </section>
      </div>
    </div>
  );
}