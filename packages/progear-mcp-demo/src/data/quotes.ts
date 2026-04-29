import type { OrderItem } from './orders.js';

export type QuoteStatus = 'draft' | 'sent' | 'negotiating' | 'won' | 'lost';

export interface Quote {
  id: string;
  customerId: string;
  repId: string;
  items: OrderItem[];
  subtotal: number;
  discountPct: number;
  total: number;
  status: QuoteStatus;
  createdDate: string;
  expiresDate: string;
  expectedCloseDate: string;
  probability: number;
  notes?: string;
}

type ItemShort = [string, string, number, number];
const mkItems = (raw: ItemShort[]): OrderItem[] =>
  raw.map(([productId, sku, quantity, unitPrice]) => ({
    productId, sku, quantity, unitPrice, lineTotal: Math.round(quantity * unitPrice * 100) / 100,
  }));
const q = (
  id: string, customerId: string, repId: string, rawItems: ItemShort[],
  discountPct: number, status: QuoteStatus, createdDate: string, expiresDate: string,
  expectedCloseDate: string, probability: number, notes?: string,
): Quote => {
  const items = mkItems(rawItems);
  const subtotal = Math.round(items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;
  const total = Math.round(subtotal * (1 - discountPct / 100) * 100) / 100;
  return { id, customerId, repId, items, subtotal, discountPct, total, status, createdDate, expiresDate, expectedCloseDate, probability, notes };
};

export const quotes: Quote[] = [
  q('QT-2026-101', 'CUST-001', 'REP-002', [['BB-PRO-001','WIL-EVO-OFF',80,69.99],['UNI-JRS-001','NIK-JRS-CUS',60,89.99]], 15, 'negotiating','2026-04-12','2026-05-12','2026-05-15',70,'Fall season prep'),
  q('QT-2026-104', 'CUST-002', 'REP-005', [['HP-PRO-002','GLS-COL-RIM',8,899.99],['HP-PAD-001','BIS-PAD-POL',8,189.99]], 10, 'sent','2026-04-14','2026-05-14','2026-05-20',55,'Rim replacement across district'),
  q('QT-2026-107', 'CUST-003', 'REP-002', [['CRT-SCR-002','DAK-SCR-HD',1,14999.99]], 8, 'negotiating','2026-04-16','2026-05-30','2026-06-05',60,'HD video board upgrade'),
  q('QT-2026-110', 'CUST-004', 'REP-003', [['WGT-PLT-001','CHA-PLT-SET',3,799.99],['WGT-BNC-001','CHA-BNC-ADJ',8,349.99]], 10, 'sent','2026-04-18','2026-05-18','2026-05-25',65,'Weight room expansion'),
  q('QT-2026-113', 'CUST-005', 'REP-007', [['UNI-JRS-001','NIK-JRS-CUS',150,89.99],['UNI-SHT-001','NIK-SHT-PRO',150,49.99]], 15, 'draft','2026-04-20','2026-05-20','2026-05-30',45,'Full district jersey refresh'),
  q('QT-2026-116', 'CUST-006', 'REP-005', [['SHO-PRO-002','NIK-LBR-22',30,199.99],['SHO-PRO-001','NIK-KYR-7',30,139.99]], 10, 'sent','2026-04-21','2026-05-21','2026-05-28',60),
  q('QT-2026-119', 'CUST-007', 'REP-009', [['BB-OUT-001','SPA-STR-OFF',500,29.99],['BB-YTH-001','CHA-YTH-27',400,24.99]], 12, 'negotiating','2026-04-22','2026-05-22','2026-05-26',80,'Q3 resale stock'),
  q('QT-2026-122', 'CUST-008', 'REP-003', [['SHO-TEM-001','NIK-TEM-01',300,74.99]], 15, 'won','2026-04-10','2026-05-10','2026-04-24',100,'Closed — processing next week'),
  q('QT-2026-125', 'CUST-010', 'REP-008', [['BB-YTH-001','CHA-YTH-27',500,24.99],['UNI-JRS-003','NIK-JRS-YTH',200,64.99]], 15, 'draft','2026-04-23','2026-05-23','2026-06-10',50,'Summer tournament circuit'),
  q('QT-2026-128', 'CUST-011', 'REP-003', [['TRN-REB-001','DRD-CT7',1,5999.99]], 5, 'sent','2026-04-24','2026-05-24','2026-06-01',40,'Evaluating premium shooting machine'),
  q('QT-2026-131', 'CUST-013', 'REP-006', [['UNI-JRS-001','NIK-JRS-CUS',28,89.99],['UNI-SHT-001','NIK-SHT-PRO',28,49.99]], 10, 'sent','2026-04-24','2026-05-24','2026-05-30',55),
  q('QT-2026-134', 'CUST-015', 'REP-009', [['SHO-WOM-001','NIK-WOM-01',50,119.99]], 10, 'negotiating','2026-04-25','2026-05-25','2026-05-29',70),
  q('QT-2026-137', 'CUST-016', 'REP-007', [['BB-OUT-002','WIL-OUT-29',120,26.99],['HP-PRT-002','LFT-PRT-50',6,349.99]], 8, 'sent','2026-04-25','2026-05-25','2026-06-05',55),
  q('QT-2026-140', 'CUST-017', 'REP-002', [['UNI-JRS-001','NIK-JRS-CUS',35,89.99]], 10, 'draft','2026-04-26','2026-05-26','2026-06-10',40),
  q('QT-2026-143', 'CUST-020', 'REP-001', [['BB-YTH-001','CHA-YTH-27',300,24.99],['BB-YTH-002','CHA-JR-28',200,19.99]], 12, 'negotiating','2026-04-26','2026-05-26','2026-05-30',75,'District back-to-school prep'),
  q('QT-2026-146', 'CUST-023', 'REP-005', [['TRN-REB-002','DRD-REBEL',2,2999.99]], 8, 'sent','2026-04-27','2026-05-27','2026-06-06',60),
  q('QT-2026-149', 'CUST-025', 'REP-003', [['UNI-WRM-001','UA-WRM-JKT',40,119.99],['UNI-WRM-002','UA-WRM-PNT',40,89.99]], 10, 'sent','2026-04-27','2026-05-27','2026-06-05',55),
  q('QT-2026-152', 'CUST-012', 'REP-001', [['BB-YTH-001','CHA-YTH-27',120,24.99],['TRN-CON-001','SKZ-CON-20',12,24.99]], 5, 'sent','2026-04-27','2026-05-27','2026-05-31',65),
  q('QT-2026-155', 'CUST-022', 'REP-004', [['MED-KIT-001','MUE-KIT-SPT',2,299.99],['MED-AED-001','MUE-AED-PRT',1,1499.99]], 5, 'draft','2026-04-28','2026-05-28','2026-06-15',50),
  q('QT-2026-158', 'CUST-019', 'REP-010', [['BB-PRO-001','WIL-EVO-OFF',25,69.99],['BB-WOM-001','WIL-EVO-WOM',20,64.99]], 10, 'sent','2026-04-28','2026-05-28','2026-06-04',60),
  q('QT-2026-099', 'CUST-009', 'REP-010', [['HP-PRT-001','LFT-PRT-54',4,549.99]], 8, 'lost','2026-04-05','2026-05-05','2026-04-22',0,'Customer chose competing quote'),
  q('QT-2026-095', 'CUST-014', 'REP-001', [['BB-OUT-001','SPA-STR-OFF',60,29.99]], 0, 'won','2026-04-01','2026-05-01','2026-04-27',100,'Converted to ORD-2026-119'),
];

export const getQuote = (id: string) => quotes.find((x) => x.id === id);
export const quotesByStatus = (status: QuoteStatus) => quotes.filter((x) => x.status === status);
export const openPipeline = () => quotes.filter((x) => ['draft', 'sent', 'negotiating'].includes(x.status));
export const pipelineValue = () =>
  openPipeline().reduce((s, q) => s + q.total * (q.probability / 100), 0);
