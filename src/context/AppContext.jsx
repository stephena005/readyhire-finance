import React, { useState, createContext, useContext, useEffect } from 'react';
import { onAuthStateChanged, auth, signOut } from '../firebase';
import { generateQuestionBank as apiGenerateBank, verifySubscription } from '../utils/api';

const Ctx = createContext();

export const useApp = () => useContext(Ctx);

const loadState = (key, fb) => {
    try {
        const s = localStorage.getItem('rh_' + key);
        return s ? JSON.parse(s) : fb;
    } catch { return fb; }
};

const saveState = (key, v) => {
    try {
        localStorage.setItem('rh_' + key, JSON.stringify(v));
    } catch { }
};

export const TIERS = {
    free: { name: 'Free', questionsPerMonth: 3, casesPerMonth: 1, aiFeedback: false, aiPersonalised: false, managerAccess: false, managerSessionsPerMonth: 0 },
    standard: { name: 'Standard', questionsPerMonth: 10, casesPerMonth: 3, aiFeedback: true, aiPersonalised: false, managerAccess: true, managerSessionsPerMonth: 2 },
    pro: { name: 'Pro', questionsPerMonth: Infinity, casesPerMonth: Infinity, aiFeedback: true, aiPersonalised: true, managerAccess: true, managerSessionsPerMonth: Infinity },
};

export const AppProvider = ({ children }) => {
    console.log('AppProvider initializing...');
    const [firebaseUser, setFirebaseUser] = useState(undefined);
    const [user, setUser] = useState(() => {
        const u = loadState('user', null);
        console.log('Initial user state from storage:', u);
        return u;
    });
    const [sub, setSub] = useState(() => loadState('sub', { tier: 'free', usageThisMonth: { questions: 0, cases: 0, managerSessions: 0 }, monthKey: '' }));
    const [cvData, setCvData] = useState(() => loadState('cvData', null));
    const [jobDescription, setJobDescription] = useState(() => loadState('jobDescription', null));
    const [questionBank, setQuestionBank] = useState(() => loadState('questionBank', null));
    const [profile, setProfile] = useState(() => loadState('profile', null));
    const [history, setHistory] = useState(() => {
        const h = loadState('history', []);
        return h.map(e => ({ ...e, date: new Date(e.date) }));
    });
    const [onboarded, setOnboarded] = useState(() => loadState('onboarded', false));
    const [weakAreas, setWeakAreas] = useState(() => loadState('weakAreas', []));
    const [interviewDate, setInterviewDate] = useState(() => loadState('interviewDate', null));
    const [targetCompany, setTargetCompany] = useState(() => loadState('targetCompany', ''));
    const [darkMode, setDarkMode] = useState(() => loadState('darkMode', false));
    const [showShortcuts, setShowShortcuts] = useState(false);

    useEffect(() => { saveState('user', user); }, [user]);
    useEffect(() => { saveState('sub', sub); }, [sub]);
    useEffect(() => { saveState('cvData', cvData); }, [cvData]);
    useEffect(() => { saveState('jobDescription', jobDescription); }, [jobDescription]);
    useEffect(() => { saveState('questionBank', questionBank); }, [questionBank]);
    useEffect(() => { saveState('profile', profile); }, [profile]);
    useEffect(() => { saveState('history', history); }, [history]);
    useEffect(() => { saveState('onboarded', onboarded); }, [onboarded]);
    useEffect(() => { saveState('weakAreas', weakAreas); }, [weakAreas]);
    useEffect(() => { saveState('interviewDate', interviewDate); }, [interviewDate]);
    useEffect(() => { saveState('targetCompany', targetCompany); }, [targetCompany]);
    useEffect(() => { saveState('darkMode', darkMode); }, [darkMode]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setFirebaseUser(u);
            if (u) setUser({ id: u.uid, email: u.email, name: u.displayName || u.email?.split('@')[0] || 'User' });
        });
        return unsub;
    }, []);

    useEffect(() => {
        const m = new Date().toISOString().slice(0, 7);
        if (sub.monthKey !== m) {
            setSub(p => ({ ...p, monthKey: m, usageThisMonth: { questions: 0, cases: 0, managerSessions: 0 } }));
        }
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    const tierConfig = TIERS[sub.tier] || TIERS.free;
    const usage = sub.usageThisMonth || { questions: 0, cases: 0, managerSessions: 0 };

    const canUseQuestion = () => usage.questions < tierConfig.questionsPerMonth;
    const canUseCase = () => usage.cases < tierConfig.casesPerMonth;
    const isPersonalised = () => tierConfig.aiPersonalised;
    const hasFeedback = () => tierConfig.aiFeedback;

    const useQuestion = () => {
        if (!canUseQuestion()) return false;
        setSub(p => ({ ...p, usageThisMonth: { ...p.usageThisMonth, questions: p.usageThisMonth.questions + 1 } }));
        return true;
    };

    const useCase = () => {
        if (!canUseCase()) return false;
        setSub(p => ({ ...p, usageThisMonth: { ...p.usageThisMonth, cases: p.usageThisMonth.cases + 1 } }));
        return true;
    };

    const questionsLeft = () => tierConfig.questionsPerMonth === Infinity ? '∞' : Math.max(0, tierConfig.questionsPerMonth - usage.questions);
    const casesLeft = () => tierConfig.casesPerMonth === Infinity ? '∞' : Math.max(0, tierConfig.casesPerMonth - usage.cases);

    const login = (u) => setUser(u);
    const logout = async () => {
        try { await signOut(auth); } catch { }
        setUser(null);
        setProfile(null);
        setHistory([]);
        setOnboarded(false);
        setCvData(null);
        setJobDescription(null);
        setQuestionBank(null);
        ['user', 'sub', 'profile', 'history', 'onboarded', 'weakAreas', 'interviewDate', 'targetCompany', 'cvData', 'jobDescription', 'questionBank'].forEach(k => localStorage.removeItem('rh_' + k));
        setSub({ tier: 'free', usageThisMonth: { questions: 0, cases: 0, managerSessions: 0 }, monthKey: '' });
        setWeakAreas([]);
        setInterviewDate(null);
        setTargetCompany('');
    };

    const checkSubscription = async () => {
        if (!user?.email) return;
        const d = await verifySubscription(user.email);
        if (d?.tier && d.tier !== sub.tier) setSub(p => ({ ...p, tier: d.tier }));
    };

    useEffect(() => {
        if (user?.email) checkSubscription();
    }, [user?.email]);

    const resetProfile = () => {
        setProfile(null);
        setCvData(null);
        setJobDescription(null);
        setQuestionBank(null);
    };

    const addHistory = (e) => {
        const entry = { ...e, id: Date.now(), date: new Date() };
        setHistory(p => [entry, ...p].slice(0, 50));
        if (e.feedback?.missing) {
            setWeakAreas(prev => {
                const u = [...prev];
                e.feedback.missing.forEach(m => {
                    const i = u.findIndex(w => w.area === m);
                    if (i >= 0) u[i].count++; else u.push({ area: m, count: 1 });
                });
                return u.sort((a, b) => b.count - a.count).slice(0, 10);
            });
        }
    };

    const getScore = () => {
        if (!history.length) return 0;
        const avg = history.slice(0, 10).reduce((a, h) => a + h.score, 0) / Math.min(history.length, 10);
        return Math.min(Math.round(avg * 0.7 + Math.min(history.length * 2, 20)), 100);
    };

    const getStreak = () => {
        if (!history.length) return 0;
        let s = 1;
        for (let i = 1; i < Math.min(history.length, 7); i++) {
            if ((new Date(history[i - 1].date) - new Date(history[i].date)) / 86400000 <= 1) s++;
            else break;
        }
        return s;
    };

    return (
        <Ctx.Provider value={{
            firebaseUser, user, login, logout, sub, setSub, tierConfig, usage,
            canUseQuestion, canUseCase, isPersonalised, hasFeedback, useQuestion,
            useCase, questionsLeft, casesLeft, checkSubscription, cvData, setCvData,
            jobDescription, setJobDescription, questionBank, setQuestionBank, profile,
            setProfile, resetProfile, history, addHistory, getScore, getStreak,
            onboarded, setOnboarded, weakAreas, interviewDate, setInterviewDate,
            targetCompany, setTargetCompany, darkMode, setDarkMode, showShortcuts,
            setShowShortcuts
        }}>
            {children}
        </Ctx.Provider>
    );
};
