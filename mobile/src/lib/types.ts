export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Patient {
  id: string;
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  color: string;
  weight: number;
  ownerId: string;
}

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  reason: string;
  patient: { id: string; name: string };
  veterinarian: { id: string; name: string };
}

export interface Invoice {
  id: string;
  number: string;
  createdAt: string;
  total: number;
  status: string;
  paymentStatus: string;
}

export interface Message {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  sender: "clinic" | "owner";
  read: boolean;
}

export interface PortalSession {
  jwt: string;
  owner: Owner;
}
