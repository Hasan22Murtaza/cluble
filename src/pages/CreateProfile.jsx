import React, { useState, useRef } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { User, Upload, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCountries, getStatesByCountry } from '@/lib/countries';

const CreateProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    classification: '',
    country: '',
    city: '',
    state: '',
    description: '',
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [additionalPhotoFiles, setAdditionalPhotoFiles] = useState([]);
  const [additionalPhotoPreviews, setAdditionalPhotoPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const profilePhotoInputRef = useRef(null);
  const additionalPhotosInputRef = useRef(null);

  const countries = getCountries();
  const states = formData.country ? getStatesByCountry(formData.country) : [];

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
      if (additionalPhotoFiles.length + files.length > 3) {
        toast({
          title: "Limite excedido",
          description: "Você pode adicionar no máximo 3 fotos.",
          variant: "destructive",
        });
        return;
      }
      setAdditionalPhotoFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setAdditionalPhotoPreviews(prev => [...prev, ...newPreviews]);
    }
  };
  
  const removeAdditionalPhoto = (index) => {
    setAdditionalPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setAdditionalPhotoPreviews(prev => prev.filter((_, i) => i !== index));
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

    if (error) {
      throw new Error(`Failed to upload image to ${bucket}: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.classification || !formData.country || !formData.city || !formData.state) {
      toast({ title: "Erro", description: "Por favor, preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (!profilePhotoFile) {
      toast({ title: "Erro", description: "Por favor, adicione uma foto de perfil.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      let profilePictureUrl = '';
      if (profilePhotoFile) {
        const sanitizedFilename = sanitizeFilename(profilePhotoFile.name);
        profilePictureUrl = await uploadImage(profilePhotoFile, 'avatars', `${user.id}/${sanitizedFilename}`);
      }
      
      const imagesUrls = await Promise.all(
        additionalPhotoFiles.map(file => {
          const sanitizedFilename = sanitizeFilename(file.name);
          return uploadImage(file, 'photos', `${user.id}/${sanitizedFilename}`);
        })
      );

      const profileData = {
        id: user.id,
        name: formData.name,
        classification: formData.classification,
        country: formData.country,
        city: formData.city,
        state: formData.state,
        description: formData.description,
        profile_picture_url: profilePictureUrl,
        images_urls: imagesUrls,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').update(profileData).eq('id', user.id);
      
      if (error) throw error;

      toast({ title: "Perfil criado com sucesso!", description: "Bem-vindo ao Clube Liberal" });
      navigate('/home');
    } catch (error) {
      console.error("Failed to create profile:", error);
      toast({ title: "Erro", description: error.message || "Erro ao criar perfil. Tente novamente.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Criar Perfil - Clube Liberal</title>
        <meta name="description" content="Complete seu perfil no Clube Liberal e comece a se conectar." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <Card className="glass-effect border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Criar Seu Perfil</CardTitle>
              <CardDescription className="text-gray-300">
                Complete suas informações para aparecer nos classificados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="flex justify-center items-center space-x-4">
                  <Avatar className="h-24 w-24 border-2 border-pink-500">
                    <AvatarImage src={profilePhotoPreview} alt="Foto de Perfil" />
                    <AvatarFallback className="bg-white/10">
                      <User className="h-12 w-12 text-gray-400" />
                    </AvatarFallback>
                  </Avatar>
                  <Button
                      type="button"
                      variant="outline"
                      onClick={() => profilePhotoInputRef.current.click()}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                    <Upload className="h-4 w-4 mr-2" />
                    Escolher Foto *
                  </Button>
                  <input 
                    type="file" 
                    ref={profilePhotoInputRef}
                    onChange={handleProfilePhotoChange}
                    className="hidden" 
                    accept="image/*"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Nome/Apelido *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classification" className="text-white">Classificação *</Label>
                    <Select value={formData.classification} onValueChange={(value) => handleInputChange('classification', value)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casal">Casal</SelectItem>
                        <SelectItem value="solteiro">Solteiro</SelectItem>
                        <SelectItem value="solteira">Solteira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-white">País *</Label>
                    <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                       <SelectTrigger><SelectValue placeholder="País" /></SelectTrigger>
                       <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-white">Estado/Região *</Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)} disabled={!formData.country}>
                       <SelectTrigger><SelectValue placeholder="Estado/Região" /></SelectTrigger>
                       <SelectContent>{states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-white">Cidade *</Label>
                  <Input id="city" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} required className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Descrição</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} maxLength={400} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                  <p className="text-xs text-right text-gray-400">{formData.description.length}/400</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Fotos Adicionais (até 3)</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {additionalPhotoPreviews.map((photo, index) => (
                        <div key={index} className="relative aspect-square">
                          <img src={photo} alt={`Foto adicional ${index + 1}`} className="rounded-md object-cover w-full h-full" />
                          <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeAdditionalPhoto(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {additionalPhotoPreviews.length < 3 && (
                        <Button type="button" variant="outline" className="aspect-square w-full h-full flex items-center justify-center bg-white/10 border-white/20 hover:bg-white/20" onClick={() => additionalPhotosInputRef.current.click()}>
                          <Upload className="h-6 w-6 text-gray-400" />
                        </Button>
                      )}
                    </div>
                     <input 
                      type="file" 
                      ref={additionalPhotosInputRef}
                      onChange={handleAdditionalPhotosChange}
                      className="hidden" 
                      accept="image/*"
                      multiple
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500" disabled={loading}>
                  {loading ? 'Criando perfil...' : 'Criar Perfil'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default CreateProfile;