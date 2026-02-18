'use client';

import { useEffect } from 'react';

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Jobs page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Greška pri učitavanju</h1>
        <p className="text-gray-600 mb-6">
          Nije moguće učitati listu poslova. Molimo pokušajte ponovo.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          Pokušaj ponovo
        </button>
      </div>
    </div>
  );
}
