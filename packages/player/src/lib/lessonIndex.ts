import fs from 'fs';
import path from 'path';

export interface LessonIndexEntry {
  lessonId: string;
  title: string;
  courseId: string;
  courseTitle: string;
  concepts: string[];
  url: string;
}

export function buildLessonIndex(): LessonIndexEntry[] {
  const contentDir = path.resolve(process.cwd(), '../../content/courses');
  const entries: LessonIndexEntry[] = [];

  let courseDirs: fs.Dirent[];
  try {
    courseDirs = fs.readdirSync(contentDir, {withFileTypes: true}).filter(d => d.isDirectory());
  } catch {
    return entries;
  }

  for (const courseDir of courseDirs) {
    const coursePath = path.join(contentDir, courseDir.name);
    const courseJsonPath = path.join(coursePath, 'course.json');
    if (!fs.existsSync(courseJsonPath)) continue;

    const courseData = JSON.parse(fs.readFileSync(courseJsonPath, 'utf-8'));

    const lessonDirs = fs.readdirSync(coursePath, {withFileTypes: true}).filter(d => d.isDirectory());

    for (const lessonDir of lessonDirs) {
      const lessonJsonPath = path.join(coursePath, lessonDir.name, 'lesson.json');
      if (!fs.existsSync(lessonJsonPath)) continue;

      const lessonData = JSON.parse(fs.readFileSync(lessonJsonPath, 'utf-8'));

      const allConcepts: string[] = [];
      for (const ch of lessonData.chapters ?? []) {
        for (const c of ch.concepts ?? []) {
          if (!allConcepts.includes(c)) allConcepts.push(c);
        }
      }

      entries.push({
        lessonId: lessonData.id,
        title: lessonData.title,
        courseId: courseData.id,
        courseTitle: courseData.title,
        concepts: allConcepts,
        url: `/lesson/${lessonData.id}`,
      });
    }
  }

  return entries;
}
