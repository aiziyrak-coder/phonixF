import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { getUserFriendlyError } from '../utils/errorHandler';

const LoginSimple: React.FC = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if user is already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Telefon raqamni avtomatik formatlash
    const formatPhone = (value: string): string => {
        const digits = value.replace(/\D/g, '');
        
        if (digits.length === 9 && !digits.startsWith('998')) {
            return '998' + digits;
        }
        
        if (digits.startsWith('998')) {
            return digits.substring(0, 12);
        }
        
        return digits.substring(0, 9);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setPhone(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            const fullPhone = phone.startsWith('998') ? phone : `998${phone}`;
            
            if (!fullPhone || fullPhone.length < 9) {
                setError('Iltimos, telefon raqamni kiriting (masalan: 901234567)');
                setIsLoading(false);
                return;
            }
            
            if (!password || password.trim().length === 0) {
                setError('Iltimos, parolni kiriting.');
                setIsLoading(false);
                return;
            }
            
            const success = await login(fullPhone, password);
            
            if (success) {
                // Success - redirect handled by useEffect
            } else {
                setError('Telefon raqam yoki parol xato.');
            }
        } catch (err: any) {
            const errorMessage = getUserFriendlyError(err);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Tizimga kirish">
            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Tizimga kirish</h2>
                        <p className="text-sm text-gray-400">Telefon raqam va parol bilan kirish</p>
                    </div>
                    
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-300">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                            Telefon raqam
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none">+998</span>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={phone}
                                onChange={handlePhoneChange}
                                className="w-full pl-16 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                placeholder="90 123 45 67"
                                required
                                maxLength={12}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Faqat raqam kiriting</p>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            Parol
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                className="w-full p-3 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                placeholder="Parolingizni kiriting"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Link 
                            to="/forgot-password" 
                            className="text-sm text-blue-400 hover:text-blue-300"
                        >
                            Parolni unutdingizmi?
                        </Link>
                    </div>

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
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-400">
                        Hisobingiz yo'qmi?{' '}
                        <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300">
                            Ro'yxatdan o'tish
                        </Link>
                    </p>
                </div>
            </Card>
        </AuthLayout>
    );
};

export default LoginSimple;
