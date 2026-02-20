import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeft, FileText, Upload, Search, Filter, Plus, Edit, Trash2, Eye, Calendar, User, BookOpen, CheckCircle, Clock, AlertCircle, FilePlus, QrCode, Check } from 'lucide-react';
import apiService from '../services/apiService';

interface Journal {
  id: string;
  name: string;
  issn: string;
  description: string;
  image_url?: string;
  category: string;
  category_name: string;
}

interface ArticleTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  keywords: string;
  author_guidelines: string;
  structure: string;
  word_count: number;
  created_at: string;
  journal: Journal;
  is_active: boolean;
}

const MaqolaNamunaOlish: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ArticleTemplate[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJournal, setSelectedJournal] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<ArticleTemplate | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ArticleTemplate | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Mock data for demonstration - real API would be implemented
      const mockTemplates: ArticleTemplate[] = [
        {
          id: '1',
          title: 'Ilmiy maqola standarti',
          description: 'O\'zbekiston Milliy Universiteti uchun ilmiy maqola yozish standarti',
          content: `
## Kirish
Kirish qismi maqolaning mavzuini qisqacha bayon qiladi, tadqiqot muammosini va o\'rganilayotgan muammoning ahamiyatini tushuntiradi. Kirishda odatda 300-500 so\'z oralig\'ida bo\'ladi.

## Muammo va maqsad
Bu qismda tadqiqotning asosiy maqsadi va muammosi aniq ifodalab beriladi. Tadqiqot qanday muammoni hal qilayotgani va qanday natijalarga erishishi ko'rsatiladi.

## Adabiyot sharhi
Oxirgi 5-10 yildagi adabiyotlar sharhi beriladi. Bu qismda avvalgi tadqiqotlar bilan solishtirish, ularning qanday usullardan foydalanilgani va qanday natijalarga erishilgani tahlil qilinadi.

## Tadqiqot usuli va materiallari
Bu qismda tadqiqotda qo'llanilgan usullar (eksperimental, nazariy, hujjatli, matematik) va materiallar to\'g\'ri bayon qilinadi. Tadqiqotning ishonchliligi uchun zarur bo\'lgan materiallar va usullar tasvirlanadi.

## Natijalar va muhokama
Tadqiqot natijalari jadvallar va jadvallarsiz shaklda taqdim etiladi. Grafiklar, jadvallalar va diagrammalar orqali orqali bo\'lishi mumkin. Natijalar tahlili va muhokama qilinadi.

## Xulosa va takliflar
Tadqiqotning asosiy xulosasi va qisqa takliflar beriladi. Tadqiqotning ilmiy amaliyotga qo\'shgan hissasi va kelajak tadqiqotlar uchun tavsiyalar beriladi.

## Adabiyotlar ro\'yxati
Barcha ishlatilgan adabiyotlar standart formatda keltiriladi (APA, MLA, Chicago kabi).
`,
          keywords: 'ilmiy maqola, standart, struktur, universitet',
          author_guidelines: 'Maqola 15-25 bet oralig\'ida bo\'lishi kerak. Akademik til yozilishi shart. 3-5 ta asosiy bo\'lim, kirish va xulosa qismlaridan iborat.',
          structure: 'Kirish → Muammo → Adabiyot sharhi → Tadqiqot usuli → Natijalar → Xulosa → Adabiyotlar',
          word_count: 5000,
          created_at: '2024-01-15',
          journal: {
            id: '1',
            name: 'O\'zbekiston Milliy Universiteti Ilmiy Jurnali',
            issn: '1234-5678',
            description: 'Milliy universitetning asosiy ilmiy nashri',
            category: 'universitet',
            category_name: 'Universitet jurnallari'
          },
          is_active: true
        },
        {
          id: '2',
          title: 'Texnika fanlari maqola formati',
          description: 'Texnika fanlari uchun maqola yozish talabnomasi',
          content: `
## Kirish
Kirish qismi muammoni, uning texnika fanlaridagi o\'rni va ahamiyatini tushuntiradi. Odatda 200-300 so\'z oralig\'ida bo\'ladi.

## Muammo va masala
Tadqiqotning maqsadi, masalasi va qo\'yilgan muammolar aniq ifodalab beriladi.

## Tadqiqot usuli
Qo'llanilgan metodologiya, uskunlar va dasturiy vositalari tasvirlanadi.

## Natijalar
Tajriba natijalari, hisob-kitoblar va grafiklar taqdim etiladi.

## Xulosa va takliflar
Olingan natijalar va ularning amaliyotdagi qo'llanilishi haqida xulosa beriladi.

## Adabiyotlar
Texnika fanlari uchun adabiyotlar standarti bo\'yicha keltiriladi.
`,
          keywords: 'texnika, metodologiya, tajriba, hisob-kitob',
          author_guidelines: 'Maqola 10-15 bet oralig\'ida. Texnik terminlardan foydalanish kerak. Diagrammalar va jadvallarni qo\'shish tavsiya etiladi.',
          structure: 'Kirish → Muammo → Usul → Natijalar → Xulosa → Adabiyotlar',
          word_count: 3000,
          created_at: '2024-01-10',
          journal: {
            id: '2',
            name: 'Texnika Fanlari Assotsiatsiyasi',
            issn: '2345-6789',
            description: 'Texnika fanlari bo\'yicha ilmiy nashr',
            category: 'texnika',
            category_name: 'Texnika jurnallari'
          },
          is_active: true
        },
        {
          'id': '3',
          'title': 'Tibbiyot maqolalari uchun yo\'riqnoma',
          'description': 'Tibbiyot sohasidagi maqolalar uchun standartlar va talablar',
          'content': `
## Kirish
Kasallikning yoki klinik tadqiqotining mavzusi va ahamiyati.

## Muammo va masala
Tadqiqotning klinik ahamiyati, bemorlar sonidagi potentsial foydasi.

## Usul va materiallar
Klinik tadqiqot usullari, bemor ma\'lumotlari to\'plami.

## Natijalar
Klinik natijalari, statistik tahlillar, bemorlar holatidagi o\'zgarishlar.

## Xulosa va takliflar
Tibbiyot amaliyotiga qo\'shgan hissasi.

## Etika
Bemorlar huquqlari va etik qoidalar.
`,
          'keywords': 'tibbiyot, klinik, bemor, etika, statistik',
          'author_guidelines': 'Maqola 8-12 bet. Bemor ma\'lumotlari maxfiyati. Etika qoidalariga rioya qilish shart.',
          'structure': 'Kirish → Muammo → Usul → Natijalar → Xulosa → Etika',
          'word_count': 2500,
          'created_at': '2024-01-05',
          'journal': {
            'id': '3',
            'name': 'Tibbiyot Jurnali',
            'issn': '3456-7890',
            'description': 'Tibbiyot sohasi ilmiy nashri',
            'category': 'tibbiyot',
            'category_name': 'Tibbiyot jurnallari'
          },
          'is_active': true
        }
      ];

      const mockJournals: Journal[] = [
        {
          id: '1',
          name: 'O\'zbekiston Milliy Universiteti Ilmiy Jurnali',
          issn: '1234-5678',
          description: 'Milliy universitetning asosiy ilmiy nashri',
          category: 'universitet',
          category_name: 'Universitet jurnallari'
        },
        {
          id: '2',
          name: 'Texnika Fanlari Assotsiatsiyasi',
          issn: '2345-6789',
          description: 'Texnika fanlari bo\'yicha ilmiy nashr',
          category: 'texnika',
          category_name: 'Texnika jurnallari'
        },
        {
          id: '3',
          name: 'Tibbiyot Jurnali',
          issn: '3456-7890',
          description: 'Tibbiyot sohasi ilmiy nashri',
          category: 'tibbiyot',
          category_name: 'Tibbiyot jurnallari'
        }
      ];

      setTemplates(mockTemplates);
      setJournals(mockJournals);
    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.keywords.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJournal = !selectedJournal || template.journal.id === selectedJournal;
    
    return matchesSearch && matchesJournal && template.is_active;
  });

  const handleSelectTemplate = (template: ArticleTemplate) => {
    setSelectedTemplate(template);
  };

  const handleCreateFromTemplate = () => {
    if (selectedTemplate) {
      // Navigate to article creation with template data
      navigate('/submit', { 
        state: { 
          template: selectedTemplate,
          fromTemplate: true 
        } 
      });
    }
  };

  const handlePayment = (paymentMethod: string) => {
    // Close QR scanner modal
    setShowQRScanner(false);
    
    // Show payment success message
    setPaymentSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setPaymentSuccess(false);
    }, 3000);
  };

  const handleEditTemplate = (template: ArticleTemplate) => {
    setEditingTemplate(template);
    setShowEditForm(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Rostdan ham ushbu namunani o\'chirmoqchimisiz?')) {
      try {
        // await apiService.templates.delete(id);
        setTemplates(templates.filter(t => t.id !== id));
      } catch (error) {
        console.error('O\'chirishda xatolik:', error);
      }
    }
  };

  const handleCreateTemplate = async (templateData: any) => {
    try {
      // await apiService.templates.create(templateData);
      // templates.push(newTemplate);
      setShowEditForm(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Yaratishda xatolik:', error);
    }
  };

  const handleUpdateTemplate = async (id: string, templateData: any) => {
    try {
      // await apiService.templates.update(id, templateData);
      // Update local state
      setTemplates(templates.map(t => t.id === id ? { ...t, ...templateData } : t));
      setShowEditForm(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Yangilashda xatolik:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Payment Success Notification */}
      {paymentSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
          <Check className="w-6 h-6" />
          <div>
            <p className="font-semibold">To'lov muvaffaqiyatli!</p>
            <p className="text-sm">To'lov amalga oshirildi va tasdiqlandi</p>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Maqola Namuna Olish</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowQRScanner(true)}>
            <QrCode className="w-4 h-4 mr-2" />
            QR Code Scanner
          </Button>
          <Button onClick={() => setShowEditForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Yangi namuna
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium mb-2">Qidiruv</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  id="search"
                  type="text"
                  placeholder="Namuna nomi, tavsif..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Jurnal</label>
              <select
                value={selectedJournal}
                onChange={(e) => setSelectedJournal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Barcha jurnallar</option>
                {journals.map(journal => (
                  <option key={journal.id} value={journal.id}>
                    {journal.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button variant="secondary" onClick={() => {
                setSearchTerm('');
                setSelectedJournal('');
              }}>
                <Filter className="w-4 h-4 mr-2" />
                Tozalash
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card 
            key={template.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleSelectTemplate(template)}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold line-clamp-2">{template.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                      {template.journal.category_name}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                      {template.word_count} so'z
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                                  </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-4 line-clamp-3">{template.description}</p>

              {/* Keywords */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.keywords.split(',').map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                    {keyword.trim()}
                  </span>
                ))}
              </div>

              {/* Journal Info */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BookOpen className="w-4 h-4" />
                <span>{template.journal.name}</span>
                <span className="text-gray-400">({template.journal.issn})</span>
              </div>

              {/* Guidelines */}
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-1 mb-1">
                  <FileText className="w-4 h-4" />
                  <span>{template.word_count} so'z</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{template.author_guidelines}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="secondary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplate(template);
                    handleCreateFromTemplate();
                  }}
                >
                  <FilePlus className="w-4 h-4 mr-2" />
                  Shu namunadan yozish
                </Button>
                <Button 
                  variant="primary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplate(template);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  To'liq ko'rish
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && !showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[95vh] overflow-y-auto mx-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTemplate.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                      {selectedTemplate.journal.category_name}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                      {selectedTemplate.word_count} so'z
                    </span>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setSelectedTemplate(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Yopish
                </Button>
              </div>

              {/* Template Content */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tavsif</h3>
                  <p className="text-gray-600">{selectedTemplate.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Kalit so'zlar</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.keywords.split(',').map((keyword, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md">
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Muallif uchun yo'riqnoma</h3>
                  <p className="text-gray-600 whitespace-pre-line">{selectedTemplate.author_guidelines}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Maqola tuzilishi</h3>
                  <p className="text-gray-600 whitespace-pre-line">{selectedTemplate.structure}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">To'liq mazmuni</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-line">{selectedTemplate.content}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Yaratilgan: {new Date(selectedTemplate.created_at).toLocaleDateString('uz-UZ')}</span>
                  <BookOpen className="w-4 h-4" />
                  <span>{selectedTemplate.journal.name}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 mt-4">
                <Button variant="secondary" onClick={() => setSelectedTemplate(null)} className="w-full sm:w-auto">
                  Yopish
                </Button>
                <Button onClick={handleCreateFromTemplate} className="w-full sm:w-auto">
                  <FilePlus className="w-4 h-4 mr-2" />
                  Shu namunadan maqola yozish
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl mx-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">QR Code Scanner</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* QR Code Scanner Section */}
                <div className="text-center">
                  <div className="bg-gray-100 rounded-lg p-8 mb-4">
                    <QrCode className="w-24 h-24 mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-600 mb-2">QR code skaner</p>
                    <p className="text-sm text-gray-500">Kamerani yo'naltiring va QR code ni skanlang</p>
                  </div>
                  
                  {/* Mock QR Code Display */}
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                      <QrCode className="w-32 h-32 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">QR code skanlash uchun</p>
                  </div>
                </div>

                {/* Payment Options Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">To'lov usullari</h3>
                  
                  <div className="space-y-4">
                    {/* Click Payment */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">C</span>
                          </div>
                          <div>
                            <h4 className="font-semibold">Click</h4>
                            <p className="text-sm text-gray-600">Mobil to'lov</p>
                          </div>
                        </div>
                        <span className="text-green-600 font-semibold">Faol</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Click mobil ilovasi orqali tez va xavfsiz to'lov</p>
                      <Button 
                        variant="primary" 
                        className="w-full"
                        onClick={() => {
                          // Click to'lov sahifasiga o'tish
                          window.open('https://click.uz/', '_blank');
                          handlePayment('Click');
                        }}
                      >
                        Click orqali to'lov
                      </Button>
                    </div>

                    {/* Payme Payment */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">P</span>
                          </div>
                          <div>
                            <h4 className="font-semibold">Payme</h4>
                            <p className="text-sm text-gray-600">Mobil to'lov</p>
                          </div>
                        </div>
                        <span className="text-green-600 font-semibold">Faol</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Payme orqali qulay va tezkor to'lov imkoniyati</p>
                      <Button 
                        variant="primary" 
                        className="w-full"
                        onClick={() => {
                          // Payme to'lov sahifasiga o'tish
                          window.open('https://payme.uz/', '_blank');
                          handlePayment('Payme');
                        }}
                      >
                        Payme orqali to'lov
                      </Button>
                    </div>

                    {/* UzCard Payment */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">U</span>
                          </div>
                          <div>
                            <h4 className="font-semibold">UzCard</h4>
                            <p className="text-sm text-gray-600">Bank kartasi</p>
                          </div>
                        </div>
                        <span className="text-green-600 font-semibold">Faol</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">UzCard bank kartalari orqali to'lov</p>
                      <Button 
                        variant="primary" 
                        className="w-full"
                        onClick={() => {
                          // UzCard to'lov sahifasiga o'tish
                          window.open('https://uzcard.uz/', '_blank');
                          handlePayment('UzCard');
                        }}
                      >
                        UzCard orqali to'lov
                      </Button>
                    </div>

                    {/* Bank Transfer */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">B</span>
                          </div>
                          <div>
                            <h4 className="font-semibold">Bank o'tkazmasi</h4>
                            <p className="text-sm text-gray-600">An'anaviy usul</p>
                          </div>
                        </div>
                        <span className="text-green-600 font-semibold">Faol</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Bank hisob raqamiga pul o'tkazish</p>
                      <Button 
                        variant="primary" 
                        className="w-full"
                        onClick={() => {
                          // Bank ma'lumotlarini ko'rsatish
                          alert('Bank ma\'lumotlari:\n\nBank: O\'zbekiston Milliy Banki\nHisob raqam: 12345678901234567890\nMFO: 01025\nOlingan: Ilmiy nashrlar uchun to\'lov\n\nMa\'lumotlar shaxsiy kabinetingizda ham mavjud.');
                          handlePayment('Bank');
                        }}
                      >
                        Bank ma'lumotlari
                      </Button>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-blue-900 mb-2">To'lov haqida</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Barcha to'lov usullari xavfsiz</li>
                      <li>• To'lov darhol tasdiqlanadi</li>
                      <li>• Chek va kvitansiya beriladi</li>
                      <li>• Qo'llab-quvvatlash 24/7</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end mt-6">
                <Button variant="secondary" onClick={() => setShowQRScanner(false)}>
                  Yopish
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8">
          <Card className="w-full max-w-4xl max-h-[calc(100vh-4rem)] overflow-y-auto mx-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingTemplate ? 'Namunani tahrirlash' : 'Yangi namuna yaratish'}
              </h2>
              
              <div className="text-gray-600 mb-4">
                {editingTemplate ? 'Namuna ma\'lumotlarini tahrirlang' : 'Yangi maqola namunasi yarating'}
              </div>

              <div className="space-y-4">
                {/* Mobile: Single column, Desktop: Two columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Namuna nomi</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Namuna nomini"
                      defaultValue={editingTemplate?.title || ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Jurnal</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={editingTemplate?.journal.id || ''}
                    >
                      <option value="">Jurnal tanlang</option>
                      {journals.map(journal => (
                        <option key={journal.id} value={journal.id}>
                          {journal.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tavsif</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Namuna tavsifi"
                    defaultValue={editingTemplate?.description || ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kalit so'zlar</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Kalit so'zlar vergul bilan ajratilgan"
                    defaultValue={editingTemplate?.keywords || ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">So\'z soni</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="So\'z soni"
                    defaultValue={editingTemplate?.word_count || 5000}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Muallif uchun yo'riqnoma</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={5}
                    placeholder="Mualliflar uchun yo'riqnoma"
                    defaultValue={editingTemplate?.author_guidelines || ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Maqola tuzilishi</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={5}
                    placeholder="Maqola tuzilishi (bo'limlar: Kirish → Muammo → ...)"
                    defaultValue={editingTemplate?.structure || ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">To'liq mazmuni</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={12}
                    placeholder="To'liq mazmuni (namuna shabloni)"
                    defaultValue={editingTemplate?.content || ''}
                  />
                </div>
              </div>

              {/* Mobile: Fixed bottom buttons */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg lg:hidden">
                <div className="flex flex-col sm:flex-row gap-3 justify-end max-w-4xl mx-auto">
                  <Button variant="secondary" onClick={() => {
                    setShowEditForm(false);
                    setEditingTemplate(null);
                  }} className="w-full sm:w-auto">
                    Bekor qilish
                  </Button>
                  <Button onClick={() => {
                    if (editingTemplate) {
                      handleUpdateTemplate(editingTemplate.id, {
                        title: editingTemplate.title,
                        description: editingTemplate.description,
                        keywords: editingTemplate.keywords,
                        journal_id: editingTemplate.journal.id,
                        word_count: editingTemplate.word_count,
                        author_guidelines: editingTemplate.author_guidelines,
                        structure: editingTemplate.structure,
                        content: editingTemplate.content
                      });
                    } else {
                      handleCreateTemplate({
                        title: '',
                        description: '',
                        keywords: '',
                        journal_id: '',
                        word_count: 5000,
                        author_guidelines: '',
                        structure: '',
                        content: ''
                      });
                    }
                  }} className="w-full sm:w-auto">
                    {editingTemplate ? 'Saqlash' : 'Yaratish'}
                  </Button>
                </div>
              </div>

              {/* Desktop: Regular buttons */}
              <div className="hidden lg:flex gap-3 justify-end pb-4">
                <Button variant="secondary" onClick={() => {
                  setShowEditForm(false);
                  setEditingTemplate(null);
                }}>
                  Bekor qilish
                </Button>
                <Button onClick={() => {
                  if (editingTemplate) {
                    handleUpdateTemplate(editingTemplate.id, {
                      title: editingTemplate.title,
                      description: editingTemplate.description,
                      keywords: editingTemplate.keywords,
                      journal_id: editingTemplate.journal.id,
                      word_count: editingTemplate.word_count,
                      author_guidelines: editingTemplate.author_guidelines,
                      structure: editingTemplate.structure,
                      content: editingTemplate.content
                    });
                  } else {
                    handleCreateTemplate({
                      title: '',
                      description: '',
                      keywords: '',
                      journal_id: '',
                      word_count: 5000,
                      author_guidelines: '',
                      structure: '',
                      content: ''
                    });
                  }
                }}>
                  {editingTemplate ? 'Saqlash' : 'Yaratish'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MaqolaNamunaOlish;
