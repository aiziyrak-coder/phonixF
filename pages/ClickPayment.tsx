import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CreditCard, Loader, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '../services/apiService';
import { toast } from 'react-toastify';

const ClickPayment: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const transactionId = searchParams.get('transaction_id');
    
    const [isLoading, setIsLoading] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (transactionId) {
            loadPaymentUrl();
        } else {
            setError('Transaction ID topilmadi');
        }
    }, [transactionId]);

    // Payment URL tayyor bo'lganda avtomatik ochish
    useEffect(() => {
        if (paymentUrl && status === 'success') {
            // 2 soniyadan keyin avtomatik ochish (user ko'rish uchun)
            const timer = setTimeout(() => {
                window.location.href = paymentUrl;
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [paymentUrl, status]);

    const loadPaymentUrl = async () => {
        if (!transactionId) return;
        
        setIsLoading(true);
        setError('');
        
        try {
            const response = await apiService.payments.processPayment(transactionId, 'click');
            
            if (response.success && response.payment_url) {
                setPaymentUrl(response.payment_url);
                setStatus('success');
            } else {
                setError(response.error || response.error_note || 'To\'lov URL olinmadi');
                setStatus('error');
            }
        } catch (err: any) {
            setError(err.message || 'To\'lov URL yuklashda xatolik');
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayment = () => {
        if (paymentUrl) {
            // Click sahifasini to'g'ridan-to'g'ri ochish
            // User u yerda karta ma'lumotlarini kiritadi
            window.location.href = paymentUrl;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <div className="text-center mb-6">
                    <CreditCard className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                    <h2 className="text-2xl font-bold text-white mb-2">Click To'lov</h2>
                    <p className="text-gray-400">To'lovni amalga oshirish uchun tugmani bosing</p>
                </div>

                {isLoading && (
                    <div className="text-center py-8">
                        <Loader className="h-12 w-12 mx-auto animate-spin text-blue-400 mb-4" />
                        <p className="text-gray-400">To'lov sahifasi tayyorlanmoqda...</p>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-red-300">
                            <XCircle className="h-5 w-5" />
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {status === 'success' && paymentUrl && (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                            <div className="flex items-center gap-2 text-green-300 mb-2">
                                <CheckCircle className="h-5 w-5" />
                                <p className="font-semibold">To'lov sahifasi tayyor!</p>
                            </div>
                            <p className="text-sm text-gray-400">
                                Quyidagi tugmani bosib, Click to'lov sahifasiga o'ting va karta ma'lumotlarini kiriting.
                            </p>
                        </div>

                        <Button
                            onClick={handlePayment}
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <CreditCard className="h-5 w-5" />
                            To'lovni Amalga Oshirish
                        </Button>
                        
                        <div className="text-sm text-gray-400 text-center p-3 bg-gray-800/50 rounded-lg">
                            <p>ℹ️ Click to'lov sahifasida karta raqami va muddatini kiriting</p>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-sm text-gray-400 hover:text-white"
                            >
                                Orqaga qaytish
                            </button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4">
                        <Button
                            onClick={loadPaymentUrl}
                            className="w-full"
                        >
                            Qayta Urinib Ko'rish
                        </Button>
                        <div className="text-center">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-sm text-gray-400 hover:text-white"
                            >
                                Orqaga qaytish
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ClickPayment;
