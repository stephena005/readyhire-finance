import React, { useState } from 'react';
import { CheckCircle, Lock, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createCheckoutSession } from '../utils/api';

const STRIPE_PRICES = {
    standard: {
        monthly: { id: import.meta.env.VITE_STRIPE_PRICE_STANDARD_MONTHLY || '', price: 9 },
        annual: { id: import.meta.env.VITE_STRIPE_PRICE_STANDARD_ANNUAL || '', price: 91.80, monthlyEquiv: 7.65 }
    },
    pro: {
        monthly: { id: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || '', price: 29 },
        annual: { id: import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL || '', price: 295.80, monthlyEquiv: 24.65 }
    },
};

export const PricePage = () => {
    const { user, sub, darkMode } = useApp();
    const [billing, setBilling] = useState('monthly');
    const [loading, setLoading] = useState(null);

    const handleSubscribe = async (tier) => {
        if (!user?.id) return;
        setLoading(tier);
        const prices = STRIPE_PRICES[tier];
        const priceId = billing === 'annual' ? prices.annual.id : prices.monthly.id;
        await createCheckoutSession(priceId, user.id, user.email);
        setLoading(null);
    };

    const plans = [
        { id: 'free', name: 'Free', price: '£0', period: 'forever', features: ['3 questions per month', '1 case study per month', 'Basic scoring', 'Role-based questions'], locked: ['AI feedback', 'Manager+ content', 'CV-personalised questions'], current: sub.tier === 'free' },
        { id: 'standard', name: 'Standard', price: billing === 'annual' ? '£7.65' : '£9', period: billing === 'annual' ? '/mo (billed £91.80/yr)' : '/month', features: ['10 questions per month', '3 case studies per month', 'AI-powered feedback', 'Manager-level access (2 sessions/mo)', 'Role + JD-based questions'], locked: ['CV-personalised questions'], current: sub.tier === 'standard', popular: true },
        { id: 'pro', name: 'Pro', price: billing === 'annual' ? '£24.65' : '£29', period: billing === 'annual' ? '/mo (billed £295.80/yr)' : '/month', features: ['Unlimited questions', 'Unlimited case studies', 'AI-powered feedback', 'Full manager+ access', 'CV-personalised questions', 'Experience-specific probing', 'Priority support'], locked: [], current: sub.tier === 'pro' },
    ];

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-black mb-3">Choose Your Plan</h1>
                <p className="opacity-60 mb-6">Upgrade to unlock AI feedback and personalised coaching</p>
                <div className={'inline-flex rounded-xl p-1 ' + (darkMode ? 'bg-slate-800' : 'bg-slate-100')}>
                    <button onClick={() => setBilling('monthly')} className={'px-4 py-2 rounded-lg text-sm font-medium transition ' + (billing === 'monthly' ? 'bg-indigo-600 text-white' : '')}>Monthly</button>
                    <button onClick={() => setBilling('annual')} className={'px-4 py-2 rounded-lg text-sm font-medium transition ' + (billing === 'annual' ? 'bg-indigo-600 text-white' : '')}>Annual <span className="text-xs ml-1 text-green-400 font-bold">Save 15%</span></button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className={'relative rounded-3xl border-2 p-6 flex flex-col ' + (plan.popular ? 'border-indigo-500 shadow-xl shadow-indigo-500/20' : darkMode ? 'border-slate-700' : 'border-slate-200') + (plan.current ? ' ring-2 ring-green-500' : '')}>
                        {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold">Most Popular</div>}
                        {plan.current && <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">Current</div>}
                        <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                        <div className="mb-4"><span className="text-3xl font-black">{plan.price}</span><span className="text-sm opacity-50">{plan.period}</span></div>
                        <div className="space-y-2 flex-1 mb-6">
                            {plan.features.map((f, i) => <div key={i} className="flex items-start gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /><span>{f}</span></div>)}
                            {plan.locked.map((f, i) => <div key={i} className="flex items-start gap-2 text-sm opacity-40"><Lock className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{f}</span></div>)}
                        </div>
                        {plan.current ? (
                            <button disabled className="w-full py-3 rounded-xl bg-green-100 text-green-700 font-semibold dark:bg-green-900/50 dark:text-green-400">Current Plan</button>
                        ) : plan.id === 'free' ? (
                            <button disabled className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 font-medium opacity-50">Free Forever</button>
                        ) : (
                            <button onClick={() => handleSubscribe(plan.id)} disabled={!!loading} className={'w-full py-3 rounded-xl font-semibold text-white ' + (plan.id === 'pro' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-indigo-600')}>
                                {loading === plan.id ? <Loader2 className="w-5 h-5 animate-spin inline" /> : 'Subscribe'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <p className="text-center text-xs opacity-40 mt-8">Payments processed securely by Stripe. Cancel anytime.</p>
        </div>
    );
};
