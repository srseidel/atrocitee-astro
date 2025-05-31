/**
 * Triggers revalidation for a specific product page
 */
export async function revalidateProduct(slug: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/v1/admin/products/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to revalidate product' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error revalidating product:', error);
    return { success: false, error: 'Failed to revalidate product' };
  }
} 