import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { TranslationStatus } from '../types';
import { Languages, Download, Clock, CheckCircle, RefreshCw, XCircle, FileText, Loader2 } from 'lucide-react';
// FIX: Import the Button component to resolve 'Cannot find name' error.
import Button from '../components/ui/Button';
import { apiService } from '../services/apiService';

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

const getStatusDisplayData = (status: TranslationStatus) => {
    switch (status) {
        case TranslationStatus.Yangi:
            return { text: 'Yangi', color: 'text-blue-400', icon: Clock };
        case TranslationStatus.Jarayonda:
            return { text: 'Jarayonda', color: 'text-yellow-400', icon: RefreshCw };
        case TranslationStatus.Bajarildi:
            return { text: 'Bajarildi', color: 'text-green-400', icon: CheckCircle };
        case TranslationStatus.BekorQilindi:
            return { text: 'Bekor Qilindi', color: 'text-red-400', icon: XCircle };
        default:
            return { text: status, color: 'text-gray-400', icon: FileText };
    }
};

const MyTranslations: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<TranslationRequestApiResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch translation requests
    useEffect(() => {
        const fetchRequests = async () => {
            if (!user) return;
            
            try {
                setLoading(true);
                setError(null);
                const response = await apiService.translations.list();
                
                // Ensure we're working with arrays
                const requestsArray = Array.isArray(response) 
                    ? response 
                    : (response?.data && Array.isArray(response.data) 
                        ? response.data 
                        : (response?.results && Array.isArray(response.results) 
                            ? response.results 
                            : []));
                
                setRequests(requestsArray);
            } catch (err: any) {
                console.error('Failed to fetch translation requests:', err);
                setError('Tarjima so\'rovlari ma\'lumotlarini yuklashda xatolik yuz berdi.');
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [user]);

    const myRequests = useMemo(() => {
        if (!user) return [];
        return requests
            .filter(req => req.author === user.id)
            .sort((a, b) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime());
    }, [user, requests]);

    if (!user) {
        return <Card title="Xatolik"><p>Foydalanuvchi topilmadi.</p></Card>;
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

    return (
        <Card title="Mening Tarjimalarim">
            <p className="text-gray-300 mb-6 -mt-4">Bu yerda siz buyurtma qilgan tarjimalaringiz holatini kuzatib borishingiz mumkin.</p>
            <div className="space-y-4">
                {myRequests.length > 0 ? (
                    myRequests.map(req => {
                        const statusInfo = getStatusDisplayData(req.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div key={req.id} className="p-5 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                                            <Languages className="text-indigo-400"/>
                                            {req.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 mt-2">
                                            {req.source_language.toUpperCase()} → {req.target_language.toUpperCase()}
                                        </p>
                                        <div className="text-xs text-gray-500 mt-2">
                                            <span>Yuborilgan sana: {new Date(req.submission_date).toLocaleDateString()}</span>
                                            {req.status === TranslationStatus.Jarayonda && req.reviewer_name && (
                                                <span className="ml-2 pl-2 border-l border-gray-600">
                                                    Tarjimon: {req.reviewer_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                                        <div className={`flex items-center gap-2 font-semibold ${statusInfo.color}`}>
                                            <StatusIcon className={`w-5 h-5 ${req.status === TranslationStatus.Jarayonda ? 'animate-spin' : ''}`} />
                                            <span>{statusInfo.text}</span>
                                        </div>
                                        {req.status === TranslationStatus.Bajarildi && req.translated_file_path && (
                                            <a href={apiService.getMediaUrl(req.translated_file_path)} download>
                                                <Button variant="secondary" className="w-full">
                                                    <Download className="mr-2 h-4 w-4"/> Tarjimani Yuklash
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12">
                        <Languages className="mx-auto h-16 w-16 text-gray-500" />
                        <h3 className="mt-4 text-xl font-semibold text-white">Sizda Hozircha Tarjima Buyurtmalari Yo'q</h3>
                        <p className="mt-2 text-sm text-gray-400">"Xizmatlar" bo'limi orqali yangi tarjima buyurtma qilishingiz mumkin.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default MyTranslations;