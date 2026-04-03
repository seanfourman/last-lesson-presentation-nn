# The Geometry of Digits

Open `presentation/index.html` in a browser.

## What this is

This is a small interactive presentation demo for the assignment:

- Cover `MNIST`
- Explain `Solution Space`
- Keep it fresh and not just repeat the lecture

## Core idea

Instead of presenting MNIST and solution space as two separate theory topics, present one story:

1. A model first fails with a simple straight decision rule.
2. A hidden layer lets the decision border become richer.
3. MNIST is the same story at a much larger scale: each 28x28 image becomes a point in a huge space.
4. Neural networks succeed by shaping that space into digit territories.

## Suggested spoken hook

"MNIST was not important because handwritten digits are the hardest problem in the world.
MNIST was important because it gave deep learning a small, visible, shared battlefield."

## How to use live

1. Start on the colony map and click `Test Straight Rule`.
2. Show that a flat separator cannot isolate the safe region.
3. Click `Unlock Hidden Layer`.
4. Move to the digit section.
5. Stamp a few digits or draw one live.
6. Show that the drawing lands in a digit territory with probabilities.
7. Close with the historical importance cards.

## Important note

The digit territory map is a teaching visualization, not a trained production MNIST model.
That is a feature, not a bug: it keeps the presentation focused on intuition.
