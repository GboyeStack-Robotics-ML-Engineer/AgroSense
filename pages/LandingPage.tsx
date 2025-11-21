import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  ArrowRight, 
  WifiOff, 
  ShieldCheck, 
  Cpu, 
  Leaf, 
  Droplets,
  Zap,
  Server,
  Radio,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { View } from '../types';

interface LandingPageProps {
  onNavigate: (view: View) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-lg border-b border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}>
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/50 transition-all">
              <Sprout className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Agro<span className="text-emerald-400">Vision</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <button onClick={() => scrollToSection('edge-tech')} className="hover:text-emerald-400 transition-colors">Edge Tech</button>
            <button onClick={() => scrollToSection('features')} className="hover:text-emerald-400 transition-colors">Features</button>
            <button onClick={() => scrollToSection('about')} className="hover:text-emerald-400 transition-colors">About</button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-emerald-400 transition-colors">Contact</button>
          </div>

          <div className="hidden md:flex items-center gap-4">
             <div className="flex items-center gap-2 text-xs font-medium text-emerald-400/80 bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <WifiOff className="w-3 h-3" />
                <span>Offline Ready</span>
             </div>
             <button 
              onClick={() => onNavigate('dashboard')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
             {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
            <div className="md:hidden absolute top-20 left-0 w-full bg-slate-900 border-b border-white/10 p-6 flex flex-col gap-4 animate-in slide-in-from-top-5">
                <button onClick={() => scrollToSection('edge-tech')} className="text-left text-slate-300 hover:text-emerald-400 py-2">Edge Tech</button>
                <button onClick={() => scrollToSection('features')} className="text-left text-slate-300 hover:text-emerald-400 py-2">Features</button>
                <button onClick={() => scrollToSection('about')} className="text-left text-slate-300 hover:text-emerald-400 py-2">About</button>
                <button onClick={() => scrollToSection('contact')} className="text-left text-slate-300 hover:text-emerald-400 py-2">Contact</button>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="bg-emerald-500 text-slate-950 w-full py-3 rounded-lg font-bold mt-2 flex justify-center items-center gap-2"
                >
                  Open Dashboard <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center min-h-screen lg:min-h-0">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grain-y-texture.png')] opacity-20"></div> {/* Simulated grain */}
           {/* Animated Grid */}
          <div className="absolute inset-0 opacity-20" 
               style={{ backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>
        </div>

        <div className={`max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 text-sm font-medium backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Local AI Engine Online
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight text-white">
              Smart Farming. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 animate-gradient-x">
                No Cloud Required.
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl border-l-2 border-emerald-500/30 pl-6">
              Deploy advanced generative AI for soil analysis, crop health, and security directly on the edge. 
              Zero latency, 100% data privacy, and works perfectly offline.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => onNavigate('dashboard')}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 group"
              >
                Launch System
                <Zap className="w-5 h-5 group-hover:fill-slate-950 transition-colors" />
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm border border-white/10 hover:border-emerald-500/30 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
              >
                Explore Features
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative hidden lg:block">
             {/* Abstract Tech Visual */}
             <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Cpu className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">Edge Core v1.2</div>
                                <div className="text-xs text-emerald-400">Processing Locally</div>
                            </div>
                        </div>
                        <div className="text-xs font-mono text-slate-500">LATENCY: &lt;10ms</div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                            <div className="flex justify-between text-xs text-slate-400 mb-2">
                                <span>GEMINI-NANO-LOAD</span>
                                <span>42%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[42%] animate-pulse"></div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col items-center text-center">
                                <WifiOff className="w-6 h-6 text-slate-400 mb-2" />
                                <div className="text-xs font-bold text-slate-300">Internet</div>
                                <div className="text-[10px] text-red-400 mt-1">DISCONNECTED</div>
                            </div>
                             <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col items-center text-center">
                                <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
                                <div className="text-xs font-bold text-slate-300">Security</div>
                                <div className="text-[10px] text-emerald-400 mt-1">ACTIVE</div>
                            </div>
                        </div>
                        
                        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                             <div className="text-xs text-emerald-300 font-mono mb-2">> DETECTING CROP STRESS...</div>
                             <div className="text-xs text-white font-mono">> ANALYSIS COMPLETE.</div>
                             <div className="text-xs text-white font-mono">> OPTIMIZING IRRIGATION.</div>
                        </div>
                    </div>
                </div>
                
                {/* Floating Badge */}
                <div className="absolute -bottom-6 -left-6 bg-slate-800 p-4 rounded-xl border border-white/10 shadow-xl flex items-center gap-3 animate-bounce duration-[3000ms]">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                    <span className="text-sm font-bold text-white">System Healthy</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Edge Tech Section */}
      <section id="edge-tech" className="py-20 bg-slate-900 border-y border-white/5">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">Why Edge Computing?</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">In remote farming locations, internet connectivity is a luxury. Our system is built to perform critical AI tasks locally.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-slate-950 p-8 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all hover:-translate-y-1 group">
                    <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/10 group-hover:border-emerald-500/50">
                        <WifiOff className="w-7 h-7 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Zero Connectivity</h3>
                    <p className="text-slate-400 leading-relaxed">
                        Don't rely on the cloud. All sensor data processing and AI inference happen directly on the device.
                    </p>
                </div>
                
                <div className="bg-slate-950 p-8 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all hover:-translate-y-1 group">
                    <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/10 group-hover:border-emerald-500/50">
                        <Zap className="w-7 h-7 text-slate-400 group-hover:text-yellow-400 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Real-Time Latency</h3>
                    <p className="text-slate-400 leading-relaxed">
                        Immediate decision making. From detecting intruders to adjusting water levels, milliseconds matter.
                    </p>
                </div>

                <div className="bg-slate-950 p-8 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all hover:-translate-y-1 group">
                    <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/10 group-hover:border-emerald-500/50">
                        <Server className="w-7 h-7 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Data Sovereignty</h3>
                    <p className="text-slate-400 leading-relaxed">
                        Your farm data stays on your farm. No external servers, no data leaks, complete privacy.
                    </p>
                </div>
            </div>
         </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
             <span className="text-emerald-400 font-bold tracking-wider uppercase text-sm mb-2 block">System Modules</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Comprehensive Farm Management</h2>
            <p className="text-slate-400">An integrated ecosystem covering every aspect of your agricultural operation.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Droplets}
              title="Precision Irrigation"
              desc="AI-driven analysis of soil moisture, temperature, and pH levels to optimize water usage."
              color="text-blue-400"
              bg="bg-blue-400/10"
              borderColor="group-hover:border-blue-400/50"
              onClick={() => onNavigate('soil')}
            />
            <FeatureCard 
              icon={Leaf}
              title="Health Analysis"
              desc="Computer vision models detect early signs of nutrient deficiency and disease on leaves."
              color="text-emerald-400"
              bg="bg-emerald-400/10"
              borderColor="group-hover:border-emerald-400/50"
              onClick={() => onNavigate('health')}
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Perimeter Defense"
              desc="Motion detection with object classification to distinguish between animals and intruders."
              color="text-rose-400"
              bg="bg-rose-400/10"
              borderColor="group-hover:border-rose-400/50"
              onClick={() => onNavigate('security')}
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-gradient-to-b from-slate-900 to-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-5">
          <Sprout className="w-96 h-96" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Sustainable Farming Through <span className="text-emerald-400">Edge AI</span></h2>
              <div className="w-20 h-1 bg-emerald-500 rounded-full"></div>
              <p className="text-slate-300 text-lg leading-relaxed">
                AgroVision isn't just a dashboard; it's a self-contained brain for your farm. By bridging the gap between physical sensors and generative AI, we give farmers the "eyes" and "brains" needed to make data-driven decisions without relying on fragile internet infrastructure.
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">100%</div>
                  <div className="text-sm text-slate-400">Offline Uptime</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">24/7</div>
                  <div className="text-sm text-slate-400">Continuous Monitoring</div>
                </div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900">
                <img 
                  src="https://images.unsplash.com/photo-1625246333195-f8196ba15330?q=80&w=2070&auto=format&fit=crop" 
                  alt="Smart Technology" 
                  className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                   <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">System Active</span>
                   </div>
                   <p className="text-sm text-slate-300">Autonomous drone surveillance and sensor aggregation in progress.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-slate-950 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-gradient-to-br from-emerald-900 to-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grain-y-texture.png')] opacity-10"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Deploy AgroVision</h3>
                <p className="text-emerald-100/80 mb-8">Ready to take your farm off the grid? Contact our specialized edge deployment team.</p>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3 text-emerald-100">
                  <div className="p-2 bg-white/10 rounded-lg"><Radio className="w-4 h-4" /></div>
                  <span>deploy@agrovision.edge</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-100">
                  <div className="p-2 bg-white/10 rounded-lg"><ShieldCheck className="w-4 h-4" /></div>
                  <span>Secure Encrypted Line</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 p-10">
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Message encrypted and queued for transmission.'); }}>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Operator Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white outline-none transition-colors" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Farm ID / Location</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white outline-none transition-colors" placeholder="Sector 7G" />
                </div>
                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-emerald-500/20 mt-2">
                  Initiate Contact
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white opacity-90">
            <Sprout className="w-5 h-5 text-emerald-500" />
            <span className="font-bold tracking-tight">AgroVision <span className="text-slate-600 font-normal text-sm ml-2">EdgeOS v2.1</span></span>
          </div>
          <div className="text-slate-600 text-sm">
            © 2025 SmartEdge AgroVision. Local Processing Unit.
          </div>
          <div className="flex gap-6 text-slate-500 text-sm">
            <a href="#" className="hover:text-emerald-400 transition-colors">System Status</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Docs</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, color, bg, borderColor, onClick }: { icon: any, title: string, desc: string, color: string, bg: string, borderColor: string, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`p-8 rounded-2xl bg-slate-900 border border-white/5 hover:border-opacity-50 transition-all duration-300 group hover:-translate-y-1 ${borderColor} cursor-pointer relative overflow-hidden`}
  >
    <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm">
      {desc}
    </p>
    <div className="mt-6 flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 text-white">
      <span className={color}>Enter Module</span> <ArrowRight className={`w-3 h-3 ${color}`} />
    </div>
  </div>
);

export default LandingPage;