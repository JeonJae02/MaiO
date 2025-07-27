import torch

print("[Config] 장치 확인을 시작합니다...")

# 1. NVIDIA CUDA 환경 확인
if torch.cuda.is_available():
    device_type = "cuda"
    device_name = torch.cuda.get_device_name(0)
    print(f"[Config] NVIDIA CUDA 장치를 감지했습니다: {device_name}")
else:
    # GPU가 없을 경우 CPU로 폴백
    device_type = "cpu"
    print("[Config] 사용 가능한 GPU가 없습니다. CPU를 사용합니다.")

# 최종적으로 device 객체를 생성하여 내보내기
device = torch.device(device_type)
print(f"[Config] 최종 선택된 장치: {device}")
