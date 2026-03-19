import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import EigenSpinorVisual from "@/components/EigenSpinorVisual";

export default function EigenSpinor() {
  useEffect(() => {
    document.title = "Eigen Spinor: Counter-Rotating Laplace Modes | RQM Technologies";
    
    const metaDescription = document.createElement("meta");
    metaDescription.name = "description";
    metaDescription.content = "Interactive visualization of the EigenCircle's physical origin: standing resonance formed by two counter-rotating Laplace exponentials in quaternionic quantum mechanics.";
    document.head.appendChild(metaDescription);

    return () => {
      document.head.removeChild(metaDescription);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Navigation */}
        <div className="mb-6 md:mb-8">
          <Link href="/eigen-circle">
            <button className="inline-flex items-center text-blue-300 hover:text-blue-200 transition-colors text-sm md:text-base" data-testid="link-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to EigenCircle
            </button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
            Eigen Spinor as Counter-Rotating Laplace Modes
          </h1>
          <div className="overflow-x-auto">
            <p className="text-base md:text-lg lg:text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Interactive 3D visualization of Ψ<sub>eig</sub>(t) = (e<sup>+iωt</sup>, e<sup>-iωt</sup>) showing how two counter-rotating helical paths in quaternionic space combine to form the <span className="font-semibold text-cyan-300">EigenCircle</span> standing resonance.
            </p>
          </div>
        </div>

        {/* Interactive Visualization */}
        <div className="mb-12 md:mb-16">
          <EigenSpinorVisual />
        </div>

        {/* Educational Content */}
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          {/* What You're Seeing */}
          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-blue-200">What You're Seeing</h2>
            <div className="space-y-4 text-blue-50 leading-relaxed">
              <p>
                The 3D visualization above reveals the fundamental mechanism behind the <Link href="/eigen-circle" className="text-cyan-300 hover:text-cyan-200 underline">EigenCircle</Link>: two counter-rotating helical trajectories in quaternionic space that interfere to create a standing resonance pattern. You can drag to rotate the view and watch how the counter-rotating modes evolve in real-time.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6">
                <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-xl p-3 md:p-4">
                  <h3 className="font-semibold text-cyan-300 mb-2 text-sm md:text-base overflow-x-auto">Cyan Helix: e<sup>+iωt</sup></h3>
                  <p className="text-xs md:text-sm text-blue-100">
                    The cyan helical path spirals counter-clockwise (CCW) through 3D quaternionic space, representing positive frequency evolution — forward time propagation.
                  </p>
                </div>
                
                <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-3 md:p-4">
                  <h3 className="font-semibold text-purple-300 mb-2 text-sm md:text-base overflow-x-auto">Magenta Helix: e<sup>-iωt</sup></h3>
                  <p className="text-xs md:text-sm text-blue-100">
                    The magenta helical path spirals clockwise (CW) through 3D space, representing negative frequency evolution — backward time propagation in the spinor basis.
                  </p>
                </div>
                
                <div className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-3 md:p-4">
                  <h3 className="font-semibold text-orange-300 mb-2 text-sm md:text-base">Orange Ellipse: Combined Spinor</h3>
                  <p className="text-xs md:text-sm text-blue-100">
                    The orange elliptical trajectory shows the quaternionic spinor formed by the interference of the two counter-rotating modes — the EigenCircle standing resonance.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-blue-200 bg-blue-900/30 border-l-4 border-cyan-400 pl-6 py-4">
                Toggle "Show components" to hide the individual helices and see just the resulting quaternionic spinor trajectory. The semi-transparent wireframe sphere represents the critical sphere at Re(q) = 1/2.
              </p>
            </div>
          </section>

          {/* Why This Matters */}
          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-blue-200">Why This Matters for Quantum Mechanics</h2>
            <div className="space-y-4 text-sm md:text-base text-blue-50 leading-relaxed">
              <p>
                In Resonant Quantum Mechanics (RQM), the quantum wavefunction isn't just a single rotating vector — it's fundamentally a <span className="font-semibold text-cyan-300">spinor</span> composed of two counter-rotating components. This structure is encoded in the quaternionic formulation where:
              </p>
              
              <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-cyan-400/30 rounded-xl p-4 md:p-6 my-4 md:my-6 overflow-x-auto">
                <div className="text-center font-mono text-base md:text-lg whitespace-nowrap">
                  Ψ<sub>eig</sub>(t) = (e<sup>+iωt</sup>, e<sup>-iωt</sup>)
                </div>
              </div>
              
              <p>
                Each component carries the same energy but opposite angular momentum. When these two modes interfere, they don't cancel out — instead, they create a <span className="font-semibold text-cyan-300">standing wave pattern</span> in the quaternionic spectral geometry. This standing pattern is precisely what we observe as the EigenCircle.
              </p>
              
              <p>
                The critical insight: the <Link href="/eigen-circle" className="text-cyan-300 hover:text-cyan-200 underline">critical line</Link> at Re(z) = 1/2 in the Riemann zeta function corresponds to this perfect balance between forward and backward rotating modes. It's not an arbitrary mathematical curiosity — it's the geometric signature of quantum coherence itself.
              </p>
            </div>
          </section>

          {/* Physical Interpretation */}
          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-blue-200">Physical Interpretation</h2>
            <div className="space-y-4 text-blue-50 leading-relaxed">
              <p>
                Think of this like two synchronized swimmers moving in opposite circles around a pool. Individually, they trace circular paths. But if you track their center of mass and project it onto a reference circle, you get a stable, predictable pattern that oscillates but never grows or decays.
              </p>
              
              <div className="bg-blue-900/30 border-l-4 border-cyan-400 pl-6 py-4 my-6">
                <p className="text-cyan-200 font-semibold mb-2">Key Physics Principle:</p>
                <p>
                  The EigenCircle represents <span className="font-semibold">maximum coherence</span> — a quantum state where positive and negative frequency components are perfectly balanced. This is why it appears on the critical line: it's the unique geometric locus where quantum resonance achieves stability without damping or growth.
                </p>
              </div>
              
              <p>
                In practical terms, this explains:
              </p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Why quantum states can be stable (the standing resonance doesn't decay)</li>
                <li>How spin emerges naturally from geometry (the counter-rotation creates angular momentum)</li>
                <li>Why zeros appear on the critical line (perfect resonances at Re(q) = 1/2)</li>
                <li>How quaternionic signal processing achieves superior noise resistance (balanced forward/backward modes)</li>
              </ul>
            </div>
          </section>

          {/* Mathematical Details */}
          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-blue-200">Mathematical Details</h2>
            <div className="space-y-4 text-sm md:text-base text-blue-50 leading-relaxed">
              <p>
                The vector sum of the two counter-rotating exponentials simplifies beautifully:
              </p>
              
              <div className="bg-gradient-to-r from-slate-800/50 to-blue-900/50 border border-blue-400/30 rounded-xl p-4 md:p-6 my-4 md:my-6 font-mono text-xs md:text-sm overflow-x-auto">
                <div className="mb-2 whitespace-nowrap">e<sup>+iωt</sup> + e<sup>-iωt</sup> = (cos ωt + i sin ωt) + (cos ωt - i sin ωt)</div>
                <div className="ml-6 md:ml-12 whitespace-nowrap">= 2 cos ωt</div>
              </div>
              
              <p>
                This real-valued oscillation (2 cos ωt) is then normalized and projected onto the EigenCircle of radius 1, creating the circular trace you see in the middle panel. The projection ensures that regardless of amplitude variations, the resonance always lives on the same geometric structure — the critical sphere S²<sub>crit</sub> in quaternionic space.
              </p>
              
              <p>
                When you adjust the frequency ω using the slider above, you're changing how fast both vectors rotate. The key observation: <span className="font-semibold text-cyan-300">no matter the frequency, the sum always traces the same circle</span>. This frequency-independent geometry is what makes the EigenCircle a universal resonance structure in RQM.
              </p>
            </div>
          </section>

          {/* Connection to DARPA Technology */}
          <section className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-400/30 rounded-2xl p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-amber-200">Connection to DARPA ERIS Technology</h2>
            <div className="space-y-4 text-blue-50 leading-relaxed">
              <p>
                This counter-rotating mode structure is the foundation of RQM Technologies' <span className="font-semibold text-amber-300">quaternionic signal processing</span> technology, which has achieved <Link href="/eris-achievement" className="text-amber-300 hover:text-amber-200 underline">DARPA ERIS Marketplace "Awardable" status</Link>.
              </p>
              
              <p>
                By decomposing signals into forward and backward rotating quaternionic components (exactly as shown in this visualization), the technology achieves:
              </p>
              
              <ul className="list-disc list-inside space-y-2 ml-4 text-amber-100">
                <li>Enhanced noise rejection through balanced spectral analysis</li>
                <li>Improved coherence detection in multi-dimensional signal spaces</li>
                <li>Robust error correction from natural quaternionic redundancy</li>
                <li>Superior performance in defense and aerospace applications</li>
              </ul>
              
              <p className="mt-4 text-sm text-amber-200/80">
                Government customers can access this technology through the DARPA ERIS Marketplace at <a href="https://www.darpaconnect.us/eris" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-200">www.darpaconnect.us/eris</a>
              </p>
            </div>
          </section>

          {/* Interactive Exploration */}
          <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-blue-200">Interactive Exploration Tips</h2>
            <div className="space-y-3 text-blue-50">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                <p><span className="font-semibold text-cyan-300">Drag to rotate:</span> Click and drag anywhere on the visualization to rotate your view. Watch how the helical paths spiral through 3D space from different angles.</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                <p><span className="font-semibold text-cyan-300">Adjust frequency ω:</span> Change how fast both helices rotate. Higher frequencies create faster spiraling while the interference pattern maintains its elliptical shape.</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                <p><span className="font-semibold text-cyan-300">Change amplitude:</span> Adjust the size of the helical paths and see how the resulting quaternionic spinor trajectory scales proportionally.</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
                <p><span className="font-semibold text-cyan-300">Toggle components:</span> Hide the cyan and magenta helices to see just the orange quaternionic spinor — the pure interference result of the counter-rotating modes.</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">5</div>
                <p><span className="font-semibold text-cyan-300">Pause and observe:</span> Freeze the animation to examine the instantaneous positions of all three trajectories and their geometric relationships.</p>
              </div>
            </div>
          </section>

          {/* Related Pages */}
          <section className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-400/30 rounded-2xl p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-blue-200">Explore Further</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/eigen-circle">
                <div className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl p-4 transition-all cursor-pointer" data-testid="link-eigen-circle">
                  <h3 className="font-semibold text-cyan-300 mb-2">EigenCircle Visualization</h3>
                  <p className="text-sm text-blue-100">Explore the full quaternionic spinor wavefunction and Riemann zeta function on the critical line.</p>
                </div>
              </Link>
              
              <Link href="/quaternionic-spectral-geometry">
                <div className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl p-4 transition-all cursor-pointer" data-testid="link-qsg">
                  <h3 className="font-semibold text-cyan-300 mb-2">Quaternionic Spectral Geometry</h3>
                  <p className="text-sm text-blue-100">Learn about the mathematical framework underlying these resonance structures.</p>
                </div>
              </Link>
              
              <Link href="/quaternionic-spectral-geometry-book">
                <div className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl p-4 transition-all cursor-pointer" data-testid="link-textbook">
                  <h3 className="font-semibold text-cyan-300 mb-2">Digital Textbook</h3>
                  <p className="text-sm text-blue-100">Comprehensive mathematical treatment in "Quaternionic Spectral Geometry: A Calculus for the 21st Century".</p>
                </div>
              </Link>
              
              <Link href="/eris-achievement">
                <div className="bg-white/5 hover:bg-white/10 border border-amber-400/30 rounded-xl p-4 transition-all cursor-pointer" data-testid="link-eris">
                  <h3 className="font-semibold text-amber-300 mb-2">DARPA ERIS Achievement</h3>
                  <p className="text-sm text-blue-100">Learn about our quaternionic signal processing technology's "Awardable" status.</p>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
