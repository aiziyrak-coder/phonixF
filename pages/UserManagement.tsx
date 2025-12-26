import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Role } from '../types';
import { Search, User, Shield, Eye, Edit, Trash2, Plus, X } from 'lucide-react';
import { apiService } from '../services/apiService';

const UserManagement: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // New user modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // New user form data
    const [newUser, setNewUser] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: Role.Author,
        password: '',
        affiliation: ''
    });

    useEffect(() => {
        const fetchUsers = async () => {
            if (!user) return;
            
            try {
                setLoading(true);
                setError(null);
                
                const usersData = await apiService.users.list();
                
                // Ensure we're working with arrays - handle various response formats
                const usersArray = Array.isArray(usersData) 
                    ? usersData 
                    : (usersData?.data && Array.isArray(usersData.data) 
                        ? usersData.data 
                        : (usersData?.results && Array.isArray(usersData.results) 
                            ? usersData.results 
                            : []));
                setUsers(usersArray);
            } catch (err: any) {
                console.error('Failed to fetch users:', err);
                setError('Foydalanuvchilarni yuklashda xatolik yuz berdi.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [user]);
    
    // Handle opening the new user modal
    const handleOpenModal = () => {
        // Reset form data
        setNewUser({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            role: Role.Author,
            password: '',
            affiliation: ''
        });
        setIsModalOpen(true);
    };
    
    // Handle closing the new user modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
    };
    
    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Handle form submission for new user
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (!newUser.first_name || !newUser.last_name || !newUser.email || !newUser.phone || !newUser.password) {
            alert("Iltimos, barcha majburiy maydonlarni to'ldiring.");
            return;
        }
        
        try {
            setIsSubmitting(true);
            
            // Create user via API
            const userData = {
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                password: newUser.password,
                affiliation: newUser.affiliation
            };
            
            const createdUser = await apiService.users.create(userData);
            
            // Add new user to the users list
            setUsers(prev => [...prev, createdUser]);
            
            // Close modal and reset form
            handleCloseModal();
            
            // Show success message
            alert("Foydalanuvchi muvaffaqiyatli qo'shildi!");
        } catch (err: any) {
            console.error('Failed to create user:', err);
            alert('Foydalanuvchi yaratishda xatolik yuz berdi: ' + (err.message || 'Noma\'lum xatolik'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const roleNames: Record<string, string> = {
        'author': 'Muallif',
        'reviewer': 'Taqrizchi',
        'journal_admin': 'Jurnal administratori',
        'super_admin': 'Bosh administrator',
        'accountant': 'Moliyachi',
    };

    const roleColors: Record<string, string> = {
        'author': 'bg-blue-500/20 text-blue-300',
        'reviewer': 'bg-purple-500/20 text-purple-300',
        'journal_admin': 'bg-indigo-500/20 text-indigo-300',
        'super_admin': 'bg-red-500/20 text-red-300',
        'accountant': 'bg-green-500/20 text-green-300',
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

    const validUsers = Array.isArray(users) ? users : [];
    const filteredUsers = validUsers.filter(u => 
        u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.includes(searchQuery)
    );

    return (
        <>
            <Card title="Foydalanuvchilar boshqaruvi">
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl focus-within:border-accent-color focus-within:ring-2 focus-within:ring-accent-color-glow transition-all">
                            <Search className="text-gray-400 mx-4 shrink-0" size={20} />
                            <input
                                type="text"
                                placeholder="Ism, familiya, email yoki telefon bo'yicha qidirish..."
                                className="w-full !bg-transparent !border-none !py-3 !pr-4 !pl-0 !shadow-none !ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button onClick={handleOpenModal}>
                        <Plus className="mr-2 h-4 w-4" /> Yangi foydalanuvchi
                    </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Foydalanuvchi</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Rol</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Telefon</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Tashkilot</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Ro'yxatdan o'tgan</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                {user.avatar_url ? (
                                                    <img className="h-10 w-10 rounded-full object-cover" src={user.avatar_url} alt={user.first_name} />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-white">{user.first_name} {user.last_name}</div>
                                                <div className="text-sm text-gray-400">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                                            {roleNames[user.role]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-300">{user.phone}</td>
                                    <td className="px-4 py-4 text-sm text-gray-300">{user.affiliation}</td>
                                    <td className="px-4 py-4 text-sm text-gray-300">
                                        {new Date(user.date_joined).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <Button variant="secondary">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="secondary">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="danger">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <User className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-white">Foydalanuvchilar topilmadi</h3>
                        <p className="mt-1 text-sm text-gray-400">
                            {searchQuery ? `"${searchQuery}" bo'yicha hech narsa topilmadi.` : 'Hozircha foydalanuvchilar mavjud emas.'}
                        </p>
                    </div>
                )}
            </Card>
            
            {/* New User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl" title="Yangi foydalanuvchi qo'shish">
                        <button 
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                        
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Ism *</label>
                                    <input 
                                        type="text" 
                                        name="first_name"
                                        value={newUser.first_name}
                                        onChange={handleInputChange}
                                        className="w-full"
                                        placeholder="Ism"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Familiya *</label>
                                    <input 
                                        type="text" 
                                        name="last_name"
                                        value={newUser.last_name}
                                        onChange={handleInputChange}
                                        className="w-full"
                                        placeholder="Familiya"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={newUser.email}
                                        onChange={handleInputChange}
                                        className="w-full"
                                        placeholder="email@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Telefon *</label>
                                    <input 
                                        type="tel" 
                                        name="phone"
                                        value={newUser.phone}
                                        onChange={handleInputChange}
                                        className="w-full"
                                        placeholder="+998 XX XXX XXXX"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tashkilot</label>
                                <input 
                                    type="text" 
                                    name="affiliation"
                                    value={newUser.affiliation}
                                    onChange={handleInputChange}
                                    className="w-full"
                                    placeholder="Tashkilot nomi"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Rol *</label>
                                <select 
                                    name="role"
                                    value={newUser.role}
                                    onChange={handleInputChange}
                                    className="w-full"
                                    required
                                >
                                    <option value={Role.Author}>Muallif</option>
                                    <option value={Role.Reviewer}>Taqrizchi</option>
                                    <option value={Role.JournalAdmin}>Jurnal administratori</option>
                                    <option value={Role.Accountant}>Moliyachi</option>
                                    <option value={Role.SuperAdmin}>Bosh administrator</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Parol *</label>
                                <input 
                                    type="password" 
                                    name="password"
                                    value={newUser.password}
                                    onChange={handleInputChange}
                                    className="w-full"
                                    placeholder="Parol"
                                    required
                                />
                            </div>
                            
                            <div className="flex justify-end gap-4 pt-4 border-t border-white/10 mt-6">
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                >
                                    Bekor qilish
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Yaratilmoqda...' : "Foydalanuvchi qo'shish"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </>
    );
};

export default UserManagement;