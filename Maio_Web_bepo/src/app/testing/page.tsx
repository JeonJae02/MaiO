// page.tsx
'use client';

import { useRef, useState } from 'react';
import Footer from '../../../component/Footer';
import { fetchJson, API_BASE_URL } from '../../utils/fetcher';

// --- 인터페이스 정의 ---
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

// ✅ ProcessingInfo 인터페이스 정의
interface ProcessingInfo {
  segments_created: number;
  save_path: string;
  file_size?: number;
  processing_time?: number;
}

// ✅ API 응답 타입 정의
interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface FileUploadResponse extends ApiResponse {
  file_info?: FileInfo;
}

interface ValidationResponse extends ApiResponse {
  validation_info?: ValidationInfo;
}

interface ProcessingResponse extends ApiResponse {
  processing_info?: ProcessingInfo;
}

export default function TestingPage() {
  const csvInputRef = useRef<HTMLInputElement>(null);

  // --- 상태(State) 변수 선언 ---
  const [csvFileInfo, setCsvFileInfo] = useState<FileInfo | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [trimSeconds, setTrimSeconds] = useState<string>('0');
  const [ySegments, setYSegments] = useState<string>('5');
  const [validationResult, setValidationResult] = useState('');
  const [validationInfo, setValidationInfo] = useState<ValidationInfo | null>(null);
  const [processResult, setProcessResult] = useState('');
  const [saveFilename, setSaveFilename] = useState('processed_data');
  const [testResult, setTestResult] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  
  // 전체 프로세스의 단계를 관리하는 상태
  const [currentStep, setCurrentStep] = useState<'upload' | 'params' | 'validated' | 'processing' | 'ready_to_test' | 'testing' | 'finished'>('upload');

  // --- 핸들러 함수들 ---

  const handleCsvClick = () => {
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
      csvInputRef.current.click();
    }
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadStatus('업로드 중...');
    setCsvFileInfo(null);
    setCurrentStep('upload');
    
    try {
      const data = await fetchJson<FileUploadResponse>(`${API_BASE_URL}/input_csv_data_test`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (data.success && data.file_info) {
        setCsvFileInfo(data.file_info);
        setUploadStatus(`파일 업로드 성공: ${data.file_info.filename}`);
        setCurrentStep('params');
        setTrimSeconds('0');
        setYSegments(Math.min(5, data.file_info.max_possible_segments).toString());
      } else {
        setUploadStatus(`오류: ${data.message || '파일 업로드 실패'}`);
      }
    } catch (err) {
      setUploadStatus('파일 업로드 중 오류가 발생했습니다.');
      console.error(err);
    }
  };

  const handleValidateParams = async () => {
    if (!csvFileInfo) return;
    setValidationResult('검증 중...');
    try {
      const data = await fetchJson<ValidationResponse>(`${API_BASE_URL}/validate_parameters`, {
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
        setValidationResult(`검증 실패: ${data.message || '유효하지 않은 파라미터'}`);
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
    setCurrentStep('processing');
    setProcessResult('NPY 파일 생성 중...');
    try {
      const data = await fetchJson<ProcessingResponse>(`${API_BASE_URL}/process_and_save`, {
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
        setProcessResult(`NPY 파일 생성 완료! 바로 테스트를 시작할 수 있습니다.
- 생성된 세그먼트 수: ${data.processing_info.segments_created}
- 저장 경로: ${data.processing_info.save_path}`);
        setCurrentStep('ready_to_test');
      } else {
        setProcessResult(`처리 실패: ${data.message || 'NPY 파일 생성 실패'}`);
        setCurrentStep('validated');
      }
    } catch (err) {
      setProcessResult('데이터 처리 중 오류가 발생했습니다.');
      setCurrentStep('validated');
      console.error(err);
    }
  };

  const handleStartTesting = () => {
    setIsTesting(true);
    setCurrentStep('testing');
    setTestResult('');
    
    const eventSource = new EventSource(`${API_BASE_URL}/test`, {
      withCredentials: true
    });

    eventSource.onmessage = (event: MessageEvent) => {
      const eventData = event.data as string; // ✅ any 대신 string 타입 명시
      
      // 종료 메시지 확인
      if (eventData.includes('총 결과는 이렇답니다~') || eventData.includes('테스트가 완료되었습니다.')) {
        setTestResult(prev => prev + eventData + '\n');
        eventSource.close();
        setIsTesting(false);
        setCurrentStep('finished');
      } else {
        setTestResult(prev => prev + eventData + '\n');
      }
    };

    eventSource.onerror = (err: Event) => { // ✅ any 대신 Event 타입 명시
      console.error('EventSource failed:', err);
      setTestResult(prev => prev + '\n테스트 중 오류가 발생하여 중단되었습니다.');
      setIsTesting(false);
      setCurrentStep('ready_to_test');
      eventSource.close();
    };
  };

  // --- 리셋 함수 ---
  const resetProcess = () => {
    setCsvFileInfo(null);
    setUploadStatus('');
    setValidationInfo(null);
    setValidationResult('');
    setProcessResult('');
    setTestResult('');
    setCurrentStep('upload');
    setTrimSeconds('0');
    setYSegments('5');
    setSaveFilename('processed_data');
    setIsTesting(false);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  // --- 렌더링 함수 ---
  const isStepDone = (stepName: typeof currentStep) => {
    const stepsOrder = ['upload', 'params', 'validated', 'processing', 'ready_to_test', 'testing', 'finished'];
    return stepsOrder.indexOf(currentStep) > stepsOrder.indexOf(stepName);
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
              학습된 모델의 성능을 테스트 데이터로 확인하는 단계입니다. CSV 파일을 업로드하여 전처리 후 바로 테스트를 진행합니다.
            </p>

            <section className="w-full max-w-4xl mx-auto p-8 rounded-2xl shadow-lg border border-gray-200 bg-gray-50">
              {/* --- 통합된 프로세스 UI --- */}
              <div className="flex justify-end mb-6">
                <button
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition text-sm"
                  onClick={resetProcess}
                >
                  전체 과정 초기화
                </button>
              </div>

              {/* 1단계: 파일 업로드 */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  1단계: CSV 파일 업로드
                  {isStepDone('upload') && <span className="text-green-600 ml-2">✓ 완료</span>}
                </h3>
                <div className="flex gap-4 items-center">
                  <button
                    className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition disabled:opacity-50"
                    onClick={handleCsvClick}
                    disabled={currentStep !== 'upload'}
                  >
                    CSV 파일 선택
                  </button>
                  <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFileChange} />
                </div>
                <div className="mt-3 text-sm text-gray-700 min-h-[24px]">{uploadStatus}</div>
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

              {/* 2단계: 파라미터 설정 및 검증 */}
              {currentStep !== 'upload' && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    2단계: 파라미터 설정 및 검증
                    {isStepDone('validated') && <span className="text-green-600 ml-2">✓ 완료</span>}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">앞에서 자를 시간 (초)</label>
                      <input type="number" value={trimSeconds} onChange={(e) => setTrimSeconds(e.target.value)} min="0" step="0.1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" disabled={currentStep !== 'params'} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">생성할 세그먼트 수</label>
                      <input type="number" value={ySegments} onChange={(e) => setYSegments(e.target.value)} min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" disabled={currentStep !== 'params'} />
                    </div>
                    <div className="flex items-end">
                      <button onClick={handleValidateParams} className="w-full px-4 py-2 rounded-lg transition bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300" disabled={currentStep !== 'params'}>검증하기</button>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-700 min-h-[24px]">{validationResult}</div>
                  {validationInfo && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                      <h4 className="font-semibold text-gray-800 mb-2">검증 결과</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>• 처리 후 사용 가능한 세그먼트: {validationInfo.available_segments}개</p>
                        <p>• 실제 생성될 세그먼트: {validationInfo.final_segments}개</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3단계: NPY 파일 생성 */}
              {currentStep === 'validated' || isStepDone('validated') ? (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    3단계: 테스트용 NPY 파일 생성
                    {isStepDone('ready_to_test') && <span className="text-green-600 ml-2">✓ 완료</span>}
                  </h3>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">저장할 파일명 (확장자 제외)</label>
                      <input type="text" value={saveFilename} onChange={(e) => setSaveFilename(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" disabled={currentStep !== 'validated'} />
                    </div>
                    <button onClick={handleProcessAndSave} className="px-6 py-2 rounded-lg transition bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300" disabled={currentStep !== 'validated'}>생성하기</button>
                  </div>
                  <div className="mt-3 text-sm text-gray-700 min-h-[24px] whitespace-pre-line">{processResult}</div>
                </div>
              ) : null}

              {/* 4단계: 테스트 실행 */}
              {currentStep === 'ready_to_test' || isStepDone('ready_to_test') ? (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    4단계: 테스트 실행
                    {currentStep === 'finished' && <span className="text-green-600 ml-2">✓ 완료</span>}
                  </h3>
                  <button className={`w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed`} onClick={handleStartTesting} disabled={isTesting || currentStep === 'finished'}>
                    {isTesting ? '테스트 진행 중...' : (currentStep === 'finished' ? '테스트 완료' : '테스트 시작하기')}
                  </button>
                  <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">{testResult || '테스트 결과가 여기에 표시됩니다.'}</pre>
                  </div>
                </div>
              ) : null}

            </section>

            {/* 처음으로 돌아가기 버튼 */}
            <div className="flex justify-center mt-8">
              <button
                type="button"
                onClick={() => window.location.href = "/"}
                className="text-center bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition"
              >
                메인 페이지로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}