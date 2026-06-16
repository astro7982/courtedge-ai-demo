export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  paymentTerms: string;
  minOrderQty: number;
  categories: string[];
}

export const suppliers: Supplier[] = [
  { id: 'SUP-001', name: 'Wilson Sports',        email: 'wholesale@wilson.com',       phone: '555-2001', leadTimeDays: 14, paymentTerms: 'Net 30', minOrderQty: 100, categories: ['Basketballs', 'Uniforms'] },
  { id: 'SUP-002', name: 'Spalding',             email: 'accounts@spalding.com',      phone: '555-2002', leadTimeDays: 10, paymentTerms: 'Net 30', minOrderQty: 50,  categories: ['Basketballs', 'Hoops'] },
  { id: 'SUP-003', name: 'Nike Team',            email: 'team@nike.com',              phone: '555-2003', leadTimeDays: 21, paymentTerms: 'Net 45', minOrderQty: 250, categories: ['Uniforms', 'Footwear', 'Bags'] },
  { id: 'SUP-004', name: 'Under Armour',         email: 'teamsales@ua.com',           phone: '555-2004', leadTimeDays: 18, paymentTerms: 'Net 30', minOrderQty: 200, categories: ['Uniforms', 'Footwear'] },
  { id: 'SUP-005', name: 'Sklz',                 email: 'b2b@sklz.com',               phone: '555-2005', leadTimeDays: 12, paymentTerms: 'Net 30', minOrderQty: 24,  categories: ['Training'] },
  { id: 'SUP-006', name: 'Champion Sports',      email: 'orders@championsports.com',  phone: '555-2006', leadTimeDays: 7,  paymentTerms: 'Net 30', minOrderQty: 50,  categories: ['Basketballs', 'Training'] },
  { id: 'SUP-007', name: 'Goalsetter',           email: 'dealer@goalsetter.com',      phone: '555-2007', leadTimeDays: 28, paymentTerms: 'Net 45', minOrderQty: 10,  categories: ['Hoops'] },
  { id: 'SUP-008', name: 'Lifetime Products',    email: 'wholesale@lifetime.com',     phone: '555-2008', leadTimeDays: 14, paymentTerms: 'Net 30', minOrderQty: 20,  categories: ['Hoops'] },
  { id: 'SUP-009', name: 'Dr. Dish Basketball',  email: 'sales@drdishbasketball.com', phone: '555-2009', leadTimeDays: 35, paymentTerms: 'Net 60', minOrderQty: 1,   categories: ['Training'] },
  { id: 'SUP-010', name: 'Daktronics',           email: 'sales@daktronics.com',       phone: '555-2010', leadTimeDays: 45, paymentTerms: 'Net 60', minOrderQty: 1,   categories: ['Court Equipment'] },
  { id: 'SUP-011', name: 'Gared Sports',         email: 'orders@garedsports.com',     phone: '555-2011', leadTimeDays: 21, paymentTerms: 'Net 30', minOrderQty: 10,  categories: ['Court Equipment', 'Hoops'] },
  { id: 'SUP-012', name: 'Athletic Connection',  email: 'b2b@athleticconnection.com', phone: '555-2012', leadTimeDays: 14, paymentTerms: 'Net 30', minOrderQty: 20,  categories: ['Court Equipment'] },
  { id: 'SUP-013', name: 'Bison Inc',            email: 'dealer@bisoninc.com',        phone: '555-2013', leadTimeDays: 30, paymentTerms: 'Net 45', minOrderQty: 5,   categories: ['Hoops', 'Court Equipment'] },
  { id: 'SUP-014', name: 'Mueller Sports Med',   email: 'wholesale@muellersports.com', phone: '555-2014', leadTimeDays: 7,  paymentTerms: 'Net 30', minOrderQty: 50,  categories: ['Medical'] },
  { id: 'SUP-015', name: 'Port-a-Court',         email: 'orders@portacourt.com',      phone: '555-2015', leadTimeDays: 21, paymentTerms: 'Net 30', minOrderQty: 10,  categories: ['Court Equipment'] },
  // ---- Multi-sport line suppliers ----
  { id: 'SUP-016', name: 'Rawlings', email: 'team@rawlings.com', phone: '555-2016', leadTimeDays: 18, paymentTerms: 'Net 45', minOrderQty: 24, categories: ['Baseball'] },
  { id: 'SUP-017', name: 'Riddell', email: 'wholesale@riddell.com', phone: '555-2017', leadTimeDays: 35, paymentTerms: 'Net 60', minOrderQty: 6, categories: ['Football'] },
  { id: 'SUP-018', name: 'Easton', email: 'dealer@easton.com', phone: '555-2018', leadTimeDays: 21, paymentTerms: 'Net 45', minOrderQty: 12, categories: ['Baseball'] },
  { id: 'SUP-019', name: 'Mizuno', email: 'teamsales@mizuno.com', phone: '555-2019', leadTimeDays: 24, paymentTerms: 'Net 45', minOrderQty: 50, categories: ['Volleyball', 'Baseball', 'Footwear'] },
  { id: 'SUP-020', name: 'Molten', email: 'orders@molten.com', phone: '555-2020', leadTimeDays: 28, paymentTerms: 'Net 30', minOrderQty: 24, categories: ['Volleyball', 'Soccer'] },
  { id: 'SUP-021', name: 'Mikasa Sports', email: 'b2b@mikasasports.com', phone: '555-2021', leadTimeDays: 28, paymentTerms: 'Net 30', minOrderQty: 24, categories: ['Volleyball', 'Soccer'] },
  { id: 'SUP-022', name: 'Head Penn Racquet', email: 'wholesale@headpenn.com', phone: '555-2022', leadTimeDays: 16, paymentTerms: 'Net 30', minOrderQty: 24, categories: ['Tennis'] },
  { id: 'SUP-023', name: 'Adidas Team', email: 'team@adidas.com', phone: '555-2023', leadTimeDays: 21, paymentTerms: 'Net 45', minOrderQty: 200, categories: ['Soccer', 'Footwear', 'Uniforms'] },
  { id: 'SUP-024', name: 'Gill Athletics', email: 'orders@gillathletics.com', phone: '555-2024', leadTimeDays: 30, paymentTerms: 'Net 45', minOrderQty: 4, categories: ['Track & Field'] },
];

export const getSupplier = (id: string) => suppliers.find((s) => s.id === id);
