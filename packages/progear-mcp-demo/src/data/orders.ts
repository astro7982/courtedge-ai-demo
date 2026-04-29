export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  repId: string;
  warehouseId: string;
  items: OrderItem[];
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  orderDate: string;
  shipDate: string | null;
  deliveryDate: string | null;
  notes?: string;
}

// Compact shorthand: items come in [productId, sku, qty, unitPrice]
type ItemShort = [string, string, number, number];
const mkItems = (raw: ItemShort[]): OrderItem[] =>
  raw.map(([productId, sku, quantity, unitPrice]) => ({
    productId, sku, quantity, unitPrice, lineTotal: Math.round(quantity * unitPrice * 100) / 100,
  }));
const calc = (items: OrderItem[], discountPct: number) => {
  const subtotal = Math.round(items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;
  const discountAmount = Math.round(subtotal * discountPct) / 100;
  const total = Math.round((subtotal - discountAmount) * 100) / 100;
  return { subtotal, discountAmount, total };
};
const order = (
  id: string,
  customerId: string,
  repId: string,
  warehouseId: string,
  rawItems: ItemShort[],
  discountPct: number,
  status: OrderStatus,
  orderDate: string,
  shipDate: string | null,
  deliveryDate: string | null,
  notes?: string,
): Order => {
  const items = mkItems(rawItems);
  const { subtotal, discountAmount, total } = calc(items, discountPct);
  return { id, customerId, repId, warehouseId, items, subtotal, discountPct, discountAmount, total, status, orderDate, shipDate, deliveryDate, notes };
};

export const orders: Order[] = [
  // Delivered (older, full lifecycle)
  order('ORD-2025-088', 'CUST-001', 'REP-002', 'WH-WEST', [['BB-PRO-001','WIL-EVO-OFF',50,69.99],['TRN-REB-003','SKZ-REB-NET',4,199.99]], 10, 'delivered','2025-10-02','2025-10-05','2025-10-09'),
  order('ORD-2025-091', 'CUST-002', 'REP-005', 'WH-EAST', [['UNI-JRS-001','NIK-JRS-CUS',200,89.99],['UNI-SHT-001','NIK-SHT-PRO',200,49.99]], 15, 'delivered','2025-10-12','2025-10-16','2025-10-21','Season uniform purchase'),
  order('ORD-2025-094', 'CUST-003', 'REP-002', 'WH-WEST', [['HP-PRO-002','GLS-COL-RIM',6,899.99],['BB-PRO-002','SPA-TF1K-OFF',40,79.99]], 12, 'delivered','2025-10-20','2025-10-24','2025-10-29'),
  order('ORD-2025-097', 'CUST-005', 'REP-007', 'WH-NORTH',[['UNI-JRS-002','UA-JRS-LEG',120,54.99],['SHO-TEM-001','NIK-TEM-01',120,74.99]], 15, 'delivered','2025-10-28','2025-11-02','2025-11-07'),
  order('ORD-2025-102', 'CUST-007', 'REP-009', 'WH-WEST', [['BB-OUT-001','SPA-STR-OFF',200,29.99],['BB-YTH-001','CHA-YTH-27',150,24.99]], 12, 'delivered','2025-11-05','2025-11-08','2025-11-12'),
  order('ORD-2025-108', 'CUST-008', 'REP-003', 'WH-CENTRAL',[['SHO-TEM-002','UA-LOC-02',180,79.99],['BAG-TEM-002','UA-BAG-DFL',100,59.99]], 15, 'delivered','2025-11-14','2025-11-18','2025-11-23','Retail stock reload'),
  order('ORD-2025-114', 'CUST-013', 'REP-006', 'WH-EAST', [['UNI-WRM-001','UA-WRM-JKT',25,119.99]], 10, 'delivered','2025-11-22','2025-11-25','2025-11-29'),
  order('ORD-2025-119', 'CUST-011', 'REP-003', 'WH-CENTRAL',[['BB-PRO-003','WIL-NCAA-REP',60,59.99],['TRN-DRB-001','SKZ-DRB-GG',60,19.99]], 10, 'delivered','2025-12-01','2025-12-04','2025-12-09'),
  order('ORD-2025-125', 'CUST-006', 'REP-005', 'WH-EAST', [['HP-PRO-001','SPA-ARN-72',1,4999.99],['CRT-SCR-001','DAK-SCR-LED',1,3999.99]], 8, 'delivered','2025-12-08','2025-12-15','2025-12-22','Arena upgrade'),
  order('ORD-2025-131', 'CUST-010', 'REP-008', 'WH-NORTH',[['UNI-JRS-003','NIK-JRS-YTH',200,64.99],['UNI-SHT-003','NIK-SHT-YTH',200,34.99]], 15, 'delivered','2025-12-18','2025-12-21','2025-12-28','AAU season outfitting'),
  order('ORD-2025-138', 'CUST-012', 'REP-001', 'WH-WEST', [['BB-YTH-001','CHA-YTH-27',100,24.99],['TRN-CON-001','SKZ-CON-20',10,24.99]], 5, 'delivered','2025-12-27','2025-12-30','2026-01-04'),
  order('ORD-2025-144', 'CUST-014', 'REP-001', 'WH-WEST', [['BB-OUT-002','WIL-OUT-29',80,26.99],['HP-NET-001','SPA-NET-HD',30,49.99]], 5, 'delivered','2026-01-08','2026-01-11','2026-01-15'),
  order('ORD-2025-149', 'CUST-004', 'REP-003', 'WH-CENTRAL',[['WGT-DMB-001','CHA-DMB-SET',2,1299.99],['WGT-BNC-001','CHA-BNC-ADJ',4,349.99]], 10, 'delivered','2026-01-14','2026-01-17','2026-01-22','Strength room build-out'),
  order('ORD-2026-005', 'CUST-017', 'REP-002', 'WH-WEST', [['UNI-JRS-001','NIK-JRS-CUS',45,89.99],['UNI-SHT-001','NIK-SHT-PRO',45,49.99]], 10, 'delivered','2026-01-20','2026-01-23','2026-01-28'),
  order('ORD-2026-009', 'CUST-019', 'REP-010', 'WH-EAST', [['BB-PRO-001','WIL-EVO-OFF',30,69.99],['BB-WOM-001','WIL-EVO-WOM',20,64.99]], 10, 'delivered','2026-01-28','2026-01-31','2026-02-04'),
  order('ORD-2026-014', 'CUST-015', 'REP-009', 'WH-WEST', [['SHO-PRO-001','NIK-KYR-7',30,139.99],['BAG-BKP-001','NIK-BAG-BKP',30,69.99]], 10, 'delivered','2026-02-02','2026-02-05','2026-02-10'),
  order('ORD-2026-018', 'CUST-009', 'REP-010', 'WH-EAST', [['CRT-SHT-001','GAR-SHT-CLK',2,1999.99],['OFF-WHS-002','FOX-WHS-ELC',8,89.99]], 10, 'delivered','2026-02-08','2026-02-12','2026-02-17','Gym officials upgrade'),
  order('ORD-2026-023', 'CUST-016', 'REP-007', 'WH-NORTH',[['BB-YTH-002','CHA-JR-28',150,19.99],['BB-OUT-002','WIL-OUT-29',80,26.99]], 8, 'delivered','2026-02-14','2026-02-17','2026-02-21'),
  order('ORD-2026-028', 'CUST-020', 'REP-001', 'WH-WEST', [['BB-YTH-001','CHA-YTH-27',200,24.99],['BB-YTH-002','CHA-JR-28',100,19.99]], 12, 'delivered','2026-02-20','2026-02-23','2026-02-28','District-wide PE supply'),
  order('ORD-2026-033', 'CUST-023', 'REP-005', 'WH-EAST', [['TRN-REB-002','DRD-REBEL',1,2999.99],['TRN-SHT-001','SKZ-SHT-SPT',10,39.99]], 5, 'delivered','2026-02-26','2026-03-01','2026-03-05'),

  // Shipped (recent)
  order('ORD-2026-038', 'CUST-001', 'REP-002', 'WH-WEST', [['MED-KIT-001','MUE-KIT-SPT',4,299.99],['MED-TAP-001','MUE-TAP-ATH',12,79.99]], 8, 'shipped','2026-03-02','2026-03-06', null,'Training room restock'),
  order('ORD-2026-042', 'CUST-002', 'REP-005', 'WH-EAST', [['UNI-PRC-001','UA-PRC-SHR',20,79.99],['UNI-HED-001','NIK-HED-TEM',60,29.99]], 10, 'shipped','2026-03-06','2026-03-10', null),
  order('ORD-2026-047', 'CUST-022', 'REP-004', 'WH-CENTRAL',[['BB-PRO-001','WIL-EVO-OFF',20,69.99],['HP-NET-002','WIL-NET-STD',40,9.99]], 5, 'shipped','2026-03-10','2026-03-14', null),
  order('ORD-2026-053', 'CUST-024', 'REP-009', 'WH-WEST', [['SHO-WOM-001','NIK-WOM-01',40,119.99],['BAG-TEM-001','NIK-BAG-DFL',40,79.99]], 10, 'shipped','2026-03-14','2026-03-18', null),
  order('ORD-2026-058', 'CUST-021', 'REP-008', 'WH-NORTH',[['TRN-CON-001','SKZ-CON-20',20,24.99],['TRN-LDR-001','SKZ-LDR-15',20,29.99],['TRN-HUR-001','CHA-HUR-12',10,89.99]], 8, 'shipped','2026-03-20','2026-03-24', null),
  order('ORD-2026-063', 'CUST-007', 'REP-009', 'WH-WEST', [['BB-OUT-001','SPA-STR-OFF',300,29.99],['BB-YTH-001','CHA-YTH-27',250,24.99]], 12, 'shipped','2026-03-25','2026-03-29', null,'Spring resale'),
  order('ORD-2026-068', 'CUST-006', 'REP-005', 'WH-EAST', [['HP-PRT-001','LFT-PRT-54',8,549.99],['BB-PRO-001','WIL-EVO-OFF',48,69.99]], 10, 'shipped','2026-03-30','2026-04-03', null),
  order('ORD-2026-073', 'CUST-018', 'REP-004', 'WH-CENTRAL',[['BB-PRO-003','WIL-NCAA-REP',36,59.99],['CRT-RCK-001','GAR-RCK-24',6,249.99]], 5, 'shipped','2026-04-02','2026-04-06', null),
  order('ORD-2026-078', 'CUST-015', 'REP-009', 'WH-WEST', [['UNI-JRS-004','NIK-JRS-WOM',36,84.99],['SHO-WOM-002','UA-WOM-01',36,99.99]], 10, 'shipped','2026-04-06','2026-04-10', null,'Women\'s team outfit'),
  order('ORD-2026-083', 'CUST-008', 'REP-003', 'WH-CENTRAL',[['UNI-JRS-002','UA-JRS-LEG',200,54.99]], 15, 'shipped','2026-04-10','2026-04-14', null),
  order('ORD-2026-088', 'CUST-004', 'REP-003', 'WH-CENTRAL',[['BB-PRO-002','SPA-TF1K-OFF',36,79.99],['MED-AED-001','MUE-AED-PRT',2,1499.99]], 8, 'shipped','2026-04-12','2026-04-16', null),

  // Processing
  order('ORD-2026-094', 'CUST-005', 'REP-007', 'WH-NORTH',[['WGT-KBL-001','CHA-KBL-SET',4,599.99],['WGT-MED-001','SKZ-MED-10L',20,49.99]], 8, 'processing','2026-04-18', null, null),
  order('ORD-2026-099', 'CUST-010', 'REP-008', 'WH-NORTH',[['BB-YTH-002','CHA-JR-28',300,19.99],['UNI-JRS-003','NIK-JRS-YTH',120,64.99]], 15, 'processing','2026-04-20', null, null,'AAU summer tournament gear'),
  order('ORD-2026-104', 'CUST-003', 'REP-002', 'WH-WEST', [['HP-PRO-001','SPA-ARN-72',1,4999.99],['CRT-SCR-001','DAK-SCR-LED',1,3999.99],['HP-PAD-001','BIS-PAD-POL',4,189.99]], 10, 'processing','2026-04-22', null, null,'Full arena upgrade'),
  order('ORD-2026-108', 'CUST-011', 'REP-003', 'WH-CENTRAL',[['TRN-REB-003','SKZ-REB-NET',4,199.99],['TRN-DRB-001','SKZ-DRB-GG',40,19.99]], 5, 'processing','2026-04-23', null, null),
  order('ORD-2026-112', 'CUST-025', 'REP-003', 'WH-CENTRAL',[['UNI-JRS-001','NIK-JRS-CUS',24,89.99],['UNI-SHT-001','NIK-SHT-PRO',24,49.99]], 8, 'processing','2026-04-24', null, null),

  // Pending
  order('ORD-2026-115', 'CUST-002', 'REP-005', 'WH-EAST', [['UNI-JRS-001','NIK-JRS-CUS',80,89.99],['UNI-SHT-001','NIK-SHT-PRO',80,49.99],['UNI-WRM-001','UA-WRM-JKT',30,119.99]], 15, 'pending','2026-04-25', null, null,'Spring sport transition'),
  order('ORD-2026-117', 'CUST-009', 'REP-010', 'WH-EAST', [['WGT-DMB-001','CHA-DMB-SET',1,1299.99],['WGT-BAR-001','CHA-BAR-45',4,299.99]], 5, 'pending','2026-04-26', null, null),
  order('ORD-2026-119', 'CUST-014', 'REP-001', 'WH-WEST', [['BB-OUT-001','SPA-STR-OFF',60,29.99]], 0, 'pending','2026-04-27', null, null),
  order('ORD-2026-121', 'CUST-039', 'REP-003', 'WH-CENTRAL',[['BB-PRO-001','WIL-EVO-OFF',20,69.99],['BAG-BLL-002','WIL-BAG-12B',4,39.99]], 5, 'pending','2026-04-28', null, null),
  order('ORD-2026-123', 'CUST-026', 'REP-004', 'WH-CENTRAL',[['BB-OUT-002','WIL-OUT-29',30,26.99],['HP-NET-002','WIL-NET-STD',12,9.99]], 0, 'pending','2026-04-28', null, null),

  // Cancelled
  order('ORD-2026-050', 'CUST-040', 'REP-001', 'WH-WEST', [['UNI-JRS-002','UA-JRS-LEG',40,54.99]], 0, 'cancelled','2026-03-12', null, null,'Customer cancelled — scheduling conflict'),
  order('ORD-2026-075', 'CUST-046', 'REP-003', 'WH-CENTRAL',[['BB-YTH-001','CHA-YTH-27',40,24.99]], 0, 'cancelled','2026-04-04', null, null,'Insufficient credit limit'),

  // Older deliveries for history depth
  order('ORD-2025-055', 'CUST-007', 'REP-009', 'WH-WEST', [['BB-OUT-001','SPA-STR-OFF',180,29.99]], 10, 'delivered','2025-07-15','2025-07-18','2025-07-22'),
  order('ORD-2025-061', 'CUST-008', 'REP-003', 'WH-CENTRAL',[['UNI-JRS-001','NIK-JRS-CUS',150,89.99],['UNI-SHT-001','NIK-SHT-PRO',150,49.99]], 15, 'delivered','2025-07-28','2025-08-01','2025-08-06'),
  order('ORD-2025-067', 'CUST-002', 'REP-005', 'WH-EAST', [['BB-PRO-001','WIL-EVO-OFF',100,69.99],['BB-WOM-001','WIL-EVO-WOM',60,64.99]], 12, 'delivered','2025-08-10','2025-08-14','2025-08-19','Back-to-school supply'),
  order('ORD-2025-073', 'CUST-010', 'REP-008', 'WH-NORTH',[['SHO-TEM-001','NIK-TEM-01',100,74.99],['BAG-TEM-001','NIK-BAG-DFL',100,79.99]], 12, 'delivered','2025-08-22','2025-08-26','2025-09-01'),
  order('ORD-2025-079', 'CUST-005', 'REP-007', 'WH-NORTH',[['CRT-BNC-001','ATH-BNC-8',6,699.99]], 8, 'delivered','2025-09-05','2025-09-09','2025-09-13'),
  order('ORD-2025-084', 'CUST-006', 'REP-005', 'WH-EAST', [['MED-KIT-001','MUE-KIT-SPT',6,299.99],['MED-TAP-002','MUE-TAP-KIN',8,119.99]], 8, 'delivered','2025-09-16','2025-09-19','2025-09-24'),

  // Mid-season spot orders
  order('ORD-2026-030', 'CUST-036', 'REP-004', 'WH-CENTRAL',[['OFF-UNI-001','CHA-OFF-STR',4,44.99],['OFF-UNI-002','CHA-OFF-PNT',4,54.99]], 0, 'delivered','2026-02-24','2026-02-27','2026-03-03'),
  order('ORD-2026-035', 'CUST-038', 'REP-002', 'WH-WEST', [['SHO-YTH-001','NIK-YTH-HST',40,54.99]], 5, 'delivered','2026-03-01','2026-03-04','2026-03-08'),
  order('ORD-2026-040', 'CUST-035', 'REP-010', 'WH-EAST', [['BB-MINI-001','WIL-MINI-5',200,4.99],['UNI-HED-001','NIK-HED-TEM',20,29.99]], 0, 'delivered','2026-03-05','2026-03-08','2026-03-12','Camp promo giveaways'),
  order('ORD-2026-045', 'CUST-041', 'REP-001', 'WH-WEST', [['BB-YTH-002','CHA-JR-28',40,19.99]], 0, 'delivered','2026-03-08','2026-03-11','2026-03-15'),
  order('ORD-2026-055', 'CUST-042', 'REP-010', 'WH-EAST', [['BB-YTH-001','CHA-YTH-27',20,24.99],['UNI-PRC-002','CHA-PRC-SHT',20,28.99]], 0, 'delivered','2026-03-16','2026-03-19','2026-03-23'),
  order('ORD-2026-060', 'CUST-044', 'REP-006', 'WH-EAST', [['UNI-JRS-003','NIK-JRS-YTH',15,64.99]], 0, 'delivered','2026-03-22','2026-03-25','2026-03-29'),
  order('ORD-2026-065', 'CUST-045', 'REP-007', 'WH-NORTH',[['BB-PRO-003','WIL-NCAA-REP',12,59.99]], 0, 'delivered','2026-03-27','2026-03-30','2026-04-03'),
  order('ORD-2026-070', 'CUST-048', 'REP-008', 'WH-NORTH',[['BB-OUT-001','SPA-STR-OFF',25,29.99]], 0, 'delivered','2026-04-01','2026-04-04','2026-04-08'),
  order('ORD-2026-080', 'CUST-031', 'REP-008', 'WH-NORTH',[['BB-OUT-002','WIL-OUT-29',20,26.99]], 0, 'shipped','2026-04-08','2026-04-11', null),
  order('ORD-2026-085', 'CUST-049', 'REP-002', 'WH-WEST', [['BB-YTH-001','CHA-YTH-27',25,24.99]], 0, 'shipped','2026-04-11','2026-04-14', null),
  order('ORD-2026-090', 'CUST-034', 'REP-009', 'WH-WEST', [['BB-YTH-001','CHA-YTH-27',60,24.99],['UNI-PRC-002','CHA-PRC-SHT',30,28.99]], 0, 'shipped','2026-04-15','2026-04-18', null),
  order('ORD-2026-096', 'CUST-029', 'REP-006', 'WH-EAST', [['HP-PRT-002','LFT-PRT-50',4,349.99]], 5, 'processing','2026-04-19', null, null),
  order('ORD-2026-101', 'CUST-037', 'REP-007', 'WH-NORTH',[['TRN-LDR-001','SKZ-LDR-15',12,29.99],['TRN-CON-001','SKZ-CON-20',12,24.99]], 0, 'processing','2026-04-21', null, null),
];

export const getOrder = (id: string) => orders.find((o) => o.id === id);
export const ordersByCustomer = (customerId: string) => orders.filter((o) => o.customerId === customerId);
export const ordersByStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);
export const ordersByRep = (repId: string) => orders.filter((o) => o.repId === repId);
export const ordersBetween = (from: string, to: string) =>
  orders.filter((o) => o.orderDate >= from && o.orderDate <= to);
