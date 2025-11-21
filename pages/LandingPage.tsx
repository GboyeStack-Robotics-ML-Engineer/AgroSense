import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  ArrowRight, 
  WifiOff, 
  ShieldCheck, 
  Leaf, 
  Droplets,
  Zap,
  Server,
  Radio,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  ScanLine,
  Check,
  AlertTriangle,
  Thermometer,
  User,
  Binary,
  Cpu,
  Aperture
} from 'lucide-react';
import { View } from '../types';

interface LandingPageProps {
  onNavigate: (view: View) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, isDarkMode, toggleTheme }) => {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden transition-colors duration-300">
      
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-white/10 shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}>
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/50 transition-all">
              <Sprout className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Agro<span className="text-emerald-600 dark:text-emerald-400">Vision</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button onClick={() => scrollToSection('edge-tech')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Edge Tech</button>
            <button onClick={() => scrollToSection('features')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Features</button>
            <button onClick={() => scrollToSection('about')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">About</button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Contact</button>
          </div>

          <div className="hidden md:flex items-center gap-4">
             <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400/80 bg-emerald-100 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <WifiOff className="w-3 h-3" />
                <span>Offline Ready</span>
             </div>
             <button 
              onClick={() => onNavigate('dashboard')}
              className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-emerald-500/20 dark:shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-900 dark:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
             {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
            <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 p-6 flex flex-col gap-4 animate-in slide-in-from-top-5 shadow-xl">
                <button onClick={() => scrollToSection('edge-tech')} className="text-left text-slate-600 dark:text-slate-300 hover:text-emerald-500 py-2">Edge Tech</button>
                <button onClick={() => scrollToSection('features')} className="text-left text-slate-600 dark:text-slate-300 hover:text-emerald-500 py-2">Features</button>
                <button onClick={() => scrollToSection('about')} className="text-left text-slate-600 dark:text-slate-300 hover:text-emerald-500 py-2">About</button>
                <button onClick={() => scrollToSection('contact')} className="text-left text-slate-600 dark:text-slate-300 hover:text-emerald-500 py-2">Contact</button>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 w-full py-3 rounded-lg font-bold mt-2 flex justify-center items-center gap-2"
                >
                  Open Dashboard <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center min-h-screen lg:min-h-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent dark:from-emerald-900/20 dark:via-slate-950 dark:to-slate-950"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grain-y-texture.png')] opacity-20"></div> 
          {/* Animated Grid */}
          <div className="absolute inset-0 opacity-5 dark:opacity-20" 
               style={{ backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>
        </div>

        <div className={`max-w-screen-2xl mx-auto px-6 lg:px-12 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium backdrop-blur-md shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Local AI Engine Online
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
              Smart Farming. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 animate-gradient-x">
                No Cloud Required.
              </span>
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl border-l-2 border-emerald-500/30 pl-6">
              Deploy advanced generative AI for soil analysis, crop health, and security directly on the edge. 
              Zero latency, 100% data privacy, and works perfectly offline.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => onNavigate('dashboard')}
                className="px-8 py-4 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-600/20 dark:shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 group"
              >
                Launch System
                <Zap className="w-5 h-5 group-hover:fill-current transition-colors" />
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="px-8 py-4 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-slate-700 dark:text-white backdrop-blur-sm border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
              >
                Explore Features
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative hidden lg:block h-[500px] w-full">
             <SimulatedScanner />
          </div>
        </div>
      </section>

      {/* Floating Theme Toggle */}
      <button 
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xl border border-slate-200 dark:border-slate-700 hover:scale-110 transition-all duration-300 group"
        title="Toggle Theme"
      >
         {isDarkMode ? (
            <Sun className="w-6 h-6 group-hover:text-yellow-400 transition-colors" />
         ) : (
            <Moon className="w-6 h-6 group-hover:text-blue-500 transition-colors" />
         )}
      </button>

      {/* Edge Tech Section */}
      <section id="edge-tech" className="py-20 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-white/5 transition-colors duration-300">
         <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why Edge Computing?</h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">In remote farming locations, internet connectivity is a luxury. Our system is built to perform critical AI tasks locally.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all hover:-translate-y-1 group shadow-sm dark:shadow-none">
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-200 dark:border-white/10 group-hover:border-emerald-500/50 shadow-sm">
                        <WifiOff className="w-7 h-7 text-slate-400 dark:text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Zero Connectivity</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        Don't rely on the cloud. All sensor data processing and AI inference happen directly on the device.
                    </p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all hover:-translate-y-1 group shadow-sm dark:shadow-none">
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-200 dark:border-white/10 group-hover:border-emerald-500/50 shadow-sm">
                        <Zap className="w-7 h-7 text-slate-400 dark:text-slate-400 group-hover:text-yellow-500 dark:group-hover:text-yellow-400 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Real-Time Latency</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        Immediate decision making. From detecting intruders to adjusting water levels, milliseconds matter.
                    </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all hover:-translate-y-1 group shadow-sm dark:shadow-none">
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-200 dark:border-white/10 group-hover:border-emerald-500/50 shadow-sm">
                        <Server className="w-7 h-7 text-slate-400 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Data Sovereignty</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        Your farm data stays on your farm. No external servers, no data leaks, complete privacy.
                    </p>
                </div>
            </div>
         </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
             <span className="text-emerald-600 dark:text-emerald-400 font-bold tracking-wider uppercase text-sm mb-2 block">System Modules</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Comprehensive Farm Management</h2>
            <p className="text-slate-600 dark:text-slate-400">An integrated ecosystem covering every aspect of your agricultural operation.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <FeatureCard 
              icon={Droplets}
              title="Precision Irrigation"
              desc="AI-driven analysis of soil moisture, temperature, and pH levels to optimize water usage."
              color="text-blue-500 dark:text-blue-400"
              bg="bg-blue-100 dark:bg-blue-400/10"
              borderColor="group-hover:border-blue-400/50"
              onClick={() => onNavigate('soil')}
            />
            <FeatureCard 
              icon={Leaf}
              title="Health Analysis"
              desc="Computer vision models detect early signs of nutrient deficiency and disease on leaves."
              color="text-emerald-600 dark:text-emerald-400"
              bg="bg-emerald-100 dark:bg-emerald-400/10"
              borderColor="group-hover:border-emerald-400/50"
              onClick={() => onNavigate('health')}
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Perimeter Defense"
              desc="Motion detection with object classification to distinguish between animals and intruders."
              color="text-rose-500 dark:text-rose-400"
              bg="bg-rose-100 dark:bg-rose-400/10"
              borderColor="group-hover:border-rose-400/50"
              onClick={() => onNavigate('security')}
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-gradient-to-b from-slate-100 to-white dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
          <Sprout className="w-96 h-96" />
        </div>
        
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Sustainable Farming Through <span className="text-emerald-600 dark:text-emerald-400">Edge AI</span></h2>
              <div className="w-20 h-1 bg-emerald-500 rounded-full"></div>
              <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                AgroVision isn't just a dashboard; it's a self-contained brain for your farm. By bridging the gap between physical sensors and generative AI, we give farmers the "eyes" and "brains" needed to make data-driven decisions without relying on fragile internet infrastructure.
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm dark:shadow-none">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">100%</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Offline Uptime</div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm dark:shadow-none">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">24/7</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Continuous Monitoring</div>
                </div>
              </div>
            </div>
            <div className="relative group h-[500px] w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative w-full h-full">
                 <SystemDemoCarousel />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-gradient-to-br from-emerald-800 to-slate-900 p-10 lg:p-16 text-white flex flex-col justify-between relative overflow-hidden">
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
            <div className="md:w-1/2 p-10 lg:p-16">
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Message encrypted and queued for transmission.'); }}>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Operator Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white outline-none transition-colors" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Farm ID / Location</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white outline-none transition-colors" placeholder="Sector 7G" />
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
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-white/5 py-12 transition-colors duration-300">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white opacity-90">
            <Sprout className="w-5 h-5 text-emerald-500" />
            <span className="font-bold tracking-tight">AgroVision <span className="text-slate-500 dark:text-slate-600 font-normal text-sm ml-2">EdgeOS v2.1</span></span>
          </div>
          <div className="text-slate-500 dark:text-slate-600 text-sm">
            © 2025 SmartEdge AgroVision. Local Processing Unit.
          </div>
          <div className="flex gap-6 text-slate-500 dark:text-slate-500 text-sm">
            <a href="#" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">System Status</a>
            <a href="#" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Docs</a>
            <a href="#" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, color, bg, borderColor, onClick }: { icon: any, title: string, desc: string, color: string, bg: string, borderColor: string, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-opacity-50 transition-all duration-300 group hover:-translate-y-1 ${borderColor} cursor-pointer relative overflow-hidden shadow-sm dark:shadow-none`}
  >
    <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
      {desc}
    </p>
    <div className="mt-6 flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 text-slate-900 dark:text-white">
      <span className={color}>Enter Module</span> <ArrowRight className={`w-3 h-3 ${color}`} />
    </div>
  </div>
);

const SystemDemoCarousel = () => {
  const [slide, setSlide] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-3xl overflow-hidden flex flex-col border border-slate-800 shadow-2xl">
       {/* Top Bar simulating a window or camera interface */}
       <div className="h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <div className="ml-auto text-[10px] font-mono text-slate-500">EDGE.CORE.V2</div>
       </div>

       <div className="flex-1 relative flex items-center justify-center p-8 bg-slate-950">
          <div className="absolute inset-0 opacity-20" 
               style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>

          {slide === 0 && (
            <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center gap-6 w-full max-w-[80%]">
               <div className="relative p-6">
                  <Sprout className="w-28 h-28 text-emerald-500" />
                  <div className="absolute inset-0 border-t-4 border-emerald-400/50 animate-scan-down shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
                  <ScanLine className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] text-emerald-500/30" />
               </div>
               <div className="w-full space-y-2 font-mono">
                  <div className="flex justify-between text-xs text-emerald-400/80">
                     <span>SCANNING...</span>
                     <span>98%</span>
                  </div>
                  <div className="h-1 bg-emerald-900/50 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 w-[98%] animate-pulse"></div>
                  </div>
                  <div className="bg-emerald-950/50 border border-emerald-500/30 p-3 rounded text-emerald-400 text-xs">
                     > CHLOROPHYLL: OPTIMAL<br/>
                     > STRESS: NONE DETECTED
                  </div>
               </div>
            </div>
          )}

          {slide === 1 && (
            <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center gap-6 w-full max-w-[80%]">
               <div className="relative p-4">
                  <div className="relative">
                    <User className="w-28 h-28 text-amber-500" />
                    <div className="absolute -top-6 -right-6 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                      CONFIDENCE: 92%
                    </div>
                  </div>
                  
                  {/* Bounding Box */}
                  <div className="absolute -inset-2 border-2 border-amber-500 rounded-lg animate-pulse flex flex-col justify-between">
                      <div className="flex justify-between">
                          <div className="w-2 h-2 border-t-2 border-l-2 border-amber-300 -mt-1 -ml-1"></div>
                          <div className="w-2 h-2 border-t-2 border-r-2 border-amber-300 -mt-1 -mr-1"></div>
                      </div>
                      <div className="flex justify-between">
                          <div className="w-2 h-2 border-b-2 border-l-2 border-amber-300 -mb-1 -ml-1"></div>
                          <div className="w-2 h-2 border-b-2 border-r-2 border-amber-300 -mb-1 -mr-1"></div>
                      </div>
                  </div>
               </div>
               
               <div className="w-full space-y-2 font-mono">
                  <div className="bg-amber-950/50 border border-amber-500/30 p-3 rounded text-amber-400 text-xs">
                     > ALERT: MOTION DETECTED<br/>
                     > CLASS: HUMAN_MALE<br/>
                     > ZONE: PERIMETER_NORTH
                  </div>
               </div>
            </div>
          )}
          
          {slide === 2 && (
             <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center gap-6 w-full max-w-[80%]">
                <div className="relative">
                   <Cpu className="w-32 h-32 text-blue-500" />
                   <div className="absolute inset-0 flex items-center justify-center">
                       <Aperture className="w-12 h-12 text-blue-200 animate-spin-slow opacity-80" />
                   </div>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-blue-500/30 rounded-full animate-ping"></div>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full font-mono text-xs">
                   <div className="bg-blue-950/50 border border-blue-500/30 p-2 rounded text-blue-300 text-center">
                      LATENCY<br/>
                      <span className="text-lg font-bold text-white">12ms</span>
                   </div>
                   <div className="bg-blue-950/50 border border-blue-500/30 p-2 rounded text-blue-300 text-center">
                      LOAD<br/>
                      <span className="text-lg font-bold text-white">42%</span>
                   </div>
                </div>
                 <div className="text-blue-500/50 text-[10px] animate-pulse">
                    PROCESSING TENSOR BATCH #4921...
                 </div>
             </div>
          )}
       </div>

       {/* Bottom Indicators */}
       <div className="h-12 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3">
          {[0,1,2].map(i => (
            <button 
               key={i} 
               onClick={() => setSlide(i)}
               className={`h-1.5 rounded-full transition-all duration-500 ${slide === i ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-700 hover:bg-slate-600'}`} 
            />
          ))}
       </div>
    </div>
  );
}

// Simulated Scanner Component (Hero)
const SimulatedScanner = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 4500); // Change every 4.5 seconds
    return () => clearInterval(interval);
  }, []);

  const scenarios = [
    {
      id: 'health',
      title: 'Crop Health Analysis',
      subtitle: 'Computer Vision v4.2',
      icon: <Leaf className="w-20 h-20 text-emerald-500" />,
      status: 'HEALTHY',
      statusColor: 'text-emerald-500',
      data: ['Chlorophyll: 98%', 'Pest Count: 0', 'Growth: Optimal'],
      color: 'emerald'
    },
    {
      id: 'security',
      title: 'Perimeter Scan',
      subtitle: 'Motion Detection Active',
      icon: <ShieldCheck className="w-20 h-20 text-rose-500" />,
      status: 'ALERT',
      statusColor: 'text-rose-500',
      data: ['Object: Animal (Fox)', 'Distance: 12m', 'Threat Level: Low'],
      color: 'rose'
    },
    {
      id: 'soil',
      title: 'Soil Composition',
      subtitle: 'Sensor Aggregation',
      icon: <Droplets className="w-20 h-20 text-blue-500" />,
      status: 'MOISTURE LOW',
      statusColor: 'text-blue-500',
      data: ['Moisture: 28%', 'pH: 6.5', 'Temp: 24°C'],
      color: 'blue'
    }
  ];

  const current = scenarios[step];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background Glow */}
      <div className={`absolute inset-0 bg-${current.color}-500/10 blur-3xl rounded-full animate-pulse`}></div>

      {/* Main Card */}
      <div className="relative w-80 h-96 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 transform hover:scale-105">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5">
           <div className="flex justify-between items-center mb-1">
              <div className="text-xs font-mono text-slate-400 dark:text-slate-500">SYS.MONITOR.0{step + 1}</div>
              <div className="flex gap-1">
                 <div className="w-2 h-2 rounded-full bg-red-500"></div>
                 <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                 <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
           </div>
           <h3 className="text-lg font-bold text-slate-800 dark:text-white">{current.title}</h3>
           <p className="text-xs text-slate-500 dark:text-slate-400">{current.subtitle}</p>
        </div>

        {/* Central Visual */}
        <div className="h-40 flex items-center justify-center relative border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
           <div className="animate-bounce-slow transition-transform duration-500 transform scale-110">
              {current.icon}
           </div>
           
           {/* Scanning Effect */}
           <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className={`w-full h-1 bg-${current.color}-500/50 shadow-[0_0_15px_rgba(var(--color-${current.color}-500),0.5)] absolute top-0 left-0 animate-scan`}></div>
           </div>
           
           {/* Floating Reticle */}
           <ScanLine className="absolute w-48 h-48 text-slate-300 dark:text-white/20 stroke-[0.5]" />
        </div>

        {/* Data Output */}
        <div className="p-6 space-y-3">
           <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Analysis Result</span>
              <span className={`text-sm font-bold ${current.statusColor} animate-pulse`}>{current.status}</span>
           </div>
           
           <div className="space-y-2">
              {current.data.map((item, idx) => (
                 <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Check className={`w-4 h-4 text-${current.color}-500`} />
                    <span className="font-mono">{item}</span>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Decorational Orbiting Elements */}
      <div className="absolute w-[120%] h-[120%] border border-dashed border-slate-300 dark:border-white/10 rounded-full animate-spin-slow pointer-events-none"></div>
      <div className="absolute w-[140%] h-[140%] border border-slate-200 dark:border-white/5 rounded-full pointer-events-none opacity-50"></div>
    </div>
  );
}

export default LandingPage;