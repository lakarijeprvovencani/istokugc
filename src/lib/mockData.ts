// Mock data za demo

export type CreatorStatus = 'pending' | 'approved' | 'deactivated';

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
  portfolio: { type: 'youtube' | 'tiktok' | 'instagram'; url: string; thumbnail: string }[];
  email: string;
  phone?: string;
  instagram?: string;
  approved: boolean;
  status?: CreatorStatus; // 'pending' | 'approved' | 'deactivated'
  createdAt: string;
}

export interface Business {
  id: string;
  companyName: string;
  email: string;
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

export const platforms = ['TikTok', 'Instagram', 'YouTube', 'Twitter/X', 'LinkedIn'];

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
      { type: 'instagram', url: 'https://instagram.com/reel/123', thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=400&fit=crop' },
      { type: 'tiktok', url: 'https://tiktok.com/@user/video/123', thumbnail: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=400&fit=crop' },
    ],
    email: 'marija@example.com',
    phone: '+381 61 123 4567',
    instagram: '@marija.petrovic',
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
    platforms: ['Instagram', 'TikTok', 'LinkedIn'],
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
    platforms: ['YouTube', 'TikTok', 'Twitter/X'],
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
  // Business-specific fields (for future Supabase integration)
  companyName?: string;
  subscriptionStatus?: 'active' | 'expired' | 'cancelled';
  subscriptionPlan?: 'monthly' | 'yearly';
  subscriptionExpiresAt?: string;
}

// Note: In production, all business users must have active subscription to use the app
// Unpaid businesses are redirected to payment page
export const demoUsers: Record<UserType, DemoUser> = {
  guest: { type: 'guest', name: 'Gost', email: '' },
  creator: { type: 'creator', name: 'Marija Petrović', email: 'marija@example.com' },
  business: { 
    type: 'business', 
    name: 'TechStart d.o.o.', 
    email: 'marketing@techstart.rs',
    companyName: 'TechStart d.o.o.',
    subscriptionStatus: 'active',
    subscriptionPlan: 'yearly',
    subscriptionExpiresAt: '2025-01-15',
  },
  admin: { type: 'admin', name: 'Admin', email: 'admin@ugcselect.com' },
};

