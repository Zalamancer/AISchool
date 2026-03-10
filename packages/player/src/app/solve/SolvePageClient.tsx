'use client';

import {useState, useRef} from 'react';
import {useProblemSolver} from '../../hooks/useProblemSolver';
import {SolutionDisplay} from '../../components/SolutionDisplay';
import {AnimatedSolution} from '../../components/animation/AnimatedSolution';
import {LessonLinks} from '../../components/LessonLinks';

interface LessonIndexEntry {
  lessonId: string;
  title: string;
  courseId: string;
  courseTitle: string;
  concepts: string[];
  url: string;
}

export function SolvePageClient({lessonIndex}: {lessonIndex: LessonIndexEntry[]}) {
  const [problemText, setProblemText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {solve, solution, isLoading, error} = useProblemSolver();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      const mediaType = header.match(/data:(.*?);/)?.[1] ?? 'image/png';
      setImageBase64(base64);
      setImageMediaType(mediaType);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageBase64(null);
    setImageMediaType(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemText.trim() && !imageBase64) return;
    solve(problemText, imageBase64 ?? undefined, imageMediaType ?? undefined);
  };

  const isApiKeyError = error?.includes('ANTHROPIC_API_KEY');

  return (
    <div style={{maxWidth: 720, margin: '0 auto', padding: '24px 16px'}}>
      {/* Header */}
      <div style={{marginBottom: 32}}>
        <a
          href="/"
          style={{
            color: '#8A8AA0',
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          &larr; MathVision
        </a>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 600,
            marginTop: 12,
            marginBottom: 8,
          }}
        >
          Problem Solver
        </h1>
        <p style={{color: '#8A8AA0', fontSize: 15, margin: 0}}>
          Paste a math problem or upload a photo — get step-by-step solutions
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit}>
        <textarea
          value={problemText}
          onChange={(e) => setProblemText(e.target.value)}
          placeholder="Type or paste your math problem here...&#10;&#10;Example: Let u = (-4, 2, 1) and v = (-1, -1, 3). Calculate the dot product u · v."
          style={{
            width: '100%',
            minHeight: 120,
            padding: 16,
            fontSize: 15,
            lineHeight: 1.6,
            background: '#141428',
            color: '#E8E8F0',
            border: '1px solid #252550',
            borderRadius: 12,
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#FF6B4A')}
          onBlur={(e) => (e.target.style.borderColor = '#252550')}
        />

        {/* Image upload area */}
        <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 12}}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            style={{display: 'none'}}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              color: '#8A8AA0',
              background: 'transparent',
              border: '1px solid #252550',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Upload Photo
          </button>

          {imagePreview && (
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <img
                src={imagePreview}
                alt="Problem"
                style={{
                  maxWidth: 80,
                  maxHeight: 60,
                  borderRadius: 6,
                  border: '1px solid #252550',
                }}
              />
              <button
                type="button"
                onClick={removeImage}
                style={{
                  padding: '4px 8px',
                  fontSize: 12,
                  color: '#8A8AA0',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          )}

          <div style={{flex: 1}} />

          <button
            type="submit"
            disabled={isLoading || (!problemText.trim() && !imageBase64)}
            style={{
              padding: '10px 28px',
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              background:
                isLoading || (!problemText.trim() && !imageBase64) ? '#4A3030' : '#FF6B4A',
              border: 'none',
              borderRadius: 10,
              cursor:
                isLoading || (!problemText.trim() && !imageBase64) ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {isLoading ? 'Solving...' : 'Solve'}
          </button>
        </div>
      </form>

      {/* Loading */}
      {isLoading && (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            color: '#8A8AA0',
            fontSize: 15,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              width: 24,
              height: 24,
              border: '3px solid #252550',
              borderTopColor: '#FF6B4A',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: 12,
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div>Working through the problem...</div>
        </div>
      )}

      {/* API key error */}
      {isApiKeyError && (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            background: '#1A1428',
            borderRadius: 12,
            border: '1px solid #4A3060',
          }}
        >
          <h3 style={{margin: '0 0 8px 0', fontSize: 16, color: '#E8E8F0'}}>
            API Key Required
          </h3>
          <p style={{color: '#8A8AA0', fontSize: 14, lineHeight: 1.6, margin: '0 0 12px 0'}}>
            To use the Problem Solver, add your Anthropic API key:
          </p>
          <ol
            style={{
              color: '#8A8AA0',
              fontSize: 14,
              lineHeight: 1.8,
              paddingLeft: 20,
              margin: 0,
            }}
          >
            <li>
              Create a <code style={{color: '#FF6B4A'}}>.env.local</code> file in{' '}
              <code style={{color: '#FF6B4A'}}>packages/player/</code>
            </li>
            <li>
              Add: <code style={{color: '#FF6B4A'}}>ANTHROPIC_API_KEY=sk-ant-...</code>
            </li>
            <li>Restart the dev server</li>
          </ol>
        </div>
      )}

      {/* Generic error */}
      {error && !isApiKeyError && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: '#281414',
            borderRadius: 12,
            border: '1px solid #503030',
            color: '#FF6B6B',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Solution */}
      {solution && (
        <div style={{marginTop: 24}}>
          {solution.animation ? (
            <AnimatedSolution timeline={solution.animation} steps={solution.steps} />
          ) : (
            <SolutionDisplay steps={solution.steps} />
          )}
          <LessonLinks concepts={solution.concepts} lessonIndex={lessonIndex} />
        </div>
      )}
    </div>
  );
}
