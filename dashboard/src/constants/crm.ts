import { 
  Customer, 
  ContactPerson, 
  CommunicationHistory, 
  CommunicationType 
} from '../types/erp';

export const initialCustomers: Customer[] = [
  { 
    id: 'cust-1', 
    companyId: 'comp-1', 
    name: 'Indian Railways (CR)', 
    gst: '27RAILW1234A1Z0', 
    pan: 'RAILW1234A', 
    billingAddress: 'Central Railway HQ, CST Mumbai', 
    shippingAddress: 'Rail Depot, Kalyan', 
    paymentTerms: 'Net 45 Days', 
    firmName: 'Indian Railways Central Division', 
    isGovernment: true, 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'cust-2', 
    companyId: 'comp-1', 
    name: 'Larsen & Toubro Ltd', 
    gst: '27LARTON5678B1Z1', 
    pan: 'LARTON5678B', 
    billingAddress: 'L&T House, Ballard Estate, Mumbai', 
    shippingAddress: 'L&T Pipeline Project site, Hazira', 
    paymentTerms: 'Net 30 Days', 
    firmName: 'L&T Heavy Engineering', 
    isGovernment: false, 
    isActive: true, 
    createdAt: new Date(2025, 1, 1).toISOString(), 
    updatedAt: new Date(2025, 1, 1).toISOString() 
  },
  { 
    id: 'cust-3', 
    companyId: 'comp-1', 
    name: 'Oil and Natural Gas Corporation (ONGC)', 
    gst: '27ONGCC0000C1Z2', 
    pan: 'ONGCC0000C', 
    billingAddress: 'ONGC Dehradun HQ', 
    shippingAddress: 'ONGC Uran Plant, Navi Mumbai', 
    paymentTerms: 'Net 60 Days', 
    firmName: 'ONGC India', 
    isGovernment: true, 
    isActive: true, 
    createdAt: new Date(2025, 2, 1).toISOString(), 
    updatedAt: new Date(2025, 2, 1).toISOString() 
  }
];

export const initialContactPersons: ContactPerson[] = [
  { 
    id: 'cp-1', 
    customerId: 'cust-1', 
    name: 'Shri A.K. Mohanty', 
    designation: 'Chief Engineer - Procurement', 
    phone: '+91 22 2262 0000', 
    email: 'ak.mohanty@cr.railnet.gov.in', 
    isPrimary: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'cp-2', 
    customerId: 'cust-2', 
    name: 'Mr. Vikram Aditya', 
    designation: 'Senior Supply Chain Manager', 
    phone: '+91 99000 11223', 
    email: 'vikram.aditya@larsentoubro.com', 
    isPrimary: true, 
    createdAt: new Date(2025, 1, 1).toISOString(), 
    updatedAt: new Date(2025, 1, 1).toISOString() 
  }
];

export const initialCommunicationHistories: CommunicationHistory[] = [
  { 
    id: 'ch-1', 
    customerId: 'cust-1', 
    userId: 'user-3', 
    type: CommunicationType.CALL, 
    subject: 'Review of Valve Specs for Central Railways Bid', 
    content: 'Called Mohanty regarding specific pressure thresholds for the high-temperature gate valves. Spec sheets to be updated.', 
    createdAt: new Date(2026, 6, 10).toISOString() 
  },
  { 
    id: 'ch-2', 
    customerId: 'cust-2', 
    userId: 'user-3', 
    type: CommunicationType.EMAIL, 
    subject: 'Follow up on Pipeline Tender RFP', 
    content: 'Sent email containing initial quotation and product brochure for triple-offset butterfly valves.', 
    createdAt: new Date(2026, 6, 11).toISOString() 
  }
];
