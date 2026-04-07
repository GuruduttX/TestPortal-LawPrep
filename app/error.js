'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-sm border border-red-300 text-center">
        <h2 className="text-2xl font-bold text-red-700 mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-6 font-medium">
          An unexpected error occurred in the examination platform. Please notify the invigilator or administrator.
        </p>
        <button
          onClick={() => reset()}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-sm shadow-sm hover:bg-blue-700 uppercase transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
