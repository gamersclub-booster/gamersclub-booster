import { GC_URL } from '../../lib/constants';
import axios from 'axios';


export const coletarDailyRewards = async () => {
  const response = await fetch( 'https://gamersclub.com.br/daily-rewards' );
  const page = await response.text();
  const token = page.match( /token: '(\S+)'/ )[1];

  const authToken = localStorage.getItem( 'gc:authToken' );
  const productSession = localStorage.getItem( 'gc:product' );
  const headers = {
    'authorization': `Bearer ${authToken}`,
    'x-product-session': `${productSession}`
  };

  axios.post( `https://${ GC_URL }/api/missions/daily-rewards/claim`, { token }, { headers } ).then( () => {
    localStorage.setItem( 'daily_rewards_claim_date', `"${new Date().toISOString()}"` );

    const dailyRewardsBtn = document.querySelector( '[href="/daily-rewards"]' );
    if ( dailyRewardsBtn ) {
      dailyRewardsBtn.querySelector( 'span.MainMenu__itemNewsIcon' )?.remove();
      dailyRewardsBtn.querySelector( '.MainMenu__itemLabel' ).classList.remove( 'MainMenu__itemLabel--hasNews' );
    }

    chrome.storage.sync.set( { lastCollectedDailyRewardsTs: Date.now() } );
  } );
};
