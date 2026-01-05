import { NextResponse } from 'next/server';

// Standardized API error responses
export const ApiError = {
  // Authentication errors
  unauthorized: () => NextResponse.json(
    { error: 'Niste prijavljeni. Molimo prijavite se.', code: 'UNAUTHORIZED' },
    { status: 401 }
  ),
  
  forbidden: (message?: string) => NextResponse.json(
    { error: message || 'Nemate dozvolu za ovu akciju.', code: 'FORBIDDEN' },
    { status: 403 }
  ),
  
  // Validation errors
  badRequest: (message: string) => NextResponse.json(
    { error: message, code: 'BAD_REQUEST' },
    { status: 400 }
  ),
  
  missingFields: (fields: string[]) => NextResponse.json(
    { error: `Nedostaju obavezna polja: ${fields.join(', ')}`, code: 'MISSING_FIELDS' },
    { status: 400 }
  ),
  
  invalidData: (message: string) => NextResponse.json(
    { error: message, code: 'INVALID_DATA' },
    { status: 400 }
  ),
  
  // Resource errors
  notFound: (resource: string) => NextResponse.json(
    { error: `${resource} nije pronađen/a.`, code: 'NOT_FOUND' },
    { status: 404 }
  ),
  
  alreadyExists: (message: string) => NextResponse.json(
    { error: message, code: 'ALREADY_EXISTS' },
    { status: 409 }
  ),
  
  // Server errors
  serverError: (message?: string) => NextResponse.json(
    { error: message || 'Došlo je do greške. Molimo pokušajte ponovo.', code: 'SERVER_ERROR' },
    { status: 500 }
  ),
  
  databaseError: (operation: string) => NextResponse.json(
    { error: `Greška prilikom ${operation}. Molimo pokušajte ponovo.`, code: 'DATABASE_ERROR' },
    { status: 500 }
  ),
};

// Success response helper
export const ApiSuccess = {
  ok: (data: any, message?: string) => NextResponse.json({
    success: true,
    ...data,
    ...(message && { message }),
  }),
  
  created: (data: any, message?: string) => NextResponse.json({
    success: true,
    ...data,
    ...(message && { message }),
  }, { status: 201 }),
  
  deleted: (message?: string) => NextResponse.json({
    success: true,
    message: message || 'Uspešno obrisano.',
  }),
};

// Log error for debugging (only in development)
export const logError = (context: string, error: any) => {
  console.error(`[API Error] ${context}:`, {
    message: error?.message || error,
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
  });
};


