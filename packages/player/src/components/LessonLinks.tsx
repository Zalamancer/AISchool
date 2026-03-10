'use client';

interface LessonIndexEntry {
  lessonId: string;
  title: string;
  courseId: string;
  courseTitle: string;
  concepts: string[];
  url: string;
}

function findRelevantLessons(
  solutionConcepts: string[],
  lessonIndex: LessonIndexEntry[],
): Array<LessonIndexEntry & {matchCount: number}> {
  const normalize = (s: string) => s.toLowerCase().replace(/-/g, ' ');
  const queryConcepts = solutionConcepts.map(normalize);

  const scored = lessonIndex.map((lesson) => {
    const lessonConcepts = lesson.concepts.map(normalize);
    let matchCount = 0;
    for (const qc of queryConcepts) {
      for (const lc of lessonConcepts) {
        if (lc.includes(qc) || qc.includes(lc)) {
          matchCount++;
          break;
        }
      }
    }
    return {...lesson, matchCount};
  });

  return scored
    .filter((l) => l.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 5);
}

export function LessonLinks({
  concepts,
  lessonIndex,
}: {
  concepts: string[];
  lessonIndex: LessonIndexEntry[];
}) {
  if (!concepts.length || !lessonIndex.length) return null;

  const relevant = findRelevantLessons(concepts, lessonIndex);
  if (!relevant.length) return null;

  return (
    <div style={{marginTop: 24}}>
      <h3 style={{fontSize: 16, fontWeight: 600, color: '#8A8AA0', marginBottom: 12}}>
        Related Animated Lessons
      </h3>
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        {relevant.map((lesson) => (
          <a
            key={lesson.lessonId}
            href={lesson.url}
            style={{
              display: 'block',
              background: '#141428',
              borderRadius: 10,
              padding: '12px 16px',
              textDecoration: 'none',
              border: '1px solid #252550',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#FF6B4A')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#252550')}
          >
            <div style={{fontSize: 15, fontWeight: 500, color: '#E8E8F0'}}>
              {lesson.title}
            </div>
            <div style={{fontSize: 13, color: '#8A8AA0', marginTop: 4}}>
              {lesson.courseTitle} &middot; {lesson.matchCount} matching{' '}
              {lesson.matchCount === 1 ? 'concept' : 'concepts'}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
