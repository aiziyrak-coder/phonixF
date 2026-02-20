import React, { useState, useRef } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { UploadCloud, CheckCircle, Loader2, XCircle, FileText, Users, AlertTriangle, Eye } from 'lucide-react';
import { useAuth, useNotifications } from '../contexts/AuthContext';
import { Article, ArticleStatus } from '../types';
import { apiService } from '../services/apiService';
import { PlagiarismBadges } from '../components/PlagiarismReport';

const SubmitArticle: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    authorName: '',
    file: null as File | null,
    abstract: '',
    keywords: '',
    references: '',
    coAuthors: [] as { name: string; email: string }[],
  });

  // Plagiarism check state
  const [plagiarism, setPlagiarism] = useState<number>(0);
  const [aiContent, setAiContent] = useState<number>(0);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const steps = [
    { id: 1, title: 'Fayl yuklash', icon: UploadCloud },
    { id: 2, title: 'Maqola tavsifi', icon: FileText },
    { id: 3, title: 'Hammualliflar', icon: Users },
    { id: 4, title: 'Tasdiqlash', icon: Eye },
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.file) {
        newErrors.file = 'Faylni tanlang';
      }
    } else if (step === 2) {
      if (!formData.title.trim()) {
        newErrors.title = 'Maqola mavzusini kiriting';
      }
      if (!formData.authorName.trim()) {
        newErrors.authorName = 'Muallif ism-familiyasini kiriting';
      }
      if (!formData.abstract.trim()) {
        newErrors.abstract = 'Abstraktni kiriting';
      }
      if (!formData.keywords.trim()) {
        newErrors.keywords = 'Kalit so\'zlarni kiriting';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const checkPlagiarism = async () => {
    if (!formData.abstract.trim()) {
      showNotification('Avval abstraktni kiriting', 'error');
      return;
    }

    setChecking(true);
    try {
      // Mock plagiarism check - in real implementation this would call the backend
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock results
      const mockPlagiarism = Math.random() * 30; // 0-30%
      const mockAiContent = Math.random() * 20; // 0-20%

      setPlagiarism(mockPlagiarism);
      setAiContent(mockAiContent);
      setCheckedAt(new Date().toISOString());

      showNotification('Antiplagiat tekshiruvi tugadi', 'success');
    } catch (error) {
      showNotification('Tekshiruvda xatolik yuz berdi', 'error');
    } finally {
      setChecking(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.pdf')) {
        showNotification('Faqat DOCX yoki PDF fayllarini yuklash mumkin', 'error');
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showNotification('Fayl hajmi 10MB dan oshmasligi kerak', 'error');
        return;
      }

      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('author_name', formData.authorName);
      submitData.append('abstract', formData.abstract);
      submitData.append('keywords', formData.keywords);
      submitData.append('references', formData.references);
      submitData.append('file', formData.file!);
      submitData.append('co_authors', JSON.stringify(formData.coAuthors));
      submitData.append('plagiarism_percentage', plagiarism.toString());
      submitData.append('ai_content_percentage', aiContent.toString());
      submitData.append('plagiarism_checked_at', checkedAt || '');

      await apiService.articles.create(submitData);
      showNotification('Maqola muvaffaqiyatli yuborildi', 'success');

      // Reset form
      setFormData({
        title: '',
        authorName: '',
        file: null,
        abstract: '',
        keywords: '',
        references: '',
        coAuthors: [],
      });
      setPlagiarism(0);
      setAiContent(0);
      setCheckedAt(null);
      setCurrentStep(1);
    } catch (error) {
      showNotification('Maqola yuborishda xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addCoAuthor = () => {
    setFormData({
      ...formData,
      coAuthors: [...formData.coAuthors, { name: '', email: '' }]
    });
  };

  const removeCoAuthor = (index: number) => {
    setFormData({
      ...formData,
      coAuthors: formData.coAuthors.filter((_, i) => i !== index)
    });
  };

  const updateCoAuthor = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...formData.coAuthors];
    updated[index][field] = value;
    setFormData({ ...formData, coAuthors: updated });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Maqola yuborish</h1>
        <p className="text-gray-400">Maqolangizni nashr qilish uchun yuboring</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  isCompleted ? 'bg-green-600' :
                  isActive ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  {isCompleted ? <CheckCircle className="w-6 h-6 text-white" /> : <Icon className="w-6 h-6 text-white" />}
                </div>
                <span className={`text-sm font-medium ${
                  isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Fayl yuklash</h2>
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.file ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="text-white font-medium">{formData.file.name}</p>
                    <p className="text-gray-400 text-sm">
                      {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadCloud className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-white font-medium">Faylni tanlang</p>
                    <p className="text-gray-400 text-sm">DOCX yoki PDF, maksimal 10MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {errors.file && <p className="text-red-500 text-sm mt-2">{errors.file}</p>}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Maqola tavsifi</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maqola mavzusi *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Maqola mavzusini kiriting"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Muallif ism-familiyasi *
                </label>
                <input
                  type="text"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Ism familiyani kiriting"
                />
                {errors.authorName && <p className="text-red-500 text-sm mt-1">{errors.authorName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Abstrakt *
              </label>
              <textarea
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Maqola abstraktini kiriting"
              />
              {errors.abstract && <p className="text-red-500 text-sm mt-1">{errors.abstract}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kalit so'zlar *
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Kalit so'zlarni vergul bilan ajratib kiriting"
              />
              {errors.keywords && <p className="text-red-500 text-sm mt-1">{errors.keywords}</p>}
            </div>

            {/* Plagiarism Check Section */}
            <div className="border-t border-gray-600 pt-6">
              <h3 className="text-lg font-medium text-white mb-4">Antiplagiat tekshiruvi</h3>

              <div className="flex items-center justify-between mb-4">
                <Button
                  onClick={checkPlagiarism}
                  disabled={checking || !formData.abstract.trim()}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {checking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  {checking ? 'Tekshirilmoqda...' : 'Antiplagiat tekshiruvi'}
                </Button>

                {checkedAt && (
                  <PlagiarismBadges
                    plagiarism={plagiarism}
                    ai={aiContent}
                    checkedAt={checkedAt}
                  />
                )}
              </div>

              {checkedAt && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    <strong>Plagiat foizi:</strong> {plagiarism.toFixed(1)}% |
                    <strong> AI kontent:</strong> {aiContent.toFixed(1)}%
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Tekshiruv vaqti: {new Date(checkedAt).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  <strong>Qanday hisoblanadi?</strong> Antiplagiat tekshiruvi maqola matnini millionlab ilmiy manbalar bilan solishtiradi.
                  Plagiat foizi - matnning qanchalik mos kelishi, AI kontent - sun'iy intellekt tomonidan yaratilganlik darajasi.
                  Odatda plagiat 15% dan kam, AI kontent 10% dan kam bo'lishi kerak.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Hammualliflar</h2>

            {formData.coAuthors.map((coAuthor, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hammuallif ismi
                  </label>
                  <input
                    type="text"
                    value={coAuthor.name}
                    onChange={(e) => updateCoAuthor(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Ism familiyani kiriting"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={coAuthor.email}
                    onChange={(e) => updateCoAuthor(index, 'email', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
                <Button
                  onClick={() => removeCoAuthor(index)}
                  variant="secondary"
                  className="mb-0"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button onClick={addCoAuthor} variant="secondary" className="w-full">
              + Hammuallif qo'shish
            </Button>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Tasdiqlash</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Fayl</h3>
                <p className="text-gray-300">{formData.file?.name}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-2">Maqola ma'lumotlari</h3>
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <p><strong>Mavzu:</strong> {formData.title}</p>
                  <p><strong>Muallif:</strong> {formData.authorName}</p>
                  <p><strong>Kalit so'zlar:</strong> {formData.keywords}</p>
                  <p><strong>Abstrakt:</strong> {formData.abstract.substring(0, 100)}...</p>
                </div>
              </div>

              {checkedAt && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Antiplagiat natijalari</h3>
                  <PlagiarismBadges
                    plagiarism={plagiarism}
                    ai={aiContent}
                    checkedAt={checkedAt}
                  />
                </div>
              )}

              {formData.coAuthors.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Hammualliflar</h3>
                  <div className="space-y-2">
                    {formData.coAuthors.map((coAuthor, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3">
                        <p>{coAuthor.name} - {coAuthor.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-600">
          <Button
            onClick={prevStep}
            disabled={currentStep === 1}
            variant="secondary"
          >
            Orqaga
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={nextStep}>
              Keyingi
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Yuborish
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SubmitArticle;
