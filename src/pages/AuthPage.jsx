import React, { useState } from 'react';
import { TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react';
import { auth, googleProvider, appleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '../firebase';
import { useApp } from '../context/AppContext';

const AppleIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>;
const GoogleIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>;

export const AuthPage = () => {
    const { darkMode, login } = useApp();
    const [mode, setMode] = useState('signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPw, setShowPw] = useState(false);

    const handleGoogle = async () => {
        setLoading(true);
        setError('');
        try {
            const r = await signInWithPopup(auth, googleProvider);
            login({ id: r.user.uid, email: r.user.email, name: r.user.displayName || r.user.email?.split('@')[0] });
        } catch (e) {
            setError(e.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled' : 'Google sign-in failed.');
        }
        setLoading(false);
    };

    const handleApple = async () => {
        setLoading(true);
        setError('');
        try {
            const r = await signInWithPopup(auth, appleProvider);
            login({ id: r.user.uid, email: r.user.email, name: r.user.displayName || r.user.email?.split('@')[0] });
        } catch (e) {
            setError(e.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled' : 'Apple sign-in failed.');
        }
        setLoading(false);
    };

    const handleEmail = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError('Valid email required');
        if (password.length < 6) return setError('Password must be 6+ characters');
        if (mode === 'signup' && !name.trim()) return setError('Name required');
        setLoading(true);
        try {
            if (mode === 'signup') {
                const r = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(r.user, { displayName: name.trim() });
                login({ id: r.user.uid, email: r.user.email, name: name.trim() });
            } else {
                const r = await signInWithEmailAndPassword(auth, email, password);
                login({ id: r.user.uid, email: r.user.email, name: r.user.displayName || r.user.email?.split('@')[0] });
            }
        } catch (e) {
            const msgs = {
                'auth/email-already-in-use': 'Email taken. Try signing in.',
                'auth/invalid-credential': 'Wrong email or password.',
                'auth/user-not-found': 'No account found.',
                'auth/wrong-password': 'Wrong password.'
            };
            setError(msgs[e.code] || 'Something went wrong.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-sm w-full space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl premium-gradient flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/40">
                        <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black">Ready<span className="text-indigo-500">Hire</span></h1>
                    <p className="text-sm opacity-60 mt-1">AI-Powered Finance Interview Coach</p>
                </div>
                <div className="space-y-3">
                    <button onClick={handleGoogle} disabled={loading} className={'w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 font-medium transition-all ' + (darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50')}><GoogleIcon />Continue with Google</button>
                    <button onClick={handleApple} disabled={loading} className={'w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 font-medium transition-all ' + (darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50')}><AppleIcon />Continue with Apple</button>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className={'w-full border-t ' + (darkMode ? 'border-slate-700' : '')} /></div>
                    <div className="relative flex justify-center text-sm"><span className={'px-4 ' + (darkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500')}>or</span></div>
                </div>
                <form onSubmit={handleEmail} className="space-y-3">
                    {mode === 'signup' && <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" autoComplete="name" aria-label="Full name" className={'w-full px-4 py-3 rounded-xl border ' + (darkMode ? 'bg-slate-800 border-slate-600' : '')} />}
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" autoComplete="email" aria-label="Email" className={'w-full px-4 py-3 rounded-xl border ' + (darkMode ? 'bg-slate-800 border-slate-600' : '')} />
                    <div className="relative">
                        <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} aria-label="Password" className={'w-full px-4 py-3 rounded-xl border pr-12 ' + (darkMode ? 'bg-slate-800 border-slate-600' : '')} />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50">{showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold disabled:opacity-50">{loading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : mode === 'signup' ? 'Create Account' : 'Sign In'}</button>
                </form>
                <p className="text-center text-sm opacity-60">
                    {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                    <button onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }} className="text-indigo-500 font-medium">{mode === 'signup' ? 'Sign in' : 'Sign up'}</button>
                </p>
                <p className="text-xs text-center opacity-40">Data stored locally. No credit card required.</p>
            </div>
        </div>
    );
};
