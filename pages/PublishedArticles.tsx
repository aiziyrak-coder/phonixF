import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth, useNotifications } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { ArticleStatus, Role, Issue } from '../types';
import { Archive, UploadCloud, Send, Link as LinkIcon, Loader2 } from 'lucide-react';

const MONTH_NAMES = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

const PublishedArticles: React.FC = () => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [journals, setJournals] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<any[]>([]);

    const managedJournals = useMemo(() => {
        if (user?.role !== Role.JournalAdmin) return [];
        return journals.filter(j => j.journal_admin === user.id);
    }, [user, journals]);

    const [selectedJournalId, setSelectedJournalId] = useState('');
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    
    const [collectionUrl, setCollectionUrl] = useState('');
    const [collectionPdf, setCollectionPdf] = useState<File | null>(null);

    // Set initial selected journal
    useEffect(() => {
        if (managedJournals.length > 0 && !selectedJournalId) {
            setSelectedJournalId(managedJournals[0].id);
        }
    }, [managedJournals, selectedJournalId]);

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            if (!user || user.role !== Role.JournalAdmin) return;
            
            setLoading(true);
            setError(null);
            
            try {
                const [issuesData, journalsData, articlesData, usersData] = await Promise.all([
                    apiService.journals.listIssues(),
                    apiService.journals.list(),
                    apiService.articles.list(),
                    apiService.users.list()
                ]);
                
                setIssues(issuesData.results || issuesData);
                setJournals(journalsData.results || journalsData);
                setArticles(articlesData.results || articlesData);
                setUsers(usersData.results || usersData);
            } catch (err: any) {
                console.error('Failed to fetch data:', err);
                setError('Ma\'lumotlarni yuklashda xatolik yuz berdi: ' + (err.message || 'Noma\'lum xatolik'));
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [user]);

    const activeIssue = useMemo(() => {
        return issues.find(issue => 
            issue.journalId === selectedJournalId &&
            new Date(issue.publicationDate).getFullYear() === selectedYear &&
            new Date(issue.publicationDate).getMonth() === selectedMonth
        );
    }, [issues, selectedJournalId, selectedYear, selectedMonth]);

    const articlesForNewIssue = useMemo(() => {
        return articles.filter(article => 
            article.journal === selectedJournalId &&
            article.status === 'published' && // Published status in API
            new Date(article.submission_date).getFullYear() === selectedYear &&
            new Date(article.submission_date).getMonth() === selectedMonth
        );
    }, [selectedJournalId, selectedYear, selectedMonth, articles]);

    if (!user || user.role !== Role.JournalAdmin) {
        return <Card title="Ruxsat Rad Etildi"><p>Ushbu sahifani ko'rish uchun sizda yetarli ruxsat yo'q.</p></Card>;
    }
    
    if (loading) {
        return (
            <Card title="Oylik Sonlar va Arxiv">
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-3">Ma'lumotlar yuklanmoqda...</span>
                </div>
            </Card>
        );
    }
    
    if (error) {
        return (
            <Card title="Xatolik">
                <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">
                    <p>{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        Qayta urinib ko'rish
                    </button>
                </div>
            </Card>
        );
    }

    const handleCreateOrUpdateIssue = async () => {
        if (!collectionPdf && !collectionUrl) {
            alert("Iltimos, oylik to'plamning PDF faylini yuklang yoki havola kiriting.");
            return;
        }

        try {
            const issueIdentifier = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
            const monthName = MONTH_NAMES[selectedMonth];
            const journal = journals.find(j => j.id === selectedJournalId);
            
            // Ensure articlesForNewIssue is an array and has valid IDs
            const articleIds = Array.isArray(articlesForNewIssue) 
                ? articlesForNewIssue.map(a => a.id).filter(id => id !== undefined)
                : [];
            
            const issueData = {
                journal: selectedJournalId,
                issue_number: `${selectedYear}-${monthName}`,
                publication_date: new Date(selectedYear, selectedMonth, 28).toISOString().split('T')[0],
                articles: articleIds,
                collection_url: collectionUrl || ''
            };

            if (activeIssue) {
                // Update existing issue
                await apiService.journals.updateIssue(activeIssue.id, issueData, collectionPdf);
                addNotification({
                    message: `Jurnalning ${monthName} ${selectedYear} soni muvaffaqiyatli yangilandi!`,
                    link: '/published-articles'
                });
            } else {
                // Create new issue
                await apiService.journals.createIssue(issueData, collectionPdf);
                addNotification({
                    message: `Jurnalning ${monthName} ${selectedYear} soni muvaffaqiyatli yaratildi!`,
                    link: '/published-articles'
                });
            }

            // Refresh issues
            const issuesData = await apiService.journals.listIssues();
            setIssues(issuesData.results || issuesData);
            
            // Notify authors
            if (Array.isArray(articlesForNewIssue)) {
                articlesForNewIssue.forEach(article => {
                    const author = users.find(u => u.id === article.author);
                    if (author) {
                        addNotification({
                            message: `Sizning maqolangiz kiritilgan "${journal?.name}" jurnalining ${monthName} soni to'plami tayyor!`,
                            link: '/my-collections'
                        });
                    }
                });
            }

            alert(`Jurnalning ${monthName} ${selectedYear} soni muvaffaqiyatli saqlandi va mualliflarga xabar yuborildi.`);
            setCollectionPdf(null);
            setCollectionUrl('');
        } catch (err: any) {
            console.error('Failed to save issue:', err);
            alert('Sonni saqlashda xatolik yuz berdi: ' + (err.message || 'Noma\'lum xatolik'));
        }
    };

    return (
        <Card title="Oylik Sonlar va Arxiv">
            <p className="text-gray-300 mb-6 -mt-4">Bu yerda jurnallaringiz uchun oylik to'plamlarni boshqarishingiz mumkin.</p>
            
            <div className="p-4 bg-white/5 rounded-lg mb-6 flex flex-col md:flex-row gap-4">
                {managedJournals.length > 1 && (
                    <div>
                        <label className="text-sm">Jurnal</label>
                        <select 
                            value={selectedJournalId} 
                            onChange={e => setSelectedJournalId(e.target.value)} 
                            className="w-full"
                            disabled={loading}
                        >
                            {managedJournals.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                        </select>
                    </div>
                )}
                <div>
                    <label className="text-sm">Yil</label>
                    <select 
                        value={selectedYear} 
                        onChange={e => setSelectedYear(parseInt(e.target.value))} 
                        className="w-full"
                        disabled={loading}
                    >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm">Oy</label>
                    <select 
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(parseInt(e.target.value))} 
                        className="w-full"
                        disabled={loading}
                    >
                        {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                </div>
            </div>

            {activeIssue ? (
                <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                    <h3 className="text-xl font-bold text-green-300">
                        {MONTH_NAMES[selectedMonth]} {selectedYear} soni allaqachon yaratilgan.
                    </h3>
                    <p className="text-green-400/80 mt-2">Ma'lumotlarni yangilash uchun quyidagi formadan foydalanishingiz mumkin.</p>
                </div>
            ) : null}

            <div className="mt-6 space-y-6">
                <h3 className="text-lg font-semibold text-white">{activeIssue ? "Ma'lumotlarni Yangilash" : "Yangi Son Yaratish"}</h3>
                <p className="text-sm text-gray-400">Tanlangan oy uchun <strong className="text-white">{Array.isArray(articlesForNewIssue) ? articlesForNewIssue.length : 0}</strong> ta nashr etilgan maqola mavjud.</p>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">To'plam PDF fayli</label>
                    <label htmlFor="collection-pdf-upload" className="cursor-pointer">
                        <div className="p-8 border-2 border-dashed rounded-lg border-gray-600 text-center bg-white/5 hover:bg-white/10 transition-colors">
                            <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-400">{collectionPdf ? `Tanlangan: ${collectionPdf.name}` : 'PDF faylni tanlang'}</p>
                        </div>
                        <input 
                            id="collection-pdf-upload" 
                            type="file" 
                            className="sr-only" 
                            onChange={(e) => setCollectionPdf(e.target.files ? e.target.files[0] : null)} 
                            accept=".pdf" 
                            disabled={loading}
                        />
                    </label>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">To'plam havolasi (ixtiyoriy)</label>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                        <input 
                            type="text" 
                            className="w-full !pl-10"
                            placeholder="https://jurnal-sayti.uz/arxiv/2025-09.pdf"
                            value={collectionUrl}
                            onChange={(e) => setCollectionUrl(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button 
                        onClick={handleCreateOrUpdateIssue} 
                        disabled={loading || (!collectionPdf && !collectionUrl && !activeIssue)}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yuklanmoqda...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4"/> {activeIssue ? "Yangilash" : "Sonni Yopish va Saqlash"}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default PublishedArticles;