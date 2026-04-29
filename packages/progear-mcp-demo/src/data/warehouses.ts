export interface Warehouse {
  id: string;
  name: string;
  city: string;
  state: string;
  territory: 'West' | 'Central' | 'East' | 'North';
  capacityUnits: number;
}

export const warehouses: Warehouse[] = [
  { id: 'WH-WEST',    name: 'West Coast Distribution',  city: 'Los Angeles',  state: 'CA', territory: 'West',    capacityUnits: 250000 },
  { id: 'WH-CENTRAL', name: 'Central Hub',              city: 'Dallas',       state: 'TX', territory: 'Central', capacityUnits: 300000 },
  { id: 'WH-EAST',    name: 'Eastern Fulfillment',      city: 'Atlanta',      state: 'GA', territory: 'East',    capacityUnits: 225000 },
  { id: 'WH-NORTH',   name: 'North Regional',           city: 'Chicago',      state: 'IL', territory: 'North',   capacityUnits: 175000 },
];

export const getWarehouse = (id: string) => warehouses.find((w) => w.id === id);
