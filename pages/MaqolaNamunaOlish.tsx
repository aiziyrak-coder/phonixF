import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Send, AlertCircle } from 'lucide-react';
import apiService from '../services/apiService';
import { paymentService } from '../services/paymentService';

const QUALITY_OPTIONS = [
  { value: 'quyi', label: 'Quyi sifatli', priceKey: 'quyi' as const },
  { value: 'orta', label: "O'rta sifatli", priceKey: 'orta' as const },
  { value: 'yuqori', label: 'Yuqori sifatli', priceKey: 'yuqori' as const },
] as const;

const STRUCTURE_OPTIONS = [
  { value: '', label: "Tuzilishni tanlang" },
  { value: 'Kirish, Asosiy qism, Xulosa, Adabiyotlar', label: 'Standart (Kirish, Asosiy qism, Xulosa, Adabiyotlar)' },
  { value: 'Kirish, Adabiyot sharhi, Tadqiqot usuli, Natijalar, Muhokama, Xulosa, Adabiyotlar', label: 'Ilmiy to\'liq (Kirish, Adabiyot sharhi, Usul, Natijalar, Muhokama, Xulosa, Adabiyotlar)' },
  { value: 'Kirish, Muammo, Usul, Natijalar, Xulosa, Adabiyotlar', label: 'Texnika (Kirish, Muammo, Usul, Natijalar, Xulosa, Adabiyotlar)' },
  { value: 'Kirish, Material va usullar, Natijalar, Muhokama, Xulosa, Adabiyotlar', label: 'Tibbiyot (Kirish, Material va usullar, Natijalar, Muhokama, Xulosa, Adabiyotlar)' },
] as const;

const OTHER_REQUIREMENT_OPTIONS = [
  { value: '', label: "Qo'shimcha talab yo'q" },
  { value: 'Jadvallar va rasmlar', label: 'Jadvallar va rasmlar' },
  { value: 'Ilova hujjatlari', label: 'Ilova hujjatlari' },
  { value: 'Boshqa', label: 'Boshqa (pastda yozing)' },
] as const;

const ARTICLE_TYPE_OPTIONS = [
  { value: '', label: "Maqola turini tanlang" },
  { value: 'Maqola', label: 'Maqola' },
  { value: 'Tezis', label: 'Tezis' },
] as const;

interface PriceMap {
  quyi: number;
  orta: number;
  yuqori: number;
  currency: string;
}

/** Talablar matnga birlashtiramiz. Format izohi (Word, 14 pt, Times New Roman, A4 albomiy) avtomatik qo'shiladi. */
const buildRequirements = (p: Record<string, string>) => {
  const parts: string[] = [];
  parts.push('Format: Word, 14 pt, Times New Roman, A4 albomiy (muallif uchun ma\'lumot)');
  if (p.requirementLanguage?.trim()) parts.push(`Til: ${p.requirementLanguage.trim()}`);
  if (p.requirementStructure?.trim()) parts.push(`Tuzilish: ${p.requirementStructure.trim()}`);
  if (p.requirementArticleType?.trim()) parts.push(`Maqola turi: ${p.requirementArticleType.trim()}`);
  const other = p.requirementOther === 'Boshqa' ? (p.requirementOtherText || '').trim() : (p.requirementOther || '').trim();
  if (other) parts.push(`Qo'shimcha: ${other}`);
  return parts.join('\n');
};

const MaqolaNamunaOlish: React.FC = () => {
  const [prices, setPrices] = useState<PriceMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [requirementLanguage, setRequirementLanguage] = useState('');
  const [requirementStructure, setRequirementStructure] = useState('');
  const [requirementArticleType, setRequirementArticleType] = useState('');
  const [requirementOther, setRequirementOther] = useState('');
  const [requirementOtherText, setRequirementOtherText] = useState('');
  const [pages, setPages] = useState(1);
  const [topic, setTopic] = useState('');
  const [qualityLevel, setQualityLevel] = useState<'quyi' | 'orta' | 'yuqori'>('orta');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiService.articles.getArticleSamplePrice();
        if (!cancelled && data) setPrices(data as PriceMap);
      } catch (e) {
        if (!cancelled) setError('Narxlarni yuklashda xatolik');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const pricePerPage = prices
    ? prices[qualityLevel] ?? prices.orta
    : 0;
  const totalAmount = Math.max(1, Math.min(500, pages)) * pricePerPage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const requirements = buildRequirements({
      requirementLanguage,
      requirementStructure,
      requirementArticleType,
      requirementOther,
      requirementOtherText,
    });
    if (!requirementLanguage.trim()) {
      setError('Tilni tanlang.');
      return;
    }
    if (!requirementStructure.trim()) {
      setError('Tuzilishni tanlang.');
      return;
    }
    if (!requirementArticleType.trim()) {
      setError('Maqola turini tanlang (Maqola yoki Tezis).');
      return;
    }
    if (!requirements.trim()) {
      setError('Talablar to\'ldirilmadi.');
      return;
    }
    if (!topic.trim()) {
      setError('Maqola mavzusini kiriting.');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('Ism va familyani kiriting.');
      return;
    }
    const safePages = Math.max(1, Math.min(500, pages));
    setSubmitting(true);
    try {
      const result = await apiService.articles.createArticleSampleRequest({
        requirements,
        pages: safePages,
        topic: topic.trim(),
        quality_level: qualityLevel,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      }) as { transaction_id?: string; amount?: number };
      const txId = result?.transaction_id;
      if (txId) {
        paymentService.redirectToPaymentPage(txId);
        return;
      }
      setError('Tranzaksiya yaratilmadi. Qayta urinib ko\'ring.');
    } catch (err: any) {
      setError(err?.message || 'So\'rov yuborishda xatolik.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-white/30 text-white placeholder-gray-400';
  const labelClass = 'block text-sm font-medium mb-1 text-white';

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-white">Narxlar yuklanmoqda…</p>
      </div>
    );
  }

  const selectOpt = (opts: readonly { value: string; label: string }[]) =>
    opts.map((opt) => (
      <option key={opt.value || 'empty'} value={opt.value} className="bg-gray-800 text-white">
        {opt.label}
      </option>
    ));

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-white">Maqola namuna olish</h1>
        <p className="text-gray-200 mb-8 max-w-3xl">
          Talablar va maqola ma'lumotlarini kiriting. To'lovdan so'ng so'rov taqrizchiga yuboriladi.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-400/50 text-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Narxlar va izoh (muallif uchun ma'lumot) */}
          {prices && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Narxlar (1 bet)</h2>
              <ul className="space-y-2 text-gray-200 mb-4">
                <li>Quyi sifatli — {prices.quyi?.toLocaleString('uz-UZ')} so'm</li>
                <li>O'rta sifatli — {prices.orta?.toLocaleString('uz-UZ')} so'm</li>
                <li>Yuqori sifatli — {prices.yuqori?.toLocaleString('uz-UZ')} so'm</li>
              </ul>
              <p className="text-sm text-gray-400 border-t border-white/10 pt-4">
                Muallif uchun ma'lumot: hujjat formati — Word; shrift — 14 pt, Times New Roman; bet formati — A4 albomiy.
              </p>
            </Card>
          )}

          {/* Bitta kartada barcha talablar va ma'lumotlar */}
          <Card className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className={labelClass}>Til talabi *</label>
                <select value={requirementLanguage} onChange={(e) => setRequirementLanguage(e.target.value)} className={inputClass}>
                  <option value="" className="bg-gray-800 text-white">Tilni tanlang</option>
                  <option value="O'zbek" className="bg-gray-800 text-white">O'zbek</option>
                  <option value="Rus" className="bg-gray-800 text-white">Rus</option>
                  <option value="Ingliz" className="bg-gray-800 text-white">Ingliz</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Tuzilish / bo'limlar *</label>
                <select value={requirementStructure} onChange={(e) => setRequirementStructure(e.target.value)} className={inputClass}>
                  {selectOpt(STRUCTURE_OPTIONS)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Maqola turi *</label>
                <select value={requirementArticleType} onChange={(e) => setRequirementArticleType(e.target.value)} className={inputClass}>
                  {selectOpt(ARTICLE_TYPE_OPTIONS)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Maqola mavzusi *</label>
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Maqola mavzusi" className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Sahifalar soni *</label>
                <input type="number" min={1} max={500} value={pages} onChange={(e) => setPages(Number(e.target.value) || 1)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Daraja *</label>
                <select value={qualityLevel} onChange={(e) => setQualityLevel(e.target.value as 'quyi' | 'orta' | 'yuqori')} className={inputClass}>
                  {QUALITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-gray-800 text-white">
                      {opt.label} — {prices ? (prices[opt.priceKey]?.toLocaleString('uz-UZ') ?? '') : ''} so'm / bet
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Qo'shimcha talablar (ixtiyoriy)</label>
                <select value={requirementOther} onChange={(e) => setRequirementOther(e.target.value)} className={inputClass}>
                  {selectOpt(OTHER_REQUIREMENT_OPTIONS)}
                </select>
              </div>
              {requirementOther === 'Boshqa' && (
                <div className="sm:col-span-2">
                  <label className={labelClass}>Qo'shimcha talablarni yozing</label>
                  <input
                    type="text"
                    value={requirementOtherText}
                    onChange={(e) => setRequirementOtherText(e.target.value)}
                    placeholder="Boshqa talablar"
                    className={inputClass}
                  />
                </div>
              )}
              <div>
                <label className={labelClass}>Ism *</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ism" className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Familya *</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Familya" className={inputClass} required />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-white/10">
              <p className="text-lg font-semibold text-white">
                Jami: <span className="text-white font-bold">{totalAmount.toLocaleString('uz-UZ')} so'm</span>
                <span className="text-sm font-normal text-white/90 ml-2">
                  ({pages} bet × {pricePerPage.toLocaleString('uz-UZ')} so'm)
                </span>
              </p>
              <Button type="submit" disabled={submitting}>
                <Send className="w-4 h-4 mr-2" />
                {submitting ? 'Yuborilmoqda…' : "To'lov qilish va yuborish"}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default MaqolaNamunaOlish;
