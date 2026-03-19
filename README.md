# RQM Studio

**Visualizing Quaternionic Compilation**

> An interactive web-based visual studio that teaches and demonstrates how the **Quaternionic Compiler** works through live 3D geometry, gate operations, and compiler transformations.

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/React%20%2B%20R3F%20%2B%20Tailwind-TypeScript-blue)](package.json)

---

## What is RQM Studio?

RQM Studio is the canonical visual front-end for the **RQM Quantum Computing** stack. It allows researchers, educators, and developers to:

- **See** how a single-qubit state behaves as a quaternionic / SU(2) geometric object
- **Interact** with quantum gates as rotations on the unit hypersphere
- **Understand** that quantum compilation is geometric simplification — not just symbolic rewriting
- **Explore** the relationship between circuit syntax, quaternion form, axis-angle form, geometric trajectory, and compiled output

## Why RQM Studio?

Most quantum computing interfaces are either too abstract (pure circuit diagrams) or too low-level (raw matrices). RQM Studio bridges this gap by showing that:

- Gates are **structured rotations** in SU(2)
- Compilation is **path reduction on the hypersphere**
- Optimization rules have **geometric meaning** (fusion, cancellation, normalization)

This makes quantum compilation intuitive and visually verifiable.

## Relationship to the Quaternionic Compiler

RQM Studio is the visual layer of the **RQM Quaternionic Compiler** pipeline:

```
rqm-compiler  →  rqm-studio (this repo)
     ↑                 ↓
rqm-core       visual verification
     ↑                 ↓
rqm-qiskit     educational overlay
```

The math layer in `src/math/` mirrors the compiler's quaternion and SU(2) representations, making it straightforward to plug in the real compiler backend.

## MVP Features

| Feature | Status |
|---------|--------|
| 3D quaternionic state visualization (Bloch sphere) | ✅ |
| Interactive orbit controls | ✅ |
| Gate stepping (H, X, Y, Z, S, T, Rx, Ry, Rz) | ✅ |
| Quaternion / axis-angle readouts | ✅ |
| Educational compiler panel | ✅ |
| Optimization demo (identity removal, inverse cancellation, axis fusion) | ✅ |
| Dark navy + cyan theme | ✅ |
| Zustand state management | ✅ |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| 3D | React Three Fiber + Three.js + @react-three/drei |
| Styling | Tailwind CSS |
| State | Zustand |
| Animations | Framer Motion |
| Deployment | Vercel |

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open [http://localhost:5173](http://localhost:5173) to view the studio.

## Folder Architecture

```
src/
  app/             # App shell, layout, routes
    App.tsx        # Root component
    layout/        # Header, footer, layout wrappers
  components/      # Reusable UI components
    ui/            # Primitives: Badge, DataRow, SectionHeader
    panels/        # ControlPanel (left), InspectorPanel (right)
    circuit/       # CircuitStrip (bottom)
    overlays/      # OptimizationDemo overlay
    controls/      # Future: parameter sliders, gate palette
  features/        # Self-contained feature modules
    visualizer/    # Future: extended visualization features
    compiler/      # Future: compiler pass explorer
    state-inspector/ # Future: density matrix, measurement
    gate-library/  # Future: full gate catalogue
  math/            # Pure math utilities (no React)
    quaternion/    # Core quaternion operations
    su2/           # SU(2) gate representations
    compiler/      # Compiler rewrite rules
    circuit/       # Future: circuit graph model
    transforms/    # Future: unitary decompositions
  render/          # Three.js / R3F scene components
    scene/         # Scene, QuantumSphere, camera setup
    objects/       # Future: trajectory arc, rotation axis
    materials/     # Future: shader materials
    helpers/       # Future: grid, measurement indicators
  store/           # Zustand stores
  hooks/           # Custom React hooks
  utils/           # Shared utilities
  styles/          # Global CSS, Tailwind base
  data/            # Static data: default circuit, compiler notes
  types/           # TypeScript interfaces
  assets/          # Static assets (images, fonts)
```

## Plugging In Replit Files

When migrating code from the Replit prototype:

1. **Quaternion math** → `src/math/quaternion/` — drop in any pure quaternion utilities, replacing or extending `quaternion.ts`
2. **Gate definitions** → `src/math/su2/gates.ts` — add parametric or composite gates here
3. **Compiler logic** → `src/math/compiler/rules.ts` — replace the lightweight rules with the real compiler passes
4. **3D scene** → `src/render/scene/` — replace `QuantumSphere.tsx` with more detailed geometry
5. **UI state** → `src/store/studioStore.ts` — extend the Zustand store with new state slices

## Roadmap

- [ ] Full quaternionic gate geometry with animated rotation arcs
- [ ] Multi-qubit visualizations (entanglement on product space)
- [ ] Compiler pass explorer (step through each optimization pass)
- [ ] Decomposition comparison (original vs. compiled trajectory)
- [ ] Circuit import/export (QASM, JSON)
- [ ] Side-by-side classical vs. quaternionic compilation
- [ ] Animation of shortest-geodesic gate fusion on SU(2)
- [ ] Integration with `rqm-core`, `rqm-compiler`, and `rqm-qiskit`
- [ ] Custom circuit builder (drag-and-drop gates)
- [ ] Density matrix and measurement panel
- [ ] Export to PDF / sharable link

## License

MIT © RQM Technologies
