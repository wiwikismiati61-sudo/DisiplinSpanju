
export type Page = 'dashboard' | 'master' | 'transaksi' | 'laporan';

export enum ViolationLevel {
  Ringan = 'Ringan',
  Sedang = 'Sedang',
  Berat = 'Berat',
}

export interface Student {
  id: string;
  name: string;
  class: string;
}

export interface Violation {
  id: string;
  name: string;
  level: ViolationLevel;
  points: number;
}

export interface Consequence {
  id: string;
  description: string;
  violationLevel: ViolationLevel;
}

export interface FollowUp {
  id: string;
  description: string;
}

export interface Transaction {
  id: string;
  date: string;
  time: string;
  studentId: string;
  studentName?: string;
  studentClass?: string;
  violationId: string;
  consequenceId?: string; // Field baru
  reason: string;
  homeroomTeacher: string;
  counselor: string;
  followUpId: string;
}

export interface HomeroomTeacher {
  id: string;
  name: string;
}

export interface Counselor {
  id: string;
  name: string;
}
