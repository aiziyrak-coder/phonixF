import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { UploadCloud, FileText, ChevronLeft, ChevronRight, CheckCircle, Loader2, XCircle, Users, Wallet, Check, Library, Sparkles, Edit2, Newspaper, Rocket, Search, Star, PenSquare, Link, AlertTriangle, Filter, Clock } from 'lucide-react';
import { useAuth, useNotifications } from '../contexts/AuthContext';
import { Article, ArticleStatus, Journal, JournalPricingType, PaymentModel, JournalCategory } from '../types';
import { generateAbstractAndKeywords } from '../services/geminiService';
import { apiService } from '../services/apiService';
import { paymentService } from '../services/paymentService';

type WizardStep = 1 | 2 | 3 | 4 | 5;
type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';
type SubmissionType = 'write' | 'publish';

const ADDITIONAL_SERVICE_PRICES = {
    fastTrack: 50000,
};

const SubmitArticle: React.FC = () => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const navigate = useNavigate();
    const [step, setStep] = useState<WizardStep>(1);
    const [loading, setLoading] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const [submissionType, setSubmissionType] = useState<SubmissionType | null>(null);
    const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
    const [journals, setJournals] = useState<Journal[]>([]);
    const [categories, setCategories] = useState<JournalCategory[]>([]);
    const [journalSearch, setJournalSearch] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 100000000 }); // Increased max value
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [favoriteJournals, setFavoriteJournals] = useState<string[]>([]);
    const [viewingJournal, setViewingJournal] = useState<Journal | null>(null);
    const [authorInfo, setAuthorInfo] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        affiliation: user?.affiliation || ''
    });
    const [coAuthors, setCoAuthors] = useState<Array<{firstName: string, lastName: string, email: string, affiliation: string}>>([]);
    const [additionalServices, setAdditionalServices] = useState({
        fastTrack: false,
    });
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [generatedAbstract, setGeneratedAbstract] = useState('');
    const [generatedKeywords, setGeneratedKeywords] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const paymentTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch journals and categories
    useEffect(() => {
        const fetchJournals = async () => {
            try {
                const [journalsData, categoriesData] = await Promise.all([
                    apiService.journals.list(),
                    apiService.journals.listCategories()
                ]);
                
                console.log('Raw journals data:', journalsData);
                console.log('Raw categories data:', categoriesData);
                
                // Handle different response formats
                let processedJournals = [];
                if (Array.isArray(journalsData)) {
                    processedJournals = journalsData;
                } else if (journalsData && typeof journalsData === 'object') {
                    if (Array.isArray(journalsData.data)) {
                        processedJournals = journalsData.data;
                    } else if (Array.isArray(journalsData.results)) {
                        processedJournals = journalsData.results;
                    } else if (journalsData.hasOwnProperty('journals')) {
                        // Handle case where journals are in a 'journals' property
                        processedJournals = Array.isArray(journalsData.journals) ? journalsData.journals : [];
                    } else {
                        // If it's an object with journal properties directly
                        processedJournals = [journalsData];
                    }
                }
                
                // Handle categories similarly
                let processedCategories = [];
                if (Array.isArray(categoriesData)) {
                    processedCategories = categoriesData;
                } else if (categoriesData && typeof categoriesData === 'object') {
                    if (Array.isArray(categoriesData.data)) {
                        processedCategories = categoriesData.data;
                    } else if (Array.isArray(categoriesData.results)) {
                        processedCategories = categoriesData.results;
                    } else if (categoriesData.hasOwnProperty('categories')) {
                        // Handle case where categories are in a 'categories' property
                        processedCategories = Array.isArray(categoriesData.categories) ? categoriesData.categories : [];
                    } else {
                        processedCategories = [categoriesData];
                    }
                }
                
                console.log('Processed journals:', processedJournals);
                console.log('Processed categories:', processedCategories);
                
                // Validate journal data
                const validatedJournals = processedJournals.map(journal => ({
                    ...journal,
                    name: journal.name || 'Nomsiz jurnal',
                    description: journal.description || 'Tavsif mavjud emas',
                    issn: journal.issn || 'ISSN yo\'q',
                    categoryId: journal.categoryId || journal.category || '',
                    pricingType: journal.pricingType || journal.pricing_type || JournalPricingType.Fixed,
                    publicationFee: journal.publicationFee !== undefined ? 
                        (typeof journal.publicationFee === 'string' ? parseFloat(journal.publicationFee) : journal.publicationFee) : 
                        (journal.publication_fee ? parseFloat(journal.publication_fee) : 0),
                    pricePerPage: journal.pricePerPage !== undefined ? 
                        (typeof journal.pricePerPage === 'string' ? parseFloat(journal.pricePerPage) : journal.pricePerPage) : 
                        (journal.price_per_page ? parseFloat(journal.price_per_page) : 0)
                }));
                
                // Validate category data
                const validatedCategories = processedCategories.map(category => ({
                    ...category,
                    name: category.name || 'Noma\'lum toifa'
                }));
                
                console.log('Validated journals:', validatedJournals);
                console.log('Validated categories:', validatedCategories);
                
                setJournals(validatedJournals);
                setCategories(validatedCategories);
            } catch (err) {
                console.error('Failed to fetch journals:', err);
                addNotification({ message: "Jurnallar ro'yxatini yuklashda xatolik yuz berdi." });
            }
        };

        fetchJournals();
    }, [addNotification]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (paymentTimerRef.current) {
                clearTimeout(paymentTimerRef.current);
            }
        };
    }, []);

    const selectedJournal = useMemo(() => journals.find(j => j.id === selectedJournalId), [journals, selectedJournalId]);

    const currentTotal = useMemo(() => {
        let total = 0;
        if (submissionType === 'publish' && selectedJournal) {
             if (selectedJournal.pricingType === JournalPricingType.Fixed) {
                total += parseFloat(selectedJournal.publicationFee as any) || 0;
            } else if (selectedJournal.pricingType === JournalPricingType.PerPage && pageCount > 0) {
                total += (parseFloat(selectedJournal.pricePerPage as any) || 0) * pageCount;
            }
        }
        // Placeholder for writing service cost
        if (submissionType === 'write') {
            total += 150000; // Example cost for writing service
        }
        if (additionalServices.fastTrack) total += ADDITIONAL_SERVICE_PRICES.fastTrack;
        return Math.round(total);
    }, [submissionType, additionalServices, selectedJournal, pageCount]);

    const filteredJournals = useMemo(() => {
        return journals.filter(journal => {
            // Search filter
            const matchesSearch = journal.name?.toLowerCase().includes(journalSearch.toLowerCase()) || 
                                journal.description?.toLowerCase().includes(journalSearch.toLowerCase()) ||
                                journal.issn?.toLowerCase().includes(journalSearch.toLowerCase());
            
            // Category filter
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(journal.categoryId);
            
            // Price filter
            let journalPrice = 0;
            if (journal.pricingType === JournalPricingType.Fixed) {
                journalPrice = parseFloat(journal.publicationFee as any) || 0;
            } else if (journal.pricingType === JournalPricingType.PerPage) {
                journalPrice = (parseFloat(journal.pricePerPage as any) || 0) * (pageCount || 10); // Estimate with 10 pages
            }
            
            const matchesPrice = journalPrice >= priceRange.min && journalPrice <= priceRange.max;
            
            // Favorites filter
            const matchesFavorites = !showFavoritesOnly || favoriteJournals.includes(journal.id);
            
            return matchesSearch && matchesCategory && matchesPrice && matchesFavorites;
        });
    }, [journals, journalSearch, selectedCategories, priceRange, showFavoritesOnly, favoriteJournals, pageCount]);

    const toggleFavorite = (journalId: string) => {
        setFavoriteJournals(prev => 
            prev.includes(journalId) 
                ? prev.filter(id => id !== journalId) 
                : [...prev, journalId]
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
            
            // Estimate page count from file size (rough estimation)
            const estimatedPages = Math.max(1, Math.floor(selectedFile.size / 2048)); // Rough estimate
            setPageCount(estimatedPages);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setFileName('');
        setPageCount(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const addCoAuthor = () => {
        setCoAuthors([...coAuthors, { firstName: '', lastName: '', email: '', affiliation: '' }]);
    };

    const removeCoAuthor = (index: number) => {
        setCoAuthors(coAuthors.filter((_, i) => i !== index));
    };

    const updateCoAuthor = (index: number, field: string, value: string) => {
        const updatedCoAuthors = [...coAuthors];
        updatedCoAuthors[index] = { ...updatedCoAuthors[index], [field]: value };
        setCoAuthors(updatedCoAuthors);
    };

    const generateAbstractAndKeywordsFromPDF = async () => {
        if (!file) {
            setGenerationError("Iltimos, avval fayl yuklang.");
            return;
        }

        setIsGenerating(true);
        setGenerationError(null);
        
        try {
            // Convert file to base64 string for the API
            const reader = new FileReader();
            reader.onload = async () => {
                const base64String = (reader.result as string).split(',')[1];
                try {
                    const result = await generateAbstractAndKeywords(base64String);
                    setGeneratedAbstract(result.abstract);
                    setGeneratedKeywords(result.keywords.join(', '));
                    addNotification({ message: "Annotatsiya va kalit so'zlar muvaffaqiyatli yaratildi!" });
                } catch (err: any) {
                    console.error('Failed to generate abstract and keywords:', err);
                    setGenerationError(err.message || "Annotatsiya va kalit so'zlarni yaratishda xatolik yuz berdi.");
                    addNotification({ message: "Annotatsiya va kalit so'zlarni yaratishda xatolik yuz berdi." });
                } finally {
                    setIsGenerating(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (err: any) {
            console.error('Failed to read file:', err);
            setGenerationError(err.message || "Faylni o'qishda xatolik yuz berdi.");
            setIsGenerating(false);
        }
    };

    const submitArticle = async (paymentCompleted = false) => {
        if (!file || !selectedJournalId) return;
        
        try {
            // Prepare article data
            const articleData = {
                title: fileName.replace(/\.[^/.]+$/, ""), // Remove extension from filename
                abstract: generatedAbstract || "Maqola annotatsiyasi",
                keywords: generatedKeywords ? generatedKeywords.split(',').map(k => k.trim()) : ["kalit so'z"],
                journal: selectedJournalId,
                page_count: pageCount,
                fast_track: additionalServices.fastTrack,
                status: 'Yangi'
            };
            
            // Submit article with file
            const response = await apiService.articles.create(articleData, { mainFile: file });
            
            console.log('Article submission response:', response);
            
            // Since the API call succeeded (no exception thrown), consider it a success
            // The API returns 201 status on success, which means the request was processed
            if (response !== undefined) {
                // Success
                addNotification({ 
                    message: paymentCompleted 
                        ? "Maqolangiz muvaffaqiyatli yuborildi! To'lov tasdiqlandi." 
                        : "Maqolangiz muvaffaqiyatli yuborildi!",
                });
                // Small delay to ensure notification is shown before navigation
                setTimeout(() => {
                    navigate('/articles');
                }, 1000);
            } else {
                throw new Error("Maqola yuborishda xatolik yuz berdi.");
            }
        } catch (err: any) {
            console.error('Failed to submit article:', err);
            addNotification({ 
                message: err.message || "Maqola yuborishda xatolik yuz berdi.",
            });
            throw err;
        }
    };

    const handleSubmit = async () => {
        if (!selectedJournalId) {
            alert("Davom etish uchun jurnal tanlashingiz kerak.");
            return;
        }
        
        if (!submissionType) {
            alert("Davom etish uchun asosiy xizmat turlaridan birini tanlang.");
            return;
        }
        
        const paymentModel = selectedJournal?.paymentModel ?? (selectedJournal as any)?.payment_model;
        const isPostPayment = paymentModel === PaymentModel.PostPayment;
        
        if (isPostPayment) {
            setLoading(true);
            try {
                await submitArticle();
            } catch (err) {
                alert('Maqola yuborishda xatolik yuz berdi.');
            } finally {
                setLoading(false);
            }
            return;
        }
        
        setPaymentStatus('idle');
        setPaymentError(null);
        setIsPaymentModalOpen(true);
    };

    const closePaymentModal = () => {
        setIsPaymentModalOpen(false);
        if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);
    };

    const handlePay = async (e?: React.MouseEvent<HTMLButtonElement>) => {
        // Prevent default button behavior
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        setPaymentError(null);
        setPaymentStatus('processing');
        if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);
        
        try {
            // First, submit the article to get article ID
            // Then create transaction and process payment
            let articleId: string | undefined = undefined;
            
            try {
                // Submit article first (without payment completed flag)
                const articleData = {
                    title: fileName.replace(/\.[^/.]+$/, ""),
                    abstract: generatedAbstract || "Maqola annotatsiyasi",
                    keywords: generatedKeywords ? generatedKeywords.split(',').map(k => k.trim()) : ["kalit so'z"],
                    journal: selectedJournalId,
                    page_count: pageCount,
                    fast_track: additionalServices.fastTrack,
                    status: 'Yangi'
                };
                
                const articleResponse = await apiService.articles.create(articleData, { mainFile: file });
                articleId = articleResponse?.id || articleResponse?.data?.id;
                
                if (!articleId) {
                    throw new Error("Maqola yaratildi, lekin ID olinmadi.");
                }
            } catch (articleErr: any) {
                console.error('Failed to create article before payment:', articleErr);
                throw new Error(`Maqola yaratishda xatolik: ${articleErr.message || 'Noma\'lum xatolik'}`);
            }
            
            // Now create transaction and process payment
            const result = await paymentService.createTransactionAndPay(
                currentTotal,
                'UZS',
                additionalServices.fastTrack ? 'fast-track' : 'publication_fee',
                articleId,
                undefined  // translationRequestId
            );
            
            console.log('Payment result:', result);
            
            if (result && result.success === true && result.payment_url) {
                // Close modal first if it's open
                setIsPaymentModalOpen(false);
                
                // Show notification
                addNotification({ 
                    message: 'To\'lov sahifasiga yo\'naltirilmoqdasiz. To\'lovni tugallang.',
                });
                
                // Redirect to Click payment page after short delay
                setTimeout(() => {
                    if (result.payment_url) {
                        console.log('Redirecting to payment URL:', result.payment_url);
                        paymentService.redirectToPayment(result.payment_url);
                    } else {
                        console.error('Payment URL is missing');
                        setPaymentStatus('failed');
                        setPaymentError("To'lov URL topilmadi. Iltimos, qayta urinib ko'ring.");
                        setIsPaymentModalOpen(true);
                    }
                }, 500);
                
                // Note: After payment is completed via Click callback,
                // the article status will be updated automatically
                // For now, we redirect to payment page
            } else {
                // Payment preparation failed
                const errorMsg = result?.user_message || result?.error_note || result?.error || "To'lovni amalga oshirishda xatolik yuz berdi.";
                setPaymentStatus('failed');
                setPaymentError(errorMsg);
                addNotification({ 
                    message: errorMsg,
                });
            }
        } catch (err: any) {
            console.error('Payment failed:', err);
            const errorMsg = err.message || err.error_note || err.user_message || "To'lovni amalga oshirishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
            setPaymentStatus('failed');
            setPaymentError(errorMsg);
            addNotification({ 
                message: errorMsg,
            });
        }
    };
    
    const nextStep = () => {
        if (step === 1 && !selectedJournalId) {
             alert("Davom etish uchun jurnal tanlashingiz kerak.");
             return;
        }
        if (step === 2 && !submissionType) {
            alert("Davom etish uchun asosiy xizmat turlaridan birini tanlang.");
            return;
        }
        setStep(prev => Math.min(prev + 1, 5) as WizardStep);
    };
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1) as WizardStep);
    
    const stepTitles = ["Jurnal tanlash", "Xizmat turi", "Tafsilotlar", "Hammualliflar", "Tasdiqlash"];

    // Toggle category selection
    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev => 
            prev.includes(categoryId) 
                ? prev.filter(id => id !== categoryId) 
                : [...prev, categoryId]
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-2">Maqola yuborish</h1>
                <p className="text-gray-400 mb-8">Ilmiy maqolangizni platformaga yuboring</p>
                
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold text-white">Qadam {step} dan 5</h2>
                        <span className="text-gray-400">{stepTitles[step - 1]}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${(step / 5) * 100}%` }}
                        ></div>
                    </div>
                </div>
                
                <div className="mt-8 p-6 bg-white/5 rounded-xl min-h-[400px]">
                    {/* Step 1: Journal Selection - Restored to previous design */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="text"
                                        placeholder="Jurnal nomi yoki tavsifi bo'yicha qidirish..."
                                        value={journalSearch}
                                        onChange={(e) => setJournalSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <Button variant="secondary" onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}>
                                    {showFavoritesOnly ? 'Barchasi' : 'Sevimlilar'}
                                </Button>
                            </div>
                            
                            {/* Categories filter */}
                            <div className="flex flex-wrap gap-2">
                                {categories.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => toggleCategory(category.id)}
                                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                            selectedCategories.includes(category.id)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                        }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                                {selectedCategories.length > 0 && (
                                    <button
                                        onClick={() => setSelectedCategories([])}
                                        className="px-3 py-1.5 text-sm rounded-full bg-gray-500/20 text-gray-300 hover:bg-gray-500/30"
                                    >
                                        Tozalash
                                    </button>
                                )}
                            </div>
                            
                            {/* Journals grid - Enhanced design */}
                            <div className="mb-4 text-sm text-gray-400">
                                Jurnallar soni: {journals.length} | Filtrlangan: {filteredJournals.length}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredJournals.map(journal => (
                                    <div 
                                        key={journal.id}
                                        className={`border rounded-xl p-5 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                                            selectedJournalId === journal.id 
                                                ? 'border-blue-500 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 shadow-lg' 
                                                : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                                        }`}
                                        onClick={() => setSelectedJournalId(journal.id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-start gap-4">
                                                    <div className="bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl w-16 h-16 flex items-center justify-center flex-shrink-0">
                                                        <Library className="h-8 w-8 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-white text-lg">{journal.name || 'Nomsiz jurnal'}</h3>
                                                        </div>
                                                        <p className="text-sm text-gray-300 mt-2 line-clamp-2">{journal.description || 'Tavsif mavjud emas'}</p>
                                                        
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            <span className="text-xs px-2.5 py-1 bg-white/10 text-gray-300 rounded-full">
                                                                {journal.categoryId ? 
                                                                    (categories.find(c => c.id === journal.categoryId)?.name || 'Noma\'lum toifa') : 
                                                                    'Toifa yo\'q'}
                                                            </span>
                                                            <span className="text-xs px-2.5 py-1 bg-white/10 text-gray-300 rounded-full">
                                                                {journal.issn || 'ISSN yo\'q'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-3 ml-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFavorite(journal.id);
                                                    }}
                                                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                                                >
                                                    <Star 
                                                        className={`h-5 w-5 ${
                                                            favoriteJournals.includes(journal.id) 
                                                                ? 'text-yellow-400 fill-current' 
                                                                : 'text-gray-400'
                                                        }`} 
                                                    />
                                                </button>
                                                
                                                <div className="text-right bg-black/20 rounded-lg p-2 min-w-[120px]">
                                                    {journal.pricingType === JournalPricingType.Fixed ? (
                                                        <div>
                                                            <span className="text-lg font-bold text-green-400">
                                                                {(journal.publicationFee !== undefined && journal.publicationFee !== null) ? 
                                                                    parseFloat(journal.publicationFee as any)?.toLocaleString() || '0' : '0'} so'm
                                                            </span>
                                                            <p className="text-xs text-gray-400 mt-1">To'liq to'lov</p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <span className="text-lg font-bold text-green-400">
                                                                {(journal.pricePerPage !== undefined && journal.pricePerPage !== null) ? 
                                                                    parseFloat(journal.pricePerPage as any)?.toLocaleString() || '0' : '0'} so'm
                                                            </span>
                                                            <p className="text-xs text-gray-400 mt-1">/bet</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {filteredJournals.length === 0 && (
                                <div className="text-center py-12">
                                    <Library className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                                    <p className="text-gray-400">Hech qanday jurnal topilmadi</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Step 2: Service Type Selection */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-white">Asosiy xizmat turini tanlang</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div 
                                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                                        submissionType === 'write' 
                                            ? 'border-blue-500 bg-blue-500/10' 
                                            : 'border-white/10 hover:border-white/20'
                                    }`}
                                    onClick={() => setSubmissionType('write')}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <PenSquare className="h-8 w-8 text-blue-400" />
                                        <h4 className="text-lg font-semibold text-white">Maqola yozish</h4>
                                    </div>
                                    <p className="text-gray-400 mb-4">Professional muharrirlar siz uchun ilmiy maqola yozadi</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-green-400">150,000 so'm</span>
                                        {submissionType === 'write' && <Check className="h-6 w-6 text-blue-400" />}
                                    </div>
                                </div>
                                
                                <div 
                                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                                        submissionType === 'publish' 
                                            ? 'border-blue-500 bg-blue-500/10' 
                                            : 'border-white/10 hover:border-white/20'
                                    }`}
                                    onClick={() => setSubmissionType('publish')}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <Newspaper className="h-8 w-8 text-purple-400" />
                                        <h4 className="text-lg font-semibold text-white">Nashr etish</h4>
                                    </div>
                                    <p className="text-gray-400 mb-4">O'z maqolangizni jurnalda nashr etish</p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            {selectedJournal?.pricingType === JournalPricingType.Fixed ? (
                                                <span className="text-lg font-bold text-green-400">
                                                    {parseFloat(selectedJournal.publicationFee as any)?.toLocaleString() || 0} so'm
                                                </span>
                                            ) : (
                                                <span className="text-lg font-bold text-green-400">
                                                    {parseFloat(selectedJournal?.pricePerPage as any)?.toLocaleString() || 0} so'm/bet
                                                </span>
                                            )}
                                            <p className="text-xs text-gray-400">
                                                {selectedJournal?.name || 'Jurnal tanlanmagan'}
                                            </p>
                                        </div>
                                        {submissionType === 'publish' && <Check className="h-6 w-6 text-blue-400" />}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="border-t border-white/10 pt-6">
                                <h4 className="text-lg font-semibold text-white mb-4">Qo'shimcha xizmatlar</h4>
                                <div className="space-y-3">
                                    <div 
                                        className={`flex items-center justify-between p-4 rounded-lg cursor-pointer ${
                                            additionalServices.fastTrack 
                                                ? 'bg-yellow-500/10 border border-yellow-500/30' 
                                                : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                        onClick={() => setAdditionalServices(prev => ({...prev, fastTrack: !prev.fastTrack}))}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Rocket className="h-5 w-5 text-yellow-400" />
                                            <div>
                                                <p className="font-medium text-white">Tezkor ko'rib chiqish</p>
                                                <p className="text-sm text-gray-400">Maqolani 24 soat ichida ko'rib chiqish</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-yellow-400">+50,000 so'm</span>
                                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                                additionalServices.fastTrack 
                                                    ? 'border-yellow-400 bg-yellow-400' 
                                                    : 'border-gray-400'
                                            }`}>
                                                {additionalServices.fastTrack && <Check className="h-3 w-3 text-black" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {submissionType && (
                                <div className="bg-white/5 rounded-lg p-4 mt-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Umumiy summa:</span>
                                        <span className="text-xl font-bold text-green-400">{currentTotal.toLocaleString()} so'm</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Step 3: File Upload and Details */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-white">Maqola faylini yuklang</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div 
                                        className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors h-full flex flex-col items-center justify-center"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <UploadCloud className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                                        <h4 className="text-lg font-medium text-white mb-2">PDF fayl yuklang</h4>
                                        <p className="text-gray-400 mb-4">Maqolani PDF formatda yuklang</p>
                                        <Button variant="secondary">Fayl tanlash</Button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept=".pdf"
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    {file ? (
                                        <div className="bg-white/5 rounded-lg p-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <FileText className="h-8 w-8 text-blue-400 mr-3" />
                                                    <div>
                                                        <p className="text-white font-medium">{fileName}</p>
                                                        <p className="text-gray-400 text-sm">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB • Taxminiy {pageCount} bet
                                                        </p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={handleRemoveFile}
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <XCircle className="h-6 w-6" />
                                                </button>
                                            </div>
                                            
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <Button 
                                                    onClick={generateAbstractAndKeywordsFromPDF}
                                                    disabled={isGenerating}
                                                    variant="secondary"
                                                    className="w-full"
                                                >
                                                    {isGenerating ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Yaratilmoqda...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="mr-2 h-4 w-4" />
                                                            Annotatsiya va kalit so'zlar yaratish
                                                        </>
                                                    )}
                                                </Button>
                                                {generationError && (
                                                    <p className="text-red-400 mt-2 text-sm">{generationError}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 rounded-lg p-8 text-center h-full flex items-center justify-center">
                                            <p className="text-gray-400">Fayl yuklanmagan</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h4 className="text-lg font-medium text-white">Maqola tavsifi</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Annotatsiya</label>
                                    <textarea
                                        value={generatedAbstract}
                                        onChange={(e) => setGeneratedAbstract(e.target.value)}
                                        rows={4}
                                        className="w-full"
                                        placeholder="Maqola annotatsiyasini kiriting..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Kalit so'zlar</label>
                                    <input
                                        type="text"
                                        value={generatedKeywords}
                                        onChange={(e) => setGeneratedKeywords(e.target.value)}
                                        className="w-full"
                                        placeholder="Kalit so'zlarni vergul bilan ajrating..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Step 4: Co-authors */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-white">Hammualliflar</h3>
                            
                            <div className="bg-white/5 rounded-lg p-6">
                                <h4 className="text-lg font-medium text-white mb-4">Asosiy muallif</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Ism</label>
                                        <input
                                            type="text"
                                            value={authorInfo.firstName}
                                            onChange={(e) => setAuthorInfo({...authorInfo, firstName: e.target.value})}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Familiya</label>
                                        <input
                                            type="text"
                                            value={authorInfo.lastName}
                                            onChange={(e) => setAuthorInfo({...authorInfo, lastName: e.target.value})}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={authorInfo.email}
                                            onChange={(e) => setAuthorInfo({...authorInfo, email: e.target.value})}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Tashkilot</label>
                                        <input
                                            type="text"
                                            value={authorInfo.affiliation}
                                            onChange={(e) => setAuthorInfo({...authorInfo, affiliation: e.target.value})}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-medium text-white">Qo'shimcha mualliflar</h4>
                                    <Button onClick={addCoAuthor} variant="secondary">
                                        <Users className="h-4 w-4 mr-2" />
                                        Hammuallif qo'shish
                                    </Button>
                                </div>
                                
                                {coAuthors.length > 0 ? (
                                    <div className="space-y-4">
                                        {coAuthors.map((coAuthor, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-white/5 rounded-lg">
                                                <div className="md:col-span-3">
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Ism</label>
                                                    <input
                                                        type="text"
                                                        value={coAuthor.firstName}
                                                        onChange={(e) => updateCoAuthor(index, 'firstName', e.target.value)}
                                                        className="w-full"
                                                        required
                                                    />
                                                </div>
                                                <div className="md:col-span-3">
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Familiya</label>
                                                    <input
                                                        type="text"
                                                        value={coAuthor.lastName}
                                                        onChange={(e) => updateCoAuthor(index, 'lastName', e.target.value)}
                                                        className="w-full"
                                                        required
                                                    />
                                                </div>
                                                <div className="md:col-span-3">
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                                    <input
                                                        type="email"
                                                        value={coAuthor.email}
                                                        onChange={(e) => updateCoAuthor(index, 'email', e.target.value)}
                                                        className="w-full"
                                                        required
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Tashkilot</label>
                                                    <input
                                                        type="text"
                                                        value={coAuthor.affiliation}
                                                        onChange={(e) => updateCoAuthor(index, 'affiliation', e.target.value)}
                                                        className="w-full"
                                                        required
                                                    />
                                                </div>
                                                <div className="md:col-span-1 flex items-end">
                                                    <button 
                                                        onClick={() => removeCoAuthor(index)}
                                                        className="text-red-400 hover:text-red-300 transition-colors p-2"
                                                    >
                                                        <XCircle className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-white/5 rounded-lg">
                                        <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                                        <p className="text-gray-400">Hozircha qo'shimcha mualliflar qo'shilmagan</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Step 5: Review and Confirm */}
                    {step === 5 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-white">Maqolani yuborish</h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <Card title="Jurnal ma'lumotlari" className="!p-4">
                                        <div className="flex items-center gap-3">
                                            <Library className="h-8 w-8 text-blue-400" />
                                            <div>
                                                <p className="font-semibold text-white">{selectedJournal?.name}</p>
                                                <p className="text-sm text-gray-400">{selectedJournal?.issn}</p>
                                            </div>
                                        </div>
                                    </Card>
                                    
                                    <Card title="Xizmat turi" className="!p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {submissionType === 'write' ? (
                                                    <PenSquare className="h-6 w-6 text-blue-400" />
                                                ) : (
                                                    <Newspaper className="h-6 w-6 text-purple-400" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-white">
                                                        {submissionType === 'write' ? 'Maqola yozish' : 'Nashr etish'}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        {submissionType === 'write' ? 'Professional muharrirlar tomonidan yoziladi' : 'O\'z maqolangiz nashr etiladi'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-green-400">
                                                {submissionType === 'write' 
                                                    ? '150,000 so\'m' 
                                                    : selectedJournal?.pricingType === JournalPricingType.Fixed
                                                        ? `${parseFloat(selectedJournal.publicationFee as any)?.toLocaleString() || 0} so'm`
                                                        : `${(parseFloat(selectedJournal?.pricePerPage as any) || 0) * pageCount} so'm`
                                                }
                                            </span>
                                        </div>
                                        
                                        {additionalServices.fastTrack && (
                                            <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Rocket className="h-4 w-4 text-yellow-400" />
                                                    <span className="text-sm">Tezkor ko'rib chiqish</span>
                                                </div>
                                                <span className="font-bold text-yellow-400">+50,000 so'm</span>
                                            </div>
                                        )}
                                    </Card>
                                    
                                    <Card title="Fayl ma'lumotlari" className="!p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-6 w-6 text-blue-400" />
                                                <div>
                                                    <p className="font-medium text-white truncate max-w-xs">{fileName}</p>
                                                    <p className="text-sm text-gray-400">{pageCount} bet</p>
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-400">{(file?.size || 0 / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </Card>
                                </div>
                                
                                <div className="space-y-6">
                                    <Card title="Mualliflar" className="!p-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                                                    {authorInfo.firstName.charAt(0)}{authorInfo.lastName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">
                                                        {authorInfo.firstName} {authorInfo.lastName} <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Asosiy</span>
                                                    </p>
                                                    <p className="text-sm text-gray-400">{authorInfo.email}</p>
                                                </div>
                                            </div>
                                            
                                            {coAuthors.map((coAuthor, index) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm font-bold">
                                                        {coAuthor.firstName.charAt(0)}{coAuthor.lastName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{coAuthor.firstName} {coAuthor.lastName}</p>
                                                        <p className="text-sm text-gray-400">{coAuthor.email}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                    
                                    <Card title="To'lov ma'lumotlari" className="!p-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Asosiy to'lov:</span>
                                                <span className="font-medium text-white">
                                                    {submissionType === 'write' 
                                                        ? '150,000 so\'m' 
                                                        : selectedJournal?.pricingType === JournalPricingType.Fixed
                                                            ? `${parseFloat(selectedJournal.publicationFee as any)?.toLocaleString() || 0} so'm`
                                                            : `${(parseFloat(selectedJournal?.pricePerPage as any) || 0) * pageCount} so'm`
                                                    }
                                                </span>
                                            </div>
                                            {additionalServices.fastTrack && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Tezkor ko'rib chiqish:</span>
                                                    <span className="font-medium text-yellow-400">+50,000 so'm</span>
                                                </div>
                                            )}
                                            <div className="border-t border-white/10 pt-2 mt-2 flex justify-between">
                                                <span className="font-medium text-white">Umumiy summa:</span>
                                                <span className="text-xl font-bold text-green-400">{currentTotal.toLocaleString()} so'm</span>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                            
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-yellow-400">Diqqat!</p>
                                        <p className="text-sm text-yellow-300">
                                            Maqola yuborilgandan so'ng uni tahrirlab bo'lmaydi. Barcha ma'lumotlarni tekshirib chiqing.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="mt-8 flex justify-between">
                    <Button variant="secondary" onClick={prevStep} disabled={step === 1}>
                        <ChevronLeft className="mr-2 h-4 w-4"/> Ortga
                    </Button>
                    {step < 5 ? (
                        <Button onClick={nextStep} disabled={(step === 1 && !selectedJournalId) || (step === 2 && !submissionType)}>
                            Keyingisi <ChevronRight className="ml-2 h-4 w-4"/>
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={!submissionType || loading}>
                             {loading ? 'Yuborilmoqda...' : (selectedJournal?.paymentModel === PaymentModel.PostPayment || (selectedJournal as any)?.payment_model === 'post-payment' ? 'Yuborish' : "To'lov va Yuborish")}
                        </Button>
                    )}
                </div>
            </div>

            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-white/10">
                        {paymentStatus === 'idle' && (
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-4">To'lovni tasdiqlash</h3>
                                <p className="text-gray-300 mb-2">Maqola yuborish uchun to'lov:</p>
                                <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30 mb-4">
                                    <p className="text-2xl font-bold text-white text-center">{currentTotal.toLocaleString()} so'm</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={(e) => handlePay(e)} className="flex-1">
                                        To'lovni Amalga Oshirish
                                    </Button>
                                    <Button variant="secondary" onClick={closePaymentModal} className="flex-1">
                                        Bekor qilish
                                    </Button>
                                </div>
                            </div>
                        )}
                        {paymentStatus === 'processing' && (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                <p className="text-lg font-medium text-gray-200">To'lov tasdiqlanmoqda...</p>
                            </div>
                        )}
                        {paymentStatus === 'success' && (
                            <div className="text-center py-8">
                                <div className="text-green-500 text-4xl mb-4">✓</div>
                                <p className="text-lg font-medium text-gray-200">To'lov muvaffaqiyatli!</p>
                                <p className="text-sm text-gray-400 mt-2">To'lov sahifasiga yo'naltirilmoqdasiz</p>
                            </div>
                        )}
                        {paymentStatus === 'failed' && (
                            <div>
                                <div className="text-red-500 text-4xl mb-4 text-center">✗</div>
                                <p className="text-lg font-medium text-gray-200 text-center">To'lovda xatolik!</p>
                                <p className="text-sm text-gray-400 max-w-xs mx-auto text-center mb-4">{paymentError}</p>
                                <div className="flex gap-3">
                                    <Button onClick={(e) => handlePay(e)} className="flex-1">Qayta Urinish</Button>
                                    <Button variant="secondary" onClick={closePaymentModal} className="flex-1">Yopish</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmitArticle;