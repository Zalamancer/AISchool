# MathVision — AI Coder Prompt

## What You're Building

A web-based math explainer platform that transforms course topics into cinematic animated visual explainers. Students watch animations that teach math concepts (linear algebra, calculus, geometry, integrals — later biology and chemistry). They can pause at any moment to ask a question via voice or text. The AI explains, then resumes the lesson seamlessly.

The platform also produces automated 20-minute YouTube episodes (horizontal 1920×1080) designed to be sliced into short-form vertical content later.

This document defines the aesthetic vision, technical architecture, and implementation spec.

---

## Part 1: Aesthetic Vision

### The Gap We're Filling

3Blue1Brown defined math animation in 2015: dark blue-black background, flat colored vectors, simple linear tweens, Manim's default camera. Every math YouTube channel since has copied this look. It's become the "stock photo" of math content — recognizable but no longer remarkable.

Khan Academy is the other end: static blackboard drawings with voiceover. Functional but visually dead.

**We sit in the space between cinematic motion design and mathematical precision.** Think: if Vox's design team collaborated with a mathematician to build an animation engine.

### Visual Language: "Luminous Precision"

The aesthetic is built on four pillars:

#### 1. Dimensional Depth (not flat)

Math objects exist in subtle 3D space. Not full 3D rendering — we're not making a Pixar movie. Instead:

- **Soft parallax**: When focus shifts from an equation to its geometric meaning, the background layer drifts slightly. The viewer feels spatial hierarchy without thinking about it.
- **Depth of field**: The active element is sharp. Supporting elements (grid lines, previous equations, reference shapes) have a subtle gaussian blur. This directs attention the way a cinematographer uses rack focus.
- **Layered planes**: Equations float on a foreground plane. Geometric visualizations sit on a mid-ground plane. Grid/axes live on the background plane. Each has slightly different opacity and blur, creating atmospheric perspective.
- **Soft shadows and glow**: Key objects cast subtle drop shadows onto the plane below them. Active elements have a faint luminous bloom — not neon-glow, more like light bleeding through frosted glass.

Implementation: WebGL (Three.js) with orthographic camera for the math visualization, post-processing bloom pass for glow, and CSS backdrop-filter for the UI layer.

#### 2. Typographic Performance (equations that act)

Equations are not static labels. They perform:

- **Entrance**: Terms don't just fade in. They arrive. A fraction bar draws itself left-to-right. An exponent lifts upward from the baseline as if ascending. A summation symbol assembles from its parts (Σ draws as a path, then bounds appear above and below).
- **Emphasis**: When a term becomes the focus of explanation, it doesn't just change color. It subtly scales up (105%), surrounding terms dim to 40% opacity and shift outward by 2-3px — creating breathing room. The highlighted term gets a soft luminous underline that pulses once.
- **Transformation**: When an equation transforms (e.g., x² + y² = r² becomes y = √(r² - x²)), matched terms glide to their new positions while unmatched terms dissolve and new terms materialize with a gentle scale-from-zero. The motion uses spring physics (slight overshoot, settle).
- **Color as meaning**: Color is semantic, not decorative. Variables are warm amber (#F4B860). Constants are cool blue (#6BC5E8). Operators are neutral gray (#8A8AA0). Functions are soft green (#7ED6A0). This palette is consistent across every lesson, building subconscious recognition.

Implementation: Motion Canvas LaTeX node with `{{part}}` splitting for term-level animation. Custom spring easing functions. SVG-based rendering for resolution independence.

#### 3. Motion with Weight (physics-based, not mechanical)

Every moving object obeys implied physics:

- **Vectors**: When a vector extends, the tip leads and the tail follows with slight lag — like a rubber band. When it contracts, the base leads. This gives directional intent.
- **Shapes**: When the unit circle deforms into an ellipse under a matrix transformation, it doesn't linearly interpolate. The motion follows the actual continuous transformation — vertices that are being stretched accelerate, vertices being compressed decelerate. The shape breathes.
- **Grid deformation**: Grid lines deform like a fabric mesh, not a spreadsheet. Lines that pass through high-strain regions (near eigenvectors with large eigenvalues) bow outward slightly before settling. Spring overshoot: 8-12% of travel distance, 300ms settle time.
- **Camera motion**: Any viewport shift (zooming into a region of a graph, panning to follow a moving point) uses critically-damped spring physics. No linear pans. The camera accelerates, reaches peak velocity at the midpoint, and decelerates to rest with zero overshoot. Duration: 800ms–1200ms depending on distance.

Implementation: Custom spring interpolation functions. The core equation is `x(t) = target - (target - start) × e^(-ζωt) × (cos(ωd×t) + (ζω/ωd)×sin(ωd×t))` where ζ=0.7 (underdamped for vectors/shapes) or ζ=1.0 (critically damped for camera).

#### 4. Cinematic Composition (not centered-everything)

Layouts are designed like film frames, not PowerPoint slides:

- **Rule of thirds**: The primary mathematical object sits at a thirds intersection, not dead center. The equation lives in the opposite third. This creates visual tension and a natural eye-flow path.
- **Asymmetric balance**: A large geometric visualization on the left is balanced by a compact equation cluster on the right. They don't need to be the same size — they need to feel balanced.
- **Breathing room**: Generous negative space. Math content occupies 60% of the frame maximum. The remaining 40% is intentional emptiness that gives the eye rest.
- **Progressive reveal**: The frame starts sparse and accumulates elements. Each new element enters from a consistent direction (equations from the right, geometric objects from the center, labels from below). This creates a spatial grammar the viewer internalizes.
- **Focal transitions**: When focus shifts from geometry to equation, it's not a cut. The geometric visualization slowly dims and drifts (3-5px) while the equation brightens and pulls forward. The shift takes 600ms. The viewer's eye is guided, not yanked.

### Color System

Background: Deep charcoal with a hint of blue warmth — `#0D0D1A` base with a radial gradient to `#141428` at edges. Never pure black (too harsh) and never the 3b1b dark blue (too recognizable).

The palette is designed around mathematical meaning:

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Variable | Warm Amber | #F4B860 | x, y, z, θ, any symbol that varies |
| Constant | Cool Blue | #6BC5E8 | π, e, specific numbers, coefficients |
| Operator | Neutral Gray | #8A8AA0 | +, −, ×, ÷, =, →, Σ, ∫ |
| Function | Sage Green | #7ED6A0 | sin, cos, log, √, det |
| Highlight | Warm White | #FFF5E6 | The currently-focused term |
| Error/Caution | Soft Rose | #E88B8B | Incorrect steps, constraints, bounds |
| Success/Result | Bright Cyan | #5ECFCF | Final answers, proven results |
| Geometric Primary | Coral | #FF6B6B | Primary shape being transformed |
| Geometric Secondary | Lavender | #B48EF0 | Secondary/reference shapes |
| Grid | Deep Navy | #1A1A3E | Background grid lines |
| Axis | Slate | #4A4A7A | Axes, slightly brighter than grid |
| Eigenvector 1 | Hot Pink | #FF44FF | First eigenvector/eigenspace |
| Eigenvector 2 | Mint | #44FFAA | Second eigenvector/eigenspace |

Text is `#E8E8F0` (warm white, never pure `#FFFFFF`).

### Typography

- **Equations**: MathJax/LaTeX rendering, configured with the TeX Gyre Pagella Math font (a Palatino-inspired math font that feels warmer and more editorial than Computer Modern).
- **Labels & annotations**: "Geist Mono" (Vercel's monospace) at 14-18px. Lowercase. Letter-spacing: 0.02em. This gives labels a quiet, technical authority.
- **Titles/headers** (for YouTube thumbnails, chapter screens): "Instrument Serif" — has character and warmth, feels like a well-designed textbook chapter opener. Fallback: "Playfair Display".
- **Body text** (for the interactive Q&A overlay): "Geist" (sans-serif) at 16px. Clean, modern, doesn't compete with the math.

Never use: Inter, Roboto, Arial, system-ui. These are the visual equivalent of stock photography.

### Sound Design Direction (for later phases)

- Soft tonal cues when elements appear (sine wave, 440Hz, 50ms decay, very low volume)
- A subtle "whoosh" on vector extension (filtered white noise, 200ms)
- Spring-settle sounds on overshoot (dampened pluck, like a muted guitar harmonic)
- No music during explanation. Music only during title/transition screens.
- The AI voice explanation uses ElevenLabs with a calm, clear, slightly warm male or female voice (not robotic, not overly enthusiastic)

---

## Part 2: Technical Architecture

### Rendering Engine: Motion Canvas

Use [Motion Canvas](https://motioncanvas.io) (TypeScript, Canvas 2D, MIT license, 18K+ GitHub stars) as the core animation engine.

Why Motion Canvas:
- TypeScript/web-native (runs in browser, exports to video)
- Generator-based animation timeline (yield* for sequencing)
- LaTeX node with term-level tweening (v3.17.0+)
- Reactive signal system (one signal can drive multiple animated properties)
- Built-in easing, spring functions, and tween composition
- Exports frame sequences for video encoding

Motion Canvas is the rendering backend. It is NOT the student-facing UI. The student sees a custom web app that either:
- (Interactive mode) Runs Motion Canvas scenes in-browser with a custom playback controller
- (Video mode) Plays pre-rendered MP4/WebM from Motion Canvas export

### Project Structure

```
mathvision/
├── packages/
│   ├── engine/                    # Motion Canvas scenes + math utilities
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── math/          # Pure math utilities
│   │   │   │   │   ├── linalg.ts  # Matrix ops, eigen decomposition
│   │   │   │   │   ├── calculus.ts # Derivatives, integrals, limits
│   │   │   │   │   ├── geometry.ts # Shapes, transforms, intersections
│   │   │   │   │   └── parametric.ts  # Parametric curves, surfaces
│   │   │   │   ├── components/    # Reusable animated components
│   │   │   │   │   ├── CoordinateGrid.tsx   # Deformable grid
│   │   │   │   │   ├── MathEquation.tsx     # Enhanced LaTeX with highlight
│   │   │   │   │   ├── VectorArrow.tsx      # Physics-based vector
│   │   │   │   │   ├── FunctionPlot.tsx     # Parametric function renderer
│   │   │   │   │   ├── MatrixDisplay.tsx    # Animated matrix with brackets
│   │   │   │   │   └── NumberLine.tsx       # 1D number line with marks
│   │   │   │   ├── motion/        # Animation utilities
│   │   │   │   │   ├── spring.ts  # Spring physics interpolation
│   │   │   │   │   ├── stagger.ts # Staggered entrance animations
│   │   │   │   │   └── camera.ts  # Viewport control with spring damping
│   │   │   │   └── theme.ts       # Color system, typography tokens
│   │   │   ├── scenes/            # Individual lesson scenes
│   │   │   │   ├── linalg/
│   │   │   │   │   ├── matrixTransform.tsx
│   │   │   │   │   ├── eigenvalues.tsx
│   │   │   │   │   ├── linearSystems.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── calculus/
│   │   │   │   │   ├── limits.tsx
│   │   │   │   │   ├── derivatives.tsx
│   │   │   │   │   ├── integrals.tsx
│   │   │   │   │   └── ...
│   │   │   │   └── geometry/
│   │   │   └── project.ts         # Motion Canvas entry
│   │   └── package.json
│   │
│   ├── player/                    # Student-facing web app
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── LessonPlayer.tsx       # Main player wrapper
│   │   │   │   ├── TimelineController.tsx # Play/pause/seek
│   │   │   │   ├── AskOverlay.tsx         # Voice/text Q&A overlay
│   │   │   │   ├── ChapterNav.tsx         # Chapter navigation
│   │   │   │   └── TranscriptPanel.tsx    # Scrolling transcript
│   │   │   ├── hooks/
│   │   │   │   ├── useSceneState.ts       # Scene state serialization
│   │   │   │   ├── useVoiceInput.ts       # Web Speech API hook
│   │   │   │   └── useAIExplainer.ts      # Claude API integration
│   │   │   └── app.tsx
│   │   └── package.json
│   │
│   └── pipeline/                  # Video export + ProAnimate integration
│       ├── src/
│       │   ├── export.ts          # Motion Canvas → MP4/WebM
│       │   ├── compose.ts         # Add overlays, branding, transitions
│       │   ├── slice.ts           # Long-form → short-form splitting
│       │   └── narrate.ts         # ElevenLabs TTS + audio sync
│       └── package.json
│
├── content/                       # Course content definitions
│   ├── courses/
│   │   ├── linear-algebra/
│   │   │   ├── course.json        # Chapter structure, prerequisites
│   │   │   ├── 01-vectors/
│   │   │   │   ├── lesson.json    # Scene sequence, narration script
│   │   │   │   └── exercises.json # Practice problems
│   │   │   ├── 02-matrices/
│   │   │   └── ...
│   │   ├── calculus-1/
│   │   └── geometry/
│   └── schema.json                # Content format specification
│
└── package.json                   # Monorepo root (use pnpm workspaces)
```

### Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Animation engine | Motion Canvas (TypeScript) | Web-native Manim, LaTeX tweening, signal-reactive |
| Math rendering | MathJax (via Motion Canvas LaTeX node) | SVG-based, splittable into animatable parts |
| 3D effects layer | Three.js (post-processing only) | Bloom, depth-of-field, parallax. NOT for math geometry |
| Student-facing app | Next.js + React | SSR for course pages, client-side for player |
| Voice input | Web Speech API (browser-native) | Zero-latency, no external service for STT |
| AI explainer | Claude API (Anthropic) | Best at mathematical explanation |
| Voice output | ElevenLabs API | Natural-sounding TTS for AI responses |
| Video export | Motion Canvas built-in exporter → FFmpeg | Frame sequence → MP4/WebM |
| ProAnimate integration | Remotion (or direct FFmpeg composition) | Overlay branding, compose multi-scene episodes |
| Content storage | JSON files (content/) + PostgreSQL (user data) | Flat files for lesson content, DB for progress |
| Hosting | Vercel (app) + R2/S3 (video assets) | Edge-deployed app, CDN for pre-rendered videos |

### Content Data Model

Each lesson is defined as a JSON file that maps to a Motion Canvas scene:

```json
{
  "id": "linalg-matrix-transform",
  "title": "What Matrices Do to Space",
  "course": "linear-algebra",
  "chapter": 2,
  "lesson": 3,
  "duration_seconds": 1200,
  "scene": "linalg/matrixTransform",
  
  "chapters": [
    {
      "id": "intro",
      "title": "The Unit Circle",
      "start_seconds": 0,
      "short_form_eligible": true,
      "concepts": ["unit-circle", "coordinate-system"]
    },
    {
      "id": "matrix-intro", 
      "title": "Meet Matrix A",
      "start_seconds": 45,
      "short_form_eligible": true,
      "concepts": ["matrix-notation", "basis-vectors"]
    },
    {
      "id": "transformation",
      "title": "The Transformation",
      "start_seconds": 120,
      "short_form_eligible": true,
      "concepts": ["linear-transformation", "eigenvalues"]
    }
  ],

  "narration": [
    {
      "start": 0,
      "text": "Let's start with something simple — the unit circle. Every point on this circle is exactly one unit from the origin."
    },
    {
      "start": 8,
      "text": "Now, what happens when we multiply every point by a matrix?"
    }
  ],

  "prerequisites": ["linalg-vectors", "linalg-matrix-basics"],
  "next": "linalg-eigenvalues"
}
```

The `chapters` array is what enables long-to-short slicing. Each chapter marked `short_form_eligible: true` can be automatically extracted as a standalone clip with intro/outro added by the pipeline.

### Interactive Pause-and-Ask Architecture (Phase 4 — build last)

When the student pauses:

1. **State capture**: The scene's current timeline position (in seconds) and the current `chapters[i].concepts` array are serialized.
2. **Context construction**: A system prompt is built:
   ```
   You are a math tutor. The student is watching a lesson on "{lesson.title}". 
   They are currently in the section "{chapter.title}" which covers: {concepts}.
   The narration just said: "{last_narration_text}".
   The student paused to ask a question. Answer clearly and concisely. 
   If they need a visual, describe what they should look at on screen.
   Keep your answer under 30 seconds of speech.
   ```
3. **Student question** is captured via Web Speech API (or text input).
4. **Claude API call** with the context + question.
5. **ElevenLabs TTS** converts Claude's response to audio.
6. **Overlay**: A frosted-glass panel slides in from the right (40% of viewport width) showing the text response. The main animation dims to 30% opacity but remains visible behind the overlay. The AI audio plays.
7. **Resume**: Student taps "Continue" or says "continue". The overlay slides out, animation brightens back to 100%, and playback resumes from the exact frame it paused at.

No sub-animations during the Q&A. No annotation drawing on the math. Keep it simple for v1. The AI just talks.

---

## Part 3: Implementation Order

Do NOT build everything at once. Each phase is a working product:

### Phase 1: One Scene, Perfect (2-3 weeks)

Build the matrix transformation scene end-to-end. This single scene validates:
- Motion Canvas setup and rendering pipeline
- The aesthetic system (colors, typography, spring physics, depth)
- LaTeX equation morphing (the hardest problem)
- Geometric shape animation (grid deformation, circle → ellipse)
- Video export to MP4

Deliverable: A 90-second animation that looks better than 3Blue1Brown, exported as a 1920×1080 MP4.

Success criteria: Show it to someone who watches math YouTube. If they say "this looks different from everything else" — you nailed it.

### Phase 2: Component Library (2-3 weeks)

Extract the reusable pieces from Phase 1 into a component library:
- `CoordinateGrid` — deformable grid with spring physics
- `MathEquation` — LaTeX with term-level highlight and morph
- `VectorArrow` — physics-based vector with directional lag
- `FunctionPlot` — parametric curve renderer
- `theme.ts` — the full color/typography system

Then build a SECOND scene (different topic — e.g., limits or derivatives) using only these components. This validates that the system generalizes beyond linear algebra.

### Phase 3: Course Content + Video Pipeline (2-3 weeks)

- Define the content JSON schema
- Build the course structure for Linear Algebra (chapter outline, lesson sequence)
- Wire up ElevenLabs TTS for narration
- Build the FFmpeg pipeline: Motion Canvas frames + narration audio → final MP4
- Add chapter markers and automatic short-form slicing
- Produce one complete 20-minute episode

### Phase 4: Student-Facing Web App (3-4 weeks)

- Build the Next.js app with lesson player
- Video playback with chapter navigation
- Add the interactive pause-and-ask feature
- Claude API integration for Q&A
- Voice input/output

### Phase 5: ProAnimate Integration (1-2 weeks)

- Connect Motion Canvas video output to ProAnimate's composition pipeline
- Add branding overlays, intro/outro sequences
- Automated batch rendering for multiple lessons
- YouTube upload pipeline

---

## Part 4: Critical Technical Constraints

### LaTeX Tweening Rules (Motion Canvas)

The LaTeX node uses `{{double braces}}` to define animatable parts:

```typescript
// Split equation into parts that can independently animate
<Latex tex="{{A}}{{\\mathbf{v}}} = {{\\lambda}}{{\\mathbf{v}}}" />

// Morph to a new equation — matched parts tween, new parts fade in, removed parts fade out
yield* tex().tex("{{A}}{{\\mathbf{v}_1}} = {{3}}{{\\mathbf{v}_1}}", 1);
```

**Known limitations:**
- Per-term color/opacity changes require removing and re-adding the LaTeX node (causes visual delay). Workaround: use multiple overlapping LaTeX nodes — one for each color state — and crossfade.
- Complex equation rearrangements (e.g., row reduction) need careful part splitting. Each step should be a separate equation state, not a single morph.

### Spring Physics Implementation

```typescript
// Core spring function — use this everywhere instead of linear tweens
function spring(
  t: number,         // normalized time 0-1
  damping: number,   // ζ: 0.7 = bouncy, 1.0 = critical, 1.5 = overdamped
  frequency: number  // ω: higher = faster oscillation (default 4.0)
): number {
  if (damping >= 1) {
    // Critically/over-damped: no overshoot
    return 1 - (1 + frequency * t) * Math.exp(-frequency * t);
  }
  // Under-damped: overshoot and settle
  const wd = frequency * Math.sqrt(1 - damping * damping);
  return 1 - Math.exp(-damping * frequency * t) * (
    Math.cos(wd * t) + (damping * frequency / wd) * Math.sin(wd * t)
  );
}
```

Use `damping=0.7` for shapes/vectors (slight bounce). Use `damping=1.0` for camera and UI (no bounce).

### Video Export Pipeline

```
Motion Canvas scene (TypeScript)
    ↓ renders frame-by-frame to
PNG sequence (1920×1080, 60fps)
    ↓ FFmpeg encodes to
MP4 (H.264, CRF 18) or WebM (VP9, CRF 23)
    ↓ muxed with
ElevenLabs narration audio (48kHz, normalized to -16 LUFS)
    ↓ composed with
ProAnimate overlays (lower thirds, chapter cards, branding)
    ↓ output
Final YouTube video + short-form clips (sliced at chapter boundaries)
```

### Performance Targets

- Interactive playback: 60fps on M1 MacBook / mid-range desktop
- Scene complexity limit: <200 animated nodes per scene
- LaTeX render time: <100ms per equation change
- Video export: <2× real-time (20-minute lesson exports in <40 minutes)
- AI Q&A round-trip: <3 seconds (Claude API + ElevenLabs TTS)

---

## Part 5: What NOT To Build

- **Do NOT build a custom math rendering engine.** Use Motion Canvas's LaTeX node + MathJax. Extend it where needed, don't replace it.
- **Do NOT scrape Khan Academy.** Their API is restricted. Instead, structure your own course content in JSON files using Khan Academy's topic sequence as a reference outline.
- **Do NOT build 3D math visualization.** All math is 2D (projected). Three.js is only for post-processing effects (bloom, DOF). The math itself is Canvas 2D.
- **Do NOT build the interactive Q&A before the animation engine works.** The Q&A is Phase 4. If you can't produce a beautiful animation, interactivity is irrelevant.
- **Do NOT use D3.js for mathematical constructions.** D3 is for data visualization (charts, graphs). Mathematical objects (eigenvectors, integrals, parametric curves) need Motion Canvas's coordinate system, not D3's data binding.
- **Do NOT template by concept type.** A Pythagorean theorem proof and a Fundamental Theorem of Calculus proof share nothing visually. Each scene is bespoke. The component library provides building blocks, but the choreography is per-scene.