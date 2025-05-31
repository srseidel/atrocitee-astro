import { useState } from 'react';
import { revalidateProduct } from '@lib/products/revalidation';
import type { Database } from '@local-types/database/schema';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductsTableProps {
  products: Product[];
  onSync: () => void;
}

export default function ProductsTable({ products, onSync }: ProductsTableProps) {
  const [revalidating, setRevalidating] = useState<string | null>(null);

  const handleRevalidate = async (slug: string) => {
    setRevalidating(slug);
    try {
      const result = await revalidateProduct(slug);
      if (!result.success) {
        console.error('Failed to revalidate:', result.error);
        // You might want to show this error in the UI
      }
    } finally {
      setRevalidating(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{product.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  product.published_status 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {product.published_status ? 'Published' : 'Unpublished'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-2">
                  {product.published_status && (
                    <button
                      onClick={() => handleRevalidate(product.slug)}
                      disabled={revalidating === product.slug}
                      className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md 
                        ${revalidating === product.slug
                          ? 'bg-gray-200 cursor-not-allowed'
                          : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                        }`}
                    >
                      {revalidating === product.slug ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Revalidating...
                        </>
                      ) : (
                        'Revalidate'
                      )}
                    </button>
                  )}
                  {/* Existing action buttons */}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 