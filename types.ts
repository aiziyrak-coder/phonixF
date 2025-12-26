

export enum Role {
  Author = 'author',
  Reviewer = 'reviewer',
  JournalAdmin = 'journal_admin',
  SuperAdmin = 'super_admin',
  Accountant = 'accountant',
}

export enum ArticleStatus {
  Draft = 'Qoralama',
  Yangi = 'Yangi', // Renamed from Submitted
  WithEditor = 'Redaktorda',
  QabulQilingan = 'Qabul Qilingan', // Renamed from InReview
  WritingInProgress = 'Yozish jarayonida',
  NashrgaYuborilgan = 'Nashrga Yuborilgan', // Renamed from ReadyForPublication
  Revision = 'Tahrirga qaytarilgan',
  Accepted = 'Qabul qilingan',
  Rejected = 'Rad etilgan',
  Published = 'Nashr etilgan',
}

export enum TranslationStatus {
  Yangi = 'Yangi',
  Jarayonda = 'Jarayonda',
  Bajarildi = 'Bajarildi',
  BekorQilindi = 'Bekor Qilindi',
}


export enum PaymentModel {
  PrePayment = 'pre-payment',
  PostPayment = 'post-payment',
}

export interface GamificationProfile {
  level: string;
  badges: string[];
  points: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  patronymic: string;
  email: string;
  phone: string;
  password?: string; // Added for login
  role: Role;
  orcidId?: string;
  affiliation: string;
  gamificationProfile: GamificationProfile;
  avatarUrl: string;
  specializations?: string[];
  reviewsCompleted?: number;
  averageReviewTime?: number; // in days
  acceptanceRate?: number; // percentage
  telegramUsername?: string; // For Telegram notifications
}

export interface PlagiarismCheckResults {
    plagiarism: number; // percentage
    aiContent: number; // percentage
    checkedAt: string;
}

export interface Article {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  status: ArticleStatus;
  authorId: string;
  journalId: string;
  doi?: string;
  submissionDate: string;
  versions: ArticleVersion[];
  analytics: {
    views: number;
    downloads: number;
    citations: number;
  };
  peerReviewIds?: string[];
  chatId?: string;
  publishedById?: string;
  certificateUrl?: string; // for plagiarism
  publicationUrl?: string; // link to the article on the journal's site
  publicationCertificateUrl?: string; // certificate of publication
  thesisUrl?: string; // link to the published PDF file
  finalPdfPath?: string;
  reviewContent?: string;
  pageCount?: number;
  additionalDocumentPathOrUrl?: string;
  plagiarismCheckResults?: PlagiarismCheckResults;
  fastTrack?: boolean;
}

export interface ArticleVersion {
  id: string;
  versionNumber: number;
  filePath: string;
  submissionDate: string;
  digitalSignature?: {
    hash: string;
    signedBy: string;
    timestamp: string;
  };
}

export interface JournalCategory {
  id: string;
  name: string;
}

export enum JournalPricingType {
    Fixed = 'fixed',
    PerPage = 'per_page',
}

export interface AdditionalDocumentConfig {
    required: boolean;
    label: string;
    type: 'file' | 'link';
}

export interface Journal {
  id: string;
  name: string;
  issn: string;
  description: string;
  journalAdminId: string;
  categoryId: string;
  rules?: string;
  issueIds?: string[];
  imageUrl?: string;
  paymentModel: PaymentModel;
  pricingType: JournalPricingType;
  publicationFee?: number; // for fixed pricing
  pricePerPage?: number; // for per-page pricing
  additionalDocumentConfig?: AdditionalDocumentConfig;
  // Additional properties from API response
  admin_name?: string;
  category_name?: string;
  created_at?: string;
  updated_at?: string;
  issues?: any[];
  journal_admin?: string;
  payment_model?: string;
  price_per_page?: string;
  pricing_type?: string;
  publication_fee?: string;
  additional_doc_label?: string;
  additional_doc_required?: boolean;
  additional_doc_type?: string;
}

export interface Issue {
  id: string;
  journalId: string;
  issueNumber: string;
  publicationDate: string;
  articles: string[]; // array of article IDs
  coverImage?: string;
  collectionUrl?: string;
}

export interface PeerReview {
    id: string;
    articleId: string;
    reviewerId: string;
    status: 'pending' | 'accepted' | 'declined' | 'completed';
    reviewContent: string;
    rating: number;
    reviewType: 'open' | 'single_blind' | 'double_blind';
}

export interface Transaction {
    id: string;
    userId: string;
    articleId?: string;
    translationRequestId?: string; // For translation payments
    amount: number;
    currency: string;
    serviceType: 'fast-track' | 'publication_fee' | 'language_editing' | 'top_up' | 'book_publication' | 'translation';
    status: 'pending' | 'completed' | 'failed';
    createdAt: string;
    receiptPath?: string;
}

export interface Notification {
    id: number;
    message: string;
    read: boolean;
    link?: string;
}

export interface ActivityLogEvent {
  id: string;
  articleId: string;
  timestamp: string;
  userId?: string; // Optional: for system actions
  action: string;
  details?: string;
}

export interface CertificateData {
    certificateNumber: string;
    checkDate: string;
    author: string;
    workType: string;
    fileName: string;
    citations: string;
    plagiarism: string;
    originality: string;
    searchModules: string;
}

export interface SubmissionCertificateData {
    referenceNumber: string;
    issueDate: string;
    authorFullName: string;
    authorAffiliation: string;
    articleTitle: string;
    journalName: string;
    submissionDate: string;
    currentStatus: string;
    articleId: string; // for QR code
}

export interface TranslationRequest {
    id: string;
    authorId: string;
    reviewerId?: string;
    title: string;
    sourceLanguage: string;
    targetLanguage: string;
    sourceFilePath: string;
    translatedFilePath?: string;
    status: TranslationStatus;
    wordCount: number;
    cost: number;
    submissionDate: string;
    completionDate?: string;
}