'use client';

import { useState } from 'react';
import { fetchJson, API_BASE_URL } from '../../utils/fetcher';

export default function FileUpload() {
  const [result, setResult] = useState('');

  const handleFilesUpload = async (files: FileList) => {
    if (!files.length) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    try {
      const data = await fetchJson<{ Y_label?: string[]; message?: string }>(`${API_BASE_URL}/input_raw_data`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      setResult(`데이터 저장 완료! 라벨: ${JSON.stringify(data.Y_label)}`);
    } catch (err: unknown) {
      setResult(err instanceof Error ? err.message : '파일 업로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept=".csv"
        multiple
        onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
        className="hidden"
        id="fileInput"
      />
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => document.getElementById('fileInput')?.click()}
          className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition"
        >
          CSV 파일 업로드
        </button>
        {result && (
          <div className="text-sm text-gray-600 whitespace-pre-line">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}