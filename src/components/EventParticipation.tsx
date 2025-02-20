import React, { useState, useEffect } from 'react';
import { useEventParticipation } from '../hooks/useEventParticipation';
import { useEventPool } from '../hooks/useEventPool';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from './useWallet';

interface EventParticipationProps {
  eventId: string;
  wagerAmount: number;
  onParticipationComplete?: () => void;
}

export function EventParticipation({ 
  eventId, 
  wagerAmount,
  onParticipationComplete 
}: EventParticipationProps) {
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [poolInfo, setPoolInfo] = useState<any>(null);
  
  const { currentUser } = useAuth();
  const { wallet } = useWallet();
  const { 
    joinEvent, 
    getParticipants, 
    getUserPrediction,
    isProcessing 
  } = useEventParticipation();
  const { getEventPool } = useEventPool();

  useEffect(() => {
    const loadData = async () => {
      const [participantsData, poolData] = await Promise.all([
        getParticipants(eventId),
        getEventPool(eventId)
      ]);
      
      if (participantsData) setParticipants(participantsData);
      if (poolData) setPoolInfo(poolData);
      
      if (currentUser?.id) {
        const userPrediction = await getUserPrediction(eventId, currentUser.id);
        setPrediction(userPrediction);
      }
    };

    loadData();
  }, [eventId, currentUser?.id]);

  const handleJoin = async (selectedPrediction: boolean) => {
    if (!currentUser?.id) return;
    
    if (wallet.balance < wagerAmount) {
      toast.showError('Insufficient balance');
      return;
    }

    const success = await joinEvent({
      eventId,
      userId: currentUser.id,
      prediction: selectedPrediction,
      wagerAmount
    });

    if (success) {
      setPrediction(selectedPrediction);
      onParticipationComplete?.();
    }
  };

  return (
    <div className="space-y-4">
      {!prediction ? (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Choose Your Prediction</h3>
          <div className="flex gap-4">
            <button
              onClick={() => handleJoin(true)}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
            >
              Yes
            </button>
            <button
              onClick={() => handleJoin(false)}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50"
            >
              No
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 p-4 rounded-lg">
          <p>Your prediction: {prediction ? 'Yes' : 'No'}</p>
        </div>
      )}

      {poolInfo && (
        <div className="mt-4 space-y-2">
          <p>Total Pool: ₦{poolInfo.total_amount}</p>
          <p>Participants: {participants.length}</p>
        </div>
      )}
    </div>
  );
}