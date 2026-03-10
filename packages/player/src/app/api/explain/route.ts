import { NextRequest, NextResponse } from 'next/server';

interface ExplainRequestBody {
  question: string;
  context: {
    lessonTitle: string;
    chapterTitle: string;
    concepts: string[];
    lastNarration: string;
  };
}

/**
 * POST /api/explain
 *
 * Accepts a student question plus lesson context, constructs a tutor-oriented
 * system prompt, and forwards the request to the Anthropic Claude API.
 * Returns { answer: string }.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured' },
      { status: 500 },
    );
  }

  let body: ExplainRequestBody;

  try {
    body = (await request.json()) as ExplainRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 },
    );
  }

  const { question, context } = body;

  if (!question || typeof question !== 'string') {
    return NextResponse.json(
      { error: 'Missing or invalid "question" field' },
      { status: 400 },
    );
  }

  if (!context) {
    return NextResponse.json(
      { error: 'Missing "context" field' },
      { status: 400 },
    );
  }

  const { lessonTitle, chapterTitle, concepts, lastNarration } = context;

  // Build system prompt per spec.
  const systemPrompt = [
    `You are a math tutor.`,
    `The student is watching a lesson on '${lessonTitle}'.`,
    `They are currently in the section '${chapterTitle}' which covers: ${(concepts ?? []).join(', ')}.`,
    `The narration just said: '${lastNarration}'.`,
    `Answer clearly and concisely. Keep your answer under 30 seconds of speech.`,
  ].join(' ');

  try {
    const anthropicRes = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: question,
            },
          ],
        }),
      },
    );

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error('[/api/explain] Anthropic API error:', anthropicRes.status, errBody);
      return NextResponse.json(
        { error: 'Failed to get a response from the AI tutor' },
        { status: 502 },
      );
    }

    const data = (await anthropicRes.json()) as {
      content: Array<{ type: string; text?: string }>;
    };

    // Extract the text from the first text block.
    const textBlock = data.content?.find((block) => block.type === 'text');
    const answer = textBlock?.text ?? '';

    return NextResponse.json({ answer });
  } catch (err) {
    console.error('[/api/explain] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error while contacting AI tutor' },
      { status: 500 },
    );
  }
}
