import { useEffect, useState } from 'react';

import { loadCEOOperationalData } from '@/lib/ceo-data.functions';
import { CEO_SEED_DATA } from '@/lib/ceo-seed';
import type { CEOOperationalData } from '@/lib/ceo-types';

export function useCEOData() {
  const [data, setData] = useState<CEOOperationalData>(CEO_SEED_DATA);
  const [isPersisted, setIsPersisted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loadCEOOperationalData().then((result) => {
      if (!active) return;
      if (result.persisted && result.data) {
        setData(result.data);
        setIsPersisted(true);
      }
      setIsLoading(false);
    }).catch(() => active && setIsLoading(false));
    return () => { active = false; };
  }, []);

  return { data, isPersisted, isLoading };
}