import React from 'react';
import { 
  MapPin, Calendar, Users, Car, Map, 
  LayoutDashboard, Star, ShieldCheck, 
  Search, Compass, CreditCard, ChevronRight,
  Clock,
  ArrowDownRight,
  ArrowBigRight,
  ArrowBigRightIcon,
  ArrowBigRightDashIcon,
  ArrowRightIcon
} from 'lucide-react';

// --- IMAGE IMPORTS ---
// Replace these paths with your actual file names in the assets folder
import HeroBg from '../assets/a1.png';
import PrivateBg from '../assets/audii.jpg';
import DriverBg from '../assets/map.png';
import driver from '../assets/driver.jpg';
import DashPreview from '../assets/db.png';
import DashPreview2 from '../assets/review.png';

import SedanImg from "../assets/sedan.jpeg"; 
import SuvImg from "../assets/suv.jpeg";
import LuxuryImg from "../assets/lux.jpeg";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30 pb-20">
      
      <main className="p-4 md:p-8 flex flex-col gap-12 max-w-[1300px] mx-auto">
        
        {/* 1. DISCOVER CARPOOLS SECTION */}
        <section 
          className="relative overflow-hidden rounded-[2.5rem] min-h-[550px] bg-cover bg-center border border-white/5" 
          style={{ backgroundImage: `url(${HeroBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="max-w-xl">
              <span className="text-blue-300 text-xs font-bold uppercase tracking-[0.2em]">Discover Carpools</span>
              <h1 className="text-5xl md:text-6xl font-bold mt-4 leading-tight">Travel Together.<br/><span className="text-blue-300">Save Big.</span></h1>
              <p className="text-white mt-6 text-lg leading-relaxed max-w-md">Connect with verified drivers. Your journey, shared and sustained across Sri Lanka.</p>
            </div>

            {/* Search Form Card */}
            <div className="bg-[#0f172a]/90 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-xl"><Users size={20} className="text-blue-300"/></div>
                <h3 className="font-bold text-lg">Find Your Shared Ride</h3>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 text-zinc-500" size={18}/>
                  <input type="text" placeholder="Pickup Location" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-12 text-sm focus:outline-none" />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 text-zinc-500" size={18}/>
                  <input type="text" placeholder="Drop-off Location" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-12 text-sm focus:outline-none" />
                </div>
                <button className="w-full mt-4 bg-blue-300 hover:bg-blue-600 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl">
                  <Search size={18}  /> Search Carpools Now
                  <ArrowRightIcon/>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. PRIVATE RIDE & MAP SECTION */}
<section className="bg-[#0b1222] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
  {/* TOP BANNER: Reference from b.png */}
  <div 
    className="h-[320px] bg-cover bg-center relative flex items-center px-8 md:px-16"
    style={{ backgroundImage: `linear-gradient(to right, rgba(11, 18, 34, 0.9) 2%, transparent), url(${PrivateBg})` }}
  >
    <div className="max-w-xl relative z-10">
      <span className="text-blue-300 text-xs font-bold uppercase tracking-[0.2em] mb-3 block">
        Book Private Ride
      </span>
      <h2 className="text-4xl md:text-5xl font-bold leading-tight text-white mb-4">
        Your Private Journey. <br />
        <span className="text-blue-300">Uncompromised Comfort.</span>
      </h2>
      <p className="text-white text-sm md:text-base max-w-sm leading-relaxed">
        The entire vehicle, dedicated to you. On-demand or scheduled future trips with premium drivers.
      </p>
    </div>
  </div>

  {/* INTERACTIVE AREA: Map and Reservation Card */}
  <div className="flex flex-col lg:flex-row min-h-[450px]">
    {/* Map UI Area (Left) */}
    <div className="flex-1 bg-[#0f172a] relative p-8 border-r border-white/5">
      {/* Simulated Map Background (matching b.png aesthetic) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: `url(${DriverBg})`, backgroundSize: 'cover', filter: 'grayscale(0%)' }}></div>
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-30"></div>

      {/* Real-Time Info Overlay */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 max-w-[280px]">
          <span className="text-blue-300 text-[10px] font-black uppercase tracking-widest">Real-Time Info</span>
          <h4 className="text-lg font-bold mt-2 text-white">Find Rides Available Now.</h4>
          <p className="text-zinc-500 text-xs mt-2">Filter by Carpool or Private and see live ETAs.</p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <button className="bg-zinc-800/80 hover:bg-zinc-700 text-white text-[10px] font-bold px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
              <Car size={14}/> Sedan
            </button>
            <button className="bg-zinc-800/80 hover:bg-zinc-700 text-white text-[10px] font-bold px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
              <Car size={14}/> SUV
            </button>
          </div>
          <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-8 py-4 rounded-2xl border border-white/10 flex items-center gap-3 backdrop-blur-xl transition-all w-fit">
            <Map size={18} className="text-blue-300" /> 
            Open Live Map Search →
          </button>
        </div>
      </div>
    </div>

    {/* Reservation Card (Right) */}
    <div className="w-full lg:w-[480px] bg-[#111827] p-8 md:p-10 relative">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-500/10 rounded-xl">
          <Car size={20} className="text-blue-400" />
        </div>
        <h3 className="font-bold text-xl text-white tracking-tight">Reserve Your Private Car</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Pickup</label>
            <input type="text" placeholder="Location" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Drop-off</label>
            <input type="text" placeholder="Location" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Date & Time</span>
            <span className="text-xs text-white mt-1">Now / Select</span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Now/Later</span>
            <ChevronRight size={14} className="text-zinc-600" />
          </div>
        </div>

        {/* Vehicle Selection (Reference from b.png) */}
<div className="grid grid-cols-3 gap-2 py-4">
  {[
    { id: 'sedan', label: 'Sedan', img: SedanImg },
    { id: 'suv', label: 'SUV', img: SuvImg },
    { id: 'luxury', label: 'Luxury VIP', img: LuxuryImg }
  ].map((vehicle) => (
    <button 
      key={vehicle.id} 
      className="group flex flex-col items-center gap-2 p-2 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all focus:border-blue-500 focus:bg-blue-500/10"
    >
      <div className="w-full aspect-[16/10] bg-zinc-800 rounded-xl overflow-hidden relative">
        <img 
          src={vehicle.img} 
          alt={vehicle.label} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
        {/* Subtle gradient overlay to match b.png aesthetic */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>
      <span className="text-[9px] font-black text-zinc-500 group-hover:text-white transition-colors uppercase tracking-tighter">
        {vehicle.label}
      </span>
    </button>
  ))}
</div>

        <button className="w-full bg-blue-400 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20 uppercase text-xs tracking-widest mt-4">
          <Car size={16} /> Request Private Ride →
        </button>
      </div>
    </div>
  </div>
</section>

        {/* 3. DRIVER REGISTRATION SECTION */}
        <section 
          className="rounded-[2.5rem] border border-white/5 overflow-hidden relative group shadow-2xl min-h-[400px] bg-cover bg-right"
          style={{ backgroundImage: `linear-gradient(to right, black, transparent), url(${driver})` }}
        >
          <div className="p-8 md:p-16 z-10 flex flex-col justify-center h-full max-w-[650px] relative">
            <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">Join as a Driver & Earn</span>
            <h2 className="text-4xl md:text-5xl font-black mt-4 leading-tight">Become a Partner.</h2>
            <h2 className="text-4xl md:text-5xl font-black mt-4 leading-tight text-blue-300">Drive.Connect.Earn.</h2>
            <p className="text-zinc-400 mt-6 mb-8 text-lg leading-relaxed">Share your route or offer a private car. Turn empty seats into significant income.</p>
            <button className="bg-white text-black font-black px-10 py-4 rounded-2xl w-fit hover:bg-blue-300 transition-all flex items-center gap-3 uppercase text-xs tracking-widest">
              <Users size={18} /> Register Now
            </button>
          </div>
        </section>

        {/* 4. DASHBOARD & COMMUNITY SECTION */}
<section 
  className="relative rounded-[2.5rem] border border-white/5 overflow-hidden min-h-[500px] bg-cover bg-center shadow-2xl"
  style={{ backgroundImage: `url(${DashPreview})` }} // DashPreview refers to your 'd.png' asset
>
  {/* Dark gradient overlay to ensure text readability */}
  <div className=""></div>

  <div className="relative z-10 p-10 md:p-16 h-full flex flex-col lg:flex-row items-center justify-between gap-12">
    
    
    <div className="max-w-xl">
      
    </div>

    {/* Right Side: Feature Grid with Button at Bottom */}
    {/* Right Side: Feature Grid with Button at Bottom */}
<div className="absolute bottom-20 right-10 z-20">
  <button className="flex items-center justify-center gap-3 bg-blue-800 hover:bg-blue-300 hover:text-black border border-white/10 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group w-fit">
    <LayoutDashboard size={18} className="group-hover:rotate-12 transition-transform" />
    View Your Dashboard →
  </button>
</div>

  </div>
</section>

        {/* 5. TRUST & RATINGS SECTION */}
        <section 
  className="relative rounded-[2.5rem] border border-white/5 overflow-hidden min-h-[500px] bg-cover bg-center shadow-2xl"
  style={{ backgroundImage: `url(${DashPreview2})` }} // DashPreview refers to your 'd.png' asset
>
  {/* Dark gradient overlay to ensure text readability */}
  <div className=""></div>

  <div className="relative z-10 p-10 md:p-16 h-full flex flex-col lg:flex-row items-center justify-between gap-12">
    
    
    <div className="max-w-xl">
      
    </div>



  </div>
</section>

      </main>

      
    </div>
  );
};

export default LandingPage;