import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChefHat, 
  Users, 
  MapPin, 
  Calendar, 
  Truck, 
  Star, 
  User as UserIcon, 
  Home,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { cn } from './utils';
import { User, Group, Meal, calculatePrice, FOOD_PREFERENCES, GROUP_SIZES } from './types';
import { format, addDays, isSameDay } from 'date-fns';

// --- Mock Data Generators ---
const MOCK_USER: User = {
  id: 'user_1',
  name: 'Arijit Das',
  pincode: '700001',
  familyMembers: 4,
  preference: 'Vegetarian',
  groupSize: 7,
  rating: 4.8,
  onboarded: false,
};

const MOCK_MEAL: Meal = {
  id: 'meal_1',
  circleId: 'group_1',
  chefId: 'member_3',
  date: new Date().toISOString(),
  menu: 'Paneer Butter Masala, Jeera Rice & Dal Tadka',
  status: 'cooking',
};

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }) => {
  const variants = {
    primary: 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90',
    secondary: 'bg-secondary text-primary hover:bg-secondary/80',
    outline: 'border-2 border-primary text-primary hover:bg-primary/5',
    ghost: 'text-gray-500 hover:bg-gray-100',
  };

  return (
    <button 
      className={cn(
        'px-6 py-3 rounded-2xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('bg-surface rounded-3xl p-6 shadow-sm border border-black/5', className)}>
    {children}
  </div>
);

// --- Main App Flow ---

export default function App() {
  const [view, setView] = useState<'landing' | 'onboarding' | 'matching' | 'dashboard' | 'delivery' | 'rating' | 'profile' | 'schedule' | 'declare-menu'>('landing');
  const [user, setUser] = useState<User>(MOCK_USER);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [declaredMenu, setDeclaredMenu] = useState('');
  const [isMenuDeclared, setIsMenuDeclared] = useState(false);

  // Navigation Handler
  const navigate = (newView: typeof view) => {
    window.scrollTo(0, 0);
    setView(newView);
  };

  // --- Sub-Views ---

  const LandingPage = () => (
    <div className="min-h-screen flex flex-col p-6 bg-background">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/30 animate-float"
        >
          <ChefHat size={64} className="text-white" />
        </motion.div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tighter text-gray-900">
            FoodCircle
          </h1>
          <p className="text-lg text-gray-600 max-w-xs mx-auto">
            Neighbors cooking for neighbors. Fresh, home-made, delivered.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <Card className="flex flex-col items-center p-4 space-y-2">
            <Users className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider opacity-50">Circles</span>
            <span className="text-xl font-black">1.2k+</span>
          </Card>
          <Card className="flex flex-col items-center p-4 space-y-2">
            <Truck className="text-accent" />
            <span className="text-xs font-bold uppercase tracking-wider opacity-50">Meals</span>
            <span className="text-xl font-black">50k+</span>
          </Card>
        </div>
      </div>

      <div className="pb-8 space-y-4">
        <Button className="w-full py-5 text-xl" onClick={() => navigate('onboarding')}>
          Get Started <ArrowRight size={20} />
        </Button>
        <p className="text-center text-sm text-gray-400">
          Join the community of 5000+ home chefs
        </p>
      </div>
    </div>
  );

  const Onboarding = () => {
    const steps = [
      {
        title: "Where do you live?",
        description: "We match you with neighbors in your area.",
        component: (
          <div className="space-y-4">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Enter Pincode" 
                className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-lg font-medium"
                value={user.pincode}
                onChange={(e) => setUser({ ...user, pincode: e.target.value })}
              />
            </div>
          </div>
        )
      },
      {
        title: "Your Family",
        description: "How many members are we cooking for?",
        component: (
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <button
                key={num}
                onClick={() => setUser({ ...user, familyMembers: num })}
                className={cn(
                  "py-4 rounded-2xl font-bold text-xl transition-all",
                  user.familyMembers === num ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                )}
              >
                {num}
              </button>
            ))}
          </div>
        )
      },
      {
        title: "Food Preference",
        description: "We'll match you with a group that shares your taste.",
        component: (
          <div className="space-y-3">
            {FOOD_PREFERENCES.map(pref => (
              <button
                key={pref}
                onClick={() => setUser({ ...user, preference: pref })}
                className={cn(
                  "w-full p-5 rounded-2xl font-bold text-left flex items-center justify-between transition-all",
                  user.preference === pref ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                )}
              >
                {pref}
                {user.preference === pref && <CheckCircle2 size={20} />}
              </button>
            ))}
          </div>
        )
      },
      {
        title: "Circle Size",
        description: "Choose how many families you want in your circle.",
        component: (
          <div className="space-y-3">
            {GROUP_SIZES.map(size => (
              <button
                key={size}
                onClick={() => setUser({ ...user, groupSize: size })}
                className={cn(
                  "w-full p-5 rounded-2xl font-bold text-left flex items-center justify-between transition-all",
                  user.groupSize === size ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                )}
              >
                <div>
                  <div className="text-lg">{size} Members</div>
                  <div className={cn("text-xs opacity-60", user.groupSize === size ? "text-white" : "text-gray-500")}>
                    Cook once every {size} days
                  </div>
                </div>
                {user.groupSize === size && <CheckCircle2 size={20} />}
              </button>
            ))}
          </div>
        )
      },
      {
        title: "Membership Plan",
        description: "Simple monthly subscription for logistics and matching.",
        component: (
          <Card className="bg-primary text-white space-y-6">
            <div className="space-y-1">
              <div className="text-sm font-bold uppercase tracking-widest opacity-70">Monthly Total</div>
              <div className="text-5xl font-black">₹{calculatePrice(user.familyMembers, user.groupSize)}</div>
            </div>
            <div className="space-y-3 pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm">
                <span>Family Members</span>
                <span>{user.familyMembers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Circle Size</span>
                <span>{user.groupSize}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Base Rate</span>
                <span>₹100 / member</span>
              </div>
            </div>
          </Card>
        )
      }
    ];

    const handleNext = () => {
      if (onboardingStep < steps.length - 1) {
        setOnboardingStep(onboardingStep + 1);
      } else {
        navigate('matching');
      }
    };

    return (
      <div className="min-h-screen flex flex-col p-6 bg-background">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => onboardingStep > 0 ? setOnboardingStep(onboardingStep - 1) : navigate('landing')}>
            <ArrowLeft className="text-gray-400" />
          </button>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={cn("h-1.5 rounded-full transition-all", i <= onboardingStep ? "w-6 bg-primary" : "w-2 bg-gray-200")} />
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <h2 className="text-3xl font-black text-gray-900">{steps[onboardingStep].title}</h2>
          <p className="text-gray-500 mb-8">{steps[onboardingStep].description}</p>
          <motion.div
            key={onboardingStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
          >
            {steps[onboardingStep].component}
          </motion.div>
        </div>

        <div className="pt-8">
          <Button className="w-full py-5" onClick={handleNext}>
            {onboardingStep === steps.length - 1 ? 'Pay & Join Circle' : 'Continue'}
          </Button>
        </div>
      </div>
    );
  };

  const MatchingScreen = () => {
    useEffect(() => {
      const timer = setTimeout(() => navigate('dashboard'), 3000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-primary text-white text-center">
        <div className="relative mb-12">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-48 h-48 border-4 border-dashed border-white/30 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Users size={48} className="animate-pulse" />
          </div>
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0], x: [0, (i % 2 ? 80 : -80)], y: [0, (i < 2 ? 80 : -80)] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              className="absolute top-1/2 left-1/2 w-4 h-4 bg-secondary rounded-full"
            />
          ))}
        </div>
        <h2 className="text-3xl font-black mb-4">Finding your Circle...</h2>
        <p className="opacity-80 max-w-xs">Matching you with neighbors in {user.pincode} with {user.preference} preference.</p>
      </div>
    );
  };

  const Dashboard = () => (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Circle #829</h1>
          <div className="flex items-center gap-1 text-sm text-gray-500 font-medium">
            <MapPin size={14} /> {user.pincode} • {user.preference}
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary font-bold">
          AD
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Today's Chef Card */}
        <Card className="bg-gradient-to-br from-primary to-accent text-white border-none overflow-hidden relative">
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Today's Chef
              </div>
              <div className="text-xs opacity-80">Cycle Day 3/7</div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-black">Member #3</h3>
              <p className="text-sm opacity-90 leading-relaxed">
                {MOCK_MEAL.menu}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Truck size={16} />
                </div>
                <span className="text-sm font-bold">Out for delivery</span>
              </div>
              <Button 
                variant="secondary" 
                className="px-4 py-2 text-xs rounded-xl"
                onClick={() => navigate('delivery')}
              >
                Track
              </Button>
            </div>
          </div>
          <ChefHat size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 flex flex-col justify-between h-32">
            <Calendar className="text-primary" size={20} />
            <div>
              <div className="text-[10px] font-bold uppercase opacity-50">Your Turn</div>
              <div className="text-lg font-black">In 1 Day</div>
            </div>
          </Card>
          <Card className="p-4 flex flex-col justify-between h-32">
            <Star className="text-yellow-500" size={20} />
            <div>
              <div className="text-[10px] font-bold uppercase opacity-50">Chef Rating</div>
              <div className="text-lg font-black">4.8 / 5.0</div>
            </div>
          </Card>
        </div>

        {/* Menu Declaration Reminder */}
        {!isMenuDeclared && (
          <Card className="bg-secondary/10 border-dashed border-2 border-secondary p-6 space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <AlertCircle size={24} />
              <h3 className="font-black">Menu Declaration Required</h3>
            </div>
            <p className="text-sm text-gray-600">
              Your cooking turn is tomorrow! Please declare your menu today as per community rules.
            </p>
            <Button className="w-full" onClick={() => navigate('declare-menu')}>
              Declare Menu Now
            </Button>
          </Card>
        )}

        {isMenuDeclared && (
          <Card className="bg-green-50 border-green-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-sm font-bold text-green-800">Menu Declared!</div>
              <div className="text-xs text-green-600 truncate max-w-[200px]">{declaredMenu}</div>
            </div>
          </Card>
        )}

        {/* Menu Announcement */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900">Announcements</h3>
            <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
          </div>
          <Card className="p-4 bg-secondary/20 border-secondary/30 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="text-sm font-bold">Tomorrow's Menu</div>
              <p className="text-xs text-gray-600">Member #4 will be cooking "Home-style Chicken Curry & Paratha". Get ready!</p>
            </div>
          </Card>
        </div>

        {/* Leaderboard Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900">Top Chefs</h3>
            <button className="text-xs font-bold text-primary">View All</button>
          </div>
          <div className="space-y-3">
            {[
              { id: 5, name: 'Member #5', rating: 4.9, meals: 12 },
              { id: 2, name: 'Member #2', rating: 4.8, meals: 15 },
              { id: 1, name: 'Member #1', rating: 4.7, meals: 10 },
            ].map((chef, i) => (
              <div key={chef.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{chef.name}</div>
                    <div className="text-[10px] text-gray-400">{chef.meals} Meals Shared</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-black text-yellow-600">
                  <Star size={12} fill="currentColor" /> {chef.rating}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-black/5 flex items-center justify-around px-6 bottom-nav-shadow z-50">
        <button onClick={() => navigate('dashboard')} className={cn("p-2", view === 'dashboard' ? "text-primary" : "text-gray-400")}>
          <Home size={24} />
        </button>
        <button onClick={() => navigate('schedule')} className={cn("p-2", view === 'schedule' ? "text-primary" : "text-gray-400")}>
          <Calendar size={24} />
        </button>
        <div className="relative -top-6">
          <button className="w-14 h-14 bg-primary rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center text-white">
            <Plus size={28} />
          </button>
        </div>
        <button onClick={() => navigate('rating')} className={cn("p-2", view === 'rating' ? "text-primary" : "text-gray-400")}>
          <Star size={24} />
        </button>
        <button onClick={() => navigate('profile')} className={cn("p-2", view === 'profile' ? "text-primary" : "text-gray-400")}>
          <UserIcon size={24} />
        </button>
      </div>
    </div>
  );

  const DeliveryTracking = () => (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('dashboard')} className="p-2 bg-white rounded-xl shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black">Track Delivery</h2>
      </div>

      <Card className="p-0 overflow-hidden h-64 relative bg-gray-200">
        {/* Mock Map */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full bg-[url('https://picsum.photos/seed/map/800/600')] bg-cover opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-primary"
            >
              <Truck size={40} fill="currentColor" />
            </motion.div>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary">
            <Truck size={24} />
          </div>
          <div>
            <div className="text-lg font-black">Rider is 5 mins away</div>
            <div className="text-sm text-gray-500">Delivering to Member #4 (Next stop: You)</div>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { time: '12:30 PM', status: 'Food picked up from Chef (Member #3)', done: true },
            { time: '12:45 PM', status: 'Delivered to Member #1', done: true },
            { time: '12:55 PM', status: 'Delivered to Member #2', done: true },
            { time: '01:05 PM', status: 'Out for delivery to your location', done: false },
          ].map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={cn("w-3 h-3 rounded-full", step.done ? "bg-primary" : "bg-gray-200")} />
                {i < 3 && <div className="w-0.5 h-full bg-gray-100" />}
              </div>
              <div className="pb-4">
                <div className={cn("text-xs font-bold", step.done ? "text-primary" : "text-gray-400")}>{step.time}</div>
                <div className={cn("text-sm", step.done ? "text-gray-900 font-medium" : "text-gray-400")}>{step.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const RatingScreen = () => {
    const [ratings, setRatings] = useState({ taste: 0, hygiene: 0, portion: 0 });

    return (
      <div className="min-h-screen bg-background p-6 flex flex-col">
        <div className="flex-1 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black">Rate Today's Meal</h2>
            <p className="text-gray-500">Your feedback helps Member #3 improve!</p>
          </div>

          <Card className="space-y-8">
            {['taste', 'hygiene', 'portion'].map((category) => (
              <div key={category} className="space-y-3">
                <div className="text-sm font-bold uppercase tracking-widest opacity-50 text-center">{category}</div>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      onClick={() => setRatings({ ...ratings, [category]: star })}
                      className="p-1"
                    >
                      <Star 
                        size={32} 
                        className={cn(
                          "transition-all",
                          ratings[category as keyof typeof ratings] >= star ? "text-yellow-500 fill-yellow-500" : "text-gray-200"
                        )} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Card>

          <div className="bg-accent/10 p-4 rounded-2xl flex gap-3 text-accent">
            <AlertCircle className="shrink-0" />
            <p className="text-xs font-medium leading-relaxed">
              Low ratings (below 20% average) result in chef warnings. Please be honest and fair.
            </p>
          </div>
        </div>

        <div className="pt-8">
          <Button className="w-full py-5" onClick={() => navigate('dashboard')}>
            Submit Review
          </Button>
        </div>
      </div>
    );
  };

  const DeclareMenuScreen = () => {
    const [menu, setMenu] = useState('');

    const handleSubmit = () => {
      if (menu.trim()) {
        setDeclaredMenu(menu);
        setIsMenuDeclared(true);
        navigate('dashboard');
      }
    };

    return (
      <div className="min-h-screen bg-background p-6 flex flex-col">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('dashboard')} className="p-2 bg-white rounded-xl shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-black">Declare Menu</h2>
        </div>

        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest opacity-50">What are you cooking tomorrow?</label>
            <textarea 
              className="w-full h-48 p-6 bg-white rounded-3xl border border-black/5 focus:ring-2 focus:ring-primary outline-none text-lg resize-none"
              placeholder="e.g. Butter Chicken, Garlic Naan & Salad..."
              value={menu}
              onChange={(e) => setMenu(e.target.value)}
            />
          </div>

          <div className="bg-primary/5 p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold">
              <ChefHat size={20} />
              <span>Chef Tips</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
              <li>Keep it simple and nutritious</li>
              <li>Mention any common allergens</li>
              <li>Ensure portion size matches circle size ({user.groupSize})</li>
            </ul>
          </div>
        </div>

        <div className="pt-8">
          <Button className="w-full py-5" onClick={handleSubmit} disabled={!menu.trim()}>
            Confirm Menu
          </Button>
        </div>
      </div>
    );
  };

  const ScheduleScreen = () => {
    const today = new Date();
    const schedule = Array.from({ length: 14 }).map((_, i) => {
      const date = addDays(today, i - 2);
      const isUser = (i % 7) + 1 === 4;
      const isTomorrow = i === 3; // Today is i=2, Tomorrow is i=3
      
      return {
        date,
        chef: `Member #${(i % 7) + 1}`,
        isUser,
        menu: isUser && isMenuDeclared ? declaredMenu : (i === 2 ? MOCK_MEAL.menu : 'Menu will be announced soon')
      };
    });

    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="p-6">
          <h2 className="text-3xl font-black mb-6">Cooking Schedule</h2>
          <div className="space-y-4">
            {schedule.map((item, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-4 rounded-3xl flex items-center gap-4 border transition-all",
                  isSameDay(item.date, today) ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white border-black/5",
                  item.isUser && !isSameDay(item.date, today) ? "border-primary/30 bg-primary/5" : ""
                )}
              >
                <div className="text-center w-12 shrink-0">
                  <div className="text-[10px] font-bold uppercase opacity-60">{format(item.date, 'EEE')}</div>
                  <div className="text-xl font-black">{format(item.date, 'dd')}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{item.isUser ? 'Your Turn' : item.chef}</span>
                    {item.isUser && <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
                  </div>
                  <div className="text-xs opacity-70 truncate max-w-[200px]">{item.menu}</div>
                </div>
                {isSameDay(item.date, today) && (
                  <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">Today</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-black/5 flex items-center justify-around px-6 bottom-nav-shadow z-50">
          <button onClick={() => navigate('dashboard')} className="p-2 text-gray-400">
            <Home size={24} />
          </button>
          <button onClick={() => navigate('schedule')} className="p-2 text-primary">
            <Calendar size={24} />
          </button>
          <div className="relative -top-6">
            <button className="w-14 h-14 bg-primary rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center text-white">
              <Plus size={28} />
            </button>
          </div>
          <button onClick={() => navigate('rating')} className="p-2 text-gray-400">
            <Star size={24} />
          </button>
          <button onClick={() => navigate('profile')} className="p-2 text-gray-400">
            <UserIcon size={24} />
          </button>
        </div>
      </div>
    );
  };

  const ProfileScreen = () => (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-6 space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary/20">
            AD
          </div>
          <div>
            <h2 className="text-2xl font-black">{user.name}</h2>
            <p className="text-gray-500">Circle #829 • {user.pincode}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-2xl border border-black/5">
            <div className="text-xl font-black">12</div>
            <div className="text-[10px] font-bold uppercase opacity-50">Meals</div>
          </div>
          <div className="text-center p-4 bg-white rounded-2xl border border-black/5">
            <div className="text-xl font-black">4.8</div>
            <div className="text-[10px] font-bold uppercase opacity-50">Rating</div>
          </div>
          <div className="text-center p-4 bg-white rounded-2xl border border-black/5">
            <div className="text-xl font-black">0</div>
            <div className="text-[10px] font-bold uppercase opacity-50">Missed</div>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { icon: <Users size={20} />, label: 'Circle Settings', value: '7 Members' },
            { icon: <MapPin size={20} />, label: 'Delivery Address', value: 'Hidden for Privacy' },
            { icon: <ChefHat size={20} />, label: 'Dietary Preference', value: user.preference },
            { icon: <Truck size={20} />, label: 'Subscription', value: 'Active' },
          ].map((item, i) => (
            <button key={i} className="w-full p-5 bg-white rounded-2xl border border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-primary">{item.icon}</div>
                <div className="text-left">
                  <div className="text-xs font-bold uppercase opacity-40">{item.label}</div>
                  <div className="font-bold">{item.value}</div>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>

        <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent/5" onClick={() => navigate('landing')}>
          Logout
        </Button>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-black/5 flex items-center justify-around px-6 bottom-nav-shadow z-50">
        <button onClick={() => navigate('dashboard')} className="p-2 text-gray-400">
          <Home size={24} />
        </button>
        <button onClick={() => navigate('schedule')} className="p-2 text-gray-400">
          <Calendar size={24} />
        </button>
        <div className="relative -top-6">
          <button className="w-14 h-14 bg-primary rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center text-white">
            <Plus size={28} />
          </button>
        </div>
        <button onClick={() => navigate('rating')} className="p-2 text-gray-400">
          <Star size={24} />
        </button>
        <button onClick={() => navigate('profile')} className="p-2 text-primary">
          <UserIcon size={24} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen relative shadow-2xl overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LandingPage />
          </motion.div>
        )}
        {view === 'onboarding' && (
          <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Onboarding />
          </motion.div>
        )}
        {view === 'matching' && (
          <motion.div key="matching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MatchingScreen />
          </motion.div>
        )}
        {view === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Dashboard />
          </motion.div>
        )}
        {view === 'delivery' && (
          <motion.div key="delivery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DeliveryTracking />
          </motion.div>
        )}
        {view === 'rating' && (
          <motion.div key="rating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RatingScreen />
          </motion.div>
        )}
        {view === 'schedule' && (
          <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ScheduleScreen />
          </motion.div>
        )}
        {view === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfileScreen />
          </motion.div>
        )}
        {view === 'declare-menu' && (
          <motion.div key="declare-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DeclareMenuScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
