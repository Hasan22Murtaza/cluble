import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, PartyPopper } from 'lucide-react';

const PaymentSuccess = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const updateUserToPaid = async () => {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_paid: true })
          .eq('id', user.id);

        if (error) {
          toast({
            title: "Erro ao atualizar seu plano",
            description: "Por favor, entre em contato com o suporte.",
            variant: "destructive",
          });
        }
      }
    };

    updateUserToPaid();
  }, [user, toast]);

  return (
    <>
      <Helmet>
        <title>Pagamento Bem-Sucedido - Clube Liberal</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="text-center text-white max-w-lg w-full"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <CheckCircle className="h-24 w-24 text-green-400" />
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                className="absolute -top-2 -right-2"
              >
                <PartyPopper className="h-8 w-8 text-yellow-400 transform -rotate-12" />
              </motion.div>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Pagamento Confirmado!</h1>
          <p className="text-lg text-gray-300 mb-8">
            Parabéns! Você agora é um membro Premium do Clube Liberal. Explore todos os recursos exclusivos sem limites.
          </p>
          <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-purple-500 to-pink-500 text-lg py-6 px-8">
            Começar a Explorar
          </Button>
        </motion.div>
      </div>
    </>
  );
};

export default PaymentSuccess;