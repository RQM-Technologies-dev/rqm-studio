import { Line } from '@react-three/drei'
import * as THREE from 'three'
import type { Quaternion as RQMQuat } from '../../math/quaternion/types'
import { rotateVector } from '../../math/quaternion/quaternion'

interface Props {
  stateQuaternion: RQMQuat
}

const SPHERE_RADIUS = 1.2

export function QuantumSphere({ stateQuaternion }: Props) {

  // cos φ = w component of the quaternion (with canonicalization w ≥ 0).
  // Scale the sphere so it visually shrinks/grows with cos φ:
  // full size at w = 1 (identity) down to 40% at w = 0 (180° rotation).
  const cosPhi = Math.abs(stateQuaternion.w)
  const scaledRadius = SPHERE_RADIUS * (0.4 + 0.6 * cosPhi)

  // Compute the Bloch sphere state vector using the canonical quaternion rotation
  // p′ = q p q* applied to the |0⟩ reference axis [0, 0, 1].
  // This directly implements theory §12: r′ = q r₀ q⁻¹.
  const [bx, by, bz] = rotateVector([0, 0, 1], stateQuaternion)

  const bloch = new THREE.Vector3(bx, by, bz).normalize().multiplyScalar(scaledRadius)

  return (
    <group>
      {/* Wireframe unit sphere */}
      <mesh>
        <sphereGeometry args={[scaledRadius, 32, 32]} />
        <meshBasicMaterial
          color="#0f1629"
          wireframe={false}
          transparent
          opacity={0.15}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[scaledRadius, 24, 24]} />
        <meshBasicMaterial
          color="#06b6d4"
          wireframe={true}
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Equatorial circle */}
      <EquatorialRing radius={scaledRadius} />

      {/* XYZ axes */}
      <AxisLine start={[-scaledRadius * 1.3, 0, 0]} end={[scaledRadius * 1.3, 0, 0]} color="#f87171" />
      <AxisLine start={[0, -scaledRadius * 1.3, 0]} end={[0, scaledRadius * 1.3, 0]} color="#86efac" />
      <AxisLine start={[0, 0, -scaledRadius * 1.3]} end={[0, 0, scaledRadius * 1.3]} color="#93c5fd" />

      {/* State vector */}
      <StateVector tip={bloch} />

      {/* Pole labels */}
      <PoleDots radius={scaledRadius} />
    </group>
  )
}

function EquatorialRing({ radius }: { radius: number }) {
  const points: THREE.Vector3[] = []
  const n = 64
  for (let i = 0; i <= n; i++) {
    const theta = (i / n) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius))
  }
  return (
    <Line
      points={points}
      color="#1e3a5f"
      lineWidth={1}
      transparent
      opacity={0.5}
    />
  )
}

function AxisLine({
  start,
  end,
  color,
}: {
  start: [number, number, number]
  end: [number, number, number]
  color: string
}) {
  return (
    <Line
      points={[new THREE.Vector3(...start), new THREE.Vector3(...end)]}
      color={color}
      lineWidth={1.5}
      transparent
      opacity={0.6}
    />
  )
}

function StateVector({ tip }: { tip: THREE.Vector3 }) {
  const origin = new THREE.Vector3(0, 0, 0)

  return (
    <group>
      {/* Shaft */}
      <Line
        points={[origin, tip]}
        color="#22d3ee"
        lineWidth={3}
      />
      {/* Tip sphere */}
      <mesh position={tip}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
    </group>
  )
}

function PoleDots({ radius }: { radius: number }) {
  return (
    <>
      {/* |0⟩ north pole */}
      <mesh position={[0, radius, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#86efac" />
      </mesh>
      {/* |1⟩ south pole */}
      <mesh position={[0, -radius, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#f87171" />
      </mesh>
    </>
  )
}
