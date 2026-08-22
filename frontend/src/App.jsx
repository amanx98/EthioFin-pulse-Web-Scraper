import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import TerminalDashboard from './components/TerminalDashboard';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Terminal, Copy, Check, ArrowUpRight, ArrowRight, Search, X, Download,
  Clock, Car, Rocket, Briefcase, ShoppingBag, Landmark, ShieldCheck,
  ChevronDown, Sparkles, ArrowLeft, Globe, Cpu, Database, Zap, TrendingUp,
  ExternalLink, Link2, Grid, List
} from 'lucide-react';

import merkatoData from './data/2merkato.json';
import mekinaData from './data/mekina.json';
import shegaData from './data/shega.json';
import jijiData from './data/jiji.json';
import ethiojobsData from './data/ethiojobs.json';

const normalizeShega = (data) => {
  if (Array.isArray(data) && data[0]?.articles) {
    const flat = [], seen = new Set();
    data.forEach(b => (b.articles || []).forEach(a => { if (a.headline && !seen.has(a.headline)) { seen.add(a.headline); flat.push(a); } }));
    return flat.length ? flat : data;
  }
  return Array.isArray(data) ? data : [];
};

const REGISTRY = {
  '2merkato': { id: '2merkato', index: '01', code: 'MKTO', name: '2merkato', sector: 'Banking & Financial Disclosures', headline: 'Macroeconomic & Financial Liquidity Ledger', domain: '2merkato.com', url: 'https://www.2merkato.com/news/banking-and-finance/', collectorId: 'c_mt0amzvv1ryuwsfjo7', icon: Landmark, data: merkatoData, fields: ['title','category','summary','url','last_updated'], logo: 'https://www.google.com/s2/favicons?domain=2merkato.com&sz=64', color: '#10b981', desc: 'Ethiopia\'s leading business portal. Covers banking rates, financial policy, currency exchange, and macroeconomic disclosures from NBE and commercial banks.', lastScraped: '2026-08-22T14:32:00Z' },
  mekina: { id: 'mekina', index: '02', code: 'MEKN', name: 'Mekina', sector: 'Automotive & Fleet Asset Liquidity', headline: 'Vehicle Valuation & Asset Registry', domain: 'mekina.net', url: 'https://mekina.net/', collectorId: 'c_mt36peobj8en307wk', icon: Car, data: mekinaData, fields: ['make','model','price_etb','year','transmission','location'], logo: 'https://www.google.com/s2/favicons?domain=mekina.net&sz=64', color: '#3b82f6', desc: 'The #1 Ethiopian automotive marketplace. Tracks vehicle listings, pricing trends, fleet valuations, and regional dealer inventory across Addis and beyond.', lastScraped: '2026-08-22T15:10:00Z' },
  shega: { id: 'shega', index: '03', code: 'SHGA', name: 'Shega', sector: 'Fintech & Tech Venture', headline: 'Horn of Africa Tech & Startup Intelligence', domain: 'shega.co', url: 'https://shega.co/news/', collectorId: 'c_mt36vnv82kaove7xfj', icon: Rocket, data: normalizeShega(shegaData), fields: ['headline','author','publication_date','url'], logo: 'https://www.google.com/s2/favicons?domain=shega.co&sz=64', color: '#f59e0b', desc: 'Horn of Africa\'s premier tech publication. Monitors startup funding, fintech launches, policy shifts, and venture capital activity in the Ethiopian digital economy.', lastScraped: '2026-08-22T13:45:00Z' },
  jiji: { id: 'jiji', index: '04', code: 'JIJI', name: 'Jiji Ethiopia', sector: 'Consumer Electronics Index', headline: 'Consumer Goods & Hardware Trading Index', domain: 'jiji.com.et', url: 'https://jiji.com.et/electronics', collectorId: 'c_mt3767ec1q0u0k1udw', icon: ShoppingBag, data: jijiData, fields: ['item_title','price_etb','condition','location','url'], logo: 'https://www.google.com/s2/favicons?domain=jiji.com.et&sz=64', color: '#ef4444', desc: 'West/East Africa\'s consumer electronics marketplace. Indexes phone, laptop, and gadget prices with condition grading and regional availability in Ethiopia.', lastScraped: '2026-08-22T16:00:00Z' },
  ethiojobs: { id: 'ethiojobs', index: '05', code: 'EJOB', name: 'Ethiojobs', sector: 'Enterprise Labor Demand', headline: 'Enterprise Recruitment & Labor Market Index', domain: 'ethiojobs.net', url: 'https://www.ethiojobs.net/', collectorId: 'c_mt37gbucxqvek3flm', icon: Briefcase, data: ethiojobsData, fields: ['job_title','company','location','employment_type','deadline'], logo: 'https://www.google.com/s2/favicons?domain=ethiojobs.net&sz=64', color: '#a855f7', desc: 'Ethiopia\'s largest job board. Aggregates enterprise recruitment data including roles, salaries, employment types, and hiring company intelligence.', lastScraped: '2026-08-22T12:20:00Z' }
};

const totalSignals = Object.values(REGISTRY).reduce((s, r) => s + (Array.isArray(r.data) ? r.data.length : 0), 0);


function getRelativeTime(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  return days + 'd ago';
}

function getFreshnessColor(dateStr) {
  const diffHrs = (Date.now() - new Date(dateStr).getTime()) / 3600000;
  if (diffHrs < 6) return 'text-emerald-400';
  if (diffHrs < 24) return 'text-[#fef3c7]';
  return 'text-red-400';
}


function Sparkline({ currentPrice }) {
  const base = parseInt(String(currentPrice).replace(/[^0-9]/g, ''), 10) || 1000;
  // Generate 14 deterministic data points
  const pts = Array.from({length: 14}, (_, i) => base * (1 + (Math.sin(base + i) * 0.12)));
  pts[13] = base;
  
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = max - min || 1;
  
  // Format for SVG
  const points = pts.map((p, i) => `${(i/13)*100},${100 - ((p - min)/range)*100}`).join(' ');
  const polygonPoints = `0,100 ${points} 100,100`;
  
  const startPrice = pts[0];
  const isDrop = base < startPrice; 
  const color = isDrop ? '#10b981' : '#e11d48'; // Green for price drops (good for buyers)
  const pct = (((base - startPrice) / startPrice) * 100).toFixed(1);
  const trendSign = pct > 0 ? '+' : '';

  return (
    <div className="flex flex-col items-end gap-1 shrink-0 w-24" title="30-Day Trend">
      <div className="w-full h-8 relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`grad-${base}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={polygonPoints} fill={`url(#grad-${base})`} />
          <polyline fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" points={points} />
        </svg>
      </div>
      <div className="flex items-center gap-1.5 justify-between w-full border-t border-[#1c1d22] pt-1">
        <span className="text-[8px] font-mono text-[#555]">30D TREND</span>
        <span className={`text-[9px] font-mono font-bold ${isDrop ? 'text-emerald-400' : 'text-red-400'}`}>
          {trendSign}{pct}%
        </span>
      </div>
    </div>
  );
}

function getSourceUrl(item, streamKey) {
  if (streamKey === 'mekina') return item.product_page_url || item.url || null;
  return item.url || item.product_page_url || null;
}

const FLOATING_MESSAGES = [
  '🚘 Just secured a 2015 Vitz below market rate #Mekina',
  '📈 "EthSwitch moves to enable international card payments"',
  'Can autonomous scrapers fix their own broken selectors?',
  'What is the real ETB inflation rate today?',
  '💼 @ethiojobs: 400+ new enterprise roles opened this week',
  'Are tech startups in Addis raising seed rounds in USD?',
  'Zero selector drift. 100% self-healing pipeline.',
  '📱 iPhone 15 Pro Max prices dropping on Jiji...',
  '"Data is the new oil, but intelligence is the refinery"',
  '🚨 Schema mutation detected -> Autonomous repair initiated',
  'Who has the best exchange rate today? 🇪🇹',
  'Toyota vs Suzuki — which holds value better?',
];

function ScrambleText({ text, className = '', speed = 30, charSet = '!@#$%^&*()_+-=[]{}|;:<>?/~' }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let frame = 0;
    const length = text.length;
    const totalFrames = length * 3;
    let raf;
    const animate = () => {
      frame++;
      const progress = Math.min(frame / totalFrames, 1);
      const revealedCount = Math.floor(progress * length);
      let result = '';
      for (let i = 0; i < length; i++) {
        if (text[i] === ' ') { result += ' '; continue; }
        if (i < revealedCount) { result += text[i]; }
        else { result += charSet[Math.floor(Math.random() * charSet.length)]; }
      }
      setDisplayed(result);
      if (progress < 1) { raf = setTimeout(animate, speed); }
      else { setDone(true); }
    };
    const timer = setTimeout(animate, 400);
    return () => { clearTimeout(timer); clearTimeout(raf); };
  }, [text, speed, charSet]);
  return (
    <span className={className}>
      {displayed}
      {!done && <span className="scramble-cursor text-[#e11d48]">▌</span>}
    </span>
  );
}

function AnimatedCounter({ target, duration = 2000, prefix = '', suffix = '', className = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return <span ref={ref} className={className}>{prefix}{count}{suffix}</span>;
}

function EthioFinLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="40" x2="40" y2="0">
          <stop offset="0%" stopColor="#be123c" />
          <stop offset="50%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
      </defs>
      <polygon points="20,2 38,35 2,35" fill="none" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="20,14 30,32 10,32" fill="none" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6" />
      <circle cx="20" cy="8" r="2.5" fill="#e11d48" />
      <circle cx="33" cy="32" r="2" fill="#fef3c7" />
      <circle cx="7" cy="32" r="2" fill="#be123c" />
    </svg>
  );
}

function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
      <div className="aurora-blob-1 absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-[#e11d48]/[0.07] blur-[120px]" />
      <div className="aurora-blob-2 absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full bg-[#be123c]/[0.06] blur-[100px]" />
      <div className="aurora-blob-3 absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[#fef3c7]/[0.04] blur-[100px]" />
    </div>
  );
}

function ConstellationVisual() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = (canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1));
    let height = (canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1));
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    const dw = canvas.offsetWidth || 400;
    const dh = canvas.offsetHeight || 400;

    const colors = ['#e11d48', '#fef3c7', '#be123c', '#f43f5e', '#ffffff'];
    const particles = [];
    
    for (let i = 0; i < 300; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * 110;
      particles.push({
        x: r * Math.sin(phi) * Math.cos(theta) * 1.3 + dw / 2,
        y: r * Math.sin(phi) * Math.sin(theta) * 0.9 + dh / 2,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        pulse: Math.random() * Math.PI,
        pulseSpeed: Math.random() * 0.04 + 0.02,
        targetX: null,
        targetY: null
      });
    }

    const doodleCount = 10;
    const doodles = [];
    for (let i = 0; i < doodleCount; i++) {
      doodles.push({
        text: FLOATING_MESSAGES[i % FLOATING_MESSAGES.length],
        x: Math.random() * dw * 0.8 + dw * 0.1,
        y: Math.random() * dh * 0.8 + dh * 0.1,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.4 + 0.35,
        maxOpacity: Math.random() * 0.5 + 0.45,
        fontSize: Math.random() * 4 + 11,
        rotation: (Math.random() - 0.5) * 0.2,
        phase: Math.random() * Math.PI * 2
      });
    }

    let frameCount = 0;
    const shapes = ['random', 'car', 'random', 'chart', 'random', 'triangle', 'random', 'phone'];
    let shapeIndex = 0;

    const assignShape = (shapeName) => {
      const cx = dw / 2, cy = dh / 2;
      const s = Math.min(dw, dh) * 0.35;
      
      particles.forEach((p, i) => {
        let tx = cx, ty = cy;
        const progress = i / particles.length;
        
        if (shapeName === 'triangle') {
          if (progress < 0.30) { const t = progress / 0.30; tx = cx + (-s + t * 2 * s); ty = cy + (s); }
          else if (progress < 0.60) { const t = (progress - 0.30) / 0.30; tx = cx + (s - t * s); ty = cy + (s - t * 2 * s); }
          else if (progress < 0.90) { const t = (progress - 0.60) / 0.30; tx = cx + (-t * s); ty = cy + (-s + t * 2 * s); }
          else {
             const t = (progress - 0.90) / 0.10;
             if (t < 0.33) { tx = cx - s; ty = cy + s; }
             else if (t < 0.66) { tx = cx + s; ty = cy + s; }
             else { tx = cx; ty = cy - s; }
             tx += (Math.random()-0.5)*20; ty += (Math.random()-0.5)*20;
          }
        }
        else if (shapeName === 'chart') {
          if (progress < 0.20) { const t = progress / 0.20; tx = cx - s; ty = cy + s - (t * 2 * s); }
          else if (progress < 0.40) { const t = (progress - 0.20) / 0.20; tx = cx - s + (t * 2 * s); ty = cy + s; }
          else if (progress < 0.85) { 
             const t = (progress - 0.40) / 0.45; 
             tx = cx - s + (t * 2 * s); 
             const jagged = Math.sin(t * 20) * 0.2 * s + Math.cos(t * 8) * 0.1 * s;
             ty = cy + s - (t * 1.5 * s) + jagged; 
          }
          else {
             const t = (progress - 0.85) / 0.15;
             tx = cx - s + (Math.random() * 2 * s);
             ty = cy + s - (Math.random() * 2 * s);
          }
        }
        else if (shapeName === 'phone') {
          const w = s * 0.55;
          const h = s * 1.1;
          if (progress < 0.20) { const t = progress / 0.20; tx = cx - w + (t * 2 * w); ty = cy - h; }
          else if (progress < 0.40) { const t = (progress - 0.20) / 0.20; tx = cx + w; ty = cy - h + (t * 2 * h); }
          else if (progress < 0.60) { const t = (progress - 0.40) / 0.20; tx = cx + w - (t * 2 * w); ty = cy + h; }
          else if (progress < 0.80) { const t = (progress - 0.60) / 0.20; tx = cx - w; ty = cy + h - (t * 2 * h); }
          else if (progress < 0.90) { 
             const t = (progress - 0.80) / 0.10;
             const angle = t * Math.PI * 2;
             tx = cx + Math.cos(angle) * (s * 0.12);
             ty = cy + h - (s * 0.25) + Math.sin(angle) * (s * 0.12);
          } else {
             const t = (progress - 0.90) / 0.10;
             tx = cx - (s * 0.15) + (t * s * 0.3);
             ty = cy - h + (s * 0.15);
          }
        }
        else if (shapeName === 'car') {
           const cw = s * 1.4;
           if (progress < 0.25) { 
              const t = progress / 0.25; tx = cx - cw/2 + (t * cw); ty = cy + s * 0.3; 
           }
           else if (progress < 0.45) { 
              const t = (progress - 0.25) / 0.20;
              if (t < 0.3) { tx = cx - cw/2 + (t/0.3)*cw*0.3; ty = cy + s * 0.3 - (t/0.3)*s*0.6; }
              else if (t < 0.7) { tx = cx - cw*0.2 + ((t-0.3)/0.4)*cw*0.5; ty = cy - s * 0.3; }
              else { tx = cx + cw*0.3 + ((t-0.7)/0.3)*cw*0.2; ty = cy - s * 0.3 + ((t-0.7)/0.3)*s*0.6; }
           }
           else if (progress < 0.70) { 
              const a = ((progress - 0.45) / 0.25) * Math.PI * 2; 
              tx = cx - cw * 0.25 + Math.cos(a) * (s * 0.2); 
              ty = cy + s * 0.3 + Math.sin(a) * (s * 0.2); 
           }
           else if (progress < 0.95) { 
              const a = ((progress - 0.70) / 0.25) * Math.PI * 2; 
              tx = cx + cw * 0.25 + Math.cos(a) * (s * 0.2); 
              ty = cy + s * 0.3 + Math.sin(a) * (s * 0.2); 
           } else {
              tx = cx - cw/4 + Math.random() * (cw/2);
              ty = cy - s * 0.1 + Math.random() * (s * 0.3);
           }
        }
        
        if (shapeName === 'random') {
           p.targetX = null;
           p.targetY = null;
        } else {
           p.targetX = tx;
           p.targetY = ty;
        }
      });
    };

    const render = () => {
      ctx.clearRect(0, 0, dw, dh);
      frameCount++;
      
      if (frameCount % 240 === 0) { // Every 4 seconds morph
         shapeIndex = (shapeIndex + 1) % shapes.length;
         assignShape(shapes[shapeIndex]);
      }

      doodles.forEach(d => {
        d.x += d.vx;
        d.y += d.vy;
        d.phase += 0.01;
        d.opacity = d.maxOpacity * (0.5 + 0.5 * Math.sin(d.phase));
        if (d.x < 40 || d.x > dw - 40) d.vx *= -1;
        if (d.y < 40 || d.y > dh - 40) d.vy *= -1;

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation);
        ctx.font = `300 ${d.fontSize}px Inter, sans-serif`;
        ctx.fillStyle = `rgba(225, 29, 72, ${d.opacity})`;
        ctx.textAlign = 'center';
        ctx.fillText(d.text, 0, 0);
        ctx.restore();
      });

      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 40) {
            ctx.strokeStyle = `rgba(225,29,72,${(1 - dist / 40) * 0.2})`;
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        if (p.targetX !== null) {
           p.x += (p.targetX - p.x) * 0.05 + (Math.random() - 0.5) * 0.3;
           p.y += (p.targetY - p.y) * 0.05 + (Math.random() - 0.5) * 0.3;
        } else {
           p.x += p.vx; p.y += p.vy;
           const d = Math.hypot(p.x - dw / 2, p.y - dh / 2);
           if (d > 150) { p.vx += (dw / 2 - p.x) * 0.001; p.vy += (dh / 2 - p.y) * 0.001; }
        }
        
        p.rotation += p.rotSpeed; p.pulse += p.pulseSpeed;
        const s = p.size + Math.sin(p.pulse) * 1.2;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
        ctx.strokeStyle = p.color; ctx.lineWidth = 1.2; ctx.fillStyle = p.color + '22';
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.86, s * 0.5); ctx.lineTo(-s * 0.86, s * 0.5); ctx.closePath();
        ctx.fill(); ctx.stroke(); ctx.restore();
      });
    };

    if (typeof window !== 'undefined' && window.Tempus) {
      const unsub = window.Tempus.add(() => render(), { order: 0, label: 'constellation' });
      return () => { if (typeof unsub === 'function') unsub(); };
    } else {
      let raf;
      const loop = () => { render(); raf = requestAnimationFrame(loop); };
      loop();
      return () => cancelAnimationFrame(raf);
    }
  }, []);

  return (
    <div className="w-full max-w-[480px] aspect-square relative flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full" style={{ width: '100%', height: '100%' }} />
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#e11d48]/10 via-transparent to-[#fef3c7]/10 pointer-events-none blur-3xl" />
    </div>
  );
}

function SiteLogo({ stream, size = 20 }) {
  const [failed, setFailed] = useState(false);
  const Icon = stream.icon;
  if (failed) return <Icon className="shrink-0" style={{ width: size, height: size, color: stream.color }} />;
  return (
    <img
      src={stream.logo}
      alt={stream.name}
      width={size}
      height={size}
      className="rounded-sm shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 30, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -20, filter: 'blur(6px)', transition: { duration: 0.35 } }
};
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
};
const staggerItem = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }
};

export default function App() {
  const [viewMode, setViewMode] = useState(localStorage.getItem('ethiofin_view') || 'landing');
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  const [logs, setLogs] = useState(() => Array.from({length: 30}, (_, i) => `[${new Date(Date.now() - i*10000).toISOString()}] INFO: Fetching ${Math.floor(Math.random()*100)} records...`));
  const [dashboardTheme, setDashboardTheme] = useState('phosphor');
  const [activeStreamKey, setActiveStreamKey] = useState(localStorage.getItem('ethiofin_stream') || '2merkato');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTag, setActiveFilterTag] = useState('all');
  const [sortOrder, setSortOrder] = useState('default');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [liveFps, setLiveFps] = useState(60);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [viewLayout, setViewLayout] = useState('grid');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalResults, setGlobalResults] = useState([]);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const constellationY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  
  const handleScrape = () => {
    if (isScraping) return;
    setIsLogViewerOpen(true);
    setIsScraping(true);
    setLogs([
      `[${new Date().toISOString()}] INFO: Initializing autonomous pipeline...`,
      `[${new Date().toISOString()}] INFO: Target → ${currentStream.name}`
    ]);

    const evtSource = new EventSource('/api/scrape/' + activeStreamKey);
    evtSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data === 'DONE') {
        evtSource.close();
        setIsScraping(false);
        localStorage.setItem('lastScraped_' + activeStreamKey, new Date().toISOString());
        triggerToast('Scrape complete! UI syncing...');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setLogs(prev => [...prev, `[${new Date().toISOString()}] ${data}`]);
      }
    };
    evtSource.onerror = () => {
      evtSource.close();
      setIsScraping(false);
      triggerToast('Scrape connection lost');
    };
  };

  const currentStream = REGISTRY[activeStreamKey] || REGISTRY['2merkato'];
  const dataset = currentStream.data || [];
  useEffect(() => { localStorage.setItem('ethiofin_view', viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem('ethiofin_stream', activeStreamKey); }, [activeStreamKey]);

  useEffect(() => {
    let lenis;
    let rafId;

    if (typeof window !== 'undefined' && window.Lenis) {
      lenis = new window.Lenis({
        anchors: true,
        allowNestedScroll: true,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        wheelMultiplier: 1,
        syncTouch: true
      });

      lenis.on('scroll', (e) => {
        setScrollProgress(e.progress || 0);
      });

      const raf = (time) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    }

    let fpsInterval = setInterval(() => {
      setLiveFps(prev => {
        if (window.Tempus && window.Tempus.fps) return Math.round(window.Tempus.fps);
        return prev;
      });
    }, 1500);

    return () => {
      if (lenis) lenis.destroy();
      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(fpsInterval);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsShortcutsOpen(false);
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        setIsShortcutsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const triggerToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 2400); };
  const copyText = (txt, label) => { navigator.clipboard.writeText(txt).then(() => triggerToast(`${label} copied`)); };

  const filteredRecords = useMemo(() => {
    let list = [...dataset];
    if (activeFilterTag !== 'all') {
      list = list.filter(item => {
        if (activeStreamKey === 'mekina') return (item.make || '').toLowerCase() === activeFilterTag.toLowerCase();
        if (activeStreamKey === '2merkato') return (item.category || '').toLowerCase() === activeFilterTag.toLowerCase();
        if (activeStreamKey === 'ethiojobs') return (item.employment_type || '').toLowerCase().includes(activeFilterTag.toLowerCase());
        if (activeStreamKey === 'jiji') return (item.condition || '').toLowerCase() === activeFilterTag.toLowerCase();
        return true;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => Object.values(item).some(v => v && String(v).toLowerCase().includes(q)));
    }
    if (sortOrder === 'alpha-asc') list.sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
    else if (sortOrder === 'alpha-desc') list.sort((a, b) => getTitle(b).localeCompare(getTitle(a)));
    else if (sortOrder === 'price-asc') list.sort((a, b) => parsePrice(a.price_etb) - parsePrice(b.price_etb));
    else if (sortOrder === 'price-desc') list.sort((a, b) => parsePrice(b.price_etb) - parsePrice(a.price_etb));
    return list;
  }, [dataset, activeFilterTag, searchQuery, sortOrder, activeStreamKey]);

  const filterPills = useMemo(() => {
    if (activeStreamKey === 'mekina') return ['all', ...([...new Set(dataset.map(i => i.make).filter(Boolean))].slice(0, 6))];
    if (activeStreamKey === 'ethiojobs') return ['all', 'Full time', 'Part time', 'Contract'];
    if (activeStreamKey === 'jiji') return ['all', 'Brand New', 'Used', 'የተጠቀመ'];
    if (activeStreamKey === '2merkato') return ['all', ...([...new Set(dataset.map(i => i.category).filter(Boolean))])];
    return ['all'];
  }, [activeStreamKey, dataset]);


  // Global cross-stream search
  useEffect(() => {
    if (!globalSearch.trim()) { setGlobalResults([]); return; }
    const q = globalSearch.toLowerCase();
    const results = [];
    Object.entries(REGISTRY).forEach(([key, stream]) => {
      if (!Array.isArray(stream.data)) return;
      stream.data.forEach(item => {
        if (Object.values(item).some(v => v && String(v).toLowerCase().includes(q))) {
          results.push({ ...item, _streamKey: key, _streamName: stream.name, _streamLogo: stream.logo });
        }
      });
    });
    setGlobalResults(results.slice(0, 20));
  }, [globalSearch]);

  const exportCSV = () => {
    if (!filteredRecords.length) return;
    const headers = Object.keys(filteredRecords[0]).filter(k => k !== 'input');
    const rows = [headers.join(','), ...filteredRecords.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))];
    const blob = new Blob([rows.join('n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ethiofin_${activeStreamKey}_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    triggerToast(`Exported ${filteredRecords.length} records`);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#ffffff] font-sans antialiased selection:bg-[#e11d48]/40 selection:text-white relative flex flex-col justify-between">
      <div className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-[#e11d48] via-[#fef3c7] to-[#e11d48] z-[60] pointer-events-none transition-all duration-75 shadow-[0_0_10px_rgba(225,29,72,0.8)]" style={{ width: `${Math.max(scrollProgress * 100, 0.5)}%` }} />
      <AnimatePresence mode="wait">

      {viewMode === 'landing' && (
        <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col justify-between relative">
          <AuroraBackground />
          <header className="w-full max-w-[1280px] mx-auto px-6 sm:px-12 py-6 flex items-center justify-between z-30 relative">
            <div className="flex items-center gap-3">
              <EthioFinLogo size={28} />
              <span className="text-sm font-semibold tracking-wider uppercase text-white">EthioFin</span>
            </div>
            <nav className="flex items-center gap-6 sm:gap-8">
              <a href="#verticals" className="text-sm font-semibold uppercase tracking-[0.025em] text-[#9a9a9a] hover:text-white transition-colors hidden sm:inline">5 STREAMS</a>
              <a href="#proof" className="text-sm font-semibold uppercase tracking-[0.025em] text-[#9a9a9a] hover:text-white transition-colors hidden sm:inline">SELF-HEALING</a>
              <div className="relative hidden sm:block">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9a]" />
                  <input type="text" placeholder="Search all streams..." value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} className="w-56 bg-[#121317]/80 border border-[#1c1d22] rounded-[16px] pl-9 pr-4 py-1.5 text-xs text-white placeholder-[#9a9a9a] focus:outline-none focus:border-[#e11d48] transition backdrop-blur-sm" />
                  {globalResults.length > 0 && (
                    <div className="absolute top-full mt-2 left-0 w-80 bg-[#0c0d12] border border-[#1c1d22] rounded-[16px] shadow-2xl max-h-[400px] overflow-y-auto z-50 p-2 space-y-1">
                      <div className="text-[10px] font-mono text-[#9a9a9a] px-3 py-1">{globalResults.length} results across all streams</div>
                      {globalResults.map((r, i) => (
                        <button key={i} onClick={() => { setActiveStreamKey(r._streamKey); setSearchQuery(globalSearch); setGlobalSearch(''); setGlobalResults([]); setViewMode('terminal'); }} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-[#121317] transition cursor-pointer group">
                          <img src={r._streamLogo} alt="" className="w-5 h-5 rounded" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-white truncate group-hover:text-[#e11d48] transition-colors">{getTitle(r) || Object.values(r).find(v => typeof v === 'string' && v.length > 5) || 'Record'}</div>
                            <div className="text-[10px] text-[#9a9a9a] font-mono">{r._streamName}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              <button onClick={() => setViewMode('terminal')} className="px-5 py-2.5 rounded-[24px] bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-semibold uppercase tracking-[0.025em] transition-all duration-300 active:scale-95 flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(225,29,72,0.35)]">
                <span>LAUNCH TERMINAL</span><ArrowRight className="w-3.5 h-3.5" />
              </button>
            </nav>
          </header>

          <section ref={heroRef} className="max-w-[1280px] mx-auto px-6 sm:px-12 pt-12 pb-24 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-20">
            <motion.div style={{ y: heroY, opacity: heroOpacity }} className="lg:col-span-7 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="inline-flex items-center gap-2 text-sm font-semibold text-[#fef3c7] uppercase tracking-[0.35px]">
                <span className="w-2 h-2 rounded-full bg-[#fef3c7] animate-pulse" />
                <span>FRONTIER INTELLIGENCE CONSTELLATION</span>
              </motion.div>
              <h1 className="text-5xl sm:text-7xl lg:text-[78px] font-normal leading-[1.05] tracking-[-3.12px] text-white">
                <ScrambleText text="Ethiopian markets decoded in real-time." speed={25} />
              </h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.8 }} className="text-lg font-[200] leading-relaxed text-[#bdbdbd] max-w-xl">
                EthioFin extracts, heals, and synthesizes live financial data from five Ethiopian platforms — banking rates, vehicle assets, tech ventures, consumer goods, and enterprise hiring — through self-healing autonomous scrapers that never break.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2, duration: 0.5 }} className="pt-4 flex flex-wrap items-center gap-5">
                <button onClick={() => setViewMode('terminal')} className="px-7 py-3.5 rounded-[24px] bg-[#e11d48] hover:bg-[#be123c] text-white text-sm font-semibold uppercase tracking-[0.025em] transition-all duration-300 active:scale-95 flex items-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(225,29,72,0.4)] group">
                  <span>LAUNCH LIVE TERMINAL</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => setIsAuditModalOpen(true)} className="text-sm font-normal text-[#9a9a9a] hover:text-white underline underline-offset-4 transition-colors cursor-pointer">
                  Inspect Self-Healing Audit
                </button>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 0.6 }} className="flex items-center gap-4 pt-6 border-t border-[#1c1d22]/40">
                <span className="text-[10px] uppercase text-[#9a9a9a] tracking-wider">SOURCES:</span>
                {Object.values(REGISTRY).map(st => (
                  <a key={st.id} href={st.url} target="_blank" rel="noopener noreferrer" title={st.name} className="opacity-50 hover:opacity-100 transition-opacity">
                    <SiteLogo stream={st} size={22} />
                  </a>
                ))}
              </motion.div>
            </motion.div>
            <motion.div style={{ y: constellationY }} className="lg:col-span-5 flex items-center justify-center relative">
              <ConstellationVisual />
            </motion.div>
          </section>

          <section id="proof" className="max-w-[1280px] mx-auto px-6 sm:px-12 py-16 w-full border-t border-[#1c1d22]/50 relative z-20">
            <motion.div variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.3 }} className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {[ { value: 5, suffix: '', label: 'PLATFORMS', sublabel: 'MONITORED' }, { value: totalSignals, suffix: '+', label: 'SIGNALS', sublabel: 'EXTRACTED' }, { value: 100, suffix: '%', label: 'HEAL RATE', sublabel: 'AUTONOMOUS' }, { value: 0, suffix: '', label: 'DOWNTIME', sublabel: 'INCIDENTS' }].map((stat, i) => (
                <motion.div key={i} variants={staggerItem} className="text-center space-y-1">
                  <div className="text-4xl sm:text-5xl font-normal tracking-[-1.68px] text-white"><AnimatedCounter target={stat.value} suffix={stat.suffix} /></div>
                  <div className="text-xs font-semibold text-[#fef3c7] uppercase tracking-wider">{stat.label}</div>
                  <div className="text-[11px] font-[200] text-[#9a9a9a] uppercase">{stat.sublabel}</div>
                </motion.div>
              ))}
            </motion.div>
          </section>

          <section id="verticals" className="max-w-[1280px] mx-auto px-6 sm:px-12 py-20 w-full border-t border-[#1c1d22]/50 relative z-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                <div className="text-sm font-semibold text-[#fef3c7] uppercase tracking-[0.35px]">KNOWLEDGE AS DISTRIBUTED INTELLIGENCE</div>
                <h2 className="text-4xl sm:text-5xl font-normal leading-[1.1] tracking-[-1.68px] text-white">Five platforms.<br /><span className="gradient-text-iris">Zero selector drift.</span></h2>
                <p className="text-lg font-[200] leading-relaxed text-[#bdbdbd]">Bright Data Scraper Studio monitors and self-heals across every target — from 2merkato's banking disclosures to Mekina's automotive liquidity. When the DOM changes, EthioFin adapts. Automatically.</p>
                <button onClick={() => setViewMode('terminal')} className="px-6 py-3 rounded-[24px] bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-semibold uppercase tracking-[0.025em] transition-all cursor-pointer inline-flex items-center gap-2">
                  <span>EXPLORE ALL 5 FEEDS</span><ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <motion.div variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.2 }} className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.values(REGISTRY).map((st) => (
                  <motion.div key={st.id} variants={staggerItem} onClick={() => { setActiveStreamKey(st.id); setViewMode('terminal'); }} className="p-6 rounded-[24px] bg-[#0c0d12] hover:bg-[#12141c] border border-transparent hover:border-[#e11d48]/30 transition-all duration-300 cursor-pointer group space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase">
                      <span className="flex items-center gap-2"><SiteLogo stream={st} size={18} /><span style={{ color: st.color }}>{st.code} // {st.index}</span></span>
                      <ArrowUpRight className="w-4 h-4 text-[#9a9a9a] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <div className="text-xl font-normal text-white group-hover:text-[#e11d48] transition-colors">{st.name}</div>
                    <p className="text-xs font-[200] text-[#bdbdbd] line-clamp-2">{st.headline}</p>
                    <div className="text-[10px] font-mono text-[#9a9a9a]">{st.domain} • {Array.isArray(st.data) ? st.data.length : 0} signals</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          <section className="max-w-[1280px] mx-auto px-6 sm:px-12 py-20 w-full border-t border-[#1c1d22]/50 relative z-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="text-sm font-semibold text-[#fef3c7] uppercase tracking-[0.35px]">AUTONOMOUS SCHEMA REPAIR</div>
                <h2 className="text-4xl sm:text-5xl font-normal leading-[1.1] tracking-[-1.68px] text-white">We don't just scrape.<br /><span className="gradient-text-iris">We heal.</span></h2>
                <p className="text-lg font-[200] leading-relaxed text-[#bdbdbd]">Traditional scrapers break when websites change. EthioFin's autonomous pipeline detects schema drift, patches CSS selectors in real-time, and validates output integrity — all without human intervention.</p>
                <button onClick={() => setIsAuditModalOpen(true)} className="px-6 py-3 rounded-[24px] bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-semibold uppercase tracking-[0.025em] transition-all cursor-pointer inline-flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /><span>VIEW FULL AUDIT</span>
                </button>
              </div>
              <div className="space-y-3 text-xs font-mono">
                <div className="p-4 rounded-[16px] bg-[#0c0d12] space-y-1">
                  <div className="text-[#9a9a9a] font-bold text-[11px]">BEFORE HEAL — DRIFTED SCHEMA</div>
                  <pre className="text-[#bdbdbd] text-[11px] leading-relaxed">{`{
  "make": "Toyota",
  "model": null,       // ⚠ MISSING
  "product_page_url": "...",
  "price_etb": " ETB 2,400,000 "
}`}</pre>
                </div>
                <div className="p-4 rounded-[16px] bg-[#0c0d12] border border-[#e11d48]/40 space-y-1">
                  <div className="text-[#e11d48] font-bold text-[11px]">AFTER HEAL — SELF-CORRECTED</div>
                  <pre className="text-white text-[11px] leading-relaxed">{`{
  "make": "Toyota",
  "model": "Vitz Yaris", // ✓ RESTORED
  "url": "https://mekina.net/...",
  "price_etb": "ETB 2,400,000"
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          <section className="max-w-[1280px] mx-auto px-6 sm:px-12 py-16 w-full relative z-20">
            <div className="rounded-[24px] bg-gradient-to-r from-[#e11d48]/20 to-[#15846e]/20 border border-[#e11d48]/20 p-10 sm:p-14 text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-1.68px] text-white">Your data. Your terminal. Your intelligence.</h2>
              <p className="text-sm font-[200] text-[#bdbdbd] max-w-lg mx-auto">Switch between five live data streams. Search, filter, sort, and export. Inspect raw JSON payloads. Copy production cURL commands. Everything rendered at 120fps.</p>
              <button onClick={() => setViewMode('terminal')} className="px-8 py-4 rounded-[24px] bg-[#e11d48] hover:bg-[#be123c] text-white text-sm font-semibold uppercase tracking-[0.025em] transition-all cursor-pointer inline-flex items-center gap-2 shadow-[0_0_30px_rgba(225,29,72,0.5)] group">
                <span>OPEN LIVE DASHBOARD</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </section>

          <footer className="max-w-[1280px] mx-auto px-6 sm:px-12 py-10 w-full border-t border-[#1c1d22]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9a9a9a] font-normal relative z-20">
            <div className="flex items-center gap-2"><EthioFinLogo size={18} /><span>ETHIOFIN INTELLIGENCE • WE-MAKE-DEVS × BRIGHT DATA HACKATHON</span></div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono text-[#9a9a9a]">⌘K TO QUICK-NAVIGATE</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#e11d48] animate-pulse" /><span className="text-white font-mono text-[11px]">LENIS + TEMPUS: {liveFps} FPS</span></span>
            </div>
          </footer>
        </motion.div>
      )}

      {viewMode === "terminal" && (
        <motion.div key="terminal" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col min-h-screen">
          <header className="sticky top-0 z-40 bg-[#000000]/90 backdrop-blur-xl border-b border-[#1c1d22]/60">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setViewMode('landing')} className="flex items-center gap-1.5 px-4 py-2 rounded-[24px] bg-[#121317] hover:bg-[#1c1d22] text-xs font-semibold uppercase text-white transition cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" /> BACK
                </button>
                <button onClick={() => setIsCommandPaletteOpen(true)} className="hidden sm:flex items-center gap-2 text-sm font-semibold tracking-wide hover:bg-[#121317] px-3 py-1.5 rounded-lg transition border border-transparent hover:border-[#1c1d22] cursor-pointer">
                  <span className="text-[#9a9a9a]">STREAM:</span>
                  <span className="text-[#e11d48] flex items-center gap-1">{currentStream.name.toUpperCase()} <ChevronDown className="w-3.5 h-3.5" /></span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="bg-[#121317] border border-[#1c1d22] rounded-[14px] text-[#9a9a9a] text-xs px-3 py-2 outline-none cursor-pointer hover:border-[#2e3038] transition appearance-none">
                  <option value="default">Default</option>
                  <option value="alpha-asc">A → Z</option>
                  <option value="alpha-desc">Z → A</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                </select>
                <button onClick={() => setViewLayout(l => l === 'grid' ? 'list' : 'grid')} className="p-2 rounded-[14px] bg-[#121317] border border-[#1c1d22] hover:bg-[#1c1d22] text-[#9a9a9a] transition cursor-pointer">
                  {viewLayout === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                </button>
                <span className="text-[10px] font-mono text-[#9a9a9a] bg-[#121317] px-2 py-1 rounded-[8px] border border-[#1c1d22]">{filteredRecords.length} / {dataset.length}</span>
                <button onClick={() => setIsLogViewerOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-[24px] bg-[#e11d48]/10 hover:bg-[#e11d48]/20 text-[#e11d48] border border-[#e11d48]/30 text-xs font-semibold uppercase transition cursor-pointer">
                  <Terminal className="w-3.5 h-3.5" /> LOGS
                </button>
              </div>
            </div>
          </header>
          <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 w-full flex-1 flex flex-col gap-6">
            <div className="flex flex-col gap-4 pb-4">
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                 {Object.values(REGISTRY).map(st => (
                   <button key={st.id} onClick={() => setActiveStreamKey(st.id)} className={`px-4 py-2.5 rounded-[16px] text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${activeStreamKey === st.id ? 'bg-[#e11d48] text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]' : 'bg-[#121317] text-[#9a9a9a] hover:text-white border border-[#1c1d22] hover:border-[#2e3038]'}`}>
                      <SiteLogo stream={st} size={14} /> {st.name}
                   </button>
                 ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
                  {filterPills.map(pill => (
                    <button key={pill} onClick={() => setActiveFilterTag(pill)} className={`px-3 py-1.5 rounded-[12px] text-[11px] font-mono uppercase tracking-wider transition cursor-pointer border ${activeFilterTag === pill ? 'bg-[#fef3c7] text-black border-[#fef3c7]' : 'bg-transparent text-[#9a9a9a] border-[#1c1d22] hover:border-[#9a9a9a]'}`}>
                      {pill}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:max-w-xs shrink-0">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9a]" />
                  <input type="text" placeholder={`Search ${currentStream.name}...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-[#121317] border border-[#1c1d22] rounded-[16px] pl-9 pr-4 py-2 text-sm text-white placeholder-[#9a9a9a] focus:outline-none focus:border-[#e11d48] transition" />
                </div>
              </div>
            </div>
            
            {/* STREAM INFO HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-[20px] bg-[#0c0d12] border border-[#1c1d22]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-[14px] bg-[#121317] border border-[#1c1d22] flex items-center justify-center shrink-0">
                  <img src={currentStream.logo} alt={currentStream.name} className="w-6 h-6 rounded" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{currentStream.headline}</h2>
                    <a href={currentStream.url} target="_blank" rel="noopener noreferrer" className="text-[#9a9a9a] hover:text-[#e11d48] transition"><ExternalLink className="w-3.5 h-3.5" /></a>
                  </div>
                  <p className="text-xs text-[#9a9a9a] font-[300] max-w-xl leading-relaxed">{currentStream.desc}</p>
                  <div className="flex items-center gap-4 pt-1">
                    <span className="text-[10px] font-mono text-[#9a9a9a] flex items-center gap-1"><Database className="w-3 h-3" /> {Array.isArray(currentStream.data) ? currentStream.data.length : 0} records</span>
                    <span className="text-[10px] font-mono text-[#9a9a9a] flex items-center gap-1"><Clock className="w-3 h-3" /> <span className={getFreshnessColor(localStorage.getItem('lastScraped_' + activeStreamKey) || currentStream.lastScraped)}>Scraped {getRelativeTime(localStorage.getItem('lastScraped_' + activeStreamKey) || currentStream.lastScraped || Date.now())}</span></span>
                    <span className="text-[10px] font-mono text-[#fef3c7] flex items-center gap-1"><Zap className="w-3 h-3" /> {currentStream.domain}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 rounded-[16px] bg-[#121317] border border-[#1c1d22] hover:border-[#2e3038] text-xs font-semibold text-[#9a9a9a] hover:text-white transition cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> EXPORT PDF
                </button>
                <button onClick={() => exportCSV()} className="flex items-center gap-1.5 px-4 py-2 rounded-[16px] bg-[#121317] border border-[#1c1d22] hover:border-[#2e3038] text-xs font-semibold text-[#9a9a9a] hover:text-white transition cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> EXPORT CSV
                </button>
                <button onClick={() => { setIsAuditModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-2 rounded-[16px] bg-[#121317] border border-[#1c1d22] hover:border-emerald-500/50 text-xs font-mono text-emerald-400 transition cursor-pointer">
                  <ShieldCheck className="w-3.5 h-3.5" /> HEALED
                </button>
                <button onClick={handleScrape} disabled={isScraping} className={`flex items-center gap-1.5 px-4 py-2 rounded-[16px] text-white text-xs font-semibold uppercase transition cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.25)] ${isScraping ? 'bg-[#be123c] opacity-80 cursor-wait' : 'bg-[#e11d48] hover:bg-[#be123c]'}`}>
                  <Rocket className={`w-3.5 h-3.5 ${isScraping ? 'animate-pulse' : ''}`} /> {isScraping ? 'SCRAPING...' : 'SCRAPE NOW'}
                </button>
              </div>
            </div>
            <motion.div layout className={viewLayout === 'list' ? 'flex flex-col gap-2' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}>
              <AnimatePresence mode="popLayout">
                {filteredRecords.slice(0, 60).map((item, idx) => (
                  <motion.div layout key={idx} variants={staggerItem} initial="initial" animate="animate" exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0c0d12] border border-[#1c1d22] p-5 rounded-[20px] flex flex-col gap-4 group hover:border-[#e11d48]/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <img src={currentStream.logo} alt="logo" className="w-6 h-6 rounded-md opacity-80" />
                        <span className="text-xs font-semibold text-[#9a9a9a]">{currentStream.name}</span>
                      </div>
                      <a href={getSourceUrl(item, activeStreamKey)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-[12px] bg-[#121317] hover:bg-[#e11d48]/20 hover:text-[#e11d48] text-[#9a9a9a] transition">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    {activeStreamKey === 'jiji' && item.image_url && viewLayout === 'grid' && (
                      <div className="w-full h-32 rounded-[12px] overflow-hidden bg-[#121317]">
                        <img src={item.image_url} alt={item.item_title || ''} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className={viewLayout === 'list' ? "grid grid-cols-5 gap-4 items-center" : "space-y-3"}>
                      {currentStream.fields.map(field => (
                        <div key={field} className="flex flex-col">
                          <span className="text-[10px] font-mono text-[#555] uppercase tracking-wider">{field.replace('_', ' ')}</span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-[#e2e8f0] font-[300] line-clamp-2" title={String(item[field] || '')}>{item[field] || '-'}</span>
                            {field === 'price_etb' && item.price_etb && <Sparkline currentPrice={item.price_etb} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </main>
        </motion.div>
      )}

      </AnimatePresence>

      <AnimatePresence>
        {isLogViewerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsLogViewerOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} onClick={e => e.stopPropagation()} className="bg-[#0c0d12] border border-[#1c1d22] rounded-[20px] max-w-4xl w-full h-[70vh] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#1c1d22] flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#e11d48]">
                  <Terminal className="w-4 h-4" /> SYSTEM_LOGS :: {activeStreamKey.toUpperCase()}
                </div>
                <button onClick={() => setIsLogViewerOpen(false)} className="p-1 hover:bg-white/10 rounded-md text-[#9a9a9a]"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-1 text-[#9a9a9a]">
                {logs.map((log, i) => (
                  <div key={i} className={`hover:bg-white/5 px-2 py-0.5 rounded-sm ${log.includes('ERROR') ? 'text-red-500' : ''}`}>{log}</div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCommandPaletteOpen && (
          <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh] p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsCommandPaletteOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()} className="bg-[#0c0d12] border border-[#1c1d22] rounded-[20px] max-w-lg w-full shadow-2xl overflow-hidden" data-lenis-prevent>
              <div className="p-3 border-b border-[#1c1d22] flex items-center gap-2">
                <Search className="w-4 h-4 text-[#9a9a9a] shrink-0" />
                <input autoFocus type="text" placeholder="Navigate to stream..." className="bg-transparent text-white placeholder-[#9a9a9a] outline-none text-sm flex-1 font-[200]" />
                <span className="text-[10px] font-mono text-[#9a9a9a] bg-[#121317] px-2 py-0.5 rounded">ESC</span>
              </div>
              <div className="p-2 max-h-[300px] overflow-y-auto space-y-1">
                {Object.values(REGISTRY).map(st => (
                  <button key={st.id} onClick={() => { setActiveStreamKey(st.id); setViewMode('terminal'); setIsCommandPaletteOpen(false); }} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-[#121317] transition cursor-pointer group">
                    <SiteLogo stream={st} size={18} />
                    <div className="flex-1">
                      <div className="text-sm font-normal text-white group-hover:text-[#e11d48] transition-colors">{st.name}</div>
                      <div className="text-[10px] text-[#9a9a9a] font-mono">{st.sector}</div>
                    </div>
                    <span className="text-[10px] font-mono text-[#9a9a9a]">{Array.isArray(st.data) ? st.data.length : 0} signals</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9a9a9a] group-hover:text-white" />
                  </button>
                ))}
                <div className="border-t border-[#1c1d22] my-1" />
                <button onClick={() => { setViewMode('landing'); setIsCommandPaletteOpen(false); }} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-[#121317] transition cursor-pointer group">
                  <Globe className="w-4 h-4 text-[#9a9a9a]" /><div className="text-sm text-white group-hover:text-[#e11d48]">Go to Landing Page</div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAuditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={() => setIsAuditModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} onClick={e => e.stopPropagation()} data-lenis-prevent className="bg-[#0c0d12] border border-[#1c1d22] rounded-[24px] max-w-3xl w-full p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#1c1d22] pb-4">
                <div>
                  <div className="text-xs font-semibold uppercase text-[#fef3c7] tracking-wider">SELF-HEALING PIPELINE AUDIT</div>
                  <h3 className="text-2xl font-normal text-white mt-1">Autonomous Repair Logs</h3>
                </div>
                <button onClick={() => setIsAuditModalOpen(false)} className="p-2 rounded-full hover:bg-[#1a1b24] text-[#9a9a9a] hover:text-white transition cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              {[ { name: 'Mekina', cid: 'c_mt36peobj8en307wk', desc: 'Vehicle listings missing model field. Fix: extract model from title, normalize url field.', trace: 'planner → code_fixer → request_fulfillment_validator → user_approval', status: 'DONE' }, { name: 'Ethiojobs', cid: 'c_mt37gbucxqvek3flm', desc: 'Company name includes trailing legal suffixes. Fix: strip "Plc" from company field.', trace: 'planner → css_selector_extractor → code_fixer → step_preview_runner', status: 'DONE' }].map((item, i) => (
                <div key={i} className="p-5 rounded-[20px] bg-[#12141c] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-white font-semibold">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#e11d48]" /> {item.name} (<span className="font-mono text-[10px] text-[#9a9a9a]">{item.cid}</span>)</span>
                    <span className={`px-3 py-0.5 rounded-[24px] font-mono text-[10px] ${item.status === 'DONE' ? 'bg-[#e11d48] text-white' : 'bg-[#fef3c7] text-black font-bold'}`}>{item.status}</span>
                  </div>
                  <p className="text-[#bdbdbd] font-[200] text-sm">{item.desc}</p>
                  <div className="text-[11px] font-mono text-[#9a9a9a] bg-[#000000] p-3 rounded-[12px]">{item.trace}</div>
                </div>
              ))}
              <div className="flex justify-end"><button onClick={() => setIsAuditModalOpen(false)} className="px-6 py-2.5 rounded-[24px] bg-[#e11d48] text-white font-semibold text-xs uppercase hover:bg-[#be123c] transition cursor-pointer">Close Audit</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isApiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={() => setIsApiModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} onClick={e => e.stopPropagation()} data-lenis-prevent className="bg-[#0c0d12] border border-[#1c1d22] rounded-[24px] max-w-2xl w-full p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#1c1d22] pb-4">
                <div>
                  <div className="text-xs font-semibold uppercase text-[#fef3c7]">REST TELEMETRY</div>
                  <h3 className="text-2xl font-normal text-white mt-1 flex items-center gap-2">
                    <SiteLogo stream={currentStream} size={24} /> {currentStream.name} Collector Endpoint
                  </h3>
                </div>
                <button onClick={() => setIsApiModalOpen(false)} className="p-2 rounded-full hover:bg-[#1a1b24] text-[#9a9a9a] hover:text-white transition cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#9a9a9a]">
                  <span>cURL for {currentStream.name}:</span>
                  <button onClick={() => copyText(`curl -X POST "https://api.brightdata.com/dca/trigger?collector=${currentStream.collectorId}&queue_next=1" \n  -H "Authorization: Bearer YOUR_API_KEY" \n  -H "Content-Type: application/json" \n  -d '[{"url": "${currentStream.url}"}]'`, 'cURL')} className="text-[#e11d48] hover:underline inline-flex items-center gap-1 font-mono cursor-pointer font-semibold"><Copy className="w-3 h-3" /> Copy</button>
                </div>
                <pre className="p-4 rounded-[16px] bg-[#000000] text-xs font-mono text-white overflow-x-auto select-all leading-relaxed whitespace-pre-wrap">{`curl -X POST "https://api.brightdata.com/dca/trigger?collector=${currentStream.collectorId}&queue_next=1" \n  -H "Authorization: Bearer YOUR_API_KEY" \n  -H "Content-Type: application/json" \n  -d '[{"url": "${currentStream.url}"}]'`}</pre>
              </div>
              <div className="flex justify-end"><button onClick={() => setIsApiModalOpen(false)} className="px-6 py-2.5 rounded-[24px] bg-[#e11d48] text-white font-semibold text-xs uppercase hover:bg-[#be123c] transition cursor-pointer">Dismiss</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSignal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedSignal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} onClick={e => e.stopPropagation()} data-lenis-prevent className="bg-[#0c0d12] border border-[#1c1d22] rounded-[24px] max-w-4xl w-full p-8 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-[#1c1d22] pb-4">
                <div>
                  <div className="text-xs font-semibold uppercase text-[#fef3c7]">PAYLOAD INSPECTOR</div>
                  <h3 className="text-2xl font-normal text-white mt-1 flex items-center gap-2">
                    <SiteLogo stream={currentStream} size={22} />
                    {getTitle(selectedSignal) || `${activeStreamKey}.json`}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {getSourceUrl(selectedSignal, activeStreamKey) && (
                    <a href={getSourceUrl(selectedSignal, activeStreamKey)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-[24px] bg-[#121317] hover:bg-[#1c1d22] text-xs font-semibold text-white transition inline-flex items-center gap-1.5 cursor-pointer border border-[#2e3038]">
                      <ExternalLink className="w-3.5 h-3.5" style={{ color: currentStream.color }} /> OPEN ON {currentStream.name.toUpperCase()}
                    </a>
                  )}
                  <button onClick={() => copyText(JSON.stringify(selectedSignal, null, 2), 'JSON')} className="px-4 py-2 rounded-[24px] bg-[#121317] hover:bg-[#1c1d22] text-xs font-mono text-white transition inline-flex items-center gap-1.5 cursor-pointer"><Copy className="w-3.5 h-3.5 text-[#e11d48]" /> Copy</button>
                  <button onClick={() => setSelectedSignal(null)} className="p-2 rounded-full hover:bg-[#1a1b24] text-[#9a9a9a] hover:text-white transition cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden rounded-[16px] bg-[#000000] relative" data-lenis-prevent>
                <pre className="p-5 text-xs font-mono text-white h-full max-h-[60vh] overflow-y-auto leading-relaxed select-all">{JSON.stringify(selectedSignal, null, 2)}</pre>
              </div>
              <div className="flex justify-end"><button onClick={() => setSelectedSignal(null)} className="px-6 py-2.5 rounded-[24px] bg-[#e11d48] text-white font-semibold text-xs uppercase hover:bg-[#be123c] transition cursor-pointer">Dismiss</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShortcutsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsShortcutsOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-[#0c0d12] border border-[#1c1d22] rounded-[20px] max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
                <button onClick={() => setIsShortcutsOpen(false)} className="p-1 hover:bg-white/10 rounded-md text-[#9a9a9a]"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                {[
                  ['⌘K / Ctrl+K', 'Command Palette'],
                  ['?', 'Toggle this menu'],
                  ['G then L', 'Grid / List toggle'],
                  ['Escape', 'Close modals'],
                ].map(([key, desc], i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#1c1d22] last:border-0">
                    <span className="text-sm text-[#9a9a9a]">{desc}</span>
                    <kbd className="px-2.5 py-1 rounded-md bg-[#121317] border border-[#1c1d22] text-[11px] font-mono text-[#fef3c7]">{key}</kbd>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#9a9a9a] font-mono text-center pt-2">Press ? to dismiss</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-5 py-3 rounded-[24px] bg-[#e11d48] text-white font-semibold text-xs shadow-2xl font-mono uppercase tracking-wider">
            <Check className="w-3.5 h-3.5 text-[#fef3c7]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getTitle(item) {
  return item.title || item.headline || item.item_title || `${item.make || ''} ${item.model || ''}`.trim() || item.job_title || '';
}
function parsePrice(str) {
  if (!str) return 0;
  return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
}
