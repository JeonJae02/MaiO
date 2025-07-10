'use client';

import { useState } from 'react';

export default function FileUpload() {
  const [result, setResult] = useState('');

  const handleFilesUpload = async (files: FileList) => {
    if (!files.length) return;

    const formData = new FormData();
    // 여러 파일을 'files' 필드로 추가
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/input_raw_data', {
        method: 'POST',
        credentials: 'include', // 세션 유지
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setResult(`데이터 저장 완료! 라벨: ${JSON.stringify(data.Y_label)}`);
      } else {
        setResult(`오류: ${data.error || data.message}`);
      }
    } catch (err) {
      setResult('파일 업로드 중 오류가 발생했습니다.');
      console.error(err);
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