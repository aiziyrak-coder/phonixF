import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { apiService } from '../services/apiService';
import { BookOpen, Download, ExternalLink, Loader2 } from 'lucide-react';

interface PublicArticleData {
  id: string;
  title: string;
  status: string;
  doi?: string;
  submission_date?: string;
  author_name?: string;
  journal_name?: string;
  publication_link?: string;
  certificate_download_link?: string;
  plagiarism_history?: {
    checked_at: string;
    plagiarism_percentage: number | null;
    ai_content_percentage: number | null;
    details?: string;
  }[];
}

const PublicArticleShare: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<PublicArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicArticle = async () => {
      if (!id) {
        setError('Maqola havolasi noto‘g‘ri.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await apiService.articles.getPublic(id);
        const data = response?.data || response;
        setArticle(data);
      } catch (err: any) {
        setError(err?.message || 'Maqola ma’lumotlarini yuklashda xatolik yuz berdi.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <Card title="Maqola ma'lumotlari yuklanmoqda">
          <div className="flex items-center justify-center py-12 text-gray-300">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Yuklanmoqda...
          </div>
        </Card>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <Card title="Maqola topilmadi">
          <p className="text-red-300">{error || 'Maqola topilmadi.'}</p>
          <div className="mt-5">
            <Link to="/login">
              <Button>Kirish sahifasiga o‘tish</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <Card title="Nashr etilgan maqola">
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-white leading-snug">{article.title}</h2>
            <p className="text-sm text-gray-400 mt-2">
              Muallif: <span className="text-gray-200">{article.author_name || 'Noma’lum'}</span>
            </p>
            <p className="text-sm text-gray-400">
              Jurnal: <span className="text-gray-200">{article.journal_name || 'Noma’lum'}</span>
            </p>
            {article.doi && (
              <p className="text-sm text-gray-400">
                DOI: <span className="text-gray-200">{article.doi}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={article.publication_link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={article.publication_link ? '' : 'pointer-events-none opacity-50'}
            >
              <Button variant="secondary" className="w-full justify-center">
                <ExternalLink className="mr-2 h-4 w-4" />
                Nashr internet havolasi
              </Button>
            </a>

            <a
              href={article.certificate_download_link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={article.certificate_download_link ? '' : 'pointer-events-none opacity-50'}
              download
            >
              <Button variant="secondary" className="w-full justify-center">
                <Download className="mr-2 h-4 w-4" />
                Sertifikatni yuklash
              </Button>
            </a>
          </div>

          {(!article.publication_link || !article.certificate_download_link) && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm">
              Ba'zi ma'lumotlar hali to‘ldirilmagan bo‘lishi mumkin.
            </div>
          )}

          <div className="pt-2">
            <h3 className="text-lg font-semibold text-white mb-3">Antiplagiat tarixi</h3>
            {Array.isArray(article.plagiarism_history) && article.plagiarism_history.length > 0 ? (
              <div className="space-y-2">
                {article.plagiarism_history.map((item, index) => (
                  <div key={`${item.checked_at}-${index}`} className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-400">
                      Tekshiruv vaqti: {item.checked_at ? new Date(item.checked_at).toLocaleString() : 'Noma’lum'}
                    </p>
                    <div className="mt-1 text-sm text-gray-200 flex flex-col sm:flex-row sm:gap-6">
                      <span>Plagiat: <strong>{item.plagiarism_percentage ?? '—'}%</strong></span>
                      <span>AI kontent: <strong>{item.ai_content_percentage ?? '—'}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400">
                Hozircha antiplagiat tarixi mavjud emas.
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link to="/login">
              <Button>
                <BookOpen className="mr-2 h-4 w-4" /> Platformaga kirish
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PublicArticleShare;
