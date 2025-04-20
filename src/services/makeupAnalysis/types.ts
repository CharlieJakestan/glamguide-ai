
export interface MakeupRecommendation {
  makeup_look: string;
  color_tips: string;
}

export interface CoordinatedLook {
  face_shape_recommendations?: any;
  body_type_recommendations?: any;
  dress_recommendations?: any;
  makeup_recommendations?: MakeupRecommendation;
  jewelry_recommendations?: any;
  hairstyle_recommendations?: any;
}

export interface UserInputs {
  face_landmarks?: any;
  measurements?: any;
  occasion?: string;
  ethnicity?: string;
  purpose?: string;
  style_and_cut?: string;
  dress_color?: string;
  makeup_style?: string;
  hair_color_tips?: string;
  neckline?: string;
}
