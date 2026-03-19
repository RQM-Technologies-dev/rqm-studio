import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { QuantumSphere } from './QuantumSphere'
import { useStudioStore } from '../../store'

export function Scene() {
  const currentQuaternion = useStudioStore((s) => s.currentQuaternion)

  return (
    <Canvas
      camera={{ position: [2.5, 1.5, 2.5], fov: 45 }}
      className="w-full h-full"
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={['#0a0e1a']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#06b6d4" />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#14b8a6" />

      <QuantumSphere stateQuaternion={currentQuaternion} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={6}
        makeDefault
      />
    </Canvas>
  )
}
