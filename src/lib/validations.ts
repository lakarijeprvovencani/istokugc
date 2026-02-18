import { z } from 'zod';

export const creatorRegistrationSchema = z.object({
  email: z.string().email('Email adresa nije validna'),
  password: z.string().min(6, 'Lozinka mora imati najmanje 6 karaktera'),
  name: z.string().min(2, 'Ime mora imati najmanje 2 karaktera').max(100),
  bio: z.string().min(10, 'Bio mora imati najmanje 10 karaktera').max(2000),
  location: z.string().min(2, 'Lokacija je obavezna').max(100),
  priceFrom: z.union([z.string(), z.number()]).transform(v => Number(v)),
  categories: z.array(z.string()).optional().default([]),
  platforms: z.array(z.string()).optional().default([]),
  languages: z.array(z.string()).optional().default([]),
  instagram: z.string().max(100).optional().nullable(),
  tiktok: z.string().max(100).optional().nullable(),
  youtube: z.string().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  photo: z.string().max(500000).optional().nullable(),
  portfolio: z.array(z.any()).optional().default([]),
});

export const businessRegistrationSchema = z.object({
  email: z.string().email('Email adresa nije validna'),
  password: z.string().min(6, 'Lozinka mora imati najmanje 6 karaktera'),
  companyName: z.string().min(2, 'Naziv kompanije mora imati najmanje 2 karaktera').max(200),
  phone: z.string().max(30).optional().nullable(),
  website: z.string().url('URL nije validan').optional().nullable().or(z.literal('')),
  industry: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  plan: z.enum(['monthly', 'yearly']).optional(),
  stripeCustomerId: z.string().optional().nullable(),
  stripeSubscriptionId: z.string().optional().nullable(),
});

export const creatorUpdateSchema = z.object({
  name: z.string().min(2, 'Ime mora imati najmanje 2 karaktera').max(100).optional(),
  bio: z.string().min(10, 'Bio mora imati najmanje 10 karaktera').max(2000).optional(),
  location: z.string().min(2, 'Lokacija je obavezna').max(100).optional(),
  email: z.string().email('Email adresa nije validna').optional(),
  phone: z.string().max(30).optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
  tiktok: z.string().max(100).optional().nullable(),
  youtube: z.string().max(200).optional().nullable(),
  price_from: z.union([z.string(), z.number()]).transform(v => Number(v)).optional(),
  categories: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  photo: z.string().max(500000).optional().nullable(),
  portfolio: z.array(z.any()).optional(),
  status: z.enum(['pending', 'approved', 'deactivated']).optional(),
}).refine(data => {
  if (data.name !== undefined && data.name.length < 2) return false;
  if (data.bio !== undefined && data.bio.length < 10) return false;
  if (data.location !== undefined && data.location.length < 2) return false;
  return true;
}, { message: 'Obavezna polja ne mogu biti prazna' });

export const businessUpdateSchema = z.object({
  businessId: z.string().uuid('Nevažeći Business ID'),
  companyName: z.string().min(2, 'Naziv kompanije mora imati najmanje 2 karaktera').max(200).optional(),
  phone: z.string().max(30).optional().nullable(),
  website: z.string().url('URL nije validan').optional().nullable().or(z.literal('')),
  industry: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  logo: z.string().max(500000).optional().nullable(),
});

export const reviewSchema = z.object({
  businessId: z.string().uuid('Nevažeći Business ID'),
  creatorId: z.string().uuid('Nevažeći Creator ID'),
  rating: z.number().int().min(1, 'Ocena mora biti između 1 i 5').max(5, 'Ocena mora biti između 1 i 5'),
  comment: z.string().max(1000, 'Komentar ne sme biti duži od 1000 karaktera').optional().nullable(),
});

/**
 * Validira podatke pomocu Zod sheme.
 * Vraca { data, error } - ako je error null, data je validna.
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { data: T | null; error: string | null } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return { data: null, error: firstError?.message || 'Nevažeći podaci' };
  }
  return { data: result.data, error: null };
}
