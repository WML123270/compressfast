"""
对比 isnet fp32 / fp16 / int8 三种模型的分割质量与速度。

用法：
  .venv-onnx/Scripts/python.exe scripts/verify-isnet-quant.py \
      --fp32 test-results/quant/isnet-fp32.onnx \
      --fp16 public/models/isnet-general-use-fp16.onnx \
      --int8 test-results/quant/isnet-int8.onnx \
      --images test-results/quant/portrait.jpg public/demo-photo.jpg
"""
import argparse
import os
import time

import numpy as np
import onnxruntime as ort
from PIL import Image


def preprocess(path: str, size: int = 1024) -> np.ndarray:
    # 与 worker 一致：拉伸到 1024x1024，RGB，(x/255)-0.5，CHW
    im = Image.open(path).convert("RGB").resize((size, size))
    arr = np.asarray(im, dtype=np.float32) / 255.0 - 0.5
    return np.transpose(arr, (2, 0, 1))[None, ...]


def make_session(path: str) -> ort.InferenceSession:
    so = ort.SessionOptions()
    so.intra_op_num_threads = 1  # 对齐浏览器 numThreads=1
    so.inter_op_num_threads = 1
    return ort.InferenceSession(path, so, providers=["CPUExecutionProvider"])


def infer(sess: ort.InferenceSession, x: np.ndarray, runs: int = 3) -> tuple[np.ndarray, float]:
    inp = sess.get_inputs()[0].name
    out = sess.get_outputs()[0].name
    sess.run([out], {inp: x})  # warmup
    t0 = time.perf_counter()
    y = None
    for _ in range(runs):
        y = sess.run([out], {inp: x})[0]
    return y, (time.perf_counter() - t0) / runs


def sigmoid(z: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-z))


def metrics(ref: np.ndarray, test: np.ndarray) -> dict:
    pr, pt = sigmoid(ref), sigmoid(test)
    mae = float(np.abs(pr - pt).mean())
    a = pr > 0.5
    b = pt > 0.5
    union = (a | b).sum()
    iou = float((a & b).sum() / union) if union else 1.0
    changed = float((np.abs(pr - pt) > 0.1).mean())
    return {"mae": mae, "iou": iou, "changed_gt_0.1": changed}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fp32", default="test-results/quant/isnet-fp32.onnx")
    ap.add_argument("--fp16", default="public/models/isnet-general-use-fp16.onnx")
    ap.add_argument("--int8", default="test-results/quant/isnet-int8.onnx")
    ap.add_argument("--images", nargs="+", default=["test-results/quant/portrait.jpg", "public/demo-photo.jpg"])
    args = ap.parse_args()

    out_dir = "test-results/quant/masks"
    os.makedirs(out_dir, exist_ok=True)

    models = {"fp32": args.fp32, "fp16": args.fp16, "int8": args.int8}
    sessions = {}
    print("loading models...")
    for name, path in models.items():
        if not os.path.exists(path):
            print(f"  skip {name}: {path} not found")
            continue
        sessions[name] = make_session(path)
        print(f"  {name}: {path} ({os.path.getsize(path) / 1e6:.1f} MB)")

    for image in args.images:
        print(f"\n=== {image} ===")
        x = preprocess(image)
        outputs = {}
        for name, sess in sessions.items():
            y, dt = infer(sess, x)
            outputs[name] = y
            print(f"  {name}: {dt * 1000:.0f} ms/run")

        if "fp32" in outputs:
            for name in ("fp16", "int8"):
                if name in outputs:
                    m = metrics(outputs["fp32"], outputs[name])
                    print(
                        f"  {name} vs fp32: MAE={m['mae']:.4f} "
                        f"IoU={m['iou']:.4f} changed>0.1={m['changed_gt_0.1'] * 100:.2f}%"
                    )

        stem = os.path.splitext(os.path.basename(image))[0]
        for name, y in outputs.items():
            mask = (np.clip(sigmoid(y).squeeze(), 0, 1) * 255).astype(np.uint8)
            Image.fromarray(mask, mode="L").save(os.path.join(out_dir, f"{stem}-{name}.png"))


if __name__ == "__main__":
    main()
