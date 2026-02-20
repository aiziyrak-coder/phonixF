import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, QrCode } from 'lucide-react';
import apiService from '../services/apiService';

interface ScientificField {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface PublicationType {
  value: string;
  label: string;
}

interface AuthorPublication {
  id: string;
  title: string;
  publication_type: string;
  publication_type_display: string;
  scientific_field: string;
  scientific_field_name: string;
  publication_date: string;
  doi: string;
  pages: string;
  co_authors: string;
  abstract: string;
  keywords: string;
  file_url: string;
  is_verified: boolean;
  created_at: string;
}

const AuthorPublications: React.FC = () => {
  const navigate = useNavigate();
  const [publications, setPublications] = useState<AuthorPublication[]>([]);
  const [scientificFields, setScientificFields] = useState<ScientificField[]>([]);
  const [publicationTypes, setPublicationTypes] = useState<PublicationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPublication, setEditingPublication] = useState<AuthorPublication | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    publication_type: '',
    scientific_field: '',
    publication_date: '',
    doi: '',
    pages: '',
    co_authors: '',
    abstract: '',
    keywords: '',
    file_url: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pubsResponse, fieldsResponse, typesResponse] = await Promise.all([
        apiService.authorPublications.myPublications(),
        apiService.scientificFields.list(),
        apiService.authorPublications.publicationTypes()
      ]);

      setPublications(pubsResponse);
      setScientificFields(fieldsResponse);
      setPublicationTypes(typesResponse);
    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPublication) {
        await apiService.authorPublications.update(editingPublication.id, formData);
      } else {
        await apiService.authorPublications.create(formData);
      }
      
      setFormData({
        title: '',
        publication_type: '',
        scientific_field: '',
        publication_date: '',
        doi: '',
        pages: '',
        co_authors: '',
        abstract: '',
        keywords: '',
        file_url: ''
      });
      setShowAddForm(false);
      setEditingPublication(null);
      loadData();
    } catch (error) {
      console.error('Saqlashda xatolik:', error);
    }
  };

  const handleEdit = (publication: AuthorPublication) => {
    setEditingPublication(publication);
    setFormData({
      title: publication.title,
      publication_type: publication.publication_type,
      scientific_field: publication.scientific_field,
      publication_date: publication.publication_date,
      doi: publication.doi || '',
      pages: publication.pages || '',
      co_authors: publication.co_authors || '',
      abstract: publication.abstract || '',
      keywords: publication.keywords || '',
      file_url: publication.file_url || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Rostdan ham ushbu nashrni o\'chirmoqchimisiz?')) {
      try {
        await apiService.authorPublications.delete(id);
        loadData();
      } catch (error) {
        console.error('O\'chirishda xatolik:', error);
      }
    }
  };

  const filteredPublications = publications.filter(pub => {
    const matchesSearch = pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pub.co_authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pub.keywords.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesField = !selectedField || pub.scientific_field === selectedField;
    const matchesType = !selectedType || pub.publication_type === selectedType;
    
    return matchesSearch && matchesField && matchesType;
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'journal_local': 'bg-blue-100 text-blue-800',
      'journal_international': 'bg-green-100 text-green-800',
      'journal_local_general': 'bg-purple-100 text-purple-800',
      'journal_international_general': 'bg-indigo-100 text-indigo-800',
      'conference_local': 'bg-yellow-100 text-yellow-800',
      'conference_international': 'bg-orange-100 text-orange-800',
      'scopus_journal': 'bg-red-100 text-red-800',
      'scopus_conference': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleQRScan = () => {
    // QR code scanner implementation
    setShowQRScanner(true);
    // Bu yerda QR code scanner library integratsiyasi bo'ladi
    console.log('QR code scanner');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Muallif Nashrlari</h1>
        <div className="flex gap-2">
          <Button onClick={handleQRScan} variant="outline">
            <QrCode className="w-4 h-4 mr-2" />
            QR Code Scan
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Yangi Nashr
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Qidiruv</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Sarlavha, mualliflar, kalit so'zlar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Ilmiy soha</Label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger>
                  <SelectValue placeholder="Barcha sohalar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Barcha sohalar</SelectItem>
                  {scientificFields.map(field => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nashr turi</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Barcha turlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Barcha turlar</SelectItem>
                  {publicationTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setSelectedField('');
                setSelectedType('');
              }}>
                <Filter className="w-4 h-4 mr-2" />
                Tozalash
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publications List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPublications.map(publication => (
          <Card key={publication.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-2">{publication.title}</CardTitle>
                <div className="flex gap-1">
                  {publication.file_url && (
                    <Button size="sm" variant="outline" onClick={() => window.open(publication.file_url)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(publication)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(publication.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge className={getTypeColor(publication.publication_type)}>
                  {publication.publication_type_display}
                </Badge>
                {publication.is_verified && (
                  <Badge className="bg-green-100 text-green-800">Tasdiqlangan</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Ilmiy soha:</strong> {publication.scientific_field_name}</div>
                <div><strong>Sana:</strong> {new Date(publication.publication_date).toLocaleDateString('uz-UZ')}</div>
                {publication.doi && <div><strong>DOI:</strong> {publication.doi}</div>}
                {publication.pages && <div><strong>Sahifalar:</strong> {publication.pages}</div>}
                {publication.co_authors && (
                  <div><strong>Hammualliflar:</strong> {publication.co_authors}</div>
                )}
                {publication.keywords && (
                  <div><strong>Kalit so'zlar:</strong> {publication.keywords}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingPublication ? 'Nashrni tahrirlash' : 'Yangi nashr qo\'shish'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Sarlavha *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nashr turi *</Label>
                    <Select value={formData.publication_type} onValueChange={(value) => setFormData({...formData, publication_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nashr turini tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {publicationTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Ilmiy soha *</Label>
                    <Select value={formData.scientific_field} onValueChange={(value) => setFormData({...formData, scientific_field: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Soxani tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {scientificFields.map(field => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="publication_date">Nashr sanasi *</Label>
                    <Input
                      id="publication_date"
                      type="date"
                      value={formData.publication_date}
                      onChange={(e) => setFormData({...formData, publication_date: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="doi">DOI</Label>
                    <Input
                      id="doi"
                      value={formData.doi}
                      onChange={(e) => setFormData({...formData, doi: e.target.value})}
                      placeholder="10.1000/182"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pages">Sahifalar</Label>
                  <Input
                    id="pages"
                    value={formData.pages}
                    onChange={(e) => setFormData({...formData, pages: e.target.value})}
                    placeholder="15-25"
                  />
                </div>

                <div>
                  <Label htmlFor="co_authors">Hammualliflar</Label>
                  <Input
                    id="co_authors"
                    value={formData.co_authors}
                    onChange={(e) => setFormData({...formData, co_authors: e.target.value})}
                    placeholder="A. A. Karimov, B. B. To'rayev"
                  />
                </div>

                <div>
                  <Label htmlFor="abstract">Annotatsiya</Label>
                  <Textarea
                    id="abstract"
                    value={formData.abstract}
                    onChange={(e) => setFormData({...formData, abstract: e.target.value})}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="keywords">Kalit so'zlar</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                    placeholder="ta'lim, pedagogika, metodika"
                  />
                </div>

                <div>
                  <Label htmlFor="file_url">Fayl URL</Label>
                  <Input
                    id="file_url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({...formData, file_url: e.target.value})}
                    placeholder="https://example.com/file.pdf"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddForm(false);
                    setEditingPublication(null);
                  }}>
                    Bekor qilish
                  </Button>
                  <Button type="submit">
                    {editingPublication ? 'Saqlash' : 'Qo\'shish'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>QR Code Scanner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">QR code skaner bu yerda bo'ladi</p>
                <Button onClick={() => setShowQRScanner(false)}>Yopish</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AuthorPublications;
