import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface User {
  id: string;
  name: string;
  pincode: string;
  familySize: number;
  foodType: 'Vegetarian' | 'Non-vegetarian' | 'Vegan';
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
  status: 'pending' | 'cooking' | 'picked-up' | 'delivered' | 'missed';
}

export interface Rating {
  id: string;
  userId: string;
  chefId: string;
  circleId: string;
  mealId: string;
  cookDate: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface PerformanceStats {
  chefId: string;
  averageRating: number;
  isFlagged: boolean;
  consecutiveLowRatings: number;
}

export interface MealSkip {
  id: string;
  mealId: string;
  profileId: string;
  createdAt: string;
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

export const calculatePrice = (familySize: number, groupSize: number) => {
  return familySize * groupSize * 100;
};
