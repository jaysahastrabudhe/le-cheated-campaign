'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Volume2, VolumeX, ArrowRight, CheckCircle2, AlertCircle, Sparkles, MapPin } from 'lucide-react';
import gsap from 'gsap';

interface LocationItem {
  name: string;
  lat: number;
  lng: number;
}

// Predefined poster campaign locations in Pune
const POSTER_LOCATIONS: LocationItem[] = [
  { name: "Fergusson College Gate (FC Road)", lat: 18.5244, lng: 73.8409 },
  { name: "Symbiosis Viman Nagar Campus", lat: 18.5636, lng: 73.9079 },
  { name: "FC Road Cafe Coffee Day", lat: 18.5221, lng: 73.8412 },
  { name: "ICC Trade Tower Co-working", lat: 18.5303, lng: 73.8290 },
  { name: "Mitcon PG Hostel (Balewadi)", lat: 18.5670, lng: 73.7745 },
  { name: "Viman Nagar Stationery Hub", lat: 18.5620, lng: 73.9168 },
  { name: "BMCC College Notice Board", lat: 18.5283, lng: 73.8341 },
];

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function CheatedCampaignContent() {
  const searchParams = useSearchParams();
  const locationParam = searchParams.get('location') || 'landing-page';

  // Phases: 'intro' | 'video' | 'reveal'
  const [phase, setPhase] = useState<'intro' | 'video' | 'reveal'>('intro');
  const [isMuted, setIsMuted] = useState(false); // Default unmuted (sound automatic)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string>('Detecting Location...');
  const [showStartBtn, setShowStartBtn] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    stream: '',
    persona: 'Student' as 'Student' | 'Parent'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Refs for GSAP
  const introContainerRef = useRef<HTMLDivElement>(null);
  const introLine1Ref = useRef<HTMLHeadingElement>(null);
  const introLine2Ref = useRef<HTMLHeadingElement>(null);
  const introLine3Ref = useRef<HTMLHeadingElement>(null);
  const startBtnRef = useRef<HTMLButtonElement>(null);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const revealContainerRef = useRef<HTMLDivElement>(null);
  const brandHeaderRef = useRef<HTMLDivElement>(null);
  const mainTitleRef = useRef<HTMLHeadingElement>(null);
  const trackingBadgeRef = useRef<HTMLDivElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);
  const valuePropsRef = useRef<HTMLDivElement>(null);

  // 1. INTRO TEXT ANIMATION (GSAP)
  useEffect(() => {
    if (phase !== 'intro') return;

    gsap.set([introLine1Ref.current, introLine2Ref.current, introLine3Ref.current], {
      opacity: 0,
      y: 20
    });

    const tl = gsap.timeline({
      onComplete: () => {
        // Fade out text lines after a delay to allow reading the subline, then show start button
        gsap.to([introLine1Ref.current, introLine2Ref.current, introLine3Ref.current], {
          opacity: 0,
          y: -20,
          duration: 0.6,
          delay: 3.5, // Linger 3.5 seconds longer to read the subline
          stagger: 0.08,
          onComplete: () => {
            setShowStartBtn(true);
          }
        });
      }
    });

    tl.to(introLine1Ref.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    })
    .to(introLine2Ref.current, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      ease: 'back.out(1.5)'
    }, '+=0.2')
    .to(introLine3Ref.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '+=0.3');

    return () => {
      tl.kill();
    };
  }, [phase]);

  // Animate play button entrance
  useEffect(() => {
    if (showStartBtn && startBtnRef.current) {
      gsap.fromTo(startBtnRef.current,
        { opacity: 0, scale: 0.9, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' }
      );
    }
  }, [showStartBtn]);

  // 2. FORCED UNMUTED VIDEO PLAYBACK HANDLER (Synchronous Interaction Thread)
  const startVideoPlay = () => {
    setIsMuted(false);
    setPhase('video');

    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.muted = false;
      videoEl.play()
        .then(() => {
          setIsVideoPlaying(true);
          console.log("[Video] Synchronous play succeeded with audio!");
        })
        .catch(err => {
          console.warn("[Video] Synchronous unmuted play failed. Fallback to muted autoplay:", err);
          videoEl.muted = true;
          videoEl.play()
            .then(() => {
              setIsVideoPlaying(true);
              setIsMuted(true);
            })
            .catch(e => console.error("[Video] Muted autoplay failed:", e));
        });
    }
  };

  // 3. TRANSITION TO FORM & REVEAL (GSAP)
  const handleTransitionToReveal = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setPhase('reveal');
      }
    });

    tl.to(videoContainerRef.current, {
      opacity: 0,
      y: -30,
      scale: 0.95,
      duration: 0.5,
      ease: 'power2.in'
    });
  };

  // 4. REVEAL, GEOLOCATION & INLINE FORM ANIMATIONS
  useEffect(() => {
    if (phase !== 'reveal') return;

    // Fetch poster location via user's physical GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`[Geolocation] Latitude: ${latitude}, Longitude: ${longitude}`);

          // Determine closest location from predefined Pune posters
          let closest = POSTER_LOCATIONS[0];
          let minDistance = calculateDistance(latitude, longitude, closest.lat, closest.lng);

          for (let i = 1; i < POSTER_LOCATIONS.length; i++) {
            const distance = calculateDistance(latitude, longitude, POSTER_LOCATIONS[i].lat, POSTER_LOCATIONS[i].lng);
            if (distance < minDistance) {
              minDistance = distance;
              closest = POSTER_LOCATIONS[i];
            }
          }

          // If closest is within 6km, tag the location. Otherwise fallback gracefully.
          if (minDistance <= 6.0) {
            setDetectedLocation(closest.name);
          } else {
            setDetectedLocation(`${closest.name} (Nearby)`);
          }
        },
        (error) => {
          console.warn("[Geolocation] GPS denied/failed. Fetching IP fallback...", error);
          setDetectedLocation("Fetching IP Location...");
          fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
              if (data && data.city) {
                setDetectedLocation(`${data.city} Region (IP-based)`);
              } else {
                setDetectedLocation(locationParam === 'landing-page' ? 'Pune Region' : locationParam);
              }
            })
            .catch(ipErr => {
              console.error("[Geolocation] IP lookup failed:", ipErr);
              setDetectedLocation(locationParam === 'landing-page' ? 'General Scan' : locationParam);
            });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      // Fallback if Geolocation API is not supported by device
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data && data.city) {
            setDetectedLocation(`${data.city} Region (IP-based)`);
          } else {
            setDetectedLocation(locationParam === 'landing-page' ? 'General Scan' : locationParam);
          }
        })
        .catch(() => {
          setDetectedLocation(locationParam === 'landing-page' ? 'General Scan' : locationParam);
        });
    }

    // Reset initial states of reveal page components
    gsap.set(brandHeaderRef.current, { opacity: 0, y: -20 });
    gsap.set(mainTitleRef.current, { opacity: 0, y: 30 });
    gsap.set(trackingBadgeRef.current, { opacity: 0, scale: 0.9 });
    gsap.set(formCardRef.current, { opacity: 0, y: 40 });
    const cards = valuePropsRef.current?.children;
    if (cards) {
      gsap.set(cards, { opacity: 0, y: 30, scale: 0.98 });
    }

    const tl = gsap.timeline();

    gsap.to('body', {
      backgroundColor: '#05031b',
      duration: 1.2,
      ease: 'power2.out'
    });

    tl.to(brandHeaderRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out'
    })
    .to(mainTitleRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out'
    }, '-=0.4')
    .to(trackingBadgeRef.current, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: 'back.out(1.5)'
    }, '-=0.3')
    .to(formCardRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power4.out'
    }, '-=0.2')
    .to(cards ? Array.from(cards) : [], {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out'
    }, '-=0.3');

    return () => {
      tl.kill();
    };
  }, [phase]);

  // Audio toggles
  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  // Play button overrides (triggers sound on click)
  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.play()
        .then(() => setIsVideoPlaying(true))
        .catch(err => console.error("Error playing video:", err));
    }
  };

  // Form submit API dispatcher
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    // Field check
    if (!formData.name.trim() || !formData.phone.trim() || !formData.city.trim() || !formData.stream) {
      setErrorMsg('Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }

    if (formData.phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/campaign/cheated-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          location: detectedLocation // Send the user's detected GPS location
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit lead data');
      }

      setIsSuccess(true);
      
      // Scroll smoothly to top of success screen on mobile
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col font-sans selection:bg-teal-500 selection:text-black">
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* PHASE 0: STARK TEXT INTRO */}
      {/* ──────────────────────────────────────────────────────── */}
      {phase === 'intro' && (
        <div 
          ref={introContainerRef}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-6 text-center select-none"
        >
          {!showStartBtn ? (
            <div className="max-w-xl space-y-5">
              <h1 
                ref={introLine1Ref}
                className="text-3xl md:text-5xl text-white font-extrabold uppercase tracking-tighter"
              >
                Your school
              </h1>
              <h2 
                ref={introLine2Ref}
                className="text-4xl md:text-6xl text-red-500 font-extrabold uppercase tracking-tighter"
              >
                Cheated on you
              </h2>
              <h3 
                ref={introLine3Ref}
                className="text-base md:text-xl text-gray-300 font-light tracking-wide leading-relaxed"
              >
                when it said just a BBA is a safe choice because...
              </h3>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-6">
              <div className="text-center space-y-2">
                <span className="text-[10px] uppercase text-red-500 tracking-widest font-black block animate-pulse">
                  Action Required 🔊
                </span>
                <h2 className="text-lg md:text-xl font-bold text-gray-200 max-w-sm tracking-wide leading-snug">
                  Click the button below to reveal the truth
                </h2>
              </div>
              
              <button 
                ref={startBtnRef}
                onClick={startVideoPlay}
                className="bg-red-650 hover:bg-red-700 text-white px-12 py-5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_35px_rgba(220,38,38,0.6)] border-2 border-red-500 hover:border-white cursor-pointer animate-pulse"
              >
                Reveal the Truth
              </button>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* PHASE 1: MOBILE-FIRST 9:16 VIDEO PLAYER */}
      {/* ──────────────────────────────────────────────────────── */}
      <div 
        ref={videoContainerRef}
        className={`fixed inset-0 z-40 bg-black flex flex-col items-center justify-between py-6 px-4 transition-all duration-500 ${
          phase === 'video' 
            ? 'opacity-100 pointer-events-auto visible scale-100' 
            : 'opacity-0 pointer-events-none invisible scale-95'
        }`}
      >
          {/* Header */}
          <div className="text-center w-full">
            <h2 className="text-md md:text-lg font-light text-gray-300">
              Your School Cheated On You.
            </h2>
          </div>

          {/* 9:16 Aspect Portrait Video Wrapper */}
          <div className="relative w-full max-w-[340px] aspect-[9/16] max-h-[70vh] bg-black rounded-2xl overflow-hidden border border-neutral-900 shadow-2xl shadow-red-950/15 group">
            <video 
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              playsInline
              onEnded={handleTransitionToReveal}
              onError={() => {
                console.error("[Video] Failed to load any of the video sources.");
                setVideoLoadError(true);
              }}
            >
              <source src="https://letsenterprise.in/wp-content/uploads/2026/07/adi_main_video.mp4" type="video/mp4" />
              <source src="https://letsenterprise.in/wp-content/uploads/2026/07/adi_main_video.mov" type="video/quicktime" />
              Your browser does not support the video tag.
            </video>

            {/* Play Button Overlay (fallback if autoplay unmuted blocked) */}
            {!isVideoPlaying && !videoLoadError && (
              <div 
                onClick={handlePlayVideo}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 cursor-pointer p-4 text-center"
              >
                <div className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-xs font-bold tracking-wider transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-600/30 mb-2">
                  🔊 Tap to Play with Audio
                </div>
                <p className="text-[10px] text-gray-400 max-w-[200px]">Browsers restrict unmuted autoplay without interaction.</p>
              </div>
            )}

            {/* Load Error Fallback Overlay */}
            {videoLoadError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 p-6 text-center z-30">
                <AlertCircle size={28} className="text-red-500 mb-2 animate-bounce" />
                <h3 className="text-xs font-bold text-white mb-1 uppercase tracking-wider">
                  Video Load Error
                </h3>
                <p className="text-[10px] text-gray-400 max-w-[220px] leading-relaxed mb-4">
                  The browser cannot decode this format. Please upload the converted (.mp4) version of the video to Hostinger.
                </p>
                <button 
                  onClick={handleTransitionToReveal}
                  className="px-4 py-2 border border-neutral-800 hover:border-neutral-700 bg-neutral-900 rounded-lg text-[9px] uppercase tracking-widest font-semibold text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  Skip to Form ➔
                </button>
              </div>
            )}

            {/* Volume Toggle */}
            {isVideoPlaying && (
              <button 
                onClick={toggleMute}
                className="absolute bottom-4 right-4 z-20 bg-black/85 hover:bg-black text-white p-2.5 rounded-full transition-all duration-200 border border-neutral-700/40 shadow flex items-center gap-1.5"
              >
                {isMuted ? (
                  <>
                    <VolumeX size={14} className="text-red-400 animate-pulse" />
                    <span className="text-[9px] uppercase font-mono tracking-wider">Tap for Sound</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={14} className="text-teal-400" />
                    <span className="text-[9px] uppercase font-mono tracking-wider">Sound: On</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Spacer to balance header layout height vertically */}
          <div className="h-10"></div>
        </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* PHASE 2: BRAND REVEAL & INLINE FORM */}
      {/* ──────────────────────────────────────────────────────── */}
      {phase === 'reveal' && (
        <main 
          ref={revealContainerRef}
          className="flex-1 flex flex-col items-center justify-start px-4 py-10 relative max-w-md mx-auto w-full"
        >
          {/* Brand Header */}
          <div 
            ref={brandHeaderRef}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20 text-white font-black px-3 py-1.5 rounded-xl text-md tracking-wider">
              LE
            </div>
            <div className="text-left">
              <span className="block font-bold text-slate-100 text-sm tracking-tight leading-none">Let&apos;s Enterprise</span>
              <span className="text-[9px] text-teal-400 font-mono tracking-widest uppercase block mt-0.5">Working BBA Program</span>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center space-y-2 mb-4">
            <h1 
              ref={mainTitleRef}
              className="text-3xl font-extrabold tracking-tight text-white uppercase leading-none"
            >
              Work is the <br />
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">Curriculum.</span>
            </h1>
          </div>

          {/* Geolocation Poster Tracking Badge */}
          <div 
            ref={trackingBadgeRef}
            className="inline-flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-full text-[10px] font-mono tracking-wider text-slate-400 mb-8"
          >
            <MapPin size={11} className="text-teal-400 animate-bounce" />
            <span>Detected Location:</span>
            <span className="text-teal-400 font-bold uppercase">{detectedLocation}</span>
          </div>

          {/* Embedded Form (Directly inline on page) */}
          <div 
            ref={formCardRef}
            className="w-full bg-slate-950/70 border border-slate-900 rounded-3xl p-6 shadow-xl shadow-indigo-950/10 backdrop-blur-md relative overflow-hidden mb-12"
          >
            {/* Success State */}
            {isSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex p-2.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-full animate-bounce">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">
                  Application Logged
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Your details have been synchronized. We have dispatched a welcome curriculum syllabus via WhatsApp.
                </p>
                <div className="bg-slate-900/50 border border-slate-900/80 p-4 rounded-xl text-[10px] text-slate-500 text-left font-mono space-y-1">
                  <span className="text-teal-400 block font-semibold uppercase mb-0.5">Next Steps:</span>
                  <p>1. Check your WhatsApp for a direct greeting.</p>
                  <p>2. Explore the syllabus and cohort timeline.</p>
                  <p>3. Our BBA counsellor will coordinate a call soon.</p>
                </div>
              </div>
            ) : (
              /* Inline Form Content */
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-teal-400 mb-1">
                  <Sparkles size={14} className="animate-pulse" />
                  <span className="text-[10px] uppercase font-mono tracking-widest font-semibold">Instant Access Syllabus</span>
                </div>
                
                <h2 className="text-lg font-black text-white tracking-tight uppercase leading-snug">
                  Fill this form to know what being a student here sounds like
                </h2>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Enter details to download our Working BBA course structure, live semester modules, and relocations.
                </p>

                <form onSubmit={handleFormSubmit} className="space-y-3.5 pt-2">
                  {/* Persona Toggle */}
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, persona: 'Student' })}
                      className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                        formData.persona === 'Student'
                          ? 'bg-teal-500 text-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      I am a Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, persona: 'Parent' })}
                      className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                        formData.persona === 'Parent'
                          ? 'bg-teal-500 text-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      I am a Parent
                    </button>
                  </div>

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono tracking-wider text-slate-400">Full Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-750"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono tracking-wider text-slate-400">WhatsApp Mobile Number *</label>
                    <input 
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-750"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono tracking-wider text-slate-400">Email Address</label>
                    <input 
                      type="email"
                      placeholder="rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-750"
                    />
                  </div>

                  {/* Stream Select */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono tracking-wider text-slate-400">Which stream are you in? *</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['Commerce', 'Science', 'Arts', 'Other'].map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setFormData({ ...formData, stream: st })}
                          className={`py-2 rounded-lg text-[10px] font-semibold border transition-all duration-200 ${
                            formData.stream === st
                              ? 'bg-indigo-650 border-indigo-500 text-white font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono tracking-wider text-slate-400">City *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Pune"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-750"
                    />
                  </div>

                  {/* Error Notification */}
                  {errorMsg && (
                    <div className="bg-red-950/30 border border-red-900/40 p-3 rounded-xl flex items-center gap-1.5 text-[10px] text-red-400">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-650 hover:from-teal-400 hover:to-indigo-550 text-white font-black py-4 rounded-xl text-xs tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-teal-500/20 active:scale-[0.98] overflow-hidden flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-3 border border-teal-400/10"
                  >
                    {/* Glossy sweep effect */}
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                    
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Booking details...
                      </span>
                    ) : (
                      <>
                        <span>Book a Call & Learn More</span>
                        <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Staggered Strategy Highlight Cards */}
          <div 
            ref={valuePropsRef}
            className="w-full space-y-4 text-left mt-2"
          >
            {/* Card 1 */}
            <div className="bg-slate-950/40 border border-slate-900 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
              <span className="text-red-400 font-bold text-[9px] uppercase tracking-widest mb-2 block">01 / The Real World</span>
              <h3 className="text-sm font-bold mb-1 text-white">Traditional degrees fail BBA grads.</h3>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Textbooks prepare you for examinations, not execution. Traditional schooling leaves graduates with no practical business capabilities.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-950/40 border border-slate-900 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl"></div>
              <span className="text-teal-400 font-bold text-[9px] uppercase tracking-widest mb-2 block">02 / The curriculum</span>
              <h3 className="text-sm font-bold mb-1 text-white">Work is the Curriculum format.</h3>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                You work alongside mentors in real-world corporate cells, launching ventures, managing client relations, and handling workflows.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-950/40 border border-slate-900 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
              <span className="text-indigo-400 font-bold text-[9px] uppercase tracking-widest mb-2 block">03 / The Handoff</span>
              <h3 className="text-sm font-bold mb-1 text-white">Track record over CV.</h3>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Exit Let&apos;s Enterprise BBA not with simple grade sheets, but with a real portfolio of launched products, client reviews, and revenue.
              </p>
            </div>
          </div>
        </main>
      )}

    </div>
  );
}

export default function CheatedCampaignPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <span className="text-xs font-mono tracking-widest uppercase text-gray-500 animate-pulse">Loading Campaign...</span>
      </div>
    }>
      <CheatedCampaignContent />
    </Suspense>
  );
}
