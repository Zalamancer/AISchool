import type {LessonData} from '@/types/lesson';
import LessonPageClient from './LessonPageClient';

/* ------------------------------------------------------------------ */
/*  Placeholder lesson data (replaced by real content loading later)   */
/* ------------------------------------------------------------------ */
const PLACEHOLDER_LESSON: LessonData = {
  id: 'intro-to-derivatives',
  title: 'What Is a Derivative?',
  course: 'Calculus I',
  chapter: 1,
  lesson: 1,
  durationSeconds: 480,
  scene: 'derivatives-intro',
  chapters: [
    {
      id: 'ch-1',
      title: 'The Big Idea',
      startSeconds: 0,
      shortFormEligible: true,
      concepts: ['rate of change', 'slope'],
    },
    {
      id: 'ch-2',
      title: 'Secant to Tangent',
      startSeconds: 72,
      shortFormEligible: false,
      concepts: ['secant line', 'tangent line', 'limit'],
    },
    {
      id: 'ch-3',
      title: 'The Limit Definition',
      startSeconds: 165,
      shortFormEligible: true,
      concepts: ['limit definition', 'difference quotient'],
    },
    {
      id: 'ch-4',
      title: 'Worked Example: f(x) = x\u00B2',
      startSeconds: 260,
      shortFormEligible: true,
      concepts: ['power rule preview', 'polynomial derivative'],
    },
    {
      id: 'ch-5',
      title: 'Why It Matters',
      startSeconds: 380,
      shortFormEligible: false,
      concepts: ['real-world applications', 'physics', 'optimization'],
    },
  ],
  narration: [
    {start: 0, text: 'Imagine you are driving along a winding mountain road.'},
    {start: 8, text: 'Your speedometer tells you how fast you are going right now \u2014 not your average speed, but your speed at this exact instant.'},
    {start: 20, text: 'That idea \u2014 instantaneous rate of change \u2014 is the heart of the derivative.'},
    {start: 32, text: 'Let us start with something simpler: the slope of a straight line.'},
    {start: 42, text: 'Rise over run. You have seen this before.'},
    {start: 50, text: 'But what happens when the curve is not straight?'},
    {start: 58, text: 'We need a new strategy.'},
    {start: 72, text: 'Pick two points on the curve and draw a line through them. This is a secant line.'},
    {start: 84, text: 'Now slide the second point closer and closer to the first.'},
    {start: 95, text: 'The secant line begins to rotate, settling into a single direction.'},
    {start: 108, text: 'When the two points merge, the secant becomes a tangent \u2014 a line that just grazes the curve.'},
    {start: 120, text: 'The slope of that tangent line is the derivative at that point.'},
    {start: 132, text: 'But we cannot just plug in two identical points. That would give us zero over zero.'},
    {start: 145, text: 'We need limits to make this precise.'},
    {start: 165, text: 'Here is the formal definition. The derivative of f at x equals the limit as h approaches zero of f of x plus h minus f of x, all divided by h.'},
    {start: 185, text: 'That fraction is called the difference quotient.'},
    {start: 198, text: 'It measures the average rate of change over an interval of width h.'},
    {start: 210, text: 'As h shrinks to zero, the average becomes instantaneous.'},
    {start: 225, text: 'This is the most important limit in all of calculus.'},
    {start: 260, text: 'Let us try it with a concrete function: f of x equals x squared.'},
    {start: 275, text: 'f of x plus h is x plus h, all squared. Expand that: x squared plus 2xh plus h squared.'},
    {start: 295, text: 'Subtract f of x to get 2xh plus h squared. Divide by h: 2x plus h.'},
    {start: 315, text: 'Now let h go to zero. We are left with 2x.'},
    {start: 330, text: 'The derivative of x squared is 2x. At x equals 3, the slope is 6.'},
    {start: 350, text: 'That matches the tangent line we drew earlier. Beautiful.'},
    {start: 380, text: 'Derivatives are everywhere. In physics, velocity is the derivative of position.'},
    {start: 400, text: 'In economics, marginal cost is the derivative of total cost.'},
    {start: 415, text: 'In machine learning, gradients \u2014 which are just multi-variable derivatives \u2014 power every neural network.'},
    {start: 435, text: 'Understanding the derivative unlocks all of these doors.'},
    {start: 455, text: 'In the next lesson, we will learn the shortcuts \u2014 the differentiation rules \u2014 so you never have to grind through that limit again.'},
  ],
  prerequisites: [],
  next: 'differentiation-rules',
};

/* ------------------------------------------------------------------ */
/*  Server component: lesson page shell                                */
/* ------------------------------------------------------------------ */

interface LessonPageProps {
  params: Promise<{id: string}>;
}

export default async function LessonPage({params}: LessonPageProps) {
  const {id} = await params;

  // TODO: Load real lesson data by `id` from content store.
  // For now we use the placeholder regardless of `id`.
  const lesson: LessonData = {...PLACEHOLDER_LESSON, id};

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0D0D1A',
        color: '#E8E8F0',
        fontFamily: 'Geist, sans-serif',
      }}
    >
      <LessonPageClient lesson={lesson} />
    </main>
  );
}
