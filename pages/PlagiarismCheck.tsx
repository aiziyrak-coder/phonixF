import React, { useState, useRef } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Upload, FileCheck, Printer, Link as LinkIcon, CreditCard } from 'lucide-react';
import { useAuth, useNotifications } from '../contexts/AuthContext';
import { CertificateData } from '../types';
import Certificate from '../components/Certificate';
import { apiService } from '../services/apiService';
import { paymentService } from '../services/paymentService';
import { toast } from 'react-toastify';

// New types for detailed results
interface PlagiarismSource {
  source: string;
  similarity: number;
  snippet: string;
}

interface PlagiarismResult {
  plagiarism: number;
  aiContent: number;
  sources: PlagiarismSource[];
}

interface PlagiarismCheckRequest {
  id: string;
  fileName: string;
  status: 'pending' | 'completed' | 'failed';
  plagiarismPercentage?: number;
  aiContentPercentage?: number;
  sources?: PlagiarismSource[];
  createdAt: string;
  userId: string;
}

// Antiplagiat tekshiruvi narxi
const PLAGIARISM_CHECK_PRICE = 50000; // 50,000 so'm

const PlagiarismCheck: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [file, setFile] = useState<File | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  
  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [articleId, setArticleId] = useState<string | null>(null);
  const paymentTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  React.useEffect(() => {
      return () => {
          if (paymentTimerRef.current) {
              clearTimeout(paymentTimerRef.current);
          }
      };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setFile(e.target.files[0]);
          setResult(null);
          setCertificateData(null);
          setProgress(0);
          setArticleId(null);
      }
  };
  
  const handlePrint = () => {
      window.print();
  };

  const closePaymentModal = () => {
      setIsPaymentModalOpen(false);
      if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);
      setPaymentStatus('idle');
      setPaymentError(null);
  };

  const handlePay = async () => {
      if (!file || !user) return;

      setPaymentError(null);
      setPaymentStatus('processing');
      if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);

      try {
          // Create transaction and process payment via Click
          const result = await paymentService.createTransactionAndPay(
              PLAGIARISM_CHECK_PRICE,
              'UZS',
              'language_editing', // Using language_editing as service type for plagiarism check
              articleId || undefined
          );
          
          console.log('Payment result:', result);
          
          if (result && result.success === true && result.payment_url) {
              // Close modal first
              setIsPaymentModalOpen(false);
              
              // Show notification
              addNotification({ 
                  message: 'To\'lov sahifasiga yo\'naltirilmoqdasiz. To\'lovni tugallang.',
              });
              
              // Redirect to Click payment page after short delay
              setTimeout(() => {
                  if (result.payment_url) {
                      console.log('Redirecting to payment URL:', result.payment_url);
                      paymentService.redirectToPayment(result.payment_url);
                  } else {
                      console.error('Payment URL is missing');
                      setPaymentStatus('failed');
                      setPaymentError("To'lov URL topilmadi. Iltimos, qayta urinib ko'ring.");
                      setIsPaymentModalOpen(true);
                  }
              }, 500);
          } else {
              // Payment preparation failed
              const errorMsg = result?.user_message || result?.error_note || result?.error || "To'lovni amalga oshirishda xatolik yuz berdi.";
              setPaymentStatus('failed');
              setPaymentError(errorMsg);
              addNotification({ 
                  message: errorMsg,
              });
          }
      } catch (err: any) {
          console.error('Payment failed:', err);
          const errorMsg = err.message || err.error_note || err.user_message || "To'lovni amalga oshirishda xatolik yuz berdi.";
          setPaymentStatus('failed');
          setPaymentError(errorMsg);
      }
  };

  const MOCK_SOURCES = [
      { url: 'www.ilmiymaqolalar.uz/archive/2021/article-15.html', snippet: '...bu esa o\'z navbatida iqtisodiy o\'sishga sezilarli ta\'sir ko\'rsatadi va innovatsion rivojlanishga olib keladi...' },
      { url: 'cyberleninka.ru/article/n/digital-economy-trends-uz', snippet: '...the integration of artificial intelligence technologies is a key factor for future development...' },
      { url: 'jstor.org/stable/25733682', snippet: '...methodology involved a qualitative analysis of emerging market trends...' },
      { url: 'researchgate.net/publication/3456789/AI_in_Economics', snippet: '...sun\'iy intellekt texnologiyalarini joriy etish kelajakdagi rivojlanishning asosiy omili hisoblanadi...' },
  ];

  const handleCheck = async (paymentCompleted = false) => {
      if (!file || !user) return;
      
      // If payment is not completed, show payment modal first
      if (!paymentCompleted) {
          setIsPaymentModalOpen(true);
          return;
      }
      
      setIsChecking(true);
      setCertificateData(null);
      setResult(null);
      setProgress(0);

      try {
          // First, create an article with the uploaded file for plagiarism check
          const articleData = {
              title: `Plagiarism Check - ${file.name}`,
              abstract: 'Document submitted for plagiarism check',
              keywords: ['plagiarism', 'check', 'document'],
              status: 'Yangi', // New
              authorId: user.id,
              journalId: null, // No journal for plagiarism check service
              submissionDate: new Date().toISOString(),
          };

          // Create article with file
          const articleResponse = await apiService.articles.create(
              articleData,
              { mainFile: file }
          );

          // Save article ID for payment
          setArticleId(articleResponse.id);

          // Now trigger the plagiarism check on this article
          const plagiarismResult = await apiService.articles.checkPlagiarism(articleResponse.id);
          
          // Update UI with the results
          const plagiarismPercentage = plagiarismResult.plagiarism || 0;
          const aiContentPercentage = plagiarismResult.ai_content || 0;
          const originality = 100 - plagiarismPercentage;

          // Generate sources (for now using mock, but in real implementation these would come from the API)
          const numSources = Math.floor(Math.random() * 2) + 2; // 2 to 3 sources
          const shuffledSources = [...MOCK_SOURCES].sort(() => 0.5 - Math.random());
          const foundSources: PlagiarismSource[] = [];
          let remainingPlagiarism = plagiarismPercentage;
          
          for(let i=0; i<numSources; i++){
              if(remainingPlagiarism <= 0) break;
              const similarity = Math.min(remainingPlagiarism, Math.floor(Math.random() * 4) + 2); // 2-5% per source
              remainingPlagiarism -= similarity;
              foundSources.push({
                  source: shuffledSources[i].url,
                  snippet: shuffledSources[i].snippet,
                  similarity: similarity,
              });
          }

          const finalResult = {
              plagiarism: plagiarismPercentage,
              aiContent: aiContentPercentage,
              sources: foundSources,
          };

          setResult(finalResult);

          const newCertificateData: CertificateData = {
            certificateNumber: `PN-${Date.now().toString().slice(-6)}`,
            checkDate: new Date().toLocaleDateString('uz-UZ'),
            author: `${user.lastName} ${user.firstName}`,
            workType: 'Ilmiy ish',
            fileName: file.name,
            citations: '0%', // Mocked data
            plagiarism: `${plagiarismPercentage}%`,
            originality: `${originality.toFixed(2)}%`,
            searchModules: 'Milliy reestr, Internet plyus, Shablon iboralar, eLIBRARY.RU, Bibliografiya, BMK dissertatsiyalari, Viloy nashriyoti, Universitetlar halqasi, IPS Adilet, Tabobat, Tarjimali matnlar qidiruv moduli, Patentlar, Tarjima tekshiruvi uz-ru, Tarjima tekshiruvi uz-ru, parafaz matnlarni tekshirish, RDK to\'plami, Rossiya va MDH OAVlari, Elektron-kutubxona tizimlari, Garant AHT, Iqtibos keltirish, SPS Garant',
          };
          setCertificateData(newCertificateData);

          toast.success('Antiplagiat tekshiruvi muvaffaqiyatli amalga oshirildi!');
      } catch (error) {
          console.error('Error during plagiarism check:', error);
          toast.error('Antiplagiat tekshiruvida xatolik yuz berdi: ' + (error as Error).message);
      } finally {
          setIsChecking(false);
          setProgress(100);
      }
  };

  return (
      <>
      <Card title="Mustaqil Antiplagiat Tekshiruvi" className="no-print">
          <div className="text-center">
              <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="p-10 border-2 border-dashed rounded-lg dark:border-gray-600 bg-white/5 hover:bg-white/10 transition-colors">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-300">
                          {file ? `Tanlangan fayl: ${file.name}` : 'Tekshirish uchun faylni tanlang (.docx, .pdf)'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Maksimal hajmi: 10MB</p>
                  </div>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
              </label>
          </div>
          <div className="mt-6 text-center space-y-4">
              <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">
                      <span className="font-semibold text-blue-300">Narx:</span> {PLAGIARISM_CHECK_PRICE.toLocaleString()} so'm
                  </p>
                  <p className="text-xs text-gray-400">
                      Antiplagiat tekshiruvi uchun to'lov talab qilinadi
                  </p>
              </div>
              <Button onClick={() => handleCheck(false)} disabled={!file || isChecking} isLoading={isChecking} className="w-full max-w-xs mx-auto">
                  {isChecking ? 'Tekshirilmoqda...' : <><FileCheck className="mr-2 h-4 w-4" /> To'lov va Tekshirish</>}
              </Button>
          </div>

          {isChecking && (
              <div className="mt-8 max-w-lg mx-auto">
                  <p className="text-center text-gray-300 mb-2">Tahlil qilinmoqda... Iltimos, kuting.</p>
                  <div className="w-full bg-white/10 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}></div>
                  </div>
              </div>
          )}

          {result && (
              <div className="mt-8">
                  <h3 className="text-xl font-bold text-center mb-4 text-white">Tekshiruv Natijalari</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto p-4 bg-white/5 rounded-lg">
                      <div className="p-4 bg-white/5 rounded-lg text-center">
                          <p className="text-sm text-gray-400">Originallik</p>
                          <p className="text-4xl font-bold text-green-400 mt-1">{100 - result.plagiarism}%</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg text-center">
                          <p className="text-sm text-gray-400">O'xshashlik (Plagiat)</p>
                          <p className="text-4xl font-bold text-yellow-400 mt-1">{result.plagiarism}%</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg text-center">
                          <p className="text-sm text-gray-400">AI-Kontent</p>
                          <p className="text-4xl font-bold text-cyan-400 mt-1">{result.aiContent}%</p>
                      </div>
                  </div>

                   <Card title="Topilgan manbalar" className="mt-6 max-w-3xl mx-auto">
                      <p className="text-sm text-gray-400 mb-4 -mt-4">Tizim matningizga o'xshashlik topgan manbalar ro'yxati. Bu natijalar taxminiy bo'lib, yakuniy xulosa uchun qo'shimcha tahlil talab etilishi mumkin.</p>
                      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                          {result.sources.map((source, index) => (
                          <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                              <div className="flex justify-between items-start text-sm">
                                  <a href={`https://${source.source}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:underline break-all">
                                      <LinkIcon size={14}/> {source.source}
                                  </a>
                                  <span className="font-bold text-yellow-300 whitespace-nowrap ml-4">{source.similarity}% o'xshashlik</span>
                              </div>
                              <blockquote className="mt-2 pl-3 border-l-2 border-yellow-500/50 text-xs text-gray-400 italic">
                                  {source.snippet}
                              </blockquote>
                          </div>
                          ))}
                      </div>
                  </Card>
              </div>
          )}
      </Card>
      
      {certificateData && (
          <div className="mt-8">
              <div className="flex justify-between items-center mb-4 no-print">
                  <h2 className="text-2xl font-bold text-white">Tekshiruv Sertifikati</h2>
                   <Button onClick={handlePrint} variant="secondary">
                      <Printer className="mr-2 h-4 w-4"/> Sertifikatni Chop Etish
                  </Button>
              </div>
              <div id="certificate-print-area">
                  <Certificate data={certificateData} />
              </div>
          </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-white/10">
                  {paymentStatus === 'idle' && (
                      <div>
                          <h3 className="text-xl font-semibold text-white mb-4">To'lovni tasdiqlash</h3>
                          <p className="text-gray-300 mb-4">
                              Antiplagiat tekshiruvi uchun to'lov: <span className="font-bold text-blue-400">{PLAGIARISM_CHECK_PRICE.toLocaleString()} so'm</span>
                          </p>
                          <div className="flex gap-3">
                              <Button onClick={handlePay} className="flex-1">
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  To'lovni Amalga Oshirish
                              </Button>
                              <Button variant="secondary" onClick={closePaymentModal} className="flex-1">
                                  Bekor qilish
                              </Button>
                          </div>
                      </div>
                  )}
                  {paymentStatus === 'processing' && (
                      <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                          <p className="mt-4 text-lg font-medium text-gray-200">To'lov tasdiqlanmoqda...</p>
                      </div>
                  )}
                  {paymentStatus === 'success' && (
                      <div className="text-center">
                          <div className="text-green-500 text-4xl mb-4">✓</div>
                          <p className="mt-4 text-lg font-medium text-gray-200">To'lov muvaffaqiyatli!</p>
                          <Button onClick={() => { closePaymentModal(); handleCheck(true); }} className="w-full mt-6">
                              Tekshirishni Davom Ettirish
                          </Button>
                      </div>
                  )}
                  {paymentStatus === 'failed' && (
                      <div>
                          <div className="text-red-500 text-4xl mb-4 text-center">✗</div>
                          <p className="mt-4 text-lg font-medium text-gray-200 text-center">To'lovda xatolik!</p>
                          <p className="text-sm text-gray-400 max-w-xs mx-auto text-center mb-4">{paymentError}</p>
                          <div className="flex gap-3">
                              <Button onClick={handlePay} className="flex-1">
                                  Qayta Urinish
                              </Button>
                              <Button variant="secondary" onClick={closePaymentModal} className="flex-1">
                                  Yopish
                              </Button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
      </>
  );
};

export default PlagiarismCheck;