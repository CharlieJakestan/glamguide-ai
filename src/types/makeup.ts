
export interface MakeupProduct {
  id: string;
  name: string;
  category: string;
  description: string | null;
  color: string | null;
  created_at: string;
}

export interface ProductInstruction {
  product_id: string;
  intensity: number;
}

export interface ApplicationStep {
  step: number;
  description: string;
}

export interface MakeupLook {
  id: string;
  name: string;
  description: string | null;
  products: ProductInstruction[];
  instructions: ApplicationStep[];
  created_at: string;
}

export interface UserLook {
  id: string;
  user_id: string;
  look_id: string | null;
  custom_settings: Record<string, any>;
  created_at: string;
}
