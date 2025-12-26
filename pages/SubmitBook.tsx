import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { UploadCloud, CheckCircle, Loader2, XCircle, BookText, Book, BookCopy, ChevronDown, Check, Info, Minus, Plus } from 'lucide-react';
import { useAuth, useNotifications } from '../contexts/AuthContext';
import { Article, ArticleStatus } from '../types';
import { apiService } from '../services/apiService';
import { paymentService } from '../services/paymentService';

// --- Pricing Data from Image ---
const PRINTING_PER_PAGE = {
    '1-10': { eco: 125, standart: 150 },
    '11-100': { eco: 100, standart: 125 },
    '101-300': { eco: 80, standart: 100 },
    '301-1000': { eco: 75, standart: 80 },
};

const COVER_PER_BOOK = {
    '1-10': { soft: 15000, hard: 20000 },
    '11-100': { soft: 10000, hard: 15000 },
    '101-300': { soft: 8000, hard: 10000 },
    '301-1000': { soft: 6000, hard: 8000 },
};

const BINDING_PER_BOOK = {
    '1-10': 300,
    '11-100': 300,
    '101-300': 250,
    '301-1000': 200,
};

const ISBN_FEE = 600000;
const DESIGN_FEE = 75000; // Average of 50k-100k
// --- End Pricing Data ---

// --- Helper Components ---
const SliderInput: React.FC<{ label: string, value: number, onChange: (value: number) => void, min: number, max: number, step: number, icon: React.ComponentType<{ className?: string }> }> = ({ label, value, onChange, min, max, step, icon: Icon }) => (
    <div>
        <div className="flex items-center justify-between mb-2">
            <label className="flex items-center text-sm font-medium text-gray-300">
                <Icon className="w-4 h-4 mr-2" />
                {label}
            </label>
            <span className="text-sm font-medium text-blue-300 bg-blue-900/30 px-2 py-1 rounded">{value}</span>
        </div>
        <div className="flex items-center space-x-3">
            <button 
                onClick={() => onChange(Math.max(min, value - step))} 
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                type="button"
            >
                <Minus className="w-4 h-4 text-gray-400" />
            </button>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10) || min)}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
            />
            <button 
                onClick={() => onChange(Math.min(max, value + step))} 
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                type="button"
            >
                <Plus className="w-4 h-4 text-gray-400" />
            </button>
            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10) || min)}
                className="w-24 text-center !py-2"
            />
        </div>
    </div>
);

const OptionToggle: React.FC<{ label: string, options: { value: string, label: string }[], selected: string, onSelect: (value: string) => void }> = ({ label, options, selected, onSelect }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <div className="flex bg-white/5 rounded-lg p-1">
            {options.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelect(opt.value)}
                    className={`w-full text-center px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${selected === opt.value ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-white/10'}`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
);

const CheckboxCard: React.FC<{ title: string, description: string, price: number, checked: boolean, onChange: (checked: boolean) => void }> = ({ title, description, price, checked, onChange }) => (
     <div onClick={() => onChange(!checked)} className={`p-4 rounded-lg bg-white/5 border-2 cursor-pointer transition-all ${checked ? 'border-blue-500 bg-blue-500/10' : 'border-transparent hover:border-white/10'}`}>
        <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
                <p className="font-semibold text-white">{title}</p>
                <p className="text-xs text-gray-400 mt-1">{description}</p>
            </div>
            <div className="flex flex-col items-end">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${checked ? 'bg-blue-600 border-blue-500' : 'bg-white/10 border-white/20'}`}>
                    {checked && <Check className="w-3 h-3 text-white" />}
                </div>
                 <p className="text-sm font-medium text-blue-300 mt-2 whitespace-nowrap">{price.toLocaleString()} so'm</p>
            </div>
        </div>
    </div>
);

const ClickLogo = () => (
     <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
    </div>
);
// --- End Helper Components ---


const SubmitBook: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addNotification } = useNotifications();

    // Configuration state
    const [pages, setPages] = useState(150);
    const [copies, setCopies] = useState(50);
    const [paperQuality, setPaperQuality] = useState<'eco' | 'standart'>('standart');
    const [coverType, setCoverType] = useState<'soft' | 'hard'>('soft');
    const [options, setOptions] = useState({ isbn: false, design: false });

    // Book details state
    const [title, setTitle] = useState('');
    const [synopsis, setSynopsis] = useState('');
    const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    // Payment modal state
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const paymentTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);
        };
    }, []);

    const calculatedCosts = useMemo(() => {
        const getTier = (numCopies: number) => {
            if (numCopies >= 1 && numCopies <= 10) return '1-10';
            if (numCopies >= 11 && numCopies <= 100) return '11-100';
            if (numCopies >= 101 && numCopies <= 300) return '101-300';
            if (numCopies >= 301) return '301-1000'; // Cap at 1000 for pricing
            return null;
        };

        const tier = getTier(copies);
        if (!tier || pages <= 0 || copies <= 0) {
            return { printing: 0, cover: 0, binding: 0, isbn: 0, design: 0, total: 0 };
        }
        
        const pagePrice = PRINTING_PER_PAGE[tier][paperQuality];
        const coverPrice = COVER_PER_BOOK[tier][coverType];
        const bindingPrice = BINDING_PER_BOOK[tier];
        
        const printingTotal = pages * copies * pagePrice;
        const coverTotal = copies * coverPrice;
        const bindingTotal = copies * bindingPrice;
        const isbnTotal = options.isbn ? ISBN_FEE : 0;
        const designTotal = options.design ? DESIGN_FEE : 0;
        
        const total = printingTotal + coverTotal + bindingTotal + isbnTotal + designTotal;

        return { printing: printingTotal, cover: coverTotal, binding: bindingTotal, isbn: isbnTotal, design: designTotal, total };
    }, [pages, copies, paperQuality, coverType, options]);


    const submitBook = async (isPaid: boolean = false) => {
        if (!user || !title || !manuscriptFile || pages <= 0) return;

        try {
            // Prepare article data for book publication
            const articleData = {
                title: `[KITOB] ${title}`,
                abstract: synopsis || 'Annotatsiya kiritilmagan.',
                keywords: ['kitob', 'nashr'],
                status: ArticleStatus.Yangi,
                journalId: 'book-publication-service', // Special ID for books
                submissionDate: new Date().toISOString().split('T')[0],
                pageCount: pages,
            };

            // Create the article with manuscript file
            const result = await apiService.articles.create(
                articleData,
                { mainFile: manuscriptFile, additionalFile: coverFile || undefined }
            );
            
            // If payment was made, record the transaction
            if(isPaid && result.id) {
                const transactionData = {
                    articleId: result.id,
                    amount: -calculatedCosts.total,
                    currency: 'so\'m',
                    serviceType: 'book_publication',
                    status: 'completed',
                    createdAt: new Date().toISOString().split('T')[0],
                };
                
                // Save transaction to backend
                await apiService.payments.createTransaction(transactionData);
            }

            addNotification({ 
                message: `Yangi "${articleData.title.substring(0, 40)}..." kitobi ko'rib chiqish uchun yuborildi.`,
                link: `/articles/${result.id}`
            });
            
            return result;
        } catch (error) {
            console.error('Failed to submit book:', error);
            addNotification({ 
                message: 'Kitob yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
            });
            throw error;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (calculatedCosts.total <= 0) {
            alert("Iltimos, sahifa va nusxalar sonini to'g'ri kiriting.");
            return;
        }
        setPaymentStatus('idle');
        setPaymentError(null);
        setIsPaymentModalOpen(true);
    };
    
    const handlePay = async () => {
        // Vaqtincha o'chirib qo'yilgan to'lov funksiyasi
        // TODO: To'lov tizimini qayta ulash kerak
        setPaymentStatus('success');
        submitBook(true);
        
        /*
        setPaymentError(null);
        setPaymentStatus('processing');
        if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);
        
        try {
            // Create invoice via Click payment service
            const response = await paymentService.createInvoice({
                amount: calculatedCosts.total,
                phoneNumber: user?.phone || '',
                merchantTransId: `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
            
            if (response.error_code === 0) {
                // Success - redirect to Click payment page or show payment form
                setPaymentStatus('success');
                submitBook(true);
            } else {
                throw new Error(response.error_note || "To'lovni amalga oshirishda xatolik yuz berdi.");
            }
        } catch (err: any) {
            console.error('Payment failed:', err);
            setPaymentStatus('failed');
            setPaymentError(err.message || "To'lovni amalga oshirishda xatolik yuz berdi.");
        }
        */
    };
    
    const closePaymentModal = () => setIsPaymentModalOpen(false);
    
    const formatCurrency = (amount: number) => `${new Intl.NumberFormat('uz-UZ').format(amount)} so'm`;

    return (
        <>
            <Card title="Kitob Nashr Etish Kalkulyatori">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Configuration */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-3">1. Asosiy Parametrlar</h3>
                            <SliderInput label="Sahifalar soni" value={pages} onChange={setPages} min={16} max={1000} step={4} icon={BookText} />
                            <SliderInput label="Nusxalar soni" value={copies} onChange={setCopies} min={1} max={1000} step={1} icon={BookCopy} />
                            <OptionToggle label="Qog'oz sifati" options={[{ value: 'eco', label: 'Eco' }, { value: 'standart', label: 'Standart' }]} selected={paperQuality} onSelect={val => setPaperQuality(val as 'eco' | 'standart')} />
                            <OptionToggle label="Muqova turi" options={[{ value: 'soft', label: 'Yumshoq' }, { value: 'hard', label: 'Qattiq' }]} selected={coverType} onSelect={val => setCoverType(val as 'soft' | 'hard')} />

                            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-3 pt-4">2. Qo'shimcha Xizmatlar</h3>
                            <div className="space-y-3">
                                <CheckboxCard title="ISBN raqami olish" description="Kitobingizga xalqaro standart raqamini oling." price={ISBN_FEE} checked={options.isbn} onChange={c => setOptions(p => ({ ...p, isbn: c }))} />
                                <CheckboxCard title="Professional muqova dizayni" description="Tajribali dizaynerlar tomonidan muqova tayyorlash." price={DESIGN_FEE} checked={options.design} onChange={c => setOptions(p => ({ ...p, design: c }))} />
                            </div>
                        </div>

                        {/* Right Column: Summary & Upload */}
                        <div className="space-y-6">
                             <div className="sticky top-24">
                                <Card title="Hisob-kitob" className="!bg-black/40">
                                    {calculatedCosts.total > 0 ? (
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between py-1.5 border-b border-white/10"><span className="text-gray-400">Chop etish:</span><span className="font-medium text-white">{formatCurrency(calculatedCosts.printing)}</span></div>
                                            <div className="flex justify-between py-1.5 border-b border-white/10"><span className="text-gray-400">Muqova:</span><span className="font-medium text-white">{formatCurrency(calculatedCosts.cover)}</span></div>
                                            <div className="flex justify-between py-1.5 border-b border-white/10"><span className="text-gray-400">Tikish:</span><span className="font-medium text-white">{formatCurrency(calculatedCosts.binding)}</span></div>
                                            {options.isbn && <div className="flex justify-between py-1.5 border-b border-white/10"><span className="text-gray-400">ISBN:</span><span className="font-medium text-white">{formatCurrency(calculatedCosts.isbn)}</span></div>}
                                            {options.design && <div className="flex justify-between py-1.5 border-b border-white/10"><span className="text-gray-400">Dizayn:</span><span className="font-medium text-white">{formatCurrency(calculatedCosts.design)}</span></div>}
                                            <div className="flex justify-between items-center pt-4">
                                                <span className="text-lg font-bold text-white">JAMI:</span>
                                                <span className="text-2xl font-bold text-blue-300">{formatCurrency(calculatedCosts.total)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <Info className="mx-auto h-8 w-8 mb-2" />
                                            Narxni hisoblash uchun parametrlarni kiriting.
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">3. Kitob Ma'lumotlari va Fayllar</h3>
                         <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Kitob Sarlavhasi</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Annotatsiya / Synopsis</label>
                                <textarea value={synopsis} onChange={e => setSynopsis(e.target.value)} required className="w-full" rows={4}></textarea>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Qo'lyozma Fayli (.docx, .pdf)</label>
                                    <label htmlFor="manuscript-upload" className="cursor-pointer">
                                        <div className="p-8 border-2 border-dashed rounded-lg border-gray-600 text-center bg-white/5 hover:bg-white/10 transition-colors h-full flex flex-col justify-center">
                                            <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                                            <p className="mt-2 text-sm text-gray-400">{manuscriptFile ? manuscriptFile.name : 'Faylni yuklang'}</p>
                                        </div>
                                        <input id="manuscript-upload" type="file" className="sr-only" onChange={(e) => setManuscriptFile(e.target.files ? e.target.files[0] : null)} accept=".doc,.docx,.pdf" required />
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Muqova Rasmi (ixtiyoriy)</label>
                                    <label htmlFor="cover-upload" className="cursor-pointer">
                                        <div className="p-8 border-2 border-dashed rounded-lg border-gray-600 text-center bg-white/5 hover:bg-white/10 transition-colors h-full flex flex-col justify-center">
                                            <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                                            <p className="mt-2 text-sm text-gray-400">{coverFile ? coverFile.name : 'Rasm yuklang'}</p>
                                        </div>
                                        <input id="cover-upload" type="file" className="sr-only" onChange={(e) => setCoverFile(e.target.files ? e.target.files[0] : null)} accept="image/*" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-white/10 flex justify-end">
                        <Button type="submit" disabled={!title || !manuscriptFile || pages <= 0 || copies <= 0}>
                            To'lovga o'tish va Yuborish
                        </Button>

                    </div>
                </form>
            </Card>

            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-sm text-center">
                        {paymentStatus === 'idle' && (
                            <>
                                <ClickLogo />
                                <h3 className="text-xl font-semibold text-white">To'lovni tasdiqlash</h3>
                                <p className="text-sm text-gray-400 mt-1">Kitob nashr etish</p>
                                <p className="text-4xl font-bold my-4 text-white">{formatCurrency(calculatedCosts.total)}</p>
                                <Button onClick={handlePay} className="w-full">
                                    To'lash
                                </Button>
                                <Button variant="secondary" onClick={closePaymentModal} className="w-full mt-3">
                                    Bekor qilish
                                </Button>
                            </>
                        )}
                        {paymentStatus === 'processing' && (
                            <div className="py-8">
                                <Loader2 className="mx-auto h-16 w-16 text-blue-500 animate-spin"/>
                                <p className="mt-4 text-lg font-medium text-gray-200">To'lov tasdiqlanmoqda...</p>
                            </div>
                        )}
                        {paymentStatus === 'success' && (
                           <div className="py-8">
                                <CheckCircle className="mx-auto h-16 w-16 text-green-500"/>
                                <p className="mt-4 text-lg font-medium text-gray-200">To'lov muvaffaqiyatli!</p>
                                <p className="text-sm text-gray-400">Kitobingiz ko'rib chiqish uchun yuborildi.</p>
                                <Button onClick={() => { closePaymentModal(); navigate('/articles'); }} className="w-full mt-6">
                                    Yopish
                                </Button>
                           </div>
                        )}
                        {paymentStatus === 'failed' && (
                           <div className="py-8">
                                <XCircle className="mx-auto h-16 w-16 text-red-500"/>
                                <p className="mt-4 text-lg font-medium text-gray-200">To'lovda xatolik!</p>
                                <p className="text-sm text-gray-400 max-w-xs mx-auto">{paymentError}</p>
                                <div className="flex space-x-2 mt-6">
                                     <Button onClick={handlePay} className="w-full">
                                        Qayta urinish
                                    </Button>
                                    <Button variant="secondary" onClick={closePaymentModal} className="w-1/2">
                                        Yopish
                                    </Button>
                                </div>
                           </div>
                        )}
                    </Card>
                </div>
            )}
        </>
    );
};

export default SubmitBook;
