import type {
  AnimationTimeline,
  AnimationElement,
  AnimationStage,
  CinematicTextElement,
  EquationSequenceElement,
  EquationStep,
  StageElement,
} from '../../types/animation';
import {colors} from '../animTheme';

function dot(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0);
}

function norm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

function fmtSqrt(n: number): string {
  const perfect = Math.round(Math.sqrt(n));
  if (perfect * perfect === n) return `${perfect}`;
  return `\\sqrt{${n}}`;
}

function fmtVec(v: number[]): string {
  return `(${v.join(', ')})`;
}

// --- ID generators ---
let textId = 0;
let eqSeqId = 0;

function makeText(
  text: string,
  position: [number, number],
  style: 'heading' | 'body' | 'accent' | 'definition',
  opts?: {color?: string; fontSize?: number; maxWidthPx?: number; anchor?: 'center' | 'left' | 'right'},
): CinematicTextElement {
  return {id: `ctext-${textId++}`, type: 'cinematic-text', text, position, style, panel: true, ...opts};
}

function makeEqSeq(
  steps: EquationStep[],
  position: [number, number],
  opts?: {fontSize?: number; color?: string},
): EquationSequenceElement {
  return {id: `eqseq-${eqSeqId++}`, type: 'equation-sequence', steps, position, panel: true, revealMode: 'typewriter', ...opts};
}

const PANEL_TYPES = new Set(['cinematic-text', 'equation-sequence']);

/** Add a stage with cinematic elements. Auto-detects showGraph. */
function stage(
  elements: AnimationElement[],
  stages: AnimationStage[],
  opts: {
    title: string;
    voice: string; // conversational narration for TTS
    durationMs: number;
    newElements?: AnimationElement[]; // elements to register
    stageElements: StageElement[];
    showGraph?: boolean; // override auto-detection
  },
) {
  if (opts.newElements) {
    for (const el of opts.newElements) elements.push(el);
  }

  // Auto-detect: show graph when stage references geometric elements or highlights
  const hasGeometric =
    opts.showGraph ??
    opts.stageElements.some((se) => {
      if (se.highlight) return true;
      const el = elements.find((e) => e.id === se.elementId);
      return el != null && !PANEL_TYPES.has(el.type);
    });

  stages.push({
    title: opts.title,
    narration: opts.voice,
    narrationPlainText: opts.voice,
    durationMs: opts.durationMs,
    elements: opts.stageElements,
    showGraph: hasGeometric,
  });
}

/**
 * Build a cinematic 3Blue1Brown-style animation for a multi-part vector problem.
 * Each stage is ONE focused idea. Voice explains independently from on-screen text.
 */
export function buildFullVectorAnimation(
  u: number[],
  v: number[],
  uLabel: string,
  vLabel: string,
  problem: string,
): AnimationTimeline {
  textId = 0;
  eqSeqId = 0;
  const elements: AnimationElement[] = [];
  const stages: AnimationStage[] = [];

  // ---- Math computations ----
  const d = dot(u, v);
  const uSumSq = u.reduce((s, x) => s + x * x, 0);
  const vSumSq = v.reduce((s, x) => s + x * x, 0);
  const uNorm = norm(u);
  const vNorm = norm(v);
  const cosTheta = d / (uNorm * vNorm);
  const thetaDeg = (Math.acos(cosTheta) * 180) / Math.PI;
  const product = uSumSq * vSumSq;
  const values = u.map((x, i) => x * v[i]);

  const u2 = [u[0], u[1]];
  const v2 = [v[0], v[1]];
  const is3D = u.length > 2 || v.length > 2;

  const maxComp = Math.max(...u2.map(Math.abs), ...v2.map(Math.abs));
  const gridRange = Math.max(Math.ceil(maxComp) + 1, 5);

  // Perpendicular / parallel test
  const ratios = u.map((x, i) => (v[i] !== 0 ? x / v[i] : null));
  const validRatios = ratios.filter((r): r is number => r !== null);
  const isParallel = validRatios.length > 0 && validRatios.every((r) => Math.abs(r - validRatios[0]) < 1e-10);
  const isPerp = Math.abs(d) < 1e-10;

  // ---- Geometric elements ----
  elements.push({
    id: 'grid', type: 'grid', gridScale: 60, gridRange,
    gridColor: colors.grid, axisColor: colors.axis,
  });
  elements.push({
    id: 'vec-u', type: 'vector', from: [0, 0],
    to: [u2[0], u2[1]] as [number, number],
    color: colors.geoPrimary, label: uLabel, width: 2.5,
  });
  elements.push({
    id: 'vec-v', type: 'vector', from: [0, 0],
    to: [v2[0], v2[1]] as [number, number],
    color: colors.geoSecondary, label: vLabel, width: 2.5,
  });

  // Angle arc
  const angleU = Math.atan2(u2[1], u2[0]);
  const angleV = Math.atan2(v2[1], v2[0]);
  let startA = angleU;
  let endA = angleV;
  if (endA < startA) [startA, endA] = [endA, startA];
  if (endA - startA > Math.PI) {
    startA += 2 * Math.PI;
    [startA, endA] = [endA, startA];
  }
  elements.push({
    id: 'angle-arc', type: 'angle-arc', center: [0, 0],
    startAngle: startA, endAngle: endA, radius: 1.2,
    color: colors.result, label: `${thetaDeg.toFixed(1)}\u00B0`,
  });

  // Unit vector
  const uHat2: [number, number] = [u2[0] / uNorm, u2[1] / uNorm];
  elements.push({
    id: 'vec-uhat', type: 'vector', from: [0, 0], to: uHat2,
    color: colors.eigen2, label: `${uLabel}\u0302`, width: 2,
  });

  // Parallel vectors (if applicable)
  const parallelMatch = problem.toLowerCase().match(/parallel\s+to\s+(\w).*?length\s+(\d+)/i);
  let hasParallel = false;
  let targetLen = 0;
  let targetName = '';
  let targetVec: number[] = [];
  let targetVec2: number[] = [];
  let tSumSq = 0;

  if (parallelMatch) {
    hasParallel = true;
    targetLen = parseInt(parallelMatch[2], 10);
    targetVec = parallelMatch[1] === vLabel.toLowerCase() ? v : u;
    targetVec2 = parallelMatch[1] === vLabel.toLowerCase() ? v2 : u2;
    targetName = parallelMatch[1] === vLabel.toLowerCase() ? vLabel : uLabel;
    const tNorm = norm(targetVec);
    tSumSq = targetVec.reduce((s, x) => s + x * x, 0);
    const scale1 = targetLen / tNorm;
    const scale2 = -targetLen / tNorm;

    elements.push({
      id: 'vec-w1', type: 'vector', from: [0, 0],
      to: [targetVec2[0] * scale1, targetVec2[1] * scale1] as [number, number],
      color: colors.eigen1, label: 'w\u2081', width: 2,
    });
    elements.push({
      id: 'vec-w2', type: 'vector', from: [0, 0],
      to: [targetVec2[0] * scale2, targetVec2[1] * scale2] as [number, number],
      color: colors.eigen2, label: 'w\u2082', width: 2,
    });
  }

  // ======== CINEMATIC STAGES ========

  // --- Educational context: why this problem, how it connects, how else it appears ---
  const dim = u.length;
  const hasParallelQ = hasParallel;
  const topicList = [
    'dot products',
    'perpendicularity & parallelism',
    'vector magnitudes',
    'angles between vectors',
    'unit vectors',
    ...(hasParallelQ ? ['constructing parallel vectors of a given length'] : []),
  ];

  const txtWhy = makeText(
    'Why this problem?\n' +
    `This question tests your understanding of ${topicList.slice(0, 3).join(', ')}, ` +
    `and ${topicList.slice(3).join(', ')}. ` +
    `These are the core tools of ${dim >= 3 ? 'R\u00B3' : 'R\u00B2'} vector algebra — ` +
    'every later topic (projections, cross products, eigenvalues) builds on them.',
    [0, 0], 'heading', {maxWidthPx: 520, fontSize: 16},
  );
  stage(elements, stages, {
    title: 'Why This Problem?',
    voice: `Before we begin, let's understand why this problem matters. It tests the fundamental building blocks of vector algebra: ${topicList.join(', ')}. Every advanced topic you will encounter later, from projections to eigenvalues, depends on these basic operations.`,
    durationMs: 8000,
    newElements: [txtWhy],
    stageElements: [{elementId: txtWhy.id, enter: 'typewriter'}],
  });

  const txtConnect = makeText(
    'How it connects\n' +
    'The dot product connects to: projections, work in physics, ' +
    'correlation in statistics.\n' +
    'Magnitudes connect to: distance formulas, normalizing data, ' +
    'probability.\n' +
    'Unit vectors connect to: direction fields, basis vectors, ' +
    'coordinate transforms.',
    [0, 0], 'definition', {maxWidthPx: 520, fontSize: 14},
  );
  stage(elements, stages, {
    title: 'How It Connects',
    voice: `The dot product is not just an abstract formula — it appears in physics as work, in statistics as correlation, and in machine learning as cosine similarity. Magnitudes give you distance, and unit vectors give you pure direction. These three ideas together let you decompose any vector problem.`,
    durationMs: 8000,
    newElements: [txtConnect],
    stageElements: [{elementId: txtConnect.id, enter: 'typewriter'}],
  });

  const txtAltForms = makeText(
    'You might also see this as:\n' +
    `• "Find the angle between ${fmtVec(u)} and ${fmtVec(v)}"\n` +
    `• "Are these vectors orthogonal?"\n` +
    `• "Compute ||${uLabel}|| and the direction of ${uLabel}"\n` +
    '• "Project u onto v" (uses the same tools)\n' +
    '• "Find cos θ between two vectors"',
    [0, 0], 'body', {maxWidthPx: 520, fontSize: 14},
  );
  stage(elements, stages, {
    title: 'Other Ways This Is Asked',
    voice: `Textbooks phrase this in many ways. You might see: find the angle between two vectors, check if vectors are orthogonal, compute the magnitude and direction, or project one vector onto another. They all use the same toolkit we are about to practice.`,
    durationMs: 7000,
    newElements: [txtAltForms],
    stageElements: [{elementId: txtAltForms.id, enter: 'typewriter'}],
  });

  const dim3Note = is3D ? ' We are projecting onto two dimensions for the visual.' : '';

  // --- Grid ---
  stage(elements, stages, {
    title: 'Coordinate Space',
    voice: `Let's set up our coordinate space.${dim3Note}`,
    durationMs: 3000,
    stageElements: [{elementId: 'grid', enter: 'fade-in'}],
  });

  // --- S1: Vector u draws in ---
  const txtU = makeText(`$\\vec{${uLabel}} = ${fmtVec(u)}$`, [0, -160], 'accent', {fontSize: 18});
  stage(elements, stages, {
    title: `Introduce ${uLabel}`,
    voice: `Here is vector ${uLabel}, pointing to ${u.join(', ')}.`,
    durationMs: 3500,
    newElements: [txtU],
    stageElements: [
      {elementId: 'vec-u', enter: 'draw-in'},
      {elementId: txtU.id, enter: 'fade-in'},
    ],
  });

  // --- S2: Vector v draws in ---
  const txtV = makeText(`$\\vec{${vLabel}} = ${fmtVec(v)}$`, [0, 160], 'accent', {fontSize: 18});
  stage(elements, stages, {
    title: `Introduce ${vLabel}`,
    voice: `And vector ${vLabel}, pointing to ${v.join(', ')}. Notice the angle between them — we will find exactly what it is.`,
    durationMs: 4000,
    newElements: [txtV],
    stageElements: [
      {elementId: 'vec-v', enter: 'draw-in'},
      {elementId: txtV.id, enter: 'fade-in'},
    ],
  });

  // --- S3: Define dot product (typewriter) ---
  const defDot = makeText(
    'The dot product measures how much\ntwo vectors point in the same direction.',
    [0, 150], 'definition', {maxWidthPx: 420},
  );
  stage(elements, stages, {
    title: 'What is the Dot Product?',
    voice: `Before we compute anything, let's understand the dot product. It measures how much two vectors point in the same direction. When the result is positive, the vectors are somewhat aligned. When it is zero, they are perpendicular. And when it is negative, they point away from each other.`,
    durationMs: 8000,
    newElements: [defDot],
    stageElements: [{elementId: defDot.id, enter: 'typewriter'}],
  });

  // --- S4: Show general formula ---
  const eqDotGeneral = makeText(
    `$\\vec{${uLabel}} \\cdot \\vec{${vLabel}} = ${u.map((_, i) => `${uLabel}_${i + 1} ${vLabel}_${i + 1}`).join(' + ')}$`,
    [0, -150], 'heading', {fontSize: 18},
  );
  stage(elements, stages, {
    title: 'The Dot Product Formula',
    voice: `Here is the formula. You multiply each pair of matching components, then add the products together.`,
    durationMs: 5000,
    newElements: [eqDotGeneral],
    stageElements: [{elementId: eqDotGeneral.id, enter: 'fade-in'}],
  });

  // --- S5: Substitute values progressively ---
  const dotSteps: EquationStep[] = [];
  // Step 0: general formula
  dotSteps.push({
    tex: `\\vec{${uLabel}} \\cdot \\vec{${vLabel}} = ${u.map((_, i) => `${uLabel}_${i + 1}${vLabel}_${i + 1}`).join(' + ')}`,
    weight: 0.5,
  });
  // Steps 1..N: substitute each component pair
  for (let i = 0; i < u.length; i++) {
    const parts = u.map((x, j) => {
      if (j <= i) return `(\\textcolor{${colors.compU}}{${x}})(\\textcolor{${colors.compV}}{${v[j]}})`;
      return `${uLabel}_${j + 1}${vLabel}_${j + 1}`;
    });
    dotSteps.push({tex: `\\vec{${uLabel}} \\cdot \\vec{${vLabel}} = ${parts.join(' + ')}`});
  }
  // Final step: result
  dotSteps.push({
    tex: `\\vec{${uLabel}} \\cdot \\vec{${vLabel}} = ${values.join(' + ')} = \\textcolor{${colors.result}}{${d}}`,
    weight: 1.5,
  });

  const eqSeqDot = makeEqSeq(dotSteps, [0, -140], {fontSize: 16});
  const voiceParts = u.map((x, i) => `${x} times ${v[i]} gives ${x * v[i]}`);
  stage(elements, stages, {
    title: 'Computing the Dot Product',
    voice: `Now let's plug in the values. ${voiceParts.join('. ')}. Adding those together, the dot product is ${d}.`,
    durationMs: 8000,
    newElements: [eqSeqDot],
    stageElements: [
      {elementId: eqSeqDot.id, enter: 'fade-in'},
      {elementId: 'vec-u', highlight: {color: '#FF6B6B'}},
      {elementId: 'vec-v', highlight: {color: '#B48EF0'}},
    ],
  });

  // --- S6: Interpret dot product result ---
  const signWord = d > 0 ? 'positive' : d < 0 ? 'negative' : 'zero';
  const angleWord = d > 0 ? 'acute (less than 90 degrees)' : d < 0 ? 'obtuse (more than 90 degrees)' : 'exactly 90 degrees — perpendicular';
  const interpretText = makeText(
    d === 0 ? `Result = 0 → Perpendicular` : `Result is ${signWord} → ${d > 0 ? 'Acute angle' : 'Obtuse angle'}`,
    [0, 150], 'accent', {fontSize: 18},
  );
  stage(elements, stages, {
    title: 'Interpreting the Result',
    voice: `The dot product is ${d}, which is ${signWord}. This tells us the angle between the vectors is ${angleWord}.`,
    durationMs: 4000,
    newElements: [interpretText],
    stageElements: [{elementId: interpretText.id, enter: 'fade-in'}],
  });

  // --- S7: Define perpendicular / parallel ---
  const defPerp = makeText(
    'Perpendicular: dot product = 0\nParallel: one is a scalar multiple of the other',
    [0, 150], 'definition', {maxWidthPx: 450},
  );
  stage(elements, stages, {
    title: 'Perpendicular vs Parallel',
    voice: `Two vectors are perpendicular when their dot product is zero — they meet at a right angle. They are parallel when one is just a scaled version of the other, meaning all component ratios are equal.`,
    durationMs: 6000,
    newElements: [defPerp],
    stageElements: [{elementId: defPerp.id, enter: 'typewriter'}],
  });

  // --- S8: Test and show result ---
  let relVoice: string;
  let relResultText: string;
  if (isPerp) {
    relVoice = `The dot product is zero, so our vectors are perpendicular. They meet at exactly 90 degrees.`;
    relResultText = `Perpendicular!  ($${uLabel} \\cdot ${vLabel} = 0$)`;
  } else if (isParallel) {
    relVoice = `Each component of ${uLabel} is ${validRatios[0]} times the corresponding component of ${vLabel}. So the vectors are parallel.`;
    relResultText = `Parallel!  ($${uLabel} = ${validRatios[0]}${vLabel}$)`;
  } else {
    relVoice = `The dot product is ${d}, not zero, so they are not perpendicular. And the component ratios are not all equal, so they are not parallel either. The answer is neither.`;
    relResultText = `Neither perpendicular nor parallel`;
  }
  const txtRel = makeText(relResultText, [0, -150], 'accent', {fontSize: 18});
  stage(elements, stages, {
    title: 'Testing the Relationship',
    voice: relVoice,
    durationMs: 5000,
    newElements: [txtRel],
    stageElements: [{elementId: txtRel.id, enter: 'fade-in'}],
  });

  // --- S9: Define vector length ---
  const defLen = makeText(
    'Vector length: how far the tip is from the origin.\nSquare each component, sum them, take the square root.',
    [0, 150], 'definition', {maxWidthPx: 450},
  );
  stage(elements, stages, {
    title: 'What is Vector Length?',
    voice: `The length of a vector, also called its magnitude, tells us how far the arrow reaches from the origin. We compute it using a generalized form of the Pythagorean theorem.`,
    durationMs: 5000,
    newElements: [defLen],
    stageElements: [{elementId: defLen.id, enter: 'typewriter'}],
  });

  // --- S10: Show magnitude formula ---
  const eqLenFormula = makeText(
    `$\\|\\vec{v}\\| = \\sqrt{v_1^2 + v_2^2 + \\cdots + v_n^2}$`,
    [0, -150], 'heading', {fontSize: 18},
  );
  stage(elements, stages, {
    title: 'The Magnitude Formula',
    voice: `Here is the formula. Square each component, add them up, and take the square root. Simple but powerful.`,
    durationMs: 4000,
    newElements: [eqLenFormula],
    stageElements: [{elementId: eqLenFormula.id, enter: 'fade-in'}],
  });

  // --- S11: Compute ||u|| progressively ---
  const uNormSteps: EquationStep[] = [
    {tex: `\\|${uLabel}\\| = \\sqrt{${u.map((_, i) => `${uLabel}_${i + 1}^2`).join(' + ')}}`},
    {tex: `\\|${uLabel}\\| = \\sqrt{${u.map((x) => `(\\textcolor{${colors.compU}}{${x}})^2`).join(' + ')}}`},
    {tex: `\\|${uLabel}\\| = \\sqrt{${u.map((x) => x * x).join(' + ')}} = ${fmtSqrt(uSumSq)} \\approx \\textcolor{${colors.result}}{${uNorm.toFixed(4)}}`, weight: 1.5},
  ];
  const eqSeqNormU = makeEqSeq(uNormSteps, [0, -140], {fontSize: 16});
  stage(elements, stages, {
    title: `Computing ||${uLabel}||`,
    voice: `Let's find the length of ${uLabel}. ${u.map((x) => `${x} squared is ${x * x}`).join(', ')}. Adding those up and taking the square root gives us approximately ${uNorm.toFixed(2)}.`,
    durationMs: 6000,
    newElements: [eqSeqNormU],
    stageElements: [
      {elementId: eqSeqNormU.id, enter: 'fade-in'},
      {elementId: 'vec-u', highlight: {color: colors.geoPrimary}},
    ],
  });

  // --- S12: Compute ||v|| progressively ---
  const vNormSteps: EquationStep[] = [
    {tex: `\\|${vLabel}\\| = \\sqrt{${v.map((_, i) => `${vLabel}_${i + 1}^2`).join(' + ')}}`},
    {tex: `\\|${vLabel}\\| = \\sqrt{${v.map((x) => `(\\textcolor{${colors.compV}}{${x}})^2`).join(' + ')}}`},
    {tex: `\\|${vLabel}\\| = \\sqrt{${v.map((x) => x * x).join(' + ')}} = ${fmtSqrt(vSumSq)} \\approx \\textcolor{${colors.result}}{${vNorm.toFixed(4)}}`, weight: 1.5},
  ];
  const eqSeqNormV = makeEqSeq(vNormSteps, [0, -140], {fontSize: 16});
  stage(elements, stages, {
    title: `Computing ||${vLabel}||`,
    voice: `Now the length of ${vLabel}. ${v.map((x) => `${x} squared is ${x * x}`).join(', ')}. The magnitude is approximately ${vNorm.toFixed(2)}.`,
    durationMs: 6000,
    newElements: [eqSeqNormV],
    stageElements: [
      {elementId: eqSeqNormV.id, enter: 'fade-in'},
      {elementId: 'vec-v', highlight: {color: colors.geoSecondary}},
    ],
  });

  // --- S13: Define the angle formula ---
  const defAngle = makeText(
    'The dot product reveals the angle between vectors.',
    [0, 150], 'definition', {maxWidthPx: 400},
  );
  stage(elements, stages, {
    title: 'Finding the Angle',
    voice: `One of the most powerful formulas in linear algebra connects the dot product to the angle. Cosine of the angle equals the dot product divided by the product of the magnitudes.`,
    durationMs: 5000,
    newElements: [defAngle],
    stageElements: [{elementId: defAngle.id, enter: 'typewriter'}],
  });

  // --- S14: Show angle formula ---
  const eqAngleFormula = makeText(
    `$\\cos\\theta = \\frac{\\vec{${uLabel}} \\cdot \\vec{${vLabel}}}{\\|${uLabel}\\| \\cdot \\|${vLabel}\\|}$`,
    [0, -150], 'heading', {fontSize: 20},
  );
  stage(elements, stages, {
    title: 'The Angle Formula',
    voice: `Here it is. Cosine theta equals the dot product over the product of the lengths.`,
    durationMs: 4000,
    newElements: [eqAngleFormula],
    stageElements: [{elementId: eqAngleFormula.id, enter: 'fade-in'}],
  });

  // --- S15: Compute angle progressively ---
  const angleSteps: EquationStep[] = [
    {tex: `\\cos\\theta = \\frac{${uLabel} \\cdot ${vLabel}}{\\|${uLabel}\\| \\cdot \\|${vLabel}\\|}`},
    {tex: `\\cos\\theta = \\frac{\\textcolor{${colors.result}}{${d}}}{${fmtSqrt(uSumSq)} \\cdot ${fmtSqrt(vSumSq)}}`},
    {tex: `\\cos\\theta = \\frac{${d}}{${fmtSqrt(product)}} \\approx ${cosTheta.toFixed(4)}`},
    {tex: `\\theta \\approx \\textcolor{${colors.accent}}{${thetaDeg.toFixed(1)}°}`, weight: 2},
  ];
  const eqSeqAngle = makeEqSeq(angleSteps, [0, -140], {fontSize: 16});
  stage(elements, stages, {
    title: 'Computing the Angle',
    voice: `Plugging in our values: ${d} divided by the square root of ${product}, which is approximately ${cosTheta.toFixed(4)}. Taking the inverse cosine, the angle is approximately ${thetaDeg.toFixed(1)} degrees.`,
    durationMs: 8000,
    newElements: [eqSeqAngle],
    stageElements: [
      {elementId: eqSeqAngle.id, enter: 'fade-in'},
      {elementId: 'angle-arc', enter: 'draw-in'},
    ],
  });

  // --- S16: Define unit vector ---
  const defUnit = makeText(
    'A unit vector: same direction, length exactly 1.\nDivide each component by the magnitude.',
    [0, 150], 'definition', {maxWidthPx: 420},
  );
  stage(elements, stages, {
    title: 'What is a Unit Vector?',
    voice: `A unit vector points in the same direction as the original but has length exactly one. To find it, divide each component by the vector's magnitude.`,
    durationMs: 5000,
    newElements: [defUnit],
    stageElements: [{elementId: defUnit.id, enter: 'typewriter'}],
  });

  // --- S17: Show unit vector formula ---
  const eqUnitFormula = makeText(
    `$\\hat{${uLabel}} = \\frac{\\vec{${uLabel}}}{\\|${uLabel}\\|}$`,
    [0, -150], 'heading', {fontSize: 20},
  );
  stage(elements, stages, {
    title: 'The Unit Vector Formula',
    voice: `${uLabel} hat equals ${uLabel} divided by its magnitude.`,
    durationMs: 3500,
    newElements: [eqUnitFormula],
    stageElements: [{elementId: eqUnitFormula.id, enter: 'fade-in'}],
  });

  // --- S18: Compute unit vector ---
  const unitSteps: EquationStep[] = [
    {tex: `\\hat{${uLabel}} = \\frac{1}{\\|${uLabel}\\|} ${fmtVec(u)}`},
    {tex: `\\hat{${uLabel}} = \\frac{1}{${fmtSqrt(uSumSq)}} ${fmtVec(u)}`},
  ];
  const eqSeqUnit = makeEqSeq(unitSteps, [0, -140], {fontSize: 16});
  const txtUnitNote = makeText('Green arrow: same direction, length 1', [0, 160], 'body', {fontSize: 14});
  stage(elements, stages, {
    title: `Computing ${uLabel}\u0302`,
    voice: `Dividing each component of ${uLabel} by ${fmtSqrt(uSumSq)}, we get the unit vector. The green arrow shows it — same direction, but length exactly one.`,
    durationMs: 6000,
    newElements: [eqSeqUnit, txtUnitNote],
    stageElements: [
      {elementId: 'vec-uhat', enter: 'draw-in'},
      {elementId: eqSeqUnit.id, enter: 'fade-in'},
      {elementId: txtUnitNote.id, enter: 'fade-in'},
    ],
  });

  // --- Parallel vectors (if applicable) ---
  if (hasParallel) {
    // S19: Define parallel scaling
    const defPar = makeText(
      `To get a vector parallel to $${targetName}$ with a specific length:\nfind the unit vector, then scale it.`,
      [0, 150], 'definition', {maxWidthPx: 450},
    );
    stage(elements, stages, {
      title: 'Parallel Vectors of Given Length',
      voice: `To create a vector parallel to ${targetName} with length ${targetLen}, we start with the unit vector in that direction and scale it. Since there are two directions, same and opposite, we get two answers.`,
      durationMs: 6000,
      newElements: [defPar],
      stageElements: [{elementId: defPar.id, enter: 'typewriter'}],
    });

    // S20: Show parallel formula
    const eqParFormula = makeText(
      `$\\vec{w} = \\pm \\frac{${targetLen}}{\\|${targetName}\\|} \\cdot \\vec{${targetName}}$`,
      [0, -150], 'heading', {fontSize: 18},
    );
    stage(elements, stages, {
      title: 'The Parallel Vector Formula',
      voice: `Here is the formula: w equals plus or minus ${targetLen} over the magnitude of ${targetName}, times ${targetName}.`,
      durationMs: 4000,
      newElements: [eqParFormula],
      stageElements: [{elementId: eqParFormula.id, enter: 'fade-in'}],
    });

    // S21: Compute and draw w1, w2
    const parSteps: EquationStep[] = [
      {tex: `\\vec{w}_{1,2} = \\pm \\frac{${targetLen}}{\\|${targetName}\\|} ${fmtVec(targetVec)}`},
      {tex: `\\vec{w}_{1,2} = \\pm \\frac{${targetLen}}{${fmtSqrt(tSumSq)}} ${fmtVec(targetVec)}`},
    ];
    const eqSeqPar = makeEqSeq(parSteps, [0, -140], {fontSize: 16});
    const txtParNote = makeText(`Both parallel to $${targetName}$, each with length ${targetLen}`, [0, 160], 'body', {fontSize: 14});
    stage(elements, stages, {
      title: 'Computing w\u2081 and w\u2082',
      voice: `Plugging in the values, we get two vectors. The pink arrow is w one, pointing in the same direction as ${targetName}. The green arrow is w two, pointing the opposite way. Both have length ${targetLen}.`,
      durationMs: 7000,
      newElements: [eqSeqPar, txtParNote],
      stageElements: [
        {elementId: 'vec-w1', enter: 'draw-in'},
        {elementId: 'vec-w2', enter: 'draw-in'},
        {elementId: eqSeqPar.id, enter: 'fade-in'},
        {elementId: txtParNote.id, enter: 'fade-in'},
      ],
    });
  }

  return {
    elements,
    stages,
    viewBox: {xMin: -gridRange - 0.5, xMax: gridRange + 0.5, yMin: -gridRange - 0.5, yMax: gridRange + 0.5},
  };
}
