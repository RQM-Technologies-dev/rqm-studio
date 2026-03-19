import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function QuaternionicSpinor() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-quantum-light to-quantum-lighter">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-quantum-deep">
              Quaternionic Critical Spinor Stability at Riemann Zeta Zeros
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm md:text-base text-quantum-gray">
              <span className="font-medium">John Van Geem</span>
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
              <span>June 23, 2025</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="text-xs md:text-sm">Quaternionic</Badge>
              <Badge variant="outline" className="text-xs md:text-sm">Riemann Zeta</Badge>
              <Badge variant="outline" className="text-xs md:text-sm">Spinor Stability</Badge>
              <Badge variant="outline" className="text-xs md:text-sm">Critical Zeros</Badge>
            </div>
          </div>

          {/* Introduction */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl lg:text-2xl text-quantum-deep">Introduction</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 lg:p-8">
              <p className="text-sm md:text-base text-quantum-gray leading-relaxed">
                This document summarizes the numerical verification of quaternionic critical spinor stability 
                at selected nontrivial zeros of the Riemann zeta function, specifically focusing on coherence 
                and symmetry.
              </p>
            </CardContent>
          </Card>

          {/* Quaternionic Critical Spinor Equation */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl lg:text-2xl text-quantum-deep">Quaternionic Critical Spinor Equation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4 md:p-6 lg:p-8">
              <div>
                <p className="text-sm md:text-base text-quantum-gray mb-4">
                  The critical quaternionic spinor state is defined as:
                </p>
                <div className="overflow-x-auto">
                  <div className="bg-quantum-lighter p-4 md:p-6 rounded-lg border">
                    <div className="text-center font-mono text-sm md:text-base lg:text-lg">
                      ψ<sub>q</sub>(1/2 + it) = 
                      <div className="mt-2">
                        <div className="inline-block border-l-2 border-r-2 border-quantum-deep pl-4 pr-4 py-2">
                          <div>ζ(1/2 + it)e<sup>iωt</sup></div>
                          <div className="mt-2">ζ(1/2 - it)e<sup>-iωt</sup></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm md:text-base text-quantum-gray mb-4">
                  The refined coherence measure used is:
                </p>
                <div className="overflow-x-auto">
                  <div className="bg-quantum-lighter p-4 md:p-6 rounded-lg border">
                    <div className="text-center font-mono text-sm md:text-base lg:text-lg">
                      C<sub>refined</sub>(t) = |ζ(q)ζ(1 - q)|, where q = 1/2 + it
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl lg:text-2xl text-quantum-deep">Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-4 md:p-6 lg:p-8">
              {/* First Critical Zero */}
              <div>
                <h3 className="text-base md:text-lg lg:text-xl font-semibold text-quantum-deep mb-4">
                  First Critical Zero (t = 14.134725141)
                </h3>
                <div className="bg-quantum-lighter p-4 md:p-6 rounded-lg border space-y-3">
                  <div className="overflow-x-auto">
                    <div className="grid gap-2 font-mono text-xs md:text-sm">
                      <div>ζ(1/2 + it) = 9.1616×10<sup>-11</sup> - 5.7548×10<sup>-10</sup>i</div>
                      <div>ζ(1/2 - it) = 9.1616×10<sup>-11</sup> + 5.7548×10<sup>-10</sup>i</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm md:text-base text-quantum-gray">
                    <div>• Magnitude symmetry verified</div>
                    <div>• Refined coherence measure: <span className="font-mono">3.396×10<sup>-19</sup></span></div>
                  </div>
                </div>
              </div>

              {/* Second Critical Zero */}
              <div>
                <h3 className="text-base md:text-lg lg:text-xl font-semibold text-quantum-deep mb-4">
                  Second Critical Zero (t = 21.022039639)
                </h3>
                <div className="bg-quantum-lighter p-4 md:p-6 rounded-lg border space-y-3">
                  <div className="overflow-x-auto">
                    <div className="grid gap-2 font-mono text-xs md:text-sm">
                      <div>ζ(1/2 + it) = 5.6821×10<sup>-11</sup> + 2.5341×10<sup>-10</sup>i</div>
                      <div>ζ(1/2 - it) = 5.6821×10<sup>-11</sup> - 2.5341×10<sup>-10</sup>i</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm md:text-base text-quantum-gray">
                    <div>• Magnitude symmetry verified</div>
                    <div>• Refined coherence measure: <span className="font-mono">6.745×10<sup>-20</sup></span></div>
                  </div>
                </div>
              </div>

              {/* Third Critical Zero */}
              <div>
                <h3 className="text-base md:text-lg lg:text-xl font-semibold text-quantum-deep mb-4">
                  Third Critical Zero (t = 25.010857580)
                </h3>
                <div className="bg-quantum-lighter p-4 md:p-6 rounded-lg border space-y-3">
                  <div className="overflow-x-auto">
                    <div className="grid gap-2 font-mono text-xs md:text-sm">
                      <div>ζ(1/2 + it) = 6.5565×10<sup>-11</sup> - 1.8878×10<sup>-10</sup>i</div>
                      <div>ζ(1/2 - it) = 6.5565×10<sup>-11</sup> + 1.8878×10<sup>-10</sup>i</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm md:text-base text-quantum-gray">
                    <div>• Magnitude symmetry verified</div>
                    <div>• Refined coherence measure: <span className="font-mono">3.994×10<sup>-20</sup></span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conclusion */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl lg:text-2xl text-quantum-deep">Conclusion</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 lg:p-8">
              <p className="text-sm md:text-base text-quantum-gray leading-relaxed">
                The quaternionic critical spinor state has been rigorously confirmed to exhibit maximal 
                coherence stability and symmetric properties at critical zeros of the Riemann zeta function, 
                aligning with the predictions of the Resonant Quantum Mechanics model.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}