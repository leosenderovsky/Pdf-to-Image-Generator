import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrainCircuit, Feather, Users, PenTool, Video, Layout, Image, Type, 
  Palette, Sliders, Mic, Music, Headphones, Film, Globe, Unlock, 
  Scissors, Smartphone, ShieldCheck, Cloud, Monitor, Languages, Share2,
  ChevronRight, ChevronLeft, Play, Info, ArrowRight, Zap, CheckCircle2
} from 'lucide-react';
import { roadmapData, zeroCostWorkflow } from './data';

const iconMap: Record<string, React.ElementType> = {
  BrainCircuit, Feather, Users, PenTool, Video, Layout, Image, Type, 
  Palette, Sliders, Mic, Music, Headphones, Film, Globe, Unlock, 
  Scissors, Smartphone, ShieldCheck, Cloud, Monitor, Languages, Share2
};

function App() {
  const [activePhase, setActivePhase] = useState<number>(1);

  const currentPhaseData = roadmapData.find(p => p.phase === activePhase);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500/30">
      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-indigo-950/20 to-transparent pt-24 pb-16">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/cinema/1920/1080?blur=10')] opacity-5 bg-cover bg-center mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-6 border border-indigo-500/20">
              <Zap className="w-4 h-4" />
              <span>Paradigma 2026</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Orquestación <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Audiovisual
              </span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl">
              El Master Roadmap de Producción con IA. La IA automatiza los activos; la dirección humana orquesta la narrativa.
            </p>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6 px-4">
            Fases de Producción
          </h2>
          <div className="flex flex-col gap-1 relative">
            <div className="absolute left-[23px] top-6 bottom-6 w-px bg-white/10 z-0 hidden lg:block"></div>
            {roadmapData.map((phase) => (
              <button
                key={phase.phase}
                onClick={() => setActivePhase(phase.phase)}
                className={`relative z-10 flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200 ${
                  activePhase === phase.phase 
                    ? 'bg-white/10 shadow-lg ring-1 ring-white/20' 
                    : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 transition-colors ${
                  activePhase === phase.phase 
                    ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  {phase.phase}
                </div>
                <div>
                  <div className={`font-medium ${activePhase === phase.phase ? 'text-white' : ''}`}>
                    {phase.title}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {currentPhaseData && (
              <motion.div
                key={currentPhaseData.phase}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-indigo-400 font-mono text-sm">Fase 0{currentPhaseData.phase}</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/50 to-transparent"></div>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">{currentPhaseData.title}</h2>
                  <p className="text-xl text-gray-400">{currentPhaseData.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentPhaseData.tools.map((tool, idx) => {
                    const Icon = iconMap[tool.icon] || Info;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={tool.name} 
                        className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-100">{tool.name}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {tool.specialty}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* Full Width Sections */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        {/* Zero Cost Workflow Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-3 flex items-center gap-3">
              <Play className="w-8 h-8 text-indigo-400" />
              El Flujo Maestro a Costo Cero/Mínimo
            </h3>
            <p className="text-xl text-gray-400 mb-10">Un pipeline completo utilizando planes gratuitos o de bajo costo.</p>
            
            <div className="flex flex-wrap items-center gap-4">
              {zeroCostWorkflow.map((item, idx) => (
                <React.Fragment key={item.step}>
                  <div className="flex flex-col bg-black/40 border border-white/10 rounded-xl p-5 min-w-[180px] flex-1 hover:bg-white/5 transition-colors">
                    <span className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">{item.step}</span>
                    <span className="text-base font-medium text-indigo-300">{item.tool}</span>
                  </div>
                  {idx < zeroCostWorkflow.length - 1 && (
                    <div className="hidden lg:flex items-center justify-center text-gray-600">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Conclusion */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 p-10 bg-white/[0.02] border border-white/5 rounded-3xl text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-500/5"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-6 text-gray-200">El Orquestador Audiovisual</h3>
            <p className="text-xl text-gray-400 max-w-4xl mx-auto italic leading-relaxed">
              "La IA automatiza la producción técnica de activos. Sin embargo, el juicio humano, el gusto estético y la dirección orquestal son el verdadero—y único—diferencial competitivo en 2026. <span className="text-indigo-300 font-semibold not-italic">No compitas con la máquina; dirígela.</span>"
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;
