import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  shade?: string;
}

interface ProductSelectorProps {
  selectedProducts: Product[];
  onProductsChange: (products: Product[]) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProducts,
  onProductsChange
}) => {
  const [productName, setProductName] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productShade, setProductShade] = useState('');

  const categories = [
    'Foundation',
    'Concealer',
    'Powder',
    'Blush',
    'Bronzer',
    'Highlighter',
    'Eyeshadow',
    'Eyeliner',
    'Mascara',
    'Lipstick',
    'Lip Gloss',
    'Lip Liner',
    'Eyebrow Pencil',
    'Primer'
  ];

  const addProduct = () => {
    if (!productName || !productCategory) return;

    const newProduct: Product = {
      id: Date.now().toString(),
      name: productName,
      category: productCategory,
      brand: productBrand,
      shade: productShade
    };

    onProductsChange([...selectedProducts, newProduct]);
    
    // Reset form
    setProductName('');
    setProductBrand('');
    setProductCategory('');
    setProductShade('');
  };

  const removeProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter(p => p.id !== productId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Makeup Products</CardTitle>
        <p className="text-sm text-muted-foreground">
          Add the makeup products you have available for personalized recommendations
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product List */}
        {selectedProducts.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Products:</Label>
            <div className="flex flex-wrap gap-2">
              {selectedProducts.map((product) => (
                <Badge key={product.id} variant="secondary" className="flex items-center gap-1">
                  <span className="text-xs">
                    {product.name} {product.shade && `(${product.shade})`}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-auto p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeProduct(product.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Add Product Form */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="product-name" className="text-sm">Product Name</Label>
            <Input
              id="product-name"
              placeholder="e.g., Fenty Beauty Foundation"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="product-brand" className="text-sm">Brand</Label>
            <Input
              id="product-brand"
              placeholder="e.g., Fenty Beauty"
              value={productBrand}
              onChange={(e) => setProductBrand(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="product-category" className="text-sm">Category</Label>
            <select
              id="product-category"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="product-shade" className="text-sm">Shade (Optional)</Label>
            <Input
              id="product-shade"
              placeholder="e.g., 220, Medium Tan"
              value={productShade}
              onChange={(e) => setProductShade(e.target.value)}
            />
          </div>
        </div>

        <Button 
          onClick={addProduct} 
          disabled={!productName || !productCategory}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </CardContent>
    </Card>
  );
};