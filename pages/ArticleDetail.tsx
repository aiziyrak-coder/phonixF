import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { Role, ArticleStatus, ActivityLogEvent, SubmissionCertificateData } from '../types';
import { Check, X, Award, UploadCloud, BookOpen, Download, Edit, Send, GitCommit, UserCheck, FileCheck2, BookUp, XCircle, Clock, FileInput, CheckCircle, Shield, Bot, ExternalLink, Printer, Eye, FileText, Inbox } from 'lucide-react';
import SubmissionCertificate from '../components/SubmissionCertificate';
import { apiService } from '../services/apiService';

// Type for the API response which has different field names
interface ArticleApiResponse {
    id: string;
    title: string;
    abstract: string;
    keywords: string[];
    status: ArticleStatus;
    status_label?: string;
    workflow_stage?: string;
    workflow_steps?: { name: string; done: boolean; current: boolean }[];
    status_timeline?: { status: string; date: string; comment?: string; responsible?: string }[];
    author: string;
    author_name?: string;
    journal: string;
    journal_name?: string;
    submission_date: string;
    fast_track: boolean;
    file_url?: string;
    views: number;
    downloads: number;
    activity_logs?: ActivityLogEvent[];
}

const ArticleDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [article, setArticle] = useState<ArticleApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activityLogs, setActivityLogs] = useState<ActivityLogEvent[]>([]);
    const [showCertificate, setShowCertificate] = useState(false);
    const [certificateData, setCertificateData] = useState<SubmissionCertificateData | null>(null);

    useEffect(() => {
        const fetchArticleData = async () => {
            if (!id || !user) return;
            
            try {
                setLoading(true);
                setError(null);
                
                // Fetch article data
                const articleResponse = await apiService.articles.get(id);
                const articleData = articleResponse.data || articleResponse;
                setArticle(articleData);
                
                // Fetch activity logs from backend response
                const logs = Array.isArray(articleData.activity_logs) ? articleData.activity_logs : [];
                setActivityLogs(logs);
                
                // Set certificate data
                setCertificateData({
                    referenceNumber: `REF-${articleData.id.substring(0, 8).toUpperCase()}`,
                    issueDate: new Date().toISOString(),
                    authorFullName: `${user.firstName} ${user.lastName}`,
                    authorAffiliation: user.affiliation,
                    articleTitle: articleData.title,
                    journalName: articleData.journal_name || 'Noma\'lum jurnal',
                    submissionDate: articleData.submission_date || new Date().toISOString(),
                    currentStatus: articleData.status_label || articleData.status,
                    articleId: articleData.id
                });
            } catch (err: any) {
                console.error('Failed to fetch article data:', err);
                setError('Maqola ma\'lumotlarini yuklashda xatolik yuz berdi.');
            } finally {
                setLoading(false);
            }
        };

        fetchArticleData();
    }, [id, user]);

    const handleStatusUpdate = async (status: ArticleStatus, reason?: string) => {
        if (!id) return;
        
        try {
            await apiService.articles.updateStatus(id, status, reason);
            // Refresh article data
            const articleResponse = await apiService.articles.get(id);
            const articleData = articleResponse.data || articleResponse;
            setArticle(articleData);
        } catch (err) {
            console.error('Failed to update article status:', err);
            setError('Maqola holatini yangilashda xatolik yuz berdi.');
        }
    };

    const handleDownload = () => {
        if (!article?.file_url) return;
        
        // In a real app, this would download the file
        window.open(article.file_url, '_blank');
        
        // Increment download count
        if (id) {
            apiService.articles.incrementDownloads(id).catch(err => {
                console.error('Failed to increment download count:', err);
            });
        }
    };

    const handleView = () => {
        if (!article?.file_url) return;
        
        // In a real app, this would open the file in a viewer
        window.open(article.file_url, '_blank');
        
        // Increment view count
        if (id) {
            apiService.articles.incrementViews(id).catch(err => {
                console.error('Failed to increment view count:', err);
            });
        }
    };

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

    if (!article) {
        return (
            <Card title="Maqola topilmadi">
                <p>Ko'rsatilgan ID bo'yicha maqola topilmadi.</p>
                <Button onClick={() => navigate('/articles')} className="mt-4">Orqaga qaytish</Button>
            </Card>
        );
    }

    const getStatusDisplayData = (status: string): { text: string; color: string; icon: React.ElementType } => {
        const map: Record<string, { text: string; color: string; icon: React.ElementType }> = {
            'Draft': { text: 'Yangi topshirildi', color: 'bg-gray-500/20 text-gray-300', icon: FileText },
            'Yangi': { text: 'Yangi topshirildi', color: 'bg-blue-500/20 text-blue-300', icon: Inbox },
            'WithEditor': { text: 'Tekshiruvda', color: 'bg-indigo-500/20 text-indigo-300', icon: Edit },
            'QabulQilingan': { text: 'Ko\'rib chiqilmoqda', color: 'bg-yellow-500/20 text-yellow-300', icon: CheckCircle },
            'WritingInProgress': { text: 'Tuzatish kiritilmoqda', color: 'bg-cyan-500/20 text-cyan-300', icon: Edit },
            'NashrgaYuborilgan': { text: 'Nashrga tayyorlanmoqda', color: 'bg-purple-500/20 text-purple-300', icon: Send },
            'Revision': { text: 'To\'ldirish talab qilinadi', color: 'bg-orange-500/20 text-orange-300', icon: Edit },
            'Accepted': { text: 'Qabul qilindi', color: 'bg-teal-500/20 text-teal-300', icon: Check },
            'Published': { text: 'Nashr etildi', color: 'bg-green-500/20 text-green-300', icon: BookOpen },
            'Rejected': { text: 'Jarayon to\'xtatildi', color: 'bg-red-500/20 text-red-300', icon: XCircle },
        };
        return map[status] || { text: status, color: 'bg-gray-500/20 text-gray-300', icon: FileText };
    };

    const statusData = getStatusDisplayData(article.status);
    const StatusIcon = statusData.icon;
    const workflowSteps = Array.isArray(article.workflow_steps) ? article.workflow_steps : [];
    const workflowProgress = workflowSteps.length > 0
        ? Math.round((workflowSteps.filter(s => s.done || s.current).length / workflowSteps.length) * 100)
        : 0;
    const statusTimeline = Array.isArray(article.status_timeline) ? article.status_timeline : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Link to="/articles" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-2">
                        <span>←</span> Maqolalar ro'yxati
                    </Link>
                    <h1 className="text-3xl font-bold text-white">{article.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${statusData.color}`}>
                        <StatusIcon size={16} />
                        {article.status_label || statusData.text}
                    </span>

                    {article.fast_track && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300 flex items-center gap-2">
                            <Award size={16} />
                            Tezkor
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Jarayon holati">
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-300">Joriy bosqich: {article.workflow_stage || 'Topshirildi'}</span>
                                    <span className="text-blue-300 font-semibold">{workflowProgress}%</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${workflowProgress}%` }} />
                                </div>
                            </div>

                            {workflowSteps.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                    {workflowSteps.map((step) => (
                                        <div
                                            key={step.name}
                                            className={`p-2 rounded text-center border ${step.current ? 'border-blue-400 text-blue-300 bg-blue-500/10' : step.done ? 'border-green-500/30 text-green-300 bg-green-500/10' : 'border-white/10 text-gray-400 bg-white/5'}`}
                                        >
                                            {step.name}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-white">Status tarixi</h4>
                                {statusTimeline.length > 0 ? (
                                    statusTimeline.map((item, index) => (
                                        <div key={`${item.status}-${item.date}-${index}`} className="p-3 bg-white/5 rounded-lg border border-white/10">
                                            <p className="text-white font-medium">{item.status}</p>
                                            <p className="text-xs text-gray-400 mt-1">{item.date ? new Date(item.date).toLocaleString() : 'Sana yo\'q'}</p>
                                            {item.comment ? <p className="text-sm text-gray-300 mt-1">Izoh: {item.comment}</p> : null}
                                            {item.responsible ? <p className="text-xs text-gray-500 mt-1">Mas'ul: {item.responsible}</p> : null}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-400">
                                        Status tarixi hali mavjud emas.
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card title="Asosiy ma'lumotlar">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-1">Muallif(lar)</h3>
                                <p className="text-white">{article.author_name || 'Noma\'lum'}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-1">Annotatsiya</h3>
                                <p className="text-gray-300">{article.abstract || 'Annotatsiya mavjud emas'}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-1">Kalit so'zlar</h3>
                                <div className="flex flex-wrap gap-2">
                                    {article.keywords?.map((keyword: string, index: number) => (
                                        <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                                            {keyword}
                                        </span>
                                    )) || <span className="text-gray-400">Kalit so'zlar mavjud emas</span>}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Fayllar">
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button 
                                    onClick={handleView}
                                    variant="secondary"
                                    className="flex items-center justify-center gap-2 flex-1"
                                >
                                    <Eye size={18} />
                                    Ko'rish
                                </Button>
                                <Button 
                                    onClick={handleDownload}
                                    variant="secondary"
                                    className="flex items-center justify-center gap-2 flex-1"
                                >
                                    <Download size={18} />
                                    Yuklab olish
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card title="Faoliyat jurnali">
                        <div className="space-y-4">
                            {activityLogs.map(log => (
                                <div key={log.id} className="flex gap-4 p-4 bg-white/5 rounded-lg">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <GitCommit className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-medium text-white">{log.action}</span>
                                            <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-300 mt-1">{log.details || ''}</p>
                                        {log.userId && (
                                            <span className="text-xs text-gray-500">Foydalanuvchi ID: {log.userId}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card title="Boshqaruv">
                        <div className="space-y-4">
                            {user?.role === Role.Author && (
                                <Button 
                                    onClick={() => navigate(`/submit/${id}`)}
                                    variant="secondary"
                                    className="w-full flex items-center justify-center gap-2"
                                >
                                    <Edit size={18} />
                                    Tahrirlash
                                </Button>
                            )}
                            
                            {user?.role === Role.JournalAdmin && (
                                <>
                                    <Button 
                                        onClick={() => handleStatusUpdate(ArticleStatus.Accepted)}
                                        variant="primary"
                                        className="w-full flex items-center justify-center gap-2"
                                    >
                                        <Check size={18} />
                                        Qabul qilish
                                    </Button>
                                    <Button 
                                        onClick={() => handleStatusUpdate(ArticleStatus.Revision)}
                                        variant="secondary"
                                        className="w-full flex items-center justify-center gap-2"
                                    >
                                        <Edit size={18} />
                                        Tahrirga qaytarish
                                    </Button>
                                    <Button 
                                        onClick={() => handleStatusUpdate(ArticleStatus.Rejected)}
                                        variant="danger"
                                        className="w-full flex items-center justify-center gap-2"
                                    >
                                        <X size={18} />
                                        Rad etish
                                    </Button>
                                </>
                            )}
                            
                            <Button 
                                onClick={() => setShowCertificate(true)}
                                variant="secondary"
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <Printer size={18} />
                                Sertifikat chop etish
                            </Button>
                        </div>
                    </Card>

                    <Card title="Statistika">
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Ko'rishlar</span>
                                <span className="text-white font-medium">{article.views || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Yuklab olishlar</span>
                                <span className="text-white font-medium">{article.downloads || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Yuborilgan sana</span>
                                <span className="text-white font-medium">
                                    {article.submission_date ? new Date(article.submission_date).toLocaleDateString() : 'Noma\'lum'}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {showCertificate && certificateData && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Yuborish sertifikati</h3>
                            <Button onClick={() => setShowCertificate(false)} variant="secondary">Yopish</Button>
                        </div>
                        <div className="p-4 max-h-[80vh] overflow-y-auto">
                            <SubmissionCertificate data={certificateData} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArticleDetail;