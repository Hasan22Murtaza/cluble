import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Mail, KeyRound, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (!error) {
      toast({
        title: "E-mail de recuperação enviado",
        className: 'bg-green-600 text-white',
        description: "Verifique sua caixa de entrada para continuar.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Falha ao enviar e-mail",
        description: error.message || "Por favor, verifique o e-mail e tente novamente.",
      });
    }

    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Recuperar Senha - Clube Liberal</title>
        <meta name="description" content="Recupere o acesso à sua conta do Clube Liberal." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="glass-effect border-white/20">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center mb-4"
              >
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
                  <KeyRound className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              <CardTitle className="text-2xl font-bold text-white">Recuperar Senha</CardTitle>
              <CardDescription className="text-gray-300 pt-2">
                Insira seu e-mail para receber o link de redefinição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold flex items-center justify-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default ForgotPassword;