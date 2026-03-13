import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CreditCard, Loader, CheckCircle, XCircle, QrCode } from 'lucide-react';
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
    const [transaction, setTransaction] = useState<any>(null);

    useEffect(() => {
        if (transactionId) {
            loadPaymentUrl();
            apiService.payments.getTransaction(transactionId).then((tx) => setTransaction(tx)).catch(() => {});
        } else {
            setError('Transaction ID topilmadi');
        }
    }, [transactionId]);

    // Avtomatik yo'naltirish o'chirildi — foydalanuvchi QR orqali skanerlab to'lashi yoki tugma orqali ochishi mumkin

    const loadPaymentUrl = async () => {
        if (!transactionId) return;
        
        setIsLoading(true);
        setError('');
        
        try {
            const response = await apiService.payments.processPayment(transactionId, 'click');
            
            const url = response.payment_url;
            if (url && typeof url === 'string') {
                setPaymentUrl(url);
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
            window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const refreshTransaction = async () => {
        if (!transactionId) return;
        try {
            const tx = await apiService.payments.getTransaction(transactionId);
            setTransaction(tx);
            if (tx?.status === 'completed') toast.success('To\'lov tasdiqlandi.');
        } catch (_) {}
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
                                <p className="font-semibold">Click to&apos;lov sahifasi tayyor</p>
                            </div>
                            <p className="text-sm text-gray-400">
                                QR kodni skanerlang yoki tugma orqali Click rasmiy to&apos;lov sahifasiga o&apos;ting (my.click.uz).
                            </p>
                        </div>

                        {/* QR kod — Click to'lov linki (Установка кнопки оплаты, Вариант 1) */}
                        <div className="flex flex-col items-center p-4 bg-white rounded-xl">
                            <p className="text-gray-700 text-sm font-medium mb-3 flex items-center gap-2">
                                <QrCode className="h-4 w-4" />
                                QR kod — telefonda to&apos;lash
                            </p>
                            <QRCodeSVG
                                value={paymentUrl}
                                size={240}
                                level="M"
                                bgColor="#ffffff"
                                fgColor="#0f172a"
                                includeMargin={true}
                                className="rounded-lg"
                            />
                            <p className="text-gray-700 text-xs mt-3 text-center max-w-[280px] font-medium">
                                Telefonda to&apos;lov uchun: <strong>Click ilovasini</strong> oching → «QR orqali to&apos;lash» yoki kamerani shu QR ga qarating. To&apos;lov to&apos;g&apos;ridan-to&apos;g&apos;ri Click ilovasida ochiladi (veb emas).
                            </p>
                            <p className="text-gray-500 text-xs mt-1 text-center max-w-[280px]">
                                Ilova o&apos;rnatilgan bo&apos;lsa, telefon kamerasi orqali skanerlanganda ham tizim Click ilovasini ochishi mumkin.
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <p className="text-sm text-gray-400 text-center mb-3">Yoki kompyuterdan — Click sahifasini ochish:</p>
                            <Button
                                onClick={handlePayment}
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <CreditCard className="h-5 w-5" />
                                Click orqali to&apos;lash (sahifa yangi tabda ochiladi)
                            </Button>
                        </div>

                        {transaction?.status === 'completed' && transaction?.udk_certificate_url && (
                            <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                                <p className="font-semibold text-green-300 mb-2">UDK tasdiqlangan ma&apos;lumotnoma tayyor</p>
                                <a
                                    href={transaction.udk_certificate_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-green-400 hover:underline"
                                >
                                    Ma&apos;lumotnomani yuklab olish
                                </a>
                            </div>
                        )}

                        <div className="flex justify-center gap-2">
                            <button
                                type="button"
                                onClick={refreshTransaction}
                                className="text-sm text-gray-400 hover:text-white"
                            >
                                To&apos;lovni tekshirish
                            </button>
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
