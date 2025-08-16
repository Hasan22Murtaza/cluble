import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Crown, Check, ArrowLeft, Star, Zap } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_live_51RIEIQIWOkw4Rqfdar3ZmxjQ9XolfKQXZRwEtw5WTo6aBy4OnU9CVKGx7WPInk6TgDKwZrDUYZzL2JRoxQV56fVO00QhhEvS8H');

const allPlans = {
  BRL: [
    {
      id: 'price_1RrjZhIXX3E5aU0rVW9BXGty',
      name: 'Plano Mensal',
      price: 'R$ 19,90',
      period: '/mês',
      description: 'Acesso completo por 30 dias',
      popular: false
    },
    {
      id: 'price_1RrjhjIXX3E5aU0rOPiEY6U1',
      name: 'Plano Semestral',
      price: 'R$ 59,00',
      period: '/6 meses',
      description: 'Economia e acesso prolongado',
      popular: true,
      savings: 'Mais Popular'
    },
    {
      id: 'price_1RrjiUIXX3E5aU0r2khqz1ck',
      name: 'Plano Anual',
      price: 'R$ 119,00',
      period: '/ano',
      description: 'O melhor custo-benefício',
      popular: false,
      savings: 'Melhor Valor'
    }
  ],
  USD: [
    {
      id: 'price_1RumtxIXX3E5aU0rshL8A4pq',
      name: 'Monthly Plan',
      price: '$19.90',
      period: '/month',
      description: 'Full access for 30 days',
      popular: false
    },
    {
      id: 'price_1Rumv2IXX3E5aU0rQ8i05wSP',
      name: 'Semiannual Plan',
      price: '$59.00',
      period: '/6 months',
      description: 'Savings and extended access',
      popular: true,
      savings: 'Most Popular'
    },
    {
      id: 'price_1Rumw4IXX3E5aU0rzZgGHsnG',
      name: 'Annual Plan',
      price: '$119.00',
      period: '/year',
      description: 'The best value',
      popular: false,
      savings: 'Best Value'
    }
  ]
};

const features = [
  'Chat Ilimitado',
  'Crie Eventos',
  'Suporte Prioritário',
  'Sem anúncios'
];

const Payment = () => {
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [currentPlans, setCurrentPlans] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase.from('profiles').select('is_paid, country').eq('id', user.id).single();
        
        let countryCode = 'BR';
        if (data && data.country === 'US') {
          countryCode = 'USD';
        } else if (error) {
          console.warn("Could not fetch user profile, defaulting to BR plans.", error.message);
        }

        if (data) setProfile(data);

        const plans = countryCode === 'USD' ? allPlans.USD : allPlans.BRL;
        setCurrentPlans(plans);
        
        const popularPlan = plans.find(p => p.popular);
        if (popularPlan) {
          setSelectedPlanId(popularPlan.id);
        } else if (plans.length > 0) {
          setSelectedPlanId(plans[0].id);
        }
      }
    };
    fetchProfile();
  }, [user]);

  
  const handlePayment = async () => {
    console.log('handlePayment', selectedPlanId);
    if (!selectedPlanId) {
      toast({ title: "Erro", description: "Por favor, selecione um plano.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: selectedPlanId, quantity: 1 }],
        mode: 'subscription',
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment`,
        clientReferenceId: user.id
      });

      if (error) {
        toast({ title: "Erro no Checkout", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível iniciar o pagamento.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/home');
  };

  if (profile?.is_paid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
        <Crown className="h-24 w-24 text-yellow-400 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Você já é um membro Premium!</h1>
        <p className="text-lg text-gray-300 mb-8">Aproveite todos os benefícios exclusivos do Clube Liberal.</p>
        <Button onClick={() => navigate('/home')} className="bg-gradient-to-r from-purple-500 to-pink-500">Voltar para a Home</Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Planos Premium - Clube Liberal</title>
        <meta name="description" content="Escolha seu plano premium e tenha acesso completo a todos os recursos." />
      </Helmet>

      <div className="min-h-screen">
        <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={handleBack} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />Voltar
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="flex justify-center mb-6">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full"><Crown className="h-12 w-12 text-white" /></div>
              </motion.div>
              <span className="text-4xl font-bold text-white mb-4 block">Torne-se Premium</span>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">Desbloqueie todos os recursos e conecte-se sem limitações</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <span className="text-2xl font-bold text-white mb-6 block">Escolha seu plano</span>
                {currentPlans.length > 0 ? currentPlans.map((plan) => (
                  <motion.div key={plan.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <Card className={`cursor-pointer transition-all glass-effect border-2 ${selectedPlanId === plan.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 hover:border-white/40'} ${plan.popular ? 'ring-2 ring-yellow-400' : ''}`} onClick={() => setSelectedPlanId(plan.id)}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white">{plan.name}</CardTitle>
                          {plan.savings && <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${plan.popular ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : 'bg-green-500/20 text-green-400'}`}><Star className="h-3 w-3" />{plan.savings}</div>}
                        </div>
                        <CardDescription className="text-gray-300">{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-3xl font-bold text-white">{plan.price}</span>
                          <span className="text-gray-400">{plan.period}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )) : (
                  <p className="text-white">Carregando planos...</p>
                )}
              </div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <Card className="glass-effect border-white/20 h-fit">
                  <CardHeader><CardTitle className="text-white flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-400" />Recursos Premium</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {features.map((feature, index) => (
                        <motion.div key={index} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + index * 0.1 }} className="flex items-center gap-3">
                          <div className="bg-green-500 rounded-full p-1"><Check className="h-3 w-3 text-white" /></div>
                          <span className="text-gray-300">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                    <Button onClick={handlePayment} disabled={loading || !selectedPlanId} className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg py-6">
                      {loading ? 'Aguarde...' : <><Crown className="h-5 w-5 mr-2" />Ativar Premium Agora</>}
                    </Button>
                    <p className="text-xs text-gray-400 text-center mt-4">Pagamento seguro via Stripe • Cancele quando quiser</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Payment;