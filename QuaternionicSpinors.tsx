import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, FileText, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuaternionicSpinors() {
  useEffect(() => {
    document.title = "Geometric Quantum Spinors - Resonant Quantum Mechanics";
    
    const metaDescription = document.createElement("meta");
    metaDescription.name = "description";
    metaDescription.content = "Geometric interpretation of quantum spinors as stable solutions on quaternionic manifolds, providing new insights into quantum state structure and behavior.";
    document.head.appendChild(metaDescription);

    return () => {
      document.head.removeChild(metaDescription);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <h1 className="text-4xl font-bold text-quantum-dark mb-4">
            Physics of RQM
          </h1>
          
          <p className="text-lg text-quantum-gray leading-relaxed">
            Fundamental interpretation of quantum mechanics as coherent geometric resonances, 
            explicitly defining spinors as stable solutions on the quaternionic manifold S³×R, 
            where quantum states emerge deterministically from resonance alignments.
          </p>
        </div>

        <div className="space-y-8">
          <div className="grid gap-6">
            {/* Quaternionic Resonance and Spin-Statistics */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-quantum-dark mb-2">
                    Quaternionic Resonance and the Spin-Statistics Theorem
                  </h3>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 text-sm text-quantum-gray">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        John Van Geem
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        2025-06-23
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        Research
                      </span>
                    </div>
                    <Link href="/spin-statistics">
                      <Button size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Research Paper
                      </Button>
                    </Link>
                  </div>
                  <p className="text-quantum-gray leading-relaxed mb-4">
                    Rigorous quantum-computational and mathematical validations of the geometric origin 
                    of the Spin-Statistics theorem within the Resonant Quantum Mechanics (RQM) framework.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Quaternionic", "Spin-Statistics", "RQM", "Geometric Topology"].map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>




          </div>
        </div>
      </div>
    </div>
  );
}