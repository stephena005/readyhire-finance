import React, { useState } from 'react';
import { Mic, Shuffle, Timer, Loader2, ChevronRight, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, AudioRecorder, PressureTimer } from '../components/Common';
import { getAIFeedback } from '../utils/api';

export const SimPage = ({ setPage }) => {
    const { questionBank, profile, darkMode, addHistory, useQuestion, canUseQuestion, hasFeedback } = useApp();
    const [qIndex, setQIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showModel, setShowModel] = useState(false);
    const [showTimer, setShowTimer] = useState(false);

    if (!questionBank?.questions?.length) return (
        <div className="text-center py-16">
            <Mic className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No questions yet</h2>
            <p className="opacity-60 mb-6">Set up your profile first to generate personalised questions</p>
            <button onClick={() => setPage('setup')} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold">Set Up Profile</button>
        </div>
    );

    const questions = questionBank.questions;
    const q = questions[qIndex];
    if (!q) return null;

    const handleSubmit = async () => {
        if (!answer.trim() || answer.trim().length < 20) return;
        if (!canUseQuestion()) return;

        useQuestion();
        setSubmitted(true);
        setLoading(true);

        const fb = await getAIFeedback(q, answer, profile?.targetRole);
        setFeedback(fb);

        addHistory({
            title: q.q?.slice(0, 60) || 'Practice',
            score: fb.score,
            type: 'question',
            question: q.q,
            answer,
            feedback: fb
        });
        setLoading(false);
    };

    const handleNext = () => {
        setQIndex(i => (i + 1) % questions.length);
        setAnswer('');
        setSubmitted(false);
        setFeedback(null);
        setShowModel(false);
    };

    const handleShuffle = () => {
        setQIndex(Math.floor(Math.random() * questions.length));
        setAnswer('');
        setSubmitted(false);
        setFeedback(null);
        setShowModel(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs opacity-50 uppercase tracking-wide font-bold">Question {qIndex + 1} of {questions.length}</p>
                    <div className="flex gap-1 mt-1">
                        {questions.map((_, i) => <div key={i} className={'w-2 h-2 rounded-full ' + (i === qIndex ? 'bg-indigo-500' : i < qIndex ? 'bg-green-400' : darkMode ? 'bg-slate-700' : 'bg-slate-200')} />)}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleShuffle} className={'p-2 rounded-lg ' + (darkMode ? 'bg-slate-700' : 'bg-slate-100')} aria-label="Shuffle"><Shuffle className="w-4 h-4" /></button>
                    <button onClick={() => setShowTimer(!showTimer)} className={'p-2 rounded-lg ' + (showTimer ? 'bg-indigo-600 text-white' : darkMode ? 'bg-slate-700' : 'bg-slate-100')} aria-label="Timer"><Timer className="w-4 h-4" /></button>
                </div>
            </div>

            {showTimer && <PressureTimer duration={180} enabled={!submitted} onTimeUp={() => { if (!submitted && answer.trim().length >= 20) handleSubmit(); }} />}

            <Card hover={false} className="p-6">
                <div className="flex items-center gap-2 mb-3">
                    {q.cat && <span className={'text-xs px-2.5 py-1 rounded-full font-medium ' + (darkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-700')}>{q.cat}</span>}
                    {q.difficulty && <span className={'text-xs px-2.5 py-1 rounded-full ' + (q.difficulty === 'advanced' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' : q.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')}>{q.difficulty}</span>}
                    {q.type && <span className="text-xs opacity-50">{q.type}</span>}
                </div>
                <h2 className="text-lg font-bold mb-4">{q.q}</h2>
                {q.context && <p className="text-sm opacity-60 mb-4 italic">{q.context}</p>}

                {!submitted ? (
                    <>
                        <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer here... (minimum 20 characters)" className={'w-full h-40 p-4 rounded-xl border resize-none text-sm ' + (darkMode ? 'bg-slate-700 border-slate-600' : '')} />
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-xs opacity-40">{answer.length} chars{!canUseQuestion() ? ' • No questions left this month' : ''}</p>
                            <button onClick={handleSubmit} disabled={answer.trim().length < 20 || loading || !canUseQuestion()} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold disabled:opacity-50">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit'}
                            </button>
                        </div>
                        <AudioRecorder />
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className={'p-4 rounded-xl ' + (darkMode ? 'bg-slate-700' : 'bg-slate-50')}>
                            <p className="text-xs opacity-50 mb-1">Your Answer</p>
                            <p className="text-sm">{answer}</p>
                        </div>
                        {loading ? (
                            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                                <p className="text-sm opacity-60 mt-2">Analysing...</p>
                            </div>
                        ) : feedback && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    <div className={'w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl ' + (feedback.score >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-amber-100 text-amber-700')}>{feedback.score}</div>
                                    <div>
                                        <p className="font-bold">{feedback.score >= 80 ? 'Excellent!' : feedback.score >= 60 ? 'Good effort' : 'Needs work'}</p>
                                        <p className="text-sm opacity-60">{feedback.summary}</p>
                                    </div>
                                </div>
                                {feedback.strengths?.map((s, i) => <div key={i} className={'p-3 rounded-xl ' + (darkMode ? 'bg-green-900/20' : 'bg-green-50')}><p className="text-sm"><span className="text-green-600 font-semibold">{s.t}</span> — {s.d}</p></div>)}
                                {feedback.improvements?.map((s, i) => <div key={i} className={'p-3 rounded-xl ' + (darkMode ? 'bg-amber-900/20' : 'bg-amber-50')}><p className="text-sm"><span className="text-amber-600 font-semibold">{s.t}</span> — {s.d}</p></div>)}
                                {!hasFeedback() && <div className={'p-3 rounded-xl text-sm ' + (darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50')}><Lock className="w-4 h-4 inline mr-1 text-indigo-500" />Upgrade to Standard (£9/mo) for detailed AI feedback.</div>}

                                <button onClick={() => setShowModel(!showModel)} className="text-sm text-indigo-500 font-medium">{showModel ? 'Hide' : 'Show'} Model Answer</button>
                                {showModel && q.m && <div className={'p-3 rounded-xl ' + (darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50')}><p className="text-xs text-indigo-500 mb-1">Model Answer</p><p className="text-sm">{q.m}</p></div>}
                                {q.direction && <div className={'p-3 rounded-xl ' + (darkMode ? 'bg-slate-700' : 'bg-slate-50')}><p className="text-xs opacity-50 mb-1">Structuring Advice</p><p className="text-sm">{q.direction}</p></div>}
                                {q.tips && <div className={'p-3 rounded-xl ' + (darkMode ? 'bg-purple-900/20' : 'bg-purple-50')}><p className="text-xs text-purple-500 mb-1">Expert Tip</p><p className="text-sm">{q.tips}</p></div>}
                            </div>
                        )}
                        <div className="flex gap-3 pt-2">
                            <button onClick={handleNext} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold flex items-center justify-center gap-2">Next Question <ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};
