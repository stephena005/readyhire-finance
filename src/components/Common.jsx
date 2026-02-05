import React, { useRef, useEffect } from 'react';
import { X, Mic, Square, Play, Timer } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Card = ({ children, className = '', onClick, hover = true, variant = 'default' }) => {
    const { darkMode } = useApp();
    const st = {
        default: (darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-slate-200/50') + ' backdrop-blur-sm',
        glass: 'glass-card',
        premium: 'premium-gradient text-white border-0'
    };
    return (
        <div
            onClick={onClick}
            className={(st[variant] || st.default) + ' rounded-3xl border shadow-sm ' + (hover ? 'hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer ' : '') + className}
        >
            {children}
        </div>
    );
};

export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
    const { darkMode } = useApp();
    const ref = useRef(null);
    useEffect(() => { if (open && ref.current) ref.current.focus(); }, [open]);
    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [open, onClose]);
    if (!open) return null;
    const w = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()} className={w + ' w-full rounded-3xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl ' + (darkMode ? 'bg-slate-800' : 'bg-white')}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <button onClick={onClose} aria-label="Close dialog" className="p-1.5 rounded-lg opacity-50 hover:opacity-100"><X className="w-5 h-5" /></button>
                </div>
                {children}
            </div>
        </div>
    );
};

export const ConfirmModal = ({ open, onClose, onConfirm, title, message }) => (
    <Modal open={open} onClose={onClose} title={title} size="sm">
        <p className="mb-6 opacity-70">{message}</p>
        <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-medium">Cancel</button>
            <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-medium">Confirm</button>
        </div>
    </Modal>
);

const SHORTCUTS = [{ key: 'N', desc: 'Next question' }, { key: 'D', desc: 'Dark mode' }, { key: '?', desc: 'Shortcuts' }, { key: 'Esc', desc: 'Close modal' }];

export const ShortcutsModal = () => {
    const { showShortcuts, setShowShortcuts, darkMode } = useApp();
    return (
        <Modal open={showShortcuts} onClose={() => setShowShortcuts(false)} title="Keyboard Shortcuts" size="sm">
            <div className="space-y-2">
                {SHORTCUTS.map((s, i) => (
                    <div key={i} className="flex justify-between p-2">
                        <span className="opacity-70">{s.desc}</span>
                        <kbd className={'px-2 py-1 rounded ' + (darkMode ? 'bg-slate-700' : 'bg-slate-100') + ' font-mono text-sm'}>{s.key}</kbd>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

export const AudioRecorder = ({ onRecordingComplete }) => {
    const { darkMode } = useApp();
    const [recording, setRecording] = React.useState(false);
    const [audioURL, setAudioURL] = React.useState(null);
    const [duration, setDuration] = React.useState(0);
    const mediaRef = useRef(null);
    const audioRef = useRef(null);
    const timerRef = useRef(null);
    const start = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRef.current = new MediaRecorder(stream);
            const chunks = [];
            mediaRef.current.ondataavailable = e => chunks.push(e.data);
            mediaRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/wav' });
                setAudioURL(URL.createObjectURL(blob));
                onRecordingComplete?.(blob);
                stream.getTracks().forEach(t => t.stop());
            };
            mediaRef.current.start();
            setRecording(true);
            setDuration(0);
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        } catch {
            alert('Microphone access required');
        }
    };
    const stop = () => {
        if (mediaRef.current && recording) {
            mediaRef.current.stop();
            setRecording(false);
            clearInterval(timerRef.current);
        }
    };
    const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    return (
        <div className={'p-4 rounded-xl ' + (darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50')}>
            <h4 className="font-medium flex items-center gap-2 mb-3"><Mic className="w-4 h-4 text-indigo-500" />Voice Practice</h4>
            {!audioURL ? (
                <div className="flex items-center gap-4">
                    <button onClick={recording ? stop : start} className={'flex items-center gap-2 px-4 py-2 rounded-xl font-medium ' + (recording ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white')}>
                        {recording ? <><Square className="w-4 h-4" />Stop</> : <><Mic className="w-4 h-4" />Record</>}
                    </button>
                    {recording && <span className="font-mono">{fmt(duration)}</span>}
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <audio ref={audioRef} src={audioURL} />
                    <button onClick={() => audioRef.current?.play()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium"><Play className="w-4 h-4" />Play</button>
                    <span className="text-sm">{fmt(duration)}</span>
                    <button onClick={() => { setAudioURL(null); setDuration(0); }} className="text-sm opacity-60 ml-auto">Again</button>
                </div>
            )}
        </div>
    );
};

export const PressureTimer = ({ duration = 180, onTimeUp, enabled }) => {
    const [time, setTime] = React.useState(duration);
    const { darkMode } = useApp();
    useEffect(() => {
        if (!enabled) return;
        const i = setInterval(() => setTime(t => {
            if (t <= 1) { clearInterval(i); onTimeUp?.(); return 0; }
            return t - 1;
        }), 1000);
        return () => clearInterval(i);
    }, [enabled]);
    const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    return (
        <div className={'flex items-center justify-center gap-2 p-3 rounded-xl transition-all ' + (time < 30 ? 'bg-red-500 text-white animate-pulse' : time < 60 ? 'bg-amber-100 text-amber-700' : darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-700')}>
            <Timer className={'w-5 h-5 ' + (time < 30 ? 'animate-spin' : '')} />
            <span className="font-mono text-lg font-bold">{fmt(time)}</span>
        </div>
    );
};
