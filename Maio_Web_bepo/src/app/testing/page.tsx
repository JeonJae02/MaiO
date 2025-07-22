// page.tsx
'use client';

import { useRef, useState } from 'react';
import Footer from '../../../component/Footer';
import { fetchJson, API_BASE_URL } from '../../utils/fetcher';

interface FileInfo {
  filename: string;
  data_shape: number[];
  total_samples: number;
  duration_seconds: number;
  max_possible_segments: number;
}

interface ValidationInfo {
  trim_seconds: number;
  y_segments: number;
  total_samples: number;
  after_trim_samples: number;
  available_segments: number;
  final_segments: number;
  will_use_all_segments: boolean;
}

export default function TestingPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  // 기존 NPY 관련 state
  const [result, setResult] = useState('');
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 새로운 CSV 관련 state
  const [csvFileInfo, setCsvFileInfo] = useState<FileInfo | null>(null);
  const [csvUploadStatus, setCsvUploadStatus] = useState('');
  const [trimSeconds, setTrimSeconds] = useState<string>('0');
  const [ySegments, setYSegments] = useState<string>('5');
  const [validationResult, setValidationResult] = useState('');
  const [validationInfo, setValidationInfo] = useState<ValidationInfo | null>(null);
  const [processResult, setProcessResult] = useState('');
  const [saveFilename, setSaveFilename] = useState('processed_data');
  const [currentStep, setCurrentStep] = useState<'upload' | 'params' | 'validated' | 'saved'>('upload');

  // 기존 NPY 관련 함수들
  const handleNpyClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.accept = '.npy';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setResult('업로드 중...');
    try {
      const data = await fetchJson<{ success: boolean; total_count?: number; message?: string }>(`${API_BASE_URL}/input_npy_data_test`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      setResult(data.success ? `총 데이터 개수: ${data.total_count}` : `오류: ${data.message}`);
    } catch (err) {
      setResult('파일 업로드 중 오류가 발생했습니다.');
      console.error(err);
    }
  };

  // 새로운 CSV 관련 함수들
  const handleCsvClick = () => {
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
      csvInputRef.current.accept = '.csv';
      csvInputRef.current.click();
    }
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setCsvUploadStatus('업로드 중...');
    setCsvFileInfo(null);
    setCurrentStep('upload');
    
    try {
      const data = await fetchJson<{ 
        success: boolean; 
        file_info?: FileInfo; 
        message?: string 
      }>(`${API_BASE_URL}/test_csv/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (data.success && data.file_info) {
        setCsvFileInfo(data.file_info);
        setCsvUploadStatus(`파일 업로드 성공: ${data.file_info.filename}`);
        setCurrentStep('params');
        // 기본값 설정
        setTrimSeconds('0');
        setYSegments(Math.min(5, data.file_info.max_possible_segments).toString());
      } else {
        setCsvUploadStatus(`오류: ${data.message}`);
      }
    } catch (err) {
      setCsvUploadStatus('파일 업로드 중 오류가 발생했습니다.');
      console.error(err);
    }
  };

  const handleValidateParams = async () => {
    if (!csvFileInfo) return;

    setValidationResult('검증 중...');
    
    try {
      const data = await fetchJson<{ 
        success: boolean; 
        validation_info?: ValidationInfo; 
        message?: string 
      }>(`${API_BASE_URL}/test_csv/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trim_seconds: parseFloat(trimSeconds),
          y_segments: parseInt(ySegments)
        }),
        credentials: 'include',
      });
      
      if (data.success && data.validation_info) {
        setValidationInfo(data.validation_info);
        setValidationResult('파라미터가 유효합니다! 처리를 진행할 수 있습니다.');
        setCurrentStep('validated');
      } else {
        setValidationResult(`검증 실패: ${data.message}`);
        setValidationInfo(null);
        setCurrentStep('params');
      }
    } catch (err) {
      setValidationResult('파라미터 검증 중 오류가 발생했습니다.');
      console.error(err);
    }
  };

  const handleProcessAndSave = async () => {
    if (!validationInfo) return;

    setProcessResult('처리 중...');
    
    try {
      const data = await fetchJson<{ 
        success: boolean; 
        processing_info?: any; 
        message?: string 
      }>(`${API_BASE_URL}/test_csv/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trim_seconds: parseFloat(trimSeconds),
          y_segments: parseInt(ySegments),
          save_filename: saveFilename
        }),
        credentials: 'include',
      });
      
      if (data.success && data.processing_info) {
        setProcessResult(`처리 완료! 파일이 저장되었습니다.
생성된 세그먼트 수: ${data.processing_info.segments_created}
파일 크기: ${data.processing_info.file_size_mb}MB
저장 경로: ${data.processing_info.save_path}`);
        setCurrentStep('saved');
      } else {
        setProcessResult(`처리 실패: ${data.message}`);
      }
    } catch (err) {
      setProcessResult('데이터 처리 중 오류가 발생했습니다.');
      console.error(err);
    }
  };

  const handleStartTesting = () => {
    setIsLoading(true);
    setTestResult('');
    
    const eventSource = new EventSource(`${API_BASE_URL}/test`, {
      withCredentials: true
    } as EventSourceInit);

    eventSource.onmessage = (event) => {
      if (event.data === '총 결과는 이렇답니다~') {
        setTestResult(prev => prev + event.data + '\n');
        eventSource.close();
        setIsLoading(false);
      } else {
        setTestResult(prev => prev + event.data + '\n');
      }
    };

    eventSource.onerror = () => {
      setIsLoading(false);
      eventSource.close();
    };
  };

  const resetCsvProcess = () => {
    setCsvFileInfo(null);
    setCsvUploadStatus('');
    setValidationInfo(null);
    setValidationResult('');
    setProcessResult('');
    setCurrentStep('upload');
    setTrimSeconds('0');
    setYSegments('5');
    setSaveFilename('processed_data');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow w-full max-w-7xl mx-auto px-6 sm:px-4 pt-32 pb-12">
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <span className="inline-block px-8 py-2 rounded-full bg-green-50 text-green-500 text-sm font-medium">
              Maio ML
            </span>
          </div>

          <div className="w-full max-w-3xl">
            <h1 className="text-3xl font-bold flex items-center mb-4">
              <span className="text-2xl bg-green-50 text-green-500 px-3 py-1 rounded-full mr-2">STEP 6</span>
              테스트 데이터로 성능 확인하기
            </h1>
            <p className="text-gray-700 mt-3 mb-6">
              학습된 모델의 성능을 테스트 데이터로 확인하는 단계입니다.
            </p>

            <section className="w-full max-w-4xl mx-auto px-4 py-16">
              {/* CSV 파일 처리 섹션 */}
              <div className="bg-blue-50 p-8 rounded-2xl shadow-lg border border-blue-200 mb-8">
                <h2 className="text-2xl font-bold text-blue-800 mb-6">CSV 파일에서 NPY 생성하기</h2>
                
                {/* 1단계: 파일 업로드 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    1단계: CSV 파일 업로드
                    {currentStep !== 'upload' && <span className="text-green-600 ml-2">✓</span>}
                  </h3>
                  <div className="flex gap-4 items-center">
                    <button
                      className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition"
                      onClick={handleCsvClick}
                    >
                      CSV 파일 선택
                    </button>
                    <button
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition text-sm"
                      onClick={resetCsvProcess}
                    >
                      초기화
                    </button>
                    <input
                      ref={csvInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleCsvFileChange}
                    />
                  </div>
                  <div className="mt-3 text-sm text-gray-700 min-h-[24px]">{csvUploadStatus}</div>
                  
                  {csvFileInfo && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-gray-800 mb-2">파일 정보</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>• 총 샘플 수: {csvFileInfo.total_samples.toLocaleString()}</p>
                        <p>• 지속 시간: {csvFileInfo.duration_seconds}초</p>
                        <p>• 최대 생성 가능 세그먼트: {csvFileInfo.max_possible_segments}개</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2단계: 파라미터 입력 */}
                {currentStep !== 'upload' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      2단계: 파라미터 설정
                      {currentStep === 'validated' || currentStep === 'saved' ? <span className="text-green-600 ml-2">✓</span> : ''}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          앞에서 자를 시간 (초)
                        </label>
                        <input
                          type="number"
                          value={trimSeconds}
                          onChange={(e) => setTrimSeconds(e.target.value)}
                          min="0"
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          disabled={currentStep === 'saved'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          생성할 세그먼트 수
                        </label>
                        <input
                          type="number"
                          value={ySegments}
                          onChange={(e) => setYSegments(e.target.value)}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          disabled={currentStep === 'saved'}
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleValidateParams}
                          className={`w-full px-4 py-2 rounded-lg transition ${
                            currentStep === 'params' 
                              ? 'bg-blue-500 text-white hover:bg-blue-600' 
                              : 'bg-gray-300 text-gray-600'
                          }`}
                          disabled={currentStep !== 'params'}
                        >
                          검증하기
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700 min-h-[24px]">{validationResult}</div>
                    
                    {validationInfo && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                        <h4 className="font-semibold text-gray-800 mb-2">검증 결과</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>• 처리 후 사용 가능한 세그먼트: {validationInfo.available_segments}개</p>
                          <p>• 실제 생성될 세그먼트: {validationInfo.final_segments}개</p>
                          <p>• 모든 요청 세그먼트 생성 가능: {validationInfo.will_use_all_segments ? '예' : '아니오'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3단계: 최종 처리 */}
                {currentStep === 'validated' || currentStep === 'saved' ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      3단계: 최종 처리 및 저장
                      {currentStep === 'saved' && <span className="text-green-600 ml-2">✓</span>}
                    </h3>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          저장할 파일명
                        </label>
                        <input
                          type="text"
                          value={saveFilename}
                          onChange={(e) => setSaveFilename(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                          disabled={currentStep === 'saved'}
                        />
                      </div>
                      <button
                        onClick={handleProcessAndSave}
                        className={`px-6 py-2 rounded-lg transition ${
                          currentStep === 'validated' 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'bg-gray-300 text-gray-600'
                        }`}
                        disabled={currentStep !== 'validated'}
                      >
                        처리 및 저장
                      </button>
                    </div>
                    <div className="mt-3 text-sm text-gray-700 min-h-[24px] whitespace-pre-line">{processResult}</div>
                  </div>
                ) : null}
              </div>

              {/* 기존 NPY 업로드 및 테스트 섹션 */}
              <div className="bg-gray-50 p-8 rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">기존 NPY 파일로 테스트하기</h2>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">테스트 파일 업로드</h3>
                    <div className="flex gap-4">
                      <button
                        className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition"
                        onClick={handleNpyClick}
                      >
                        NPY 파일 업로드
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                    <div className="mt-4 text-sm text-gray-700 min-h-[24px]">{result}</div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">테스트 실행</h3>
                    <button
                      className={`w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={handleStartTesting}
                      disabled={isLoading}
                    >
                      {isLoading ? '테스트 진행 중...' : '테스트 시작하기'}
                    </button>
                    <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800">{testResult || '테스트 결과가 여기에 표시됩니다.'}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 처음으로 돌아가기 버튼 */}
            <div className="flex justify-center mt-8">
              <button
                type="button"
                onClick={() => window.location.href = "/"}
                className="text-center bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition"
              >
                처음부터 다시 시작하기
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
