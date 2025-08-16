import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MessageCircle, Search } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

const ChatList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('chats')
          .select(`
            id,
            created_at,
            participant1:profiles!participant1_id (id, name, profile_picture_url),
            participant2:profiles!participant2_id (id, name, profile_picture_url)
          `)
          .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
          .order('updated_at', { ascending: false });


        if (error) throw error;
        setChats(data);
      } catch (error) {
        toast({ title: "Erro ao carregar chats", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user, toast]);

  const handleBack = () => navigate('/home');

  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    return chats.filter(chat => {
      const otherUser = chat.participant1.id === user.id ? chat.participant2 : chat.participant1;
      return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [chats, searchQuery, user]);


  return (
    <>
      <Helmet>
        <title>Meus Chats - Clube Liberal</title>
        <meta name="description" content="Veja suas conversas ativas no Clube Liberal." />
      </Helmet>

      <div className="min-h-screen">
        <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" onClick={handleBack} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />Voltar
            </Button>
            <span className="text-xl font-bold text-white">Meus Chats</span>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar conversa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center pt-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
              </div>
            ) : filteredChats.length > 0 ? (
              <div className="space-y-4">
                {filteredChats.map((chat, index) => {
                  const otherUser = chat.participant1.id === user.id ? chat.participant2 : chat.participant1;
                  return (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => navigate(`/chat/${otherUser.id}`)}
                      className="flex items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={otherUser.profile_picture_url} alt={otherUser.name} />
                        <AvatarFallback>{otherUser.name ? otherUser.name.charAt(0) : '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="font-semibold text-white">{otherUser.name}</span>
                        <p className="text-sm text-gray-400">Clique para ver a conversa</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-300">Nenhum chat por enquanto</p>
                <p className="text-gray-400 mt-2">
                  Quando você iniciar uma conversa, ela aparecerá aqui.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ChatList;