import React, { useState, useRef } from 'react';
import { FileText, Upload, ChevronLeft, Lock, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/Common';
import { extractPDFText } from '../utils/pdf';
import { parseCVText, generateQuestionBank } from '../utils/api';

const ROLES = [
    { id: 1, t: 'Assistant Accountant', l: 1, c: 'Accounting' }, { id: 2, t: 'Assistant Management Accountant', l: 1, c: 'Management Accounting' }, { id: 3, t: 'Junior Financial Accountant', l: 1, c: 'Accounting' }, { id: 4, t: 'Finance Analyst', l: 1, c: 'FP&A' }, { id: 5, t: 'FP&A Analyst', l: 1, c: 'FP&A' }, { id: 6, t: 'Commercial Finance Analyst', l: 1, c: 'Commercial' }, { id: 7, t: 'Accounts Payable Analyst', l: 1, c: 'Ops' }, { id: 8, t: 'Accounts Receivable Analyst', l: 1, c: 'Ops' }, { id: 9, t: 'Treasury Analyst', l: 1, c: 'Treasury' }, { id: 10, t: 'Costing Analyst', l: 1, c: 'Reporting' },
    { id: 11, t: 'Management Accountant', l: 2, c: 'Accounting' }, { id: 12, t: 'Financial Accountant', l: 2, c: 'Accounting' }, { id: 13, t: 'FP&A Analyst', l: 2, c: 'FP&A' }, { id: 14, t: 'Senior FP&A Analyst', l: 2, c: 'FP&A' }, { id: 15, t: 'Commercial Finance Analyst', l: 2, c: 'Commercial' }, { id: 16, t: 'Finance Business Partner', l: 2, c: 'Partnership' }, { id: 17, t: 'Cost Accountant', l: 2, c: 'Accounting' }, { id: 18, t: 'Revenue Accountant', l: 2, c: 'Revenue' }, { id: 19, t: 'Systems Accountant', l: 2, c: 'Systems' },
    { id: 20, t: 'Senior Management Accountant', l: 3, c: 'Accounting' }, { id: 21, t: 'Finance Manager', l: 3, c: 'Leadership' }, { id: 22, t: 'FP&A Manager', l: 3, c: 'Leadership' }, { id: 23, t: 'Commercial Finance Manager', l: 3, c: 'Leadership' }, { id: 24, t: 'Senior Finance Business Partner', l: 3, c: 'Leadership' }, { id: 25, t: 'Group Accountant', l: 3, c: 'Reporting' },
    { id: 26, t: 'Head of Finance', l: 4, c: 'Leadership' }, { id: 27, t: 'Head of FP&A', l: 4, c: 'Leadership' }, { id: 28, t: 'Financial Controller', l: 4, c: 'Leadership' }, { id: 29, t: 'Group Financial Controller', l: 4, c: 'Leadership' },
    { id: 30, t: 'Finance Director', l: 5, c: 'Leadership' }, { id: 31, t: 'CFO', l: 5, c: 'Leadership' }, { id: 32, t: 'VP Finance', l: 5, c: 'Leadership' },
];

const LEVELS = [{ id: 1, name: 'Early Career', yrs: '0-3', emoji: '🟢' }, { id: 2, name: 'Qualified', yrs: '3-6', emoji: '🟡' }, { id: 3, name: 'Manager', yrs: '6-10', emoji: '🟠' }, { id: 4, name: 'Head Of', yrs: '10-15', emoji: '🔵' }, { id: 5, name: 'Executive', yrs: '15+', emoji: '🟣' }];

export const CVOnboardingPage = ({ onComplete }) => {
    const { darkMode, setCvData, setProfile, setJobDescription: setJD, setQuestionBank, setTargetCompany, tierConfig, isPersonalised } = useApp();
    const [step, setStep] = useState(1);
    const [cvText, setCvText] = useState('');
    const [cvFile, setCvFile] = useState(null);
    const [parsedCV, setParsedCV] = useState(null);
    const [jdMethod, setJdMethod] = useState('paste');
    const [jdText, setJdText] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [genProgress, setGenProgress] = useState('');
    const fileRef = useRef(null);

    const handleFile = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setCvFile(f);
        setLoading(true);
        setError('');
        try {
            let clean = '';
            if (f.type === 'application/pdf') {
                clean = await extractPDFText(f);
                if (clean.length < 100) {
                    setError('Could not read this PDF. Please copy and paste your CV text instead.');
                    setCvFile(null);
                    setLoading(false);
                    return;
                }
            } else {
                clean = await f.text();
            }
            if (clean.length > 100) setCvText(clean);
            else {
                setError('Could not read file. Please paste CV text instead.');
                setCvFile(null);
            }
        } catch {
            setError('File error. Please paste instead.');
            setCvFile(null);
        }
        setLoading(false);
    };

    const parseCV = async () => {
        if (cvText.length < 100) return setError('More CV content needed.');
        setLoading(true);
        setError('');
        const r = await parseCVText(cvText);
        if (r?.candidate_profile) {
            setParsedCV(r);
            setCvData(r);
            setStep(2);
        } else setError('Could not parse CV. Check and retry.');
        setLoading(false);
    };

    const generateBank = async () => {
        setStep(5);
        setError('');
        setGenProgress('Analysing your CV and target role...');
        const tr = jdMethod === 'role' ? selectedRole?.t : null;
        const jd = jdMethod === 'paste' ? jdText : null;
        if (jd) setJD(jd);
        if (companyName) setTargetCompany(companyName);

        const cur = parsedCV?.employment_history?.find(e => e.is_current_role) || parsedCV?.employment_history?.[0];
        setProfile({
            currentRole: cur?.job_title || 'Finance Professional',
            currentCompany: cur?.company_name || '',
            targetRole: tr || 'From Job Description',
            industry: cur?.company_industry || 'Finance',
            targetCompany: companyName || '',
            cvParsed: true,
            name: parsedCV?.candidate_profile?.full_name || ''
        });

        setGenProgress('Generating personalised question bank...');
        const qc = tierConfig.questionsPerMonth === Infinity ? 15 : Math.min(tierConfig.questionsPerMonth, 10);
        const cc = tierConfig.casesPerMonth === Infinity ? 3 : Math.min(tierConfig.casesPerMonth, 2);

        const params = {
            cvData: isPersonalised() ? parsedCV : null,
            jobDescription: jd,
            targetRole: tr,
            targetCompany: companyName || null,
            questionCount: qc,
            caseCount: cc,
            includeManagerLevel: tierConfig.managerAccess
        };

        let bank = await generateQuestionBank(params);
        if (bank?.questions) {
            setQuestionBank(bank);
            setGenProgress('Ready!');
            setTimeout(() => onComplete(), 800);
        } else {
            setError('Failed to generate. Try again.');
            setStep(4);
        }
    };

    if (step === 1) return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className={'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ' + (darkMode ? 'bg-indigo-900/50' : 'bg-indigo-50')}>
                    <FileText className="w-8 h-8 text-indigo-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Upload Your CV</h1>
                <p className="opacity-60">We analyse your experience to create personalised questions</p>
            </div>
            <Card hover={false} className="p-6 space-y-4">
                <div className={'border-2 border-dashed rounded-2xl p-8 text-center ' + (darkMode ? 'border-slate-600' : 'border-slate-300')}>
                    <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                    <p className="font-medium mb-2">Drop your CV or click to browse</p>
                    <p className="text-xs opacity-50 mb-4">PDF, TXT, DOCX</p>
                    <input ref={fileRef} type="file" accept=".pdf,.txt,.docx,.doc,.rtf" onChange={handleFile} className="hidden" />
                    <button onClick={() => fileRef.current?.click()} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium">
                        {cvFile ? '✓ ' + cvFile.name : 'Choose File'}
                    </button>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className={'w-full border-t ' + (darkMode ? 'border-slate-700' : '')} /></div>
                    <div className="relative flex justify-center text-sm"><span className={'px-4 ' + (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500')}>or paste</span></div>
                </div>
                <textarea value={cvText} onChange={e => setCvText(e.target.value)} placeholder="Paste your full CV text..." className={'w-full h-48 p-4 rounded-xl border resize-none text-sm ' + (darkMode ? 'bg-slate-700 border-slate-600' : '')} />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button onClick={parseCV} disabled={loading || cvText.length < 100} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold disabled:opacity-50">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Analysing...</> : 'Analyse My CV →'}
                </button>
                <p className="text-xs text-center opacity-40">CV is processed securely and not stored on our servers</p>
            </Card>
        </div>
    );

    if (step === 2) return (
        <div className="max-w-2xl mx-auto">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 opacity-60 mb-4"><ChevronLeft className="w-4 h-4" />Back</button>
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">What role are you applying for?</h1>
                <p className="opacity-60">Tailors questions to the exact position</p>
            </div>
            <div className="flex gap-3 mb-6">
                <button onClick={() => setJdMethod('paste')} className={'flex-1 py-3 rounded-xl font-medium ' + (jdMethod === 'paste' ? 'bg-indigo-600 text-white' : darkMode ? 'bg-slate-700' : 'bg-slate-100')}>Paste Job Description</button>
                <button onClick={() => setJdMethod('role')} className={'flex-1 py-3 rounded-xl font-medium ' + (jdMethod === 'role' ? 'bg-indigo-600 text-white' : darkMode ? 'bg-slate-700' : 'bg-slate-100')}>Select a Role</button>
            </div>
            <Card hover={false} className="p-6 space-y-4">
                {jdMethod === 'paste' ? (
                    <><textarea value={jdText} onChange={e => setJdText(e.target.value)} placeholder="Paste the full job description..." className={'w-full h-56 p-4 rounded-xl border resize-none text-sm ' + (darkMode ? 'bg-slate-700 border-slate-600' : '')} /><p className="text-xs opacity-40">Include responsibilities, requirements, nice-to-haves</p></>
                ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {[1, 2, 3, 4, 5].map(lv => {
                            const lr = ROLES.filter(r => r.l === lv);
                            const ln = LEVELS.find(l => l.id === lv);
                            if (lv >= 3 && !tierConfig.managerAccess) return <div key={lv}><p className="text-xs font-bold uppercase opacity-40 mb-2">{ln?.emoji} {ln?.name} <Lock className="w-3 h-3 inline text-amber-500" /></p><p className="text-xs opacity-40 mb-3">Upgrade to access manager+ roles</p></div>;
                            return <div key={lv}><p className="text-xs font-bold uppercase opacity-40 mb-2">{ln?.emoji} {ln?.name}</p><div className="grid grid-cols-2 gap-2 mb-3">{lr.map(r => <button key={r.id} onClick={() => setSelectedRole(r)} className={'p-2.5 rounded-xl border-2 text-left text-sm ' + (selectedRole?.id === r.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : darkMode ? 'border-slate-700' : 'border-slate-200')}><p className="font-medium">{r.t}</p><p className="text-xs opacity-50">{r.c}</p></button>)}</div></div>;
                        })}
                    </div>
                )}
                <div className={'p-4 rounded-xl ' + (darkMode ? 'bg-slate-700/50' : 'bg-slate-50')}>
                    <label className="text-sm font-medium mb-2 block">Company name <span className="opacity-40">(optional)</span></label>
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Deloitte, Revolut..." className={'w-full px-4 py-2.5 rounded-xl border text-sm ' + (darkMode ? 'bg-slate-800 border-slate-600' : '')} />
                </div>
                <button onClick={() => setStep(4)} disabled={jdMethod === 'paste' ? jdText.length < 50 : !selectedRole} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold disabled:opacity-50">Continue →</button>
            </Card>
        </div>
    );

    if (step === 4) {
        const cur = parsedCV?.employment_history?.find(e => e.is_current_role) || parsedCV?.employment_history?.[0];
        return (
            <div className="max-w-2xl mx-auto">
                <button onClick={() => setStep(2)} className="flex items-center gap-1 opacity-60 mb-4"><ChevronLeft className="w-4 h-4" />Back</button>
                <div className="text-center mb-8"><h1 className="text-2xl font-bold mb-2">Confirm Your Profile</h1></div>
                <Card hover={false} className="p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className={'p-4 rounded-xl ' + (darkMode ? 'bg-slate-700/50' : 'bg-slate-50')}>
                            <p className="text-xs font-bold uppercase opacity-40 mb-2">Your Background</p>
                            <p className="font-semibold">{parsedCV?.candidate_profile?.full_name || 'Candidate'}</p>
                            <p className="text-sm opacity-70">{cur?.job_title}</p>
                            <p className="text-sm opacity-50">{cur?.company_name}</p>
                            <div className="flex flex-wrap gap-1 mt-2">{parsedCV?.skills?.technical_skills?.slice(0, 5).map((s, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">{s}</span>)}</div>
                        </div>
                        <div className={'p-4 rounded-xl ' + (darkMode ? 'bg-purple-900/20' : 'bg-purple-50')}>
                            <p className="text-xs font-bold uppercase opacity-40 mb-2">Target Role</p>
                            <p className="font-semibold">{jdMethod === 'role' ? selectedRole?.t : 'From Job Description'}</p>
                            {companyName && <p className="text-sm opacity-70 mt-1">at {companyName}</p>}
                        </div>
                    </div>
                    {!isPersonalised() && <div className={'p-3 rounded-xl text-sm flex items-center gap-2 ' + (darkMode ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-50 text-amber-700')}><Lock className="w-4 h-4 flex-shrink-0" /><span>Free/Standard: questions based on role & JD. <strong>Upgrade to Pro (£29/mo)</strong> for CV-personalised questions referencing your specific experience.</span></div>}
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button onClick={generateBank} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold"><Sparkles className="w-5 h-5 inline mr-2" />Generate My Question Bank</button>
                </Card>
            </div>
        );
    }

    if (step === 5) return (
        <div className="max-w-md mx-auto text-center py-20">
            <div className="w-20 h-20 rounded-3xl premium-gradient flex items-center justify-center mx-auto mb-6 animate-float shadow-2xl"><Sparkles className="w-10 h-10 text-white" /></div>
            <h1 className="text-2xl font-bold mb-3">Building Your Question Bank</h1>
            <p className="opacity-60 mb-8">{genProgress}</p>
            <div className="flex justify-center gap-1">{[0, 1, 2, 3, 4].map(i => <div key={i} className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: i * 0.15 + 's' }} />)}</div>
        </div>
    );

    return null;
};
