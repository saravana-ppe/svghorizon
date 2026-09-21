# Limits, continuity and differentiability

## What a limit means

A limit asks what value a function approaches as x moves close to some number,
whether or not the function is actually defined at that number.

## Standard limits worth memorising

- `lim (sin x)/x = 1` as x approaches 0
- `lim (1 - cos x)/x^2 = 1/2` as x approaches 0
- `lim (e^x - 1)/x = 1` as x approaches 0
- `lim (1 + 1/n)^n = e` as n approaches infinity

## Continuity

A function is continuous at a point when three things are all true:

- the function is defined there
- the limit exists there
- the limit equals the function's value there

## Differentiability

If a function is differentiable at a point, it is continuous there. The reverse is
not true. The classic counterexample is `f(x) = |x|` at x = 0, which is continuous
but has no derivative because the left and right slopes disagree.
