'use client';

import { useState } from 'react';
import Footer from '../../../component/Footer';
import Image from 'next/image';
import { fetchJson, API_BASE_URL } from '../../utils/fetcher';

export default function MyModelAndStudyConfig() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [epoch, setEpoch] = useState('');
  const [batchSize, setBatchSize] = useState('');
  const [learningRate, setLearningRate] = useState('');
  const [testSplit, setTestSplit] = useState('');
  const [nNeighbor, setNNeighbor] = useState('');
  const [serverMessage, setServerMessage] = useState<string>('');

  const modelList = [
    { id: 'svm', label: 'SVM', description: '분류하는 것에 매우 탁월한 성능을 갖고 있어요' },
    { id: 'gru', label: 'GRU', description: '시간에 따라 변하는 데이터 예측에 매우 탁월한 성능을 갖고 있어요' },
    { id: 'rnn', label: 'RNN', description: '데이터를 암기를 잘해요! 긴~ 데이터를 사용할 때 유용해요.' },
    { id: 'knn', label: 'KNN', description: '흩어져 있는 여러 데이터를 모아주는데 매우 탁월한 성능을 갖고 있어요.' }
  ];

  const handleModelSelect = (id: string) => {
    setSelectedModel(id);
    setEpoch('');
    setBatchSize('');
    setLearningRate('');
    setTestSplit('');
    setNNeighbor('');
  };

  // 모델 선택 API 호출 함수
  const selectModel = async (modelLabel: string): Promise<{ message?: string; error?: string }> => {
    return fetchJson<{ message?: string; error?: string }>(`${API_BASE_URL}/select_model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ model: modelLabel }),
    });
  };

  // 모델 파라미터 적용 API 호출 함수
  const submitParams = async (params: (number | string)[]): Promise<{ message?: string; error?: string }> => {
    return fetchJson<{ message?: string; error?: string }>(`${API_BASE_URL}/set_params`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ params }),
    });
  };

  const handleModelSubmit = async () => {
    if (!selectedModel) {
      alert('모델을 선택해주세요!');
      return;
    }
    const selectedModelObj = modelList.find(m => m.id === selectedModel);
    const modelLabel = selectedModelObj ? selectedModelObj.label : selectedModel.toUpperCase();

    try {
      const data = await selectModel(modelLabel);
      setServerMessage(data.message || data.error || '서버 오류');
    } catch (err: unknown) {
      if (err instanceof Error) setServerMessage(err.message || '서버 통신 오류');
      else setServerMessage('서버 통신 오류');
    }
  };

  const renderStudyConfig = () => {
    if (selectedModel === 'knn' || selectedModel === 'svm') 
      {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {selectedModel === 'knn' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">N-neighbor</label>
              <input
                type="number"
                value={nNeighbor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNNeighbor(e.target.value);
                  // 입력값 변경 시 실시간 디버그
                  console.log('[KNN 입력] nNeighbor:', e.target.value);
                }}
                placeholder="예: 5"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">시험 데이터 비율 (%)</label>
            <input
              type="number"
              value={testSplit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setTestSplit(e.target.value);
                // 입력값 변경 시 실시간 디버그
                console.log('[KNN 입력] testSplit:', e.target.value);
              }}
              placeholder="예: 20"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      );
    } else if (selectedModel) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">반복 학습 횟수 (Epoch)</label>
            <input
              type="number"
              value={epoch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEpoch(e.target.value)}
              placeholder="예: 50"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">문제 단위 (Batch Size)</label>
            <input
              type="number"
              value={batchSize}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBatchSize(e.target.value)}
              placeholder="예: 32"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">학습 속도 (Learning Rate)</label>
            <input
              type="number"
              step="0.0001"
              value={learningRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLearningRate(e.target.value)}
              placeholder="예: 0.01"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">시험 데이터 비율 (%)</label>
            <input
              type="number"
              value={testSplit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestSplit(e.target.value)}
              placeholder="예: 20"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      );
    }
    return null;
  };

  const getParamsArray = () => {
    const testSize = testSplit ? parseFloat(testSplit) / 100 : '';
    const batch = batchSize ? parseInt(batchSize, 10) : '';
    const lr = learningRate ? parseFloat(learningRate) : '';
    const ep = epoch ? parseInt(epoch, 10) : '';
    const nNeigh = nNeighbor ? parseInt(nNeighbor, 10) : '';

    if (selectedModel === 'knn') {
      // 디버그 로그 추가
      console.log('[KNN 디버그] testSize:', testSize, 'nNeigh:', nNeigh);
      return [testSize, nNeigh];
    } else if (selectedModel === 'svm') {
      return [testSize, 0];
    } else if (selectedModel === 'gru' || selectedModel === 'rnn') {
      return [testSize, batch, lr, ep];
    }
    return [];
  };

  const handleParamsSubmit = async () => {
    const params = getParamsArray();

    // 값이 비어있거나, batchSize가 1 미만이거나 정수가 아니면 경고
    if (
      params.some(v => v === '' || v === undefined) ||
      (
        (selectedModel === 'gru' || selectedModel === 'rnn') &&
        (Number(params[1]) < 1 || !Number.isInteger(Number(params[1])))
      )
    ) {
      alert('모든 값을 올바르게 입력해주세요! (Batch Size는 1 이상의 정수여야 합니다)');
      return;
    }

    try {
      const data = await submitParams(params);
      setServerMessage(data.message || data.error || '서버 오류');
    } catch (err: unknown) {
      if (err instanceof Error) setServerMessage(err.message || '서버 통신 오류');
      else setServerMessage('서버 통신 오류');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-4 pt-32 pb-12">
      {/* STEP 3 - 모델 선택 */}
      <div className="flex flex-col items-center">
        <div className="mb-6">
          <span className="inline-block px-8 py-2 rounded-full bg-green-50 text-green-500 text-sm font-medium">
            Maio ML
          </span>
        </div>

        <div className="w-full max-w-3xl">
          <h1 className="text-3xl font-bold flex items-center mb-4">
            <span className="text-2xl bg-green-50 text-green-500 px-3 py-1 rounded-full mr-2 mt-3 mb-3">STEP 3</span>
            마이오 머신러닝 모델 선정하기
          </h1>
          <p className="text-gray-700 mt-3 mb-2">학습할 인공지능 모델을 정하는 과정이에요.</p>
          <p className="text-gray-700 mb-6">
            학습하고자 하는 모델별로 장점과 단점이 있으니, 학습 시키고 싶은 데이터에 알맞게 사용하길 추천해요.
          </p>

          <section className="w-full max-w-4xl mx-auto px-4 py-16">
            <div className="bg-gray-50 p-8 rounded-2xl shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-6">
                <span className="text-white bg-black rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">1</span>
                원하는 인공지능 모델을 선택하세요!
              </h2>

              <p className="text-gray-700 mb-2">⚠️ 딱 하나만 선택할 수 있어요!</p>
              <p className="text-sm text-gray-500 mb-6">모델을 선택하면, 이 모델을 기준으로 AI가 동작할 거예요.</p>

              <div className="space-y-4">
                {modelList.map((model) => (
                  <label
                    key={model.id}
                    htmlFor={model.id}
                    className="flex items-center p-4 border border-gray-300 rounded-xl hover:border-black transition-all cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id={model.id}
                      checked={selectedModel === model.id}
                      onChange={() => handleModelSelect(model.id)}
                      className="w-5 h-5 text-black mr-4"
                    />
                    <div>
                      <p className="text-gray-800 font-semibold">{model.label}</p>
                      <p className="text-sm text-gray-500">{model.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <button
                type="button"
                id="submit-button"
                className="mt-8 w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-all"
                onClick={handleModelSubmit}
              >
                모델 선정 완료
              </button>
              {/* 서버 응답 메시지 표시 */}
              {serverMessage && (
                <div id="response-message" className="mt-4 text-center text-green-600 font-semibold">
                  {serverMessage}
                </div>
              )}
            </div>
          </section>
        </div>
        <div className="mt-10">
          <Image
            src="/3D_2nd.jpeg"
            alt="플로깅 이미지"
            width={800}
            height={400}
            className="rounded-xl shadow-md"
          />
        </div>
      </div>


      {/* STEP 4 - 모델 학습 설정 */}
      <section className="w-full max-w-4xl mx-auto px-4 py-16">
        <div className="bg-gray-50 p-8 rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-6">
            <span className="text-white bg-black rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">4</span>
            마이오 머신러닝 모델 공부법 알려주기
          </h2>

          <p className="text-gray-700 mb-2">
            인공지능이 얼마나, 어떻게 공부할지 알려주는 중요한 설정이에요!
          </p>
          <p className="text-sm text-gray-500 mb-6">
            예: Epoch는 반복 학습 횟수, Batch Size는 나눠서 공부할 단위, Learning Rate는 공부 속도, Test Split은 시험 문제 비율이에요.
          </p>

          {renderStudyConfig()}

          <button
            onClick={handleParamsSubmit}
            className="mt-8 w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-all"
          >
            공부법 적용하기
          </button>
          {/* 서버 응답 메시지 표시 */}
          {serverMessage && (
            <div id="response-message" className="mt-4 text-center text-green-600 font-semibold">
              {serverMessage}
            </div>
          )}
        </div>
      </section>

       {/* Next Step Button */}
      <div className="flex justify-center mt-2 mb-8">
        <button
          type="button"
          className="text-center bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition"
          // onClick={() => {
          //   const params = getParamsArray();
          //   if (selectedModel === 'knn') {
          //     const [testSize, nNeigh] = params;
          //     alert(`[KNN 디버그]\ntestSize: ${testSize}\nnNeigh: ${nNeigh}`);
          //   } else {
          //     alert(`[디버그]\nparams: ${JSON.stringify(params)}`);
          //   }
          //   
          // }}
        onClick={() =>{
                window.location.href = "/train";
            }}
        >
          다음 단계로 넘어가기
        </button>
      </div>
      {/* Footer의 너비를 메인 div와 동일하게 맞춤 */}
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-4">
        <Footer />
      </div>
    </div>
    
  );
}