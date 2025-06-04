export type ProductType = string;
export type ProductColor = 'black' | 'white';
export type ProductView = 'front' | 'back' | 'left-front' | 'front-and-back' | 'front-2' | 'back-2';

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
  leftFront?: ProductMockup;
  frontAndBack?: ProductMockup;
  front2?: ProductMockup;
  back2?: ProductMockup;
} 