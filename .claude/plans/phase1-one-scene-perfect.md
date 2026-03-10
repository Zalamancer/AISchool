# Phase 1: "One Scene, Perfect" — Implementation Plan

## Context
Build a 90-second cinematic matrix transformation animation (1920×1080, 60fps) that validates the full "Luminous Precision" aesthetic. This is the critical proof-of-concept — if this scene doesn't look dramatically different from 3Blue1Brown, nothing else matters.

## Current State
Scaffolding exists: monorepo, Motion Canvas 3.17.2 running, theme tokens, spring physics, basic math utils, skeleton scene. But no reusable components, no cinematic choreography, no glow effects, no camera work, no video export.

---

## Implementation Steps

### Step 1: Extend Math Utilities
**File:** `packages/engine/src/lib/math/linalg.ts`
- Add `eigenvectors(m: Mat2)` — compute normalized eigenvectors from eigenvalues
- Add `lerpMat2()`, `scaleVec2()`, `normalizeVec2()`
- **Verify:** Log eigenvalues/vectors for matrix [2,1,0.5,1.5] — expect λ≈2.457, λ≈1.043

### Step 2: CoordinateGrid Component
**File:** `packages/engine/src/lib/components/CoordinateGrid.tsx`
- Extends `Node`, creates child `Line` nodes for each grid line
- Each line has ~20 segment points (not just 2 endpoints) for smooth deformation
- Signals: `transformT` (0→1), `matrix` (Mat2), `gridScale`, `gridRange`, `gridColor`
- Points are reactively computed: `lerp(original, mulMV(matrix, original), transformT)`
- Axes as separate Lines with subtle glow (`shadowBlur`)
- **Key insight:** Built-in Grid can't deform per-point — must compose Line children manually
- **Verify:** Drop into scene, animate `transformT` 0→1, confirm fabric-like deformation

### Step 3: MathEquation Component
**File:** `packages/engine/src/lib/components/MathEquation.tsx`
- Wraps Motion Canvas `Latex` node with higher-level API
- Static `colorize()` helper: takes `{tex, color}[]` → produces `{{\color{#hex}term}}` TeX string
- Generator `*emphasize(partIndex, duration)` — morphs TeX to highlight one term (colors.highlight), dims others, scales node 105%
- Generator `*deemphasize(duration)` — reverses
- Generator `*morphTo(newParts, duration)` — delegates to Latex.tex()
- Glow via `shadowColor`/`shadowBlur` + `cache: true`
- **Verify:** Render colored equation, test morph and emphasis animations

### Step 4: VectorArrow Component
**File:** `packages/engine/src/lib/components/VectorArrow.tsx`
- Extends `Node`, contains a `Line` child with `endArrow: true`
- Signals: `from`, `to` (Vec2 in math coords), `arrowColor`, `drawProgress` (0→1)
- Directional lag: tip leads by ~30% during extension via skewed interpolation on intermediate points
- Glow via `shadowColor`/`shadowBlur`
- Generator `*animateTo(newTo, duration)` with springBouncy
- **Verify:** Draw eigenvector arrows, confirm lag effect and arrowhead rendering

### Step 5: Rewrite the Scene (The Big One)
**File:** `packages/engine/src/scenes/linalg/matrixTransform.tsx`

Uses Camera component for viewport control. Equations positioned OUTSIDE Camera (fixed on screen).

**Timeline (90 seconds):**

| Beat | Time | What Happens |
|------|------|-------------|
| 1 | 0-3s | Background gradient visible. Grid lines stagger in from center outward. Axes appear. |
| 2 | 3-8s | Unit circle draws itself (Line.end 0→1). Camera slowly zooms 1.0→1.1 with springSmooth. |
| 3 | 8-18s | Equation `Av = λv` slides in from right to rule-of-thirds position. Matrix A values appear below. Emphasis animation highlights A, then v. |
| 4 | 18-38s | THE TRANSFORMATION. Camera pans left. transformT 0→1 over 8s with springBouncy. Circle→ellipse + grid deforms simultaneously. Spring overshoot creates bounce. Equation morphs to show result. |
| 5 | 38-60s | Camera zooms in. Eigenvector 1 (hot pink) draws out. Label appears. Eigenvector 2 (mint) draws. Equation shows eigenvalue equation with numeric values. |
| 6 | 60-80s | Re-demonstrate: eigenvectors only scale, not rotate. Camera follows each eigenvector tip. Camera resets to full view. |
| 7 | 80-90s | Final hold — glow pulse on equation. Fade to black. |

**Layout:**
- Background: Radial gradient #0D0D1A → #141428
- Equations: right third (~x:650, y:-350)
- Geometry: center-left (camera-controlled)
- 60% content, 40% breathing room

### Step 6: Video Export Config
**File:** `packages/engine/vite.config.ts`
- Add `@motion-canvas/ffmpeg` plugin alongside motionCanvas plugin
- **Verify:** Render from Motion Canvas UI → produces MP4 in `output/`

### Step 7: Polish Pass
Iterative refinement:
- Grid opacity 0.4-0.6, geometry full, equations full (depth layers)
- Glow effects visible on circle, vectors, axes
- Spring overshoot 8-12% on shapes, zero overshoot on camera
- Rule of thirds composition at 1920×1080
- Equation colors exactly match theme

---

## Dependency Graph
```
Step 1 (math) ──────┐
Step 2 (Grid) ──────┤
Step 3 (Equation) ──┼──→ Step 5 (Scene) ──→ Step 6 (Export) ──→ Step 7 (Polish)
Step 4 (Vector) ────┘
```
Steps 1-4 are independent (parallelizable). Step 5 needs all four. Steps 6-7 follow.

## Risks & Mitigations
- **LaTeX \color{} may not render**: Fallback to multiple overlapping Latex nodes with different `fill` props
- **Radial gradient**: If Rect.fill can't do radialGradient, use custom drawShape override or two overlapping Rects
- **Grid perf**: 22 lines × 21 points = 462 reactive points/frame — should be fine, reduce segments if slow
- **FFmpeg binary**: @motion-canvas/ffmpeg bundles it via @ffmpeg-installer; if missing, fallback to PNG sequence + manual ffmpeg

## Success Criteria
Show the exported MP4 to someone who watches math YouTube. If they say "this looks different from everything else" — Phase 1 is complete.
