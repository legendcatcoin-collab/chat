import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, apiKey, model, systemPrompt } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const key = apiKey || process.env.OPENROUTER_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'OpenRouter API Key is missing' }, { status: 401 });
    }

    const formattedMessages = [];
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }

    // append rest
    messages.forEach((m: any) => {
      formattedMessages.push({ role: m.role, content: m.content });
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://aichat.app', // required by openrouter
        'X-Title': 'Mobile AI Chat', // required by openrouter
      },
      body: JSON.stringify({
        model: model || 'google/gemini-2.5-pro:free',
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `OpenRouter API error: ${err}` }, { status: response.status });
    }

    // Return the response directly to stream it to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
