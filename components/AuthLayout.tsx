
import React from 'react';

const AuthLayout: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => {
    return (
        <div className="min-h-screen bg-transparent flex flex-col justify-center items-center p-4">
             <div className="text-center mb-8">
                <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">Phoenix Ilmiy Nashrlar Markazi</h1>
                <p className="text-gray-300 mt-3 text-lg">PINM Tizimiga Xush Kelibsiz</p>
            </div>
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;