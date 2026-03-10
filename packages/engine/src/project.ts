import {makeProject} from '@motion-canvas/core';
import matrixTransform from './scenes/linalg/matrixTransform?scene';
import eigenvalues from './scenes/linalg/eigenvalues?scene';
import limits from './scenes/calculus/limits?scene';

export default makeProject({
  scenes: [matrixTransform, eigenvalues, limits],
});
