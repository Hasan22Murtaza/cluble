import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>Bem-vindo ao Clube Liberal - Conecte-se!</title>
        <meta name="description" content="Conecte-se com pessoas do meio Liberal: Casais, Solteiras e Solteiros. Encontre seu par ideal no Clube Liberal." />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center bg-[url('https://horizons-cdn.hostinger.com/f4a3ffc1-a9ee-4bf1-989e-4d55547a3cb4/3236e9c89e77e4951e0dc43ffe4fddfb.png')] bg-cover bg-center text-white p-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
            className="flex justify-center"
          >
            <img src="https://horizons-cdn.hostinger.com/f4a3ffc1-a9ee-4bf1-989e-4d55547a3cb4/9aca5e70a688113f83ca857c95c9c973.png" alt="Clube Liberal Logo" className="h-60 w-auto" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6 drop-shadow-lg">
            Conecte-se com pessoas do meio Liberal: <br className="hidden md:block" />Casais, Solteiras e Solteiros.
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-10">
            Descubra um mundo de conexões autênticas e experiências inesquecíveis.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <Button
                asChild
                className="w-full sm:w-auto px-8 py-3 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
              >
                <Link to="/login">Entrar</Link>
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto px-8 py-3 text-lg border-2 border-white/50 text-white hover:bg-white/10 transition-all duration-300 shadow-lg"
              >
                <Link to="/register">Cadastre-se</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LandingPage;