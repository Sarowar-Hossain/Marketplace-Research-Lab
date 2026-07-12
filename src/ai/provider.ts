// AI Provider Abstraction Layer (Doc 006 §18): the rest of the application
// communicates only with this interface; provider specifics stay here.
export type AiProvider = {
  sendPrompt: (prompt: string) => Promise<string>;
};

export type AiProviderConfig = {
  provider: string;
  model: string;
  apiKey: string;
};

// All supported providers speak the OpenAI-compatible chat-completions
// protocol, so a single HTTP implementation with per-provider endpoints covers
// them without vendor SDKs.
const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/chat/completions',
  glm: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
};

const REQUEST_TIMEOUT_MS = 120000;

export function createAiProvider(config: AiProviderConfig): AiProvider {
  const endpoint = PROVIDER_ENDPOINTS[config.provider];
  if (!endpoint) {
    throw new Error(
      `Unknown AI provider "${config.provider}". Supported providers: ${Object.keys(PROVIDER_ENDPOINTS).join(', ')}`,
    );
  }
  if (!config.model || !config.apiKey) {
    throw new Error('AI provider requires a configured model and API key');
  }

  return {
    sendPrompt: async (prompt: string): Promise<string> => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const body = (await response.text()).slice(0, 300);
        throw new Error(`AI provider request failed: HTTP ${response.status} — ${body}`);
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new Error('AI provider response did not contain message content');
      }
      return content;
    },
  };
}
