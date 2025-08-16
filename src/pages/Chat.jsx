import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Send, Lock, Crown, MessageCircle, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

const Chat = () => {
  const { id: otherUserId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [chatId, setChatId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTempChatWarning, setShowTempChatWarning] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const findOrCreateChat = async (currentUserId, otherProfileId) => {
      const participant1 = currentUserId < otherProfileId ? currentUserId : otherProfileId;
      const participant2 = currentUserId > otherProfileId ? currentUserId : otherProfileId;

      const { data: existingChat, error: fetchError } = await supabase
        .from('chats')
        .select('id')
        .eq('participant1_id', participant1)
        .eq('participant2_id', participant2)
        .maybeSingle();

      if (fetchError) {
        toast({ title: "Erro ao buscar chat", description: fetchError.message, variant: "destructive" });
        return null;
      }
      
      if (existingChat) {
        return existingChat.id;
      }

      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({ participant1_id: participant1, participant2_id: participant2 })
        .select('id')
        .single();
      
      if (createError) {
        toast({ title: "Erro ao iniciar chat", description: createError.message, variant: "destructive" });
        return null;
      }
      
      setShowTempChatWarning(true);
      return newChat.id;
    };

    const fetchInitialData = async () => {
      setLoading(true);
      
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (currentUserError) {
        toast({ title: "Erro ao carregar seu perfil", description: currentUserError.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      setCurrentUserProfile(currentUserData);

      if (!currentUserData.is_paid) {
        setShowPaymentModal(true);
        setLoading(false);
        return;
      }

      const { data: otherUserData, error: otherUserError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single();

      if (otherUserError) {
        toast({ title: "Erro ao carregar perfil do usuário", description: otherUserError.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      setOtherUser(otherUserData);

      const foundChatId = await findOrCreateChat(user.id, otherUserId);
      if (foundChatId) {
        setChatId(foundChatId);
      }
      
      setLoading(false);
    };

    fetchInitialData();
  }, [user, otherUserId, toast]);

  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        toast({ title: "Erro ao carregar mensagens", description: error.message, variant: "destructive" });
      } else {
        setMessages(data);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, (payload) => {
        setMessages((prevMessages) => [...prevMessages, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, toast]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    const { error } = await supabase
      .from('messages')
      .insert({ chat_id: chatId, sender_id: user.id, content: newMessage });

    if (error) {
      toast({ title: "Erro ao enviar mensagem", description: error.message, variant: "destructive" });
    } else {
      setNewMessage('');
    }
  };

  const handleConfirmTempChat = () => {
    setShowTempChatWarning(false);
  };

  const handleBack = () => navigate(-1);
  const handleUpgrade = () => navigate('/payment');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Helmet><title>Carregando Chat... - Clube Liberal</title></Helmet>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  if (showPaymentModal) {
    return (
      <>
        <Helmet><title>Chat Premium - Clube Liberal</title></Helmet>
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="glass-effect border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl"><Lock className="h-6 w-6 text-purple-400" />Chat Premium</DialogTitle>
              <DialogDescription className="text-gray-300">O chat está disponível apenas para usuários com plano ativo. Deseja ativar agora?</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-6">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-lg border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2"><Crown className="h-5 w-5 text-yellow-400" /><span className="font-semibold">Benefícios Premium</span></div>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Chat ilimitado com todos os membros</li>
                  <li>• Apareça em destaque nos resultados</li>
                  <li>• Acesso a recursos exclusivos</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/home')} className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20">Voltar</Button>
                <Button onClick={handleUpgrade} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">Ativar Premium</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Chat com ${otherUser?.name || 'Usuário'} - Clube Liberal`}</title>
        <meta name="description" content={`Converse com ${otherUser?.name || 'um usuário'} no Clube Liberal.`} />
      </Helmet>

      <AlertDialog open={showTempChatWarning}>
        <AlertDialogContent className="glass-effect border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-purple-400" />Aviso de Chat Temporário</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Para sua privacidade e segurança, todas as mensagens neste chat serão permanentemente excluídas após 7 dias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleConfirmTempChat} className="bg-gradient-to-r from-purple-500 to-pink-500">Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen flex flex-col bg-gray-900 text-white">
        <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack} className="text-white hover:bg-white/10"><ArrowLeft className="h-5 w-5" /></Button>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${otherUser?.id}`)}>
                <Avatar>
                  <AvatarImage src={otherUser?.profile_picture_url} alt={otherUser?.name} />
                  <AvatarFallback>{otherUser?.name ? otherUser.name.charAt(0) : '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-semibold">{otherUser?.name}</span>
                  <p className="text-xs text-gray-300">{otherUser?.classification}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-6 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-2 ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender_id === user.id ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'}`}>
                  <p className="break-words">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1 text-right">
                    {new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {messages.length === 0 && !loading && (
             <div className="text-center py-12 text-white">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-300">Nenhuma mensagem ainda.</p>
              <p className="text-gray-400 mt-2">Envie a primeira mensagem para iniciar a conversa!</p>
            </div>
          )}
        </main>

        <footer className="sticky bottom-0 bg-black/30 backdrop-blur-md border-t border-white/10">
          <div className="container mx-auto p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
              <Button type="submit" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Chat;