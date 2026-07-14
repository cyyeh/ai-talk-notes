---
title: Optimizing Model Training End-to-End: A Tiny MoE Case Study
speaker: Zach Mueller, Lambda
video: https://youtu.be/s_hSPBYQ3BA?si=vklbX1odpYA7SmS0
---
This video is about how to thoroughly optimize the entire training pipeline of a "small MoE model" from start to finish at home, using relatively modest hardware, speeding it up enough to run two experiments per day.

Video overview

Speaker Zach Mueller (Lambda's head of developer relations) uses an experiment with a roughly 500-million-parameter tiny Mixture-of-Experts model to demonstrate how to compress a pretraining experiment that originally took about 60+ hours down to around 13.2 hours on a home multi-GPU machine, while also discussing why small models and small MoE matter in today's agent era.

The content is roughly divided into three parts:

1. Why small models and small MoE matter right now
2. The real-world constraints and goals of pretraining at home
3. The step-by-step process and lessons learned from optimizing the entire training pipeline
4. Why "small MoE" and "training at home"

Zach first defines "small, medium, and large" models:

- Small: under about 35B parameters, trainable on a high-end but affordable single machine.
- Medium: around the 70B level, usually requiring cloud resources on the scale of 8×H100.
- Large: 100B+, where a single failed training run starts at several hundred thousand dollars.

He observes that small MoE models have sprung up rapidly over the past year or two (Granite, Liquid, Zephyrus, etc.), for the following reasons:

- The agentic AI wave: it requires many fast-reacting, low-latency models to support large numbers of agents.
- Local/edge computing: running "hundreds of small agents 24/7" on a Mac, for example, is constrained by RAM/VRAM, forcing the use of very small models.
- Customizable, bring-your-own-data: small models place less pressure on VRAM, so you can train and fine-tune them yourself without touching the cloud.
- Small models train fast: going from zero to a demo-worthy pretrained model can be done on the order of days.

But he also emphasizes that optimizing training for small models is different from doing so for large models:

- Large models are often sharded across many GPUs, so the bottlenecks are mostly "communication" and distributed architecture.
- Small models mostly fit on a single GPU, so the bottleneck shifts to the data loader, CPU-side overhead, algorithm choices, and so on.
- Small models saturate on tokens easily, so data quality and distribution must be tightly controlled to make effective use of the limited parameters.

2. The real-world constraints and goals of pretraining at home

What Zach wants to do is "real pretraining research at home," while keeping cloud costs to a minimum.

His hardware setup and constraints are roughly:

- One personal workstation equipped with 4 Blackwell RTX 6000 MXM-class GPUs.
- No NVLink or InfiniBand — the GPUs are connected only via PCIe (and an older generation at that, roughly half the speed of PCIe 5).
- Electricity isn't cheap, but compared to renting cloud GPUs over long stretches, it's still much cheaper in the long run.

After discussing it with colleagues at Hugging Face, he settled on a practical threshold for the experiment design:

- Target time per pretraining experiment: about 12–13 hours, so that two experiments can be run per day.
- Each experiment should run at least close to Chinchilla optimal:

▫ Rule of thumb: token count ≈ 20 × (model parameters in billions)

▫ For example, an 8B model should see roughly 160B tokens (epochs can repeat; what matters is the total token count).

Because:

- If an experiment takes 2–3 days, it becomes extremely hard to iterate, and it wastes limited compute.
- Hitting this pace within limited MFU (Model FLOP Utilization) and VRAM naturally constrains the model to a small scale.

He specifically explains MFU:

- At major labs, on H100-class setups, an MFU of 50–55% is considered good.
- At home, without high-speed GPU interconnects, stably reaching 30–35% MFU is already ideal.
- Mixture-of-Experts is inherently "inefficient" in terms of FLOPs utilization — many large-scale experiments get only around 30% MFU; xAI once revealed that some architectures achieved only 11% MFU, simply because the design wasn't aligned with the hardware.

3. Tiny MoE Case Study: compressing 61 hours down to 13.2 hours

3.1 Problem setup and the "depression calculator"

He chose a small MoE with a "LLaMA-3-like architecture" for the experiment:

- Keeping the original vocab design, total parameters were reduced to about 500M, with about 330M active (a large portion being embeddings).
- The goal was to use this tiny toy model to practice the entire pretraining-from-scratch process, while observing which optimizations actually help.

He wrote his own "depression calculator":

- You input the model size, target MFU, number of GPUs, tokens per batch, etc., and it estimates the time needed to train from scratch to Chinchilla-optimal.
- Under his home GPU setup, training a 500-million-parameter model to Chinchilla-optimal was estimated to take just over 13 hours — that's about the threshold of "barely acceptable."
- If you tried to run a 70B model to a similar token count on the same machine, it would take months or even years — completely impractical.

3.2 Initial baseline: 61 hours, with neither GPU nor CPU kept busy enough

The initial baseline setup was roughly:

- Applying FSDP (Fully Sharded Data Parallel, the PyTorch version), but without aggressive optimizations like FP8 yet.
- Using BF16, a batch size of 12, and about 200 total batches — a small experiment of roughly 10 million tokens used to extrapolate the full run.

After profiling, he found:

- The full experiment was projected to take about 62 hours.
- GPU utilization was around 70%, but CPU overhead was significant, and there was a large pink block in the profiler labeled "other."
- Time actually spent doing matmul was only a small fraction; much of the time was stuck at the CPU or driver level — data loading, the optimizer, and so on.

3.3 Single-machine optimization: compressing 61 hours down to about 43 hours

He began using the profiler to chip away at bottlenecks one by one:

1. Adjusting batch size to a power of 2 The original batch size of 12 was the maximum that "just barely avoided OOM," but Nvidia GPUs tend to make better use of hardware when the batch size is a power of 2. He adjusted the batch size to something closer to a power of 2 (like 8 or 16), immediately gaining a modest speedup — only a fraction of an hour's improvement, but helpful over a long run.
2. Switching to a faster attention implementation (Flex Attention) After asking colleagues at Hugging Face, he adopted a more efficient attention kernel. The result was a nearly "free" 30% speedup, suggesting the old attention kernel was quite inefficient for this kind of small model/setup.
3. Addressing the data loader and CPU overhead

▫ First, he used PyTorch's ‎⁠pin_memory=True⁠, reducing the cost of repeatedly allocating host memory for each batch — a small speedup that also shrank the "pink blob" in the profiler.

▫ Next, he pre-tokenized the entire dataset upfront and stored it as a Hugging Face Dataset, so training only needed simple indexing, with no more on-the-fly tokenization.

▫ This step drastically cut CPU-side overhead — the pink block nearly disappeared, and GPU kernels finally became the real star of the show.

4. Switching to the fused AdamW optimizer He asked a PyTorch engineer and was advised to enable the new fused AdamW, which merges what used to be many separate multiply and update operations into a small number of fused kernels. After enabling it, that mysterious pink overhead in the profile nearly vanished entirely, leaving less than 1%.

Taken together, the estimated single-GPU training time dropped from 61 hours to about 44 hours — roughly a 50% improvement in throughput.

3.4 Multi-GPU scaling and the communication bottleneck

After optimizing the single-GPU case, he moved on to multi-GPU data parallelism:

- In theory, with 4 GPUs and high-speed interconnects like NVLink, you'd expect close to a linear 4× speedup.
- But in his actual home PCIe 4 environment, he only got about a 2.6× speedup, because all-reduce communication was too slow.

Profiling revealed:

- In the multi-GPU setup, about 50% of step time was spent on all-reduce (gradient synchronization), with only about 20% actually spent running matmul.
- He estimated:

▫ Each all-reduce takes about 0.08 seconds, which could only be roughly halved under ideal PCIe 5 conditions.

▫ Accumulated across the 100,000-plus batches needed to train to Chinchilla-optimal, communication alone would consume about 2.26 hours.

- This is a problem large cloud data centers with NVLink/InfiniBand barely need to worry about, but at home it becomes the main bottleneck.

3.5 Using gradient accumulation to cut communication frequency → 13.2 hours

After consulting Eli Barco at Hugging Face, he adopted a common rule of thumb:

- Most pretraining research designs things so that "each optimizer step processes about 1 million tokens."
- A single physical batch couldn't fit that many tokens (it would OOM), but gradient accumulation could be used instead:

▫ Assuming each small batch is about 100k tokens, you'd accumulate over 10 steps before doing a single all-reduce and optimizer step.

▫ This cuts communication frequency to one-tenth of the original.

Real-world results:

- All-reduce dropped out of the top bottlenecks in the profile, its share of time falling noticeably.
- The estimated time for the whole run dropped straight to about 13.2 hours, hitting his original goal of "running two complete experiments per day."

4. Conclusions and takeaways

Zach offers a summary and a few reflections:

1. The overall time went from about 61 hours down to 13.2 hours, not through any single silver bullet, but through a series of detailed optimizations:

▫ Sensible batch size settings

▫ Using an efficient attention kernel

▫ Moving tokenization and data loading out of the training loop as much as possible

▫ Using a fused optimizer

▫ Making good use of gradient accumulation to reduce communication overhead

2. Not every optimization that helps on a single GPU is worth it on multiple GPUs:

▫ He tried writing a custom CUDA kernel to skip certain matmuls, which should theoretically have been faster.

▫ But for a model this small, the overhead of launching the kernel itself canceled out the gains, and the result wasn't actually any faster.

▫ In the world of small models, a lot of "flashy" optimizations don't necessarily pay off.

3. Pretraining at home is an option that has only recently become practical:

▫ Once hardware prices and GPU performance reach a certain sweet spot, a personal workstation can run genuine architecture experiments, not just fine-tuning.

▫ Electricity plus hardware amortization can actually be cheaper than long-term cloud compute rental if you experiment often.

4. Future plans:

▫ Over the next few months, he plans to keep working on this kind of tiny MoE, pairing it with synthetic data and different data blends from providers like Nvidia, and release a batch of small models to explore just how far high-quality/synthetic data can push small MoE.

Overall, this video is a very concrete case study: it demonstrates how to use a profiler and a series of experiments to tune a training task that originally took "three days at home" down to something completable "within half a day," and explains why small, efficient, locally-trainable MoE models are becoming increasingly important in the agent era.
