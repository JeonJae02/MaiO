import pandas as pd
import numpy as np

class rawpreprocessing:
    def __init__(self, **kwargs):
        self.data_set_per_label = kwargs.get('data_set_per_label', 10)
        self.time_window=kwargs.get('time_window', 3)
        self.num_data_set=10 #set_dataset에서 초기화됨
        self.count=0 # 몇번째 데이터가 들어왔는지 체크
        self.Y_label= None # 행동에 대한 라벨링 값 저장하는 리스트 
        self.raw_array = []  # 3차원 배열을 만들기 위한 리스트
        self.set_data_set(kwargs.get('labels')) # labels를 kwargs로 전달받아 사용


    def set_data_set(self, labels=None):
        if labels is None:
            print("라벨 정보가 없습니다.")
            self.Y_label = None
            self.num_data_set = 0
            return
 
        num_actions = len(labels)
        print(f"[INFO] 세션에서 받은 라벨 목록: {labels}")
        for i, label in enumerate(labels):
            print(f"{i+1}번째 행동의 라벨: {label}")

        self.Y_label = np.array(labels)
        self.num_data_set = num_actions * self.data_set_per_label
        print(f"총 {self.num_data_set}개의 데이터를 처리합니다.")

    def make_csv_array(self, df):
        """
        CSV 파일을 NumPy 배열로 변환하는 함수.
        """
        try:
            df.rename(columns={
                'Linear Acceleration x (m/s^2)': 'x',
                'Linear Acceleration y (m/s^2)': 'y',
                'Linear Acceleration z (m/s^2)': 'z',
                'Absolute acceleration (m/s^2)': 'a'
            }, inplace=True)
            df.drop(['Time (s)'], axis=1, inplace=True)

            numppy = df.to_numpy()
            #print(f"파일 '{file_name}' 처리 완료!")
            return numppy
        except FileNotFoundError:
            #print(f"파일 '{file_name}'이(가) 존재하지 않습니다.")
            return None
        
    def make_total_array(self):
        """
        raw_array를 3차원 NumPy 배열로 변환하는 함수.
        """
        if self.raw_array:
            total_array = np.stack(self.raw_array, axis=0)
            print("최종 3차원 배열 형태:", total_array.shape)
            return total_array
        else:
            print("읽은 데이터가 없습니다.")