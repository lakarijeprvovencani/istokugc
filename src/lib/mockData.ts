// Mock data za demo

export type CreatorStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';

export interface Creator {
  id: string;
  name: string;
  photo: string;
  bio: string;
  categories: string[];
  platforms: string[];
  languages: string[];
  location: string;
  priceFrom: number;
  portfolio: { 
    type: 'youtube' | 'tiktok' | 'instagram' | 'upload'; 
    url: string; 
    thumbnail: string;
    description?: string;
    platform?: 'instagram' | 'tiktok' | 'youtube' | 'other';
  }[];
  email: string;
  phone?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  approved: boolean;
  status?: CreatorStatus; // 'pending' | 'approved' | 'rejected' | 'deactivated'
  rejectionReason?: string; // Razlog odbijanja od strane admina
  profileViews?: number; // Broj pregleda profila
  createdAt: string;
}

export interface Business {
  id: string;
  companyName: string;
  email: string;
  description?: string;
  website?: string;
  industry?: string;
  subscriptionType: 'monthly' | 'yearly' | null;
  subscriptionStatus: 'active' | 'expired' | 'none';
  subscribedAt?: string;
  expiresAt?: string;
}

export const categories = [
  'Beauty',
  'Fashion',
  'Fitness',
  'Tech',
  'Food',
  'Travel',
  'Lifestyle',
  'Gaming',
  'Health',
  'Finance',
  'Education',
  'Entertainment',
];

export const platforms = ['TikTok', 'Instagram', 'YouTube'];

export const languages = [
  'Srpski',
  'Hrvatski',
  'Bosanski',
  'Engleski',
  'Nemački',
  'Francuski',
  'Italijanski',
  'Španski',
];

export const mockCreators: Creator[] = [
  {
    id: '1',
    name: 'Marija Petrović',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bio: 'Kreatorka sadržaja sa fokusom na beauty i lifestyle. Preko 5 godina iskustva u kreiranju autentičnog sadržaja za brendove.',
    categories: ['Beauty', 'Lifestyle', 'Fashion'],
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    languages: ['Srpski', 'Engleski'],
    location: 'Beograd, Srbija',
    priceFrom: 150,
    portfolio: [
      { 
        type: 'youtube', 
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        description: 'UGC video za beauty brend - prikazuje proizvod u upotrebi',
        platform: 'youtube'
      },
      { 
        type: 'instagram', 
        url: 'https://instagram.com/reel/C1234567890', 
        thumbnail: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=400&fit=crop',
        description: 'Instagram Reel za skincare kampanju',
        platform: 'instagram'
      },
    ],
    email: 'marija@example.com',
    phone: '+381 61 123 4567',
    instagram: '@marija.petrovic',
    tiktok: '@marija.p',
    youtube: '@MarijaPetrovicUGC',
    approved: true,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Stefan Nikolić',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bio: 'Tech entuzijasta i content creator. Specijalizovan za recenzije gadgeta, softverske tutoriale i tech lifestyle sadržaj.',
    categories: ['Tech', 'Gaming', 'Education'],
    platforms: ['YouTube', 'TikTok'],
    languages: ['Srpski', 'Engleski', 'Nemački'],
    location: 'Novi Sad, Srbija',
    priceFrom: 200,
    portfolio: [
      { type: 'youtube', url: 'https://youtube.com/watch?v=123', thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=400&fit=crop' },
    ],
    email: 'stefan@example.com',
    instagram: '@stefan.tech',
    approved: true,
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Ana Kovačević',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    bio: 'Fitness trener i nutrition coach. Kreiram motivacioni sadržaj za zdrav život, vežbanje i pravilnu ishranu.',
    categories: ['Fitness', 'Health', 'Lifestyle'],
    platforms: ['Instagram', 'YouTube', 'TikTok'],
    languages: ['Srpski', 'Hrvatski', 'Engleski'],
    location: 'Zagreb, Hrvatska',
    priceFrom: 180,
    portfolio: [
      { type: 'instagram', url: 'https://instagram.com/reel/456', thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=400&fit=crop' },
      { type: 'youtube', url: 'https://youtube.com/watch?v=456', thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&h=400&fit=crop' },
    ],
    email: 'ana@example.com',
    phone: '+385 91 234 5678',
    instagram: '@ana.fit',
    approved: true,
    createdAt: '2024-01-28',
  },
  {
    id: '4',
    name: 'Luka Horvat',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    bio: 'Food blogger i amaterski kuvar. Volim da istražujem lokalnu kuhinju i kreiram jednostavne recepte za svakodnevnu upotrebu.',
    categories: ['Food', 'Lifestyle', 'Travel'],
    platforms: ['Instagram', 'TikTok'],
    languages: ['Hrvatski', 'Srpski', 'Engleski', 'Italijanski'],
    location: 'Split, Hrvatska',
    priceFrom: 120,
    portfolio: [
      { type: 'instagram', url: 'https://instagram.com/reel/789', thumbnail: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=300&h=400&fit=crop' },
      { type: 'tiktok', url: 'https://tiktok.com/@user/video/789', thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=400&fit=crop' },
    ],
    email: 'luka@example.com',
    instagram: '@luka.eats',
    approved: true,
    createdAt: '2024-03-05',
  },
  {
    id: '5',
    name: 'Emina Hadžić',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    bio: 'Fashion i beauty kreatorka iz Sarajeva. Sarađujem sa lokalnim i međunarodnim brendovima na autentičnom sadržaju.',
    categories: ['Fashion', 'Beauty', 'Lifestyle'],
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    languages: ['Bosanski', 'Srpski', 'Engleski'],
    location: 'Sarajevo, BiH',
    priceFrom: 160,
    portfolio: [
      { type: 'instagram', url: 'https://instagram.com/reel/101', thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop' },
      { type: 'tiktok', url: 'https://tiktok.com/@user/video/101', thumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=400&fit=crop' },
    ],
    email: 'emina@example.com',
    phone: '+387 61 345 6789',
    instagram: '@emina.style',
    approved: true,
    createdAt: '2024-02-10',
  },
  {
    id: '6',
    name: 'Nikola Jovanović',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    bio: 'Travel vlogger i avanturista. Istražujem skrivene lokacije Balkana i delim autentične priče sa putovanja.',
    categories: ['Travel', 'Lifestyle', 'Entertainment'],
    platforms: ['YouTube', 'Instagram'],
    languages: ['Srpski', 'Engleski'],
    location: 'Niš, Srbija',
    priceFrom: 250,
    portfolio: [
      { type: 'youtube', url: 'https://youtube.com/watch?v=202', thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=400&fit=crop' },
    ],
    email: 'nikola@example.com',
    instagram: '@nikola.travels',
    approved: true,
    createdAt: '2024-01-05',
  },
  {
    id: '7',
    name: 'Petra Babić',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    bio: 'Finance i personal development kreatorka. Pomažem mladima da razumeju finansije i grade bolje navike.',
    categories: ['Finance', 'Education', 'Lifestyle'],
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    languages: ['Hrvatski', 'Engleski'],
    location: 'Rijeka, Hrvatska',
    priceFrom: 220,
    portfolio: [
      { type: 'instagram', url: 'https://instagram.com/reel/303', thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=300&h=400&fit=crop' },
    ],
    email: 'petra@example.com',
    phone: '+385 99 876 5432',
    instagram: '@petra.finance',
    approved: true,
    createdAt: '2024-03-12',
  },
  {
    id: '8',
    name: 'Marko Đorđević',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    bio: 'Gaming streamer i esports komentator. Kreiram sadržaj za gaming brendove i tech kompanije.',
    categories: ['Gaming', 'Tech', 'Entertainment'],
    platforms: ['YouTube', 'TikTok', 'Instagram'],
    languages: ['Srpski', 'Engleski'],
    location: 'Beograd, Srbija',
    priceFrom: 180,
    portfolio: [
      { type: 'youtube', url: 'https://youtube.com/watch?v=404', thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=400&fit=crop' },
      { type: 'tiktok', url: 'https://tiktok.com/@user/video/404', thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&h=400&fit=crop' },
    ],
    email: 'marko@example.com',
    instagram: '@marko.gaming',
    approved: true,
    createdAt: '2024-02-28',
  },
];

// Kreatori koji čekaju odobrenje (za admin panel)
export const pendingCreators: Creator[] = [
  {
    id: '101',
    name: 'Jovana Ilić',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop',
    bio: 'Nova kreatorka u svetu beauty sadržaja. Fokus na affordable makeup i skincare rutine.',
    categories: ['Beauty', 'Lifestyle'],
    platforms: ['Instagram', 'TikTok'],
    languages: ['Srpski'],
    location: 'Kragujevac, Srbija',
    priceFrom: 80,
    portfolio: [
      { type: 'instagram', url: 'https://instagram.com/reel/new1', thumbnail: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=400&fit=crop' },
    ],
    email: 'jovana@example.com',
    instagram: '@jovana.beauty',
    approved: false,
    createdAt: '2024-03-18',
  },
  {
    id: '102',
    name: 'Denis Begić',
    photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop',
    bio: 'Fitness i nutrition sadržaj. Volim da inspirišem ljude na zdrav život.',
    categories: ['Fitness', 'Health'],
    platforms: ['TikTok', 'YouTube'],
    languages: ['Bosanski', 'Engleski'],
    location: 'Tuzla, BiH',
    priceFrom: 100,
    portfolio: [
      { type: 'tiktok', url: 'https://tiktok.com/@user/video/new2', thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&h=400&fit=crop' },
    ],
    email: 'denis@example.com',
    approved: false,
    createdAt: '2024-03-19',
  },
];

export const mockBusinesses: Business[] = [
  {
    id: 'b1',
    companyName: 'TechStart d.o.o.',
    email: 'marketing@techstart.rs',
    subscriptionType: 'yearly',
    subscriptionStatus: 'active',
    subscribedAt: '2024-01-10',
    expiresAt: '2025-01-10',
  },
  {
    id: 'b2',
    companyName: 'Beauty Box',
    email: 'info@beautybox.hr',
    subscriptionType: 'monthly',
    subscriptionStatus: 'active',
    subscribedAt: '2024-03-01',
    expiresAt: '2024-04-01',
  },
  {
    id: 'b3',
    companyName: 'FitLife Gym',
    email: 'marketing@fitlife.ba',
    subscriptionType: 'monthly',
    subscriptionStatus: 'expired',
    subscribedAt: '2024-02-01',
    expiresAt: '2024-03-01',
  },
];

// Demo user states
export type UserType = 'guest' | 'creator' | 'business' | 'admin';

export interface DemoUser {
  type: UserType;
  name: string;
  email: string;
  // Creator-specific fields (for matching profile)
  creatorId?: string;
  photo?: string; // Creator profile photo
  // Business-specific fields (for future Supabase integration)
  businessId?: string;
  companyName?: string;
  logo?: string; // Business logo
  website?: string;
  industry?: string;
  description?: string;
  subscriptionStatus?: 'active' | 'expired' | 'cancelled';
  subscriptionPlan?: 'monthly' | 'yearly';
  subscriptionExpiresAt?: string;
}

// Helper functions for dynamic dates (used in demo mode)
// In production, these would come from the database
export function getSubscriptionExpiresAt(plan: 'monthly' | 'yearly'): string {
  const now = new Date();
  if (plan === 'yearly') {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
}

export function getSubscriptionStartDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Note: In production, all business users must have active subscription to use the app
// Unpaid businesses are redirected to payment page
export const demoUsers: Record<UserType, DemoUser> = {
  guest: { type: 'guest', name: 'Gost', email: '' },
  creator: { 
    type: 'creator', 
    name: 'Marija Petrović', 
    email: 'marija@example.com',
    creatorId: '1', // Links to mockCreators[0]
  },
  business: { 
    type: 'business', 
    name: 'TechStart d.o.o.', 
    email: 'marketing@techstart.rs',
    businessId: 'b1', // Links to mockBusinesses[0]
    companyName: 'TechStart d.o.o.',
    website: 'https://techstart.rs',
    industry: 'tech',
    description: 'TechStart je inovativna kompanija koja se bavi razvojem softverskih rešenja i digitalnim transformacijama. Specijalizovani smo za kreiranje custom aplikacija koje pomažu biznisima da rastu i uspeju u digitalnom svetu.',
    subscriptionStatus: 'active',
    subscriptionPlan: 'yearly',
    // Dynamic date: 1 year from now for yearly plan
    subscriptionExpiresAt: getSubscriptionExpiresAt('yearly'),
  },
  admin: { type: 'admin', name: 'Admin', email: 'admin@ugcselect.com' },
};

// ============================================
// REVIEW TYPES & MOCK DATA
// ============================================

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  creatorId: string;
  businessId: string;
  businessName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  status: ReviewStatus;
  creatorReply?: string;
  creatorReplyAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export const mockReviews: Review[] = [
  {
    id: 'rev-1',
    creatorId: '1', // Marija Petrović
    businessId: 'b1',
    businessName: 'TechStart d.o.o.',
    rating: 5,
    comment: 'Odlična saradnja sa Marijom! Kreiranje sadržaja je bilo profesionalno i kreativno. Rokovi su ispoštovani, a kvalitet je premašio naša očekivanja. Definitivno preporučujemo za beauty i lifestyle kampanje.',
    status: 'approved',
    creatorReply: 'Hvala vam puno na lepim rečima! Bilo mi je zadovoljstvo sarađivati sa vašim timom. Jedva čekam sledeću saradnju!',
    creatorReplyAt: '2024-03-12',
    createdAt: '2024-03-10',
  },
  {
    id: 'rev-2',
    creatorId: '1', // Marija Petrović
    businessId: 'b2',
    businessName: 'Beauty Box',
    rating: 4,
    comment: 'Marija je profesionalna i kreativna. Sadržaj je bio kvalitetan i u skladu sa našim brendom. Mala kašnjenja u komunikaciji, ali sveukupno pozitivno iskustvo.',
    status: 'approved',
    createdAt: '2024-02-25',
  },
  {
    id: 'rev-3',
    creatorId: '2', // Stefan Nikolić
    businessId: 'b1',
    businessName: 'TechStart d.o.o.',
    rating: 5,
    comment: 'Stefan je pravi profesionalac! Njegove recenzije gadgeta su detaljne i autentične. Video produkcija je na visokom nivou, a saradnja je bila besprekorna od početka do kraja.',
    status: 'approved',
    creatorReply: 'Hvala na odličnoj saradnji! TechStart tim razume vrednost kvalitetnog sadržaja i uvek je spreman da sarađuje na kreativnim idejama.',
    creatorReplyAt: '2024-03-08',
    createdAt: '2024-03-05',
  },
  {
    id: 'rev-4',
    creatorId: '3', // Ana Kovačević
    businessId: 'b3',
    businessName: 'FitLife Gym',
    rating: 5,
    comment: 'Ana je fantastična! Njen fitness sadržaj je motivišući i autentičan. Naša kampanja za novi program treninga je dobila sjajne reakcije zahvaljujući njenom angažmanu.',
    status: 'approved',
    createdAt: '2024-02-20',
  },
  {
    id: 'rev-5',
    creatorId: '5', // Emina Hadžić
    businessId: 'b2',
    businessName: 'Beauty Box',
    rating: 4,
    comment: 'Emina kreira prelepi fashion sadržaj. Saradnja je bila glatka i profesionalna. Jedino bismo voleli da je bilo više varijacija u stilovima fotografija.',
    status: 'approved',
    creatorReply: 'Hvala na povratnoj informaciji! Za sledeću saradnju ću pripremiti više opcija stilova unapred.',
    creatorReplyAt: '2024-03-02',
    createdAt: '2024-02-28',
  },
  // Pending reviews (čekaju odobrenje admina)
  {
    id: 'rev-6',
    creatorId: '4', // Luka Horvat
    businessId: 'b1',
    businessName: 'TechStart d.o.o.',
    rating: 5,
    comment: 'Luka je kreirao fantastičan food sadržaj za naš team building event. Fotografije su bile profesionalne, a atmosfera na snimanju opuštena i kreativna.',
    status: 'pending',
    createdAt: '2024-03-18',
  },
  {
    id: 'rev-7',
    creatorId: '6', // Nikola Jovanović
    businessId: 'b2',
    businessName: 'Beauty Box',
    rating: 3,
    comment: 'Travel sadržaj je bio ok, ali smo očekivali nešto drugačije. Komunikacija mogla biti bolja, ali krajnji rezultat je bio prihvatljiv za naše potrebe promocije.',
    status: 'pending',
    createdAt: '2024-03-17',
  },
];

