# Mathematical Model

The simulator models heat diffusion on a 2D rectangular plate.

## Governing Equation

For a temperature field `u(x, y, t)`, the heat equation is

```math
\frac{\partial u}{\partial t} =
\alpha \left(
\frac{\partial^2 u}{\partial x^2}
+
\frac{\partial^2 u}{\partial y^2}
\right)
```

where:

- `u(x, y, t)` is temperature
- `\alpha` is thermal diffusivity

## Discrete Update

On a uniform grid, the engine uses a standard five-point Laplacian and advances the field with an explicit update:

```math
u_{i,j}^{n+1}
=
u_{i,j}^{n}
+
\alpha \Delta t
\left(
u_{i-1,j}^{n}
+
u_{i+1,j}^{n}
+
u_{i,j-1}^{n}
+
u_{i,j+1}^{n}
-
4u_{i,j}^{n}
\right)
```

## Boundary Conditions

- `fixed`: the boundary is clamped to the ambient temperature
- `insulated`: the normal derivative is approximated as zero-flux

## Initial Conditions

The engine currently supports four presets:

- center hotspot
- left hot wall
- checkerboard
- hot ring

## Stability Note

The engine internally subdivides large requested timesteps into smaller substeps so the explicit update remains numerically stable for the selected diffusivity.
