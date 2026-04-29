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
];

export const getSupplier = (id: string) => suppliers.find((s) => s.id === id);
