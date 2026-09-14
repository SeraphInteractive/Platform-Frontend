export interface AiDetectionResult {
  aiProbability: number; // 0 - 100
  isFlagged: boolean;
  verdict: 'HUMAN' | 'SUSPICIOUS' | 'SYNTHETIC_AI';
  confidenceLabel: string;
  textSignals: string[];
  mediaSignals: string[];
  metrics: {
    vocabularyEntropy: number;
    sentenceBurstiness: number;
    hallmarkTriggers: number;
    mediaArtifacts: number;
  };
}

const LLM_HALLMARK_PHRASES = [
  'delve',
  'tapestry',
  'testament to',
  'seamlessly',
  'in conclusion',
  'it is important to remember',
  'vibrant realm',
  'beacon of',
  'multifaceted',
  'revolutionize',
  'paramount',
  'rich tapestry',
  'furthermore',
  'moreover',
  'pivotal role',
  'captivating visual journey',
  'symphony of',
  'intricate dance',
  'breathtaking spectacle',
  'nestled in',
  'unwavering commitment',
];

const SYNTHETIC_MEDIA_MARKERS = [
  'sdxl',
  'stablediffusion',
  'midjourney',
  'dall-e',
  'dalle',
  'comfyui',
  'novelai',
  'runway',
  'pika',
  'sora',
  'flux',
  'generated',
  'synthetic',
  'synth',
  'txt2img',
  'img2img',
];

export function analyzeSyntheticContent(
  title: string,
  description: string = '',
  mediaUrl?: string | null
): AiDetectionResult {
  const fullText = `${title} ${description}`.trim();
  const lowerText = fullText.toLowerCase();

  const textSignals: string[] = [];
  const mediaSignals: string[] = [];

  let textScore = 0;
  let mediaScore = 0;

  // 1. Text Analysis: Hallmark LLM Cliché Detection
  let triggerCount = 0;
  LLM_HALLMARK_PHRASES.forEach((phrase) => {
    if (lowerText.includes(phrase)) {
      triggerCount++;
      textSignals.push(`Hallmark LLM phrase: "${phrase}"`);
    }
  });

  if (triggerCount >= 3) {
    textScore += 45;
  } else if (triggerCount >= 1) {
    textScore += triggerCount * 15;
  }

  // 2. Vocabulary Entropy and Burstiness Calculation
  const words = lowerText.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const totalWords = words.length || 1;
  const uniqueWords = new Set(words).size;
  const ttr = uniqueWords / totalWords; // Type-Token Ratio

  const sentences = fullText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceLengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const avgLen = sentenceLengths.reduce((a, b) => a + b, 0) / (sentenceLengths.length || 1);
  const variance =
    sentenceLengths.reduce((a, b) => a + Math.pow(b - avgLen, 2), 0) /
    (sentenceLengths.length || 1);
  const burstiness = Math.sqrt(variance) / (avgLen || 1); // Coefficient of variation

  // AI text typically exhibits uniform sentence length (low burstiness < 0.25) and moderate TTR
  if (totalWords > 25 && burstiness < 0.22) {
    textScore += 20;
    textSignals.push('Low syntactic burstiness (uniform AI sentence pacing)');
  }

  if (totalWords > 40 && ttr < 0.55) {
    textScore += 15;
    textSignals.push('Low lexical entropy / formulaic repetition');
  }

  // 3. Media & Artifact Inspection
  let artifactCount = 0;
  if (mediaUrl) {
    const lowerMedia = mediaUrl.toLowerCase();
    SYNTHETIC_MEDIA_MARKERS.forEach((marker) => {
      if (lowerMedia.includes(marker)) {
        artifactCount++;
        mediaSignals.push(`Synthetic pipeline marker in asset URI: "${marker}"`);
      }
    });

    if (artifactCount > 0) {
      mediaScore += 65;
    }

    // Check for synthetic resolution patterns in query params or URLs
    if (lowerMedia.includes('1024x1024') || lowerMedia.includes('512x512') || lowerMedia.includes('768x768')) {
      mediaScore += 20;
      mediaSignals.push('Diffusion native aspect ratio resolution signature');
    }
  }

  // Compute composite AI probability (0 - 100)
  const weightedProbability = Math.min(
    99,
    Math.max(
      4,
      Math.round(
        mediaUrl
          ? textScore * 0.45 + mediaScore * 0.55
          : textScore
      )
    )
  );

  const isFlagged = weightedProbability >= 65;
  const verdict: 'HUMAN' | 'SUSPICIOUS' | 'SYNTHETIC_AI' =
    weightedProbability >= 75
      ? 'SYNTHETIC_AI'
      : weightedProbability >= 50
      ? 'SUSPICIOUS'
      : 'HUMAN';

  const confidenceLabel =
    verdict === 'SYNTHETIC_AI'
      ? `${weightedProbability}% AI Synthetic`
      : verdict === 'SUSPICIOUS'
      ? `${weightedProbability}% Suspicious`
      : `${100 - weightedProbability}% Human Baseline`;

  return {
    aiProbability: weightedProbability,
    isFlagged,
    verdict,
    confidenceLabel,
    textSignals,
    mediaSignals,
    metrics: {
      vocabularyEntropy: Number(ttr.toFixed(3)),
      sentenceBurstiness: Number(burstiness.toFixed(3)),
      hallmarkTriggers: triggerCount,
      mediaArtifacts: artifactCount,
    },
  };
}
