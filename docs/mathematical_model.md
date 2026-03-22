# Mathematical Model

This page is intentionally a placeholder for the future heat-diffusion model.

## Planned Core Equation

For a temperature field `u(x, t)` in one spatial dimension, the standard heat equation is

```math
\frac{\partial u}{\partial t} = \alpha \frac{\partial^2 u}{\partial x^2}
```

where:

- `u(x, t)` is temperature
- `\alpha` is thermal diffusivity

For a 2D plate, the model becomes

```math
\frac{\partial u}{\partial t} =
\alpha \left(
\frac{\partial^2 u}{\partial x^2}
+
\frac{\partial^2 u}{\partial y^2}
\right)
```

## Planned Numerical Direction

A straightforward first implementation would be:

1. discretize the spatial domain into a grid
2. approximate second derivatives with finite differences
3. advance time using an explicit scheme or a more stable alternative
4. stream the temperature grid from the C++ engine to the frontend

## Notes

This repository was copied from the pendulum project as a structural scaffold.
The actual derivation and numerical notes for `Heat Diffusion Lab` still need to be written by replacing the copied mechanics-specific logic.
