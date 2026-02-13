import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { UserPlus, ArrowRight, ArrowLeft } from 'lucide-react';
import { apiService } from '../services/apiService';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { getUserFriendlyError, getFieldError } from '../utils/errorHandler';

const RegisterSimple: React.FC = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [step, setStep] = useState(1); // 1: Asosiy ma'lumotlar, 2: Qo'shimcha ma'lumotlar
    
    // Asosiy maydonlar (majburiy)
    const [phone, setPhone] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    
    // Qo'shimcha maydonlar (ixtiyoriy)
    const [email, setEmail] = useState('');
    const [affiliation, setAffiliation] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // Redirect if user is already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Telefon raqamni avtomatik formatlash (998XXXXXXXXX)
    const formatPhone = (value: string): string => {
        // Faqat raqamlarni qoldirish
        const digits = value.replace(/\D/g, '');
        
        // Agar 998 bilan boshlanmasa va 9 ta raqam bo'lsa, 998 qo'shish
        if (digits.length === 9 && !digits.startsWith('998')) {
            return '998' + digits;
        }
        
        // Agar 998 bilan boshlansa, 12 ta raqamgacha qabul qilish
        if (digits.startsWith('998')) {
            return digits.substring(0, 12);
        }
        
        return digits.substring(0, 9);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setPhone(formatted);
    };

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Minimal validation
        if (!phone || phone.length < 9) {
            setError('Iltimos, telefon raqamni kiriting (masalan: 901234567)');
            return;
        }
        
        if (!firstName.trim()) {
            setError('Iltimos, ismingizni kiriting');
            return;
        }
        
        if (!lastName.trim()) {
            setError('Iltimos, familiyangizni kiriting');
            return;
        }
        
        if (!password || password.length < 6) {
            setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
            return;
        }
        
        if (password !== passwordConfirm) {
            setError('Parollar mos kelmayapti');
            return;
        }
        
        // Keyingi bosqichga o'tish
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            // Telefon raqamni to'liq formatlash
            const fullPhone = phone.startsWith('998') ? phone : `998${phone}`;
            
            const userData: any = {
                phone: fullPhone,
                email: email.trim() || `${fullPhone}@temp.phoenix.uz`, // Email bo'lmasa, temp email
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                affiliation: affiliation.trim() || 'N/A', // Bo'lmasa default
                password: password,
                password_confirm: passwordConfirm
            };
            
            const response = await apiService.auth.register(userData);
            
            if (response.access && response.user) {
                toast.success('Muvaffaqiyatli ro\'yxatdan o\'tdingiz!', { autoClose: 2000 });
                
                // Auto login
                try {
                    const loginSuccess = await login(fullPhone, password);
                    if (loginSuccess) {
                        navigate('/dashboard');
                    } else {
                        navigate('/login');
                    }
                } catch (loginError) {
                    console.error('Auto login failed:', loginError);
                    navigate('/login');
                }
            } else {
                throw new Error('Ro\'yxatdan o\'tishda xatolik yuz berdi.');
            }
        } catch (err: any) {
            const phoneError = getFieldError(err, 'phone');
            const emailError = getFieldError(err, 'email');
            const passwordError = getFieldError(err, 'password');
            
            let errorMessage = 'Ro\'yxatdan o\'tishda xatolik yuz berdi.';
            
            if (phoneError) {
                errorMessage = `Telefon raqam: ${phoneError}`;
            } else if (emailError) {
                errorMessage = `Email: ${emailError}`;
            } else if (passwordError) {
                errorMessage = `Parol: ${passwordError}`;
            } else {
                errorMessage = getUserFriendlyError(err);
            }
            
            setError(errorMessage);
            toast.error(errorMessage, { autoClose: 5000 });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Yangi Hisob Yaratish">
            <Card>
                {step === 1 ? (
                    <form onSubmit={handleStep1Submit} className="space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Ro'yxatdan o'tish</h2>
                            <p className="text-sm text-gray-400">Asosiy ma'lumotlarni kiriting</p>
                        </div>
                        
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded text-sm text-red-300">
                                {error}
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Telefon raqam *
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 font-medium whitespace-nowrap">+998</span>
                                <input 
                                    type="tel"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                    placeholder="90 123 45 67"
                                    required
                                    maxLength={12}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Faqat raqam kiriting (masalan: 901234567)</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Ism *</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Ismingiz"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Familiya *</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Familiyangiz"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Parol *</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    required 
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 pr-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Kamida 6 ta belgi"
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Kamida 6 ta belgi (har qanday belgilar)</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Parolni tasdiqlang *</label>
                            <input 
                                type={showPassword ? "text" : "password"}
                                required 
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                placeholder="Parolni qayta kiriting"
                                minLength={6}
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full flex items-center justify-center gap-2"
                        >
                            Keyingi bosqich
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="text-center mb-6">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 mx-auto"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Orqaga
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-2">Qo'shimcha ma'lumotlar</h2>
                            <p className="text-sm text-gray-400">Bu maydonlar ixtiyoriy</p>
                        </div>
                        
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded text-sm text-red-300">
                                {error}
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
                            </label>
                            <input 
                                type="email" 
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                            />
                            <p className="text-xs text-gray-400 mt-1">Bo'sh qoldirish mumkin</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Ish yoki o'qish joyi <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
                            </label>
                            <input 
                                type="text" 
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                value={affiliation}
                                onChange={(e) => setAffiliation(e.target.value)}
                                placeholder="Tashkilot nomi..."
                            />
                            <p className="text-xs text-gray-400 mt-1">Bo'sh qoldirish mumkin</p>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Ro'yxatdan o'tilmoqda...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4" />
                                    Ro'yxatdan o'tish
                                </>
                            )}
                        </Button>
                    </form>
                )}
                
                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-400">
                        Hisobingiz bormi?{' '}
                        <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300">
                            Kirish
                        </Link>
                    </p>
                </div>
            </Card>
        </AuthLayout>
    );
};

export default RegisterSimple;
