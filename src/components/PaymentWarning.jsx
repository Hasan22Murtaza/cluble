import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentWarning = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="payment-warning fixed top-0 left-0 right-0 z-50 p-3 text-white text-center cursor-pointer"
      onClick={() => navigate('/payment')}
    >
      <div className="flex items-center justify-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-semibold">Você não está aparecendo!</span>
        <span className="text-sm opacity-90">Clique aqui para ativar seu plano</span>
      </div>
    </motion.div>
  );
};

export default PaymentWarning;