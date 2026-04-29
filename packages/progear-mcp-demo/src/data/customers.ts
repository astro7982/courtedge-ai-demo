export type Tier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
export type Territory = 'West' | 'Central' | 'East' | 'North';
export type CustomerType =
  | 'University'
  | 'K-12 District'
  | 'High School'
  | 'Middle School'
  | 'Community College'
  | 'Rec Center'
  | 'YMCA'
  | 'AAU Club'
  | 'Church League'
  | 'Pro/Semi-Pro Team'
  | 'Retail Reseller'
  | 'Municipal Parks';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  tier: Tier;
  territory: Territory;
  contact: string;
  email: string;
  phone: string;
  totalOrders: number;
  lifetimeValue: number;
  lastOrderDate: string;
  paymentTerms: string;
  creditLimit: number;
  assignedRepId: string;
}

export const customers: Customer[] = [
  // ------- Platinum (10) -------
  { id: 'CUST-001', name: 'State University Athletics',        type: 'University',        tier: 'Platinum', territory: 'West',    contact: 'Coach Alan Williams',      email: 'awilliams@stateuniv.edu',         phone: '555-1001', totalOrders: 156, lifetimeValue: 189500, lastOrderDate: '2026-04-10', paymentTerms: 'Net 45', creditLimit: 250000, assignedRepId: 'REP-002' },
  { id: 'CUST-002', name: 'Metro High School District',        type: 'K-12 District',     tier: 'Platinum', territory: 'East',    contact: 'AD Janine Johnson',        email: 'jjohnson@metrohsd.edu',            phone: '555-1002', totalOrders: 312, lifetimeValue: 284500, lastOrderDate: '2026-04-18', paymentTerms: 'Net 60', creditLimit: 350000, assignedRepId: 'REP-005' },
  { id: 'CUST-003', name: 'Pacific Coast Pro Academy',         type: 'Pro/Semi-Pro Team', tier: 'Platinum', territory: 'West',    contact: 'GM Marcus Reed',           email: 'mreed@pcproacademy.com',           phone: '555-1003', totalOrders: 234, lifetimeValue: 167800, lastOrderDate: '2026-04-22', paymentTerms: 'Net 30', creditLimit: 200000, assignedRepId: 'REP-002' },
  { id: 'CUST-004', name: 'Central Texas Univ. Athletics',     type: 'University',        tier: 'Platinum', territory: 'Central', contact: 'AD Emily Torres',          email: 'etorres@centraltex.edu',           phone: '555-1004', totalOrders: 198, lifetimeValue: 142600, lastOrderDate: '2026-04-05', paymentTerms: 'Net 45', creditLimit: 180000, assignedRepId: 'REP-003' },
  { id: 'CUST-005', name: 'Lakeshore Unified Schools',         type: 'K-12 District',     tier: 'Platinum', territory: 'North',   contact: 'Dir. Kevin O\'Brien',       email: 'kobrien@lakeshoreusd.edu',         phone: '555-1005', totalOrders: 268, lifetimeValue: 218900, lastOrderDate: '2026-04-24', paymentTerms: 'Net 60', creditLimit: 300000, assignedRepId: 'REP-007' },
  { id: 'CUST-006', name: 'Atlantic Regional Athletics',       type: 'University',        tier: 'Platinum', territory: 'East',    contact: 'AD Monica Davis',          email: 'mdavis@atlanticreg.edu',           phone: '555-1006', totalOrders: 212, lifetimeValue: 176400, lastOrderDate: '2026-04-15', paymentTerms: 'Net 45', creditLimit: 220000, assignedRepId: 'REP-005' },
  { id: 'CUST-007', name: 'Desert Valley Sports Hub',          type: 'Retail Reseller',   tier: 'Platinum', territory: 'West',    contact: 'Owner Ricky Nguyen',       email: 'ricky@desertvalleysports.com',     phone: '555-1007', totalOrders: 412, lifetimeValue: 312700, lastOrderDate: '2026-04-25', paymentTerms: 'Net 30', creditLimit: 400000, assignedRepId: 'REP-009' },
  { id: 'CUST-008', name: 'Great Plains Athletic Supply',      type: 'Retail Reseller',   tier: 'Platinum', territory: 'Central', contact: 'VP Sales Anita Kumar',     email: 'akumar@greatplainssupply.com',     phone: '555-1008', totalOrders: 367, lifetimeValue: 278300, lastOrderDate: '2026-04-20', paymentTerms: 'Net 30', creditLimit: 350000, assignedRepId: 'REP-003' },
  { id: 'CUST-009', name: 'Northeast Prep Academy',            type: 'High School',       tier: 'Platinum', territory: 'East',    contact: 'AD Russell Hayes',         email: 'rhayes@nepa.edu',                  phone: '555-1009', totalOrders: 142, lifetimeValue: 134500, lastOrderDate: '2026-04-12', paymentTerms: 'Net 45', creditLimit: 150000, assignedRepId: 'REP-010' },
  { id: 'CUST-010', name: 'Midwest AAU Circuit',               type: 'AAU Club',          tier: 'Platinum', territory: 'North',   contact: 'Dir. Trevor Lassiter',     email: 'tlassiter@midwestaau.org',         phone: '555-1010', totalOrders: 188, lifetimeValue: 156700, lastOrderDate: '2026-04-08', paymentTerms: 'Net 30', creditLimit: 200000, assignedRepId: 'REP-008' },

  // ------- Gold (15) -------
  { id: 'CUST-011', name: 'City Pro Basketball Academy',       type: 'AAU Club',          tier: 'Gold',     territory: 'Central', contact: 'Dir. Jason Martinez',      email: 'jmartinez@cityproacademy.com',     phone: '555-1011', totalOrders: 92,  lifetimeValue: 24800, lastOrderDate: '2026-04-01', paymentTerms: 'Net 30', creditLimit: 40000, assignedRepId: 'REP-003' },
  { id: 'CUST-012', name: 'Riverside Youth Basketball League', type: 'AAU Club',          tier: 'Gold',     territory: 'West',    contact: 'Dir. Dana Chen',           email: 'dchen@riversideybl.org',           phone: '555-1012', totalOrders: 89,  lifetimeValue: 23400, lastOrderDate: '2026-03-28', paymentTerms: 'Net 30', creditLimit: 35000, assignedRepId: 'REP-001' },
  { id: 'CUST-013', name: 'Eastside High School',              type: 'High School',       tier: 'Gold',     territory: 'East',    contact: 'Coach Carla Davis',        email: 'cdavis@eastsidehs.edu',            phone: '555-1013', totalOrders: 78,  lifetimeValue: 21200, lastOrderDate: '2026-04-01', paymentTerms: 'Net 30', creditLimit: 30000, assignedRepId: 'REP-006' },
  { id: 'CUST-014', name: 'Mountain View Community Center',    type: 'Rec Center',        tier: 'Gold',     territory: 'West',    contact: 'Mgr. Marc Brown',          email: 'mbrown@mvcc.gov',                  phone: '555-1014', totalOrders: 67,  lifetimeValue: 18900, lastOrderDate: '2026-03-20', paymentTerms: 'Net 30', creditLimit: 25000, assignedRepId: 'REP-001' },
  { id: 'CUST-015', name: 'Harbor Bay Community College',      type: 'Community College', tier: 'Gold',     territory: 'West',    contact: 'AD Samantha Lee',          email: 'slee@harborbaycc.edu',             phone: '555-1015', totalOrders: 74,  lifetimeValue: 19700, lastOrderDate: '2026-04-14', paymentTerms: 'Net 45', creditLimit: 30000, assignedRepId: 'REP-009' },
  { id: 'CUST-016', name: 'Northside YMCA',                    type: 'YMCA',              tier: 'Gold',     territory: 'North',   contact: 'Dir. Nathan Huang',        email: 'nhuang@northsideymca.org',         phone: '555-1016', totalOrders: 82,  lifetimeValue: 22400, lastOrderDate: '2026-04-06', paymentTerms: 'Net 30', creditLimit: 30000, assignedRepId: 'REP-007' },
  { id: 'CUST-017', name: 'Westview Union HS',                 type: 'High School',       tier: 'Gold',     territory: 'West',    contact: 'Coach Brady Wilson',       email: 'bwilson@westviewhs.edu',           phone: '555-1017', totalOrders: 61,  lifetimeValue: 16800, lastOrderDate: '2026-03-18', paymentTerms: 'Net 30', creditLimit: 25000, assignedRepId: 'REP-002' },
  { id: 'CUST-018', name: 'Oak Ridge Recreation Dept',         type: 'Municipal Parks',   tier: 'Gold',     territory: 'Central', contact: 'Dir. Carlos Hernandez',    email: 'chernandez@oakridge.gov',          phone: '555-1018', totalOrders: 58,  lifetimeValue: 15200, lastOrderDate: '2026-03-10', paymentTerms: 'Net 30', creditLimit: 25000, assignedRepId: 'REP-004' },
  { id: 'CUST-019', name: 'Blue Ridge Prep',                   type: 'High School',       tier: 'Gold',     territory: 'East',    contact: 'AD Morgan Fletcher',       email: 'mfletcher@blueridgeprep.edu',      phone: '555-1019', totalOrders: 64,  lifetimeValue: 17400, lastOrderDate: '2026-04-03', paymentTerms: 'Net 30', creditLimit: 25000, assignedRepId: 'REP-010' },
  { id: 'CUST-020', name: 'Sunnyvale Middle Schools',          type: 'K-12 District',     tier: 'Gold',     territory: 'West',    contact: 'AD Paulina Vega',          email: 'pvega@sunnyvalesd.edu',            phone: '555-1020', totalOrders: 94,  lifetimeValue: 24600, lastOrderDate: '2026-04-19', paymentTerms: 'Net 30', creditLimit: 35000, assignedRepId: 'REP-001' },
  { id: 'CUST-021', name: 'Thunder Valley AAU',                type: 'AAU Club',          tier: 'Gold',     territory: 'North',   contact: 'Dir. Bryce Kellner',       email: 'bkellner@thundervalley.org',       phone: '555-1021', totalOrders: 71,  lifetimeValue: 19100, lastOrderDate: '2026-03-29', paymentTerms: 'Net 30', creditLimit: 28000, assignedRepId: 'REP-008' },
  { id: 'CUST-022', name: 'Copper Creek High',                 type: 'High School',       tier: 'Gold',     territory: 'Central', contact: 'Coach Evelyn Park',        email: 'epark@coppercreekhs.edu',          phone: '555-1022', totalOrders: 56,  lifetimeValue: 14800, lastOrderDate: '2026-03-14', paymentTerms: 'Net 30', creditLimit: 22000, assignedRepId: 'REP-004' },
  { id: 'CUST-023', name: 'Millbrook University',              type: 'University',        tier: 'Gold',     territory: 'East',    contact: 'AD Henry Okonkwo',         email: 'hokonkwo@millbrook.edu',           phone: '555-1023', totalOrders: 84,  lifetimeValue: 22900, lastOrderDate: '2026-04-21', paymentTerms: 'Net 45', creditLimit: 40000, assignedRepId: 'REP-005' },
  { id: 'CUST-024', name: 'Bay Area Sports Resale',            type: 'Retail Reseller',   tier: 'Gold',     territory: 'West',    contact: 'Mgr. Vince Delgado',       email: 'vdelgado@bayareasportsresale.com', phone: '555-1024', totalOrders: 112, lifetimeValue: 24200, lastOrderDate: '2026-04-02', paymentTerms: 'Net 30', creditLimit: 40000, assignedRepId: 'REP-009' },
  { id: 'CUST-025', name: 'Red River Community College',       type: 'Community College', tier: 'Gold',     territory: 'Central', contact: 'AD Rodrigo Santana',       email: 'rsantana@redrivercc.edu',          phone: '555-1025', totalOrders: 68,  lifetimeValue: 18200, lastOrderDate: '2026-03-26', paymentTerms: 'Net 45', creditLimit: 28000, assignedRepId: 'REP-003' },

  // ------- Silver (15) -------
  { id: 'CUST-026', name: 'Downtown Recreation Center',        type: 'Rec Center',        tier: 'Silver',   territory: 'Central', contact: 'Dir. Sarah Lee',           email: 'slee@downtownrec.org',             phone: '555-1026', totalOrders: 45,  lifetimeValue: 8700,  lastOrderDate: '2026-02-15', paymentTerms: 'Net 15', creditLimit: 12000, assignedRepId: 'REP-004' },
  { id: 'CUST-027', name: 'Lakeside Middle School',            type: 'Middle School',     tier: 'Silver',   territory: 'Central', contact: 'Coach Brian Thompson',     email: 'bthompson@lakesidems.edu',         phone: '555-1027', totalOrders: 34,  lifetimeValue: 6500,  lastOrderDate: '2026-01-22', paymentTerms: 'Net 15', creditLimit: 10000, assignedRepId: 'REP-003' },
  { id: 'CUST-028', name: 'Prairie Winds Middle School',       type: 'Middle School',     tier: 'Silver',   territory: 'North',   contact: 'Coach Fallon Murphy',      email: 'fmurphy@prairiewindsms.edu',       phone: '555-1028', totalOrders: 29,  lifetimeValue: 5400,  lastOrderDate: '2026-02-08', paymentTerms: 'Net 15', creditLimit: 8000,  assignedRepId: 'REP-008' },
  { id: 'CUST-029', name: 'Old Town Rec Basketball',           type: 'Rec Center',        tier: 'Silver',   territory: 'East',    contact: 'Dir. Anton Petrov',        email: 'apetrov@oldtownrec.org',           phone: '555-1029', totalOrders: 41,  lifetimeValue: 7600,  lastOrderDate: '2026-02-28', paymentTerms: 'Net 15', creditLimit: 10000, assignedRepId: 'REP-006' },
  { id: 'CUST-030', name: 'Hillcrest High',                    type: 'High School',       tier: 'Silver',   territory: 'Central', contact: 'Coach Wendy Ford',         email: 'wford@hillcresths.edu',            phone: '555-1030', totalOrders: 38,  lifetimeValue: 7200,  lastOrderDate: '2026-02-22', paymentTerms: 'Net 30', creditLimit: 10000, assignedRepId: 'REP-004' },
  { id: 'CUST-031', name: 'Valley View Church League',         type: 'Church League',     tier: 'Silver',   territory: 'North',   contact: 'Dir. Pastor Tim Adams',    email: 'tadams@valleyviewchurch.org',      phone: '555-1031', totalOrders: 26,  lifetimeValue: 5100,  lastOrderDate: '2026-01-14', paymentTerms: 'Net 15', creditLimit: 7000,  assignedRepId: 'REP-008' },
  { id: 'CUST-032', name: 'Cedar Grove YMCA',                  type: 'YMCA',              tier: 'Silver',   territory: 'East',    contact: 'Dir. Marisa Chen',         email: 'mchen@cedargroveymca.org',         phone: '555-1032', totalOrders: 44,  lifetimeValue: 8200,  lastOrderDate: '2026-03-05', paymentTerms: 'Net 30', creditLimit: 12000, assignedRepId: 'REP-006' },
  { id: 'CUST-033', name: 'Westgate Rec Center',               type: 'Rec Center',        tier: 'Silver',   territory: 'West',    contact: 'Mgr. Diego Alvarez',       email: 'dalvarez@westgaterec.gov',         phone: '555-1033', totalOrders: 31,  lifetimeValue: 5900,  lastOrderDate: '2026-02-12', paymentTerms: 'Net 30', creditLimit: 9000,  assignedRepId: 'REP-002' },
  { id: 'CUST-034', name: 'Oakwood Middle School',             type: 'Middle School',     tier: 'Silver',   territory: 'West',    contact: 'AD Patricia Ng',           email: 'png@oakwoodms.edu',                phone: '555-1034', totalOrders: 36,  lifetimeValue: 6800,  lastOrderDate: '2026-02-25', paymentTerms: 'Net 15', creditLimit: 10000, assignedRepId: 'REP-009' },
  { id: 'CUST-035', name: 'Rockwell Prep',                     type: 'High School',       tier: 'Silver',   territory: 'East',    contact: 'Coach Leon Park',          email: 'lpark@rockwellprep.edu',           phone: '555-1035', totalOrders: 33,  lifetimeValue: 6300,  lastOrderDate: '2026-02-18', paymentTerms: 'Net 30', creditLimit: 9000,  assignedRepId: 'REP-010' },
  { id: 'CUST-036', name: 'Willow Creek High',                 type: 'High School',       tier: 'Silver',   territory: 'Central', contact: 'Coach Celia Ortiz',        email: 'cortiz@willowcreekhs.edu',         phone: '555-1036', totalOrders: 28,  lifetimeValue: 5500,  lastOrderDate: '2026-01-30', paymentTerms: 'Net 30', creditLimit: 8500,  assignedRepId: 'REP-004' },
  { id: 'CUST-037', name: 'Horizon Rec Sports',                type: 'Rec Center',        tier: 'Silver',   territory: 'North',   contact: 'Mgr. Kelvin Jacobs',       email: 'kjacobs@horizonrec.org',           phone: '555-1037', totalOrders: 42,  lifetimeValue: 7900,  lastOrderDate: '2026-03-12', paymentTerms: 'Net 15', creditLimit: 11000, assignedRepId: 'REP-007' },
  { id: 'CUST-038', name: 'Summit Community College',          type: 'Community College', tier: 'Silver',   territory: 'West',    contact: 'AD Rohan Desai',           email: 'rdesai@summitcc.edu',              phone: '555-1038', totalOrders: 39,  lifetimeValue: 7400,  lastOrderDate: '2026-03-02', paymentTerms: 'Net 30', creditLimit: 12000, assignedRepId: 'REP-002' },
  { id: 'CUST-039', name: 'Four Winds AAU',                    type: 'AAU Club',          tier: 'Silver',   territory: 'Central', contact: 'Dir. Kareem Gibson',       email: 'kgibson@fourwindsaau.org',         phone: '555-1039', totalOrders: 46,  lifetimeValue: 8400,  lastOrderDate: '2026-03-16', paymentTerms: 'Net 30', creditLimit: 12000, assignedRepId: 'REP-003' },
  { id: 'CUST-040', name: 'Shoreline Church League',           type: 'Church League',     tier: 'Silver',   territory: 'West',    contact: 'Dir. Pastor Ana Ruiz',     email: 'aruiz@shorelinechurch.org',        phone: '555-1040', totalOrders: 24,  lifetimeValue: 4900,  lastOrderDate: '2026-01-18', paymentTerms: 'Prepaid', creditLimit: 5000, assignedRepId: 'REP-001' },

  // ------- Bronze (10) -------
  { id: 'CUST-041', name: 'Parks & Rec Basketball Program',    type: 'Municipal Parks',   tier: 'Bronze',   territory: 'West',    contact: 'Coord. Jenny Wilson',      email: 'jwilson@parksrec.gov',             phone: '555-1041', totalOrders: 12,  lifetimeValue: 2800,  lastOrderDate: '2025-12-30', paymentTerms: 'Prepaid', creditLimit: 3000, assignedRepId: 'REP-001' },
  { id: 'CUST-042', name: 'Community Church Youth League',     type: 'Church League',     tier: 'Bronze',   territory: 'East',    contact: 'Dir. Tara Adams',          email: 'tadams@communitychurch.org',       phone: '555-1042', totalOrders: 8,   lifetimeValue: 1900,  lastOrderDate: '2025-11-15', paymentTerms: 'Prepaid', creditLimit: 2500, assignedRepId: 'REP-010' },
  { id: 'CUST-043', name: 'Small Town Youth Sports',           type: 'AAU Club',          tier: 'Bronze',   territory: 'Central', contact: 'Dir. Vernon Keefe',        email: 'vkeefe@smalltownyouth.org',        phone: '555-1043', totalOrders: 11,  lifetimeValue: 2600,  lastOrderDate: '2026-01-09', paymentTerms: 'Prepaid', creditLimit: 3000, assignedRepId: 'REP-004' },
  { id: 'CUST-044', name: 'St. Michael Academy',               type: 'High School',       tier: 'Bronze',   territory: 'East',    contact: 'Coach Patrick O\'Neal',     email: 'poneal@stmichael.edu',             phone: '555-1044', totalOrders: 9,   lifetimeValue: 2100,  lastOrderDate: '2025-12-12', paymentTerms: 'Prepaid', creditLimit: 2500, assignedRepId: 'REP-006' },
  { id: 'CUST-045', name: 'Pinehurst Middle School',           type: 'Middle School',     tier: 'Bronze',   territory: 'North',   contact: 'Coach Valerie Knox',       email: 'vknox@pinehurstms.edu',            phone: '555-1045', totalOrders: 7,   lifetimeValue: 1600,  lastOrderDate: '2025-11-02', paymentTerms: 'Prepaid', creditLimit: 2000, assignedRepId: 'REP-007' },
  { id: 'CUST-046', name: 'Grand View YMCA',                   type: 'YMCA',              tier: 'Bronze',   territory: 'Central', contact: 'Dir. Charles Reeves',      email: 'creeves@grandviewymca.org',        phone: '555-1046', totalOrders: 10,  lifetimeValue: 2350,  lastOrderDate: '2025-12-28', paymentTerms: 'Prepaid', creditLimit: 3000, assignedRepId: 'REP-003' },
  { id: 'CUST-047', name: 'Baptist Men\'s League',              type: 'Church League',     tier: 'Bronze',   territory: 'East',    contact: 'Dir. Elder Marvin Knight', email: 'mknight@baptistmensleague.org',    phone: '555-1047', totalOrders: 6,   lifetimeValue: 1400,  lastOrderDate: '2025-10-18', paymentTerms: 'Prepaid', creditLimit: 1500, assignedRepId: 'REP-005' },
  { id: 'CUST-048', name: 'Riverbend AAU',                     type: 'AAU Club',          tier: 'Bronze',   territory: 'North',   contact: 'Dir. Nikki Harper',        email: 'nharper@riverbendaau.org',         phone: '555-1048', totalOrders: 13,  lifetimeValue: 2900,  lastOrderDate: '2026-02-05', paymentTerms: 'Prepaid', creditLimit: 3500, assignedRepId: 'REP-008' },
  { id: 'CUST-049', name: 'Creekside Rec',                     type: 'Rec Center',        tier: 'Bronze',   territory: 'West',    contact: 'Mgr. Roberto Salas',       email: 'rsalas@creeksiderec.gov',          phone: '555-1049', totalOrders: 8,   lifetimeValue: 1800,  lastOrderDate: '2025-12-04', paymentTerms: 'Prepaid', creditLimit: 2500, assignedRepId: 'REP-002' },
  { id: 'CUST-050', name: 'Fresh Start Sports',                type: 'Retail Reseller',   tier: 'Bronze',   territory: 'Central', contact: 'Owner Willow Nakamura',    email: 'willow@freshstartsports.com',      phone: '555-1050', totalOrders: 14,  lifetimeValue: 2950,  lastOrderDate: '2026-01-24', paymentTerms: 'Prepaid', creditLimit: 4000, assignedRepId: 'REP-003' },
];

export const getCustomer = (id: string) => customers.find((c) => c.id === id);
export const searchCustomers = (q: string) => {
  const ql = q.toLowerCase();
  return customers.filter((c) =>
    c.name.toLowerCase().includes(ql) ||
    c.contact.toLowerCase().includes(ql) ||
    c.territory.toLowerCase().includes(ql) ||
    c.type.toLowerCase().includes(ql),
  );
};
export const customersByTier = (tier: Tier) => customers.filter((c) => c.tier === tier);
export const customersByRep = (repId: string) => customers.filter((c) => c.assignedRepId === repId);
export const topCustomersByLTV = (n: number) => [...customers].sort((a, b) => b.lifetimeValue - a.lifetimeValue).slice(0, n);
