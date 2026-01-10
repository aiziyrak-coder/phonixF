import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { UserPlus } from 'lucide-react';
import { apiService } from '../services/apiService';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const COUNTRIES = [
    { code: '+998', label: 'UZ' },
    { code: '+7', label: 'RU' },
    { code: '+1', label: 'US' },
    { code: '+44', label: 'UK' },
    { code: '+49', label: 'DE' },
];

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [countryCode, setCountryCode] = useState('+998');
    const [phone, setPhone] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [patronymic, setPatronymic] = useState('');
    const [email, setEmail] = useState('');
    const [affiliation, setAffiliation] = useState('');
    const [orcidId, setOrcidId] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Redirect if user is already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Validation
        if (!phone || phone.length < 9) {
            setError('Iltimos, to\'g\'ri telefon raqamni kiriting.');
            return;
        }
        
        if (!firstName || !lastName) {
            setError('Iltimos, ism va familiyani kiriting.');
            return;
        }
        
        if (!email || !email.includes('@')) {
            setError('Iltimos, to\'g\'ri email manzilini kiriting.');
            return;
        }
        
        if (!affiliation) {
            setError('Iltimos, ish yoki o\'qish joyini kiriting.');
            return;
        }
        
        if (!password || password.length < 6) {
            setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak.');
            return;
        }
        
        if (password !== passwordConfirm) {
            setError('Parollar mos kelmayapti.');
            return;
        }
        
        setIsLoading(true);
        
        try {
            const fullPhone = `${countryCode}${phone}`.replace(/\s/g, '');
            
            const userData = {
                phone: fullPhone,
                email: email.trim(),
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                patronymic: patronymic.trim() || '',
                affiliation: affiliation.trim(),
                orcid_id: orcidId.trim() || '',
                password: password,
                password_confirm: passwordConfirm
            };
            
            const response = await apiService.auth.register(userData);
            
            if (response.access && response.user) {
                toast.success('Muvaffaqiyatli ro\'yxatdan o\'tdingiz!', { autoClose: 2000 });
                
                // Auto login after registration
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
            console.error('Registration error:', err);
            
            let errorMessage = 'Ro\'yxatdan o\'tishda xatolik yuz berdi.';
            
            if (err.response) {
                // Handle API errors
                const apiError = err.response;
                if (apiError.phone) {
                    errorMessage = `Telefon raqam: ${Array.isArray(apiError.phone) ? apiError.phone[0] : apiError.phone}`;
                } else if (apiError.email) {
                    errorMessage = `Email: ${Array.isArray(apiError.email) ? apiError.email[0] : apiError.email}`;
                } else if (apiError.password) {
                    errorMessage = `Parol: ${Array.isArray(apiError.password) ? apiError.password[0] : apiError.password}`;
                } else if (apiError.detail || apiError.error) {
                    errorMessage = apiError.detail || apiError.error || errorMessage;
                } else if (typeof apiError === 'string') {
                    errorMessage = apiError;
                }
            } else if (err.message) {
                errorMessage = err.message;
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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-2xl font-bold text-center text-white">Ro'yxatdan o'tish</h2>
                    
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded text-sm text-red-300">
                            {error}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Ism *</label>
                            <input 
                                type="text" 
                                required 
                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
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
                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Familiyangiz"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Otasining ismi</label>
                        <input 
                            type="text" 
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                            value={patronymic}
                            onChange={(e) => setPatronymic(e.target.value)}
                            placeholder="Otangizning ismi (ixtiyoriy)"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                        <input 
                            type="email" 
                            required 
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ish yoki o'qish joyi *</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                            value={affiliation}
                            onChange={(e) => setAffiliation(e.target.value)}
                            placeholder="Tashkilot nomi..."
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">ORCID ID</label>
                        <input 
                            type="text" 
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                            value={orcidId}
                            onChange={(e) => setOrcidId(e.target.value)}
                            placeholder="ORCID ID (ixtiyoriy)"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                            Telefon raqam *
                        </label>
                        <div className="flex items-center phone-input-group">
                            <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="shrink-0 p-2 bg-gray-800 border border-gray-700 rounded-l text-white focus:outline-none focus:border-blue-500"
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
                                className="w-full p-2 bg-gray-800 border border-gray-700 border-l-0 rounded-r text-white focus:outline-none focus:border-blue-500"
                                placeholder="Raqamni kiriting"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Parol *</label>
                        <input 
                            type="password" 
                            required 
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Kamida 6 ta belgi"
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Parolni tasdiqlang *</label>
                        <input 
                            type="password" 
                            required 
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            placeholder="Parolni qayta kiriting"
                            minLength={6}
                        />
                    </div>

                    <div>
                        <Button 
                            type="submit" 
                            className="w-full"
                            disabled={isLoading}
                        >
                            <UserPlus className="mr-2 h-4 w-4"/> 
                            {isLoading ? 'Jarayonda...' : 'Ro\'yxatdan o\'tish'}
                        </Button>
                    </div>
                </form>
                <div className="mt-4 text-center text-sm">
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

export default Register;