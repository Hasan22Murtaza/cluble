import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (!error) {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao Clube Liberal",
      });
      navigate('/home', { replace: true });
    }
    
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Login - Clube Liberal</title>
        <meta name="description" content="Faça login na sua conta do Clube Liberal e conecte-se com pessoas incríveis." />
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
                <img src="https://horizons-cdn.hostinger.com/f4a3ffc1-a9ee-4bf1-989e-4d55547a3cb4/9aca5e70a688113f83ca857c95c9c973.png" alt="Clube Liberal Logo" className="h-24 w-auto" />
              </motion.div>
              <CardTitle className="text-3xl font-bold text-white mb-2">Bem-vindo de volta!</CardTitle>
              <CardDescription className="text-gray-300 pt-2">
                Entre na sua conta para continuar
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
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-white">Senha</Label>
                    <Link to="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-300">
                  Não tem uma conta?{' '}
                  <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold">
                    Cadastre-se
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Login;