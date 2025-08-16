import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, MessageCircle, Calendar, Crown, Edit, CameraOff, ChevronLeft, ChevronRight, LogOut, Globe, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const isOwnProfile = user && user.id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      
      if (error) {
        toast({ title: t('Error'), description: error.message, variant: "destructive" });
        setProfile(null);
      } else {
        setProfile(data);
        setSelectedLanguage(data.language || i18n.language);
      }
      
      setLoading(false);
    };

    fetchProfile();
  }, [id, toast, t, i18n.language]);

  const allImages = [profile?.profile_picture_url, ...(profile?.images_urls || [])].filter(Boolean);

  const nextImage = () => {
    if (allImages.length > 1) setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    if (allImages.length > 1) setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleLanguageChange = async (lang) => {
    setSelectedLanguage(lang);
    if (isOwnProfile) {
      const { error } = await supabase.from('profiles').update({ language: lang }).eq('id', user.id);
      if (error) {
        toast({ title: t('Error'), description: t('Failed to update language.'), variant: "destructive" });
      } else {
        i18n.changeLanguage(lang);
        toast({ title: t('Success!'), description: t('Language updated successfully!') });
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleChat = () => navigate(`/chat/${id}`);
  const handleBack = () => navigate('/home');
  const handleEditProfile = () => navigate('/edit-profile');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Helmet><title>{t('Loading Profile...')}</title></Helmet>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!profile) {
    return (
       <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
        <Helmet><title>{t('Profile not found')}</title></Helmet>
        <h1 className="text-2xl mb-4 text-center">{t('Profile not found')}</h1>
        <Button onClick={handleBack}>{t('Back')}</Button>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{`${profile.name || 'Perfil'} - ${t('Liberal Club')}`}</title>
        <meta name="description" content={`Conheça ${profile.name || 'um membro'} no ${t('Liberal Club')}. ${profile.description || ''}`} />
      </Helmet>

      <div className="min-h-screen">
        <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Button variant="ghost" onClick={handleBack} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" /> {t('Back')}
            </Button>
            <div className="flex items-center gap-2">
              {isOwnProfile && (
                <Button variant="outline" onClick={handleEditProfile} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Edit className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">{t('Edit Profile')}</span>
                </Button>
              )}
               <Button variant="ghost" size="icon" onClick={() => navigate('/chats')} className="text-white hover:bg-white/10 relative">
                  <Mail className="h-5 w-5" />
                </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <Card className="glass-effect border-white/20 overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  <div className="relative group">
                    <div className="aspect-square relative overflow-hidden bg-black/50 flex items-center justify-center">
                      {allImages.length > 0 ? (
                         <motion.img key={currentImageIndex} src={allImages[currentImageIndex]} className="w-full h-full object-cover" alt={`Foto ${currentImageIndex + 1} de ${profile.name}`} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} />
                      ) : (
                        <div className="text-center text-gray-400"><CameraOff className="h-16 w-16 mx-auto" /><p>Nenhuma foto</p></div>
                      )}
                      {profile.is_paid && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"><Crown className="h-4 w-4" /> {t('Premium')}</div>
                      )}
                    </div>
                    {allImages.length > 1 && (
                      <>
                        <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/75 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={prevImage}><ChevronLeft className="h-6 w-6" /></Button>
                        <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/75 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={nextImage}><ChevronRight className="h-6 w-6" /></Button>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">{allImages.map((_, index) => (<button key={index} onClick={() => setCurrentImageIndex(index)} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'}`} />))}</div>
                      </>
                    )}
                  </div>
                  <div className="p-6 md:p-8 text-white flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                           <Avatar className="h-16 w-16 border-2 border-pink-500"><AvatarImage src={profile.profile_picture_url} alt={profile.name} /><AvatarFallback>{profile.name ? profile.name.charAt(0) : '?'}</AvatarFallback></Avatar>
                            <div><h1 className="text-2xl font-bold">{profile.name}</h1>{profile.classification && <span className="bg-pink-500/30 px-3 py-1 rounded-full text-sm inline-block mt-2">{t(profile.classification)}</span>}</div>
                        </div>
                    </div>
                    {profile.city && profile.state && <div className="flex items-center text-gray-300 mb-6"><MapPin className="h-5 w-5 mr-2" /> {profile.city}, {profile.state} - {profile.country}</div>}
                    <div className="mb-6"><h2 className="text-lg font-semibold mb-3 block">{t('About')}</h2><p className="text-gray-300 leading-relaxed break-words">{profile.description || t('No description provided.')}</p></div>
                    {profile.created_at && (<div className="flex items-center text-sm text-gray-400 mb-8"><Calendar className="h-4 w-4 mr-2" />{t('Member since')} {new Date(profile.created_at).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}</div>)}
                    
                    {isOwnProfile && (
                      <div className="mt-auto space-y-4">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-gray-400" />
                          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                            <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white"><SelectValue placeholder={t('Language')} /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pt-BR">Português (BR)</SelectItem>
                              <SelectItem value="en-US">English (US)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleLogout} variant="ghost" className="w-full justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10">
                          <LogOut className="h-4 w-4 mr-2" /> {t('Logout')}
                        </Button>
                      </div>
                    )}

                    {!isOwnProfile && (
                      <Button onClick={handleChat} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg py-6 mt-auto">
                        <MessageCircle className="h-5 w-5 mr-2" /> {t('Start Conversation')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Profile;