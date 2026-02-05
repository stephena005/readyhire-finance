import React, { useState } from 'react';
import { BookOpen, Timer, Loader2, ChevronRight, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/Common';
import { getAIFeedback } from '../utils/api';

export const CasesPage = ({ setPage }) => {
    const { questionBank, profile, darkMode, addHistory, useCase, canUseCase, hasFeedback } = useApp();
    const [cIndex, setCIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showModel, setShowModel] = useState(false);

    if (!questionBank?.cases?.length) return (
        <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-purple-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No case studies yet</h2>
            <p className="opacity-60 mb-6">Set up your profile to generate case studies</p>
            <button onClick={() => setPage('setup')} className="px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold">Set Up Profile</button>
        </div>
    );

    const cases = questionBank.cases;
    const c = cases[cIndex];
    if (!c) return null;

    const handleSubmit = async () => {
        if (!answer.trim() || answer.trim().length < 30) return;
        if (!canUseCase()) return;

        useCase();
        setSubmitted(true);
        setLoading(true);

        const q = { q: c.t + ': ' + c.task, keys: c.criteria || [], m: c.m || '' };
        const fb = await getAIFeedback(q, answer, 'Case study: ' + c.s);

        setFeedback(fb);
        addHistory({
            title: c.t || 'Case Study',
            score: fb.score,
            type: 'case',
            question: c.task,
            answer,
            feedback: fb
        });
        setLoading(false);
    };

    const handleNext = () => {
        setCIndex(i => (i + 1) % cases.length);
        setAnswer('');
        setSubmitted(false);
        setFeedback(null);
        setShowModel(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs opacity-50 uppercase tracking-wide font-bold">Case {cIndex + 1} of {cases.length}</p>
                <div className="flex gap-1">
                    {cases.map((_, i) => <div key={i} className={'w-2 h-2 rounded-full ' + (i === cIndex ? 'bg-purple-500' : darkMode ? 'bg-slate-700' : 'bg-slate-200')} />)}
                </div>
            </div>

            <Card hover={false} className="p-6">
                <div className="flex items-center gap-2 mb-3">
                    {c.cat && <span className={'text-xs px-2.5 py-1 rounded-full font-medium ' + (darkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-700')}>{c.cat}</span>}
                    {c.d && <span className={'text-xs px-2.5 py-1 rounded-full ' + (c.d === 'advanced' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>{c.d}</span>}
                    {c.time && <span className="text-xs opacity-50 flex items-center gap-1"><Timer className="w-3 h-3" />{c.time}min</span>}
                </div>
                <h2 className="text-lg font-bold mb-3">{c.t}</h2>
                <p className="text-sm opacity-70 mb-3">{c.s}</p>
                {c.context && <p className="text-sm opacity-60 mb-4 italic">{c.context}</p>}

                <div className={'p-3 rounded-xl mb-4 ' + (darkMode ? 'bg-purple-900/20' : 'bg-purple-50')}>
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">Task</p>
                    <p className="text-sm mt-1">{c.task}</p>
                </div>

                {!submitted ? (
                    <>
                        <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Write your detailed response... (minimum 30 characters)" className={'w-full h-56 p-4 rounded-xl border resize-none text-sm ' + (darkMode ? 'bg-slate-700 border-slate-600' : '')} />
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-xs opacity-40">{answer.length} chars{!canUseCase() ? ' • No cases left this month' : ''}</p>
                            <button onClick={handleSubmit} disabled={answer.trim().length < 30 || loading || !canUseCase()} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold disabled:opacity-50">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className={'p-4 rounded-xl ' + (darkMode ? 'bg-slate-700' : 'bg-slate-50')}>
                            <p className="text-xs opacity-50 mb-1">Your Answer</p>
                            <p className="text-sm whitespace-pre-wrap">{answer}</p>
                        </div>
                        {loading ? (
                            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
                            </div>
                        ) : feedback && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    <div className={'w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl ' + (feedback.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{feedback.score}</div>
                                    <div>
                                        <p className="font-bold">{feedback.score >= 80 ? 'Strong!' : feedback.score >= 60 ? 'Decent' : 'Needs depth'}</p>
                                        <p className="text-sm opacity-60">{feedback.summary}</p>
                                    </div>
                                </div>
                                {feedback.strengths?.map((s, i) => <div key={i} className={'p-3 rounded-xl ' + (darkMode ? 'bg-green-900/20' : 'bg-green-50')}><p className="text-sm"><span className="text-green-600 font-semibold">{s.t}</span> — {s.d}</p></div>)}
                                {feedback.improvements?.map((s, i) => <div key={i} className={'p-3 rounded-xl ' + (darkMode ? 'bg-amber-900/20' : 'bg-amber-50')}><p className="text-sm"><span className="text-amber-600 font-semibold">{s.t}</span> — {s.d}</p></div>)}

                                <button onClick={() => setShowModel(!showModel)} className="text-sm text-purple-500 font-medium">{showModel ? 'Hide' : 'Show'} Model Answer</button>
                                {showModel && c.m && <div className={'p-3 rounded-xl ' + (darkMode ? 'bg-purple-900/30' : 'bg-purple-50')}><p className="text-xs text-purple-500 mb-1">Model Approach</p><p className="text-sm">{c.m}</p></div>}
                            </div>
                        )}
                        <button onClick={handleNext} className="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold flex items-center justify-center gap-2">Next Case <ChevronRight className="w-4 h-4" /></button>
                    </div>
                )}
            </Card>
        </div>
    );
};
