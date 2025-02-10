import { useCallback, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalRewards: number;
}

export function useReferral() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalRewards: 0
  });
  const { currentUser } = useAuth();

  const fetchReferralStats = useCallback(async () => {
    if (!currentUser) return;

    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('status')
      .eq('referrer_id', currentUser.id);

    if (referralsError) {
      console.error('Error fetching referral stats:', referralsError);
      return;
    }

    const { data: rewards, error: rewardsError } = await supabase
      .from('referral_rewards')
      .select('amount')
      .eq('referrer_id', currentUser.id)
      .eq('paid', true);

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError);
      return;
    }

    setStats({
      totalReferrals: referrals?.length || 0,
      pendingReferrals: referrals?.filter(r => r.status === 'pending').length || 0,
      completedReferrals: referrals?.filter(r => r.status === 'completed').length || 0,
      totalRewards: rewards?.reduce((sum, r) => sum + r.amount, 0) || 0
    });
  }, [currentUser]);

  const generateReferralCode = useCallback(async () => {
    if (!currentUser) return null;

    const { data, error } = await supabase
      .from('referrals')
      .select('code')
      .eq('referrer_id', currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching referral code:', error);
      return null;
    }

    if (data?.code) {
      setReferralCode(data.code);
      return data.code;
    }

    const { data: newReferral, error: createError } = await supabase.rpc('generate_referral_code');
    if (createError) {
      console.error('Error generating referral code:', createError);
      return null;
    }

    await supabase
      .from('referrals')
      .insert({
        referrer_id: currentUser.id,
        code: newReferral
      });

    setReferralCode(newReferral);
    return newReferral;
  }, [currentUser]);

  const applyReferralCode = useCallback(async (code: string) => {
    if (!currentUser) return false;

    const { data: referral, error } = await supabase
      .from('referrals')
      .select('referrer_id')
      .eq('code', code)
      .single();

    if (error || !referral) {
      return false;
    }

    await supabase
      .from('referrals')
      .update({ 
        referred_id: currentUser.id,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('code', code);

    return true;
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      generateReferralCode();
      fetchReferralStats();
    }
  }, [currentUser, generateReferralCode, fetchReferralStats]);

  return {
    referralCode,
    stats,
    generateReferralCode,
    applyReferralCode,
    fetchReferralStats
  };
}