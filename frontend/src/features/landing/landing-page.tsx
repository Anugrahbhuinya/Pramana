// src/features/landing/landing-page.tsx
import * as React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  ChevronRight,
  Database,
  Cpu,
  Workflow,
  Search,
  Activity,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-accent-emerald-500/30">
      {/* Landing Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-emerald-600 shadow-sm shadow-accent-emerald-950/30">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-wide text-white">
              Pramana
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
            <a href="#architecture" className="hover:text-slate-100 transition-colors">System Architecture</a>
            <a href="#about" className="hover:text-slate-100 transition-colors">Vision</a>
          </nav>

          <div>
            <Link to="/dashboard">
              <Button variant="emerald" size="sm">
                Open Compliance Control Center
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden border-b border-slate-900">
        {/* Subtle grid background overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.07),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-30" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 rounded-full border border-slate-800 bg-slate-900/50 px-3.5 py-1 text-xs text-accent-emerald-400 font-medium tracking-wide mb-6">
            <Activity className="h-3 w-3 animate-pulse" />
            <span>AI-Powered Regulatory Intelligence Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-white leading-tight">
            Transforming Regulatory Knowledge <br />
            <span className="bg-gradient-to-r from-accent-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              into Trusted Action.
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-400 max-w-3xl mx-auto font-sans leading-relaxed">
            Pramana transforms SEBI regulations into explainable operational intelligence using AI-powered regulatory reasoning, organizational impact analysis, and continuous compliance monitoring.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button variant="emerald" size="lg" className="w-full sm:w-auto">
                Start Regulatory Analysis
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
            <a href="#architecture">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-slate-350 hover:bg-slate-900 border-slate-800 hover:text-white">
                See How Pramana Works
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Product Features Section */}
      <section id="features" className="py-20 md:py-28 bg-slate-900/20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold text-white tracking-tight">
              Enterprise Compliance Infrastructure
            </h2>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Engineered with clean architectural patterns to ensure strict audit trails, explainable outcomes, and end-to-end lineage mapping.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 flex flex-col">
              <div className="h-10 w-10 rounded-lg bg-accent-emerald-500/10 flex items-center justify-center text-accent-emerald-500 mb-4">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white font-display">Regulatory Twin</h3>
              <p className="mt-2 text-slate-400 text-xs leading-relaxed flex-1">
                Visualizing obligations using detailed node relationships and directed networks. Track dependencies across multiple compliance levels.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 flex flex-col">
              <div className="h-10 w-10 rounded-lg bg-accent-emerald-500/10 flex items-center justify-center text-accent-emerald-500 mb-4">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white font-display">Executive Agents</h3>
              <p className="mt-2 text-slate-400 text-xs leading-relaxed flex-1">
                Isolated bots addressing specific regulatory and risk evaluations. Continuous operational validation and automated report synthesis.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 flex flex-col">
              <div className="h-10 w-10 rounded-lg bg-accent-emerald-500/10 flex items-center justify-center text-accent-emerald-500 mb-4">
                <Workflow className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white font-display">Traceable Audits</h3>
              <p className="mt-2 text-slate-400 text-xs leading-relaxed flex-1">
                Every obligation maps directly back to the original clause. Explainable reasoning paths prevent hallucinated assumptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Illustration Section */}
      <section id="architecture" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold text-white tracking-tight">
              Pramana Platform Architecture
            </h2>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Constructed with a decoupled backend and strict repository patterns. Data flow complies with enterprise security guidelines.
            </p>
          </div>

          {/* Architecture Layout Blocks */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-8 max-w-4xl mx-auto">
            <div className="grid gap-6">
              {/* Layer 1: Client Presentation */}
              <div className="border border-slate-800 bg-slate-950 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between">
                <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                  <Layers className="h-5 w-5 text-accent-emerald-500" />
                  <div className="text-left">
                    <h4 className="text-sm font-semibold text-white">Client Presentation Layer</h4>
                    <p className="text-[11px] text-slate-500">React 19, TypeScript, Recharts & React Flow</p>
                  </div>
                </div>
                <div className="text-xs font-mono text-slate-500 border border-slate-800 bg-slate-900 px-2.5 py-1 rounded">
                  HTTP / Axios Client
                </div>
              </div>

              {/* Connector */}
              <div className="h-4 flex justify-center">
                <div className="w-0.5 bg-gradient-to-b from-accent-emerald-500 to-blue-500 opacity-60"></div>
              </div>

              {/* Layer 2: API Gateway & Service Orchestrator */}
              <div className="border border-slate-800 bg-slate-950 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between">
                <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                  <Cpu className="h-5 w-5 text-blue-500" />
                  <div className="text-left">
                    <h4 className="text-sm font-semibold text-white">Service Orchestration Layer</h4>
                    <p className="text-[11px] text-slate-500">FastAPI, Python Async services & Pydantic Validation</p>
                  </div>
                </div>
                <div className="text-xs font-mono text-slate-500 border border-slate-800 bg-slate-900 px-2.5 py-1 rounded">
                  Dependency Injection
                </div>
              </div>

              {/* Connector */}
              <div className="h-4 flex justify-center">
                <div className="w-0.5 bg-gradient-to-b from-blue-500 to-amber-500 opacity-60"></div>
              </div>

              {/* Layer 3: Persistence & Repositories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-800 bg-slate-950 rounded-lg p-4 text-left">
                  <div className="flex items-center space-x-2.5 mb-2">
                    <Database className="h-4 w-4 text-amber-500" />
                    <h5 className="text-xs font-bold text-white">Database Repositories</h5>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    SQLAlchemy declarative models with UUID primary keys and soft-delete mixins. Async connection pooling.
                  </p>
                </div>
                <div className="border border-slate-800 bg-slate-950 rounded-lg p-4 text-left">
                  <div className="flex items-center space-x-2.5 mb-2">
                    <Search className="h-4 w-4 text-amber-500" />
                    <h5 className="text-xs font-bold text-white">PostgreSQL Storage Engine</h5>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Dockerized relational storage with Alembic-controlled auto-migrations and structured transaction environments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-8 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 rounded bg-accent-emerald-600 flex items-center justify-center">
              <ShieldCheck className="h-3 w-3 text-white" />
            </div>
            <span className="font-display font-bold text-sm tracking-wide text-white">Pramana</span>
            <span>— Transforming Regulatory Knowledge into Trusted Action.</span>
          </div>
          <div className="flex space-x-6">
            <span>© 2026 Pramana Regulatory Intelligence. All rights reserved.</span>
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Use</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
