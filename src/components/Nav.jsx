import React, { useState, useEffect } from 'react';
import { Home, BarChart3, Mic, BookOpen, CreditCard, Sun, Moon, Zap, TrendingUp, Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ShortcutsModal } from './Common';

export const Nav = ({ page, setPage }) => {
    const { sub, user, logout, questionsLeft, darkMode, setDarkMode, setShowShortcuts, tierConfig } = useApp();
    const [open, setOpen] = useState(false);
    const [um, setUm] = useState(false);

    const items = [
        { id: 'home', l: 'Home', i: Home },
        { id: 'dash', l: 'Dashboard', i: BarChart3 },
        { id: 'sim', l: 'Practice', i: Mic },
        { id: 'cases', l: 'Cases', i: BookOpen },
        { id: 'price', l: 'Pricing', i: CreditCard }
    ];

    useEffect(() => {
        const h = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'd' || e.key === 'D') setDarkMode(d => !d);
            if (e.key === '?') setShowShortcuts(true);
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [setDarkMode, setShowShortcuts]);

    return (
        <>
            <nav className={'sticky top-0 z-50 backdrop-blur-xl border-b ' + (darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100')}>
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('home')}>
                        <div className="w-10 h-10 rounded-2xl premium-gradient flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight hidden sm:block">Ready<span className="text-indigo-500">Hire</span></span>
                    </div>

                    <div className="hidden md:flex gap-1">
                        {items.map(i => (
                            <button key={i.id} onClick={() => setPage(i.id)} className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ' + (page === i.id ? (darkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-700') : 'opacity-70 hover:opacity-100')}>
                                <i.i className="w-4 h-4" />{i.l}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setDarkMode(d => !d)} className={'p-2 rounded-lg ' + (darkMode ? 'text-yellow-400' : 'text-slate-500')} aria-label="Toggle dark mode">
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>

                        <div className={'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm ' + (darkMode ? 'bg-slate-800' : 'bg-slate-100')}>
                            <Zap className="w-4 h-4 text-indigo-500" />{questionsLeft()}
                            <span className={'text-[10px] px-1.5 py-0.5 rounded-full font-bold ' + (sub.tier === 'pro' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' : sub.tier === 'standard' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400')}>
                                {tierConfig.name}
                            </span>
                        </div>

                        <div className="relative">
                            <button onClick={() => setUm(!um)} className={'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ' + (darkMode ? 'bg-indigo-900 text-indigo-400' : 'bg-indigo-100 text-indigo-600')} aria-label="Profile options">
                                {user?.name?.[0]?.toUpperCase()}
                            </button>
                            {um && (
                                <div className={'absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg border py-2 z-50 ' + (darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white')}>
                                    <div className={'px-4 py-2 border-b ' + (darkMode ? 'border-slate-700' : '')}>
                                        <p className="font-medium text-sm truncate">{user?.name}</p>
                                        <p className="text-xs opacity-50 truncate">{user?.email}</p>
                                    </div>
                                    <button onClick={() => { setPage('setup'); setUm(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700">New Application</button>
                                    <button onClick={() => { setPage('price'); setUm(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700">Subscription</button>
                                    <button onClick={() => { logout(); setUm(false); }} className="w-full px-4 py-2 text-left text-sm text-red-500">Sign Out</button>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setOpen(!open)} className="md:hidden p-2" aria-label="Menu">
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {open && (
                    <div className={'md:hidden py-2 px-4 border-t ' + (darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white')}>
                        {items.map(i => (
                            <button key={i.id} onClick={() => { setPage(i.id); setOpen(false); }} className={'flex items-center gap-2 w-full px-3 py-2 rounded-lg ' + (page === i.id ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600' : '')}>
                                <i.i className="w-4 h-4" />{i.l}
                            </button>
                        ))}
                    </div>
                )}
            </nav>
            <ShortcutsModal />
        </>
    );
};
