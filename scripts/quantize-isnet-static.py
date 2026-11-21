"""
isnet fp32 -> int8 静态量化（QDQ/QOperator，需要校准集）。

动态量化（ConvInteger）实测慢 16 倍，不能用；CNN 的 int8 应该走 QLinearConv。

用法：
  .venv-onnx/Scripts/python.exe scripts/quantize-isnet-static.py \
      --fp32 test-results/quant/isnet-fp32.onnx \
      --out test-results/quant/isnet-int8-static.onnx
"""
import argparse
import os
from collections import Counter

import numpy as np
import onnx
from PIL import Image
from onnxruntime.quantization import (
    CalibrationDataReader,
    CalibrationMethod,
    QuantFormat,
    QuantType,
    quantize_static,
)

SIZE = 1024


def preprocess(path: str) -> np.ndarray:
    im = Image.open(path).convert("RGB").resize((SIZE, SIZE))
    arr = np.asarray(im, dtype=np.float32) / 255.0 - 0.5
    return np.transpose(arr, (2, 0, 1))[None, ...]


def variants(path: str) -> list[np.ndarray]:
    """同一张图派生几个校准样本：原图 / 水平翻转 / 中心裁剪 / 亮度变化。"""
    im = Image.open(path).convert("RGB").resize((SIZE, SIZE))
    out = [im, im.transpose(Image.FLIP_LEFT_RIGHT)]

    w, h = im.size
    box = (int(w * 0.1), int(h * 0.1), int(w * 0.9), int(h * 0.9))
    out.append(im.crop(box).resize((SIZE, SIZE)))

    from PIL import ImageEnhance

    out.append(ImageEnhance.Brightness(im).enhance(0.7))
    out.append(ImageEnhance.Brightness(im).enhance(1.3))

    samples = []
    for img in out:
        arr = np.asarray(img, dtype=np.float32) / 255.0 - 0.5
        samples.append(np.transpose(arr, (2, 0, 1))[None, ...])
    return samples


class Reader(CalibrationDataReader):
    def __init__(self, samples: list[np.ndarray], input_name: str = "input_image"):
        self._samples = samples
        self._input_name = input_name
        self._it = iter(samples)

    def get_next(self):
        arr = next(self._it, None)
        # 必须返回 {输入名: ndarray}，直接返回 ndarray 会让校准器崩溃
        return None if arr is None else {self._input_name: arr}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fp32", default="test-results/quant/isnet-fp32.onnx")
    ap.add_argument("--out", default="test-results/quant/isnet-int8-static.onnx")
    ap.add_argument(
        "--calib",
        nargs="+",
        default=["test-results/quant/portrait.jpg", "public/demo-photo.jpg"],
    )
    ap.add_argument("--format", choices=["qoperator", "qdq"], default="qoperator")
    ap.add_argument("--calib-method", choices=["minmax", "percentile"], default="minmax")
    args = ap.parse_args()

    samples: list[np.ndarray] = []
    for path in args.calib:
        samples.extend(variants(path))
    print(f"calibration samples: {len(samples)}")

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    extra = {"ActivationSymmetric": False, "WeightSymmetric": True}
    if args.calib_method == "percentile":
        extra["CalibPercentile"] = 99.9
    quantize_static(
        args.fp32,
        args.out,
        Reader(samples),
        quant_format=QuantFormat.QDQ if args.format == "qdq" else QuantFormat.QOperator,
        activation_type=QuantType.QUInt8,
        weight_type=QuantType.QInt8,
        per_channel=True,
        reduce_range=False,
        op_types_to_quantize=["Conv", "MatMul", "Gemm"],
        calibrate_method=CalibrationMethod.Percentile if args.calib_method == "percentile" else CalibrationMethod.MinMax,
        extra_options=extra,
    )

    m = onnx.load(args.out)
    onnx.checker.check_model(m)
    ops = Counter(n.op_type for n in m.graph.node)
    print("ops:", {k: ops.get(k, 0) for k in ("Conv", "QLinearConv", "ConvInteger", "MatMul", "MatMulInteger", "DynamicQuantizeLinear", "QuantizeLinear", "DequantizeLinear")})
    print(f"size: {os.path.getsize(args.out):,} bytes ({os.path.getsize(args.out) / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
