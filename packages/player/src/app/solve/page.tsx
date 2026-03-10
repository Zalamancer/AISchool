import {buildLessonIndex} from '../../lib/lessonIndex';
import {SolvePageClient} from './SolvePageClient';

export const metadata = {
  title: 'Problem Solver — MathVision',
  description: 'Paste a math problem and get step-by-step solutions',
};

export default function SolvePage() {
  const lessonIndex = buildLessonIndex();

  return <SolvePageClient lessonIndex={lessonIndex} />;
}
