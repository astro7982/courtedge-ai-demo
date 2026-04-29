export interface Promotion {
  code: string;
  description: string;
  discountPct: number;
  startDate: string;
  endDate: string;
  active: boolean;
  eligibleCategories?: string[];
  eligibleTiers?: ('Platinum' | 'Gold' | 'Silver' | 'Bronze')[];
  minOrderValue?: number;
}

export const promotions: Promotion[] = [
  { code: 'SPRING2026',    description: 'Spring training season kick-off — all categories',      discountPct: 10, startDate: '2026-03-01', endDate: '2026-05-31', active: true,                                             minOrderValue: 1000 },
  { code: 'BACK2SCHOOL',   description: 'Back-to-school uniforms and footwear',                   discountPct: 15, startDate: '2026-07-15', endDate: '2026-09-15', active: false, eligibleCategories: ['Uniforms', 'Footwear'] },
  { code: 'PLATINUM5',     description: 'Extra 5% off for Platinum tier on orders over $5k',      discountPct: 5,  startDate: '2026-01-01', endDate: '2026-12-31', active: true,  eligibleTiers: ['Platinum'], minOrderValue: 5000 },
  { code: 'HOOPBUNDLE',    description: 'Buy a hoop system, save on accessories',                 discountPct: 12, startDate: '2026-04-01', endDate: '2026-06-30', active: true,  eligibleCategories: ['Hoops'] },
  { code: 'VOLUMEGEAR',    description: '500+ unit volume purchase — extra 8% off',               discountPct: 8,  startDate: '2026-01-15', endDate: '2026-12-31', active: true,                                             minOrderValue: 10000 },
  { code: 'ENDOFSEASON24', description: 'End-of-season clearance 2024 models',                    discountPct: 25, startDate: '2024-10-01', endDate: '2024-12-31', active: false },
  { code: 'FITNESS25',     description: 'Weight training and conditioning gear',                  discountPct: 20, startDate: '2026-02-01', endDate: '2026-04-30', active: true,  eligibleCategories: ['Weight Training', 'Training'] },
  { code: 'OFFICIAL2026',  description: 'Referee and officiating gear — league prep',             discountPct: 18, startDate: '2026-03-15', endDate: '2026-05-15', active: true,  eligibleCategories: ['Officiating'] },
];

export const activePromotions = () => promotions.filter((p) => p.active);
export const getPromotion = (code: string) => promotions.find((p) => p.code === code);
