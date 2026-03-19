import { useEffect, useRef, useState, useMemo } from 'react';
import quaternionicEquation from '@assets/Quaternionic Spinor copy_1759872095649.jpg';

export default function EigenSpinorVisual() {
  const [omega, setOmega] = useState(1.2);
  const [amplitude, setAmplitude] = useState(1.0);
  const [showComponents, setShowComponents] = useState(true);
  const [running, setRunning] = useState(true);
  const [phase, setPhase] = useState(0);
  const [frame, setFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const qRef = useRef<[number, number, number, number]>([1, 0, 0, 0]);
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);

  // Canvas dimensions and projection
  const W = 1000;
  const H = 700;
  const R = 375; // Enlarged by 50% from 250
  const FOV = 600;

  // Generate base star positions (fixed in space)
  const baseStarPositions = useMemo(() => {
    const stars: Array<{ pos: [number, number, number]; r: number; opacity: number }> = [];
    for (let i = 0; i < 300; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 800 + Math.random() * 400;
      
      stars.push({
        pos: [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        ],
        r: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.8 + 0.2
      });
    }
    return stars;
  }, []);

  // Quaternion multiplication
  const quatMul = (a: number[], b: number[]): number[] => {
    return [
      a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
      a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
      a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
      a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
    ];
  };

  const rotateVecByQuat = (v: [number, number, number], q: number[]): [number, number, number] => {
    const qConj = [q[0], -q[1], -q[2], -q[3]];
    const vq = [0, v[0], v[1], v[2]];
    const tmp = quatMul(q, vq);
    const res = quatMul(tmp, qConj);
    return [res[1], res[2], res[3]];
  };

  // Project 3D point to 2D
  const project = (p: [number, number, number], q: number[]): { x: number; y: number; z: number } => {
    const v3 = rotateVecByQuat(p, q);
    const v = [v3[0] * R, v3[1] * R, v3[2] * R + 500];
    const persp = FOV / (FOV + v[2]);
    return {
      x: v[0] * persp + W / 2,
      y: v[1] * persp + H / 2,
      z: v[2]
    };
  };

  // Mouse interaction
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
      qRef.current = quatMul(dq, qRef.current) as [number, number, number, number];
      setFrame(f => f + 1);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    lastMouseRef.current = null;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    lastMouseRef.current = null;
  };

  const handleReset = () => {
    setPhase(0);
    qRef.current = [1, 0, 0, 0];
    setFrame(f => f + 1);
  };

  // Animation loop
  useEffect(() => {
    if (!running) return;

    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Auto-rotate when not dragging
      if (!isDragging) {
        const axis: [number, number, number] = [0.3, 1, 0.2];
        const len = Math.sqrt(axis[0] ** 2 + axis[1] ** 2 + axis[2] ** 2);
        const normAxis: [number, number, number] = [axis[0] / len, axis[1] / len, axis[2] / len];
        const angle = dt * 0.15;
        const s = Math.sin(angle / 2);
        const dq = [Math.cos(angle / 2), normAxis[0] * s, normAxis[1] * s, normAxis[2] * s];
        qRef.current = quatMul(dq, qRef.current) as [number, number, number, number];
      }

      setPhase(prev => prev + omega * dt);
      setFrame(f => f + 1);
      animId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animId);
  }, [omega, isDragging, running]);

  // Generate helical paths for e^{+iωt} and e^{-iωt}
  const helicalPaths = useMemo(() => {
    const q = qRef.current;
    const numPoints = 150;
    const positiveHelix = [];
    const negativeHelix = [];
    
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 6; // 3 full rotations
      const z = (i / numPoints) * 2 - 1; // -1 to 1
      
      // Positive frequency: e^{+iωt} - counterclockwise
      const xPos = amplitude * 0.7 * Math.cos(t);
      const yPos = amplitude * 0.7 * Math.sin(t);
      const pPos = project([xPos, yPos, z], q);
      positiveHelix.push(pPos);
      
      // Negative frequency: e^{-iωt} - clockwise
      const xNeg = amplitude * 0.7 * Math.cos(-t);
      const yNeg = amplitude * 0.7 * Math.sin(-t);
      const pNeg = project([xNeg, yNeg, z], q);
      negativeHelix.push(pNeg);
    }
    
    return { positiveHelix, negativeHelix };
  }, [frame, amplitude]);

  // Generate combined quaternionic spinor trajectory
  const spinorTrajectory = useMemo(() => {
    const q = qRef.current;
    const numPoints = 100;
    const points = [];
    
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      
      // Combined trajectory: interference creates flat elliptical path
      const x = amplitude * Math.cos(t);
      const y = amplitude * Math.sin(t) * 0.6;
      const z = 0; // Flat ellipse - interference in the same plane
      
      const p = project([x, y, z], q);
      points.push(p);
    }
    
    return points;
  }, [frame, amplitude]);

  // Current position markers
  const currentMarkers = useMemo(() => {
    const q = qRef.current;
    const t = phase;
    
    // Positive helix current position
    const zCurrent = ((t % (Math.PI * 6)) / (Math.PI * 6)) * 2 - 1;
    const xPos = amplitude * 0.7 * Math.cos(t);
    const yPos = amplitude * 0.7 * Math.sin(t);
    const posMarker = project([xPos, yPos, zCurrent], q);
    
    // Negative helix current position  
    const xNeg = amplitude * 0.7 * Math.cos(-t);
    const yNeg = amplitude * 0.7 * Math.sin(-t);
    const negMarker = project([xNeg, yNeg, zCurrent], q);
    
    // Combined spinor current position
    const tSpinor = t % (Math.PI * 2);
    const xSpin = amplitude * Math.cos(tSpinor);
    const ySpin = amplitude * Math.sin(tSpinor) * 0.6;
    const zSpin = 0; // Flat ellipse - interference in the same plane
    const spinorMarker = project([xSpin, ySpin, zSpin], q);
    
    return { posMarker, negMarker, spinorMarker };
  }, [frame, phase, amplitude]);

  // Critical sphere wireframe
  const criticalSphere = useMemo(() => {
    const q = qRef.current;
    const circles = [];
    
    // Draw latitude lines (horizontal cross-sections)
    for (let j = 0; j < 8; j++) {
      const z = -0.8 + (j / 7) * 1.6;
      const r = Math.sqrt(Math.max(0, 1 - z * z));
      const points = [];
      
      for (let i = 0; i <= 50; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        const p = project([x, y, z], q);
        points.push(p);
      }
      circles.push(points);
    }
    
    // Draw longitude lines (meridians from pole to pole)
    for (let j = 0; j < 8; j++) {
      const azimuth = (j / 8) * Math.PI * 2;
      const points = [];
      
      for (let i = 0; i <= 50; i++) {
        const theta = (i / 50) * Math.PI; // 0 to π
        const x = Math.sin(theta) * Math.cos(azimuth);
        const y = Math.sin(theta) * Math.sin(azimuth);
        const z = Math.cos(theta);
        const p = project([x, y, z], q);
        points.push(p);
      }
      circles.push(points);
    }
    
    return circles;
  }, [frame]);

  // Starfield background (rotates with camera to show movement)
  const stars = useMemo(() => {
    const q = qRef.current;
    const starArray = [];
    
    for (const star of baseStarPositions) {
      // Rotate stars with camera (they move in background)
      const rotatedStar = rotateVecByQuat(star.pos, q);
      const v = [rotatedStar[0], rotatedStar[1], rotatedStar[2] + 500];
      const persp = FOV / (FOV + v[2]);
      const x2 = v[0] * persp + W / 2;
      const y2 = v[1] * persp + H / 2;
      
      // Only include stars within the visual bounds
      if (x2 >= 0 && x2 <= W && y2 >= 0 && y2 <= H) {
        starArray.push({
          x: x2,
          y: y2,
          r: star.r,
          opacity: star.opacity
        });
      }
    }
    return starArray;
  }, [frame, baseStarPositions, W, H, FOV]);

  // Convert points to SVG path
  const pointsToPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return '';
    return `M ${points[0].x},${points[0].y} ` + 
           points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ');
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-4">
      {/* 3D Visualization */}
      <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden mb-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          data-testid="svg-visualization"
        >
          {/* Black background */}
          <rect x={0} y={0} width={W} height={H} fill="#000000" />
          
          {/* Starfield background */}
          <g>
            {stars.map((star, i) => (
              <circle 
                key={i} 
                cx={star.x} 
                cy={star.y} 
                r={star.r} 
                fill="white" 
                opacity={star.opacity}
              />
            ))}
          </g>

          {/* Critical sphere (wireframe) */}
          <g opacity="0.15">
            {criticalSphere.map((circle, i) => (
              <path
                key={i}
                d={pointsToPath(circle)}
                fill="none"
                stroke="#88e5ff"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Positive frequency helix e^{+iωt} */}
          {showComponents && (
            <path
              d={pointsToPath(helicalPaths.positiveHelix)}
              fill="none"
              stroke="#8ef7ff"
              strokeWidth="3"
              opacity="0.7"
            />
          )}

          {/* Negative frequency helix e^{-iωt} */}
          {showComponents && (
            <path
              d={pointsToPath(helicalPaths.negativeHelix)}
              fill="none"
              stroke="#e38cff"
              strokeWidth="3"
              opacity="0.7"
            />
          )}

          {/* Combined quaternionic spinor trajectory */}
          <path
            d={pointsToPath(spinorTrajectory) + ' Z'}
            fill="none"
            stroke="#ffb454"
            strokeWidth="4"
          />

          {/* Current position markers */}
          {showComponents && (
            <>
              <circle
                cx={currentMarkers.posMarker.x}
                cy={currentMarkers.posMarker.y}
                r="6"
                fill="#8ef7ff"
              />
              <circle
                cx={currentMarkers.negMarker.x}
                cy={currentMarkers.negMarker.y}
                r="6"
                fill="#e38cff"
              />
            </>
          )}
          <circle
            cx={currentMarkers.spinorMarker.x}
            cy={currentMarkers.spinorMarker.y}
            r="8"
            fill="#ffb454"
          />

          {/* Labels */}
          {/* Left: Simple form */}
          <text 
            x="20" 
            y="60" 
            fontSize="40" 
            fontFamily="Georgia, Times New Roman, serif"
            fontStyle="italic"
            opacity="0.95"
          >
            <tspan fill="#ffb454">ψ</tspan><tspan fill="#ffb454" fontStyle="normal" fontSize="30" baselineShift="sub">q</tspan><tspan fill="#ffb454"> = </tspan><tspan fill="#8ef7ff">e</tspan><tspan fill="#8ef7ff" fontSize="30" baselineShift="super">+iωt</tspan><tspan fill="#ffb454"> + </tspan><tspan fill="#e38cff">e</tspan><tspan fill="#e38cff" fontSize="30" baselineShift="super">−iωt</tspan>
          </text>
          
          {/* Right: Quaternionic form equation image - clickable link to EigenCircle */}
          <a href="/eigen-circle" style={{ cursor: 'pointer' }}>
            <image 
              href={quaternionicEquation}
              x="560"
              y="10"
              width="600"
              height="100"
              opacity="0.95"
            />
          </a>
        </svg>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-t border-white/10 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm text-blue-100">Frequency ω</label>
          <input 
            type="range" 
            min="0.2" 
            max="3" 
            step="0.1" 
            value={omega}
            onChange={(e) => setOmega(parseFloat(e.target.value))}
            className="w-32"
            data-testid="input-omega"
          />
          <span className="text-xs text-blue-200 w-12">{omega.toFixed(1)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-blue-100">Amplitude</label>
          <input 
            type="range" 
            min="0.3" 
            max="1.5" 
            step="0.1" 
            value={amplitude}
            onChange={(e) => setAmplitude(parseFloat(e.target.value))}
            className="w-32"
            data-testid="input-amplitude"
          />
          <span className="text-xs text-blue-200 w-12">{amplitude.toFixed(1)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-blue-100">Show components</label>
          <input 
            type="checkbox" 
            checked={showComponents}
            onChange={(e) => setShowComponents(e.target.checked)}
            data-testid="checkbox-components"
          />
        </div>
        
        <button 
          onClick={() => setRunning(!running)}
          className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors text-sm text-blue-100"
          data-testid="button-pause"
        >
          {running ? '⏸ Pause' : '▶︎ Play'}
        </button>
        
        <button 
          onClick={handleReset}
          className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors text-sm text-blue-100"
          data-testid="button-reset"
        >
          Reset View
        </button>

        <div className="text-xs text-blue-300/70 ml-auto">
          Drag to rotate • Scroll page to zoom
        </div>
      </div>
    </div>
  );
}
