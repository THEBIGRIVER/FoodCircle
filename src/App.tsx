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
  ArrowLeft,
  Settings,
  Search,
  ShoppingBag,
  Clock,
  Map as MapIcon,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { cn } from './utils';
import { User, Group, Meal, calculatePrice, FOOD_PREFERENCES, GROUP_SIZES } from './types';
import { format, addDays, isSameDay } from 'date-fns';

// --- Mock Data Generators ---
const MOCK_USER: User = {
  id: 'user_1',
  name: 'John',
  pincode: '700001',
  familySize: 4,
  foodType: 'Vegetarian',
  groupSize: 7,
  rating: 4.8,
  onboarded: true,
};

const MOCK_DISHES = [
  {
    id: 'd1',
    name: 'Lemon Herb Salmon Salad',
    time: '25-35 min',
    rating: '4.8 (120+)',
    price: 'Free',
    image: 'https://picsum.photos/seed/salad/600/400',
    category: 'Healthy'
  },
  {
    id: 'd2',
    name: 'Delicious Pie With Chocolate',
    time: '15-25 min',
    rating: '4.9 (80+)',
    price: 'Free',
    image: 'https://picsum.photos/seed/pie/600/400',
    category: 'Sweets'
  },
  {
    id: 'd3',
    name: 'Spicy Chicken Curry',
    time: '30-45 min',
    rating: '4.7 (200+)',
    price: 'Free',
    image: 'https://picsum.photos/seed/curry/600/400',
    category: 'Main'
  }
];

const MOCK_MEAL: Meal = {
  id: 'meal_1',
  circleId: 'group_1',
  chefId: 'member_3',
  date: new Date().toISOString(),
  menu: 'Delicious Pie With Chocolate',
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
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-12"
        >
          <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20 mx-auto mb-8">
            <ChefHat size={48} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-black mb-4">
            ChefCircle
          </h1>
          <p className="text-xl text-gray-600 max-w-xs mx-auto font-medium">
            share food share love
          </p>
        </motion.div>

        <div className="w-full max-w-sm space-y-4">
          <div className="flex items-center gap-4 p-4 bg-surface rounded-2xl">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Users className="text-primary" size={24} />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">Community Driven</div>
              <div className="text-xs text-gray-500">1,200+ Active Circles</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-surface rounded-2xl">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Truck className="text-primary" size={24} />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">Daily Delivery</div>
              <div className="text-xs text-gray-500">Fresh to your doorstep</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-4">
        <Button className="w-full py-4 text-lg rounded-xl bg-black hover:bg-gray-900" onClick={() => navigate('onboarding')}>
          Get Started
        </Button>
        <p className="text-center text-sm text-gray-400 font-medium">
          Eat healthy, support neighbors.
        </p>
      </div>
    </div>
  );

  const Onboarding = () => {
    const steps = [
      {
        title: "Where do you live?",
        description: "We match you with neighbors in your area.",
        id: "pincode"
      },
      {
        title: "Your Family",
        description: "How many members are we cooking for?",
        id: "familySize"
      },
      {
        title: "Food Preference",
        description: "We'll match you with a group that shares your taste.",
        id: "foodType"
      },
      {
        title: "Circle Size",
        description: "Choose how many families you want in your circle.",
        id: "groupSize"
      },
      {
        title: "Membership Plan",
        description: "Simple monthly subscription for logistics and matching.",
        id: "plan"
      }
    ];

    const isStepValid = () => {
      switch (onboardingStep) {
        case 0: return user.pincode.length === 6;
        case 1: return user.familySize > 0;
        case 2: return !!user.foodType;
        case 3: return !!user.groupSize;
        default: return true;
      }
    };

    const handleNext = () => {
      if (!isStepValid()) return;
      if (onboardingStep < steps.length - 1) {
        setOnboardingStep(onboardingStep + 1);
      } else {
        navigate('matching');
      }
    };

    const renderStepContent = () => {
      switch (onboardingStep) {
        case 0:
          return (
            <div className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter 6-digit Pincode" 
                  className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-lg font-medium"
                  value={user.pincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setUser({ ...user, pincode: val });
                  }}
                  autoFocus
                />
              </div>
              {user.pincode.length > 0 && user.pincode.length < 6 && (
                <p className="text-xs text-primary font-medium px-2">Please enter a valid 6-digit pincode</p>
              )}
            </div>
          );
        case 1:
          return (
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <button
                  key={num}
                  onClick={() => setUser({ ...user, familySize: num })}
                  className={cn(
                    "py-4 rounded-2xl font-bold text-xl transition-all",
                    user.familySize === num ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          );
        case 2:
          return (
            <div className="space-y-3">
              {FOOD_PREFERENCES.map(pref => (
                <button
                  key={pref}
                  onClick={() => setUser({ ...user, foodType: pref })}
                  className={cn(
                    "w-full p-5 rounded-2xl font-bold text-left flex items-center justify-between transition-all",
                    user.foodType === pref ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {pref}
                  {user.foodType === pref && <CheckCircle2 size={20} />}
                </button>
              ))}
            </div>
          );
        case 3:
          return (
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
          );
        case 4:
          return (
            <Card className="bg-primary text-white space-y-6">
              <div className="space-y-1">
                <div className="text-sm font-bold uppercase tracking-widest opacity-70">Monthly Total</div>
                <div className="text-5xl font-black">₹{calculatePrice(user.familySize, user.groupSize)}</div>
              </div>
              <div className="space-y-3 pt-4 border-t border-white/20">
                <div className="flex justify-between text-sm">
                  <span>Family Members</span>
                  <span>{user.familySize}</span>
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
          );
        default:
          return null;
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
            {renderStepContent()}
          </motion.div>
        </div>

        <div className="pt-8">
          <Button className="w-full py-5" onClick={handleNext} disabled={!isStepValid()}>
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
        <p className="opacity-80 max-w-xs">Matching you with neighbors in {user.pincode} with {user.foodType} preference.</p>
      </div>
    );
  };

  const Dashboard = () => (
    <div className="min-h-screen pb-32 bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            <span className="font-bold text-sm">{user.pincode} • Now</span>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
          <button className="w-10 h-10 bg-surface rounded-full flex items-center justify-center">
            <ShoppingBag size={20} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search for dishes or circles" 
            className="w-full pl-12 pr-4 py-3 bg-surface rounded-full text-sm font-medium focus:outline-none"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-4 overflow-x-auto px-6 py-6 no-scrollbar">
        {['All', 'Healthy', 'Sweets', 'Main', 'Breakfast', 'Vegan'].map((cat) => (
          <button 
            key={cat}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
              cat === 'All' ? "bg-black text-white" : "bg-surface text-gray-600 hover:bg-gray-200"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Dishes */}
      <div className="px-6 space-y-8">
        <div className="space-y-6">
          {MOCK_DISHES.map((dish) => (
            <motion.div
              key={dish.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('delivery')}
              className="space-y-3 cursor-pointer group"
            >
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-sm">
                <img 
                  src={dish.image} 
                  alt={dish.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  {dish.time}
                </div>
                <button className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-primary">
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-black">{dish.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <span className="text-black font-bold">★ {dish.rating}</span>
                    <span>•</span>
                    <span>{dish.category}</span>
                    <span>•</span>
                    <span className="text-primary font-bold">{dish.price}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* My Circle Section */}
        <div className="pt-4 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Your Circle</h3>
            <button className="text-primary font-bold text-sm">View All</button>
          </div>
          <Card className="bg-surface border-none p-4 flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Users className="text-primary" size={32} />
            </div>
            <div className="flex-1">
              <div className="font-bold">Circle #829</div>
              <div className="text-sm text-gray-500">7 Members • Next turn in 3 days</div>
            </div>
            <ChevronRight className="text-gray-300" />
          </Card>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-around z-50">
        <button onClick={() => navigate('dashboard')} className={cn("flex flex-col items-center gap-1", view === 'dashboard' ? "text-black" : "text-gray-400")}>
          <Home size={24} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <Search size={24} />
          <span className="text-[10px] font-bold">Search</span>
        </button>
        <button onClick={() => navigate('schedule')} className={cn("flex flex-col items-center gap-1", view === 'schedule' ? "text-black" : "text-gray-400")}>
          <Calendar size={24} />
          <span className="text-[10px] font-bold">Schedule</span>
        </button>
        <button onClick={() => navigate('profile')} className={cn("flex flex-col items-center gap-1", view === 'profile' ? "text-black" : "text-gray-400")}>
          <UserIcon size={24} />
          <span className="text-[10px] font-bold">Account</span>
        </button>
      </div>
    </div>
  );

  const DeliveryTracking = () => (
    <div className="min-h-screen bg-white pb-12">
      {/* Map Header */}
      <div className="h-64 bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/800/600')] bg-cover bg-center opacity-40 grayscale" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <MapPin size={24} className="text-white" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary/20 rounded-full blur-sm" />
          </div>
        </div>
        <button 
          onClick={() => navigate('dashboard')}
          className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="px-6 -mt-8 relative z-10">
        <Card className="bg-white shadow-xl border-none p-6 rounded-3xl space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Arriving in 15 min</h2>
              <p className="text-sm text-gray-500 font-medium">Your neighbor is preparing your meal</p>
            </div>
            <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-primary">
              <Clock size={24} />
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-primary rounded-full" />
            <div className="flex-1 h-2 bg-primary rounded-full" />
            <div className="flex-1 h-2 bg-gray-100 rounded-full" />
            <div className="flex-1 h-2 bg-gray-100 rounded-full" />
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
              <img src="https://picsum.photos/seed/chef/100" alt="Chef" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-400 font-bold uppercase">Your Chef</div>
              <div className="font-bold">Lidia Bastianich</div>
              <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
                <Star size={12} fill="currentColor" /> 4.9 (240 reviews)
              </div>
            </div>
            <button className="w-10 h-10 bg-surface rounded-full flex items-center justify-center">
              <ShoppingBag size={20} />
            </button>
          </div>
        </Card>

        {/* Order Details */}
        <div className="mt-8 space-y-6">
          <h3 className="text-xl font-bold">Order Details</h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm">
              <img src="https://picsum.photos/seed/pie/200" alt="Pie" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <div className="font-bold">Delicious Pie With Chocolate</div>
              <div className="text-sm text-gray-500">1x Large Portion</div>
              <div className="text-primary font-bold text-sm mt-1">Free • Circle Member</div>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-500">Delivery Address</span>
              <span className="text-black">123 Neighbor St, {user.pincode}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-500">Order Number</span>
              <span className="text-black">#FC-9283</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const RatingScreen = () => {
    const [ratings, setRatings] = useState({ taste: 0, hygiene: 0, portion: 0 });

    return (
      <div className="min-h-screen bg-white p-6 flex flex-col">
        <div className="flex-1 space-y-12 pt-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center text-primary mx-auto">
              <Star size={40} fill="currentColor" />
            </div>
            <h2 className="text-3xl font-bold">Rate the meal</h2>
            <p className="text-gray-500 font-medium">How was the food from Circle #829?</p>
          </div>

          <div className="space-y-10">
            {['taste', 'hygiene', 'portion'].map((category) => (
              <div key={category} className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 text-center">{category}</div>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      onClick={() => setRatings({ ...ratings, [category]: star })}
                      className="transition-transform active:scale-90"
                    >
                      <Star 
                        size={36} 
                        className={cn(
                          "transition-all",
                          ratings[category as keyof typeof ratings] >= star ? "text-primary fill-primary" : "text-gray-100"
                        )} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-8">
          <Button className="w-full py-4 text-lg bg-black hover:bg-gray-900 rounded-xl" onClick={() => navigate('dashboard')}>
            Submit Feedback
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
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const weekDays = [
      { day: 'Mon', date: 10 },
      { day: 'Tue', date: 11 },
      { day: 'Wed', date: 12 },
      { day: 'Thu', date: 13 },
      { day: 'Fri', date: 14 },
      { day: 'Sat', date: 15 },
      { day: 'Sun', date: 16 },
    ];

    return (
      <div className="min-h-screen bg-white pb-32">
        {/* Calendar Header */}
        <div className="px-6 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">March 2026</h2>
            <div className="flex gap-2">
              <button className="w-10 h-10 bg-surface rounded-full flex items-center justify-center">
                <Search size={20} />
              </button>
              <button className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            {weekDays.map((d) => (
              <button 
                key={d.date}
                onClick={() => setSelectedDay(d.date)}
                className={cn(
                  "flex flex-col items-center gap-2 p-2 rounded-2xl transition-all w-12",
                  selectedDay === d.date ? "bg-black text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
                )}
              >
                <span className="text-[10px] font-bold uppercase">{d.day}</span>
                <span className="text-lg font-bold">{d.date}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="px-6 py-8 space-y-8">
          <div className="flex gap-6">
            <div className="w-12 text-right">
              <div className="text-sm font-bold">12:00</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">PM</div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute left-0 top-2 bottom-0 w-px bg-gray-100" />
              <Card className="bg-secondary/30 border-l-4 border-primary p-4 rounded-2xl ml-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-sm">Lunch Delivery</div>
                  <div className="text-[10px] font-bold text-primary uppercase">Active</div>
                </div>
                <div className="text-xs text-gray-600 mb-3">Lemon Herb Salmon Salad</div>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/${i}/40`} className="w-6 h-6 rounded-full border-2 border-white" alt="Member" referrerPolicy="no-referrer" />
                  ))}
                  <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold">+4</div>
                </div>
              </Card>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="w-12 text-right">
              <div className="text-sm font-bold">07:00</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">PM</div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute left-0 top-2 bottom-0 w-px bg-gray-100" />
              <Card className="bg-surface p-4 rounded-2xl ml-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-sm">Your Cooking Turn</div>
                  <Clock size={14} className="text-gray-400" />
                </div>
                <div className="text-xs text-gray-600">Prepare Dinner for Circle #829</div>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-around z-50">
          <button onClick={() => navigate('dashboard')} className="flex flex-col items-center gap-1 text-gray-400">
            <Home size={24} />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Search size={24} />
            <span className="text-[10px] font-bold">Search</span>
          </button>
          <button onClick={() => navigate('schedule')} className={cn("flex flex-col items-center gap-1", view === 'schedule' ? "text-black" : "text-gray-400")}>
            <Calendar size={24} />
            <span className="text-[10px] font-bold">Schedule</span>
          </button>
          <button onClick={() => navigate('profile')} className={cn("flex flex-col items-center gap-1", view === 'profile' ? "text-black" : "text-gray-400")}>
            <UserIcon size={24} />
            <span className="text-[10px] font-bold">Account</span>
          </button>
        </div>
      </div>
    );
  };

  const ProfileScreen = () => (
    <div className="min-h-screen bg-white pb-32">
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Account</h2>
          <button className="w-10 h-10 bg-surface rounded-full flex items-center justify-center">
            <Settings size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4 pb-8 border-b border-gray-100">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm">
            <img src="https://picsum.photos/seed/john/200" alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black">{user.name}</h2>
            <p className="text-sm text-gray-500 font-medium">Circle #829 • {user.pincode}</p>
            <button className="text-primary text-sm font-bold mt-1">Edit Profile</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-surface rounded-2xl">
            <div className="text-xl font-bold">12</div>
            <div className="text-[10px] font-bold uppercase text-gray-400">Meals</div>
          </div>
          <div className="text-center p-4 bg-surface rounded-2xl">
            <div className="text-xl font-bold">4.8</div>
            <div className="text-[10px] font-bold uppercase text-gray-400">Rating</div>
          </div>
          <div className="text-center p-4 bg-surface rounded-2xl">
            <div className="text-xl font-bold">0</div>
            <div className="text-[10px] font-bold uppercase text-gray-400">Missed</div>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { icon: <Users size={20} />, label: 'Circle Settings', value: '7 Members' },
            { icon: <ChefHat size={20} />, label: 'Dietary Preference', value: user.foodType },
            { icon: <Truck size={20} />, label: 'Subscription', value: 'Active' },
            { icon: <MapIcon size={20} />, label: 'Saved Addresses', value: 'Home' },
          ].map((item, i) => (
            <button key={i} className="w-full py-4 flex items-center justify-between group border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-4">
                <div className="text-gray-400 group-hover:text-black transition-colors">
                  {item.icon}
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-black">{item.label}</div>
                  <div className="text-xs text-gray-400 font-medium">{item.value}</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          ))}
        </div>

        <Button variant="outline" className="w-full py-4 rounded-xl border-gray-200 text-black hover:bg-gray-50 font-bold mt-8" onClick={() => navigate('landing')}>
          Sign Out
        </Button>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-around z-50">
        <button onClick={() => navigate('dashboard')} className="flex flex-col items-center gap-1 text-gray-400">
          <Home size={24} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <Search size={24} />
          <span className="text-[10px] font-bold">Search</span>
        </button>
        <button onClick={() => navigate('schedule')} className={cn("flex flex-col items-center gap-1", view === 'schedule' ? "text-black" : "text-gray-400")}>
          <Calendar size={24} />
          <span className="text-[10px] font-bold">Schedule</span>
        </button>
        <button onClick={() => navigate('profile')} className={cn("flex flex-col items-center gap-1", view === 'profile' ? "text-black" : "text-gray-400")}>
          <UserIcon size={24} />
          <span className="text-[10px] font-bold">Account</span>
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
