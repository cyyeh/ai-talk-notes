---
title: What comes after Deep Learning?
speaker: Incept Labs
video: https://youtu.be/jGy_GBkBj20?si=m1zcAudJyolT7TZk
---
This talk sets out to answer: "What comes after deep learning?"

The speaker opens with his own background: doing machine learning back in 2004, working on OCR at Google, and implementing and optimizing deep learning systems at Google Brain, OpenAI, PyTorch Distributed, and Together AI — implementing backprop many times over, doing gradient checkpointing, accelerating training for the ImageNet competition, working on GPT-2-class models, and so on. He emphasizes that he's seen both the "old era" and the "modern large-model era," which is why he believes much of today's practice is really the product of historical path, not the optimal solution.

He then introduces the core concept: "path dependency" — the way many originally reasonable designs become baggage once the environment changes, yet remain very hard to change.\
He offers several analogies:\
the traffic roundabout designed around the fact that horses can't back up; nuclear-reactor designs optimized for submarines being carried over into civilian use; the laryngeal nerve in long-necked animals taking a long detour; Python's GIL, which made sense in the single-core era but became a bottleneck in the multi-core era. The point: once hardware or the environment changes, it typically takes software and systems 20–30 years to truly catch up.

He then maps this concept back onto deep learning and modern AI:

1. Historical design decisions After the 1980s, many key design choices were "locked in": layer-by-layer networks, sequential gradient descent, using backprop as the standard learning algorithm, black-box general-purpose optimizers, generic activation functions, and so on. At the time, nobody knew what deep learning's real "product-market fit" would turn out to be, so people tried to make this whole toolkit generically applicable to "every task" (vision, speech, control systems, etc.).
2. Hardware conditions have completely changed He says modern hardware runs completely counter to the assumptions that backprop was designed under:

▫ Computation (arithmetic) has become extremely cheap, but "moving data around/memory access" is comparatively expensive (the memory wall).

▫ Dennard scaling has ended — clock speeds no longer increase, and core counts have exploded instead; if an algorithm is sequential, it can't take advantage of that multi-core benefit.

▫ A GPU like the H100 has hundreds of streaming multiprocessors that can run different instructions simultaneously — it's really more like a "small cluster" — yet algorithms still treat it as a single large device.

▫ In large-scale distributed training, hardware and network failures are frequent (with several thousand GPUs, some node is guaranteed to go down within a few hours), yet mainstream synchronous training lets "a problem on one card" stall the entire training run. He points out that backprop's fatal flaw is that, in order to save on compute, it was designed to require heavy reading and writing of intermediate activations while keeping compute relatively small — making it extremely out of step with a world where "memory is expensive, arithmetic is cheap." Gradient checkpointing is really just recomputing to work around this — a "patch" on the old design, not a fundamental fix.

3. Applications have also converged In the past, deep learning wanted to "do everything," so all the things people researched — optimizers, losses, activations — chased "generality." But today, a concrete task like "next-token prediction" is already a hundred-billion- to trillion-dollar business, so it's now acceptable to use highly specialized algorithms and optimizers, as long as they perform well on that core task — they don't need to serve every domain at once.
4. The path dependency of synchronous vs. asynchronous training Early on, people at Google trained on CPUs and spot instances, so training was naturally designed to be asynchronous, to tolerate fluctuating resources; later, someone added a synchronous barrier and found:

▫ Model accuracy improved slightly;

▫ more importantly, results became deterministic, making debugging easier.\
This was a good tradeoff at small scale on dedicated clusters, but it has since turned into a major problem in today's large-scale GPU training, where any small hiccup stalls the entire job — another example of path dependency.

Having laid out the problem, he turns to "what might come next":

- Change the algorithm first, not the hardware He believes changing things at the hardware level — wafers, the GPU supply chain — is extremely costly, and capital is conservative, making hardware-track innovation very hard. So what's more feasible, and more urgent, is "redesigning algorithms for existing GPU hardware," making the algorithm and the hardware more conformal to each other.
- Erase unnecessary abstraction boundaries Back when he worked on OCR at Google, unifying the entire pipeline (binarization, segmentation, classification) with deep learning demonstrated that removing stage boundaries can make the whole thing better. Similar ideas are showing up today in:

▫ GPU "mega-kernel" research, which treats the whole GPU as a small cluster and coordinates different SMs inside a single kernel, instead of calling layer by layer from an outer framework.

▫ Rethinking the boundary between framework and kernel, pushing more logic down to a layer closer to the hardware.

- More "hardware-specialized" algorithms and languages He points out that for the past 50 years, compiler culture has been about "hiding hardware complexity," letting researchers just write math while the compiler handles the rest. But this runs into a hard limit: if an algorithm is itself highly sequential, no compiler, however clever, can automatically turn it into efficient GPU code. So the visible trend right now is:

▫ more and more hardware-close domain-specific languages are emerging;

▫ researchers need to re-understand hardware characteristics so that algorithms are designed from the start to be parallel and memory-friendly, rather than relying on the compiler to patch things up afterward.

- Questioning backprop, and what might replace it He even directly predicts: "in five years we won't be using backprop anymore," arguing that, purely from the arithmetic-vs-memory-cost math, backprop isn't a viable long-term solution — future learning methods better suited to current hardware conditions will emerge (e.g. various forward-mode or local learning algorithms, or other alternatives not yet mature).
- Moving from black-box optimizers toward "task-specialized" ones Research on deep-learning optimizers has essentially hit a dead end: many algorithms that claim to be "comprehensively better than Adam" don't actually hold up empirically, and in practice people are still using Adam and a small handful of similar methods. He expects more optimizers "designed only for a specific class of problem" to emerge going forward — e.g. methods that only target text autoregressive models, or that are specific to a particular architecture or loss — similar to how numerical analysis designs optimization algorithms tailored to specific PDEs or specific structured problems.

In the final section, he discusses "how do we get there" — that is, research methodology:

- He argues against mythologizing the story of "thinking hard once and arriving at the good solution," and instead acknowledges that the whole field has advanced over 70 years through massive trial and error and hill climbing. For example, the Transformer wasn't invented in a single stroke — it accumulated from many small incremental improvements.
- His own experience in the ImageNet competition also supports "fast iteration + massive experimentation" having better odds than "deep experience + deep thinking": working alongside an engineer who'd only been in the field for two months, they beat Google's best record within a few months.
- So he has set up a fully public, crowdsourcing-leaning project that uses agents to automatically read, implement, and test various ideas, organized around two tracks:

▫ Theory/toy problems: for example, redesigning the memory-access pattern of matrix multiplication, chasing the algorithm that minimizes "idealized energy consumption";

▫ Practical/benchmark tasks: for example, on fixed hardware, hitting a specified text-prediction accuracy while using as few actual joules as possible (measured via nvidia-smi power draw), using this kind of benchmark to hill-climb new algorithms.

- All code and communications are released under a public-domain license, so anyone can use it commercially — he only cares about learning something new from other people's improvements.

To sum up, the core message of this talk is:\
deep learning itself isn't going to suddenly disappear, but the entire "playbook" we currently use — backprop, synchronous large-scale training, black-box optimizers, abstraction layers disconnected from the hardware — is, in large part, the product of decisions made in the 1980s under completely different hardware and application assumptions. As hardware moves into the era of many cores plus the memory wall, and AI applications converge onto a small number of task types, the next breakthrough is more likely to come from "redesigning algorithms and system architecture so they genuinely match real hardware and real tasks" — and that requires a great deal of experimental, even agent-assisted, exploration and hill climbing, rather than just fine-tuning within the existing framework.
