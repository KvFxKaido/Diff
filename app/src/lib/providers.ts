import type { AIProviderType, AIProviderConfig, AIModel, PRData, AnalysisResult } from '@/types';
import { analyzePRWithOllamaCloud } from '@/lib/ollama';

export const PROVIDERS: AIProviderConfig[] = [
  {
    type: 'ollama-cloud',
    name: 'Ollama Cloud',
    description: 'Ollama Cloud with Gemini 3 models',
    envKey: 'VITE_OLLAMA_CLOUD_API_KEY',
    envUrl: 'VITE_OLLAMA_CLOUD_API_URL',
    models: [
      { id: 'gemini3:latest', name: 'Gemini 3', provider: 'ollama-cloud' },
      { id: 'gemini3:12b', name: 'Gemini 3 12B', provider: 'ollama-cloud' },
      { id: 'gemini3:4b', name: 'Gemini 3 4B', provider: 'ollama-cloud' },
      { id: 'gemini3:1b', name: 'Gemini 3 1B', provider: 'ollama-cloud' },
    ],
  },
];

export function getProvider(type: AIProviderType): AIProviderConfig | undefined {
  return PROVIDERS.find((p) => p.type === type);
}

export function getDefaultModel(type: AIProviderType): AIModel | undefined {
  const provider = getProvider(type);
  return provider?.models[0];
}

export async function analyzePR(
  prData: PRData,
  _providerType: AIProviderType,
  modelId?: string,
): Promise<AnalysisResult> {
  return analyzePRWithOllamaCloud(prData, modelId || 'gemini3:latest');
}
