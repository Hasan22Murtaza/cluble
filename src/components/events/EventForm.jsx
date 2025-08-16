import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { getCountries, getStatesByCountry } from '@/lib/countries';
import { useTranslation } from 'react-i18next';

export const EventForm = ({ onEventCreated, existingEvent, onEventUpdated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isEditing = !!existingEvent;

  const [formData, setFormData] = useState({
    title: existingEvent?.title || '',
    description: existingEvent?.description || '',
    event_date: existingEvent?.event_date || '',
    country: existingEvent?.country || '',
    city: existingEvent?.city || '',
    state: existingEvent?.state || '',
    whatsapp_contact: existingEvent?.whatsapp_contact || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countries = getCountries();
  const states = formData.country ? getStatesByCountry(formData.country) : [];

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    if (field === 'country') {
      newFormData.state = '';
    }
    setFormData(newFormData);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing && !imageFile) {
      toast({ title: t('Error'), description: t('Please add an image for the event.'), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      let imageUrl = existingEvent?.image_url;

      if (imageFile) {
        if (isEditing && existingEvent.image_url) {
            const oldFileName = existingEvent.image_url.split('/').pop();
            if(oldFileName) await supabase.storage.from('event_images').remove([oldFileName]);
        }
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('event_images').upload(fileName, imageFile);
        if (uploadError) throw new Error(`Image upload error: ${uploadError.message}`);
        const { data: { publicUrl } } = supabase.storage.from('event_images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
      
      const eventData = { ...formData, user_id: user.id, image_url: imageUrl };

      if (isEditing) {
        const { data: updatedEvent, error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', existingEvent.id)
          .select(`*, profiles:events_user_id_fkey(id, name, profile_picture_url)`)
          .single();
        if (error) throw error;
        toast({ title: t('Success!'), description: t('Event updated.'), className: "bg-green-500 text-white" });
        onEventUpdated(updatedEvent);
      } else {
        const { data: insertedEvent, error } = await supabase
          .from('events')
          .insert(eventData)
          .select(`*, profiles:events_user_id_fkey(id, name, profile_picture_url)`)
          .single();
        if (error) throw error;
        toast({ title: t('Success!'), description: t('Your event has been registered.'), className: "bg-green-500 text-white" });
        onEventCreated(insertedEvent);
      }
    } catch (error) {
      toast({ title: isEditing ? t('Error updating event') : t('Error creating event'), description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="bg-gray-900 border-gray-700 text-white">
      <DialogHeader>
        <DialogTitle>{isEditing ? t('Edit Event') : t('Register New Event')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">{t('Event Name')}</Label>
          <Input id="title" value={formData.title} onChange={handleChange} required className="bg-gray-800 border-gray-600" />
        </div>
        <div>
            <Label htmlFor="image">{t('Photo (Thumbnail)')}</Label>
            <Input id="image" type="file" onChange={handleImageChange} required={!isEditing} accept="image/*" className="bg-gray-800 border-gray-600 file:text-white" />
            {isEditing && existingEvent.image_url && <img src={existingEvent.image_url} alt="Prévia" className="mt-2 rounded-md h-24 w-auto" />}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="country">{t('Country')}</Label>
            <Select onValueChange={(v) => handleSelectChange('country', v)} value={formData.country} required>
              <SelectTrigger className="bg-gray-800 border-gray-600"><SelectValue placeholder={t('Country')} /></SelectTrigger>
              <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="state">{t('State')}</Label>
            <Select onValueChange={(v) => handleSelectChange('state', v)} value={formData.state} required disabled={!formData.country}>
              <SelectTrigger className="bg-gray-800 border-gray-600"><SelectValue placeholder={t('State')} /></SelectTrigger>
              <SelectContent>{states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">{t('City')}</Label>
            <Input id="city" value={formData.city} onChange={handleChange} required className="bg-gray-800 border-gray-600" />
          </div>
          <div>
            <Label htmlFor="event_date">{t('Event Date')}</Label>
            <Input id="event_date" type="date" value={formData.event_date} onChange={handleChange} required className="bg-gray-800 border-gray-600" min={new Date().toISOString().split("T")[0]} />
          </div>
        </div>
        <div>
          <Label htmlFor="description">{t('Description')}</Label>
          <Textarea id="description" value={formData.description} onChange={handleChange} maxLength="800" required className="bg-gray-800 border-gray-600" />
        </div>
        <div>
          <Label htmlFor="whatsapp_contact">{t('Organizer\'s WhatsApp (with DDD)')}</Label>
          <Input id="whatsapp_contact" value={formData.whatsapp_contact} onChange={handleChange} required placeholder="5511999999999" className="bg-gray-800 border-gray-600" />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">{t('Cancel')}</Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-500 to-pink-500">
            {isSubmitting ? (isEditing ? t('Saving...') : t('Publishing...')) : (isEditing ? t('Save Changes') : t('Publish Event'))}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};