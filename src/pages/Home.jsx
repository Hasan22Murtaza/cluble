import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserCard from '@/components/UserCard';
import { getCountries, getStatesByCountry } from '@/lib/countries';
import { Heart, CalendarDays, User, LogOut, Filter, Search, Mail } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  const [filters, setFilters] = useState({
    country: '',
    state: '',
    city: '',
    classification: ''
  });

  const countries = getCountries();
  const states = filters.country ? getStatesByCountry(filters.country) : [];

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').not('name', 'is', null);
      if (error) {
        toast({ title: t('Error'), description: error.message, variant: "destructive" });
      } else {
        setProfiles(data);
        setFilteredProfiles(data);
      }
      setLoading(false);
    };

    fetchProfiles();
  }, [toast, t]);

  useEffect(() => {
    if (!user) return;

    let subscription = null;

    const setupSubscription = async () => {
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);

      if (chatsError) {
        console.error("Error fetching chat IDs:", chatsError);
        return;
      }

      const chatIds = chats.map(c => c.id);

      subscription = supabase
        .channel('public:messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            if (chatIds.includes(payload.new.chat_id) && payload.new.sender_id !== user.id) {
              setHasNewMessage(true);
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user]);

  useEffect(() => {
    let filtered = profiles;

    if (filters.country) {
      filtered = filtered.filter(p => p.country === filters.country);
    }
    if (filters.state && filters.state !== 'all') {
      filtered = filtered.filter(p => p.state === filters.state);
    }
    if (filters.city) {
      filtered = filtered.filter(p => p.city && p.city.toLowerCase().includes(filters.city.toLowerCase()));
    }
    if (filters.classification && filters.classification !== 'all') {
      filtered = filtered.filter(p => p.classification === filters.classification);
    }

    filtered.sort((a, b) => {
      if (a.is_paid && !b.is_paid) return -1;
      if (!a.is_paid && b.is_paid) return 1;
      return 0;
    });

    setFilteredProfiles(filtered);
  }, [filters, profiles]);
  
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value === 'all' ? '' : value };
    if (key === 'country') {
      newFilters.state = ''; // Reset state when country changes
    }
    setFilters(newFilters);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleMyProfile = () => navigate(`/profile/${user.id}`);
  const handleEvents = () => navigate('/events');
  const clearFilters = () => setFilters({ country: '', state: '', city: '', classification: '' });
  
  const handleGoToChats = () => {
    setHasNewMessage(false);
    navigate('/chats');
  };

  return (
    <>
      <Helmet>
        <title>{t('Classifieds - Liberal Club')}</title>
        <meta name="description" content={t('Discover amazing people in your region.')} />
      </Helmet>
      
      <div className="min-h-screen">
        <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-8 w-8 text-purple-400" />
                <span className="text-2xl font-bold text-white">{t('Liberal Club')}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleEvents} className="text-white hover:bg-white/10">
                  <CalendarDays className="h-4 w-4 mr-2" /> {t('Events')}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleMyProfile} className="text-white hover:bg-white/10">
                  <User className="h-4 w-4 mr-2" /> {t('My Profile')}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/10">
                  <LogOut className="h-4 w-4 mr-2" /> {t('Logout')}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8 border border-white/20"
          >
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-purple-400" />
              <span className="text-lg font-semibold text-white">{t('Filters')}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select value={filters.country} onValueChange={(value) => handleFilterChange('country', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder={t('Country')} /></SelectTrigger>
                <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>

              <Select value={filters.state} onValueChange={(value) => handleFilterChange('state', value)} disabled={!filters.country}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder={t('State')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All states')}</SelectItem>
                  {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>

              <Input placeholder={t('City')} value={filters.city} onChange={(e) => handleFilterChange('city', e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />

              <Select value={filters.classification} onValueChange={(value) => handleFilterChange('classification', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder={t('Classification')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All classifications')}</SelectItem>
                  <SelectItem value="casal">{t('Couple')}</SelectItem>
                  <SelectItem value="solteiro">{t('Single man')}</SelectItem>
                  <SelectItem value="solteira">{t('Single woman')}</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={clearFilters} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">{t('Clear Filters')}</Button>
            </div>
          </motion.div>

          {loading ? (
             <div className="flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div></div>
          ) : (
            <>
              <div className="mb-6"><span className="text-white text-lg">{filteredProfiles.length} {filteredProfiles.length === 1 ? t('profile found') : t('profiles found')}</span></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProfiles.map((profile, index) => <UserCard key={profile.id} user={profile} index={index} />)}
              </div>
              {filteredProfiles.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <span className="text-xl text-gray-300">{t('No results found')}</span>
                  <p className="text-gray-400 mt-2">{t('Try adjusting the filters to find more people')}</p>
                </motion.div>
              )}
            </>
          )}
        </div>

        <motion.div
          initial={{ scale: 0, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            onClick={handleGoToChats}
            size="icon"
            className="relative h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg"
          >
            <Mail className="h-8 w-8 text-white" />
            {hasNewMessage && (
              <motion.span
                className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 ring-2 ring-white"
                animate={{
                  scale: [1, 1.3, 1],
                  transition: { duration: 1.2, repeat: Infinity }
                }}
              />
            )}
          </Button>
        </motion.div>
      </div>
    </>
  );
};

export default Home;