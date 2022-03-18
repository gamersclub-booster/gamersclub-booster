import { GC_URL } from '../../lib/constants';
import axios from 'axios';


export const coletarDailyRewards = async () => {
  const authToken = localStorage.getItem( 'gc:authToken' );
  const productSession = localStorage.getItem( 'gc:product' );
  const headers = {
    'authorization': `Bearer ${authToken}`,
    'x-product-session': `${productSession}`
  };

  await axios.post( `https://missions-api.${ GC_URL }/player/daily-rewards/claim`, '', { headers } ).then(
    () => {
      localStorage.setItem( 'daily_rewards_claim_date', new Date().toISOString() );

      const dailyRewardsBtn = document.querySelector( '[href="/daily-rewards"]' );
      dailyRewardsBtn?.querySelector( 'span.MainMenu__itemNewsIcon' ).remove();
      dailyRewardsBtn?.querySelector( '.MainMenu__itemLabel' )
        .classList.remove( 'MainMenu__itemLabel--hasNews' );
    } );

  chrome.storage.sync.set( { lastCollectedDailyRewardsTs: Date.now() } );
};
