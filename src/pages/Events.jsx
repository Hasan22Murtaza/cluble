import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Filter, Calendar, ArrowLeft, Heart, AlertTriangle, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EventCard } from '@/components/events/EventCard';
import { EventForm } from '@/components/events/EventForm';
import { getCountries, getStatesByCountry } from '@/lib/countries';
import { useTranslation } from 'react-i18next';

const Events = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [filters, setFilters] = useState({ country: '', state: '' });
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  const countries = getCountries();
  const states = filters.country ? getStatesByCountry(filters.country) : [];

  const fetchEventsAndProfile = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const eventsPromise = supabase
      .from('events')
      .select(`*, profiles:events_user_id_fkey(id, name, profile_picture_url)`)
      .gte('event_date', today)
      .order('event_date', { ascending: true });

    const profilePromise = user 
      ? supabase.from('profiles').select('is_paid, is_admin').eq('id', user.id).single()
      : Promise.resolve({ data: null });

    const [eventsResult, profileResult] = await Promise.all([eventsPromise, profilePromise]);

    if (eventsResult.error) {
      console.error("Error fetching events:", eventsResult.error);
      toast({ title: t('Error'), description: eventsResult.error.message, variant: "destructive" });
    } else {
      setEvents(eventsResult.data);
      setFilteredEvents(eventsResult.data);
    }

    if (profileResult.error) {
        console.error("Error fetching profile:", profileResult.error);
    } else if (profileResult.data) {
      setUserProfile(profileResult.data);
    }
    
    setLoading(false);
  }, [toast, user, t]);

  useEffect(() => {
    fetchEventsAndProfile();
  }, [fetchEventsAndProfile]);

  useEffect(() => {
    let filtered = events;
    if (filters.country) {
      filtered = filtered.filter(e => e.country === filters.country);
    }
    if (filters.state && filters.state !== 'all') {
      filtered = filtered.filter(e => e.state === filters.state);
    }
    setFilteredEvents(filtered);
  }, [filters, events]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value === 'all' ? '' : value };
    if (key === 'country') {
      newFilters.state = '';
    }
    setFilters(newFilters);
  };

  const handleBack = () => navigate('/home');

  const onEventCreated = (newEvent) => {
    const today = new Date().toISOString().split('T')[0];
    if (new Date(newEvent.event_date) >= new Date(today)) {
      setEvents(prevEvents => {
          const newEventsList = [newEvent, ...prevEvents];
          const sorted = newEventsList.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
          setFilteredEvents(sorted);
          return sorted;
      });
    }
    setIsCreateFormOpen(false);
  };

  const onEventUpdated = (updatedEvent) => {
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(event => event.id === updatedEvent.id ? updatedEvent : event);
      setFilteredEvents(updatedEvents);
      return updatedEvents;
    });
  };

  const onEventDeleted = (deletedEventId) => {
    setEvents(prevEvents => {
      const remainingEvents = prevEvents.filter(event => event.id !== deletedEventId);
      setFilteredEvents(remainingEvents);
      return remainingEvents;
    });
  };

  return (
    <>
      <Helmet>
        <title>{t('Events - Liberal Club')}</title>
        <meta name="description" content={t('Check out the hottest events in the liberal community.')} />
      </Helmet>

      <div className="min-h-screen">
        <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">{t('Events')}</span>
            </div>
            <Button variant="ghost" onClick={handleBack} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" /> {t('Back')}
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {!loading && userProfile && !userProfile.is_paid && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/50 border border-red-500/50 text-white text-center p-4 rounded-lg mb-8"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <span className="font-bold">{t('EVENT REGISTRATION RELEASED FOR SUBSCRIBERS')}</span>
              </div>
              <Button onClick={() => navigate('/payment')} className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600">
                <Crown className="h-4 w-4 mr-2" />
                Seja Premium
              </Button>
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8 border border-white/20 flex flex-col md:flex-row justify-between items-center gap-4"
          >
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Filter className="h-5 w-5 text-purple-400" />
              <Select value={filters.country} onValueChange={(v) => handleFilterChange('country', v)}>
                <SelectTrigger className="w-full md:w-[180px] bg-white/10 border-white/20 text-white"><SelectValue placeholder={t('Country')} /></SelectTrigger>
                <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filters.state} onValueChange={(v) => handleFilterChange('state', v)} disabled={!filters.country}>
                <SelectTrigger className="w-full md:w-[180px] bg-white/10 border-white/20 text-white"><SelectValue placeholder={t('State')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All states')}</SelectItem>
                  {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {userProfile?.is_paid && (
              <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {t('Register Event')}
                  </Button>
                </DialogTrigger>
                <EventForm onEventCreated={onEventCreated} />
              </Dialog>
            )}
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center pt-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
            </div>
          ) : (
            <>
              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event, index) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      index={index} 
                      currentUserId={user?.id}
                      isCurrentUserAdmin={userProfile?.is_admin}
                      onEventUpdated={onEventUpdated}
                      onEventDeleted={onEventDeleted}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <span className="text-xl text-gray-300">{t('No events found')}</span>
                  <p className="text-gray-400 mt-2">
                    {filters.state || filters.country ? t('Try selecting another state.') : t('Be the first to create an event!')}
                  </p>
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default Events;