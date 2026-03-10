'use client';

import {useState} from 'react';
import {SolutionDisplay} from '../../../components/SolutionDisplay';
import {AnimatedSolution} from '../../../components/animation/AnimatedSolution';
import {buildFullVectorAnimation} from '../../../lib/animationBuilders/vectorBuilder';

// Pre-build Q1 animation
const q1Timeline = buildFullVectorAnimation(
  [-4, 2, 1],
  [-1, -1, 3],
  'u',
  'v',
  'Let u = (-4, 2, 1) and v = (-1, -1, 3). Calculate dot product, perpendicular/parallel, lengths, cos theta, unit vector, find two vectors parallel to v with length 7',
);

const q1Steps = [
  {title: '(a) Dot Product', content: '$$u \\cdot v = (-4)(-1) + (2)(-1) + (1)(3) = 4 - 2 + 3 = 5$$\n\nSince $u \\cdot v = 5 > 0$, the angle between $u$ and $v$ is acute (less than $90°$).'},
  {title: '(b) Perpendicular, Parallel, or Neither?', content: 'Not perpendicular: $u \\cdot v = 5 \\neq 0$.\n\nNot parallel: the component ratios $\\frac{-4}{-1} = 4$, $\\frac{2}{-1} = -2$, $\\frac{1}{3} \\approx 0.33$ are not all equal.\n\nThe vectors are **neither** perpendicular nor parallel.'},
  {title: '(c) Lengths', content: '$$\\|u\\| = \\sqrt{(-4)^2 + 2^2 + 1^2} = \\sqrt{16 + 4 + 1} = \\sqrt{21}$$\n\n$$\\|v\\| = \\sqrt{(-1)^2 + (-1)^2 + 3^2} = \\sqrt{1 + 1 + 9} = \\sqrt{11}$$'},
  {title: '(d) cos θ', content: '$$\\cos\\theta = \\frac{u \\cdot v}{\\|u\\| \\cdot \\|v\\|} = \\frac{5}{\\sqrt{21} \\cdot \\sqrt{11}} = \\frac{5}{\\sqrt{231}} \\approx 0.3290$$\n\n$$\\theta \\approx 70.8°$$'},
  {title: '(e) Unit Vector', content: '$$\\hat{u} = \\frac{u}{\\|u\\|} = \\frac{1}{\\sqrt{21}}(-4, 2, 1) = \\left(\\frac{-4}{\\sqrt{21}},\\; \\frac{2}{\\sqrt{21}},\\; \\frac{1}{\\sqrt{21}}\\right)$$'},
  {title: '(f) Two Vectors Parallel to v with Length 7', content: '$$\\hat{v} = \\frac{v}{\\|v\\|} = \\frac{1}{\\sqrt{11}}(-1, -1, 3)$$\n\n$$w_1 = 7\\hat{v} = \\frac{7}{\\sqrt{11}}(-1, -1, 3) = \\left(\\frac{-7}{\\sqrt{11}},\\; \\frac{-7}{\\sqrt{11}},\\; \\frac{21}{\\sqrt{11}}\\right)$$\n\n$$w_2 = -7\\hat{v} = \\frac{-7}{\\sqrt{11}}(-1, -1, 3) = \\left(\\frac{7}{\\sqrt{11}},\\; \\frac{7}{\\sqrt{11}},\\; \\frac{-21}{\\sqrt{11}}\\right)$$'},
];

const q2Steps = [
  {title: 'Key Idea: The Dot Product and Angles', content: 'The dot product connects algebra to geometry through this formula:\n$$u \\cdot v = \\|u\\| \\, \\|v\\| \\cos\\theta$$\n\nThis tells us that the dot product depends on three things: how long $u$ is, how long $v$ is, and the angle $\\theta$ between them.\n\nWhen we know the lengths but NOT the direction, the dot product can range between its extreme values — determined by $\\cos\\theta$, which ranges from $-1$ to $+1$.'},
  {title: '(a)(i) Max and min of u · v', content: 'We know $\\|u\\| = 7$ and $\\|v\\| = 11$, so:\n$$u \\cdot v = 7 \\times 11 \\times \\cos\\theta = 77\\cos\\theta$$\n\nSince $\\cos\\theta$ ranges from $-1$ to $+1$:\n\n**Maximum**: $u \\cdot v = 77 \\times 1 = 77$ — this happens when $\\theta = 0$, meaning the vectors point in the **same direction**.\n\n**Minimum**: $u \\cdot v = 77 \\times (-1) = -77$ — this happens when $\\theta = \\pi$, meaning the vectors point in **opposite directions**.\n\nThis result is a special case of the **Cauchy-Schwarz inequality**: $|u \\cdot v| \\leq \\|u\\| \\cdot \\|v\\|$.'},
  {title: '(a)(ii) Max and min of ||u − v||', content: '$\\|u - v\\|$ measures the **distance** between the tips of $u$ and $v$ (when placed at the same starting point). Think of it like a triangle: $u$ and $v$ are two sides, and $u - v$ is the third side.\n\nWe expand using the algebraic identity (like the law of cosines):\n$$\\|u - v\\|^2 = \\|u\\|^2 - 2(u \\cdot v) + \\|v\\|^2 = 49 - 2(u \\cdot v) + 121 = 170 - 2(u \\cdot v)$$\n\n**Maximum distance** — when $u \\cdot v$ is smallest ($-77$), vectors point apart:\n$$\\|u - v\\| = \\sqrt{170 + 154} = \\sqrt{324} = 18 = 7 + 11$$\nThe distance equals the **sum** of the lengths (vectors in opposite directions).\n\n**Minimum distance** — when $u \\cdot v$ is largest ($77$), vectors point together:\n$$\\|u - v\\| = \\sqrt{170 - 154} = \\sqrt{16} = 4 = 11 - 7$$\nThe distance equals the **difference** of the lengths (vectors in same direction).'},
  {title: 'Key Idea: Orthogonality as a System', content: 'Two vectors are **orthogonal** (perpendicular) when their dot product is zero: $u \\cdot w = 0$.\n\nThis is powerful because it turns a geometric condition (perpendicularity) into an algebraic equation that we can solve. When we have multiple dot product conditions, we get a system of equations.'},
  {title: '(b) Finding w = (c, d)', content: 'We need $w = (c, d)$ satisfying two conditions simultaneously:\n\n**Condition 1** — $w$ is perpendicular to $u = (3, 1)$:\n$$u \\cdot w = 3c + d = 0 \\quad \\Longrightarrow \\quad d = -3c$$\n\n**Condition 2** — the dot product of $v = (1, 5)$ with $w$ equals 3:\n$$v \\cdot w = c + 5d = 3$$\n\nSubstitute $d = -3c$ into the second equation:\n$$c + 5(-3c) = 3 \\implies -14c = 3 \\implies c = -\\frac{3}{14}$$\n\nThen $d = -3 \\times (-\\frac{3}{14}) = \\frac{9}{14}$.\n\n$$\\boxed{w = \\left(-\\frac{3}{14},\\; \\frac{9}{14}\\right)}$$\n\n**Verify**: $u \\cdot w = 3(-\\frac{3}{14}) + \\frac{9}{14} = -\\frac{9}{14} + \\frac{9}{14} = 0$ ✓ and $v \\cdot w = -\\frac{3}{14} + 5 \\cdot \\frac{9}{14} = \\frac{-3+45}{14} = 3$ ✓'},
];

const q3Steps = [
  {title: 'Key Idea: Two Ways to Multiply a Matrix by a Vector', content: 'Matrix-vector multiplication $Ab$ can be understood in two completely different but equivalent ways:\n\n**Column view**: $Ab$ is a **linear combination of the columns of $A$**, where the entries of $b$ are the weights. This is the more geometric view — it tells you that $Ab$ lives in the "column space" of $A$.\n\n**Row view**: Each entry of $Ab$ is the **dot product** of a row of $A$ with $b$. This is more computational — it gives you one output entry at a time.\n\nBoth methods always give the same answer. Understanding both is essential for linear algebra.'},
  {title: '(a) Column View: Ab as linear combination', content: 'Here $b = (2, 1, 2)$, so we take 2 times column 1 + 1 times column 2 + 2 times column 3:\n\n$$Ab = 2 \\begin{bmatrix} 7 \\\\ 1 \\\\ 0 \\\\ 7 \\end{bmatrix} + 1 \\begin{bmatrix} -2 \\\\ 2 \\\\ -1 \\\\ -2 \\end{bmatrix} + 2 \\begin{bmatrix} 0 \\\\ 5 \\\\ 2 \\\\ 1 \\end{bmatrix}$$\n\nScale each column, then add component-wise:\n$$= \\begin{bmatrix} 14 \\\\ 2 \\\\ 0 \\\\ 14 \\end{bmatrix} + \\begin{bmatrix} -2 \\\\ 2 \\\\ -1 \\\\ -2 \\end{bmatrix} + \\begin{bmatrix} 0 \\\\ 10 \\\\ 4 \\\\ 2 \\end{bmatrix} = \\boxed{\\begin{bmatrix} 12 \\\\ 14 \\\\ 3 \\\\ 14 \\end{bmatrix}}$$\n\nThe result is a combination of $A$\'s columns — this is why the output always lives in the **column space** of $A$.'},
  {title: '(b) Row View: Dot products', content: 'Now we compute each entry of $Ab$ by dotting each **row** of $A$ with $b = (2, 1, 2)$:\n\nRow 1: $(7, -2, 0) \\cdot (2, 1, 2) = 14 - 2 + 0 = 12$\n\nRow 2: $(1, 2, 5) \\cdot (2, 1, 2) = 2 + 2 + 10 = 14$\n\nRow 3: $(0, -1, 2) \\cdot (2, 1, 2) = 0 - 1 + 4 = 3$\n\nRow 4: $(7, -2, 1) \\cdot (2, 1, 2) = 14 - 2 + 2 = 14$\n\n$$Ab = \\boxed{\\begin{bmatrix} 12 \\\\ 14 \\\\ 3 \\\\ 14 \\end{bmatrix}}$$\n\nSame answer! The row view is usually faster to compute by hand, while the column view gives better geometric insight.'},
];

const q4Steps = [
  {title: 'Key Idea: What is Ax = b?', content: 'The equation $Ax = b$ is just a compact way of writing a **system of linear equations**. Each row of the matrix $A$ gives you one equation, with the entries of $x$ as the unknowns and the entries of $b$ as the right-hand sides.\n\nSolving $Ax = b$ means finding the values of $x_1, x_2, x_3$ that satisfy ALL equations simultaneously. This is the core problem of linear algebra — nearly everything else builds on it.'},
  {title: '(a) Writing out the system', content: 'We multiply out $Ax = b$ row by row. Each row of $A$ dotted with $x$ gives one equation:\n\n$$A = \\begin{bmatrix} 2 & 0 & 3 \\\\ 1 & 0 & 1 \\\\ -1 & 2 & 0 \\end{bmatrix}, \\quad x = \\begin{bmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{bmatrix}, \\quad b = \\begin{bmatrix} b_1 \\\\ b_2 \\\\ b_3 \\end{bmatrix}$$\n\n$$\\begin{cases} 2x_1 + 3x_3 = b_1 \\\\ x_1 + x_3 = b_2 \\\\ -x_1 + 2x_2 = b_3 \\end{cases}$$\n\nNotice: $x_2$ doesn\'t appear in the first two equations (because column 2 has zeros there). This makes the system easier to solve.'},
  {title: '(b) Solving by substitution', content: 'We solve step by step, using the simplest equation first:\n\n**Step 1**: Equation 2 is simplest — solve for $x_1$:\n$$x_1 = b_2 - x_3$$\n\n**Step 2**: Substitute into equation 1 to find $x_3$:\n$$2(b_2 - x_3) + 3x_3 = b_1 \\implies 2b_2 + x_3 = b_1 \\implies x_3 = b_1 - 2b_2$$\n\n**Step 3**: Back-substitute to find $x_1$:\n$$x_1 = b_2 - (b_1 - 2b_2) = 3b_2 - b_1$$\n\n**Step 4**: Use equation 3 to find $x_2$:\n$$-(3b_2 - b_1) + 2x_2 = b_3 \\implies x_2 = \\frac{-b_1 + 3b_2 + b_3}{2}$$\n\n$$\\boxed{x_1 = -b_1 + 3b_2, \\quad x_2 = \\frac{-b_1 + 3b_2 + b_3}{2}, \\quad x_3 = b_1 - 2b_2}$$\n\nThe answer is in terms of $b_1, b_2, b_3$ — this works for **any** right-hand side $b$.'},
  {title: '(c) The Column Perspective', content: 'Here\'s the beautiful connection: solving $Ax = b$ is the same as writing $b$ as a **linear combination of the columns of $A$**.\n\nThe solution $x = (x_1, x_2, x_3)$ gives us the exact weights:\n\n$$b = x_1 \\underbrace{\\begin{bmatrix} 2 \\\\ 1 \\\\ -1 \\end{bmatrix}}_{\\text{col 1}} + x_2 \\underbrace{\\begin{bmatrix} 0 \\\\ 0 \\\\ 2 \\end{bmatrix}}_{\\text{col 2}} + x_3 \\underbrace{\\begin{bmatrix} 3 \\\\ 1 \\\\ 0 \\end{bmatrix}}_{\\text{col 3}}$$\n\nSubstituting our solution from part (b):\n$$b = (-b_1 + 3b_2) \\begin{bmatrix} 2 \\\\ 1 \\\\ -1 \\end{bmatrix} + \\frac{-b_1 + 3b_2 + b_3}{2} \\begin{bmatrix} 0 \\\\ 0 \\\\ 2 \\end{bmatrix} + (b_1 - 2b_2) \\begin{bmatrix} 3 \\\\ 1 \\\\ 0 \\end{bmatrix}$$\n\nSince we can always find a solution, **every** $b$ in $\\mathbb{R}^3$ can be written as a combination of these columns — the columns span all of $\\mathbb{R}^3$.'},
];

const q5Steps = [
  {title: 'Key Idea: Linear Dependence & Independence', content: 'Vectors are **linearly dependent** if at least one of them is "redundant" — it can be written as a combination of the others. Think of it as: you can reach the same point using fewer vectors.\n\nVectors are **linearly independent** if NONE of them is redundant — each one adds a genuinely new direction that the others can\'t create.\n\nFormally: $v_1, v_2, \\ldots, v_k$ are dependent if there exist scalars (not all zero) such that $c_1 v_1 + c_2 v_2 + \\cdots + c_k v_k = 0$.\n\nThe **column space** is the set of all vectors you can reach by combining the columns. 2 independent vectors in $\\mathbb{R}^3$ span a plane; 3 independent vectors span all of $\\mathbb{R}^3$.'},
  {title: '(a) Columns of A: Look for patterns first', content: '$A = \\begin{bmatrix} 1 & 2 & 3 \\\\ 1 & 4 & 5 \\\\ 6 & 0 & 6 \\end{bmatrix}$\n\nBefore doing any heavy computation, **look at the numbers**. Notice that in each row, column 3 = column 1 + column 2:\n\nRow 1: $1 + 2 = 3$ ✓\nRow 2: $1 + 4 = 5$ ✓\nRow 3: $6 + 0 = 6$ ✓\n\nSo $a_3 = a_1 + a_2$, which means the columns are **linearly dependent** — column 3 is just the sum of the first two, so it adds no new information.\n\nWe can write this as: $1 \\cdot a_1 + 1 \\cdot a_2 + (-1) \\cdot a_3 = 0$ (a nontrivial combination giving zero).\n\nColumns 1 and 2 are independent (neither is a scalar multiple of the other), so $\\text{rank}(A) = 2$.\n\nThe column space is a **plane through the origin in $\\mathbb{R}^3$** — you can reach any point on that plane by combining columns 1 and 2, but you can never leave the plane.'},
  {title: '(b) Columns of B: Row reduction', content: 'For $B = \\begin{bmatrix} 1 & 2 & 2 \\\\ 2 & 3 & 4 \\\\ 1 & 2 & 1 \\end{bmatrix}$, the pattern isn\'t obvious, so we use **row reduction** (Gaussian elimination) to check.\n\nThe idea: row operations don\'t change linear dependence relationships between columns. If every column has a pivot, they\'re independent.\n\n$R_2 \\leftarrow R_2 - 2R_1$, $R_3 \\leftarrow R_3 - R_1$:\n$$\\begin{bmatrix} 1 & 2 & 2 \\\\ 0 & -1 & 0 \\\\ 0 & 0 & -1 \\end{bmatrix}$$\n\n**Three pivots** (one in each column) $\\implies$ all three columns are **linearly independent**.\n\nSince we have 3 independent vectors in $\\mathbb{R}^3$, the column space is the **entire space $\\mathbb{R}^3$**. This means for any vector $b$, the system $Bx = b$ has a solution — $B$ can "reach" any target.'},
];

const q6Steps = [
  {title: '(a) Why the zero vector makes things dependent', content: 'The first column of $C$ is the zero vector $\\begin{bmatrix} 0 \\\\ 0 \\\\ 0 \\end{bmatrix}$.\n\n**Important rule**: If any vector in your set is the zero vector, the set is **automatically linearly dependent**. Why? Because $1 \\cdot \\mathbf{0} + 0 \\cdot c_2 + 0 \\cdot c_3 + 0 \\cdot c_4 = \\mathbf{0}$ is a nontrivial combination (the first coefficient is 1, not zero).\n\nIntuitively: the zero vector points "nowhere" — it adds nothing, so it\'s always redundant.'},
  {title: '(a) Finding the column space of C', content: 'Since column 1 (zero vector) contributes nothing, we only need to look at columns 2, 3, and 4:\n$$c_2 = \\begin{bmatrix}1\\\\3\\\\0\\end{bmatrix}, \\quad c_3 = \\begin{bmatrix}2\\\\8\\\\4\\end{bmatrix}, \\quad c_4 = \\begin{bmatrix}2\\\\7\\\\2\\end{bmatrix}$$\n\nAre these three independent? Let\'s check if $c_4$ is a combination of $c_2$ and $c_3$:\n$$1 \\cdot c_2 + \\tfrac{1}{2} \\cdot c_3 = (1,3,0) + (1,4,2) = (2,7,2) = c_4 \\; \\checkmark$$\n\nSo $c_4$ is also redundant. Columns 2 and 3 are independent (neither is a scalar multiple of the other), so the rank is **2**.\n\nThe column space is a **plane through the origin in $\\mathbb{R}^3$**, spanned by $c_2$ and $c_3$.'},
  {title: 'Key Idea: "Is b in the column space?"', content: 'Asking "is $b$ in the column space of $D$?" is the same as asking "can we solve $Dx = b$?"\n\nIf a solution $x$ exists, then $b$ equals a linear combination of $D$\'s columns (with $x$ providing the weights). If no solution exists, $b$ is outside the column space — the columns of $D$ can\'t "reach" $b$.'},
  {title: '(b) Checking if b is in the column space of D', content: 'We solve $Dx = b$:\n$$\\begin{bmatrix} 2 & 1 \\\\ 6 & 5 \\\\ 2 & 4 \\end{bmatrix} \\begin{bmatrix} x_1 \\\\ x_2 \\end{bmatrix} = \\begin{bmatrix} 8 \\\\ 28 \\\\ 14 \\end{bmatrix}$$\n\n$D$ has 2 columns but 3 rows — so we have 3 equations for 2 unknowns. We need the system to be **consistent** (no contradictions).\n\nFrom row 1: $x_2 = 8 - 2x_1$\n\nSubstitute into row 2: $6x_1 + 5(8 - 2x_1) = 28 \\implies -4x_1 = -12 \\implies x_1 = 3$\n\nSo $x_2 = 8 - 6 = 2$.\n\n**Check row 3** (this is the consistency check): $2(3) + 4(2) = 6 + 8 = 14$ ✓\n\n**Yes**, $b$ is in the column space:\n$$b = 3 \\begin{bmatrix} 2 \\\\ 6 \\\\ 2 \\end{bmatrix} + 2 \\begin{bmatrix} 1 \\\\ 5 \\\\ 4 \\end{bmatrix}$$'},
  {title: 'Key Idea: How to Prove Linear Independence', content: 'To prove vectors are **linearly independent**, we use the definition directly:\n\n1. **Assume** a linear combination equals zero: $c_1 v_1 + c_2 v_2 + \\cdots = 0$\n2. **Show** that the only solution is $c_1 = c_2 = \\cdots = 0$\n\nIf the ONLY way to combine them to get zero is with all-zero weights, then no vector is redundant — they\'re independent.'},
  {title: '(c) Proof that u, u−v, 2u+3v−4w are independent', content: '**Given**: $u, v, w$ are linearly independent. **Show**: $u$, $u - v$, $2u + 3v - 4w$ are also independent.\n\n**Step 1**: Assume $a \\cdot u + b(u - v) + c(2u + 3v - 4w) = 0$.\n\n**Step 2**: Expand and group by the original vectors $u, v, w$:\n$$(a + b + 2c)\\,u + (-b + 3c)\\,v + (-4c)\\,w = 0$$\n\n**Step 3**: Since $u, v, w$ are linearly independent (given!), the ONLY way to get zero is if ALL coefficients are zero:\n$$\\begin{cases} a + b + 2c = 0 \\\\ -b + 3c = 0 \\\\ -4c = 0 \\end{cases}$$\n\n**Step 4**: Solve from the bottom up:\n- Equation 3: $c = 0$\n- Equation 2: $b = 3(0) = 0$\n- Equation 1: $a = -(0) - 2(0) = 0$\n\nSince $a = b = c = 0$ is the only solution, the vectors $u$, $u - v$, $2u + 3v - 4w$ are **linearly independent**. $\\blacksquare$\n\n**Why this works**: We used the independence of the original set ($u, v, w$) to force all the new coefficients to be zero. The key insight is that "reshuffling" independent vectors through invertible operations preserves independence.'},
];

interface QuestionProps {
  number: number;
  title: string;
  statement: string;
  steps: {title: string; content: string}[];
  animation?: {timeline: typeof q1Timeline; steps: typeof q1Steps};
}

function Question({number, title, statement, steps, animation}: QuestionProps) {
  const [open, setOpen] = useState(false);
  const [showAnim, setShowAnim] = useState(!!animation);

  return (
    <div style={{background: '#141428', borderRadius: 12, overflow: 'hidden', border: '1px solid #252550'}}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '16px 20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textAlign: 'left',
        }}
      >
        <span style={{
          background: '#FF6B4A',
          color: '#fff',
          fontWeight: 700,
          fontSize: 14,
          borderRadius: 8,
          padding: '4px 10px',
          flexShrink: 0,
        }}>
          Q{number}
        </span>
        <span style={{color: '#E8E8F0', fontSize: 15, fontWeight: 600, flex: 1}}>{title}</span>
        <span style={{color: '#8A8AA0', fontSize: 18}}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div style={{padding: '0 20px 20px'}}>
          <p style={{color: '#8A8AA0', fontSize: 14, margin: '0 0 16px', lineHeight: 1.6, whiteSpace: 'pre-wrap'}}>
            {statement}
          </p>

          {animation && (
            <div style={{marginBottom: 16, display: 'flex', gap: 8}}>
              <button
                onClick={() => setShowAnim(true)}
                style={{
                  padding: '6px 14px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
                  color: showAnim ? '#FF6B4A' : '#8A8AA0',
                  background: showAnim ? 'rgba(255,107,74,0.1)' : 'transparent',
                  border: showAnim ? '1px solid #FF6B4A' : '1px solid #252550',
                }}
              >
                Animation
              </button>
              <button
                onClick={() => setShowAnim(false)}
                style={{
                  padding: '6px 14px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
                  color: !showAnim ? '#FF6B4A' : '#8A8AA0',
                  background: !showAnim ? 'rgba(255,107,74,0.1)' : 'transparent',
                  border: !showAnim ? '1px solid #FF6B4A' : '1px solid #252550',
                }}
              >
                Text Solution
              </button>
            </div>
          )}

          {animation && showAnim ? (
            <AnimatedSolution timeline={animation.timeline} steps={animation.steps} />
          ) : (
            <SolutionDisplay steps={steps} />
          )}
        </div>
      )}
    </div>
  );
}

export default function HW2Page() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D1A',
      color: '#E8E8F0',
      padding: '40px 20px',
    }}>
      <div style={{maxWidth: 800, margin: '0 auto'}}>
        <a href="/" style={{color: '#8A8AA0', textDecoration: 'none', fontSize: 14}}>← MathVision</a>

        <h1 style={{fontSize: 28, fontWeight: 700, margin: '12px 0 4px'}}>
          MATH 2418 — Assignment #2
        </h1>
        <p style={{color: '#8A8AA0', fontSize: 14, margin: '0 0 32px'}}>
          Linear Algebra · Spring 2026 · Sections 1.2 & 1.3
        </p>

        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <Question
            number={1}
            title="Vectors u and v: dot product, lengths, angle, unit vector, parallel vectors"
            statement={"Let u = (−4, 2, 1) and v = (−1, −1, 3) be two vectors in R³.\n(a) Calculate the dot product u · v. What does it say about the angle?\n(b) Are u and v perpendicular, parallel, or neither?\n(c) Compute ||u|| and ||v||.\n(d) Compute cos θ.\n(e) Find the unit vector û in the direction of u.\n(f) Find two vectors parallel to v with length 7."}
            steps={q1Steps}
            animation={{timeline: q1Timeline, steps: q1Steps}}
          />

          <Question
            number={2}
            title="Bounds on dot product and distance; orthogonality system"
            statement={"(a) Let u and v be two vectors in R³ with ||u|| = 7 and ||v|| = 11.\n  (i) Find max and min of u · v.\n  (ii) Find max and min of ||u − v||.\n(b) Let u = (3,1), v = (1,5), w = (c,d). Find c, d such that u ⊥ w and v · w = 3."}
            steps={q2Steps}
          />

          <Question
            number={3}
            title="Matrix-vector product Ab: columns vs rows"
            statement={"Given A = [[7,−2,0],[1,2,5],[0,−1,2],[7,−2,1]] and b = (2,1,2), calculate Ab:\n(a) as a linear combination of columns of A\n(b) with entries as dot products of rows of A with b."}
            steps={q3Steps}
          />

          <Question
            number={4}
            title="Linear system Ax = b: write, solve, and column combination"
            statement={"Let A = [[2,0,3],[1,0,1],[−1,2,0]], x = (x₁,x₂,x₃), b = (b₁,b₂,b₃).\n(a) Write the linear system for Ax = b.\n(b) Solve the linear system.\n(c) Write b as a linear combination of the columns of A."}
            steps={q4Steps}
          />

          <Question
            number={5}
            title="Linear dependence/independence and column spaces"
            statement={"(a) Are columns of A = [[1,2,3],[1,4,5],[6,0,6]] dependent or independent? Describe the column space.\n(b) Are columns of B = [[1,2,2],[2,3,4],[1,2,1]] dependent or independent? Describe the column space."}
            steps={q5Steps}
          />

          <Question
            number={6}
            title="Column spaces, membership, and independence proof"
            statement={"(a) Are columns of C = [[0,1,2,2],[0,3,8,7],[0,0,4,2]] dependent/independent? Column space?\n(b) Is b = (8,28,14) in the column space of D = [[2,1],[6,5],[2,4]]?\n(c) If u, v, w are linearly independent, show u, u−v, 2u+3v−4w are also independent."}
            steps={q6Steps}
          />
        </div>
      </div>
    </div>
  );
}
