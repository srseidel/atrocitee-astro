import { useState, useEffect } from 'react';
import type { Database } from '@local-types/database/schema';

type ProductVariant = Database['public']['Tables']['product_variants']['Row'];

interface VariantSelectorProps {
  variants: ProductVariant[];
  onVariantChange: (variant: ProductVariant) => void;
}

interface OptionType {
  name: string;
  values: string[];
}

export default function VariantSelector({ variants, onVariantChange }: VariantSelectorProps) {
  // Extract and organize variant options
  const variantsByOption = variants.reduce((acc: Record<string, Set<string>>, variant: ProductVariant) => {
    const nameParts = variant.name?.split('/').map(part => part.trim());
    if (nameParts?.length === 3) {
      const [_productName, color, size] = nameParts;
      
      if (!acc['Color']) acc['Color'] = new Set<string>();
      if (!acc['Size']) acc['Size'] = new Set<string>();
      
      acc['Color'].add(color);
      acc['Size'].add(size);
    }
    return acc;
  }, {});

  // Convert Sets to sorted arrays
  const sizeOrder = ['S', 'M', 'L', 'XL', '2XL', '4XL'];
  const options: OptionType[] = Object.entries(variantsByOption).map(([name, values]) => ({
    name,
    values: name === 'Size' 
      ? Array.from(values).sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b))
      : Array.from(values).sort()
  }));

  // Sort options to ensure Size comes before Color
  options.sort((a, b) => {
    const order = ['Size', 'Color'];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

  // State for selected options
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Find variant by selected options
  const findVariant = (color: string, size: string): ProductVariant | undefined => {
    return variants.find(variant => {
      const [_productName, variantColor, variantSize] = variant.name?.split('/').map(part => part.trim()) || [];
      return variantColor === color && variantSize === size;
    });
  };

  // Handle option selection
  const handleOptionSelect = (optionType: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionType]: value };
    setSelectedOptions(newOptions);

    // If we have both color and size selected, find and emit the variant
    if (newOptions.Color && newOptions.Size) {
      const variant = findVariant(newOptions.Color, newOptions.Size);
      if (variant) {
        onVariantChange(variant);
      }
    }
  };

  // Set initial selections
  useEffect(() => {
    if (variants.length > 0 && Object.keys(selectedOptions).length === 0) {
      const [_productName, color, size] = variants[0].name?.split('/').map(part => part.trim()) || [];
      const initialOptions = { Color: color, Size: size };
      setSelectedOptions(initialOptions);
      onVariantChange(variants[0]);
    }
  }, [variants]);

  return (
    <div className="mt-6">
      {options.map((option) => (
        <div key={option.name} className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">{option.name}</h2>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-4 gap-4">
              {option.values.map((value) => {
                const isSelected = selectedOptions[option.name] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleOptionSelect(option.name, value)}
                    className={`
                      group relative border rounded-md py-3 px-4 flex items-center justify-center text-sm font-medium
                      ${isSelected 
                        ? 'bg-indigo-600 border-transparent text-white hover:bg-indigo-700'
                        : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span>{value}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 