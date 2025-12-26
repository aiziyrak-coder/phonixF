import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { ArticleStatus, Role } from '../types';
import Button from '../components/ui/Button';
import { useNotifications } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

const UdkRequests: React.FC = () => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [udkCodes, setUdkCodes] = useState<Record<string, string>>({});
    const [users, setUsers] = useState<any[]>([]);

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            if (!user || user.role !== Role.SuperAdmin) return;
            
            try {
                setLoading(true);
                setError(null);
                
                // Fetch articles and users in parallel
                const [articlesData, usersData] = await Promise.all([
                    apiService.articles.list(),
                    apiService.users.list()
                ]);
                
                const articles = Array.isArray(articlesData) ? articlesData : [];
                const usersList = Array.isArray(usersData) ? usersData : [];
                
                setUsers(usersList);
                
                // Filter articles with "Yangi" status for UDK requests
                const udkRequests = articles
                    .filter(a => a.status === ArticleStatus.Yangi)
                    .slice(0, 2)
                    .map(a => {
                        const author = usersList.find(u => u.id === a.author);
                        return {
                            id: a.id,
                            author: author ? `${author.firstName} ${author.lastName}` : 'Noma\'lum',
                            title: a.title
                        };
                    });
                
                setRequests(udkRequests);
            } catch (err: any) {
                console.error('Failed to fetch UDK requests:', err);
                setError('UDK so\'rovlarni yuklashda xatolik yuz berdi.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [user]);

    if (user?.role !== Role.SuperAdmin) {
        return <Card title="Ruxsat Rad Etildi"><p>Ushbu sahifani ko'rish uchun sizda yetarli ruxsat yo'q.</p></Card>;
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
    
    const handleUdkChange = (articleId: string, value: string) => {
        setUdkCodes(prev => ({ ...prev, [articleId]: value }));
    };

    const handleSendUdk = async (articleId: string) => {
        const udkCode = udkCodes[articleId];
        if (!udkCode || !udkCode.trim()) {
            alert("Iltimos, UDK kodini kiriting.");
            return;
        }

        try {
            // In a real app, we would make an API call to save the UDK code to the article
            // For now, we'll just simulate the behavior
            
            const article = requests.find(a => a.id === articleId);
            if (article) {
                // In a real app, we would save this UDK to the article object via API
                addNotification({
                    message: `Sizning "${article.title.substring(0,30)}..." maqolangiz uchun UDK kodi tasdiqlandi: ${udkCode}`,
                    link: `/articles/${articleId}`
                });
            }

            setRequests(prev => prev.filter(req => req.id !== articleId));
            addNotification({ message: "UDK kodi muallifga muvaffaqiyatli yuborildi." });
        } catch (err) {
            console.error('Failed to send UDK code:', err);
            alert('UDK kodini yuborishda xatolik yuz berdi.');
        }
    };

    return (
        <Card title="UDK Kod So'rovlarini Boshqarish">
             <div className="space-y-4">
                {requests.length > 0 ? requests.map(req => (
                    <div key={req.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 dark:border-gray-700">
                        <div className="flex-1">
                            <p className="font-semibold">{req.title}</p>
                            <p className="text-sm text-gray-500">{req.author}</p>
                        </div>
                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                             <input 
                                type="text" 
                                placeholder="UDK kodini kiriting..." 
                                className="w-full sm:w-48"
                                value={udkCodes[req.id] || ''}
                                onChange={(e) => handleUdkChange(req.id, e.target.value)}
                             />
                             <Button onClick={() => handleSendUdk(req.id)}>Yuborish</Button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-gray-400 py-8">Yangi UDK so'rovlari mavjud emas.</p>
                )}
            </div>
        </Card>
    );
};

export default UdkRequests;