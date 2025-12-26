import React, { useState, useRef } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Upload, Languages, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth, useNotifications } from '../contexts/AuthContext';
import { TranslationStatus } from '../types';
import { apiService } from '../services/apiService';
import { toast } from 'react-toastify';

interface FileAnalysis {
  wordCount: number;
  cost: number;
  fileName: string;
}

const TranslationService: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [file, setFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState('uz');
  const [targetLang, setTargetLang] = useState('en');
  const [analysisResult, setAnalysisResult] = useState<FileAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = [
    { code: 'uz', name: 'O\'zbekcha' },
    { code: 'en', name: 'Inglizcha' },
    { code: 'ru', name: 'Ruscha' },
    { code: 'fr', name: 'Fransuzcha' },
    { code: 'de', name: 'Nemischa' },
    { code: 'es', name: 'Ispancha' },
    { code: 'ar', name: 'Arabcha' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setAnalysisResult(null);
    }
  };

  const analyzeFile = async () => {
    if (!file) {
      toast.error('Iltimos, fayl tanlang');
      return;
    }

    setIsAnalyzing(true);
    try {
      // In a real implementation, we would extract text and count words
      // For now, we'll simulate with a calculation based on file size
      const fileSizeInKB = file.size / 1024;
      // Estimate ~150 words per KB for text documents
      const estimatedWords = Math.round(fileSizeInKB * 150);
      // Cost: 500 so'm per word
      const estimatedCost = estimatedWords * 500;

      setAnalysisResult({
        wordCount: estimatedWords,
        cost: estimatedCost,
        fileName: file.name,
      });

      toast.success('Fayl tahlili tugallandi!');
    } catch (error) {
      console.error('Error analyzing file:', error);
      toast.error('Fayl tahlilida xatolik yuz berdi');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createTranslationRequest = async (fileToUpload: File) => {
    if (!user || !fileToUpload || !analysisResult) return;
    
    try {
      // Create translation request with file upload
      const translationData = {
        title: fileToUpload.name,
        source_language: sourceLang,
        target_language: targetLang,
        status: TranslationStatus.Yangi,
        word_count: analysisResult.wordCount,
        cost: analysisResult.cost,
        submission_date: new Date().toISOString().split('T')[0],
      };
      
      const result = await apiService.translations.create({
        ...translationData,
        file: fileToUpload
      });
      
      addNotification({ 
        message: `"${translationData.title}" uchun tarjima so'rovi qabul qilindi.`,
        link: `/my-translations`
      });
      
      return result;
    } catch (error) {
      console.error('Failed to create translation request:', error);
      addNotification({ 
        message: 'Tarjima so\'rovi yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
      });
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!file || !analysisResult || !user) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTranslationRequest(file);
      toast.success('Tarjima so\'rovi muvaffaqiyatli yuborildi!');
      // Reset form
      setFile(null);
      setAnalysisResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('So\'rov yuborishda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card title="Ilmiy Tarjima Xizmati">
        <div className="space-y-6">
          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Hujjatni Yuklash
            </label>
            <div className="flex items-center justify-center w-full">
              <label 
                htmlFor="file-upload" 
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer border-gray-600 hover:border-gray-500 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-400">
                    <span className="font-semibold">Fayl tanlash</span> yoki olib keling
                  </p>
                  <p className="text-xs text-gray-500">
                    DOC, DOCX, PDF (MAX. 10MB)
                  </p>
                  {file && (
                    <p className="mt-2 text-sm text-green-400 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {file.name}
                    </p>
                  )}
                </div>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                  ref={fileInputRef}
                />
              </label>
            </div>
          </div>

          {/* Language Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Manba Tili
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maqsad Tili
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Analysis and Submit Section */}
          {file && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Button
                  onClick={analyzeFile}
                  disabled={isAnalyzing}
                  variant="secondary"
                  className="w-full max-w-xs"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Tahlil qilinmoqda...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Hujjatni Tahlil Qilish
                    </>
                  )}
                </Button>
              </div>

              {analysisResult && (
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="font-medium text-white mb-3 flex items-center">
                    <Languages className="mr-2 h-5 w-5 text-blue-400" />
                    Tahlil Natijalari
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-900/20 rounded border border-blue-700/30">
                      <p className="text-sm text-blue-300">Fayl nomi</p>
                      <p className="font-medium text-white truncate">{analysisResult.fileName}</p>
                    </div>
                    <div className="p-3 bg-green-900/20 rounded border border-green-700/30">
                      <p className="text-sm text-green-300">So'zlar soni</p>
                      <p className="font-medium text-white">{analysisResult.wordCount.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-yellow-900/20 rounded border border-yellow-700/30">
                      <p className="text-sm text-yellow-300">Taxminiy narx</p>
                      <p className="font-medium text-white">{analysisResult.cost.toLocaleString()} so'm</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Yuborilmoqda...
                          </>
                        ) : (
                          <>
                            <Languages className="mr-2 h-4 w-4" />
                            Tarjima So'rovi Yuborish
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setAnalysisResult(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                          setFile(null);
                        }}
                        variant="secondary"
                      >
                        Bekor qilish
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Information Section */}
          <div className="p-4 bg-blue-900/10 border border-blue-700/30 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-300">Muhim Ma'lumot</h4>
                <p className="mt-1 text-sm text-gray-300">
                  Tarjima xizmati uchun narx so'zlar soniga qarab hisoblanadi. Hozirgi narx:
                  500 so'm har bir so'z uchun. Sifatli tarjima mutaxassislarning qo'lidan chiqadi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TranslationService;