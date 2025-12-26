import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role, ArticleStatus } from '../types';
import Card from '../components/ui/Card';
import { FileText, Edit3, UserCheck, CheckCircle, Users, Inbox, Clock, XCircle, DollarSign, User as UserIcon, Timer, ArrowRight, Wallet, Rocket } from 'lucide-react';
import Button from '../components/ui/Button';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';

const StatCard: React.FC<{icon: React.ElementType, title: string, value: string | number, gradient: string, to?: string}> = ({ icon: Icon, title, value, gradient, to }) => {
    const cardContent = (
        <Card className="!p-0 overflow-hidden relative h-full transition-transform transform hover:scale-105 hover:shadow-xl">
            <div className={`absolute -top-4 -right-4 w-20 h-20 opacity-10 ${gradient} rounded-full blur-2xl`}></div>
            <div className="p-6 flex items-center">
                <div className={`p-3 rounded-xl mr-5 bg-white/10`}>
                    <Icon className={`h-7 w-7 text-white`} />
                </div>
                <div>
                    <p className="text-3xl font-bold text-white">{value}</p>
                    <p className="text-sm text-gray-400 capitalize">{title}</p>
                </div>
            </div>
            <div className={`h-1.5 ${gradient}`}></div>
        </Card>
    );

    if (to) {
        return (
            <Link to={to} className="block">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
};

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [articles, setArticles] = useState<any[]>([]);
    const [journals, setJournals] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            
            try {
                setLoading(true);
                setError(null);
                
                // Fetch data based on user role
                let usersData = [];
                if (user.role === Role.SuperAdmin) {
                    try {
                        const userData = await apiService.users.list();
                        usersData = Array.isArray(userData) ? userData : (userData?.data && Array.isArray(userData.data) ? userData.data : []);
                    } catch (err) {
                        console.error('Failed to fetch users:', err);
                        // If we can't fetch users, continue with empty array
                        usersData = [];
                    }
                }
                
                const [articlesData, journalsData, transactionsData] = await Promise.all([
                    apiService.articles.list(),
                    apiService.journals.list(),
                    apiService.payments.listTransactions()
                ]);
                
                // Ensure we're working with arrays - handle various response formats
                const processApiResponse = (data: any): any[] => {
                    if (Array.isArray(data)) {
                        return data;
                    }
                    if (data?.data && Array.isArray(data.data)) {
                        return data.data;
                    }
                    if (data?.results && Array.isArray(data.results)) {
                        return data.results;
                    }
                    return [];
                };
                
                const articlesArray = processApiResponse(articlesData);
                const journalsArray = processApiResponse(journalsData);
                const transactionsArray = processApiResponse(transactionsData);
                const usersArray = processApiResponse(usersData);
                
                setArticles(articlesArray);
                setJournals(journalsArray);
                setUsers(usersArray);
                setTransactions(transactionsArray);
                
                // Fetch stats for super admin
                if (user.role === Role.SuperAdmin) {
                    try {
                        const statsData = await apiService.users.stats();
                        setStats(statsData);
                    } catch (err) {
                        console.error('Failed to fetch stats:', err);
                    }
                }
            } catch (error: any) {
                console.error('Failed to fetch dashboard data:', error);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

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

    const renderAuthorDashboard = () => {
        const validArticles = Array.isArray(articles) ? articles : [];
        const myArticles = validArticles.filter(a => a.author === user.id);
        const inReviewCount = myArticles.filter(a => a.status === 'QabulQilingan').length;
        const publishedCount = myArticles.filter(a => a.status === 'Published').length;
        return (
            <div className="space-y-8">
                <h2 className="text-3xl font-bold text-white">Xush kelibsiz, {user.firstName}!</h2>
                <p className="text-gray-300 -mt-6">Bu yerdan o'z faoliyatingizni kuzatib borishingiz mumkin.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <StatCard icon={FileText} title="Jami maqolalar" value={myArticles.length} gradient="bg-gradient-to-r from-blue-500 to-cyan-400" to="/articles" />
                   <StatCard icon={Edit3} title="Ko'rib chiqilmoqda" value={inReviewCount} gradient="bg-gradient-to-r from-yellow-500 to-orange-400" to="/articles" />
                   <StatCard icon={CheckCircle} title="Nashr etilgan" value={publishedCount} gradient="bg-gradient-to-r from-green-500 to-emerald-400" to="/articles" />
                </div>
            </div>
        );
    };

    const renderReviewerDashboard = () => {
        const validArticles = Array.isArray(articles) ? articles : [];
        const articlesForReview = validArticles
            .filter(a => a.status === 'QabulQilingan')
            .sort((a, b) => (b.fast_track ? 1 : 0) - (a.fast_track ? 1 : 0));
        const articlesInProgress = validArticles.filter(a => a.status === 'QabulQilingan');

        return (
            <div className="space-y-8">
                <h2 className="text-3xl font-bold text-white">Xush kelibsiz, {user.firstName}!</h2>
                <p className="text-gray-300 -mt-6">Taqrizchi sifatida faoliyatingizni boshqaring.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={Inbox} title="Yangi so'rovlar" value={articlesForReview.length} gradient="bg-gradient-to-r from-blue-500 to-cyan-400" to="/articles" />
                    <StatCard icon={Clock} title="Jarayonda" value={articlesInProgress.length} gradient="bg-gradient-to-r from-yellow-500 to-orange-400" to="/articles" />
                    <StatCard icon={CheckCircle} title="Bajarilgan" value={user.reviewsCompleted || 0} gradient="bg-gradient-to-r from-green-500 to-emerald-400" to="/profile" />
                    <StatCard icon={Timer} title="O'rtacha vaqt" value={`${user.averageReviewTime || 0} kun`} gradient="bg-gradient-to-r from-purple-500 to-indigo-400" to="/profile" />
                </div>

                <Card title="Yangi so'rovlar">
                    <div className="space-y-4">
                        {articlesForReview.length > 0 ? (
                            articlesForReview.map(article => {
                                const author = users.find(u => u.id === article.author);
                                const journal = journals.find(j => j.id === article.journal);
                                return (
                                    <div key={article.id} className="p-4 bg-white/5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                {article.fast_track && (
                                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap bg-yellow-500/20 text-yellow-300 flex items-center gap-1.5">
                                                        <Rocket size={14} /> TOP
                                                    </span>
                                                )}
                                                <p className="font-semibold text-blue-400">{article.title}</p>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1">Muallif: {author ? `${author.first_name} ${author.last_name}` : 'Noma\'lum'} | Jurnal: {journal ? journal.name : 'Noma\'lum'}</p>
                                        </div>
                                        <Button onClick={() => navigate(`/articles/${article.id}`)} variant="secondary" className="w-full sm:w-auto">
                                            Ko'rib chiqish <ArrowRight className="ml-2 h-4 w-4"/>
                                        </Button>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-gray-400 py-8">Hozircha ko'rib chiqish uchun yangi so'rovlar yo'q.</p>
                        )}
                    </div>
                </Card>
            </div>
        );
    };
    
    const renderJournalAdminDashboard = () => {
        const managedJournals = journals.filter(j => j.journal_admin === user.id);
        const managedJournalIds = managedJournals.map(j => j.id);
        const validArticles = Array.isArray(articles) ? articles : [];

        const pendingPublicationCount = validArticles.filter(a => 
            managedJournalIds.includes(a.journal) && a.status === 'NashrgaYuborilgan'
        ).length;
        
        const newSubmissionsCount = validArticles.filter(a => 
            managedJournalIds.includes(a.journal) && a.status === 'Yangi'
        ).length;

        const totalPublishedCount = validArticles.filter(a => managedJournalIds.includes(a.journal) && a.status === 'Published').length;

        return (
            <div className="space-y-8">
                <h2 className="text-3xl font-bold text-white">Jurnal administratori paneli</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <StatCard icon={Inbox} title="Yangi Kelganlar" value={newSubmissionsCount} gradient="bg-gradient-to-r from-cyan-500 to-blue-400" to="/articles" />
                   <StatCard icon={Clock} title="Nashrni kutmoqda" value={pendingPublicationCount} gradient="bg-gradient-to-r from-yellow-500 to-orange-400" to="/articles" />
                   <StatCard icon={CheckCircle} title="Jami nashrlar" value={totalPublishedCount} gradient="bg-gradient-to-r from-green-500 to-emerald-400" to="/published-articles" />
                </div>
            </div>
        );
    };

    const renderSuperAdminDashboard = () => {
        // Use stats data if available, otherwise fall back to computed values
        const validTransactions = Array.isArray(transactions) ? transactions : [];
        const totalRevenue = stats?.finance?.total_revenue || validTransactions
            .filter(t => t.service_type !== 'top_up' && t.status === 'completed')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        const totalUsersCount = stats?.users?.total || users.length;
        const totalAuthors = stats?.users?.authors || users.filter(u => u.role === Role.Author || u.role === 'author').length;
        const totalReviewers = stats?.users?.reviewers || users.filter(u => u.role === Role.Reviewer || u.role === 'reviewer').length;
        const validArticles = Array.isArray(articles) ? articles : [];

        const totalArticlesCount = stats?.articles?.total || validArticles.length;
        const newSubmissions = stats?.articles?.new_submissions || validArticles.filter(a => a.status === 'Yangi' || a.status === 'WithEditor').length;
        const inReview = stats?.articles?.in_review || validArticles.filter(a => a.status === 'QabulQilingan').length;
        const published = stats?.articles?.published || validArticles.filter(a => a.status === 'Published').length;
        const rejected = stats?.articles?.rejected || validArticles.filter(a => a.status === 'Rejected').length;

        return (
            <div className="space-y-8">
                <h2 className="text-3xl font-bold text-white">Umumiy platforma statistikasi</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard icon={DollarSign} title="Jami tushum" value={`${(totalRevenue / 1000).toFixed(0)}k so'm`} gradient="bg-gradient-to-r from-green-500 to-emerald-400" to="/financials" />
                    <StatCard icon={Users} title="Jami foydalanuvchilar" value={totalUsersCount} gradient="bg-gradient-to-r from-indigo-500 to-violet-400" to="/users" />
                    <StatCard icon={FileText} title="Jami maqolalar" value={totalArticlesCount} gradient="bg-gradient-to-r from-purple-500 to-pink-400" to="/articles" />
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Maqolalar holati bo'yicha statistika</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                       <StatCard icon={Inbox} title="Yangi kelganlar" value={newSubmissions} gradient="bg-gradient-to-r from-blue-500 to-cyan-400" to="/articles" />
                       <StatCard icon={Clock} title="Taqrizda" value={inReview} gradient="bg-gradient-to-r from-yellow-500 to-orange-400" to="/articles" />
                       <StatCard icon={CheckCircle} title="Nashr etilgan" value={published} gradient="bg-gradient-to-r from-green-500 to-emerald-400" to="/articles" />
                       <StatCard icon={XCircle} title="Rad etilgan" value={rejected} gradient="bg-gradient-to-r from-red-500 to-rose-400" to="/articles" />
                    </div>
                </div>
                
                <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Foydalanuvchilar taqsimoti</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <StatCard icon={UserIcon} title="Mualliflar" value={totalAuthors} gradient="bg-gradient-to-r from-gray-500 to-gray-400" to="/users" />
                        <StatCard icon={UserCheck} title="Taqrizchilar" value={totalReviewers} gradient="bg-gradient-to-r from-gray-500 to-gray-400" to="/users" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Jurnal administratorlari statistikasi</h3>
                    <div className="space-y-4">
                        {users.filter(u => u.role === Role.JournalAdmin || u.role === 'journal_admin').map(admin => {
                            const managedJournalIds = journals.filter(j => j.journal_admin === admin.id || j.journalAdminId === admin.id).map(j=>j.id);
                            const publishedCount = validArticles.filter(a => managedJournalIds.includes(a.journal) && a.status === 'Published').length;
                            return (
                                <Card key={admin.id}>
                                    <div className="flex items-center">
                                        <img src={admin.avatar_url || admin.avatarUrl} className="h-12 w-12 rounded-full object-cover" alt={`${admin.firstName || admin.first_name} avatar`}/>
                                        <div className="ml-4">
                                             <p className="font-semibold text-white">{admin.firstName || admin.first_name} {admin.lastName || admin.last_name}</p>
                                             <p className="text-sm text-gray-400">Nashrlar soni: <span className="font-bold text-white">{publishedCount}</span></p>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const serviceTypeNames: Record<string, string> = {
        'fast-track': 'Tezkor ko\'rib chiqish',
        'publication_fee': 'Nashr haqi',
        'language_editing': 'Tilni tahrirlash',
        'top_up': 'Hisobni to\'ldirish',
        'book_publication': 'Kitob nashri',
        'translation': 'Tarjima',
    };

    const renderAccountantDashboard = () => {
        const validTransactions = Array.isArray(transactions) ? transactions : [];
        const successfulTransactions = validTransactions.filter(t => t.status === 'completed' && t.service_type !== 'top_up');
        const totalRevenue = successfulTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        const today = new Date().toISOString().split('T')[0];
        const todaysTransactions = successfulTransactions.filter(t => {
            const transactionDate = new Date(t.created_at).toISOString().split('T')[0];
            return transactionDate === today;
        });
        const revenueToday = todaysTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Calculate weekly revenue
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyTransactions = successfulTransactions.filter(t => {
            const transactionDate = new Date(t.created_at);
            return transactionDate >= oneWeekAgo;
        });
        const revenueThisWeek = weeklyTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return (
            <div className="space-y-8">
                <h2 className="text-3xl font-bold text-white">Moliyachi Boshqaruv Paneli</h2>
                <p className="text-gray-300 -mt-6">Platformaning moliyaviy holatini kuzatib boring.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <StatCard icon={DollarSign} title="Jami Tushum" value={`${(totalRevenue / 1000).toFixed(0)}k so'm`} gradient="bg-gradient-to-r from-green-500 to-emerald-400" to="/financials" />
                   <StatCard icon={Wallet} title="Bugungi Tushum" value={`${revenueToday.toLocaleString()} so'm`} gradient="bg-gradient-to-r from-blue-500 to-cyan-400" to="/financials" />
                   <StatCard icon={FileText} title="Bugungi Tranzaksiyalar" value={todaysTransactions.length} gradient="bg-gradient-to-r from-yellow-500 to-orange-400" to="/financials" />
                   <StatCard icon={Timer} title="Haftalik Tushum" value={`${(revenueThisWeek / 1000).toFixed(0)}k so'm`} gradient="bg-gradient-to-r from-purple-500 to-indigo-400" to="/financials" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="So'ngi Tranzaksiyalar">
                        <div className="space-y-4">
                            {validTransactions.slice(0, 5).map(transaction => {
                                const user = users.find(u => u.id === transaction.user);
                                const userName = user ? `${user.first_name} ${user.last_name}` : 'Noma\'lum foydalanuvchi';
                                
                                return (
                                    <div key={transaction.id} className="p-4 bg-white/5 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-white">{userName}</p>
                                            <p className="text-sm text-gray-400">
                                                {serviceTypeNames[transaction.service_type] || transaction.service_type || 'Noma\'lum xizmat'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-medium ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()} so'm
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(transaction.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {validTransactions.length === 0 && (
                                <p className="text-center text-gray-400 py-4">Hozircha tranzaksiyalar mavjud emas.</p>
                            )}
                        </div>
                    </Card>
                    
                    <Card title="To'lov Statistikasi">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Muvaffaqiyatli to'lovlar</span>
                                <span className="font-medium text-white">
                                    {validTransactions.filter(t => t.status === 'completed').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Kutilayotgan to'lovlar</span>
                                <span className="font-medium text-white">
                                    {validTransactions.filter(t => t.status === 'pending').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Muvaffaqiyatsiz to'lovlar</span>
                                <span className="font-medium text-white">
                                    {validTransactions.filter(t => t.status === 'failed').length}
                                </span>
                            </div>
                            <div className="pt-4 mt-4 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Umumiy tranzaksiyalar</span>
                                    <span className="font-bold text-white">{validTransactions.length}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
                
                <Card title="Tezkor Amallar">
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Button onClick={() => navigate('/financials')} variant="secondary">
                            Batafsil Moliyaviy Hisobot <ArrowRight className="ml-2 h-4 w-4"/>
                        </Button>
                    </div>
                </Card>
            </div>
        );
    };

    const renderDefaultDashboard = () => (
        <Card>
            <h2 className="text-3xl font-bold text-white">Xush kelibsiz, {user.firstName}!</h2>
            <p className="text-gray-300 mt-2">PINM tizimiga xush kelibsiz. Ishlaringizni boshqarish uchun yon menyudan foydalaning.</p>
        </Card>
    );

    switch (user.role) {
        case 'author':
            return renderAuthorDashboard();
        case 'reviewer':
            return renderReviewerDashboard();
        case 'journal_admin':
            return renderJournalAdminDashboard();
        case 'super_admin':
            return renderSuperAdminDashboard();
        case 'accountant':
            return renderAccountantDashboard();
        default:
            return renderDefaultDashboard();
    }
};

export default Dashboard;