import React from 'react';
import { Article, User, ArticleStatus } from '../types';
import { PhoenixLogo, Seal } from './CertificateElements';
import { MOCK_JOURNALS } from '../data/mockData';

const getStatusDisplayData = (status: ArticleStatus): { text: string; color: string } => {
    const map: Record<ArticleStatus, { text: string; color: string }> = {
        [ArticleStatus.Draft]: { text: 'Qoralama', color: 'text-gray-600' },
        [ArticleStatus.Yangi]: { text: 'Yangi', color: 'text-blue-600' },
        [ArticleStatus.WithEditor]: { text: 'Redaktorda', color: 'text-indigo-600' },
        [ArticleStatus.QabulQilingan]: { text: 'Qabul Qilingan', color: 'text-yellow-700' },
        [ArticleStatus.Revision]: { text: 'Tahrirda', color: 'text-orange-600' },
        [ArticleStatus.Accepted]: { text: 'Ma\'qullangan', color: 'text-teal-600' },
        [ArticleStatus.Published]: { text: 'Nashr etilgan', color: 'text-green-700' },
        [ArticleStatus.Rejected]: { text: 'Rad etilgan', color: 'text-red-600' },
        [ArticleStatus.NashrgaYuborilgan]: { text: 'Nashrga Yuborilgan', color: 'text-purple-600' },
        [ArticleStatus.WritingInProgress]: { text: 'Yozilmoqda', color: 'text-cyan-600' },
    };
    return map[status] || { text: status, color: 'text-gray-600' };
};

const WatermarkBackground = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="absolute inset-0 z-0">
        <rect width="100%" height="100%" fill="#ffffff" />
        <g transform="translate(420 297) rotate(15) scale(2.5)">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#3A527A]" opacity="0.03">
                <path d="M16.88,7.31c-2.39-2.39-6.26-2.39-8.65,0L12,11.06L16.88,7.31z" fill="currentColor" opacity="0.5"/>
                <path d="M11.06,12l-3.75,3.75c2.39,2.39,6.26,2.39,8.65,0l-4.9-4.9V12z" fill="currentColor"/>
                <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10c5.52,0,10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z" fill="currentColor"/>
            </svg>
        </g>
    </svg>
);

interface AuthorArticleReportProps {
    articles: Article[];
    author: User;
}

const AuthorArticleReport: React.FC<AuthorArticleReportProps> = ({ articles, author }) => {
    return (
        <div className="bg-white text-gray-800 aspect-[210/297] w-full max-w-4xl mx-auto shadow-lg overflow-hidden relative font-sans p-2 print:shadow-none">
            <WatermarkBackground />
            <div className="absolute inset-4 border border-gray-400 p-1">
                <div className="w-full h-full border border-gray-300"></div>
            </div>
            <div className="relative z-10 flex flex-col h-full w-full px-16 py-12">
                <header className="flex flex-col items-center w-full pb-4">
                    <PhoenixLogo />
                    <p className="font-serif text-md text-slate-700 tracking-widest uppercase mt-2">Phoenix Ilmiy Nashrlar Markazi</p>
                </header>
                
                <h1 className="font-serif text-4xl font-bold text-[#3A527A] tracking-wide my-6 text-center">
                   MAQOLALAR BO'YICHA MA'LUMOTNOMA
                </h1>

                <main className="flex-grow text-base text-slate-800">
                    <div className="mb-6 text-sm">
                        <p><strong>Muallif:</strong> {author.lastName} {author.firstName} {author.patronymic}</p>
                        <p><strong>Tashkilot:</strong> {author.affiliation}</p>
                        <p><strong>Sana:</strong> {new Date().toLocaleDateString('uz-UZ')}</p>
                    </div>
                    
                    <div className="overflow-auto border border-gray-300 rounded-lg">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left font-semibold text-gray-700 w-8">№</th>
                                    <th className="p-2 text-left font-semibold text-gray-700">Sarlavha</th>
                                    <th className="p-2 text-left font-semibold text-gray-700">Jurnal</th>
                                    <th className="p-2 text-left font-semibold text-gray-700 whitespace-nowrap">Sana</th>
                                    <th className="p-2 text-left font-semibold text-gray-700">Holati</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {articles.map((article, index) => {
                                    const journal = MOCK_JOURNALS.find(j => j.id === article.journalId);
                                    const statusInfo = getStatusDisplayData(article.status);
                                    return (
                                        <tr key={article.id}>
                                            <td className="p-2 align-top">{index + 1}</td>
                                            <td className="p-2 align-top font-medium text-gray-800">{article.title}</td>
                                            <td className="p-2 align-top text-gray-600">{journal?.name || '-'}</td>
                                            <td className="p-2 align-top text-gray-600 whitespace-nowrap">{new Date(article.submissionDate).toLocaleDateString('uz-UZ')}</td>
                                            <td className={`p-2 align-top font-semibold ${statusInfo.color}`}>{statusInfo.text}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </main>

                <footer className="flex justify-between items-end w-full pt-6 mt-auto">
                     <div className="text-left text-xs text-slate-500">
                        <p>PINM tizimi orqali yaratildi.</p>
                     </div>
                    <Seal />
                    <div className="text-center">
                        <div className="w-48 h-12 mb-1"></div>
                        <div className="w-48 h-px bg-slate-600"></div>
                        <p className="text-sm font-semibold text-slate-800 mt-1">Bosh Redaktor</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AuthorArticleReport;
