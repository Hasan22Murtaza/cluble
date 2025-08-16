import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';
import { Calendar, MapPin, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { EventForm } from './EventForm';
import { useTranslation } from 'react-i18next';

export const EventCard = ({ event, index, currentUserId, isCurrentUserAdmin, onEventUpdated, onEventDeleted }) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const isOwner = event.user_id === currentUserId;
  const canManage = isOwner || isCurrentUserAdmin;

  const handleContact = () => {
    if (event.whatsapp_contact) {
      const message = `Olá! Vi o evento "${event.title}" no Clube Liberal e gostaria de mais informações.`;
      window.open(`https://wa.me/${event.whatsapp_contact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleDelete = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (deleteError) throw deleteError;

      if (event.image_url) {
        const fileName = event.image_url.split('/').pop();
        if (fileName) {
            await supabase.storage.from('event_images').remove([fileName]);
        }
      }

      toast({ title: t('Success!'), description: t('Event deleted.'), className: "bg-green-500 text-white" });
      onEventDeleted(event.id);
    } catch (error) {
      toast({ title: t('Error deleting event'), description: error.message, variant: "destructive" });
    }
  };

  const handleEventUpdated = (updatedEvent) => {
    onEventUpdated(updatedEvent);
    setIsEditOpen(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="card-hover glass-effect border-white/20 overflow-hidden flex flex-col h-full relative">
        {canManage && (
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="outline" className="h-8 w-8 bg-black/50 hover:bg-black/70 border-white/30">
                  <Edit className="h-4 w-4 text-white" />
                </Button>
              </DialogTrigger>
              <EventForm existingEvent={event} onEventUpdated={handleEventUpdated} />
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="destructive" className="h-8 w-8 bg-red-500/80 hover:bg-red-500/100 border-red-400">
                  <Trash2 className="h-4 w-4 text-white" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('This will permanently delete the event.')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{t('Delete')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        <CardContent className="p-0 flex flex-col flex-grow">
          <img
            className="w-full h-48 object-cover"
            alt={`Imagem do evento ${event.title}`}
            src={event.image_url || 'https://images.unsplash.com/photo-1519751138087-5bf79df62d5b'}
          />
          <div className="p-4 text-white flex flex-col flex-grow">
            <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
            <div className="flex items-center text-sm text-gray-300 mb-1">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(event.event_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </div>
            <div className="flex items-center text-sm text-gray-300 mb-3">
              <MapPin className="h-4 w-4 mr-2" />
              {event.city}, {event.state} - {event.country}
            </div>
            <p className="text-sm text-gray-300 mb-4 line-clamp-3 flex-grow">
              {event.description}
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2 overflow-hidden">
                <img className="h-8 w-8 rounded-full object-cover flex-shrink-0" src={event.profiles?.profile_picture_url || 'https://avatar.vercel.sh/user'} alt={event.profiles?.name} />
                <span className="text-xs truncate">{event.profiles?.name || 'Organizador'}</span>
              </div>
              <Button onClick={handleContact} size="sm" className="bg-green-500 hover:bg-green-600 flex-shrink-0">
                <MessageSquare className="h-4 w-4 mr-2" /> {t('Contact')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};