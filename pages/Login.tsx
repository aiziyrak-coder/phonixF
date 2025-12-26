import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_USERS } from '../data/mockData';
import AuthLayout from '../components/AuthLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { LogIn } from 'lucide-react';
import { Role } from '../types';

const COUNTRIES = [
    { code: '+998', label: 'UZ' },
    { code: '+7', label: 'RU' },
    { code: '+1', label: 'US' },
    { code: '+44', label: 'UK' },
    { code: '+49', label: 'DE' },
];

const Login: React.FC = () => {
    const [countryCode, setCountryCode] = useState('+998');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if user is already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            const fullPhone = `${countryCode}${phone}`.replace(/\s/g, '');
            const success = await login(fullPhone, password);
            
            if (success) {
                // The useEffect will handle the redirect when the user state updates
            } else {
                setError('Telefon raqam yoki parol xato.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutofill = (user: (typeof MOCK_USERS)[0]) => {
        try {
            const userPhone = user.phone.replace(/\s/g, '');
            let matchedCountry = COUNTRIES.find(c => userPhone.startsWith(c.code)) || COUNTRIES[0];
            setCountryCode(matchedCountry.code);
            setPhone(userPhone.substring(matchedCountry.code.length));
            setPassword(user.password || '');
            setError('');
        } catch (error) {
            console.error('Autofill error:', error);
            setError('Avtomatik to\'ldirishda xatolik yuz berdi');
        }
    };
    
    const roleNames: Record<Role, string> = {
        [Role.Author]: 'Muallif',
        [Role.Reviewer]: 'Taqrizchi',
        [Role.JournalAdmin]: 'Jurnal administratori',
        [Role.SuperAdmin]: 'Bosh administrator',
        [Role.Accountant]: 'Moliyachi',
    };

    return (
        <AuthLayout title="Tizimga kirish">
            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                     <h2 className="text-2xl font-bold text-center text-white">Tizimga kirish</h2>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                            Telefon raqam
                        </label>
                        <div className="flex items-center phone-input-group">
                            <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="shrink-0"
                                aria-label="Country code"
                            >
                                {COUNTRIES.map(c => (
                                    <option key={c.code} value={c.code}>{`${c.label} (${c.code})`}</option>
                                ))}
                            </select>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                className="w-full"
                                placeholder="90 123 45 67"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            Parol
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            className="w-full"
                            placeholder="••••••••"
                        />
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mt-4">
                            {error}
                        </div>
                    )}

                    <div>
                        <Button 
                            type="submit" 
                            className="w-full flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Kirish amalga oshirilmoqda...
                                </>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Tizimga kirish
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                 <div className="mt-6 text-center text-sm">
                    <p className="text-gray-400">
                        Hisobingiz yo'qmi?{' '}
                        <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300">
                            Ro'yxatdan o'tish
                        </Link>
                    </p>
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/10">
                     <p className="text-sm text-gray-400 mb-4 text-center">Test uchun istalgan foydalanuvchi ustiga bosing:</p>
                    <div className="overflow-x-auto rounded-lg border border-white/10">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Rol</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Parol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {MOCK_USERS.map(user => (
                                    <tr key={user.id} onClick={() => handleAutofill(user)} className="cursor-pointer hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-2 text-gray-200">{roleNames[user.role]}</td>
                                        <td className="px-4 py-2 text-gray-200 font-mono">{user.password}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </AuthLayout>
    );
};

export default Login;
