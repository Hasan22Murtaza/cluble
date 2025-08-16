import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { User, Upload, ArrowLeft, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCountries, getStatesByCountry } from '@/lib/countries';
import { useTranslation } from 'react-i18next';

const EditProfile = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({ name: '', classification: '', country: '', city: '', state: '', description: '' });
  
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  
  const [additionalPhotoFiles, setAdditionalPhotoFiles] = useState([]);
  const [additionalPhotoPreviews, setAdditionalPhotoPreviews] = useState([]);
  
  const [existingAdditionalPhotos, setExistingAdditionalPhotos] = useState([]);

  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const profilePhotoInputRef = useRef(null);
  const additionalPhotosInputRef = useRef(null);

  const countries = getCountries();
  const states = formData.country ? getStatesByCountry(formData.country) : [];

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        if (error) {
          toast({ title: t('Error loading profile'), description: error.message, variant: "destructive" });
        } else if (data) {
          setProfileData(data);
          setFormData({
            name: data.name || '',
            classification: data.classification || '',
            country: data.country || '',
            city: data.city || '',
            state: data.state || '',
            description: data.description || '',
          });
          setProfilePhotoPreview(data.profile_picture_url || null);
          setExistingAdditionalPhotos(data.images_urls || []);
        }
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, toast, t]);

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    if (field === 'country') {
      newFormData.state = '';
    }
    setFormData(newFormData);
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAdditionalPhotosChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const totalPhotos = existingAdditionalPhotos.length + additionalPhotoFiles.length + files.length;
      if (totalPhotos > 3) {
        toast({
          title: "Limite excedido",
          description: `Você pode ter no máximo 3 fotos. Você já tem ${existingAdditionalPhotos.length + additionalPhotoFiles.length}.`,
          variant: "destructive",
        });
        return;
      }
      setAdditionalPhotoFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setAdditionalPhotoPreviews(prev => [...prev, ...newPreviews]);
    }
  };
  
  const removeNewAdditionalPhoto = (index) => {
    setAdditionalPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setAdditionalPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingAdditionalPhoto = (index) => {
    setExistingAdditionalPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const sanitizeFilename = (filename) => {
    const cleaned = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExt = cleaned.split('.').pop();
    const fileNameWithoutExt = cleaned.replace(/\.[^/.]+$/, "");
    return `${fileNameWithoutExt}_${randomSuffix}.${fileExt}`;
  }

  const uploadImage = async (file, bucket, path) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let newProfilePictureUrl = profileData.profile_picture_url;
      if (profilePhotoFile) {
        const sanitizedFilename = sanitizeFilename(profilePhotoFile.name);
        newProfilePictureUrl = await uploadImage(profilePhotoFile, 'avatars', `${user.id}/${sanitizedFilename}`);
      }

      const newAdditionalImageUrls = await Promise.all(
        additionalPhotoFiles.map(file => {
          const sanitizedFilename = sanitizeFilename(file.name);
          return uploadImage(file, 'photos', `${user.id}/${sanitizedFilename}`)
        })
      );

      const finalImagesUrls = [...existingAdditionalPhotos, ...newAdditionalImageUrls];

      const updates = {
        ...formData,
        profile_picture_url: newProfilePictureUrl,
        images_urls: finalImagesUrls,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
      
      toast({ title: t('Profile updated successfully!') });
      navigate(`/profile/${user.id}`);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({ title: t('Error'), description: `${t('Failed to update profile:')} ${error.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('Edit Profile')} - {t('Liberal Club')}</title>
        <meta name="description" content={t('Update your profile at Clube Liberal.')} />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                 <Button variant="ghost" onClick={() => navigate(`/profile/${user.id}`)} className="text-white hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4 mr-2" />{t('Back')}
                  </Button>
                <div className="text-center flex-grow">
                  <CardTitle className="text-2xl font-bold text-white">{t('Edit Profile')}</CardTitle>
                </div>
                <div className="w-24"></div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="flex justify-center items-center space-x-4">
                    <Avatar className="h-24 w-24 border-2 border-pink-500">
                      <AvatarImage src={profilePhotoPreview} alt="Foto de Perfil" />
                      <AvatarFallback className="bg-white/10"><User className="h-12 w-12 text-gray-400" /></AvatarFallback>
                    </Avatar>
                    <Button type="button" variant="outline" onClick={() => profilePhotoInputRef.current.click()} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Upload className="h-4 w-4 mr-2" />{t('Change Photo')}
                    </Button>
                    <input type="file" ref={profilePhotoInputRef} onChange={handleProfilePhotoChange} className="hidden" accept="image/*" />
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">{t('Name/Nickname *')}</Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classification" className="text-white">{t('Classification')} *</Label>
                    <Select value={formData.classification} onValueChange={(value) => handleInputChange('classification', value)}>
                      <SelectTrigger><SelectValue placeholder={t('Select')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casal">{t('Couple')}</SelectItem>
                        <SelectItem value="solteiro">{t('Single man')}</SelectItem>
                        <SelectItem value="solteira">{t('Single woman')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-white">{t('Country')} *</Label>
                    <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                       <SelectTrigger><SelectValue placeholder={t('Country')} /></SelectTrigger>
                       <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-white">{t('State')} *</Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)} disabled={!formData.country}>
                       <SelectTrigger><SelectValue placeholder={t('State')} /></SelectTrigger>
                       <SelectContent>{states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-white">{t('City *')}</Label>
                  <Input id="city" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} required className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">{t('Description')}</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} maxLength={400} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                  <p className="text-xs text-right text-gray-400">{formData.description?.length || 0}/400</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">{t('Additional Photos (up to 3)')}</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {existingAdditionalPhotos.map((photo, index) => (
                        <div key={index} className="relative aspect-square">
                          <img src={photo} alt={`Foto adicional ${index + 1}`} className="rounded-md object-cover w-full h-full" />
                          <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeExistingAdditionalPhoto(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {additionalPhotoPreviews.map((photo, index) => (
                        <div key={index} className="relative aspect-square">
                          <img src={photo} alt={`Nova foto ${index + 1}`} className="rounded-md object-cover w-full h-full" />
                          <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeNewAdditionalPhoto(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {existingAdditionalPhotos.length + additionalPhotoPreviews.length < 3 && (
                        <Button type="button" variant="outline" className="aspect-square w-full h-full flex items-center justify-center bg-white/10 border-white/20 hover:bg-white/20" onClick={() => additionalPhotosInputRef.current.click()}>
                          <Upload className="h-6 w-6 text-gray-400" />
                        </Button>
                      )}
                    </div>
                     <input type="file" ref={additionalPhotosInputRef} onChange={handleAdditionalPhotosChange} className="hidden" accept="image/*" multiple />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500" disabled={loading}>
                  {loading ? t('Saving...') : t('Save Changes')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default EditProfile;