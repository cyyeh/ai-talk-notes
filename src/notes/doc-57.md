---
title: Making Neural Networks Smaller: Quantization and Pruning
speaker: PrismML
video: https://youtu.be/2qeEal55TEw?si=Qf7-0V3yklWUsJKf
---
This talk explains how quantization and related techniques can make large neural networks smaller, faster, and more power-efficient, while losing as little performance as possible. Below is a summary of the key points.

Why quantize a model?

The speaker first explains the motivation: you pay for training once, but you pay for inference on every token, every user, every conversation.\
Between 2023 and 2025, training cost, while high, grew relatively steadily; from 2024 to 2025, inference cost has already reached the multi-billion-dollar range, and it's still rising fast. Quantization directly lowers inference cost.

Beyond cost, there are two other key pressures:

1. Memory pressure and deployment footprint

▫ A truly massive model (like Kimi K2) simply doesn't fit on a single GPU at 16-bit precision — it needs to be sharded across multiple cards.

▫ Quantize the weights down to 1-bit, and it can potentially fit on a single H200, greatly simplifying the inference architecture.

▫ For a 7B-class model, after 1-bit quantization it can even fit on a phone.

▫ Prism/Bonsai's example: a 1.7B model, after 1-bit quantization, comes out to about 240MB — extremely small.

2. Energy and bandwidth bottlenecks

▫ For example, using Int4 (4-bit integer) matrix multiplication instead of FP16 matrix multiplication can cut energy consumption by roughly an order of magnitude.

▫ GPU compute capability grows roughly 60% a year, but memory bandwidth grows only about 20%. If quantization can reduce the number of bits that need to be moved, that's effectively "squeezing more compute out of less bandwidth" — getting a taste of next-generation hardware early.

Don't just quantize the weights: the KV cache becomes a bottleneck too

The speaker specifically warns: at long sequence lengths, the KV cache's memory footprint will exceed that of the weights.

- KV cache size grows linearly with sequence length.
- Once context reaches 64K, the KV cache's memory usage is already bigger than the model weights.
- If the weights are then shrunk further via quantization, the KV ratio gets even more extreme — the KV cache can exceed the weights even at 16K or 32K. So when optimizing deployment, you can't only worry about weights — you also need to consider compressing the KV cache or using alternative architectures, such as SSM/Mamba-style models or hybrid architectures. Although these don't yet fully surpass standard attention in performance, they've already been adopted by a large number of the newest models.

What is quantization? Starting with round-to-nearest

He uses an intuitive picture to explain basic quantization:

- Suppose a neural network layer's weights are distributed roughly like a Gaussian (a bell curve).
- Build a "grid": for example, 4-bit represents 16 discrete values.
- Every continuous weight value gets "rounded" to the nearest grid point.
- The result: what was a continuous distribution becomes a histogram with only a handful of discrete values.

The intuitive effect at different precisions:

- 1-bit: only +1 and −1 (or ± some constant) — it describes almost none of the shape.
- ternary (three values): adds a 0, providing a sparsity signal that can express "drop this connection."
- 2-bit: a bit more signal, but still far from the continuous curve.
- 4-bit: starts to approximate the bell curve — simple round-to-nearest is usually just about workable.
- 8-bit: round-to-nearest has barely any issues, with little impact on performance.

One of the biggest enemies: outliers

If all the weights sit within some small range, quantization is easy; but once a few extreme values (outliers) appear, the whole dynamic range gets stretched, and ordinary values get "squeezed" into the same bucket — or even collapse to 0.

Example:

- A vector where most values sit near 0, with one outlier at 0.95.
- If a single quantization range has to cover the whole vector, then to accommodate that 0.95, many small values near 0 get quantized down to 0.
- These outliers are often considered the most important weights in pruning theory, so quantizing them poorly can badly hurt performance.

Fighting outliers: per-group (per-channel) quantization

A simple solution: instead of using one set of quantization parameters for the whole matrix, quantize in groups.

- For example, for a 16×16 matrix, split each row into 4 groups (4 numbers per group).
- Each group determines its own quantization range and scale.
- If an outlier only exists within one group, it only affects that small group — it won't drag down the whole row or layer.

The cost:

- You need to store one scale per group (possibly FP16 or lower precision), adding a small amount of "extra bits."
- The speaker gives the Bonzai model as an example: with a group size of 128, storing one extra FP16 scale per group works out to about 0.125 extra bits per weight, so the "1-bit" weights actually come to about 1.125 bits in practice.
- If the scale itself is also stored at lower precision (e.g., 4-bit), the overhead can be reduced further.

Overall, this is a case of trading a bit more metadata for better quantization results.

Rotations: spreading out outlier energy

Another line of technique is various "rotation" transforms, the most classic being the Hadamard transform.

The intuition:

- If one dimension of a vector is especially large and the rest are small, multiplying it on the left by a Hadamard matrix spreads the large value's energy across all dimensions, so each dimension only grows slightly.
- That way, the original single outlier is no longer so extreme, and becomes easier to express with fewer bits.

How this is done in practice without breaking the network:

- Applying the Hadamard transform directly to the weights would distort the network's function.
- The common approach: multiply both weights and activations by the Hadamard matrix separately (i.e., add the same orthogonal transform before and after a linear layer), then quantize each separately.
- Because Hadamard is an orthogonal matrix, applying it and then its inverse on either side leaves the network functionally equivalent, but the piece in between now lives in a Hadamard space that's more amenable to quantization.
- The core idea: move the data into a coordinate system that's more quantization-friendly, and do your work there.

Mixed precision and SVD-Quant: shifting the hard part and splitting it apart

Next, the speaker discusses "mixed precision":\
In practice, when someone claims a "4-bit model," it usually isn't the case that every weight in every layer is really 4-bit. For example:

- NVIDIA's NVFP4 is actually closer to 4.5–5 bits.
- Many systems keep critical parts like the output head (LM head) at 8-bit or 16-bit, and only lower the precision elsewhere.

SVD-Quant's core idea

SVD-Quant attempts to quantize both weights and activations to Int4, which is very hard. Its approach breaks down into roughly these steps:

1. First analyze the activations and discover there are outliers in them — quantizing directly would cause heavy damage.
2. Do group-based quantization first (per-group, as described above), but it's still not good enough.
3. Then introduce "smoothing":

▫ Multiply the activations by a diagonal matrix D, turning the original X into X̂, so that X's distribution gets "flattened," making it more quantization-friendly.

▫ Correspondingly, the weights are multiplied by D's inverse, which makes the weights harder to quantize — the problem has been shifted from the activations to the weights.

4. Then use SVD + LoRA to handle the now-harder-to-quantize weights:

▫ Run SVD on the transformed weights to find the dominant directions (corresponding to the outliers).

▫ Use those directions to build a LoRA branch (the low-rank path L1, L2), and store this "hard-to-quantize part" as a high-precision side channel.

▫ The backbone weights Ŵ can then be quantized to low bits, since the hardest directions have already been split off.

The final result:

- Activations: become easy to quantize in the smoothed space.
- Weights: the backbone part can be quantized to Int4; the difficult part is compensated for via the high-precision LoRA branch.
- The LoRA branch only adds a small amount of memory and a little inference compute overhead, in exchange for substantial overall model compression.

The speaker gives an intuitive demonstration using a "steak picture":

- The original image is the baseline steak.
- With methods that quantize only weights or only activations, the steak "still looks like a steak but is distorted."
- With naive full-Int4 quantization, the image is badly distorted.
- With SVD-Quant, the reconstructed image with Int4 weights and activations looks almost identical to the original.

This example also highlights that weights and activations, when it comes to handling outliers and quantization, form something like a "duality" — difficulty can be shifted and balanced between the two.

The Bonzai model: a truly "uniform bit-width" 1-bit / ternary model

Many so-called 2-bit or 4-bit models are actually mixed precision. What Prism wants to do is make every layer and every weight the same bit width — no escape hatch.

- They implemented and released two paths:

▫ A fully 1-bit weight model

▫ A fully ternary weight model (−1, 0, 1)

- All kernels are open source, running on standard backends (llama.cpp, MLX, vLLM, etc.), and measured on real hardware.
- Because of the per-group scale, the actual effective bit width is about 1.125 bits/weight.

Performance and memory results

Averaged across a set of six benchmarks (such as IFEVAL, GSM8K, HumanEval, BFCL, MUSER, MMLU Redux):

- Compared to the full-precision Qwen 3 model, memory requirements drop by roughly an order of magnitude.
- It still retains about 90–95% of the original performance.

On the "model size vs. average score" Pareto chart:

- Model families represented by Qwen and Mistral form a frontier.
- The Bonzai model shifts noticeably to the "left" on this chart, meaning it reaches comparable performance at a much smaller model size — demonstrating the potential of "compressed intelligence."

Speed and energy consumption

Measured inference speed and energy consumption also show clear advantages:

- On an RTX 4090, for the same model:

▫ The traditional, higher-bit version: about 59 tokens/s

▫ 1-bit Bonzai: about 368 tokens/s (roughly 6x)

- A similar speedup trend shows up on an Apple M4 Mac as well.
- On an iPhone, the original precision or the 8-bit version won't fit — you can only use 4-bit; while 1-bit, with a good implementation, can hit tokens/s on a phone that approach a desktop GPU's.
- On energy: across the 4090, M4, and iPhone alike, the 1-bit version's wattage draw is markedly lower.

Summary

Putting the whole talk together:

- The main goal of quantization is to reduce inference cost, memory, and energy consumption, so large models can be practically deployed in more places (cloud, edge, phone).
- Plain "round to nearest" low-bit quantization runs into serious challenges below 4-bit, outliers especially.
- Techniques like per-group quantization, rotation (Hadamard), mixed precision, smoothing, and SVD+LoRA make up the current main toolbox for fighting outliers and narrowing the "quantization gap."
- Weights and activations have a dual relationship across these methods, letting you shift difficulty from one side to the other and handle it separately.
- Prism's Bonzai model demonstrates that, on real hardware, extreme quantization like 1-bit/ternary — with careful design and implementation — can already come close to full-precision model performance across multiple benchmarks, while delivering huge savings in memory, big speed gains, and lower energy use.
