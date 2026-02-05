import React, { useState } from 'react';
import { Flame, Zap, Mic, BookOpen, Download, Target, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, ConfirmModal, Modal } from '../components/Common';
import { exportProgress } from '../utils/api';

export const DashPage = ({ setPage }) => {
    const { profile, history, getScore, getStreak, weakAreas, resetProfile, darkMode, questionBank, questionsLeft, casesLeft, tierConfig, sub } = useApp();
    const [showReset, setShowReset] = useState(false);
    const [review, setReview] = useState(null);

    if (!profile) return (
        <div className="text-center py-12">
            <button onClick={() => setPage('setup')} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold">Set Up Profile</button>
        </div>
    );

    const score = getScore();

    return (
        <div className="space-y-4">
            <Card hover={false} className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold">{profile.currentRole}</p>
                        <p className="text-sm opacity-60">{profile.currentCompany}{profile.targetCompany ? ' → ' + profile.targetCompany : ''}</p>
                        <p className="text-xs text-indigo-500 font-medium mt-1">Target: {profile.targetRole}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setPage('setup')} className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (darkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-700')}>New Application</button>
                        <button onClick={() => setShowReset(true)} className="text-xs opacity-40">Reset</button>
                    </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
                <Card hover={false} variant="glass" className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-16 h-16">
                            <svg className="transform -rotate-90" width="64" height="64">
                                <circle cx="32" cy="32" r="28" strokeWidth="6" stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'} fill="none" />
                                <circle cx="32" cy="32" r="28" strokeWidth="6" stroke={score >= 70 ? '#10b981' : '#f59e0b'} fill="none" strokeLinecap="round" strokeDasharray={176} strokeDashoffset={176 - (score / 100) * 176} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-black text-xl">{score}</div>
                        </div>
                        <div>
                            <p className="font-extrabold text-sm uppercase tracking-wide opacity-50">Readiness</p>
                            <p className="text-xs font-bold">{history.length} sessions</p>
                            {getStreak() > 0 && <p className="text-xs text-amber-500 font-bold flex items-center gap-1 mt-1"><Flame className="w-3 h-3" />{getStreak()} day streak</p>}
                        </div>
                    </div>
                </Card>

                <Card hover={false} className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-indigo-500" />This Month</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span>Questions</span><span className="font-bold">{questionsLeft()} left</span></div>
                        <div className="flex justify-between text-sm"><span>Cases</span><span className="font-bold">{casesLeft()} left</span></div>
                        <div className="flex justify-between text-sm"><span>Plan</span><span className={'font-bold ' + (sub.tier === 'pro' ? 'text-purple-500' : sub.tier === 'standard' ? 'text-indigo-500' : '')}>{tierConfig.name}</span></div>
                    </div>
                    {sub.tier === 'free' && <button onClick={() => setPage('price')} className="w-full mt-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium">Upgrade</button>}
                </Card>

                <Card hover={false} className="p-4">
                    <h3 className="font-semibold mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                        <button onClick={() => setPage('sim')} className={'w-full p-2 rounded-lg text-sm flex items-center gap-2 ' + (darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-700')}><Mic className="w-4 h-4" />Practice</button>
                        <button onClick={() => setPage('cases')} className={'w-full p-2 rounded-lg text-sm flex items-center gap-2 ' + (darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-700')}><BookOpen className="w-4 h-4" />Cases</button>
                        <button onClick={() => exportProgress(history, profile, score, weakAreas)} className={'w-full p-2 rounded-lg text-sm flex items-center gap-2 ' + (darkMode ? 'bg-slate-700' : 'bg-slate-100')}><Download className="w-4 h-4" />Export</button>
                    </div>
                </Card>
            </div>

            {weakAreas.length > 0 && (
                <Card hover={false} className="p-4">
                    <h3 className="font-semibold mb-2"><Target className="w-4 h-4 text-amber-500 inline mr-2" />Improve</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {weakAreas.slice(0, 6).map((w, i) => (
                            <div key={i} className={'p-2 rounded-lg text-sm ' + (darkMode ? 'bg-amber-900/20' : 'bg-amber-50')}>
                                <span className="text-amber-600 font-medium">{w.area}</span>
                                <span className="text-xs opacity-50 ml-2">({w.count}x)</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {history.length > 0 ? (
                <Card hover={false} className="p-4">
                    <h3 className="font-semibold mb-3">Recent</h3>
                    <div className="space-y-2">
                        {history.slice(0, 5).map(h => (
                            <div key={h.id} onClick={() => setReview(h)} className={'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ' + (darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-50 hover:bg-indigo-50')}>
                                <div className={'w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ' + (h.score >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-amber-100 text-amber-700')}>{h.score}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{h.title}</p>
                                    <p className="text-xs opacity-60">{h.date.toLocaleDateString()}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 opacity-40" />
                            </div>
                        ))}
                    </div>
                </Card>
            ) : (
                <Card hover={false} className="p-6 text-center">
                    <BookOpen className="w-8 h-8 text-indigo-300 mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">Ready to practice?</h3>
                    <p className="text-sm opacity-50 mb-4">{questionBank ? (questionBank.questions?.length || 0) + ' questions waiting' : 'Complete profile first'}</p>
                    <button onClick={() => setPage('sim')} className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">Start</button>
                </Card>
            )}

            <ConfirmModal open={showReset} onClose={() => setShowReset(false)} onConfirm={() => { resetProfile(); setShowReset(false); setPage('setup'); }} title="New Application?" message="Clears profile and question bank. History kept." />

            {review && (
                <Modal open={!!review} onClose={() => setReview(null)} title="Session Review" size="lg">
                    <div className="space-y-4">
                        <div className={'flex items-center gap-4 p-4 rounded-xl ' + (darkMode ? 'bg-slate-700' : 'bg-slate-50')}>
                            <div className={'w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ' + (review.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{review.score}</div>
                            <div>
                                <p className="font-semibold">{review.title}</p>
                                <p className="text-sm opacity-60">{review.date.toLocaleDateString()}</p>
                            </div>
                        </div>
                        {review.question && <div className={'p-3 rounded-xl ' + (darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50')}><p className="text-xs text-indigo-500 mb-1">Question</p><p className="text-sm">{review.question}</p></div>}
                        {review.answer && <div className={'p-3 rounded-xl ' + (darkMode ? 'bg-slate-700' : 'bg-slate-50')}><p className="text-xs opacity-60 mb-1">Your Answer</p><p className="text-sm">{review.answer}</p></div>}
                        {review.feedback && (
                            <div className="space-y-2">
                                {review.feedback.strengths?.map((s, i) => <div key={i} className={'p-2 rounded-lg text-sm ' + (darkMode ? 'bg-green-900/20' : 'bg-green-50')}><span className="text-green-600 font-medium">{s.t}: </span><span className="opacity-70">{s.d}</span></div>)}
                                {review.feedback.improvements?.map((s, i) => <div key={i} className={'p-2 rounded-lg text-sm ' + (darkMode ? 'bg-amber-900/20' : 'bg-amber-50')}><span className="text-amber-600 font-medium">{s.t}: </span><span className="opacity-70">{s.d}</span></div>)}
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};
