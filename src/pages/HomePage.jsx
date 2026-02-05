import React from 'react';
import { Briefcase, Sparkles, FileText, TrendingUp, ArrowRight, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/Common';

export const HomePage = ({ setPage, onSignup }) => {
    const { user, profile, darkMode } = useApp();

    return (
        <div className="space-y-20 py-12 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

            <section className="text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 glass animate-float">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    CV-Powered AI Interview Coach
                </div>
                <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-[1.1]">
                    Ace Your Finance <br />
                    <span className="text-transparent bg-clip-text premium-gradient">Interview</span>
                </h1>
                <p className="text-xl md:text-2xl opacity-60 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                    Upload your CV. Paste the job description. Get AI questions tailored to your exact experience and target role.
                </p>

                {user ? (
                    <button onClick={() => setPage(profile ? 'dash' : 'setup')} className="px-10 py-5 rounded-3xl premium-gradient text-white font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-indigo-500/40">
                        {profile ? 'Enter Dashboard' : 'Set Up Profile'} <ArrowRight className="w-6 h-6 inline ml-2" />
                    </button>
                ) : (
                    <button onClick={onSignup} className="px-10 py-5 rounded-3xl premium-gradient text-white font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-indigo-500/40">
                        Start Free — 3 Questions Included <ArrowRight className="w-6 h-6 inline ml-2" />
                    </button>
                )}
            </section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {[{ n: '32', l: 'Finance Roles', i: Briefcase }, { n: 'AI', l: 'Personalised Qs', i: Sparkles }, { n: 'CV', l: 'Smart Profiling', i: FileText }, { n: '5', l: 'Career Levels', i: TrendingUp }].map((s, i) => (
                    <Card key={i} hover={false} className="p-4 text-center">
                        <s.i className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                        <p className="text-2xl font-black">{s.n}</p>
                        <p className="text-xs opacity-50">{s.l}</p>
                    </Card>
                ))}
            </section>

            <section className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-black text-center mb-10">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {[{ icon: Upload, title: 'Upload Your CV', desc: 'AI extracts your experience and skills in seconds' }, { icon: FileText, title: 'Add Job Description', desc: 'Paste the JD or select a role for targeted prep' }, { icon: Sparkles, title: 'Practice with AI', desc: 'Personalised questions, real-time feedback, readiness score' }].map((s, i) => (
                        <Card key={i} hover={false} className="p-6 text-center">
                            <div className={'w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ' + (darkMode ? 'bg-indigo-900/50' : 'bg-indigo-50')}>
                                <s.icon className="w-6 h-6 text-indigo-500" />
                            </div>
                            <h3 className="font-bold mb-2">{s.title}</h3>
                            <p className="text-sm opacity-60">{s.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
};
