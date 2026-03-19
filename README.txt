RQM Spinor Visualizer — Source Export
=======================================
Exported from RQM Technologies platform (rqmtechnologies.com)
Route: /rqm-spinor-visualizer

FILE MANIFEST
-------------

pages/RQMSpinorVisualizer.tsx  (1864 lines)
  Main page component for the RQM Spinor Visualizer.
  Route: /rqm-spinor-visualizer
  Contains:
    - Full interactive 3D Canvas rendering (HTML5 Canvas API, no external 3D lib)
    - Quaternionic spinor mathematics: SU(2) → SO(3) double-cover visualization
    - Real-time rotation via quaternion multiplication (q * v * q_conjugate)
    - Hopf fibration visualization on S³ projected to R³
    - Stereographic projection of 3-sphere
    - Bloch sphere rendering for spinor state representation
    - Interactive controls: rotation speed, phase, polar/azimuthal angles
    - RQM chat widget integration
    - Navigation breadcrumb

pages/EigenSpinor.tsx  (257 lines)
  Page component for the Eigen-Spinor visualization.
  Route: /eigen-spinor
  Wraps the EigenSpinorVisual component with page layout, breadcrumb, and
  explanatory text about eigen-spinors in the RQM framework.

pages/QuaternionicSpinor.tsx  (163 lines)
  Theory and mathematics reference page.
  Route: /quaternionic-spinor
  Contains:
    - Mathematical definitions of quaternionic spinors
    - Pauli matrix representation
    - Spinor transformation rules under SU(2)
    - Connection to the AGQF (Attractor-Governed Quaternionic Framework)
    - Formatted equations and derivations

pages/QuaternionicSpinors.tsx  (94 lines)
  Overview/index page for the quaternionic spinors topic.
  Route: /quaternionic-spinors
  Entry point listing related resources, links to the visualizer and theory pages.

components/EigenSpinorVisual.tsx  (482 lines)
  Reusable React component: animated eigen-spinor visualization.
  Canvas-based animation showing:
    - Spinor rotation in the complex plane
    - Eigenvalue trajectories
    - Phase evolution under quaternionic operators
  Uses: attached equation reference image (assets/ folder)

assets/Quaternionic Spinor copy_1759872095649.jpg
  Reference equation image displayed in EigenSpinorVisual.tsx.
  Shows the quaternionic spinor eigen-equation used as the mathematical
  foundation of the EigenSpinorVisual component.

TECH STACK
----------
  Framework:  React 18 + TypeScript
  Routing:    wouter
  Rendering:  HTML5 Canvas API (requestAnimationFrame)
  UI:         shadcn/ui + Radix UI + Tailwind CSS
  Icons:      lucide-react
  Build:      Vite

MATH OVERVIEW
-------------
The RQM Spinor Visualizer models spinors as elements of the quaternion algebra H,
where a spinor ψ ∈ H acts on a vector v ∈ R³ (embedded as a pure quaternion) via:

    v' = q · v · q*    where q = (cos θ/2) + (sin θ/2)(ai + bj + ck), |q| = 1

This is the double-cover homomorphism SU(2) → SO(3), meaning every 3D rotation
corresponds to exactly two unit quaternions ±q.

The Hopf fibration S³ → S² is visualized by projecting the 3-sphere of unit
quaternions onto 3D space via stereographic projection, revealing the fiber
bundle structure of spinors.

The eigen-spinor component visualizes spinors as eigenstates of the quaternionic
operators σ_i (analogs of Pauli matrices) satisfying:

    σ_x = i,  σ_y = j,  σ_z = k    (quaternion basis elements)
    σ_i · σ_j = ε_ijk σ_k + δ_ij

RQM Technologies LLC
rqmtechnologies.com
