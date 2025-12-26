
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { UserPlus } from 'lucide-react';

const COUNTRIES = [
    { code: '+998', label: 'UZ' },
    { code: '+7', label: 'RU' },
    { code: '+1', label: 'US' },
    { code: '+44', label: 'UK' },
    { code: '+49', label: 'DE' },
];

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [countryCode, setCountryCode] = useState('+998');
    const [phone, setPhone] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would use countryCode and phone for registration
        alert("Muvaffaqiyatli ro'yxatdan o'tdingiz! Iltimos, tizimga kiring.");
        navigate('/login');
    };

    return (
        <AuthLayout title="Yangi Hisob Yaratish">
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-2xl font-bold text-center text-white">Ro'yxatdan o'tish</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Ism</label>
                            <input type="text" required className="w-full"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Familiya</label>
                            <input type="text" required className="w-full"/>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Otasining ismi</label>
                        <input type="text" required className="w-full"/>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ish yoki o'qish joyi</label>
                        <input type="text" required className="w-full" placeholder="Tashkilot nomi..."/>
                    </div>
                    
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
                                placeholder="Raqamni kiriting"
                                required
                            />
                        </div>
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Parol</label>
                        <input type="password" required className="w-full"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Parolni tasdiqlang</label>
                        <input type="password" required className="w-full"/>
                    </div>

                    <div>
                        <Button type="submit" className="w-full">
                            <UserPlus className="mr-2 h-4 w-4"/> Ro'yxatdan o'tish
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