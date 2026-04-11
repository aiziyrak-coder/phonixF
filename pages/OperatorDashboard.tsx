import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import Card from '../components/ui/Card';
import { 
  Eye, FileText, Users, DollarSign, CheckCircle, Clock, XCircle, 
  TrendingUp, BarChart3, Activity, Search, Filter, Download,
  RefreshCw, AlertCircle, Shield, Bot, Settings, Bell, Calendar,
  CreditCard, BookOpen, Library, MessageSquare, Zap, Target, Award,
  ChevronRight
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { toast } from 'react-toastify';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

interface OperatorStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  udkRequests: number;
  doiRequests: number;
  articleSamples: number;
  translations: number;
  recentActivities: any[];
}

const OperatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OperatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'users' | 'finance'>('overview');
  const [udkRequests, setUdkRequests] = useState<any[]>([]);
  const [doiRequests, setDoiRequests] = useState<any[]>([]);
  const [articleSamples, setArticleSamples] = useState<any[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);
  const [chatInbox, setChatInbox] = useState<
    { id: string; title: string; author_name: string; journal_name: string; last_message_at: string | null }[]
  >([]);

  useEffect(() => {
    fetchOperatorData();
  }, []);

  const fetchOperatorData = async () => {
    try {
      setLoading(true);
      
      // Parallel API calls for all data
      const [udkRes, doiRes, samplesRes, transRes, usersRes, txRes] = await Promise.all([
        apiService.udc.requests.list(),
        apiService.articles.getDoiRequests(),
        apiService.articles.getArticleSampleRequests(),
        apiService.translations.list(),
        apiService.users.list(),
        apiService.payments.getTransactions(),
      ]);

      const processData = (res: any) => {
        if (Array.isArray(res)) return res;
        if (res?.results && Array.isArray(res.results)) return res.results;
        if (res?.data && Array.isArray(res.data)) return res.data;
        return [];
      };

      const udkData = processData(udkRes);
      const doiData = processData(doiRes);
      const samplesData = processData(samplesRes);
      const transData = processData(transRes);
      const usersData = processData(usersRes);
      const txData = processData(txRes);

      // Calculate statistics
      const totalRequests = udkData.length + doiData.length + samplesData.length + transData.length;
      const pendingRequests = [
        ...udkData.filter((r: any) => r.status === 'submitted' || r.status === 'pending'),
        ...doiData.filter((r: any) => r.status === 'submitted' || r.status === 'pending'),
        ...samplesData.filter((r: any) => r.status === 'submitted' || r.status === 'pending'),
        ...transData.filter((r: any) => r.status === 'Yangi' || r.status === 'Jarayonda'),
      ].length;

      const completedRequests = [
        ...udkData.filter((r: any) => r.status === 'completed'),
        ...doiData.filter((r: any) => r.status === 'completed'),
        ...samplesData.filter((r: any) => r.status === 'completed'),
        ...transData.filter((r: any) => r.status === 'Bajarildi'),
      ].length;

      const totalRevenue = txData
        .filter((tx: any) => tx.status === 'completed')
        .reduce((sum: number, tx: any) => sum + Math.abs(parseFloat(tx.amount)), 0);

      setStats({
        totalRequests,
        pendingRequests,
        completedRequests,
        totalUsers: usersData.length,
        totalTransactions: txData.length,
        totalRevenue,
        udkRequests: udkData.length,
        doiRequests: doiData.length,
        articleSamples: samplesData.length,
        translations: transData.length,
        recentActivities: [...udkData, ...doiData, ...samplesData].slice(0, 10),
      });

      setUdkRequests(udkData);
      setDoiRequests(doiData);
      setArticleSamples(samplesData);
      setTranslations(transData);

      try {
        const inboxRaw = await apiService.articles.getOperatorChatInbox();
        setChatInbox(Array.isArray(inboxRaw) ? inboxRaw : []);
      } catch {
        setChatInbox([]);
      }

    } catch (error) {
      console.error('Error fetching operator data:', error);
      toast.error('Ma\'lumotlarni yuklashda xatolik!');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      submitted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      Yangi: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Jarayonda: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      Bajarildi: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      BekorQilindi: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return badges[status] || 'bg-gray-500/20 text-slate-500 border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              👑 Operator Dashboard
            </h1>
            <p className="text-slate-500">
              Barcha so'rovlarni nazorat qilish va boshqarish markazi
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={fetchOperatorData} variant="secondary">
              <RefreshCw className="h-4 w-4" />
              Yangilash
            </Button>
            <Link to="/profile">
              <Button variant="primary">
                <Settings className="h-4 w-4" />
                Sozlamalar
              </Button>
            </Link>
          </div>
        </div>

        {/* User Info Card */}
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Operator'}
                </h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Shield className="h-4 w-4" />
                  <span>Senior Operator</span>
                  <span>•</span>
                  <span>{user?.phone}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500 mb-1">Platformadagi roli</div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                <Award className="h-4 w-4 text-blue-400" />
                <span className="font-semibold text-blue-400">Bosh Operator</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FileText}
          title="Jami So'rovlar"
          value={stats?.totalRequests || 0}
          gradient="from-blue-600 to-cyan-600"
          description="Barcha turdagi so'rovlar"
        />
        <StatCard
          icon={Clock}
          title="Kutilayotgan"
          value={stats?.pendingRequests || 0}
          gradient="from-yellow-600 to-orange-600"
          description="Ko'rib chiqishni kutayotgan"
          alert={true}
        />
        <StatCard
          icon={CheckCircle}
          title="Bajarilgan"
          value={stats?.completedRequests || 0}
          gradient="from-green-600 to-emerald-600"
          description="Muvaffaqiyatli yakunlangan"
        />
        <StatCard
          icon={DollarSign}
          title="Jami Daromad"
          value={`${(stats?.totalRevenue || 0).toLocaleString()} so'm`}
          gradient="from-purple-600 to-pink-600"
          description="Barcha to'lovlar"
        />
      </div>

      {/* Service Type Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ServiceStatCard
          icon={BookOpen}
          title="UDK So'rovlari"
          count={stats?.udkRequests || 0}
          color="blue"
          link="/udk-requests"
        />
        <ServiceStatCard
          icon={Library}
          title="DOI So'rovlari"
          count={stats?.doiRequests || 0}
          color="purple"
          link="/doi-requests"
        />
        <ServiceStatCard
          icon={FileText}
          title="Maqola Namuna"
          count={stats?.articleSamples || 0}
          color="green"
          link="/article-samples"
        />
        <ServiceStatCard
          icon={MessageSquare}
          title="Tarjimalar"
          count={stats?.translations || 0}
          color="orange"
          link="/translations"
        />
      </div>

      <Card className="mb-8 border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-gray-900/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
            Muallif chatlari (oxirgi xabarlar)
          </h3>
          <Link to="/articles">
            <Button variant="secondary" className="!px-4 !py-2 text-sm">
              Barcha maqolalar
            </Button>
          </Link>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Har bir maqola alohida yozishma. Muallif yozganida barcha operatorlarga bildirishnoma boradi.
        </p>
        {chatInbox.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">Hozircha faol chatlar yo‘q. Maqolalar ro‘yxatidan oching.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {chatInbox.slice(0, 15).map((row) => (
              <li key={row.id}>
                <Link
                  to={`/articles/${row.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/70 backdrop-blur-sm hover:bg-white/90 border border-slate-200/80 transition-colors shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{row.title}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {row.author_name}
                      {row.journal_name ? ` · ${row.journal_name}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">
                    {row.last_message_at
                      ? new Date(row.last_message_at).toLocaleString('uz-UZ')
                      : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Recent Activity */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Oxirgi Faollik
          </h3>
          <Button variant="secondary" className="!px-4 !py-2 text-sm">
            Barchasini ko'rish
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="space-y-3">
          {stats?.recentActivities.slice(0, 5).map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/70 backdrop-blur-sm hover:bg-white/90 border border-slate-200/70 transition-colors shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'udk' ? 'bg-blue-500/20 text-blue-400' :
                  activity.type === 'doi' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {activity.type === 'udk' ? <BookOpen className="h-5 w-5" /> :
                   activity.type === 'doi' ? <Library className="h-5 w-5" /> :
                   <FileText className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{activity.title || 'So\'rov'}</p>
                  <p className="text-sm text-slate-500">{activity.author_name || 'Noma\'lum'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(activity.status)}`}>
                  {activity.status}
                </span>
                <span className="text-sm text-slate-500">
                  {new Date(activity.created_at || activity.submission_date).toLocaleDateString('uz-UZ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard
          icon={Users}
          title="Foydalanuvchilar"
          description="Barcha foydalanuvchilarni ko'rish va boshqarish"
          link="/users"
          color="blue"
        />
        <QuickActionCard
          icon={CreditCard}
          title="To'lovlar"
          description="To'lov operatsiyalari monitoringi"
          link="/financials"
          color="green"
        />
        <QuickActionCard
          icon={BarChart3}
          title="Hisobotlar"
          description="Platforma statistikasi va tahlillar"
          link="/analytics"
          color="purple"
        />
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: any;
  title: string;
  value: string | number;
  gradient: string;
  description?: string;
  alert?: boolean;
}> = ({ icon: Icon, title, value, gradient, description, alert }) => (
  <Card className="relative overflow-hidden">
    <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-3xl bg-gradient-to-br ${gradient}`} />
    <div className="relative">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
          <Icon className="h-6 w-6 text-slate-900" />
        </div>
      </div>
      {alert && (
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Diqqat talab qilinadi</span>
        </div>
      )}
    </div>
  </Card>
);

// Service Stat Card
const ServiceStatCard: React.FC<{
  icon: any;
  title: string;
  count: number;
  color: string;
  link: string;
}> = ({ icon: Icon, title, count, color, link }) => {
  const colors: Record<string, string> = {
    blue: 'from-blue-600/20 to-cyan-600/20 border-blue-500/30 text-blue-400',
    purple: 'from-purple-600/20 to-pink-600/20 border-purple-500/30 text-purple-400',
    green: 'from-green-600/20 to-emerald-600/20 border-green-500/30 text-green-400',
    orange: 'from-orange-600/20 to-red-600/20 border-orange-500/30 text-orange-400',
  };

  return (
    <Link to={link}>
      <Card className={`h-full border ${colors[color]} hover:scale-105 transition-transform cursor-pointer`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{count}</p>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color === 'blue' ? 'from-blue-600 to-cyan-600' : color === 'purple' ? 'from-purple-600 to-pink-600' : color === 'green' ? 'from-green-600 to-emerald-600' : 'from-orange-600 to-red-600'}`}>
            <Icon className="h-6 w-6 text-slate-900" />
          </div>
        </div>
      </Card>
    </Link>
  );
};

// Quick Action Card
const QuickActionCard: React.FC<{
  icon: any;
  title: string;
  description: string;
  link: string;
  color: string;
}> = ({ icon: Icon, title, description, link, color }) => {
  const colors: Record<string, string> = {
    blue: 'hover:border-blue-500/50',
    green: 'hover:border-green-500/50',
    purple: 'hover:border-purple-500/50',
  };

  return (
    <Link to={link}>
      <Card className={`h-full border border-slate-200 ${colors[color]} transition-all cursor-pointer hover:shadow-lg`}>
        <div className="flex items-start gap-4">
          <div className={`p-4 rounded-xl bg-gradient-to-br from-${color}-600/20 to-${color}-600/10`}>
            <Icon className={`h-8 w-8 text-${color}-400`} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default OperatorDashboard;
