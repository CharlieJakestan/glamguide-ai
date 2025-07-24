import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  shade?: string;
}

interface ProductInventoryFormProps {
  onComplete: (data: {
    products: Product[];
    skinConditions: string[];
    allergies: string;
    skinType: string;
  }) => void;
}

const ProductInventoryForm: React.FC<ProductInventoryFormProps> = ({ onComplete }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', shade: '' });
  const [skinConditions, setSkinConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState('');
  const [skinType, setSkinType] = useState('');

  const productCategories = [
    'Foundation', 'Concealer', 'Powder', 'Blush', 'Bronzer', 'Highlighter',
    'Eyeshadow', 'Eyeliner', 'Mascara', 'Eyebrow', 'Lipstick', 'Lip Gloss', 'Primer'
  ];

  const commonSkinConditions = [
    'Acne', 'Rosacea', 'Eczema', 'Hyperpigmentation', 'Melasma', 
    'Sensitive Skin', 'Dark Circles', 'Fine Lines', 'Large Pores'
  ];

  const addProduct = () => {
    if (newProduct.name && newProduct.category) {
      const product: Product = {
        id: Date.now().toString(),
        name: newProduct.name,
        category: newProduct.category,
        shade: newProduct.shade || undefined
      };
      setProducts([...products, product]);
      setNewProduct({ name: '', category: '', shade: '' });
    }
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleSkinConditionChange = (condition: string, checked: boolean) => {
    if (checked) {
      setSkinConditions([...skinConditions, condition]);
    } else {
      setSkinConditions(skinConditions.filter(c => c !== condition));
    }
  };

  const handleSubmit = () => {
    onComplete({
      products,
      skinConditions,
      allergies,
      skinType
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl text-purple-700">Your Makeup & Skin Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Inventory */}
        <div>
          <Label className="text-lg font-semibold mb-3 block">Products You Own</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Input
              placeholder="Product name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
            />
            <select
              className="border border-gray-300 rounded-md px-3 py-2"
              value={newProduct.category}
              onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
            >
              <option value="">Select category</option>
              {productCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Input
                placeholder="Shade (optional)"
                value={newProduct.shade}
                onChange={(e) => setNewProduct({...newProduct, shade: e.target.value})}
              />
              <Button onClick={addProduct} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {products.map(product => (
              <div key={product.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span>{product.name} ({product.category})</span>
                {product.shade && <span className="text-sm text-gray-600">{product.shade}</span>}
                <Button variant="outline" size="sm" onClick={() => removeProduct(product.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Skin Type */}
        <div>
          <Label className="text-lg font-semibold mb-3 block">Skin Type</Label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={skinType}
            onChange={(e) => setSkinType(e.target.value)}
          >
            <option value="">Select your skin type</option>
            <option value="oily">Oily</option>
            <option value="dry">Dry</option>
            <option value="combination">Combination</option>
            <option value="normal">Normal</option>
            <option value="sensitive">Sensitive</option>
          </select>
        </div>

        {/* Skin Conditions */}
        <div>
          <Label className="text-lg font-semibold mb-3 block">Skin Conditions</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {commonSkinConditions.map(condition => (
              <div key={condition} className="flex items-center space-x-2">
                <Checkbox
                  id={condition}
                  checked={skinConditions.includes(condition)}
                  onCheckedChange={(checked) => handleSkinConditionChange(condition, checked as boolean)}
                />
                <Label htmlFor={condition} className="text-sm">{condition}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <Label htmlFor="allergies" className="text-lg font-semibold mb-3 block">
            Allergies & Sensitivities
          </Label>
          <Textarea
            id="allergies"
            placeholder="List any makeup ingredients you're allergic to or sensitive to..."
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={!skinType}
        >
          Continue to Recommendations
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductInventoryForm;