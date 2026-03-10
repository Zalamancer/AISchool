import {NextRequest, NextResponse} from 'next/server';
import type {AnimationTimeline} from '../../../types/animation';
import {buildFullVectorAnimation} from '../../../lib/animationBuilders/vectorBuilder';

interface SolveRequestBody {
  problem: string;
  imageBase64?: string;
  imageMediaType?: string;
}

interface SolutionResult {
  steps: Array<{title: string; content: string}>;
  concepts: string[];
  animation?: AnimationTimeline;
}

// ---------------------------------------------------------------------------
// Built-in vector solver — works without an API key
// ---------------------------------------------------------------------------

function parseVector(s: string): number[] | null {
  // Matches (a, b, c) or (-a, b, -c) with any amount of whitespace
  const m = s.match(/\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((x) => parseFloat(x.trim()));
  if (parts.some(isNaN)) return null;
  return parts;
}

function extractTwoVectors(text: string): {u: number[]; v: number[]; uLabel: string; vLabel: string} | null {
  // Try "let u = (...) and v = (...)" pattern
  const labeled = text.match(
    /(?:let\s+)?(\w)\s*=\s*\(([^)]+)\)\s*(?:and|,)\s*(?:let\s+)?(\w)\s*=\s*\(([^)]+)\)/i,
  );
  if (labeled) {
    const u = labeled[2].split(',').map((x) => parseFloat(x.trim()));
    const v = labeled[4].split(',').map((x) => parseFloat(x.trim()));
    if (!u.some(isNaN) && !v.some(isNaN)) {
      return {u, v, uLabel: labeled[1], vLabel: labeled[3]};
    }
  }
  // Fallback: find first two parenthesized vectors
  const all = [...text.matchAll(/\(([^)]+)\)/g)];
  const vecs = all
    .map((m) => m[1].split(',').map((x) => parseFloat(x.trim())))
    .filter((arr) => arr.length >= 2 && !arr.some(isNaN));
  if (vecs.length >= 2) {
    return {u: vecs[0], v: vecs[1], uLabel: 'u', vLabel: 'v'};
  }
  return null;
}

function dot(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0);
}

function norm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

function fmtVec(v: number[]): string {
  return `(${v.join(', ')})`;
}

function fmtSqrt(n: number): string {
  const perfect = Math.round(Math.sqrt(n));
  if (perfect * perfect === n) return `${perfect}`;
  return `\\sqrt{${n}}`;
}

function solveProblemLocally(problem: string): SolutionResult | null {
  const lower = problem.toLowerCase();
  const vecs = extractTwoVectors(problem);

  // Detect multi-part problems with (a), (b), etc.
  const isMultiPart = /\(a\)/i.test(problem);

  // All two-vector problems go through the full solver (includes animation)
  if (vecs) {
    return solveFullVectorProblem(problem, vecs);
  }

  // Single vector problems
  const singleVec = parseVector(problem);
  if (singleVec) {
    if (lower.includes('unit vector')) {
      const n = norm(singleVec);
      const sumSq = singleVec.reduce((s, x) => s + x * x, 0);
      return {
        steps: [
          {
            title: 'Step 1: Compute the length',
            content: `$$\\|v\\| = \\sqrt{${singleVec.map((x) => `(${x})^2`).join(' + ')}} = \\sqrt{${sumSq}} = ${fmtSqrt(sumSq)}$$`,
          },
          {
            title: 'Step 2: Divide by the length',
            content: `$$\\hat{v} = \\frac{1}{${fmtSqrt(sumSq)}} ${fmtVec(singleVec)} = \\left(${singleVec.map((x) => `\\frac{${x}}{${fmtSqrt(sumSq)}}`).join(',\\; ')}\\right)$$`,
          },
        ],
        concepts: ['unit-vector', 'vector-norm'],
      };
    }
    if (lower.includes('length') || lower.includes('norm')) {
      const sumSq = singleVec.reduce((s, x) => s + x * x, 0);
      return {
        steps: [
          {
            title: 'Step 1: Compute the length',
            content: `$$\\|v\\| = \\sqrt{${singleVec.map((x) => `(${x})^2`).join(' + ')}} = \\sqrt{${sumSq}} = ${fmtSqrt(sumSq)}$$`,
          },
        ],
        concepts: ['vector-norm'],
      };
    }
  }

  return null;
}

function solveDotProduct(vecs: {u: number[]; v: number[]; uLabel: string; vLabel: string}): SolutionResult {
  const {u, v, uLabel, vLabel} = vecs;
  const d = dot(u, v);
  const terms = u.map((x, i) => `(${x})(${v[i]})`).join(' + ');
  const values = u.map((x, i) => x * v[i]);
  const angleInfo = d > 0 ? 'acute (less than $90°$)' : d < 0 ? 'obtuse (greater than $90°$)' : 'exactly $90°$ (perpendicular)';

  return {
    steps: [
      {
        title: 'Step 1: Dot Product',
        content: `$$${uLabel} \\cdot ${vLabel} = ${terms} = ${values.join(' + ')} = ${d}$$\n\nSince $${uLabel} \\cdot ${vLabel} = ${d} ${d > 0 ? '> 0' : d < 0 ? '< 0' : '= 0'}$, the angle between $${uLabel}$ and $${vLabel}$ is ${angleInfo}.`,
      },
    ],
    concepts: ['dot-product', 'vector-angle'],
  };
}

function solveNorms(vecs: {u: number[]; v: number[]; uLabel: string; vLabel: string}): SolutionResult {
  const {u, v, uLabel, vLabel} = vecs;
  const uSumSq = u.reduce((s, x) => s + x * x, 0);
  const vSumSq = v.reduce((s, x) => s + x * x, 0);
  return {
    steps: [
      {
        title: `Step 1: Length of ${uLabel}`,
        content: `$$\\|${uLabel}\\| = \\sqrt{${u.map((x) => `(${x})^2`).join(' + ')}} = \\sqrt{${u.map((x) => x * x).join(' + ')}} = \\sqrt{${uSumSq}} = ${fmtSqrt(uSumSq)}$$`,
      },
      {
        title: `Step 2: Length of ${vLabel}`,
        content: `$$\\|${vLabel}\\| = \\sqrt{${v.map((x) => `(${x})^2`).join(' + ')}} = \\sqrt{${v.map((x) => x * x).join(' + ')}} = \\sqrt{${vSumSq}} = ${fmtSqrt(vSumSq)}$$`,
      },
    ],
    concepts: ['vector-norm'],
  };
}

function solveUnitVector(vecs: {u: number[]; v: number[]; uLabel: string; vLabel: string}): SolutionResult {
  const {u, uLabel} = vecs;
  const sumSq = u.reduce((s, x) => s + x * x, 0);
  return {
    steps: [
      {
        title: 'Step 1: Compute the length',
        content: `$$\\|${uLabel}\\| = \\sqrt{${u.map((x) => `(${x})^2`).join(' + ')}} = \\sqrt{${sumSq}} = ${fmtSqrt(sumSq)}$$`,
      },
      {
        title: 'Step 2: Unit vector',
        content: `$$\\hat{${uLabel}} = \\frac{${uLabel}}{\\|${uLabel}\\|} = \\frac{1}{${fmtSqrt(sumSq)}} ${fmtVec(u)} = \\left(${u.map((x) => `\\frac{${x}}{${fmtSqrt(sumSq)}}`).join(',\\; ')}\\right)$$`,
      },
    ],
    concepts: ['unit-vector', 'vector-norm'],
  };
}

function solveAngle(vecs: {u: number[]; v: number[]; uLabel: string; vLabel: string}): SolutionResult {
  const {u, v, uLabel, vLabel} = vecs;
  const d = dot(u, v);
  const uN = norm(u);
  const vN = norm(v);
  const cosTheta = d / (uN * vN);
  const uSumSq = u.reduce((s, x) => s + x * x, 0);
  const vSumSq = v.reduce((s, x) => s + x * x, 0);
  const product = uSumSq * vSumSq;
  return {
    steps: [
      {
        title: 'Step 1: Compute cos theta',
        content: `$$\\cos\\theta = \\frac{${uLabel} \\cdot ${vLabel}}{\\|${uLabel}\\|\\;\\|${vLabel}\\|} = \\frac{${d}}{${fmtSqrt(uSumSq)} \\cdot ${fmtSqrt(vSumSq)}} = \\frac{${d}}{${fmtSqrt(product)}}$$\n\nNumerically, $\\cos\\theta \\approx ${cosTheta.toFixed(4)}$, so $\\theta \\approx ${((Math.acos(cosTheta) * 180) / Math.PI).toFixed(1)}°$.`,
      },
    ],
    concepts: ['dot-product', 'vector-angle'],
  };
}

function solveFullVectorProblem(
  problem: string,
  vecs: {u: number[]; v: number[]; uLabel: string; vLabel: string},
): SolutionResult {
  const {u, v, uLabel, vLabel} = vecs;
  const d = dot(u, v);
  const uSumSq = u.reduce((s, x) => s + x * x, 0);
  const vSumSq = v.reduce((s, x) => s + x * x, 0);
  const product = uSumSq * vSumSq;
  const cosTheta = d / Math.sqrt(product);
  const lower = problem.toLowerCase();

  const terms = u.map((x, i) => `(${x})(${v[i]})`).join(' + ');
  const values = u.map((x, i) => x * v[i]);
  const angleInfo = d > 0 ? 'acute (less than $90°$)' : d < 0 ? 'obtuse (greater than $90°$)' : 'exactly $90°$ (perpendicular)';

  // Check parallelism
  const ratios = u.map((x, i) => (v[i] !== 0 ? x / v[i] : null));
  const validRatios = ratios.filter((r): r is number => r !== null);
  const isParallel = validRatios.length > 0 && validRatios.every((r) => Math.abs(r - validRatios[0]) < 1e-10);
  const isPerp = Math.abs(d) < 1e-10;

  let relationship: string;
  if (isPerp) {
    relationship = `Since $${uLabel} \\cdot ${vLabel} = 0$, the vectors are perpendicular.`;
  } else if (isParallel) {
    relationship = `Since $${uLabel} = ${validRatios[0]} \\cdot ${vLabel}$, the vectors are parallel.`;
  } else {
    relationship = `The vectors are neither perpendicular nor parallel.\n\nNot perpendicular: $${uLabel} \\cdot ${vLabel} = ${d} \\neq 0$\n\nNot parallel: the component ratios $\\frac{${u[0]}}{${v[0]}} = ${Number.isInteger(u[0] / v[0]) ? u[0] / v[0] : (u[0] / v[0]).toFixed(4)}$ and $\\frac{${u[1]}}{${v[1]}} = ${Number.isInteger(u[1] / v[1]) ? u[1] / v[1] : (u[1] / v[1]).toFixed(4)}$ are not equal.`;
  }

  const steps: Array<{title: string; content: string}> = [
    {
      title: '(a) Dot Product',
      content: `$$${uLabel} \\cdot ${vLabel} = ${terms} = ${values.join(' + ')} = ${d}$$\n\nSince $${uLabel} \\cdot ${vLabel} = ${d} ${d > 0 ? '> 0' : d < 0 ? '< 0' : '= 0'}$, the angle between $${uLabel}$ and $${vLabel}$ is ${angleInfo}.`,
    },
    {
      title: '(b) Perpendicular, Parallel, or Neither?',
      content: relationship,
    },
    {
      title: '(c) Lengths',
      content: `$$\\|${uLabel}\\| = \\sqrt{${u.map((x) => `(${x})^2`).join(' + ')}} = \\sqrt{${u.map((x) => x * x).join(' + ')}} = \\sqrt{${uSumSq}}$$\n\n$$\\|${vLabel}\\| = \\sqrt{${v.map((x) => `(${x})^2`).join(' + ')}} = \\sqrt{${v.map((x) => x * x).join(' + ')}} = \\sqrt{${vSumSq}}$$`,
    },
    {
      title: '(d) cos theta',
      content: `$$\\cos\\theta = \\frac{${uLabel} \\cdot ${vLabel}}{\\|${uLabel}\\|\\;\\|${vLabel}\\|} = \\frac{${d}}{\\sqrt{${uSumSq}} \\cdot \\sqrt{${vSumSq}}} = \\frac{${d}}{\\sqrt{${product}}}$$\n\nNumerically, $\\cos\\theta \\approx ${cosTheta.toFixed(4)}$, giving $\\theta \\approx ${((Math.acos(cosTheta) * 180) / Math.PI).toFixed(1)}°$.`,
    },
    {
      title: '(e) Unit Vector',
      content: `$$\\hat{${uLabel}} = \\frac{${uLabel}}{\\|${uLabel}\\|} = \\frac{1}{\\sqrt{${uSumSq}}} ${fmtVec(u)} = \\left(${u.map((x) => `\\frac{${x}}{\\sqrt{${uSumSq}}}`).join(',\\; ')}\\right)$$`,
    },
  ];

  // Part (f): parallel vectors with a given length
  const parallelMatch = lower.match(/parallel\s+to\s+(\w).*?length\s+(\d+)/i);
  if (parallelMatch) {
    const targetLabel = parallelMatch[1];
    const targetLen = parseInt(parallelMatch[2], 10);
    const targetVec = targetLabel === vLabel.toLowerCase() ? v : u;
    const targetName = targetLabel === vLabel.toLowerCase() ? vLabel : uLabel;
    const tSumSq = targetVec.reduce((s, x) => s + x * x, 0);
    steps.push({
      title: `(f) Two Vectors Parallel to ${targetName} with Length ${targetLen}`,
      content: `The unit vector in the direction of $${targetName}$ is:\n$$\\hat{${targetName}} = \\frac{1}{\\sqrt{${tSumSq}}} ${fmtVec(targetVec)}$$\n\nThe two vectors parallel to $${targetName}$ with length $${targetLen}$ are $\\pm ${targetLen}\\hat{${targetName}}$:\n\n$$w_1 = \\frac{${targetLen}}{\\sqrt{${tSumSq}}} ${fmtVec(targetVec)} = \\left(${targetVec.map((x) => `\\frac{${x * targetLen}}{\\sqrt{${tSumSq}}}`).join(',\\; ')}\\right)$$\n\n$$w_2 = \\frac{-${targetLen}}{\\sqrt{${tSumSq}}} ${fmtVec(targetVec)} = \\left(${targetVec.map((x) => `\\frac{${x * -targetLen}}{\\sqrt{${tSumSq}}}`).join(',\\; ')}\\right)$$`,
    });
  }

  const concepts = ['dot-product', 'vector-norm', 'unit-vector', 'vector-angle'];
  if (parallelMatch) concepts.push('parallel-vectors');

  const animation = buildFullVectorAnimation(u, v, uLabel, vLabel, problem);

  return {steps, concepts, animation};
}

// ---------------------------------------------------------------------------
// API Route
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: SolveRequestBody;
  try {
    body = (await request.json()) as SolveRequestBody;
  } catch {
    return NextResponse.json({error: 'Invalid JSON in request body'}, {status: 400});
  }

  const {problem, imageBase64, imageMediaType} = body;

  if (!problem && !imageBase64) {
    return NextResponse.json(
      {error: 'Provide a problem description or an image'},
      {status: 400},
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // --- No API key: try the built-in solver ---
  if (!apiKey) {
    if (imageBase64) {
      return NextResponse.json(
        {error: 'Image-based solving requires an ANTHROPIC_API_KEY. Please type your problem as text instead.'},
        {status: 400},
      );
    }

    const localResult = solveProblemLocally(problem);
    if (localResult) {
      return NextResponse.json(localResult);
    }

    return NextResponse.json(
      {error: 'The built-in solver could not handle this problem. Add an ANTHROPIC_API_KEY for AI-powered solving.'},
      {status: 400},
    );
  }

  // --- API key available: use Claude ---
  const systemPrompt = `You are a math tutor solving problems step by step.
Return your answer as valid JSON with this exact structure:
{
  "steps": [
    { "title": "Step 1: [brief label]", "content": "Explanation with LaTeX using $...$ for inline and $$...$$ for display math." }
  ],
  "concepts": ["concept-1", "concept-2"]
}
The "concepts" array should contain hyphenated lowercase keywords describing the mathematical topics involved (e.g., "eigenvalue", "dot-product", "unit-vector", "linear-transformation", "epsilon-delta").
Use LaTeX notation for all mathematical expressions. Be thorough but clear. Show all work.
Return ONLY the JSON object, no markdown code fences.`;

  const userContent: Array<Record<string, unknown>> = [];

  if (imageBase64 && imageMediaType) {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: imageMediaType,
        data: imageBase64,
      },
    });
  }

  userContent.push({
    type: 'text',
    text: problem || 'Solve the math problem shown in the image.',
  });

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{role: 'user', content: userContent}],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error('[/api/solve] Anthropic API error:', anthropicRes.status, errBody);
      return NextResponse.json(
        {error: 'Failed to get a response from the AI tutor'},
        {status: 502},
      );
    }

    const data = (await anthropicRes.json()) as {
      content: Array<{type: string; text?: string}>;
    };

    const textBlock = data.content?.find((block) => block.type === 'text');
    const rawText = textBlock?.text ?? '';

    let parsed: {steps: Array<{title: string; content: string}>; concepts: string[]};
    try {
      const cleaned = rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        steps: [{title: 'Solution', content: rawText}],
        concepts: [],
      };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[/api/solve] Unexpected error:', err);
    return NextResponse.json(
      {error: 'Internal server error while solving problem'},
      {status: 500},
    );
  }
}
