import numpy as np

class slidingwindow:
    def __init__(self, total_array, Y_label, **kwargs): # 행동에 대한 라벨링 값 저장하는 리스트 )
        """
        생성자. total_array를 받아서 초기화.
        """
        self.Y_label= Y_label # 행동에 대한 라벨링 값 저장하는 np Array  
        self.total_array = total_array  # 3차원 배열 (예: [data_set, rows, cols])
        self.low_frq_limit=kwargs.get('low_frq_limit', 10)
    
    def fourier_trans_max_amp(self, data_signal, sampling_rate): 
        """
        FFT를 통해 한 축의 가속도 그래프에서 freq와 amp를 반환하는 함수
        """
        amp = np.fft.fft(data_signal)
        freq = np.fft.fftfreq(len(data_signal), d=1/sampling_rate)
    
        v_freq = (freq >= 0) & (freq <= self.low_frq_limit)
        a_amp = np.abs(amp)

        valid_amp = a_amp[v_freq]
        valid_freq = freq[v_freq]
        
        #print("valid_amp")
        #print(valid_amp)
        
        # 최대값을 가지는 인덱스를 찾아서 반환
        max_index=1
        for i in range (1,len(valid_amp)):
            if(valid_amp[max_index]<valid_amp[i]):
                max_index=i
        max_freq = valid_freq[max_index]  # 해당 인덱스의 valid_freq 값 반환
        return max_freq
    
    def sliding_window(self, T=1, n=0.4, i=0):
        """
        슬라이딩 윈도우 방식으로 데이터를 잘라 반환하는 함수
        T: 한 윈도우의 크기 (초 단위, 1초 = 100개의 열)
        n: 슬라이딩 간격 (초 단위)
        i: self.total_array에서 몇 번째 데이터를 사용할지 지정
        """
        data = self.total_array[i]  # i번째 Raw Data 선택
        #num_columns = data.shape[0]  # 행 개수 가져오기
        #window_size = int(T * 100)  # 한 번에 자를 크기 (정수로 변환)
        #step_size = int(n * 100)  # 슬라이딩 간격 (정수로 변환)
        win_date=[]
        T=int(T*100)
        n=int(n*100)

        for i in range(0, len(data) - T+1, n):
            if len(data[i:i+T]) == T:
                win_date.append(data[i:i+T])
        return win_date
