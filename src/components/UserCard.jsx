import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, MessageCircle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const UserCard = ({ user, index }) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/profile/${user.id}`);
  };

  const handleChat = () => {
    navigate(`/chat/${user.id}`);
  };

  const displayName = user.name || 'Usuário';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex"
    >
      <Card className="card-hover glass-effect border-white/20 overflow-hidden flex flex-col h-full w-full">
        <CardContent className="p-0 flex flex-col flex-grow">
          <div className="relative">
            <img  
              className="w-full h-48 object-cover" 
              alt={`Foto de perfil de ${user.name || 'usuário'}`}
             src={user.profile_picture_url || "https://images.unsplash.com/photo-1683071765673-ff92ff1645dc"} />
            {user.is_paid && (
              <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                Premium
              </div>
            )}
          </div>
          
          <div className="p-4 text-white flex flex-col flex-grow">
            <div className="flex flex-col mb-2">
              <h3 className="text-sm font-semibold break-words leading-tight truncate">{displayName}</h3>
              <span className="bg-purple-500/30 px-2 py-1 rounded-full text-xs mt-2 w-fit">
                {user.classification}
              </span>
            </div>
            
            <div className="flex items-center text-sm text-gray-300 mb-3 mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {user.city}, {user.state}
            </div>
            
            <p className="text-sm text-gray-300 mb-4 line-clamp-2 flex-grow">
              {user.description || 'Sem descrição disponível'}
            </p>
            
            <div className="flex gap-2 mt-auto">
              <Button 
                onClick={handleViewProfile}
                variant="outline" 
                size="sm" 
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver Perfil
              </Button>
              <Button 
                onClick={handleChat}
                size="sm" 
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Chat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UserCard;