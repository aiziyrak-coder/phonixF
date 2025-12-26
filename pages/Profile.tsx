import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { User, Mail, Phone, Building, Award, Hash, Edit } from 'lucide-react';
import { apiService } from '../services/apiService';

const Profile: React.FC = () => {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            
            try {
                setLoading(true);
                setError(null);
                
                const profileData = await apiService.auth.getProfile();
                const userData = profileData.data || profileData;
                setProfile(userData);
                setFormData({
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    patronymic: userData.patronymic || '',
                    email: userData.email,
                    phone: userData.phone,
                    affiliation: userData.affiliation,
                    orcid_id: userData.orcid_id || '',
                    telegram_username: userData.telegram_username || '',
                });
            } catch (err: any) {
                console.error('Failed to fetch profile:', err);
                setError('Profil ma\'lumotlarini yuklashda xatolik yuz berdi.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const updatedProfile = await apiService.auth.updateProfile(formData);
            const userData = updatedProfile.data || updatedProfile;
            setProfile(userData);
            setIsEditing(false);
        } catch (err: any) {
            console.error('Failed to update profile:', err);
            setError('Profilni yangilashda xatolik yuz berdi.');
        }
    };

    const roleNames: Record<string, string> = {
        'author': 'Muallif',
        'reviewer': 'Taqrizchi',
        'journal_admin': 'Jurnal administratori',
        'super_admin': 'Bosh administrator',
        'accountant': 'Moliyachi',
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
            <Card title="Error">
                <p className="text-red-400">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
            </Card>
        );
    }

    if (!profile) {
        return <Card title="Xatolik"><p>Profil ma'lumotlari topilmadi.</p></Card>;
    }

    return (
        <div className="space-y-6">
            <Card title="Profilim">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            {profile.avatar_url ? (
                                <img 
                                    src={profile.avatar_url} 
                                    alt="Avatar" 
                                    className="h-32 w-32 rounded-full object-cover border-4 border-white/10"
                                />
                            ) : (
                                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-4 border-white/10">
                                    <User className="h-16 w-16 text-white" />
                                </div>
                            )}
                            <button className="absolute bottom-2 right-2 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                                <Edit className="h-4 w-4 text-white" />
                            </button>
                        </div>
                        <div className="mt-4 text-center">
                            <h2 className="text-xl font-bold text-white">
                                {profile.first_name} {profile.last_name} {profile.patronymic}
                            </h2>
                            <p className="text-gray-400">{roleNames[profile.role] || profile.role}</p>
                        </div>
                    </div>
                    
                    <div className="flex-1">
                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Ism</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Familiya</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Otasining ismi</label>
                                        <input
                                            type="text"
                                            name="patronymic"
                                            value={formData.patronymic}
                                            onChange={handleInputChange}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Telefon</label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-white/10 bg-white/5 text-gray-300">
                                                +998
                                            </span>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone?.replace('+998', '')}
                                                onChange={handleInputChange}
                                                className="flex-1 min-w-0 block w-full rounded-none rounded-r-md"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Ish yoki o'qish joyi</label>
                                        <input
                                            type="text"
                                            name="affiliation"
                                            value={formData.affiliation}
                                            onChange={handleInputChange}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">ORCID ID</label>
                                        <input
                                            type="text"
                                            name="orcid_id"
                                            value={formData.orcid_id}
                                            onChange={handleInputChange}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Telegram</label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-white/10 bg-white/5 text-gray-300">
                                                @
                                            </span>
                                            <input
                                                type="text"
                                                name="telegram_username"
                                                value={formData.telegram_username?.replace('@', '')}
                                                onChange={handleInputChange}
                                                className="flex-1 min-w-0 block w-full rounded-none rounded-r-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 pt-4">
                                    <Button type="submit">Saqlash</Button>
                                    <Button 
                                        type="button" 
                                        variant="secondary" 
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Bekor qilish
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center p-3 bg-white/5 rounded-lg">
                                        <User className="h-5 w-5 text-blue-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-400">To'liq ism</p>
                                            <p className="text-white">{profile.first_name} {profile.last_name} {profile.patronymic}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center p-3 bg-white/5 rounded-lg">
                                        <Mail className="h-5 w-5 text-green-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-400">Email</p>
                                            <p className="text-white">{profile.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center p-3 bg-white/5 rounded-lg">
                                        <Phone className="h-5 w-5 text-purple-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-400">Telefon</p>
                                            <p className="text-white">{profile.phone}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center p-3 bg-white/5 rounded-lg">
                                        <Building className="h-5 w-5 text-yellow-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-400">Tashkilot</p>
                                            <p className="text-white">{profile.affiliation}</p>
                                        </div>
                                    </div>
                                    
                                    {profile.orcid_id && (
                                        <div className="flex items-center p-3 bg-white/5 rounded-lg">
                                            <Hash className="h-5 w-5 text-red-400 mr-3" />
                                            <div>
                                                <p className="text-sm text-gray-400">ORCID ID</p>
                                                <p className="text-white">{profile.orcid_id}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {profile.telegram_username && (
                                        <div className="flex items-center p-3 bg-white/5 rounded-lg">
                                            <span className="text-lg mr-3">@</span>
                                            <div>
                                                <p className="text-sm text-gray-400">Telegram</p>
                                                <p className="text-white">{profile.telegram_username}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="pt-4">
                                    <Button onClick={() => setIsEditing(true)}>
                                        <Edit className="mr-2 h-4 w-4" /> Tahrirlash
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
            
            {profile.gamification_profile && (
                <Card title="Gamifikatsiya">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-white/5 rounded-lg">
                            <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-500/20 mb-4">
                                <Award className="h-8 w-8 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">{profile.gamification_profile.level}</h3>
                            <p className="text-gray-400">Daraja</p>
                        </div>
                        
                        <div className="text-center p-6 bg-white/5 rounded-lg">
                            <div className="inline-flex items-center justify-center p-3 rounded-full bg-yellow-500/20 mb-4">
                                <Award className="h-8 w-8 text-yellow-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">{profile.gamification_profile.points}</h3>
                            <p className="text-gray-400">Ballar</p>
                        </div>
                        
                        <div className="text-center p-6 bg-white/5 rounded-lg">
                            <div className="inline-flex items-center justify-center p-3 rounded-full bg-purple-500/20 mb-4">
                                <Award className="h-8 w-8 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">{profile.gamification_profile.badges.length}</h3>
                            <p className="text-gray-400">Mukofotlar</p>
                        </div>
                    </div>
                    
                    {profile.gamification_profile.badges.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-md font-semibold text-white mb-3">Mukofotlar</h4>
                            <div className="flex flex-wrap gap-2">
                                {profile.gamification_profile.badges.map((badge: string, index: number) => (
                                    <span key={index} className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-full text-sm">
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}
            
            <Card title="Hisobni boshqarish">
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="danger" onClick={logout}>
                        Chiqish
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Profile;