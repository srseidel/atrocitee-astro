export type ProductType = string;
export type ProductColor = 'black' | 'white' | 'red' | 'blue' | 'gray' | 'green' | string;
export type ProductView = 
  | 'front' 
  | 'back' 
  | 'left' 
  | 'right' 
  | 'left-front' 
  | 'right-front' 
  | 'front-and-back' 
  | 'front-2' 
  | 'back-2';

export interface ProductMockup {
  productType: ProductType;
  color: ProductColor;
  view: ProductView;
  id: string;
  path: string;
}

export interface MockupSet {
  front: ProductMockup;
  back?: ProductMockup;
  left?: ProductMockup;
  right?: ProductMockup;
  leftFront?: ProductMockup;
  rightFront?: ProductMockup;
  frontAndBack?: ProductMockup;
  front2?: ProductMockup;
  back2?: ProductMockup;
} 