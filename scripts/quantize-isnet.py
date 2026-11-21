"""
把 isnet-general-use fp16 ONNX 量化成 int8，用于浏览器本地抠图。

用法：
  .venv-onnx/Scripts/python.exe scripts/quantize-isnet.py \
      public/models/isnet-general-use-fp16.onnx \
      test-results/quant/isnet-int8.onnx

步骤：
  1. fp16 -> fp32（onnxruntime 的量化器只处理 float32 权重）
  2. int8 量化（优先动态；CNN 的 Conv 需要显式指定 op 类型）
  3. 打印体积变化与算子统计
"""
import os
import sys
from collections import Counter

import numpy as np
import onnx
from onnx import TensorProto, numpy_helper
from onnxruntime.quantization import quantize_dynamic, QuantType


def fp16_to_fp32(model: onnx.ModelProto) -> onnx.ModelProto:
    """把 initializer / Constant / Cast / value_info 里的 fp16 全部转成 fp32。

    这个模型没有 value_info，Constant 已是 fp32，只剩权重和 35 个 Cast。
    """
    g = model.graph

    inits = []
    for init in g.initializer:
        if init.data_type == TensorProto.FLOAT16:
            arr = numpy_helper.to_array(init).astype(np.float32)
            inits.append(numpy_helper.from_array(arr, init.name))
        else:
            inits.append(init)
    g.ClearField("initializer")
    g.initializer.extend(inits)

    for node in g.node:
        if node.op_type == "Cast":
            for attr in node.attribute:
                if attr.name == "to" and attr.i == TensorProto.FLOAT16:
                    attr.i = TensorProto.FLOAT
        elif node.op_type == "Constant":
            for attr in node.attribute:
                if attr.name == "value" and attr.t.data_type == TensorProto.FLOAT16:
                    arr = numpy_helper.to_array(attr.t).astype(np.float32)
                    attr.t.CopyFrom(numpy_helper.from_array(arr, attr.t.name))

    for vi in list(g.input) + list(g.output) + list(g.value_info):
        if vi.type.tensor_type.elem_type == TensorProto.FLOAT16:
            vi.type.tensor_type.elem_type = TensorProto.FLOAT

    return model


def summarize(path: str) -> None:
    m = onnx.load(path)
    ops = Counter(n.op_type for n in m.graph.node)
    interesting = {k: ops.get(k, 0) for k in ("Conv", "QLinearConv", "MatMul", "MatMulInteger", "DynamicQuantizeLinear", "QuantizeLinear", "DequantizeLinear")}
    print(f"      ops: {interesting}")
    print(f"      size: {os.path.getsize(path):,} bytes ({os.path.getsize(path) / 1e6:.1f} MB)")


def main() -> None:
    src = sys.argv[1] if len(sys.argv) > 1 else "public/models/isnet-general-use-fp16.onnx"
    dst = sys.argv[2] if len(sys.argv) > 2 else "test-results/quant/isnet-int8.onnx"

    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    fp32_path = os.path.join(os.path.dirname(dst) or ".", "isnet-fp32.onnx")

    print(f"[1/3] load {src}")
    model = onnx.load(src)

    print("[2/3] fp16 -> fp32 (manual)")
    model32 = fp16_to_fp32(model)
    onnx.checker.check_model(model32)
    onnx.save(model32, fp32_path)
    print(f"      fp32: {os.path.getsize(fp32_path) / 1e6:.1f} MB")

    print("[3/3] int8 quantization (dynamic, Conv+MatMul+Gemm)")
    quantize_dynamic(
        fp32_path,
        dst,
        weight_type=QuantType.QInt8,
        op_types_to_quantize=["Conv", "MatMul", "Gemm"],
        per_channel=True,
    )
    onnx.checker.check_model(onnx.load(dst))
    summarize(dst)

    print(
        f"done: {os.path.getsize(src) / 1e6:.1f} MB (fp16) -> "
        f"{os.path.getsize(dst) / 1e6:.1f} MB (int8)"
    )


if __name__ == "__main__":
    main()
