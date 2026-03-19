import { useState, useEffect, useRef } from 'react';
import {
  quatToSpinor as _quatToSpinor,
  spinorToBloch as _spinorToBloch,
  quatToBloch as _quatToBloch,
  formatComplex,
} from '@/math/spinor/spinor';

interface SpinorConfig {
  name: string;
  u: { x: number; y: number; z: number };
  omega: number;
  color: string;
  phi0: number;
  radiusScale?: number;
}

export function QuaternionicSpinorVisual() {
  const [isDragging, setIsDragging] = useState(false);
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [, setStarTick] = useState(0); // Lightweight tick for star animation re-renders
    
  // Quantum gate control
  const [manualMode, setManualMode] = useState(false);
  const [manualQuat] = useState<number[]>([1, 0, 0, 0]); // Identity quaternion
  
  // Custom circuit builder state
  const [customCircuit, setCustomCircuit] = useState<string[]>([]);
  const [customCircuitRunning, setCustomCircuitRunning] = useState(false);
  
  // Custom state builder
  const [customMode, setCustomMode] = useState(false);
  const [customU, setCustomU] = useState({ x: 0, y: 0, z: 1 });
  const [customPhi, setCustomPhi] = useState(1.0);
  
  // Path tracing
  const [pathHistory, setPathHistory] = useState<Array<{x: number, y: number, z: number}>>([]);
  const [showPath, setShowPath] = useState(true);
  
  // Hypersphere representation mode (starts enabled)
  const [hypersphereMode, setHypersphereMode] = useState(true);
  
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // Camera quaternion - elevated 3/4 view to keep path tracing visible
  // Combines ~25° rotation around Y-axis with ~15° upward tilt (X-axis rotation)
  // This ensures the white path is visible regardless of gate rotation axis
  const viewQuatRef = useRef<[number, number, number, number]>([0.404, 0.058, 0.905, 0.128]); // Rotated 90° right
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);
  const starsRef = useRef<Array<{ x: number; y: number; radius: number; opacity: number; vx: number; vy: number }>>([]);
  const phaseStartTimeRef = useRef(performance.now());
  
  // Refs for path tracking to avoid effect restarts
  const currentStateIndexRef = useRef(currentStateIndex);
  const isAnimatingRef = useRef(isAnimating);
  const transitionProgressRef = useRef(transitionProgress);
  const customModeRef = useRef(customMode);
  const customURef = useRef(customU);
  const customPhiRef = useRef(customPhi);
  const hypersphereModeRef = useRef(hypersphereMode);
  const spinorsRef = useRef<SpinorConfig[]>([]);
  const visualScaleRef = useRef(1.0); // Track current visual scale for path tracing

  // Sync refs with state for path tracking
  useEffect(() => {
    currentStateIndexRef.current = currentStateIndex;
    isAnimatingRef.current = isAnimating;
    transitionProgressRef.current = transitionProgress;
    customModeRef.current = customMode;
    customURef.current = customU;
    customPhiRef.current = customPhi;
    hypersphereModeRef.current = hypersphereMode;
  }, [currentStateIndex, isAnimating, transitionProgress, customMode, customU, customPhi, hypersphereMode]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const W = isMobile ? 360 : isTablet ? 600 : 900;
  const H = isMobile ? 480 : isTablet ? 550 : 700;
  const FOV = 600;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Generate stars once with uniform drift to the left
    const numStars = 200;
    const stars = [];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        radius: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.6 + 0.2,
        vx: -0.35, // Uniform drift to the left, 75% faster
        vy: 0
      });
    }
    starsRef.current = stars;
  }, []);

  // Utility: normalize axis vector
  const normalizeAxis = (axis: { x: number; y: number; z: number }) => {
    const len = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
    return { x: axis.x / len, y: axis.y / len, z: axis.z / len };
  };

  // ============================================================================
  // SPINOR AND BLOCH VECTOR COMPUTATIONS
  // (thin adapters over the shared src/math/spinor/spinor module, converting
  //  from the number[] quaternion format used internally here)
  // ============================================================================

  // Convert quaternion array [w,x,y,z] to spinor coefficients (α, β)
  const quatToSpinor = (q: number[]) =>
    _quatToSpinor({ w: q[0], x: q[1], y: q[2], z: q[3] });

  // Convert spinor coefficients to a Bloch vector
  const spinorToBloch = _spinorToBloch;

  // Convenience: directly compute Bloch vector from quaternion array
  const quatToBloch = (q: number[]) =>
    _quatToBloch({ w: q[0], x: q[1], y: q[2], z: q[3] });

  // 8-gate sequence with quaternionic evolution: q̇ = ½qΩ where Ω = 2φû
  // Alternating light blue (#a8d4f0) and light green (#a8f0b8) gate box colors
  // All φ values chosen so cos(φ) ≠ 0, ensuring sphere visibility
  // q = cos(φ) + û·sin(φ) - quaternion rotation formula
  const defaultSpinors: SpinorConfig[] = [
    { name: "I", u: { x: 0, y: 0, z: 1 }, omega: 0, color: "#a8d4f0", phi0: 0, radiusScale: 0.609 }, // Pure |0⟩ state - identity
    { name: "X₀", u: { x: 1, y: 0, z: 0 }, omega: 0, color: "#a8f0b8", phi0: 2 * Math.PI / 5, radiusScale: 0.696 }, // X-axis rotation by 2π/5, cos(2π/5)≈0.31
    { name: "X₁", u: { x: 1, y: 0, z: 0 }, omega: 0, color: "#a8d4f0", phi0: 2 * Math.PI / 3, radiusScale: 0.928 }, // cos(2π/3)=-0.5 → ORANGE sphere
    { name: "Y₂", u: { x: 0, y: 1, z: 0 }, omega: 0, color: "#a8f0b8", phi0: Math.PI / 6, radiusScale: 0.696 }, // cos(π/6)=0.866
    { name: "Z₃", u: { x: 0, y: 0, z: 1 }, omega: 0, color: "#a8d4f0", phi0: Math.PI / 4, radiusScale: 0.928 }, // cos(π/4)=0.707
    { name: "H₄", u: { x: 0.707107, y: 0, z: 0.707107 }, omega: 0, color: "#a8f0b8", phi0: 3 * Math.PI / 4, radiusScale: 0.928 }, // cos(3π/4)=-0.707 → ORANGE sphere
    { name: "T₅", u: { x: 0, y: 0, z: 1 }, omega: 0, color: "#a8d4f0", phi0: Math.PI / 5, radiusScale: 0.861 }, // cos(π/5)=0.809
    { name: "Y₆", u: { x: 0, y: 1, z: 0 }, omega: 0, color: "#a8f0b8", phi0: Math.PI / 3, radiusScale: 0.861 }, // Y-axis rotation by π/3, cos(π/3)=0.5
    { name: "Xπ", u: { x: 1, y: 0, z: 0 }, omega: 0, color: "#a8d4f0", phi0: 5 * Math.PI / 6, radiusScale: 0.928 }, // cos(5π/6)=-0.866 → ORANGE sphere
  ];
  
  // Active spinors - uses custom circuit when running, otherwise default
  const spinors: SpinorConfig[] = customCircuitRunning && customCircuit.length > 0
    ? customCircuit.map((gateName) => {
        const baseSpinor = defaultSpinors.find(s => s.name === gateName);
        if (baseSpinor) return { ...baseSpinor };
        return defaultSpinors[0]; // fallback
      })
    : defaultSpinors;
  
  // For display in the circuit diagram - show custom when building, default otherwise
  const displaySpinors: SpinorConfig[] = customCircuit.length > 0
    ? customCircuit.map((gateName) => {
        const baseSpinor = defaultSpinors.find(s => s.name === gateName);
        if (baseSpinor) return { ...baseSpinor };
        return defaultSpinors[0];
      })
    : defaultSpinors;

  // Keep spinorsRef in sync with current spinors for path tracking
  useEffect(() => {
    spinorsRef.current = spinors;
  }, [spinors, customCircuitRunning, customCircuit]);

  // Easing function for smooth S-curve transitions
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Compute color from u-axis direction and phi magnitude
  const computeColorFromAxis = (u: { x: number; y: number; z: number }, phi: number): string => {
    // Map z-component to red (up +1) through purple (down -1)
    // Map azimuthal angle to cardinal colors: Orange(N), Yellow(E), Green(S), Blue(W)
    
    const z = u.z; // Vertical component (-1 to +1)
    const azimuthal = Math.atan2(u.y, u.x); // Angle in x-y plane (-π to π)
    
    // Normalize azimuthal to 0-360 degrees
    let azimuthDeg = (azimuthal * 180 / Math.PI + 360) % 360;
    
    // Calculate base hue based on z and azimuthal
    let hue;
    if (Math.abs(z) > 0.9) {
      // Nearly vertical - pure red or purple
      hue = z > 0 ? 0 : 280; // Red up, Purple down
    } else {
      // Mix based on azimuthal direction for cardinal colors
      // 0° (N) = Orange (30), 90° (E) = Yellow (60), 180° (S) = Green (120), 270° (W) = Blue (240)
      const cardinalHue = azimuthDeg * (240 / 360) + 30; // Map 0-360 to cardinal colors
      
      // Blend with red/purple based on z component
      if (z > 0) {
        // Blend towards red (hue 0)
        hue = cardinalHue * (1 - z * z);
      } else {
        // Blend towards purple (hue 280)
        hue = cardinalHue * (1 - z * z) + 280 * (z * z);
      }
    }
    
    // Brightness based on phi (0 to ~2π)
    const maxPhi = 2.5; // Approximate max phi in our states
    const brightness = 30 + (phi / maxPhi) * 50; // 30% to 80% brightness
    const saturation = 40 + (phi / maxPhi) * 50; // 40% to 90% saturation
    
    return `hsl(${hue}, ${saturation}%, ${brightness}%)`;
  };

  // Separate effect for star drift animation (runs at 40fps for performance)
  useEffect(() => {
    let animationId: number;
    let lastUpdateTime = 0;
    const FRAME_INTERVAL = 25; // 40fps = 25ms between frames
    
    const updateStars = (currentTime: number) => {
      // Throttle to 40fps
      if (currentTime - lastUpdateTime >= FRAME_INTERVAL) {
        lastUpdateTime = currentTime;
        
        // Update star positions for drifting animation
        starsRef.current.forEach(star => {
          star.x += star.vx;
          star.y += star.vy;
          
          // Wrap around screen edges
          if (star.x < 0) star.x += W;
          if (star.x > W) star.x -= W;
          if (star.y < 0) star.y += H;
          if (star.y > H) star.y -= H;
        });
        
        // Trigger re-render to display updated star positions
        setStarTick(tick => tick + 1);
      }
      
      animationId = requestAnimationFrame(updateStars);
    };
    
    animationId = requestAnimationFrame(updateStars);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [W, H]);

  useEffect(() => {
    // Skip auto-cycling when in manual gate control mode or custom mode
    if (manualMode || customMode) return;
    
    let animationId: number;
    const STATIC_DURATION = 3125; // 3.125 seconds for static state (25% slower)
    const TRANSITION_DURATION = 6250; // 6.25 seconds for transition (25% slower)
    
    const animate = () => {
      const now = performance.now();
      const elapsed = now - phaseStartTimeRef.current;
      const currentPhaseDuration = isAnimating ? TRANSITION_DURATION : STATIC_DURATION;
      
      if (elapsed >= currentPhaseDuration) {
        // Phase complete - switch between static and animating
        if (isAnimating) {
          // Just finished animating - move to next state and hold static
          setCurrentStateIndex(prev => (prev + 1) % spinors.length);
          setIsAnimating(false);
          setTransitionProgress(0);
        } else {
          // Just finished holding - start animating to next state
          setIsAnimating(true);
          setTransitionProgress(0);
        }
        phaseStartTimeRef.current = now;
      } else if (isAnimating) {
        // Update transition progress (0 to 1)
        setTransitionProgress(elapsed / TRANSITION_DURATION);
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [spinors.length, isAnimating, manualMode, customMode]);

  // Path tracking effect - update path history on each frame
  // Uses refs for frequently-changing values to avoid effect restarts
  useEffect(() => {
    if (!showPath) return;
    
    let animationId: number;
    const MAX_PATH_LENGTH = 80;
    
    const updatePath = () => {
      // Get current state to extract u, phi, and visualScale (using refs for performance)
      let u, phi, visualScale = 1.0;
      if (customModeRef.current) {
        const customU = customURef.current;
        const uLen = Math.sqrt(customU.x * customU.x + customU.y * customU.y + customU.z * customU.z);
        u = { x: customU.x / uLen, y: customU.y / uLen, z: customU.z / uLen };
        phi = customPhiRef.current;
        visualScale = 1.0; // Custom mode uses default scale
      } else {
        const stateIndex = currentStateIndexRef.current;
        const activeSpinors = spinorsRef.current;
        if (!activeSpinors.length) return; // Guard against empty array
        const currentState = activeSpinors[stateIndex % activeSpinors.length];
        u = { x: currentState.u.x, y: currentState.u.y, z: currentState.u.z };
        phi = currentState.phi0;
        visualScale = currentState.radiusScale ?? 1.0;
        
        // If animating, interpolate between current and next state
        if (isAnimatingRef.current) {
          const nextState = activeSpinors[(stateIndex + 1) % activeSpinors.length];
          const easedProgress = easeInOutCubic(transitionProgressRef.current);
          u = {
            x: currentState.u.x * (1 - easedProgress) + nextState.u.x * easedProgress,
            y: currentState.u.y * (1 - easedProgress) + nextState.u.y * easedProgress,
            z: currentState.u.z * (1 - easedProgress) + nextState.u.z * easedProgress,
          };
          phi = currentState.phi0 * (1 - easedProgress) + nextState.phi0 * easedProgress;
          
          // Interpolate visualScale
          const nextScale = nextState.radiusScale ?? 1.0;
          visualScale = visualScale * (1 - easedProgress) + nextScale * easedProgress;
          
          // Normalize interpolated u
          const uLen = Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z);
          u.x /= uLen; u.y /= uLen; u.z /= uLen;
        }
      }
      
      // Update ref for use in path radius calculation
      visualScaleRef.current = visualScale;
      
      // Calculate the tip position
      // In hypersphere mode: radius = |cos φ| * 1.953125 * visualScale to match the sphere surface exactly
      // In normal mode: scaled by phi * 1.5
      const hypersphereActive = hypersphereModeRef.current;
      const pathRadius = hypersphereActive 
        ? Math.abs(Math.cos(phi)) * 1.953125 * visualScale 
        : phi * 1.5;
      const tipPos = { 
        x: u.x * pathRadius, 
        y: u.y * pathRadius, 
        z: u.z * pathRadius 
      };
      
      setPathHistory(prev => {
        // Only add if position changed significantly (avoid duplicates during static phases)
        const lastPos = prev[prev.length - 1];
        if (lastPos) {
          const dx = tipPos.x - lastPos.x;
          const dy = tipPos.y - lastPos.y;
          const dz = tipPos.z - lastPos.z;
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (dist < 0.01) return prev; // Too close, skip
        }
        
        const newPath = [...prev, tipPos];
        return newPath.length > MAX_PATH_LENGTH ? newPath.slice(-MAX_PATH_LENGTH) : newPath;
      });
      
      animationId = requestAnimationFrame(updatePath);
    };
    
    animationId = requestAnimationFrame(updatePath);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [showPath]);

  const quatMul = (a: number[], b: number[]): number[] => {
    return [
      a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
      a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
      a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
      a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
    ];
  };

  // Quaternion slerp (spherical linear interpolation)
  const quatSlerp = (q1: number[], q2: number[], t: number): number[] => {
    let dot = q1[0] * q2[0] + q1[1] * q2[1] + q1[2] * q2[2] + q1[3] * q2[3];
    
    // If dot < 0, negate q2 to take the shorter path
    let q2adj = [...q2];
    if (dot < 0) {
      dot = -dot;
      q2adj = [-q2[0], -q2[1], -q2[2], -q2[3]];
    }
    
    // If quaternions are very close, use linear interpolation
    if (dot > 0.9995) {
      const result = [
        q1[0] + t * (q2adj[0] - q1[0]),
        q1[1] + t * (q2adj[1] - q1[1]),
        q1[2] + t * (q2adj[2] - q1[2]),
        q1[3] + t * (q2adj[3] - q1[3]),
      ];
      const len = Math.sqrt(result[0] * result[0] + result[1] * result[1] + result[2] * result[2] + result[3] * result[3]);
      return [result[0] / len, result[1] / len, result[2] / len, result[3] / len];
    }
    
    // Slerp
    const theta = Math.acos(dot);
    const sinTheta = Math.sin(theta);
    const w1 = Math.sin((1 - t) * theta) / sinTheta;
    const w2 = Math.sin(t * theta) / sinTheta;
    
    return [
      w1 * q1[0] + w2 * q2adj[0],
      w1 * q1[1] + w2 * q2adj[1],
      w1 * q1[2] + w2 * q2adj[2],
      w1 * q1[3] + w2 * q2adj[3],
    ];
  };

  const rotateVecByQuat = (v: [number, number, number], q: number[]): [number, number, number] => {
    const qConj = [q[0], -q[1], -q[2], -q[3]];
    const vq = [0, v[0], v[1], v[2]];
    const tmp = quatMul(q, vq);
    const res = quatMul(tmp, qConj);
    return [res[1], res[2], res[3]];
  };

  const project3D = (p: [number, number, number], extraQuat?: number[]): { x: number; y: number; z: number } => {
    let v3 = p;
    if (extraQuat) {
      v3 = rotateVecByQuat(p, extraQuat);
    }
    v3 = rotateVecByQuat(v3, viewQuatRef.current);
    const scale = isMobile ? 160 : isTablet ? 220 : 280;
    const v = [v3[0] * scale, v3[1] * scale, v3[2] * scale + 300];
    const persp = FOV / (FOV + v[2]);
    return {
      x: v[0] * persp + W / 2,
      y: -v[1] * persp + H / 2,
      z: v[2]
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastMouseRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.01;
    const axis: [number, number, number] = [dy, dx, 0];
    const len = Math.sqrt(axis[0] ** 2 + axis[1] ** 2 + axis[2] ** 2);
    
    if (len > 0) {
      const normAxis: [number, number, number] = [axis[0] / len, axis[1] / len, axis[2] / len];
      const angle = len * sensitivity;
      const s = Math.sin(angle / 2);
      const dq = [Math.cos(angle / 2), normAxis[0] * s, normAxis[1] * s, normAxis[2] * s];
      viewQuatRef.current = quatMul(dq, viewQuatRef.current) as [number, number, number, number];
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    lastMouseRef.current = null;
  };

  const renderSphere = (extraQuat: number[] | null, opacity: number, strokeColor: string, strokeWidth: number, fillNorthern?: boolean, scale: number = 1.0) => {
    const sphereElements: JSX.Element[] = [];
    const latitudes = 24;
    const longitudes = 32;

    // Wireframe with Z as polar axis (matching |0⟩ direction and blue unit vector)
    // Latitude lines (circles of constant z)
    for (let i = 0; i <= latitudes; i++) {
      const theta = (i / latitudes) * Math.PI;
      const r = Math.sin(theta) * scale;
      const z = Math.cos(theta) * scale;  // z is polar axis (|0⟩ at +z)
      
      const pts: Array<{ x: number; y: number; z: number }> = [];
      for (let j = 0; j <= longitudes; j++) {
        const phi = (j / longitudes) * Math.PI * 2;
        const x = r * Math.cos(phi);
        const y = r * Math.sin(phi);
        pts.push(project3D([x, y, z], extraQuat || undefined));
      }
      
      const d = pts.map((pt, pidx) => `${pidx === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`).join(' ');
      sphereElements.push(<path key={`lat-${i}`} d={d} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" opacity={opacity} />);
    }

    // Longitude lines (meridians)
    for (let j = 0; j < longitudes; j++) {
      const phi = (j / longitudes) * Math.PI * 2;
      const pts: Array<{ x: number; y: number; z: number }> = [];
      
      for (let i = 0; i <= latitudes; i++) {
        const theta = (i / latitudes) * Math.PI;
        const r = Math.sin(theta) * scale;
        const z = Math.cos(theta) * scale;  // z is polar axis
        const x = r * Math.cos(phi);
        const y = r * Math.sin(phi);
        pts.push(project3D([x, y, z], extraQuat || undefined));
      }
      
      const d = pts.map((pt, pidx) => `${pidx === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`).join(' ');
      sphereElements.push(<path key={`lon-${j}`} d={d} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" opacity={opacity} />);
    }

    // Northern hemisphere fill (z > 0, matching |0⟩ region)
    if (fillNorthern && extraQuat) {
      const northernCap: JSX.Element[] = [];
      for (let i = 0; i < latitudes / 2; i++) {
        const theta1 = (i / latitudes) * Math.PI;
        const theta2 = ((i + 1) / latitudes) * Math.PI;
        
        for (let j = 0; j < longitudes; j++) {
          const phi1 = (j / longitudes) * Math.PI * 2;
          const phi2 = ((j + 1) / longitudes) * Math.PI * 2;
          
          // With z as polar axis: x = r*cos(phi), y = r*sin(phi), z = cos(theta)
          const p1 = project3D([Math.sin(theta1) * Math.cos(phi1) * scale, Math.sin(theta1) * Math.sin(phi1) * scale, Math.cos(theta1) * scale], extraQuat);
          const p2 = project3D([Math.sin(theta1) * Math.cos(phi2) * scale, Math.sin(theta1) * Math.sin(phi2) * scale, Math.cos(theta1) * scale], extraQuat);
          const p3 = project3D([Math.sin(theta2) * Math.cos(phi2) * scale, Math.sin(theta2) * Math.sin(phi2) * scale, Math.cos(theta2) * scale], extraQuat);
          const p4 = project3D([Math.sin(theta2) * Math.cos(phi1) * scale, Math.sin(theta2) * Math.sin(phi1) * scale, Math.cos(theta2) * scale], extraQuat);
          
          const path = `M ${p1.x},${p1.y} L ${p2.x},${p2.y} L ${p3.x},${p3.y} L ${p4.x},${p4.y} Z`;
          northernCap.push(<path key={`cap-${i}-${j}`} d={path} fill={strokeColor} opacity={0.15} stroke="none" />);
        }
      }
      sphereElements.push(...northernCap);
    }

    return sphereElements;
  };

  const renderStars = () => {
    return starsRef.current.map((star, i) => (
      <circle
        key={`star-${i}`}
        cx={star.x}
        cy={star.y}
        r={star.radius}
        fill="white"
        opacity={star.opacity}
      />
    ));
  };

  // Render path trail for quaternion tip
  const renderPath = () => {
    if (!showPath || pathHistory.length < 2) return null;
    
    const pathElements: JSX.Element[] = [];
    
    for (let i = 0; i < pathHistory.length - 1; i++) {
      const p1 = pathHistory[i];
      const p2 = pathHistory[i + 1];
      
      // Project both points
      const proj1 = project3D([p1.x, p1.y, p1.z]);
      const proj2 = project3D([p2.x, p2.y, p2.z]);
      
      // Gradient opacity: newest (end) = 1.0, oldest (start) = 0.3
      const t = i / (pathHistory.length - 1);
      const opacity = 0.3 + t * 0.7;
      const strokeWidth = 3 + t * 5; // Thicker at the end (2x thickness)
      
      // White base path
      pathElements.push(
        <line
          key={`path-${i}`}
          x1={proj1.x}
          y1={proj1.y}
          x2={proj2.x}
          y2={proj2.y}
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          opacity={opacity}
          strokeLinecap="round"
        />
      );
    }
    
    return pathElements;
  };

  // Render Bloch sphere for sidebar (compact version)
  const renderBlochSphere = () => {
    const size = 280;
    const quat = getCurrentQuaternion();
    
    // Compute Bloch vector from spinor coefficients (α, β)
    // This is the mathematically correct derivation from the quaternion state
    const bloch = quatToBloch(quat);
    const bx = bloch.bx;
    const by = bloch.by;
    const bz = bloch.bz;
    
    // 3D projection for Bloch sphere with z-axis vertical (standard orientation)
    // |0⟩ at top (z=+1), |1⟩ at bottom (z=-1)
    // Slight tilt for 3D perspective view
    const tiltAngle = Math.PI / 8; // 22.5 degrees tilt toward viewer
    const cosTilt = Math.cos(tiltAngle);
    const sinTilt = Math.sin(tiltAngle);
    
    const projectBloch = (p: [number, number, number]): { x: number; y: number } => {
      // Apply tilt rotation around x-axis for 3D effect
      const x = p[0];
      const z = p[1] * sinTilt + p[2] * cosTilt;
      
      const scale = 100;
      const persp = 1.2;
      return {
        x: x * scale * persp + size / 2,
        y: -z * scale * persp + size / 2  // z is vertical, negated for screen coords
      };
    };
    
    // Draw sphere wireframe with z as the polar axis (standard Bloch sphere)
    const sphereElements: JSX.Element[] = [];
    const latitudes = 12;
    const longitudes = 16;
    
    // Latitude lines (circles of constant z)
    for (let i = 0; i <= latitudes; i++) {
      const theta = (i / latitudes) * Math.PI;
      const r = Math.sin(theta);
      const z = Math.cos(theta);  // z is the polar axis
      
      const pts: Array<{ x: number; y: number }> = [];
      for (let j = 0; j <= longitudes; j++) {
        const phi = (j / longitudes) * Math.PI * 2;
        const x = r * Math.cos(phi);
        const y = r * Math.sin(phi);
        pts.push(projectBloch([x, y, z]));
      }
      
      const d = pts.map((pt, pidx) => `${pidx === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`).join(' ');
      sphereElements.push(<path key={`bloch-lat-${i}`} d={d} stroke="#94a3b8" strokeWidth="1" fill="none" opacity="1.0" />);
    }
    
    // Longitude lines (meridians)
    for (let j = 0; j < longitudes; j++) {
      const phi = (j / longitudes) * Math.PI * 2;
      const pts: Array<{ x: number; y: number }> = [];
      
      for (let i = 0; i <= latitudes; i++) {
        const theta = (i / latitudes) * Math.PI;
        const r = Math.sin(theta);
        const z = Math.cos(theta);  // z is the polar axis
        const x = r * Math.cos(phi);
        const y = r * Math.sin(phi);
        pts.push(projectBloch([x, y, z]));
      }
      
      const d = pts.map((pt, pidx) => `${pidx === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`).join(' ');
      sphereElements.push(<path key={`bloch-lon-${j}`} d={d} stroke="#94a3b8" strokeWidth="1" fill="none" opacity="1.0" />);
    }
    
    // Draw axes
    const axisLen = 1.3;
    const xAxisPos = projectBloch([axisLen, 0, 0]);
    const yAxisPos = projectBloch([0, axisLen, 0]);
    const zAxisPos = projectBloch([0, 0, axisLen]);
    const zAxisNeg = projectBloch([0, 0, -axisLen]);
    
    const origin = projectBloch([0, 0, 0]);
    
    // Draw Bloch vector
    const blochVecEnd = projectBloch([bx, by, bz]);
    
    return (
      <svg width={size} height={size} className="mx-auto">
        <rect width={size} height={size} fill="#0f172a" rx="8" />
        
        {sphereElements}
        
        {/* Axes */}
        <line x1={origin.x} y1={origin.y} x2={xAxisPos.x} y2={xAxisPos.y} stroke="#ef4444" strokeWidth="1.5" opacity="0.6" />
        <line x1={origin.x} y1={origin.y} x2={yAxisPos.x} y2={yAxisPos.y} stroke="#22c55e" strokeWidth="1.5" opacity="0.6" />
        <line x1={origin.x} y1={origin.y} x2={zAxisPos.x} y2={zAxisPos.y} stroke="#3b82f6" strokeWidth="1.5" opacity="0.6" />
        
        {/* Axis labels */}
        <text x={xAxisPos.x + 10} y={xAxisPos.y} fill="#ef4444" fontSize="12" fontWeight="600">X</text>
        <text x={yAxisPos.x} y={yAxisPos.y - 10} fill="#22c55e" fontSize="12" fontWeight="600">Y</text>
        <text x={zAxisPos.x + 8} y={zAxisPos.y - 5} fill="#3b82f6" fontSize="12" fontWeight="600">Z</text>
        
        {/* |0⟩ and |1⟩ labels on z-axis */}
        <text x={zAxisPos.x - 20} y={zAxisPos.y} fill="#22d3ee" fontSize="14" fontWeight="700">|0⟩</text>
        <text x={zAxisNeg.x - 20} y={zAxisNeg.y} fill="#f87171" fontSize="14" fontWeight="700">|1⟩</text>
        
        {/* Bloch vector arrow */}
        <defs>
          <marker id="bloch-arrow" markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#fbbf24" />
          </marker>
        </defs>
        <line 
          x1={origin.x} 
          y1={origin.y} 
          x2={blochVecEnd.x} 
          y2={blochVecEnd.y} 
          stroke="#fbbf24" 
          strokeWidth="3" 
          opacity="0.95"
          markerEnd="url(#bloch-arrow)"
        />
        
              </svg>
    );
  };

  // Helper function to create quaternion from state
  // Convert state to quaternion using STANDARD SU(2) half-angle convention
  // The state's phi0 is the rotation angle, so the quaternion uses phi0/2
  const makeQuatFromState = (state: SpinorConfig) => {
    const u = { x: state.u.x, y: state.u.y, z: state.u.z };
    const len = Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z);
    u.x /= len; u.y /= len; u.z /= len;
    const halfPhi = state.phi0 / 2;  // Use half-angle for SU(2) convention
    const w = Math.cos(halfPhi);
    const sinp = Math.sin(halfPhi);
    return [w, u.x * sinp, u.y * sinp, u.z * sinp];
  };

  // Get current quaternion based on mode
  // All quaternions use STANDARD SU(2) half-angle convention: q = [cos(θ/2), u·sin(θ/2)]
  const getCurrentQuaternion = (): number[] => {
    if (customMode) {
      // Custom state mode - customPhi is the rotation angle, use half-angle
      const u = normalizeAxis(customU);
      const halfPhi = customPhi / 2;
      const w = Math.cos(halfPhi);
      const sinp = Math.sin(halfPhi);
      return [w, u.x * sinp, u.y * sinp, u.z * sinp];
    } else if (manualMode) {
      // Manual gate control mode
      return manualQuat;
    } else {
      // Auto-cycling mode
      const currentState = spinors[currentStateIndex];
      const nextState = spinors[(currentStateIndex + 1) % spinors.length];
      const currentQuat = makeQuatFromState(currentState);
      const nextQuat = makeQuatFromState(nextState);
      const easedProgress = easeInOutCubic(transitionProgress);
      return isAnimating ? quatSlerp(currentQuat, nextQuat, easedProgress) : currentQuat;
    }
  };

  const renderVisualization = () => {
    const spinorQuat = getCurrentQuaternion();
    const currentState = customMode ? { name: "Custom", u: customU, phi0: customPhi, omega: 0, color: "#22d3ee" } : spinors[currentStateIndex];

    const axesLength = 1.4;

    const xAxisRot = [project3D([axesLength, 0, 0], spinorQuat), project3D([-axesLength, 0, 0], spinorQuat)];
    const yAxisRot = [project3D([0, axesLength, 0], spinorQuat), project3D([0, -axesLength, 0], spinorQuat)];
    const zAxisRot = [project3D([0, 0, axesLength], spinorQuat), project3D([0, 0, -axesLength], spinorQuat)];

    // Get rotation axis for gold arrow with interpolation during transitions
    let u = { x: currentState.u.x, y: currentState.u.y, z: currentState.u.z };
    let arrowPhi = currentState.phi0;
    
    // Get radiusScale for visual sizing (defaults to 1.0)
    let visualScale = currentState.radiusScale ?? 1.0;
    
    if (isAnimating) {
      // Interpolate between current and next rotation axis
      const nextState = spinors[(currentStateIndex + 1) % spinors.length];
      const easedProgress = easeInOutCubic(transitionProgress);
      u = {
        x: currentState.u.x * (1 - easedProgress) + nextState.u.x * easedProgress,
        y: currentState.u.y * (1 - easedProgress) + nextState.u.y * easedProgress,
        z: currentState.u.z * (1 - easedProgress) + nextState.u.z * easedProgress
      };
      // Interpolate phi (arrow length)
      arrowPhi = currentState.phi0 * (1 - easedProgress) + nextState.phi0 * easedProgress;
      // Interpolate radiusScale
      const nextScale = nextState.radiusScale ?? 1.0;
      visualScale = visualScale * (1 - easedProgress) + nextScale * easedProgress;
    }
    
    // Normalize the interpolated axis
    const uLen = Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z);
    u.x /= uLen; u.y /= uLen; u.z /= uLen;
    
    // Compute dynamic color based on mode
    // In hypersphere mode: darker blue (#5b9bd5) when expanding (cos φ > 0), darker orange (#d68c45) when contracting
    // In normal mode: color based on u-axis direction and phi
    // In hypersphere mode: smooth gradient from blue (cos φ = +1) → purple (cos φ = 0) → orange (cos φ = -1)
    const sphereColor = hypersphereMode 
      ? (() => {
          const cosPhi = Math.cos(arrowPhi);
          // Map cos(φ) from [-1, 1] to [0, 1] for interpolation
          const t = (cosPhi + 1) / 2; // t=1 when cosPhi=+1 (blue), t=0 when cosPhi=-1 (orange)
          // Blue: rgb(91, 155, 213) = #5b9bd5
          // Purple midpoint: rgb(147, 112, 219) = #9370db
          // Orange: rgb(214, 140, 69) = #d68c45
          let r, g, b;
          if (t >= 0.5) {
            // Blue to purple (t: 1 → 0.5)
            const s = (t - 0.5) * 2; // s: 1 → 0
            r = Math.round(147 + (91 - 147) * s);
            g = Math.round(112 + (155 - 112) * s);
            b = Math.round(219 + (213 - 219) * s);
          } else {
            // Purple to orange (t: 0.5 → 0)
            const s = t * 2; // s: 1 → 0
            r = Math.round(214 + (147 - 214) * s);
            g = Math.round(140 + (112 - 140) * s);
            b = Math.round(69 + (219 - 69) * s);
          }
          return `rgb(${r}, ${g}, ${b})`;
        })()
      : computeColorFromAxis(u, arrowPhi);
    
    const rotAxisStart = project3D([0, 0, 0]);

    return (
      <svg
        width={W}
        height={H}
        className="cursor-grab active:cursor-grabbing mx-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        data-testid="svg-spinor-visualization"
      >
        <rect width={W} height={H} fill="#0b0e13" />
        {renderStars()}
        
        {/* Path trail - render before sphere so it's behind */}
        {renderPath()}
        
        {/* Sphere with dynamic radius based on cos(φ) in hypersphere mode, zoomed 95% (1.25^3) */}
        {renderSphere(spinorQuat, 0.95, sphereColor, 2.0, true, (hypersphereMode ? Math.abs(Math.cos(arrowPhi)) * 1.953125 : 1.0) * visualScale)}
        
        <line x1={xAxisRot[0].x} y1={xAxisRot[0].y} x2={xAxisRot[1].x} y2={xAxisRot[1].y} stroke="#ef4444" strokeWidth="2.5" opacity="0.9" />
        <line x1={yAxisRot[0].x} y1={yAxisRot[0].y} x2={yAxisRot[1].x} y2={yAxisRot[1].y} stroke="#22c55e" strokeWidth="2.5" opacity="0.9" />
        <line x1={zAxisRot[0].x} y1={zAxisRot[0].y} x2={zAxisRot[1].x} y2={zAxisRot[1].y} stroke="#3b82f6" strokeWidth="2.5" opacity="0.9" />

        {/* Gold arrow - in hypersphere mode, draws from origin to sphere surface */}
        {(() => {
          // In hypersphere mode: arrow tip should exactly touch sphere surface
          // Sphere radius = |cos φ| * 1.953125 * visualScale
          const sphereRadius = hypersphereMode 
            ? Math.abs(Math.cos(arrowPhi)) * 1.953125 * visualScale
            : 1.0 * visualScale;
          
          // Arrow head size proportional to sphere in hypersphere mode
          const arrowHeadScale = hypersphereMode ? Math.abs(Math.cos(arrowPhi)) : 1.0;
          const markerSize = 7.5 * Math.max(0.4, arrowHeadScale);
          const refY = 2.25 * Math.max(0.4, arrowHeadScale);
          
          // Calculate arrowhead length offset in world coordinates
          // The arrowhead extends past the line end, so we shorten the line
          // Arrowhead tip extends by approximately markerSize * 0.015 in world units (based on SVG scale)
          const arrowheadOffset = markerSize * 0.012;
          
          // Arrow line ends before sphere surface, arrowhead tip touches surface
          const goldArrowLength = hypersphereMode 
            ? Math.max(0, sphereRadius - arrowheadOffset)
            : arrowPhi * 1.5;
          const goldArrowEnd = project3D([u.x * goldArrowLength, u.y * goldArrowLength, u.z * goldArrowLength]);
          
          // Set refX to 0 so arrowhead starts exactly at line end (tip will be at sphere surface)
          const refX = 0;
          
          return (
            <>
              <defs>
                <marker 
                  id="arrowhead-dynamic" 
                  markerWidth={markerSize} 
                  markerHeight={markerSize} 
                  refX={refX} 
                  refY={refY} 
                  orient="auto"
                >
                  <polygon points={`0 0, ${markerSize} ${refY}, 0 ${markerSize * 0.6}`} fill="#ffe066" />
                </marker>
              </defs>
              <line 
                x1={rotAxisStart.x} 
                y1={rotAxisStart.y} 
                x2={goldArrowEnd.x} 
                y2={goldArrowEnd.y} 
                stroke="#ffe066" 
                strokeWidth={hypersphereMode ? 7.5 * Math.max(0.5, arrowHeadScale) : 7.5} 
                opacity="0.9"
                markerEnd="url(#arrowhead-dynamic)"
              />
            </>
          );
        })()}

        <text x={W / 2} y={isMobile ? 20 : isTablet ? 22 : 25} textAnchor="middle" fontSize={isMobile ? 16 : isTablet ? 22 : 28} fill="#ffffff" fontFamily="serif">
          Quaternionic Wavefunction
        </text>
        <text x={W / 2} y={isMobile ? 45 : isTablet ? 55 : 70} textAnchor="middle" fontSize={isMobile ? 18 : isTablet ? 26 : 34} fill="#cbd5e1" fontWeight="700" fontFamily="serif" fontStyle="italic">
          q = α₀ + α₁i + β₀j + β₁k
        </text>
        
        {isMobile ? (
          <>
            <text x={W / 2} y={H - 55} textAnchor="middle" fontSize="11" fill={hypersphereMode ? '#60a5fa' : '#d4af37'}>
              <tspan fontWeight="600">{hypersphereMode ? 'cos φ' : 'φ'}</tspan> = {hypersphereMode ? 'sphere size' : 'rotation magnitude'}
            </text>
            <text x={W / 2} y={H - 40} textAnchor="middle" fontSize="11" fill={sphereColor}>
              <tspan fontWeight="600">{hypersphereMode ? 'u sin φ' : 'u'}</tspan> = {hypersphereMode ? 'orientation' : 'rotation axis'}
            </text>
            <text x={W / 2} y={H - 22} textAnchor="middle" fontSize="12" fill="#ffffff" fontFamily="serif">
              ∣ψ⟩ = (α, β) = (α₀+iα₁, β₀+iβ₁)
            </text>
          </>
        ) : (
          <>
            <text x={20} y={H - 42} textAnchor="start" fontSize={isTablet ? 14 : 18} fill="#ffffff">
              <tspan fontWeight="600">{hypersphereMode ? 'cos φ' : 'φ'}</tspan> = <tspan fill={hypersphereMode ? '#60a5fa' : '#d4af37'}>{hypersphereMode ? 'sphere size' : 'rotation magnitude'}</tspan>
            </text>
            <text x={20} y={H - 18} textAnchor="start" fontSize={isTablet ? 14 : 18} fill="#ffffff">
              <tspan fontWeight="600">{hypersphereMode ? 'u sin φ' : 'u'}</tspan> = <tspan fill={sphereColor}>{hypersphereMode ? 'orientation' : 'rotation axis'}</tspan>
            </text>
            <text x={W - 20} y={H - 30} textAnchor="end" fontSize={isTablet ? 18 : 24} fill="#ffffff" fontFamily="serif">
              q = cos φ + <tspan fontWeight="600">u</tspan> sin φ
            </text>
          </>
        )}
      </svg>
    );
  };

  const s = spinors[currentStateIndex];
  const currentPhi = s.phi0;

  return (
    <div className="w-full overflow-x-hidden" style={{ background: 'linear-gradient(to bottom, #0a2533, #0b0e13)' }}>
      <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        <div className="mb-6 md:mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Quaternionic Quantum Computing
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-cyan-100/90 max-w-4xl">
              Visual of Quaternionic Quantum States and Gate Operations
            </p>
          </div>
          <a
            href="https://resonantaxis.com/quaternionic-hypersphere"
            target="_blank"
            rel="noopener noreferrer"
            className="lg:w-80 flex-shrink-0 px-4 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-center font-semibold rounded-lg transition-all shadow-lg hover:shadow-cyan-500/25"
            data-testid="link-unit-hypersphere"
          >
            Unit Hypersphere Visual
          </a>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          {/* Left Sidebar - Quantum State Notation & Controls */}
          <div className="lg:w-80 flex-shrink-0 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700 p-4 lg:p-6 space-y-4 lg:space-y-6 hidden lg:block">
            <div>
              {/* Path toggle button */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    setShowPath(!showPath);
                    if (!showPath) {
                      setPathHistory([]); // Clear path when enabling
                    }
                  }}
                  className={`w-full px-4 py-2 rounded border transition-colors ${
                    showPath
                      ? 'border-cyan-500 bg-cyan-900/40 text-white font-semibold'
                      : 'border-slate-500 bg-slate-700 hover:bg-slate-600 text-white font-semibold'
                  }`}
                  data-testid="button-toggle-path"
                >
                  Geodesic Path Tracing
                </button>
              </div>
              
              {/* Hypersphere representation toggle */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    setHypersphereMode(!hypersphereMode);
                    setPathHistory([]); // Clear path when switching modes
                  }}
                  className={`w-full px-4 py-2 rounded border transition-colors ${
                    hypersphereMode
                      ? 'border-cyan-500 bg-cyan-900/40 text-cyan-300 font-semibold'
                      : 'border-slate-500 bg-slate-700 hover:bg-slate-600 text-white font-semibold'
                  }`}
                  data-testid="button-toggle-hypersphere"
                >
                  Hypersphere Representation
                </button>
              </div>

              <h3 className="text-xl font-semibold text-cyan-300 mb-4">Current State</h3>
              
              {/* State in bra-ket notation with crossfade */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-600 flex flex-col justify-center min-h-[160px] relative overflow-hidden">
                <div 
                  key={isAnimating ? `anim-${currentStateIndex}` : `state-${currentStateIndex}`}
                  className="flex flex-col justify-center"
                  style={{
                    animation: 'fadeIn 0.5s ease-in-out'
                  }}
                >
                  {isAnimating ? (
                    <>
                      <div className="text-center text-2xl text-white font-serif mb-2">
                        |q<sub>{currentStateIndex}</sub>⟩ → |q<sub>{(currentStateIndex + 1) % spinors.length}</sub>⟩
                      </div>
                      <div className="text-center text-2xl text-cyan-400 font-semibold mb-2">
                        Gate
                      </div>
                      <div className="text-center text-xl text-white font-serif">
                        {(() => {
                          const nextState = spinors[(currentStateIndex + 1) % spinors.length];
                          // Compute the gate quaternion q_gate = q2 * q1^(-1)
                          const makeQuat = (state: SpinorConfig) => {
                            const uLen = Math.sqrt(state.u.x * state.u.x + state.u.y * state.u.y + state.u.z * state.u.z);
                            const u = { x: state.u.x / uLen, y: state.u.y / uLen, z: state.u.z / uLen };
                            const phi = state.phi0;
                            const w = Math.cos(phi);
                            const sinp = Math.sin(phi);
                            return [w, u.x * sinp, u.y * sinp, u.z * sinp];
                          };
                          const q1 = makeQuat(s);
                          const q2 = makeQuat(nextState);
                          const q1inv = [q1[0], -q1[1], -q1[2], -q1[3]];
                          const qGate = [
                            q2[0] * q1inv[0] - q2[1] * q1inv[1] - q2[2] * q1inv[2] - q2[3] * q1inv[3],
                            q2[0] * q1inv[1] + q2[1] * q1inv[0] + q2[2] * q1inv[3] - q2[3] * q1inv[2],
                            q2[0] * q1inv[2] - q2[1] * q1inv[3] + q2[2] * q1inv[0] + q2[3] * q1inv[1],
                            q2[0] * q1inv[3] + q2[1] * q1inv[2] - q2[2] * q1inv[1] + q2[3] * q1inv[0],
                          ];
                          const w = qGate[0];
                          const x = qGate[1];
                          const y = qGate[2];
                          const z = qGate[3];
                          return `${w.toFixed(2)} ${x >= 0 ? '+' : ''}${x.toFixed(2)}i ${y >= 0 ? '+' : ''}${y.toFixed(2)}j ${z >= 0 ? '+' : ''}${z.toFixed(2)}k`;
                        })()}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center text-2xl text-white font-serif mb-2">
                        |q<sub>{currentStateIndex}</sub>⟩
                      </div>
                      <div className="text-center text-2xl text-cyan-400 font-semibold mb-2">
                        State
                      </div>
                      <div className="text-center text-xl text-white font-serif">
                        {(() => {
                          const a0 = Math.cos(currentPhi);
                          const a1 = s.u.x * Math.sin(currentPhi);
                          const b0 = s.u.y * Math.sin(currentPhi);
                          const b1 = s.u.z * Math.sin(currentPhi);
                          return `${a0.toFixed(2)} ${a1 >= 0 ? '+' : ''}${a1.toFixed(2)}i ${b0 >= 0 ? '+' : ''}${b0.toFixed(2)}j ${b1 >= 0 ? '+' : ''}${b1.toFixed(2)}k`;
                        })()}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* State name */}
              <div className="bg-gradient-to-r from-slate-800/70 to-slate-700/70 rounded-lg p-3 mb-4 border" style={{ borderColor: computeColorFromAxis(s.u, s.phi0) }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: computeColorFromAxis(s.u, s.phi0) }}></div>
                  <span className="text-white font-semibold text-base">Gate Type = {s.name}</span>
                </div>
              </div>

              {/* Measurement Readout - Compact Rectangle (moved above Quaternionic Rotation) */}
              <div className="mb-4 bg-slate-950/50 rounded-lg border border-slate-700 w-full flex flex-col justify-center p-3">
                <h3 className="text-sm font-semibold text-cyan-300 mb-2 text-center">Measurement</h3>
                {(() => {
                  const quat = getCurrentQuaternion();
                  // Use spinor-derived Bloch vector for correct probabilities
                  const bloch = quatToBloch(quat);
                  const bz = bloch.bz;
                  
                  const prob0 = (1 + bz) / 2;
                  const prob1 = (1 - bz) / 2;
                  const pct0 = Math.round(prob0 * 100);
                  const pct1 = Math.round(prob1 * 100);
                  
                  if (pct0 >= 99) {
                    return (
                      <div className="text-center flex-1 flex flex-col justify-center">
                        <span className="text-5xl font-bold text-green-400 font-mono">|0⟩</span>
                        <p className="text-xs text-slate-400 mt-1">Ground state</p>
                      </div>
                    );
                  } else if (pct1 >= 99) {
                    return (
                      <div className="text-center flex-1 flex flex-col justify-center">
                        <span className="text-5xl font-bold text-blue-400 font-mono">|1⟩</span>
                        <p className="text-xs text-slate-400 mt-1">Excited state</p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex-1 flex flex-col justify-center space-y-1">
                        <div className="text-center">
                          <span className="text-2xl font-mono text-green-400">{pct0}%</span>
                          <span className="text-lg font-mono text-green-300 ml-1">|0⟩</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-600 to-blue-500"
                            style={{ width: `${pct0}%` }}
                          />
                        </div>
                        <div className="text-center">
                          <span className="text-2xl font-mono text-blue-400">{pct1}%</span>
                          <span className="text-lg font-mono text-blue-300 ml-1">|1⟩</span>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Quaternion formula - links to hypersphere page */}
              <a 
                href="https://resonantaxis.com/quaternionic-hypersphere" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-600 hover:bg-slate-700/50 hover:border-cyan-500 transition-all cursor-pointer"
                data-testid="link-quaternionic-hypersphere"
              >
                <div className="text-center text-base text-slate-300 mb-2">Quaternionic Rotation</div>
                <div className="overflow-x-auto space-y-2">
                  <div className="text-center text-xl text-white font-serif whitespace-nowrap">
                    q = cos φ + <span className="font-bold">u</span> sin φ
                  </div>
                  <div className="text-center text-lg text-white font-serif whitespace-nowrap tracking-wide">
                    <span className="font-bold">u</span> = u<sub>x</sub><span className="font-bold">i</span> &nbsp;+&nbsp; u<sub>y</sub><span className="font-bold">j</span> &nbsp;+&nbsp; u<sub>z</sub><span className="font-bold">k</span>
                  </div>
                  <div className="text-center text-lg text-white font-serif whitespace-nowrap">
                    u<sub>x</sub><sup>2</sup> + u<sub>y</sub><sup>2</sup> + u<sub>z</sub><sup>2</sup> = 1
                  </div>
                </div>
              </a>

              {/* Axis vector u */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-600">
                <div className="text-base text-slate-300 mb-2">Rotation Axis <span className="font-bold">u</span>:</div>
                <div className="font-mono text-white text-base space-y-1">
                  <div>u<sub>i</sub> = {s.u.x.toFixed(3)}</div>
                  <div>u<sub>j</sub> = {s.u.y.toFixed(3)}</div>
                  <div>u<sub>k</sub> = {s.u.z.toFixed(3)}</div>
                </div>
                <div className="text-sm text-slate-400 mt-2">
                  |<span className="font-bold">u</span>| = 1 (normalized)
                </div>
              </div>

              {/* Current angle */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                <div className="space-y-2 font-mono text-base">
                  <div className="flex justify-between">
                    <span className="text-slate-300">φ:</span>
                    <span className="text-white">{currentPhi.toFixed(3)} rad</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">cos φ:</span>
                    <span className="text-white">{Math.cos(currentPhi).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">sin φ:</span>
                    <span className="text-white">{Math.sin(currentPhi).toFixed(3)}</span>
                  </div>
                </div>
                <div className="text-sm text-slate-400 mt-3 border-t border-slate-600 pt-2">
                  Fixed orientation (static)
                </div>
              </div>
            </div>
          </div>

          {/* Main Visualization */}
          <div className="flex-1 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 p-3 lg:p-6">
            {renderVisualization()}
            
            {/* Mobile and tablet phi readouts below visualization */}
            {(isMobile || isTablet) && (
              <div className="mt-4 bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                <div className={`space-y-2 font-mono ${isTablet ? 'text-base' : 'text-sm'}`}>
                  <div className="flex justify-between">
                    <span className="text-slate-300">φ:</span>
                    <span className="text-white">{currentPhi.toFixed(3)} rad</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">cos φ:</span>
                    <span className="text-white">{Math.cos(currentPhi).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">sin φ:</span>
                    <span className="text-white">{Math.sin(currentPhi).toFixed(3)}</span>
                  </div>
                </div>
                <div className={`${isTablet ? 'text-sm' : 'text-xs'} text-slate-400 mt-3 border-t border-slate-600 pt-2 text-center`}>
                  {s.name} • State {currentStateIndex + 1} of {spinors.length}
                </div>
              </div>
            )}

            {/* Quantum Circuit Diagram */}
            <div className="mt-4 md:mt-6 bg-slate-950/50 rounded-lg p-3 md:p-4 border border-slate-700">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-cyan-300 mb-1">Quantum Circuit</h3>
                  <p className="text-sm text-slate-400">
                    {customCircuit.length > 0 
                      ? (customCircuitRunning ? `Running custom circuit (${displaySpinors.length} gates)` : `Custom circuit (${displaySpinors.length} gates) - click Run to animate`)
                      : `Default sequence showing all 8 states`}
                  </p>
                </div>
                {customCircuit.length > 0 && (
                  <div className="flex gap-2">
                    {!customCircuitRunning ? (
                      <button
                        onClick={() => {
                          setCurrentStateIndex(0);
                          setTransitionProgress(0);
                          setIsAnimating(false);
                          setPathHistory([]);
                          setCustomCircuitRunning(true);
                        }}
                        className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors font-semibold"
                        data-testid="run-custom-circuit"
                      >
                        Run
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setCustomCircuitRunning(false);
                          setCurrentStateIndex(0);
                          setTransitionProgress(0);
                          setIsAnimating(false);
                          setPathHistory([]);
                        }}
                        className="px-4 py-1.5 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-500 transition-colors font-semibold"
                        data-testid="stop-custom-circuit"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <svg width={Math.min(1000, displaySpinors.length * 95 + 200)} height="135" className="mx-auto" style={{ minWidth: Math.min(750, displaySpinors.length * 95 + 200) }}>
                  {/* Qubit line label */}
                  <text x="5" y="45" fontSize="20" fill="#cbd5e1" fontFamily="monospace">q[0] <tspan fill="#94a3b8">|0⟩</tspan></text>
                  
                  {/* Qubit line */}
                  <line 
                    x1="85" 
                    y1="40" 
                    x2={displaySpinors.length * 95 + 120} 
                    y2="40" 
                    stroke="#475569" 
                    strokeWidth="2"
                  />
                  
                  {/* Gates */}
                  {displaySpinors.map((spinor, idx) => {
                    const x = 150 + idx * 95;
                    const isActive = customCircuitRunning && currentStateIndex === idx;
                    const isNext = customCircuitRunning && isAnimating && (currentStateIndex + 1) % displaySpinors.length === idx;
                    
                    // Use spinor data directly (no heuristics)
                    const gateColor = spinor.color;
                    const gateLabel = spinor.name;
                    
                    const boxOpacity = 1.0;
                    const boxStrokeWidth = isActive ? 3 : 1;
                    const boxStrokeColor = isActive ? "#22d3ee" : isNext ? "#fbbf24" : gateColor;
                    
                    return (
                      <g key={idx} style={{ cursor: customCircuit.length > 0 && !customCircuitRunning ? 'pointer' : 'default' }} onClick={() => {
                        if (customCircuit.length > 0 && !customCircuitRunning) {
                          const newCircuit = [...customCircuit];
                          newCircuit.splice(idx, 1);
                          setCustomCircuit(newCircuit);
                        }
                      }}>
                        <rect
                          x={x - 31}
                          y="9"
                          width="62"
                          height="62"
                          fill={gateColor}
                          opacity={boxOpacity}
                          stroke={boxStrokeColor}
                          strokeWidth={boxStrokeWidth}
                          rx="5"
                        />
                        <text x={x} y="46" fontSize="20" fontWeight="bold" fill="#0b0e13" textAnchor="middle" fontFamily="serif">
                          {gateLabel}
                        </text>
                        <text x={x} y="95" fontSize="14" fill="#cbd5e1" textAnchor="middle" fontFamily="monospace">
                          φ={spinor.phi0.toFixed(2)}
                        </text>
                        {isActive && (
                          <>
                            <circle cx={x} cy="115" r="4" fill="#22d3ee" />
                            <text x={x + 10} y="119" fontSize="12" fill="#22d3ee" fontFamily="monospace" fontWeight="bold">
                              ACTIVE
                            </text>
                          </>
                        )}
                        {isNext && (
                          <polygon points={`${x - 4},110 ${x + 4},110 ${x},118`} fill="#fbbf24" />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
              {customCircuit.length > 0 && !customCircuitRunning && (
                <p className="text-xs text-slate-500 text-center mt-2">Click a gate to remove it</p>
              )}
            </div>

            {/* Documentation Section */}
            <a
              href="https://docs.rqmtechnologies.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 md:mt-6 block rounded-lg p-3 md:p-4 border border-slate-700 cursor-pointer transition-all duration-200 hover:border-cyan-500/60 hover:bg-slate-900/80"
              style={{ background: 'rgba(15,20,30,0.5)' }}
            >
              <h3 className="text-base md:text-lg font-semibold text-cyan-300 mb-2">RQM Technologies Documentation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                The RQM Technologies documentation covers the full mathematical framework behind Quaternionic Signal Processing, including quaternion algebra, spinor representations, gate construction, and algorithm design for communications, navigation, and quantum systems.
              </p>
            </a>
          </div>

          {/* Right Sidebar - Bloch Sphere & Custom State Builder */}
          <div className="lg:w-80 flex-shrink-0 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700 p-4 lg:p-6 space-y-4 lg:space-y-6 hidden lg:block">
            <div>
              {/* Bloch Sphere Comparison View */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-cyan-300 mb-4 text-center">Bloch Sphere View</h3>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                  {renderBlochSphere()}
                  <div className="mt-3 text-base text-slate-300 text-center border-t border-slate-600 pt-3">
                    {(() => {
                      // Get spinor coefficients directly from quaternion
                      const quat = getCurrentQuaternion();
                      const spinor = quatToSpinor(quat);
                      const bloch = spinorToBloch(spinor);
                      
                      // Calculate polar and azimuthal angles from Bloch vector
                      const theta = Math.acos(Math.max(-1, Math.min(1, bloch.bz))); // Clamp for numerical stability
                      const phi = Math.atan2(bloch.by, bloch.bx);
                      
                      // Calculate coefficients from Bloch angles (for display)
                      const cosHalfTheta = Math.cos(theta / 2);
                      const sinHalfTheta = Math.sin(theta / 2);
                      
                      // Format the phase
                      const phiDeg = ((phi * 180 / Math.PI + 360) % 360).toFixed(0);
                      
                      return (
                        <div className="font-serif">
                          |ψ⟩ = {cosHalfTheta.toFixed(3)}|0⟩ + e<sup>i{phiDeg}°</sup>{sinHalfTheta.toFixed(3)}|1⟩
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* 2-Component Complex State Vector */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-cyan-300 mb-4 text-center">State Vector Notation</h3>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                  <div className="text-sm text-slate-300 mb-3 text-center">2-component complex state vector</div>
                  <div className="flex items-center justify-center gap-2 font-serif text-white mb-4">
                    <span className="text-2xl">|ψ⟩ =</span>
                    <div className="flex items-center">
                      <span className="text-4xl font-light">(</span>
                      <div className="flex flex-col items-center mx-0.5">
                        <span className="text-lg italic">α</span>
                        <span className="text-lg italic">β</span>
                      </div>
                      <span className="text-4xl font-light">)</span>
                    </div>
                    <span className="text-2xl">=</span>
                    <div className="flex items-center">
                      <span className="text-4xl font-light">(</span>
                      <div className="flex flex-col items-center mx-0.5">
                        <span className="text-lg italic">α₀ + iα₁</span>
                        <span className="text-lg italic">β₀ + iβ₁</span>
                      </div>
                      <span className="text-4xl font-light">)</span>
                    </div>
                  </div>
                  
                  {/* Computed α and β values */}
                  <div className="border-t border-slate-600 pt-3">
                    <div className="text-sm text-slate-400 mb-2 text-center">Current values:</div>
                    {(() => {
                      // Get spinor coefficients directly from quaternion
                      const quat = getCurrentQuaternion();
                      const spinor = quatToSpinor(quat);
                      
                      return (
                        <div className="flex items-center justify-center gap-2 font-serif text-white">
                          <span className="text-2xl">|ψ⟩ =</span>
                          <div className="flex items-center">
                            <span className="text-4xl font-light">(</span>
                            <div className="flex flex-col items-center mx-1">
                              <span className="text-base font-mono text-green-400">{formatComplex(spinor.alphaReal, spinor.alphaImag)}</span>
                              <span className="text-base font-mono text-blue-400">{formatComplex(spinor.betaReal, spinor.betaImag)}</span>
                            </div>
                            <span className="text-4xl font-light">)</span>
                          </div>
                        </div>
                      );
                    })()}
                                      </div>
                </div>
              </div>

              {/* Custom State Builder */}
              <div className="mb-6">
                <button
                  onClick={() => {
                    setCustomMode(true);
                    setManualMode(false);
                  }}
                  className={`w-full px-4 py-2 rounded border transition-colors mb-4 ${
                    customMode
                      ? 'border-emerald-500 bg-emerald-900/40 text-emerald-300 font-semibold'
                      : 'border-cyan-500 bg-cyan-900/40 hover:bg-cyan-900/60 text-white font-semibold'
                  }`}
                  data-testid="button-apply-custom-state"
                >
                  {customMode ? '✓ Custom Mode Active' : 'Apply Custom State'}
                </button>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 space-y-4">
                  {/* u_i slider */}
                  <div>
                    <label className="flex justify-between text-sm text-slate-300 mb-1">
                      <span>u<sub>i</sub> (x-axis)</span>
                      <span className="font-mono text-cyan-300">{customU.x.toFixed(3)}</span>
                    </label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.01"
                      value={customU.x}
                      onChange={(e) => setCustomU({ ...customU, x: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      data-testid="slider-u-x"
                    />
                  </div>

                  {/* u_j slider */}
                  <div>
                    <label className="flex justify-between text-sm text-slate-300 mb-1">
                      <span>u<sub>j</sub> (y-axis)</span>
                      <span className="font-mono text-cyan-300">{customU.y.toFixed(3)}</span>
                    </label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.01"
                      value={customU.y}
                      onChange={(e) => setCustomU({ ...customU, y: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      data-testid="slider-u-y"
                    />
                  </div>

                  {/* u_k slider */}
                  <div>
                    <label className="flex justify-between text-sm text-slate-300 mb-1">
                      <span>u<sub>k</sub> (z-axis)</span>
                      <span className="font-mono text-cyan-300">{customU.z.toFixed(3)}</span>
                    </label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.01"
                      value={customU.z}
                      onChange={(e) => setCustomU({ ...customU, z: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      data-testid="slider-u-z"
                    />
                  </div>

                  {/* Normalized u display */}
                  <div className="bg-slate-900/50 rounded p-2 border border-slate-700">
                    <div className="text-xs text-slate-400 mb-1">Normalized u:</div>
                    <div className="font-mono text-xs text-cyan-300">
                      ({normalizeAxis(customU).x.toFixed(3)}, {normalizeAxis(customU).y.toFixed(3)}, {normalizeAxis(customU).z.toFixed(3)})
                    </div>
                  </div>

                  {/* φ (phi) slider */}
                  <div>
                    <label className="flex justify-between text-sm text-slate-300 mb-1">
                      <span>φ (rotation angle)</span>
                      <span className="font-mono text-cyan-300">{customPhi.toFixed(3)} rad</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={2 * Math.PI}
                      step="0.01"
                      value={customPhi}
                      onChange={(e) => setCustomPhi(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      data-testid="slider-phi"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>0</span>
                      <span>2π</span>
                    </div>
                  </div>

                  {customMode && (
                    <button
                      onClick={() => {
                        setCustomMode(false);
                        setPathHistory([]);
                      }}
                      className="w-full px-4 py-2 rounded border border-slate-500 bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
                      data-testid="button-exit-custom"
                    >
                      Exit Custom Mode
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
