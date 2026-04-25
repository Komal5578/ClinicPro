import { useState, useEffect, useCallback } from 'react';
import { getTodayWalkIns, updateWalkInStatus } from '../services/api';

const useQueue = (clinic_id, refreshInterval = 30000) => {
  const [walkIns, setWalkIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQueue = useCallback(async () => {
    try {
      const res = await getTodayWalkIns(clinic_id);
      setWalkIns(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [clinic_id]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchQueue, refreshInterval]);

  const updateStatus = async (walkin_id, status) => {
    try {
      await updateWalkInStatus(walkin_id, status);
      setWalkIns(prev =>
        prev.map(w => w.walkin_id === walkin_id ? { ...w, status } : w)
      );
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const waiting = walkIns.filter(w => w.status === 'WAITING');
  const inConsultation = walkIns.filter(w => w.status === 'IN_CONSULTATION');
  const done = walkIns.filter(w => w.status === 'DONE');

  return {
    walkIns,
    waiting,
    inConsultation,
    done,
    loading,
    error,
    refresh: fetchQueue,
    updateStatus,
  };
};

export default useQueue;