export interface SalesRep {
  id: string;
  name: string;
  email: string;
  phone: string;
  territory: 'West' | 'Central' | 'East' | 'North';
  hireDate: string;
  annualQuota: number;
  ytdSales: number;
  pipelineValue: number;
}

export const salesReps: SalesRep[] = [
  { id: 'REP-001', name: 'Sarah Sales',        email: 'sarah.sales@progear.demo',    phone: '555-3001', territory: 'West',    hireDate: '2021-04-12', annualQuota: 750000, ytdSales: 412300, pipelineValue: 168500 },
  { id: 'REP-002', name: 'Marcus Chen',        email: 'marcus.chen@progear.demo',    phone: '555-3002', territory: 'West',    hireDate: '2019-09-02', annualQuota: 900000, ytdSales: 623100, pipelineValue: 245000 },
  { id: 'REP-003', name: 'Priya Patel',        email: 'priya.patel@progear.demo',    phone: '555-3003', territory: 'Central', hireDate: '2020-01-22', annualQuota: 800000, ytdSales: 548900, pipelineValue: 192400 },
  { id: 'REP-004', name: 'Devon Walker',       email: 'devon.walker@progear.demo',   phone: '555-3004', territory: 'Central', hireDate: '2022-06-01', annualQuota: 650000, ytdSales: 287500, pipelineValue: 134700 },
  { id: 'REP-005', name: 'Angela Martinez',    email: 'angela.martinez@progear.demo',phone: '555-3005', territory: 'East',    hireDate: '2018-03-15', annualQuota: 950000, ytdSales: 712400, pipelineValue: 310200 },
  { id: 'REP-006', name: 'Tyler Brooks',       email: 'tyler.brooks@progear.demo',   phone: '555-3006', territory: 'East',    hireDate: '2023-02-14', annualQuota: 550000, ytdSales: 189300, pipelineValue: 98600 },
  { id: 'REP-007', name: 'Jordan Reyes',       email: 'jordan.reyes@progear.demo',   phone: '555-3007', territory: 'North',   hireDate: '2020-08-18', annualQuota: 725000, ytdSales: 478200, pipelineValue: 156800 },
  { id: 'REP-008', name: 'Lauren Kim',         email: 'lauren.kim@progear.demo',     phone: '555-3008', territory: 'North',   hireDate: '2021-11-05', annualQuota: 700000, ytdSales: 395000, pipelineValue: 142300 },
  { id: 'REP-009', name: 'Dimitri Volkov',     email: 'dimitri.volkov@progear.demo', phone: '555-3009', territory: 'West',    hireDate: '2022-03-28', annualQuota: 600000, ytdSales: 318700, pipelineValue: 121500 },
  { id: 'REP-010', name: 'Grace Thompson',     email: 'grace.thompson@progear.demo', phone: '555-3010', territory: 'East',    hireDate: '2019-05-20', annualQuota: 850000, ytdSales: 634500, pipelineValue: 218900 },
];

export const getRep = (id: string) => salesReps.find((r) => r.id === id);
