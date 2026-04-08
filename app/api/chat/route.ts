import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const FALLBACK_MODELS = [
  'google/gemini-2.5-flash:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'qwen/qwen-2-7b-instruct:free',
  'openchat/openchat-7b:free',
  'google/gemma-2-9b-it:free',
  'huggingfaceh4/zephyr-7b-beta:free',
  'arcee-ai/trinity-large-preview:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'z-ai/glm-4.5-air:free',
];

async function callModel(model: string, messages: any[], key: string): Promise<Response> {
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://chat9.up.railway.app/',
      'X-Title': 'Mobile AI Chat',
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages, apiKey, model, systemPrompt, mode } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const key = apiKey || process.env.OPENROUTER_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'OpenRouter API Key is missing. Please add one in Settings.' }, { status: 401 });
    }

    // Build system prompt based on mode
    const formattedMessages: any[] = [];
    let finalSystemPrompt = systemPrompt || 'You are a helpful, brilliant, and concise AI assistant.';
    if (mode === 'code') {
      finalSystemPrompt = "You are an expert developer. Output complete, working code in markdown code blocks. Be concise and accurate.";
    } else if (mode === 'islamic') {
      finalSystemPrompt = "You are a knowledgeable Islamic AI Assistant. Answer according to the Holy Quran and authentic Hadiths with high accuracy and respect.";
    } else if (mode === 'image') {
      finalSystemPrompt = "You are an AI image prompt generator. When asked to create an image, respond ONLY with a detailed, creative English prompt suitable for DALL-E or Midjourney.";
    }

    formattedMessages.push({ role: 'system', content: finalSystemPrompt });
    messages.forEach((m: any) => {
      let content: any = m.content;
      if (m.image) {
        content = [
          { type: 'text', text: m.content || '' },
          { type: 'image_url', image_url: { url: m.image } }
        ];
      }
      formattedMessages.push({ role: m.role, content });
    });

    // Priority: user-selected model first, then fallbacks
    const modelPriority = [model, ...FALLBACK_MODELS.filter(m => m !== model)];

    let lastError = '';
    for (const modelId of modelPriority) {
      try {
        const response = await callModel(modelId, formattedMessages, key);

        if (response.ok) {
          return new Response(response.body, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'X-Used-Model': modelId,
            },
          });
        }

        if (response.status === 401 || response.status === 403) {
          return NextResponse.json({ error: 'Invalid API Key. Please check your OpenRouter API key in Settings.' }, { status: 401 });
        }

        if (response.status === 429 || response.status === 503 || response.status === 404) {
          lastError = `${modelId} unavailable (${response.status}), trying next...`;
          continue;
        }

        lastError = await response.text();
        continue;

      } catch (e: any) {
        lastError = e.message;
        continue;
      }
    }

    return NextResponse.json({
      error: `All models are currently rate limited. Please wait a few minutes and try again. (${lastError})`
    }, { status: 429 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
