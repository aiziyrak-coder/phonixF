import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Article, ArticleStatus, Role, TranslationRequest, TranslationStatus, User } from '../types';
import Card from '../components/ui/Card';
import { Search, Rocket, Languages, ArrowRight, FileText, Printer, Loader2, ChevronDown, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import AuthorArticleReport from '../components/AuthorArticleReport';
import { apiService } from '../services/apiService';

// Type for the API response which has different field names
interface ArticleApiResponse {
    id: string;
    title: string;
    abstract: string;
    keywords: string[];
    status: ArticleStatus;
    author: string;
    author_name?: string;
    journal: string;
    journal_name?: string;
    submission_date: string;
    fast_track: boolean;
    file_url?: string;
    views: number;
    downloads: number;
}

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

interface JournalApiResponse {
    id: string;
    name: string;
    issn: string;
    category: string;
    journal_admin?: string;
    journalAdminId?: string;
    journalAdmin?: string;
    admin_id?: string;
    admin?: { id: string };
}

// Convert API response to Article type for AuthorArticleReport
const convertToArticleType = (apiArticle: ArticleApiResponse): Article => {
    return {
        id: apiArticle.id,
        title: apiArticle.title,
        abstract: apiArticle.abstract,
        keywords: apiArticle.keywords,
        status: apiArticle.status,
        authorId: apiArticle.author,
        journalId: apiArticle.journal,
        submissionDate: apiArticle.submission_date,
        fastTrack: apiArticle.fast_track,
        versions: [],
        analytics: {
            views: apiArticle.views,
            downloads: apiArticle.downloads,
            citations: 0, // Default value since API doesn't provide this
        }
    };
};

const getStatusDisplayData = (status: ArticleStatus | TranslationStatus): { text: string; color: string } => {
    const map: Record<ArticleStatus | TranslationStatus, { text: string; color: string }> = {
        [ArticleStatus.Draft]: { text: 'Qoralama', color: 'bg-gray-500/20 text-gray-300' },
        [ArticleStatus.Yangi]: { text: 'Yangi', color: 'bg-blue-500/20 text-blue-300' },
        [ArticleStatus.WithEditor]: { text: 'Redaktorda', color: 'bg-indigo-500/20 text-indigo-300' },
        [ArticleStatus.QabulQilingan]: { text: 'Qabul Qilingan', color: 'bg-yellow-500/20 text-yellow-300' },
        [ArticleStatus.Revision]: { text: 'Tahrirga qaytarilgan', color: 'bg-orange-500/20 text-orange-300' },
        [ArticleStatus.Accepted]: { text: 'Ma\'qullangan', color: 'bg-teal-500/20 text-teal-300' },
        [ArticleStatus.Published]: { text: 'Nashr etilgan', color: 'bg-green-500/20 text-green-300' },
        [ArticleStatus.Rejected]: { text: 'Rad etilgan', color: 'bg-red-500/20 text-red-300' },
        [ArticleStatus.NashrgaYuborilgan]: { text: 'Nashrga Yuborilgan', color: 'bg-purple-500/20 text-purple-300' },
        [ArticleStatus.WritingInProgress]: { text: 'Yozilmoqda', color: 'bg-cyan-500/20 text-cyan-300' },
        // FIX: Removed duplicate [TranslationStatus.Yangi] key which has the same value as [ArticleStatus.Yangi]
        [TranslationStatus.Jarayonda]: { text: 'Jarayonda', color: 'bg-yellow-500/20 text-yellow-300' },
        [TranslationStatus.Bajarildi]: { text: 'Bajarildi', color: 'bg-green-500/20 text-green-300' },
        [TranslationStatus.BekorQilindi]: { text: 'Bekor Qilindi', color: 'bg-red-500/20 text-red-300' },
    };
    return map[status] || { text: status, color: 'bg-gray-500/20 text-gray-300' };
};

const ArticleItem: React.FC<{ article: ArticleApiResponse, isAdmin?: boolean, isJournalAdmin?: boolean, userId?: string, journalIds?: string[], onStatusUpdate?: () => void }> = ({ 
    article, 
    isAdmin = false, 
    isJournalAdmin = false, 
    userId, 
    journalIds,
    onStatusUpdate
}) => {
    const navigate = useNavigate();
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(article.status);
    const [isUpdating, setIsUpdating] = useState(false);
    const statusData = getStatusDisplayData(currentStatus);

    // Determine if user can update status
    const canUpdateStatus = isAdmin || (isJournalAdmin && journalIds && journalIds.includes(article.journal));

    const handleStatusUpdate = async (newStatus: ArticleStatus) => {
        if (!canUpdateStatus) return;
        
        try {
            setIsUpdating(true);
            console.log('Updating status to:', newStatus); // Debug log
            console.log('Sending status update request with status:', newStatus, 'type:', typeof newStatus);
            
            // Validate that newStatus is not null/undefined
            if (!newStatus) {
                console.error('Status is null or undefined, cannot update');
                return;
            }
            
            // Ensure the status is properly formatted as a string
            const statusString = String(newStatus);
            console.log('Formatted status string:', statusString);
            
            await apiService.articles.updateStatus(article.id, statusString);
            console.log('Status update request completed');
            setCurrentStatus(newStatus);
            setIsStatusDropdownOpen(false);
            if (onStatusUpdate) {
                onStatusUpdate();
            }
        } catch (error) {
            console.error('Failed to update article status:', error);
            // Show error message to user
        } finally {
            setIsUpdating(false);
        }
    };

    // Define available status options based on current status
    const getAvailableStatusOptions = () => {
        // Common statuses that can be changed to
        const allStatuses = [
            ArticleStatus.Draft,
            ArticleStatus.Yangi,
            ArticleStatus.WithEditor,
            ArticleStatus.QabulQilingan,
            ArticleStatus.Revision,
            ArticleStatus.Accepted,
            ArticleStatus.Published,
            ArticleStatus.Rejected,
            ArticleStatus.NashrgaYuborilgan,
            ArticleStatus.WritingInProgress
        ];
        

        
        // Filter based on user role or other logic if needed
        return allStatuses;
    };

    return (
        <div 
            className="p-5 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer border border-transparent hover:border-white/10"
            onClick={() => navigate(`/articles/${article.id}`)}
        >
            <div className="flex justify-between items-start gap-4">
                <h4 className="text-lg font-semibold text-blue-400">{article.title}</h4>
                <div className="flex items-center gap-2 shrink-0">
                    {article.fast_track && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap bg-yellow-500/20 text-yellow-300 flex items-center gap-1.5">
                            <Rocket size={14} /> TOP
                        </span>
                    )}
                    <div className="relative">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${statusData.color}`}>
                                {statusData.text}
                            </span>
                            {canUpdateStatus && (
                                <div className="relative">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsStatusDropdownOpen(!isStatusDropdownOpen);
                                        }}
                                        className="text-xs bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 transition-colors"
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                    
                                    {isStatusDropdownOpen && (
                                        <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                                            <div className="py-1 max-h-60 overflow-y-auto">
                                                {getAvailableStatusOptions().map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            console.log('Status button clicked with status:', status);
                                                            handleStatusUpdate(status);
                                                        }}
                                                        disabled={isUpdating}
                                                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                                                            currentStatus === status 
                                                                ? 'bg-blue-600/30 text-blue-300' 
                                                                : 'text-gray-300 hover:bg-gray-700/50'
                                                        }`}
                                                    >
                                                        <Check size={14} className={currentStatus === status ? 'opacity-100' : 'opacity-0'} />
                                                        {getStatusDisplayData(status).text}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <p className="text-sm text-gray-400 mt-2 line-clamp-2">{article.abstract}</p>
            <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                <span>{article.author_name || 'Noma\'lum muallif'}</span>
                <span>{new Date(article.submission_date).toLocaleDateString()}</span>
            </div>
        </div>
    );
}

const TranslationItem: React.FC<{ request: TranslationRequestApiResponse }> = ({ request }) => {
    const navigate = useNavigate();
    const statusData = getStatusDisplayData(request.status);

    return (
        <div 
            className="p-5 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer border border-transparent hover:border-white/10"
            onClick={() => navigate(`/translations/${request.id}`)}
        >
            <div className="flex justify-between items-start gap-4">
                <h4 className="text-lg font-semibold text-indigo-400 flex items-center gap-2"><Languages size={20}/> {request.title}</h4>
                <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${statusData.color}`}>
                    {statusData.text}
                </span>
            </div>
            <div className="flex justify-between items-end mt-4">
                <div>
                     <p className="text-sm text-gray-400 mt-2">
                        {request.source_language?.toUpperCase() || 'Noma\'lum'} <ArrowRight size={14} className="inline-block mx-1"/> {request.target_language?.toUpperCase() || 'Noma\'lum'}
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                        <span>Muallif: {request.author_name || 'Noma\'lum'}</span>
                        <span className="mx-2">|</span>
                        <span>Sana: {new Date(request.submission_date).toLocaleDateString()}</span>
                    </div>
                </div>
                 <span className="text-sm font-semibold text-green-400">{request.cost?.toLocaleString() || 0} so'm</span>
            </div>
        </div>
    );
};

const Articles: React.FC = () => {
    const { user } = useAuth();
    
    // Handle both string and enum role values
    const userRole = typeof user?.role === 'string' ? user.role.toLowerCase() : user?.role;
    const isJournalAdmin = userRole === Role.JournalAdmin || userRole === 'journal_admin' || userRole === 'journaladmin';
    
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(user?.role === Role.Reviewer ? 'reviews' : isJournalAdmin ? 'new' : 'all');
    const [showReportModal, setShowReportModal] = useState(false);
    const [articles, setArticles] = useState<ArticleApiResponse[]>([]);
    const [translations, setTranslations] = useState<TranslationRequestApiResponse[]>([]);
    const [journals, setJournals] = useState<JournalApiResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Different tabs for different roles
    const authorTabs = []; // No tabs for author view on this page
    // FIX: Explicitly type the array to allow a union of statuses and avoid type errors.
    const reviewerTabs: { id: string; label: string; statuses: (ArticleStatus | TranslationStatus)[] }[] = [
        { id: 'reviews', label: 'Maqola Taqrizlari', statuses: [ArticleStatus.QabulQilingan] },
        { id: 'translations', label: 'Tarjimalar', statuses: [TranslationStatus.Yangi, TranslationStatus.Jarayonda] },
    ];
    const journalAdminTabs = [
        { id: 'new', label: 'Yangi Kelganlar', statuses: [ArticleStatus.Yangi] },
        { id: 'with-editor', label: 'Redaktorda', statuses: [ArticleStatus.WithEditor] },
        { id: 'in-review', label: 'Tekshiruvda', statuses: [ArticleStatus.QabulQilingan] },
        { id: 'ready', label: 'Nashrga Tayyorlar', statuses: [ArticleStatus.NashrgaYuborilgan] },
        { id: 'published', label: 'Nashr etilgan', statuses: [ArticleStatus.Published] },
        { id: 'all', label: 'Barcha Maqolalar', statuses: [] }, // All statuses for 'all' tab
    ];

    let title = "Maqolalar";
    switch (userRole) {
        case Role.Author: 
        case 'author': 
            title = "Mening Maqolalarim"; 
            break;
        case Role.Reviewer: 
        case 'reviewer': 
            title = "Ish Stoli"; 
            break;
        case Role.JournalAdmin: 
        case 'journal_admin': 
        case 'journaladmin': 
            title = "Jurnal Maqolalari"; 
            break;
        case Role.SuperAdmin: 
        case 'super_admin': 
        case 'superadmin': 
            title = "Tizimdagi Barcha Maqolalar"; 
            break;
    }
    
    const articlesToShow: ArticleApiResponse[] = useMemo(() => {
        if (isJournalAdmin) {
            // Handle field name differences between backend and frontend
            // Also handle cases where user ID might be in different fields
            const userId = user.id || (user as any).userId || (user as any).user_id;
            
            const managedJournals = journals.filter(j => {
                // Check multiple possible field names for journal admin
                const journalAdminId = j.journal_admin || j.journalAdminId || j.journalAdmin || j.admin_id || (j.admin && j.admin.id);
                return journalAdminId === userId;
            });
            
            const managedJournalIds = managedJournals.map(j => j.id);
            
            const selectedTab = journalAdminTabs.find(t => t.id === activeTab);
            // If no matching tab, return empty array
            if (!selectedTab) return [];
            
            return articles.filter(a => {
                const journalMatch = managedJournalIds.includes(a.journal);
                // For 'all' tab, show all articles regardless of status
                const statusMatch = selectedTab.id === 'all' || selectedTab?.statuses.includes(a.status as ArticleStatus);
                return journalMatch && statusMatch;
            }).sort((a, b) => (b.fast_track ? 1 : 0) - (a.fast_track ? 1 : 0));
        }
        
        switch (user.role) {
            case Role.Author:
                // All articles are already filtered by author on the backend
                return articles;
            case Role.Reviewer:
                {
                    if (activeTab === 'reviews') {
                        const selectedTab = reviewerTabs.find(t => t.id === activeTab);
                        return articles
                            .filter(a => selectedTab?.statuses.includes(a.status as ArticleStatus))
                            .sort((a, b) => (b.fast_track ? 1 : 0) - (a.fast_track ? 1 : 0));
                    }
                    return []; // Translations are handled separately
                }
            case Role.SuperAdmin:
                return articles;
            default:
                return [];
        }
    }, [user, activeTab, articles, journals, isJournalAdmin]);

    const translationsToShow: TranslationRequestApiResponse[] = useMemo(() => {
        if (user.role !== Role.Reviewer || activeTab !== 'translations') return [];
        return translations.filter(tr => 
            tr.status === TranslationStatus.Yangi || 
            (tr.reviewer === user.id && tr.status === TranslationStatus.Jarayonda)
        );
    }, [user, activeTab, translations]);

    const filteredArticles = useMemo(() => {
        if (!searchQuery) return articlesToShow;
        const lowercasedQuery = searchQuery.toLowerCase();
        return articlesToShow.filter(article =>
            article.title.toLowerCase().includes(lowercasedQuery) ||
            (article.keywords && article.keywords.join(' ').toLowerCase().includes(lowercasedQuery))
        );
    }, [searchQuery, articlesToShow]);
    
    const filteredTranslations = useMemo(() => {
        if (!searchQuery) return translationsToShow;
        const lowercasedQuery = searchQuery.toLowerCase();
        return translationsToShow.filter(req =>
            req.title.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery, translationsToShow]);


    // Calculate tab counts using useMemo to ensure hooks are always called
    const reviewerTabCounts = useMemo(() => {
        return reviewerTabs.map(tab => {
            let count = 0;
            if (tab.id === 'translations') {
                count = translations.filter(tr => 
                    (tab.statuses as TranslationStatus[]).includes(tr.status) && (!tr.reviewer || tr.reviewer === user.id)
                ).length;
            } else if (tab.statuses) {
                count = articles.filter(a => {
                    const statusMatch = (tab.statuses as ArticleStatus[]).includes(a.status);
                    // For Reviewer article reviews
                    if (tab.id === 'reviews') {
                        return statusMatch;
                    }
                    return statusMatch;
                }).length;
            }
            return { id: tab.id, count };
        });
    }, [articles, translations, reviewerTabs]);

    const journalAdminTabCounts = useMemo(() => {
        // Handle field name differences between backend and frontend
        // Also handle cases where user ID might be in different fields
        const userId = user.id || (user as any).userId || (user as any).user_id;
        
        const managedJournals = journals.filter(j => {
            // Check multiple possible field names for journal admin
            const journalAdminId = j.journal_admin || j.journalAdminId || j.journalAdmin || j.admin_id || (j.admin && j.admin.id);
            return journalAdminId === userId;
        });
        
        const managedJournalIds = managedJournals.map(j => j.id);
        return journalAdminTabs.map(tab => {
            let count = 0;
            if (tab.statuses !== undefined) {  // Check if statuses is defined instead of checking truthiness
                count = articles.filter(a => {
                    const statusMatch = tab.id === 'all' || (tab.statuses as ArticleStatus[]).includes(a.status);
                    return statusMatch && managedJournalIds.includes(a.journal);
                }).length;
            }
            return { id: tab.id, count };
        });
    }, [user, articles, journals, journalAdminTabs]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            setError(null);
            
            // Fetch data based on user role
            const [articlesData, translationsData, journalsData] = await Promise.all([
                user.role === Role.Author 
                    ? apiService.articles.list({ author: user.id })
                    : apiService.articles.list(),
                apiService.translations.list(),
                apiService.journals.list()
            ]);
            
            // Ensure we're working with arrays and handle pagination
            let articlesArray = [];
            if (Array.isArray(articlesData)) {
                articlesArray = articlesData;
            } else if (articlesData && typeof articlesData === 'object' && 'results' in articlesData && Array.isArray(articlesData.results)) {
                articlesArray = articlesData.results;
            } else if (articlesData?.data && Array.isArray(articlesData.data)) {
                articlesArray = articlesData.data;
            }
            
            const translationsArray = Array.isArray(translationsData) 
                ? translationsData 
                : (translationsData?.data && Array.isArray(translationsData.data) 
                    ? translationsData.data 
                    : (translationsData?.results && Array.isArray(translationsData.results) 
                        ? translationsData.results 
                        : []));
            
            const journalsArray = Array.isArray(journalsData) 
                ? journalsData 
                : (journalsData?.data && Array.isArray(journalsData.data) 
                    ? journalsData.data 
                    : (journalsData?.results && Array.isArray(journalsData.results) 
                        ? journalsData.results 
                        : []));
            
            setArticles(articlesArray);
            setTranslations(translationsArray);
            setJournals(journalsArray);
        } catch (error: any) {
            console.error('Failed to fetch articles data:', error);
            setError('Failed to load articles data. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle early returns after all hooks are declared
    if (!user) return null;
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    
    if (error) {
        return (
            <Card title="Error">
                <p className="text-red-400">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
            </Card>
        );
    }

    const renderTabs = (tabs: {id: string, label: string, statuses?: (ArticleStatus | TranslationStatus)[]}[], tabCounts: {id: string, count: number}[]) => {
        return (
             <div className="mb-6 border-b border-white/10 flex">
                {tabs.map(tab => {
                    const tabCount = tabCounts.find(tc => tc.id === tab.id)?.count || 0;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-b-2 border-blue-400 text-blue-400'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab.label} <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-gray-300'}`}>{tabCount}</span>
                        </button>
                    )
                })}
            </div>
        )
    }
    
    const handlePrintReport = () => {
        window.print();
    };

    const renderContent = () => {
        if (user.role === Role.Reviewer && activeTab === 'translations') {
            return (
                <div className="space-y-4">
                    {filteredTranslations.length > 0 ? (
                        filteredTranslations.map(req => <TranslationItem key={req.id} request={req} />)
                    ) : (
                        <p className="text-center text-gray-400 py-8">
                            {searchQuery 
                                ? `"${searchQuery}" bo'yicha hech narsa topilmadi.` 
                                : 'Yangi tarjima so\'rovlari mavjud emas.'}
                        </p>
                    )}
                </div>
            );
        }

        // Determine if user is super admin or journal admin
        const isAdmin = user.role === Role.SuperAdmin;
        const isJournalAdmin = userRole === Role.JournalAdmin || userRole === 'journal_admin' || userRole === 'journaladmin';
        
        // Get the journal IDs for journal admins
        let journalAdminIds = [];
        if (isJournalAdmin) {
            const userId = user.id || (user as any).userId || (user as any).user_id;
            const managedJournals = journals.filter(j => {
                const journalAdminId = j.journal_admin || j.journalAdminId || j.journalAdmin || j.admin_id || (j.admin && j.admin.id);
                return journalAdminId === userId;
            });
            journalAdminIds = managedJournals.map(j => j.id);
        }

        return (
            <div className="space-y-4">
                {filteredArticles.length > 0 ? (
                    filteredArticles.map(article => (
                        <ArticleItem 
                            key={article.id} 
                            article={article} 
                            isAdmin={isAdmin}
                            isJournalAdmin={isJournalAdmin}
                            userId={user.id}
                            journalIds={journalAdminIds}
                            onStatusUpdate={fetchData}
                        />)
                    )
                ) : (
                    <p className="text-center text-gray-400 py-8">
                        {searchQuery 
                            ? `"${searchQuery}" bo'yicha hech narsa topilmadi.` 
                            : "Ushbu bo'limda hozircha maqolalar mavjud emas."}
                    </p>
                )}
            </div>
        );
    }


    return (
        <>
            <Card title={title}>
                {user.role === Role.Author && (
                    <div className="mb-6 flex justify-end">
                        <Button onClick={() => setShowReportModal(true)} variant="secondary">
                            <FileText className="mr-2 h-4 w-4" /> Barcha maqolalar bo'yicha ma'lumotnoma
                        </Button>
                    </div>
                )}
                {user.role === Role.Reviewer && renderTabs(reviewerTabs, reviewerTabCounts)}
                {isJournalAdmin && renderTabs(journalAdminTabs, journalAdminTabCounts)}

                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl mb-6 focus-within:border-accent-color focus-within:ring-2 focus-within:ring-accent-color-glow transition-all">
                    <Search className="text-gray-400 mx-4 shrink-0" size={20} />
                    <input
                        type="text"
                        placeholder="Sarlavha bo'yicha qidirish..."
                        className="w-full !bg-transparent !border-none !py-3 !pr-4 !pl-0 !shadow-none !ring-0"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {renderContent()}
            </Card>
            
            {showReportModal && user && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print">
                    <div className="w-full max-w-4xl h-[90vh] bg-gray-800 rounded-lg shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white">Maqolalar bo'yicha ma'lumotnoma</h3>
                            <div className="flex gap-2">
                                <Button onClick={handlePrintReport} variant="primary">
                                    <Printer className="mr-2 h-4 w-4"/> Chop Etish
                                </Button>
                                <Button onClick={() => setShowReportModal(false)} variant="secondary">
                                    Yopish
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div id="author-report-print-area">
                                <AuthorArticleReport articles={articlesToShow.map(convertToArticleType)} author={user as User} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Articles;