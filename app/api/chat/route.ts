import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, apiKey, model, systemPrompt, mode } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const key = apiKey || process.env.OPENROUTER_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'OpenRouter API Key is missing' }, { status: 401 });
    }

    const formattedMessages = [];
    
    // Inject dynamic system prompt based on mode
    let finalSystemPrompt = systemPrompt;
    if (mode === 'code') {
       finalSystemPrompt = "You are an expert developer. Output full, complete, and perfectly working code in single markdown blocks when requested. Provide robust, clean HTML/CSS/JS without unnecessary comments.";
    } else if (mode === 'islamic') {
       finalSystemPrompt = "You are a knowledgeable Islamic AI Assistant. Answer all questions according to the Holy Quran and authentic Hadiths with high respect. Never make assumptions on religious fatwas.";
    } else if (mode === 'image') {
       finalSystemPrompt = "You are an Image Generation Prompt assistant. The user wants to create an image. YOU MUST ONLY respond with a highly detailed, descriptive prompt suitable for Midjourney or DALL-E, followed by standard help if needed. Return ONLY the English prompt text itself on the first line.";
    }

    if (finalSystemPrompt) {
      formattedMessages.push({ role: 'system', content: finalSystemPrompt });
    }

    // append rest
    messages.forEach((m: any) => {
      let content = m.content;
      // Handle OpenRouter Multi-modal vision format
      if (m.image) {
        content = [
          { type: 'text', text: m.content },
          { type: 'image_url', image_url: { url: m.image } }
        ];
      }

      formattedMessages.push({ role: m.role, content });
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://aichat.app', 
        'X-Title': 'Mobile AI Chat', 
      },
      body: JSON.stringify({
        model: model || 'google/gemini-2.5-flash:free',
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `OpenRouter API error: ${err}` }, { status: response.status });
    }

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
