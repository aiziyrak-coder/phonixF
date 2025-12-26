import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useNotifications } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Download, UploadCloud, Send, Languages, ArrowRight, User, Calendar, FileText, Check, Loader2 } from 'lucide-react';
import { apiService } from '../services/apiService';
import { TranslationRequest, TranslationStatus, Role } from '../types';

// Type for the API response which has different field names
interface TranslationRequestApiResponse {
    id: string;
    author: string;
    reviewer?: string;
    title: string;
    source_language: string;
    target_language: string;
    source_file_path: string;
    translated_file_path?: string;
    status: TranslationStatus;
    word_count: number;
    cost: number;
    submission_date: string;
    completion_date?: string;
    author_name?: string;
    reviewer_name?: string;
}

const TranslationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addNotification } = useNotifications();

    const [request, setRequest] = useState<TranslationRequestApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [translatedFile, setTranslatedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Fetch translation request data
    useEffect(() => {
        const fetchRequest = async () => {
            if (!id || !user) return;
            
            try {
                setLoading(true);
                setError(null);
                const response = await apiService.translations.get(id);
                const requestData = response.data || response;
                setRequest(requestData);
            } catch (err: any) {
                console.error('Failed to fetch translation request:', err);
                setError('Tarjima so\'rovi ma\'lumotlarini yuklashda xatolik yuz berdi.');
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [id, user]);

    if (!user || user.role !== Role.Reviewer) {
        return <Card title="Ruxsat Rad Etildi"><p>Ushbu sahifani ko'rish uchun sizda ruxsat yo'q.</p></Card>;
    }
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    
    if (error) {
        return (
            <Card title="Xatolik">
                <p className="text-red-400">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">Qayta urinish</Button>
            </Card>
        );
    }

    if (!request) {
        return <Card title="Xatolik"><p>Tarjima so'rovi topilmadi.</p></Card>;
    }

    const handleAcceptRequest = async () => {
        try {
            const updatedData = {
                ...request,
                status: TranslationStatus.Jarayonda,
                reviewer: user.id
            };
            
            const response = await apiService.translations.update(id!, updatedData);
            const updatedRequest = response.data || response;
            setRequest(updatedRequest);
            
            addNotification({
                message: `"${updatedRequest.title}" tarjima so'rovingiz ishga qabul qilindi.`,
                link: '/my-translations'
            });
        } catch (err: any) {
            console.error('Failed to accept translation request:', err);
            alert('Tarjima so\'rovini qabul qilishda xatolik yuz berdi.');
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setTranslatedFile(e.target.files[0]);
        }
    };

    const handleComplete = async () => {
        if (!translatedFile) {
            alert("Iltimos, avval tarjima qilingan faylni yuklang.");
            return;
        }

        try {
            setUploading(true);
            
            const updatedData = {
                ...request,
                status: TranslationStatus.Bajarildi,
                completion_date: new Date().toISOString(),
                file: translatedFile // This will be handled in apiService
            };
            
            const response = await apiService.translations.update(id!, updatedData);
            const updatedRequest = response.data || response;
            setRequest(updatedRequest);
            
            addNotification({
                message: `Sizning "${request.title}" nomli tarjima so'rovingiz bajarildi va tayyor faylni yuklab olishingiz mumkin.`,
                link: '/my-translations'
            });
            
            alert("Tarjima muvaffaqiyatli yakunlandi va muallifga xabar yuborildi.");
            navigate('/articles');
        } catch (err: any) {
            console.error('Failed to complete translation:', err);
            alert('Tarjimani yakunlashda xatolik yuz berdi.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card>
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
                        <Languages className="w-10 h-10 text-indigo-400" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">{request.title}</h2>
                             <p className="text-lg font-semibold text-indigo-300">
                                {request.source_language?.toUpperCase() || 'Noma\'lum'} <ArrowRight size={16} className="inline-block mx-2"/> {request.target_language?.toUpperCase() || 'Noma\'lum'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-6">
                         <div className="flex items-center gap-3 p-3 bg-white/5 rounded-md">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Muallif</p>
                                <p className="font-semibold text-white">{request.author_name || 'Noma\'lum'}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 p-3 bg-white/5 rounded-md">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Sana</p>
                                <p className="font-semibold text-white">{request.submission_date ? new Date(request.submission_date).toLocaleDateString() : 'Noma\'lum'}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 p-3 bg-white/5 rounded-md">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">So'zlar soni</p>
                                <p className="font-semibold text-white">{request.word_count?.toLocaleString() || 0} ta</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-md">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Narxi</p>
                                <p className="font-semibold text-white">{request.cost?.toLocaleString() || 0} so'm</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card title="Asosiy hujjat">
                    {request.source_file_path ? (
                        <a href={apiService.getMediaUrl(request.source_file_path)} download>
                            <Button variant="secondary" className="w-full">
                                <Download className="mr-2 h-4 w-4"/> Hujjatni yuklab olish
                            </Button>
                        </a>
                    ) : (
                        <p className="text-gray-400 text-center py-4">Hujjat mavjud emas</p>
                    )}
                </Card>

                {request.status === TranslationStatus.Yangi && (
                    <Card title="Harakatlar">
                        <Button onClick={handleAcceptRequest} className="w-full">
                           <Check className="mr-2 h-4 w-4"/> Ishga qabul qilish
                        </Button>
                    </Card>
                )}

                {request.status === TranslationStatus.Jarayonda && (
                    <Card title="Tarjimani yuklash">
                         <label htmlFor="file-upload" className="cursor-pointer">
                            <div className="p-8 border-2 border-dashed rounded-lg border-gray-600 text-center bg-white/5 hover:bg-white/10 transition-colors">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-400">{translatedFile ? `Tanlandi: ${translatedFile.name}` : 'Tayyor faylni tanlang'}</p>
                            </div>
                            <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                        </label>
                        <Button 
                            onClick={handleComplete} 
                            disabled={!translatedFile || uploading} 
                            className="w-full mt-4"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Yuklanmoqda...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4"/> Yakunlash va yuborish
                                </>
                            )}
                        </Button>
                    </Card>
                )}
                
                {request.status === TranslationStatus.Bajarildi && request.translated_file_path && (
                    <Card title="Tarjimani yuklab olish">
                        <a href={apiService.getMediaUrl(request.translated_file_path)} download>
                            <Button variant="primary" className="w-full">
                                <Download className="mr-2 h-4 w-4"/> Tarjimani Yuklash
                            </Button>
                        </a>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default TranslationDetail;