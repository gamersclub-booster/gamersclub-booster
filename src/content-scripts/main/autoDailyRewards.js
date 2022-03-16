import { GC_URL } from '../../lib/constants';
import axios from 'axios';


export const coletarDailyRewards = async () => {
  const authToken = localStorage.getItem( 'gc:authToken' );
  const productSession = localStorage.getItem( 'gc:product' );
  const headers = {
    'authorization': `Bearer ${authToken}`,
    'x-product-session': `${productSession}`
  };

  await axios.post( `https://missions-api.${ GC_URL }/player/daily-rewards/claim`, '', { headers } );
  chrome.storage.sync.set( { lastCollectedDailyRewardsTs: Date.now() } );
};
