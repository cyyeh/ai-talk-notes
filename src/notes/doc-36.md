---
title: Evals 101: Intro to Evals for Engineers
speaker: Braintrust
video: https://youtu.be/Dn3_H2zcvPI?si=QGvlGCuRypbCRlAg
---
This video teaches engineers "how to implement evals for LLMs/agents" and why you should do it this way.

The speaker starts by explaining that as everyone now uses LLMs to build agents, workflows, and automated knowledge work, there are inevitably various ways things can go wrong: errors propagate along the workflow, answer quality drifts over time, and the system might violate privacy or say strange things no human would say. Because these are entirely new "failure modes," you can't rely on intuition or demos alone — you need a systematic eval process to measure and improve.

He describes eval as a loop: first find failure scenarios from real usage records (traces), design scorers for those scenarios, change the model or agent design, then use the eval to measure whether things actually improved, and repeat. This is similar to traditional software testing but not the same:\
an eval is not a unit test — it can't and shouldn't cover every case; the score shouldn't be 100 either — if everything passes, either you've built a perfect agent, or your eval has blind spots. He suggests thinking of eval scores like "grading from a very strict professor" — the goal is to surface differences and expose problems, not to chase a perfect score.

He introduces several scoring approaches:\
1) LLM as judge: use another model to judge whether the output is "good enough to accept"; the key is to design the problem as verification, not re-solving. Here he uses the "verifier vs. decider" analogy from theory of computation, saying that judging whether an answer is good is usually easier than coming up with the answer yourself.\
2) Code-based scorers: use code to parse or check the output (e.g., handling structured output, extracting key points), but this shouldn't devolve into hundreds of pseudo-unit tests like "was this tool called or not."\
3) Judge + code: code first organizes the input/output, then hands it to an LLM judge for high-level, subjective judgment — a very common combination in practice.

He stresses that eval is a team activity: not just engineers and PMs, but domain experts (doctors, lawyers, financial planners, etc.) are needed to label "whether this answer is professionally good." Engineers often lack real judgment in that domain, so experts should define what a "good answer" is, and those labels get turned into a dataset and scoring criteria. For subjective questions, he recommends having multiple experts label redundantly — the same trace can be scored by several people, and you then decide for yourself whether to use consensus, majority vote, or some other threshold to make the final call.

On "ground truth" and subjectivity, he says cases with a genuinely clear correct answer are actually rare; most of the time you can only ask "is this answer good enough to accept?" rather than "is this the one right answer?" So in practice it's best to compress scoring into a binary (0 or 1, good or bad) for ease of use in production; in the early exploration stage you can let the model give a continuous 0–1 score, then have humans review those outputs, compare them, manually adjust the threshold, and finally settle on the binary rule you'll actually use.

He also discusses "eval granularity": you can score a single tool call, a single turn, an entire conversation, or a whole trace. In practice, first observe from the trace at what level failures occur, then design the corresponding scorer at that level — for example:\
if it's just that a particular tool is often misused, set up a scorer for that tool; if the whole conversation goes off-topic and takes many back-and-forths to find the answer, build a conversation-level scorer.

In the Q&A session, someone asks:

- What if multiple experts label inconsistently? He answers: Braintrust allows multiple reviewers to label the same piece of data, and then the user (you) decides what threshold or rule to apply (e.g., 4 approvals and 1 rejection still counts as passing).
- Could building evals only from "bad cases" lead to overfitting? His view: as long as the dataset keeps getting updated — with new failure scenarios continuously added and old failures, once fixed, turned into "positive examples" — it won't easily end up "only adapted to old mistakes." An eval dataset should be a dynamic, continuously evolving "golden dataset," not a fixed, unchanging test set.
- How do you handle eval drift (model updates, shifting judge standards, dataset drift)? His answer: the process must retain a "human" layer. Human experts periodically calibrate the LLM judges' judgments, and the judges in turn constrain the underlying tasks/agents, forming a multi-layer control chain — but the ultimate standard remains human judgment, not the model itself.

In the implementation section that follows, he uses a "customer support agent" example repo to demonstrate how to:\
first add Braintrust's trace decorator into the code, recording both LLM calls and tool calls as traces;\
then extract several representative failure patterns from those traces (e.g., not following brand tone, not making good use of the provided FAQ context, or not matching the ground-truth answer), and define a scorer for each failure pattern;\
finally, package the "task function + dataset + scorers" into an eval that can be re-run locally or on the platform, observing the score difference before and after a change.

In summary, the core message of this video is:\
LLM/agent development can't rely on demos or intuition alone — "observe real traces → identify failure patterns → design evals and scorers → iterate" needs to become a fixed engineering process;\
an eval is not a traditional unit test, but a team activity combining LLM judges, code assistance, and human expert labeling, used to continuously measure and improve quality in a messy, probabilistic system.
