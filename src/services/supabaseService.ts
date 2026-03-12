import { supabase } from '../lib/supabase';
import { User, Group, Meal, Rating, Subscription } from '../types';

export const supabaseService = {
  // Profiles
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    if (error) throw error;
    return data;
  },

  // Circles
  async getCircle(circleId: string) {
    const { data, error } = await supabase
      .from('circles')
      .select('*, circle_members(*, profiles(*))')
      .eq('id', circleId)
      .single();
    if (error) throw error;
    return data;
  },

  // Meals
  async getMeals(circleId: string) {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('circle_id', circleId)
      .order('meal_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  async declareMenu(mealId: string, menu: string) {
    const { data, error } = await supabase
      .from('meals')
      .update({ menu, status: 'pending' })
      .eq('id', mealId);
    if (error) throw error;
    return data;
  },

  // Ratings
  async submitRating(rating: Omit<Rating, 'id'>) {
    const { data, error } = await supabase
      .from('ratings')
      .insert([rating]);
    if (error) throw error;
    return data;
  },

  // Subscriptions
  async getSubscription(profileId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', profileId)
      .single();
    if (error) throw error;
    return data;
  },

  // Matching & Schedule Helpers (RPC & Queries)
  async matchUsersToGroup(userId: string) {
    // This calls the SQL function we defined
    const { error } = await supabase.rpc('attempt_match', {
      target_user_id: userId,
    });
    if (error) throw error;
  },

  async getUserGroup(userId: string) {
    const { data, error } = await supabase
      .from('circle_members')
      .select('circle_id, circles(*)')
      .eq('profile_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found"
    return data;
  },

  async getUpcomingMeals(circleId: string) {
    const { data, error } = await supabase
      .from('meals')
      .select('*, profiles:chef_id(*)')
      .eq('circle_id', circleId)
      .gte('meal_date', new Date().toISOString().split('T')[0])
      .order('meal_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  async generateCookingSchedule(circleId: string) {
    // Note: In our current SQL trigger, this is automatic on group creation.
    // This helper could be used to manually regenerate or extend a cycle.
    // For now, we'll just fetch the existing one.
    return this.getUpcomingMeals(circleId);
  },

  // Performance & Ratings
  async submitMealRating(mealId: string, rating: number, comment?: string) {
    const { error } = await supabase.rpc('submit_meal_rating', {
      p_meal_id: mealId,
      p_rating: rating,
      p_comment: comment,
    });
    if (error) throw error;
  },

  async getChefRating(chefId: string, circleId: string) {
    const { data, error } = await supabase.rpc('get_chef_cycle_average', {
      p_chef_id: chefId,
      p_circle_id: circleId,
    });
    if (error) throw error;
    return data;
  },

  async getGroupRatings(circleId: string) {
    const { data, error } = await supabase
      .from('meal_ratings')
      .select('*, profiles:user_id(full_name)')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async flagLowPerformanceMembers(circleId: string) {
    const { data, error } = await supabase
      .from('circle_members')
      .select('*, profiles(*)')
      .eq('circle_id', circleId)
      .eq('is_flagged', true);
    if (error) throw error;
    return data;
  },

  async handleMissedMeal(mealId: string) {
    const { error } = await supabase.rpc('handle_missed_meal', {
      p_meal_id: mealId,
    });
    if (error) throw error;
  },

  // Meal Skips
  async toggleMealSkip(mealId: string) {
    const { data, error } = await supabase.rpc('toggle_meal_skip', {
      p_meal_id: mealId,
    });
    if (error) throw error;
    return data as boolean;
  },

  async getMealPortionCount(mealId: string) {
    const { data, error } = await supabase.rpc('get_meal_portion_count', {
      p_meal_id: mealId,
    });
    if (error) throw error;
    return data as number;
  },

  async getMealSkips(mealId: string) {
    const { data, error } = await supabase
      .from('meal_skips')
      .select('profile_id')
      .eq('meal_id', mealId);
    if (error) throw error;
    return data.map(s => s.profile_id);
  }
};
