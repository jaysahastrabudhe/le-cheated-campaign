'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Volume2, VolumeX, ArrowRight, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import gsap from 'gsap';

// Child component that reads query params and hosts the main content
function CheatedCampaignContent() {
  const searchParams = useSearchParams();
  const locationParam = searchParams.get('location') || 'landing-page';

  // Phases: 'intro' | 'video' | 'reveal'
  const [phase, setPhase] = useState<'intro' | 'video' | 'reveal'>('intro');
  const [isMuted, setIsMuted] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

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

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const revealContainerRef = useRef<HTMLDivElement>(null);
  const brandHeaderRef = useRef<HTMLDivElement>(null);
  const mainTitleRef = useRef<HTMLHeadingElement>(null);
  const valuePropsRef = useRef<HTMLDivElement>(null);
  const ctaBtnRef = useRef<HTMLButtonElement>(null);

  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const modalBoxRef = useRef<HTMLDivElement>(null);

  // 1. INTRO TEXT ANIMATION
  useEffect(() => {
    if (phase !== 'intro') return;

    // Reset initial states of intro text elements
    gsap.set([introLine1Ref.current, introLine2Ref.current, introLine3Ref.current], {
      opacity: 0,
      y: 20
    });

    const tl = gsap.timeline({
      onComplete: () => {
        // Smoothly fade out intro container and go to video phase
        gsap.to(introContainerRef.current, {
          opacity: 0,
          duration: 0.6,
          onComplete: () => {
            setPhase('video');
          }
        });
      }
    });

    tl.to(introLine1Ref.current, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      ease: 'power3.out'
    })
    .to(introLine2Ref.current, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'back.out(1.7)'
    }, '+=0.3')
    .to(introLine3Ref.current, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      ease: 'power3.out'
    }, '+=0.4')
    .to([introLine1Ref.current, introLine2Ref.current, introLine3Ref.current], {
      opacity: 0,
      y: -20,
      duration: 0.8,
      stagger: 0.1,
      delay: 2.2,
      ease: 'power3.in'
    });

    return () => {
      tl.kill();
    };
  }, [phase]);

  // 2. VIDEO SETUP & AUTO-PLAY
  useEffect(() => {
    if (phase !== 'video') return;

    // Fade in video container
    gsap.fromTo(videoContainerRef.current, 
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }
    );

    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.muted = isMuted;
      videoEl.play()
        .then(() => setIsVideoPlaying(true))
        .catch(err => {
          console.log("Autoplay blocked/failed, waiting for user click:", err);
          setIsVideoPlaying(false);
        });
    }
  }, [phase]);

  // 3. TRANSITION: VIDEO TO REVEAL
  const handleTransitionToReveal = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setPhase('reveal');
      }
    });

    // Fade out video screen
    tl.to(videoContainerRef.current, {
      opacity: 0,
      scale: 0.9,
      duration: 0.6,
      ease: 'power2.in'
    });
  };

  // 4. REVEAL ANIMATIONS
  useEffect(() => {
    if (phase !== 'reveal') return;

    // Set initial reveal styles for GSAP stagger
    gsap.set(brandHeaderRef.current, { opacity: 0, y: -20 });
    gsap.set(mainTitleRef.current, { opacity: 0, y: 30 });
    const cards = valuePropsRef.current?.children;
    if (cards) {
      gsap.set(cards, { opacity: 0, y: 40, scale: 0.95 });
    }
    gsap.set(ctaBtnRef.current, { opacity: 0, y: 20 });

    const tl = gsap.timeline();

    // Morph background to indigo via a smooth body transition
    gsap.to('body', {
      backgroundColor: '#03001e', // Dark cosmic background
      duration: 1.5,
      ease: 'power2.out'
    });

    tl.to(brandHeaderRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    })
    .to(mainTitleRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.5')
    .to(cards ? Array.from(cards) : [], {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      stagger: 0.15,
      ease: 'power4.out'
    }, '-=0.4')
    .to(ctaBtnRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'back.out(2)'
    }, '-=0.2');

    // Auto open modal after 4 seconds of reveal phase so cold scans get prompted
    const timer = setTimeout(() => {
      openModal();
    }, 4500);

    return () => {
      clearTimeout(timer);
      tl.kill();
    };
  }, [phase]);

  // 5. MODAL OPEN/CLOSE ANIMATION
  const openModal = () => {
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!isModalOpen) return;

    gsap.set(modalOverlayRef.current, { opacity: 0 });
    gsap.set(modalBoxRef.current, { opacity: 0, scale: 0.9, y: 30 });

    gsap.to(modalOverlayRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out'
    });

    gsap.to(modalBoxRef.current, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      delay: 0.1,
      ease: 'back.out(1.5)'
    });
  }, [isModalOpen]);

  const closeModal = () => {
    gsap.to(modalBoxRef.current, {
      opacity: 0,
      scale: 0.9,
      y: 20,
      duration: 0.3,
      ease: 'power2.in'
    });

    gsap.to(modalOverlayRef.current, {
      opacity: 0,
      duration: 0.3,
      delay: 0.1,
      onComplete: () => {
        setIsModalOpen(false);
      }
    });
  };

  // Mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  // Play toggle in case autoplay gets blocked
  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  // Form submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    // Quick client validations
    if (!formData.name.trim() || !formData.phone.trim() || !formData.city.trim() || !formData.stream) {
      setErrorMsg('Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }

    if (formData.phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/campaign/cheated-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          location: locationParam
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden flex flex-col font-sans selection:bg-teal-500 selection:text-black">
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* PHASE 0: TEXT INTRO */}
      {/* ──────────────────────────────────────────────────────── */}
      {phase === 'intro' && (
        <div 
          ref={introContainerRef}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-6 text-center select-none"
        >
          <div className="max-w-3xl space-y-6">
            <h1 
              ref={introLine1Ref}
              className="text-2xl md:text-4xl text-gray-400 font-medium tracking-tight"
            >
              Your school
            </h1>
            <h2 
              ref={introLine2Ref}
              className="text-5xl md:text-8xl text-red-500 font-extrabold uppercase tracking-tighter"
            >
              Cheated on you
            </h2>
            <h3 
              ref={introLine3Ref}
              className="text-xl md:text-3xl text-gray-300 font-light tracking-wide leading-relaxed"
            >
              when it said just BBA is a safe choice because...
            </h3>
          </div>

          <button 
            onClick={() => setPhase('video')}
            className="absolute bottom-10 right-10 text-xs tracking-widest uppercase font-semibold text-gray-500 hover:text-white transition-colors duration-200"
          >
            Skip Intro ➔
          </button>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* PHASE 1: STARK VIDEO SCREEN */}
      {/* ──────────────────────────────────────────────────────── */}
      {phase === 'video' && (
        <div 
          ref={videoContainerRef}
          className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center p-4"
        >
          {/* Main Stark Heading */}
          <div className="absolute top-8 left-0 right-0 text-center z-10 px-4">
            <h2 className="text-sm md:text-base tracking-widest text-red-500/80 font-bold uppercase mb-1">
              Guerrilla Scan Reveal
            </h2>
            <p className="text-lg md:text-xl font-light text-gray-300">
              Your School Cheated On You.
            </p>
          </div>

          {/* Video Player Wrapper */}
          <div className="relative w-full max-w-4xl aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-2xl shadow-red-950/20 group">
            <video 
              ref={videoRef}
              src="https://letsenterprise.in/wp-content/uploads/2026/07/snapsave-app_3920737019386334940_7803899670.mp4"
              className="w-full h-full object-cover"
              playsInline
              onEnded={handleTransitionToReveal}
            />

            {/* Play overlay if blocked */}
            {!isVideoPlaying && (
              <div 
                onClick={handlePlayVideo}
                className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer"
              >
                <div className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-sm font-semibold tracking-wider transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-600/30">
                  ▶ Tap to Play Video
                </div>
              </div>
            )}

            {/* Audio overlay toggle */}
            {isVideoPlaying && (
              <button 
                onClick={toggleMute}
                className="absolute bottom-4 right-4 z-20 bg-black/75 hover:bg-black text-white p-3 rounded-full transition-all duration-200 border border-neutral-700/50 shadow-md flex items-center gap-2"
              >
                {isMuted ? (
                  <>
                    <VolumeX size={16} className="text-red-400 animate-pulse" />
                    <span className="text-[10px] uppercase font-mono tracking-wider">Tap for Sound</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={16} className="text-teal-400" />
                    <span className="text-[10px] uppercase font-mono tracking-wider">Muted: Off</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Floating Actions */}
          <div className="mt-8 flex gap-6 z-10">
            <button 
              onClick={handleTransitionToReveal}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-neutral-700 hover:border-neutral-500 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold tracking-widest uppercase transition-all duration-200 text-gray-400 hover:text-white"
            >
              Skip Video & Reveal ➔
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* PHASE 2: BRAND REVEAL */}
      {/* ──────────────────────────────────────────────────────── */}
      {phase === 'reveal' && (
        <main 
          ref={revealContainerRef}
          className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative"
          style={{
            backgroundImage: `
              radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
              radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
              radial-gradient(at 50% 100%, rgba(20, 184, 166, 0.08) 0px, transparent 50%)
            `
          }}
        >
          <div className="max-w-4xl w-full text-center space-y-12">
            
            {/* Let's Enterprise Brand Header */}
            <div 
              ref={brandHeaderRef}
              className="flex items-center justify-center gap-3.5"
            >
              <div className="bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 text-white font-black px-3.5 py-2 rounded-xl text-lg tracking-wider">
                LE
              </div>
              <div className="text-left">
                <span className="block font-bold text-slate-100 text-base tracking-tight leading-none">Let&apos;s Enterprise</span>
                <span className="text-[10px] text-teal-400 font-mono tracking-widest mt-1 uppercase">Working BBA Program</span>
              </div>
            </div>

            {/* Supreme Extrabold Headline */}
            <div className="space-y-4">
              <h1 
                ref={mainTitleRef}
                className="text-4xl md:text-7xl font-extrabold tracking-tight text-white leading-tight uppercase"
              >
                Work is the <br />
                <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">Curriculum.</span>
              </h1>
              <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide max-w-xl mx-auto">
                No more memory tests. No outdated classrooms. Build real ventures and get paid to learn.
              </p>
            </div>

            {/* Staggered Strategy Cards */}
            <div 
              ref={valuePropsRef}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-6"
            >
              {/* Card 1 */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
                <span className="text-red-400 font-bold text-xs uppercase tracking-widest mb-3 block">01 / The Trap</span>
                <h3 className="text-lg font-bold mb-2 text-white">Traditional degrees cheat you.</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  They charge huge tuition fees to make you memorize textbooks. In the real world, no one pays you to take exams.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl"></div>
                <span className="text-teal-400 font-bold text-xs uppercase tracking-widest mb-3 block">02 / The Shift</span>
                <h3 className="text-lg font-bold mb-2 text-white">Working BBA format.</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  You spend semesters in real corporate environments, building startups, working with clients, and receiving mentorship.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
                <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-3 block">03 / The Outcome</span>
                <h3 className="text-lg font-bold mb-2 text-white">Graduate with a track record.</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Enter the job market not with a hollow CV, but with real-world products launched, campaigns run, and revenue earned.
                </p>
              </div>
            </div>

            {/* Call to Action Button */}
            <div className="pt-6">
              <button
                ref={ctaBtnRef}
                onClick={openModal}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-full shadow-lg shadow-teal-500/20 text-sm tracking-wider uppercase transition-all duration-300 transform hover:scale-105 cursor-pointer"
              >
                See what a semester actually looks like
                <ArrowRight size={16} />
              </button>
            </div>

          </div>
        </main>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* LEAD CAPTURE MODAL POPUP */}
      {/* ──────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div 
          ref={modalOverlayRef}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            ref={modalBoxRef}
            className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-8 relative shadow-2xl shadow-indigo-950/20 overflow-hidden"
          >
            {/* Top Close Button */}
            <button 
              onClick={closeModal}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors duration-200"
            >
              <X size={20} />
            </button>

            {/* Glowing orb behind modal */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Modal Body */}
            {!isSuccess ? (
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-teal-400 mb-2">
                  <Sparkles size={16} className="animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="text-xs uppercase font-mono tracking-widest">Apply Now</span>
                </div>
                
                <h3 className="text-2xl font-black text-white tracking-tight leading-none uppercase mb-2">
                  Take the safe choice?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Fill in your details below to see our Working BBA course structure, live semester modules, and admission process.
                </p>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Persona Toggle */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, persona: 'Student' })}
                      className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                        formData.persona === 'Student'
                          ? 'bg-teal-500 text-black shadow-md shadow-teal-500/10'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      I am a Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, persona: 'Parent' })}
                      className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                        formData.persona === 'Parent'
                          ? 'bg-teal-500 text-black shadow-md shadow-teal-500/10'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      I am a Parent
                    </button>
                  </div>

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Full Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-600"
                    />
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Phone Number *</label>
                      <input 
                        type="tel"
                        required
                        placeholder="10-digit number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Email Address</label>
                      <input 
                        type="email"
                        placeholder="rahul@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-600"
                      />
                    </div>
                  </div>

                  {/* Stream Select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Which stream are you in / did you finish? *</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Commerce', 'Science', 'Arts', 'Other'].map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setFormData({ ...formData, stream: st })}
                          className={`py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                            formData.stream === st
                              ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">City *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Pune"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-600"
                    />
                  </div>

                  {/* Error display */}
                  {errorMsg && (
                    <div className="bg-red-950/40 border border-red-900/50 p-3 rounded-xl flex items-center gap-2 text-xs text-red-400">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all duration-200 shadow-md shadow-teal-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {isSubmitting ? 'Submitting Application...' : 'Send Me The Syllabus ➔'}
                  </button>
                </form>
              </div>
            ) : (
              /* Success state inside modal */
              <div className="relative z-10 text-center py-8 space-y-4">
                <div className="inline-flex p-3 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-full animate-bounce">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                  Welcome to the Real World
                </h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Thank you, your application has been received. We have sent a syllabus link and welcome message to your phone. 
                </p>
                <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl text-xs text-slate-500 text-left font-mono">
                  <span className="text-teal-400 block font-semibold mb-1 uppercase text-[10px]">What happens next:</span>
                  1. A WhatsApp greeting is already on its way.
                  <br />
                  2. Review the semester curriculum.
                  <br />
                  3. Our BBA counsellor will coordinate a call soon.
                </div>
                <button
                  onClick={closeModal}
                  className="mt-6 border border-slate-800 hover:border-slate-600 bg-slate-900 px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-semibold text-slate-400 hover:text-white transition-all duration-200"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// Parent Wrapper with Suspense to handle Next.js static build checks
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
