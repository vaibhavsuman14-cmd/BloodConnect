export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  bloodType: BloodType;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
  maxDistance: number;
  isAvailable: boolean;
  emergencyContact: boolean;
  lastDonation?: Date;
  donationCount: number;
  isVerified: boolean;
  type: 'user';
}

export interface Hospital {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationNumber: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactPerson: {
    name: string;
    designation: string;
    phone: string;
  };
  isVerified: boolean;
  services: string[];
  type: 'hospital';
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type Urgency = 'Low' | 'Medium' | 'High' | 'Critical';

export interface BloodRequest {
  _id: string;
  hospital: Hospital;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  bloodType: BloodType;
  unitsNeeded: number;
  urgency: Urgency;
  neededBy: Date;
  description: string;
  status: 'Active' | 'Partially Fulfilled' | 'Fulfilled' | 'Expired';
  matchedDonors: {
    donor: User;
    status: 'Notified' | 'Confirmed' | 'Donated' | 'Declined';
    notifiedAt: Date;
    respondedAt?: Date;
    donatedAt?: Date;
  }[];
  isEmergency: boolean;
  contactInfo: {
    phone: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    type: 'user' | 'hospital';
    bloodType?: BloodType;
    registrationNumber?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}