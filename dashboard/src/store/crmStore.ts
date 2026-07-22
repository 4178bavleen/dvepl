import { create } from 'zustand';
import { Customer, ContactPerson, CommunicationHistory } from '../types/erp';
import { initialCustomers, initialContactPersons, initialCommunicationHistories } from '../constants';

interface CRMStore {
  customers: Customer[];
  contactPersons: ContactPerson[];
  communicationHistories: CommunicationHistory[];
  salesOrders: any[];

  setCustomers: (customers: Customer[]) => void;
  setContactPersons: (contacts: ContactPerson[]) => void;
  setCommunicationHistories: (histories: CommunicationHistory[]) => void;
  setSalesOrders: (orders: any[]) => void;
}

export const useCRMStore = create<CRMStore>((set) => ({
  customers: initialCustomers,
  contactPersons: initialContactPersons,
  communicationHistories: initialCommunicationHistories,
  salesOrders: [],

  setCustomers: (customers) => set({ customers }),
  setContactPersons: (contactPersons) => set({ contactPersons }),
  setCommunicationHistories: (communicationHistories) => set({ communicationHistories }),
  setSalesOrders: (salesOrders) => set({ salesOrders }),
}));
