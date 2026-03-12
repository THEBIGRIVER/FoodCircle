import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface User {
  id: string;
  name: string;
  pincode: string;
  familyMembers: number;
  preference: 'Vegetarian' | 'Non-vegetarian' | 'Vegan';
  groupSize: 7 | 14 | 21 | 28 | 35;
  rating: number;
  onboarded: boolean;
  groupId?: string;
  memberIndex?: number;
}

export interface Group {
  id: string;
  pincode: string;
  preference: string;
  size: number;
  members: string[]; // User IDs
  currentChefIndex: number;
  cycleStartDate: string;
}

export interface Meal {
  id: string;
  circleId: string;
  chefId: string;
  date: string;
  menu: string;
  status: 'pending' | 'cooking' | 'picked-up' | 'delivered';
}

export interface Rating {
  id: string;
  mealId: string;
  raterId: string;
  taste: number;
  hygiene: number;
  portion: number;
  comment?: string;
}

export interface Subscription {
  id: string;
  profileId: string;
  status: 'active' | 'past_due' | 'canceled';
  amount: number;
  nextBillingDate: string;
}

export const FOOD_PREFERENCES = ['Vegetarian', 'Non-vegetarian', 'Vegan'] as const;
export const GROUP_SIZES = [7, 14, 21, 28, 35] as const;

export const calculatePrice = (familyMembers: number, groupSize: number) => {
  return familyMembers * groupSize * 100;
};
