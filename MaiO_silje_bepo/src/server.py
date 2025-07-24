from flask import Flask, request, jsonify, session, Response
from flask_session import Session
from flask_cors import CORS
from . import makenumpyfile, train_model, test_model
from .RawPreProcessing import rawpreprocessing
import numpy as np
import pandas as pd
import uuid
from datetime import timedelta
import os
import joblib
from queue import Queue
from threading import Thread
import time
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import redis

load_dotenv()

app = Flask(__name__)

redis_url = os.getenv("SESSION_REDIS_URL")

# 세션 설정
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")  # 세션 암호화를 위한 키
app.config['SESSION_TYPE'] = os.getenv("SESSION_TYPE")    # 세션 데이터를 파일에 저장
app.config['SESSION_COOKIE_SECURE'] = os.getenv("SESSION_COOKIE_SECURE") # HTTPS 환경에서만 쿠키 전송
app.config['SESSION_COOKIE_HTTPONLY'] = os.getenv("SESSION_COOKIE_HTTPONLY") # HTTP 요청에서만 쿠키 접근 가능
app.config['SESSION_COOKIE_SAMESITE'] = os.getenv("SESSION_COOKIE_SAMESITE") # SameSite 속성 설정
app.config['SESSION_REDIS'] = redis.from_url(redis_url)

Session(app)
if os.environ.get('FLASK_ENV') == 'development':
    print("Running in development mode, enabling CORS for localhost.")
    CORS(app, supports_credentials=True, origins=['http://localhost:3000'])
app.permanent_session_lifetime = timedelta(days=1)

PARAM_COUNTS = {
    "GRU": 4,
    "RNN": 4,
    "KNN": 2,
    "SVM": 2
}

@app.route("/api")
def health_check():
    return "OK", 200

@app.route('/api/initialize', methods=['GET'])
def initialize():
    # 세션에 client_id가 없으면 새로 생성
    if 'client_id' not in session:
        session['client_id'] = str(uuid.uuid4())  # 고유한 UUID 생성
    return jsonify({"client_id": session['client_id']})


@app.route('/api/submit-labels', methods=['POST'])
def submit_labels():
    if 'client_id' not in session:
        session['client_id'] = str(uuid.uuid4())  # 고유한 UUID 생성
    client_id = session.get('client_id')

    data = request.get_json()
    labels = data.get('labels', [])

    session['labels'] = labels
    
    print(f"클라이언트 {client_id}의 데이터: {labels}")
    return jsonify({"message": "라벨 저장 완료!"})
    

@app.route("/api/input_raw_data", methods=["POST"])
def make_data_from_csv():
    client_id = session.get('client_id')
    if not client_id:
        return jsonify({"error": "앞부분부터 차근차근 진행해보세요. Session not initialized"}), 401
    
    # tmp/{client_id} 폴더 생성
    client_tmp_dir = os.path.join('tmp', client_id)
    os.makedirs(client_tmp_dir, exist_ok=True)

    # 파일 업로드 처리
    if 'files' not in request.files:
        return jsonify({"error": "파일이 잘 못 되었어요. 다시다시~. No files part"}), 400

    files = request.files.getlist('files')
    
    saved_files = []
    for file in files:
        filename = secure_filename(file.filename)
        save_path = os.path.join(client_tmp_dir, filename)
        file.save(save_path)
        saved_files.append(filename)

    # 디버깅: 세션에서 라벨 확인
    labels = session.get('labels')
    print(f"[DEBUG] 전달할 labels: {labels}")  # 
    print(f"[DEBUG] client_id: {client_id}, session['labels']: {labels}")

    if not labels:
        print("[ERROR] 세션에 라벨이 없습니다!")
        return jsonify({"error": "먼저 라벨을 제출하세요. Labels not found in session."}), 400
    
    # 파일명에서 공통 prefix 추출 (예: RawData)
    if not saved_files:
        return jsonify({"error": "파일이 업로드 되지 않았어요. 파일부터 업로드하고 다시 시도하세요. No files uploaded"}), 400
    base_name = os.path.splitext(saved_files[0])[0]

    labels = session.get('labels')
    num_labels = len(labels)
    files_per_label = 10  # 라벨당 10개로 고정

    if len(saved_files) != num_labels * files_per_label:
        return jsonify({"error": f"파일 개수는 라벨 수({num_labels}) x 10 = {num_labels*10}개여야 합니다."}), 400

    # makenumpyfile.make_data_csv 호출
    try:
        data_set, y_label = makenumpyfile.make_data_csv(
            folder_path=client_tmp_dir,
            file_name=base_name,
            data_set_per_label=files_per_label,
            time_window=3,
            labels=labels
        )
        session["data_set"] = data_set
        session["Y_label"] = y_label
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({
    "message": "데이터가 잘 저장되었어요. Data saved successfully",
    "Y_label": y_label.tolist() if hasattr(y_label, "tolist") else y_label
}
)

@app.route("/api/input_npy_data", methods=["POST"])
def make_data_from_npy():
    client_id = session.get('client_id')
    if not client_id:
        return jsonify({"error": "처음에 건너뛴거 있나요? 처음부터 차근차근하게 해봐요. Session not initialized"}), 401
    
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "파일이 업로드되지 않았습니다."})
    file = request.files['file']

    # 파일 확장자 확인
    if not file.filename.endswith('.npy'):
        return jsonify({"success": False, "message": "NPY 파일만 업로드 가능합니다."})
    
    data = np.load(file)

    # 3차원 배열인지 확인
    if len(data.shape) < 3:
        return jsonify({"success": False, "message": "파일이 3차원 배열이 아닙니다."})

    total_count = data.shape[0]
    session["data_set"]=data

    return jsonify({
        "success": True,
        "message": "데이터가 잘 저장되었어요.",
        "Y_label": session["labels"],  # 현재 세션 데이터 반환
        "total_count": total_count
    })

@app.route("/api/set_train", methods=["POST"])
def set_train():
    client_id = session.get('client_id')
    if not client_id:
        return jsonify({"error": "앞에서부터 차근차근 진행해보세요. Session not initialized"}), 401
    
    data=request.json
    session["stat_var"]=data.get('stat_var')
    session["fft_var"]=data.get('fft_var')

    return jsonify({'message': '학습을 위한 설정이 완료되었어요!'})

@app.route("/api/select_model", methods=["POST"])
def select_model():
    client_id = session.get('client_id')
    if not client_id:
        return jsonify({"error": "앞에서부터 해야죠~. Session not initialized"}), 401
    
    data=request.json
    selected_model = data.get('model')
    if selected_model:
        print(f"선택된 모델: {selected_model}")
        if selected_model not in PARAM_COUNTS:
            return jsonify(ok=False, error="존재하지 않는 모델"), 400
        session["model"] = selected_model
        session.pop("params", None)
        return jsonify({'message': f'{selected_model} 모델이 저장되었습니다!'})
    return jsonify({'message': '모델 선택에 실패했습니다.'}), 400

@app.route("/api/set_params", methods=["POST"])
def set_params():
    client_id = session.get('client_id')
    if not client_id:
        return jsonify({"error": "건너뛰고 그라믄 안돼~. Session not initialized"}), 401
    
    if "model" not in session:
        return jsonify(ok=False, error="모델을 먼저 선택하세요"), 400

    model   = session["model"]
    needed  = PARAM_COUNTS[model]         # 필요한 개수
    params  = request.json.get("params", [])

    if len(params) < needed:
        return jsonify(ok=False,
                       error=f"{needed}개의 값이 필요합니다"), 400

    # 파라미터 타입 변환 (정수/실수로)
    if model in ["GRU", "RNN"]:
        # [test_size, batch_size, learning_rate, num_epochs]
        params = [
            float(params[0]),   # test_size
            int(params[1]),     # batch_size
            float(params[2]),   # learning_rate
            int(params[3])      # num_epochs
        ]
    elif model in ["KNN", "SVM"]:
        # [test_size, n_neighbors]
        params = [
            float(params[0]),   # test_size
            int(params[1])      # n_neighbors
        ]

    session["params"] = params[:needed]
    return jsonify({'message': '매개변수 설정 완료!.'})

    
@app.route("/api/train_data", methods=["GET"])
def train_data():
    print(f"[DEBUG] 세션 상태: {dict(session)}")
    
    client_id = session.get('client_id')
    if not client_id:
        print("[ERROR] client_id가 없습니다.")
        return jsonify({"error": "세션이 만료되었습니다. 처음부터 다시 시작해주세요."}), 401
    
    # 필수 데이터 체크
    required_keys = ["data_set", "labels", "stat_var", "fft_var", "model", "params"]
    missing_keys = [key for key in required_keys if key not in session]
    
    if missing_keys:
        print(f"[ERROR] 누락된 세션 데이터: {missing_keys}")
        return jsonify({"error": f"필요한 데이터가 없습니다: {missing_keys}"}), 401
    
    t_data_set = session["data_set"]
    t_labels= session["labels"]
    stat_var=session["stat_var"]
    fft_var=session["fft_var"]
    selected_model=session["model"]
    params=session["params"]
    
    print(f"[DEBUG] 학습 시작 - 모델: {selected_model}, 데이터셋 크기: {len(t_data_set)}")

    def generate():
        q = Queue()
        # 콜백 함수 정의
        def progress_callback(message):
            q.put(message)

        def run_training():
            try:
                model, label_encoder = train_model.train_NN(
                    selected_model, t_data_set, t_labels,
                    stat_variable=stat_var, fft_variable=fft_var, 
                    _test_size=params[0], _batch_size=params[1], _learning_rate=params[2], _num_epochs=params[3],
                    callback=progress_callback
                )
                # 모델 및 라벨 인코더 저장
                
                os.makedirs('tmp', exist_ok=True)
                client_dir = os.path.join("tmp", client_id)
                os.makedirs(client_dir, exist_ok=True)

                model_path = os.path.join(client_dir, "model.pkl")
                label_path = os.path.join(client_dir, "label_encoder.pkl")
                joblib.dump(model, model_path)
                joblib.dump(label_encoder, label_path)
                
                print(f"[DEBUG] 모델 저장 완료: {model_path}")
                
            except Exception as e:
                print(f"[ERROR] 학습 중 오류: {e}")
                q.put(f"오류 발생: {e}")
            finally:
                q.put(None)  # 완료 신호

        Thread(target=run_training).start()

        # ✅ SVM과 동일한 방식으로 수정
        while True:
            message = q.get()
            if message is None:
                break
            yield f"data: {message}\n\n"

        # ✅ while 루프 밖에서 완료 메시지 전송 (SVM과 동일)
        yield "data: 학습이 완료되었습니다.\n\n"

    def generate_M():
        q = Queue()
        # 콜백 함수 정의
        def progress_callback(message):
            q.put(message)

        def run_training():
            try:
                model, label_encoder = train_model.train_m(
                    selected_model, t_data_set, t_labels, 
                    stat_variable=stat_var, fft_variable=fft_var,
                    _test_size=params[0], _n_neighbors=params[1], 
                    callback=progress_callback
                )
                # 모델 및 라벨 인코더 저장
                
                os.makedirs('tmp', exist_ok=True)
                client_dir = os.path.join("tmp", client_id)
                os.makedirs(client_dir, exist_ok=True)

                model_path = os.path.join(client_dir, "model.pkl")
                label_path = os.path.join(client_dir, "label_encoder.pkl")
                joblib.dump(model, model_path)
                joblib.dump(label_encoder, label_path)
                
                print(f"[DEBUG] 모델 저장 완료: {model_path}")
                
            except Exception as e:
                print(f"[ERROR] 학습 중 오류: {e}")
                q.put(f"오류 발생: {e}")
            finally:
                q.put(None)  # 완료 신호

        Thread(target=run_training).start()

        # ✅ 기존 SVM 방식 그대로 유지
        while True:
            message = q.get()
            if message is None:
                break
            yield f"data: {message}\n\n"

        yield "data: 학습이 완료되었습니다.\n\n"

    if selected_model == 'KNN' or selected_model == 'SVM':
        return Response(generate_M(), content_type="text/event-stream")
    else:
        return Response(generate(), content_type="text/event-stream")

@app.route("/api/input_csv_data_test", methods=["POST"]) #테스트 할 데이터를 csv로 받아줌. 
def input_csv_data_test():
    client_id = session.get('client_id')
    if not client_id:
        return jsonify({"error": "세션이 만료되었습니다. Session not initialized"}), 401
    
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "파일이 업로드되지 않았습니다."})
    file = request.files['file']

    # 파일 확장자 확인
    if not file.filename.endswith('.csv'):
        return jsonify({"success": False, "message": "CSV 파일만 업로드 가능합니다."})
    
    df = pd.read_csv(file)
    processor = rawpreprocessing()
    data = processor.make_csv_array(df)

    try:
        print(f"[DEBUG] 원본 데이터 shape: {data.shape}")

        # 데이터가 4 * N 형태인지 확인
        if data.shape[1] != 4:
            raise ValueError(f"데이터의 첫 번째 차원이 4가 아닙니다: {data.shape[1]}")
        total_length = data.shape[0] / 100
        
        # 세션에 원본 데이터 저장
        session["original_csv_data"] = data
        session["csv_filename"] = file.filename

        print(f"[DEBUG] 총 길이: {total_length}")

        return jsonify({
            "success": True,
            "message": "CSV 파일이 성공적으로 업로드되었습니다.",
            "file_info": {
                "filename": file.filename,
                "data_shape": list(data.shape),
                "total_samples": total_length,
                "duration_seconds": round(total_length, 2),
                "max_possible_segments": total_length // 300  # 3초 단위 최대 세그먼트 수
            }
        })
        
    except Exception as e:
        print(f"[ERROR] CSV 파일 처리 중 오류: {e}")
        return jsonify({"success": False, "message": f"CSV 파일 처리 중 오류가 발생했습니다: {str(e)}"})

@app.route("/api/validate_parameters", methods=["POST"])
def validate_parameters():    
    """x값(trim_seconds)과 y값(segments)의 유효성을 검사하는 함수"""
    client_id = session.get('client_id')
    if not client_id:
        return jsonify({"error": "세션이 만료되었습니다. Session not initialized"}), 401
    
    # 세션에 CSV 데이터가 있는지 확인
    if "original_csv_data" not in session:
        return jsonify({"success": False, "message": "먼저 CSV 파일을 업로드해주세요."})
    
    try:
        trim_seconds = float(request.json.get('trim_seconds', 0))
        y_segments = int(request.json.get('y_segments', 1))
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "trim_seconds와 y_segments는 유효한 숫자여야 합니다."})
    
    # 기본 유효성 검사
    if trim_seconds < 0:
        return jsonify({"success": False, "message": "trim_seconds는 0 이상이어야 합니다. 다시 입력해주세요."})
    
    if y_segments <= 0:
        return jsonify({"success": False, "message": "y_segments는 1 이상이어야 합니다. 다시 입력해주세요."})
    
    # CSV 데이터 정보 가져오기
    data = session["original_csv_data"]
    total_length = data.shape[0]
    
    # 계산
    trim_samples = int(trim_seconds * 100)  # 100Hz
    min_required_samples = y_segments * 300  # 각 세그먼트당 300샘플(3초)
    after_trim_length = total_length - trim_samples
    
    print(f"[DEBUG] 파라미터 검증 - trim_seconds: {trim_seconds}, y_segments: {y_segments}")
    print(f"[DEBUG] total_length: {total_length}, after_trim_length: {after_trim_length}, min_required: {min_required_samples}")
    
    # 유효성 검사
    if trim_samples >= total_length:
        return jsonify({
            "success": False, 
            "message": f"trim_seconds 값이 너무 큽니다. 전체 데이터 길이({total_length/100:.2f}초)보다 작아야 합니다. 다시 입력해주세요."
        })
    
    if after_trim_length < min_required_samples:
        max_possible_segments = after_trim_length // 300
        return jsonify({
            "success": False,
            "message": f"현재 설정으로는 데이터가 부족합니다. trim_seconds={trim_seconds}초 후 최대 {max_possible_segments}개의 세그먼트만 생성 가능합니다. y_segments를 {max_possible_segments} 이하로 설정하거나 trim_seconds를 줄여주세요."
        })
    
    # 유효한 경우 - 세션에 파라미터 저장하지 않음 (아직 확정 안됨)
    available_segments = after_trim_length // 300
    final_segments = min(y_segments, available_segments)
    
    return jsonify({
        "success": True,
        "message": "파라미터가 유효합니다. 업로드를 진행할 수 있습니다.",
        "validation_info": {
            "trim_seconds": trim_seconds,
            "y_segments": y_segments,
            "total_samples": total_length,
            "after_trim_samples": after_trim_length,
            "available_segments": available_segments,
            "final_segments": final_segments,
            "will_use_all_segments": final_segments == y_segments
        }
    })

# 3. 최종 처리 및 npy 파일 저장 함수
@app.route("/api/process_and_save", methods=["POST"])
def process_and_save():
    """유효한 파라미터로 3차원 npy 파일을 생성하고 저장하는 함수"""
    client_id = session.get('client_id')
    if not client_id:
        return jsonify({"error": "세션이 만료되었습니다. Session not initialized"}), 401
    
    # 세션에 CSV 데이터가 있는지 확인
    if "original_csv_data" not in session:
        return jsonify({"success": False, "message": "먼저 CSV 파일을 업로드해주세요."})
    
    try:
        trim_seconds = float(request.json.get('trim_seconds', 0))
        y_segments = int(request.json.get('y_segments', 1))
        save_filename = request.json.get('save_filename', 'processed_data')  # 저장할 파일명
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "파라미터가 올바르지 않습니다."})
    
    # 파라미터 재검증 (안전성을 위해)
    data = session["original_csv_data"]
    total_length = data.shape[0]
    trim_samples = int(trim_seconds * 100)
    min_required_samples = y_segments * 300
    after_trim_length = total_length - trim_samples
    
    if after_trim_length < min_required_samples:
        return jsonify({"success": False, "message": "파라미터가 유효하지 않습니다. 다시 검증해주세요."})
    
    try:
        print(f"[DEBUG] 최종 처리 시작 - trim_seconds: {trim_seconds}, y_segments: {y_segments}")
        
        # 1. 앞에서 자르기
        if trim_samples > 0:
            start_idx = trim_samples
            end_idx = total_length
            trimmed_data = data[start_idx:end_idx, :]
            print(f"[DEBUG] 앞에서 {trim_seconds}초({trim_samples}샘플) 제거")
        else:
            trimmed_data = data
            print(f"[DEBUG] 자르기 없음")
        
        print(f"[DEBUG] 처리된 데이터 shape: {trimmed_data.shape}")
        
        # 2. 세그먼트 나누기
        segments = []
        available_segments = trimmed_data.shape[0] // 300
        segments_to_use = min(y_segments, available_segments)
        
        for i in range(segments_to_use):
            start_sample = i * 300
            end_sample = start_sample + 300
            segment = trimmed_data[start_sample:end_sample, :]
            segments.append(segment)
            print(f"[DEBUG] 세그먼트 {i+1}: shape {segment.shape}")
        
        # 3. 3차원 배열로 변환
        result_array = np.array(segments)  # shape: (segments_to_use, 4, 300)
        print(f"[DEBUG] 최종 3차원 배열 shape: {result_array.shape}")
        
        # 세션에 처리된 데이터 저장 (필요시 사용)
        session["test_set"] = result_array
        
        return jsonify({
            "success": True,
            "message": "데이터 처리 및 저장이 완료되었습니다.",
            "processing_info": {
                "original_shape": list(data.shape),
                "final_shape": list(result_array.shape),
                "trim_seconds": trim_seconds,
                "segments_created": segments_to_use
            }
        })
        
    except Exception as e:
        print(f"[ERROR] 데이터 처리 및 저장 중 오류: {e}")
        return jsonify({"success": False, "message": f"처리 중 오류가 발생했습니다: {str(e)}"})
    
@app.route("/api/input_npy_data_test", methods=["POST"]) #테스트 할 데이터를 넘파이로 받아줌. input _ csv requst 만들어야됨. 
def make_data_from_npy_test():
    client_id = session.get('client_id')
    if not client_id:
        return jsonify({"error": "세션이 만료되었습니다. Session not initialized"}), 401
    
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "파일이 업로드되지 않았습니다."})
    file = request.files['file']

    # 파일 확장자 확인
    if not file.filename.endswith('.npy'):
        return jsonify({"success": False, "message": "NPY 파일만 업로드 가능합니다."})
    
    data = np.load(file)

    # 3차원 배열인지 확인
    if len(data.shape) < 3:
        return jsonify({"success": False, "message": "파일이 3차원 배열이 아닙니다."})

    total_count = data.shape[0]
    session["test_set"]=data

    return jsonify({
        "success": True,
        "message": "데이터가 성공적으로 전송되었습니다.",
        "Y_label": session["labels"],  # 현재 세션 데이터 반환
        "total_count": total_count
    })


@app.route("/api/test", methods=["GET"])
def test():
    client_id = session.get('client_id')
    if not client_id:
        return jsonify({"error": "세션이 만료되었습니다. Session not initialized"}), 401
    
       
    datatest_list=session["test_set"]
    y_label=session["labels"]
    stat_var=session["stat_var"]
    fft_var=session["fft_var"]
    selected_model=session["model"]

    client_dir = os.path.join("tmp", client_id)
    model_path = os.path.join(client_dir, "model.pkl")
    label_path = os.path.join(client_dir, "label_encoder.pkl")
    
    if os.path.exists(model_path) and os.path.exists(label_path):
        model = joblib.load(model_path)
        label_encoder = joblib.load(label_path)
        if selected_model == 'SVM' or selected_model == 'KNN':
            predicted_class=test_model.test_m(datatest_list, model, label_encoder, y_label, stat_variable=stat_var, fft_variable=fft_var)
        else:
            predicted_class=test_model.test_NN(datatest_list, model, label_encoder, y_label, stat_variable=stat_var, fft_variable=fft_var)

        def generate():
            for i, pred in enumerate(predicted_class):
                yield f"data: {i+1} 번째 데이터 : 예측 행동 = {label_encoder.inverse_transform([pred.item()])}\n\n"
                time.sleep(1)  # 1초 대기 (연속적인 메시지 전송 시뮬레이션)
            yield "data: 총 결과는 이렇답니다~\n\n"  # 마지막 메시지

        return Response(generate(), content_type="text/event-stream")
        
    else:
        raise FileNotFoundError("Model or Label Encoder not found!")


@app.route('/api/clear', methods=['POST'])
def clear_session():
    # 현재 클라이언트의 세션 초기화
    session.clear()
    return jsonify({"message": "Session cleared!"})

@app.route("/api/debug_session", methods=["GET"])
def debug_session():
    return jsonify({
        "client_id": session.get('client_id'),
        "has_data_set": 'data_set' in session,
        "has_labels": 'labels' in session,
        "has_model": 'model' in session,
        "has_params": 'params' in session,
        "session_keys": list(session.keys())
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
# 사용자 별로 쌓인 세션을 관리하기 위해 Flask-Session 

@app.route('/api/login', methods=['POST'])
def login():
    # 클라이언트가 로그인하면 세션 ID 생성
    client_id = request.json.get('client_id')
    if not client_id:
        return jsonify({"error": "client_id is required"}), 400

    session['client_id'] = client_id
    return jsonify({"message": "Session initialized", "client_id": client_id}), 200



if __name__ == '__main__':
    # SSL 인증서와 키 파일 경로 설정
    app.run(ssl_context=('/Users/songjunha/certificate.crt',
                         '/Users/songjunha/private.key'),
            host='0.0.0.0', port=443)