import React, { useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

export default function MFAModal({ isOpen, onClose, onSuccess, title = "Secure Access Required" }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.post('/auth/mfa/verify', { code });
            if (response.success) {
                onSuccess(response.reveal_token);
                onClose();
            }
        } catch (err) {
            setError(err.message || 'MFA Verification Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-bg-card border-2 border-border-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 relative">
                    <button 
                        onClick={onClose}
                        className="absolute right-4 top-4 text-text-muted hover:text-text-main transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4 text-accent">
                            <Lock size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-text-main">{title}</h2>
                        <p className="text-sm text-text-muted mt-2">
                            Enter your 6-digit app code or an 8-character backup code.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            maxLength="16"
                            placeholder="Code"
                            className="w-full bg-bg-main border-2 border-border-card rounded-xl px-4 py-4 text-center text-2xl font-mono uppercase tracking-[0.2em] focus:border-accent outline-none transition-all"
                            value={code}
                            onChange={(e) => setCode(e.target.value.trim().toUpperCase())}
                            autoFocus
                        />

                        {error && (
                            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <ShieldCheck size={20} />
                                    Verify & Proceed
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
