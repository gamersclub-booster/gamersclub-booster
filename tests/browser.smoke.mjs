import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { listing, room } from './helpers.mjs';

const root = fileURLToPath( new URL( '../', import.meta.url ) );
async function removeProfile( profile ) {
  if ( resolve( dirname( profile ) ) !== resolve( tmpdir() ) || !basename( profile ).startsWith( 'gcb-kdr-browser-' ) ) {
    throw new Error( 'Refusing to remove a path outside the temporary browser profile directory' );
  }
  await rm( profile, { recursive: true, force: true } );
}
const html = `<!doctype html><html lang="pt-BR"><meta charset="UTF-8"><title>Teste local — KDR Filters</title><style>
  body{background:#0e1420;color:#e6edf7;font:14px system-ui;padding:32px;max-width:1160px;margin:auto}
  h1{font-size:26px;margin-bottom:6px}body>p{color:#a6b4cb}#lobby-filters-container{margin:24px 0;color:#a6b4cb}
  #lobbies-wrapper{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  article{background:#1b2434;border:1px solid #35445d;border-radius:8px;padding:16px}
  .LobbyPlayerVertical{display:block;color:#b9d5f3;text-decoration:none;padding:9px 0}
  .join{border:0;border-radius:4px;padding:8px 20px;background:#2f83e8;color:white;margin-top:12px}
  </style><h1>GamersClub Booster · KDR Filters</h1><p>Dados de teste — validação local da extensão compilada, sem sessão GamersClub.</p>
  ${listing( room( 1, [ 2.5, 1.4, 0.6 ] ) + room( 2, [ 1.1, 1.2, 1.05 ] ) + room( 3, [ null ] ) )}</html>`;

test( 'Chromium: carrega dist MV3, filtra DOM, navega SPA, persiste e restaura', { timeout: 60000 }, async () => {
  const profile = await mkdtemp( join( tmpdir(), 'gcb-kdr-browser-' ) );
  let context;
  try {
    const dist = resolve( root, 'dist' );
    context = await chromium.launchPersistentContext( profile, {
      channel: process.env.GCB_BROWSER_EXECUTABLE ? undefined : 'chromium',
      executablePath: process.env.GCB_BROWSER_EXECUTABLE,
      ignoreDefaultArgs: [ '--disable-extensions' ],
      headless: true,
      args: [ `--disable-extensions-except=${dist}`, `--load-extension=${dist}` ],
      viewport: { width: 1280, height: 850 }
    } );
    const errors = [];
    const requests = [];
    await context.route( 'https://gamersclub.com.br/**', route => {
      requests.push( route.request().url() );
      if ( route.request().isNavigationRequest() ) {
        return route.fulfill( { contentType: 'text/html; charset=utf-8', body: html } );
      }
      return route.abort();
    } );
    const page = await context.newPage();
    page.on( 'pageerror', error => errors.push( error.message ) );
    // Start on /lobby, where the manifest injects the lobby content script.
    await page.goto( 'https://gamersclub.com.br/lobby' );
    await page.locator( '#gcb-kdr-filters' ).waitFor();
    const visible = async ( id, expected ) => {
      await page.waitForFunction( ( { id, expected } ) => {
        const card = document.getElementById( `roomCardWrapper-${id}` );
        return card && ( getComputedStyle( card ).display !== 'none' && getComputedStyle( card ).visibility !== 'hidden' ) === expected;
      }, { id, expected } );
    };
    assert.equal( await page.locator( '#gc-ext-wrapper > #gcb-kdr-filters' ).count(), 1 );
    await visible( 1, true );
    await page.locator( '[data-field="individualMin"][data-step="1"]' ).click();
    assert.equal( await page.locator( '[name="individualMin"]' ).inputValue(), '1.05' );
    await page.locator( '[data-field="individualMin"][data-step="-1"]' ).click();
    assert.equal( await page.locator( '[name="individualMin"]' ).inputValue(), '1.00' );
    assert.equal( await page.locator( '[data-action="refresh"]' ).count(), 0 );
    assert.equal( await page.locator( '.gcb-kdr-hint' ).count(), 0 );
    await page.locator( '[name="individualEnabled"]' ).check();
    await visible( 1, false );
    await visible( 2, true );
    await visible( 3, false );
    assert.match( await page.locator( '.gcb-kdr-count' ).textContent(), /1 sala exibida · 1 ocultada/ );
    await page.locator( '[name="averageMin"]' ).fill( '1,20' );
    await page.locator( '[name="averageEnabled"]' ).check();
    await visible( 2, false );
    assert.equal( await page.locator( '.gcb-kdr-empty' ).isVisible(), true );
    await page.locator( '[name="averageMin"]' ).fill( '1,00' );
    await visible( 2, true );
    await page.evaluate( () => {
      history.pushState( {}, '', '/lobby' );
      document.querySelector( '#roomCardWrapper-2 .LobbyRoom__lineup' ).insertAdjacentHTML( 'beforeend',
        '<a class="LobbyPlayerVertical" href="/jogador/4" title="KDR: 0.60">Jogador novo</a>' );
    } );
    await visible( 2, false );
    await page.evaluate( () => document.querySelector( '#roomCardWrapper-2 .LobbyRoom__lineup' ).lastElementChild.remove() );
    await visible( 2, true );
    // Blur flushes the decimal preference before navigating away.
    await page.locator( '[name="averageMin"]' ).blur();
    await mkdir( resolve( root, 'artifacts' ), { recursive: true } );
    await page.screenshot( { path: resolve( root, 'artifacts/kdr-filters-preview.png' ), fullPage: true } );
    await page.goto( 'https://gamersclub.com.br/lobby' );
    await page.locator( '#gcb-kdr-filters' ).waitFor();
    assert.equal( await page.locator( '[name="individualEnabled"]' ).isChecked(), true );
    assert.equal( await page.locator( '[name="averageEnabled"]' ).isChecked(), true );
    await visible( 1, false );
    const counterRect = () => page.locator( '.gcb-kdr-count' ).evaluate( node => {
      const rect = node.getBoundingClientRect();
      return { right: rect.right, width: rect.width };
    } );
    const beforeLoading = await counterRect();
    await page.evaluate( () => {
      const wrapper = document.createElement( 'div' );
      wrapper.id = 'roomCardWrapper-99';
      wrapper.style.cssText = 'margin-top:1800px;height:240px';
      wrapper.innerHTML = '<article class="CardSkeleton" style="height:240px">Carregando</article>';
      document.getElementById( 'lobbies-wrapper' ).append( wrapper );
      const observer = new IntersectionObserver( entries => {
        if ( !entries.some( entry => entry.isIntersecting ) ) { return; }
        wrapper.innerHTML = '<article class="LobbyRoom"><h3 class="LobbyRoom__title">Progressiva</h3>' +
          '<div class="LobbyRoom__lineup" id="lobby-99">' +
          '<a class="LobbyPlayerVertical" href="/jogador/999" title="KDR: 1.10 Level: 10">Jogador</a></div></article>';
        observer.disconnect();
      } );
      observer.observe( wrapper );
    } );
    await page.waitForFunction( () => JSON.parse( document.getElementById( 'gcb-kdr-filters' ).dataset.counts ).loading === 1 );
    assert.equal( await page.locator( '#roomCardWrapper-99 .CardSkeleton' ).count(), 1 );
    const duringLoading = await counterRect();
    assert.ok( Math.abs( beforeLoading.right - duringLoading.right ) < 0.5 );
    assert.ok( Math.abs( beforeLoading.width - duringLoading.width ) < 0.5 );
    // User scroll: the extension itself does not scroll or request data.
    await page.locator( '#roomCardWrapper-99' ).scrollIntoViewIfNeeded();
    await page.locator( '#roomCardWrapper-99 .gcbooster-kdr-media' ).waitFor();
    const afterLoading = await counterRect();
    assert.ok( Math.abs( beforeLoading.right - afterLoading.right ) < 0.5 );
    assert.ok( Math.abs( beforeLoading.width - afterLoading.width ) < 0.5 );
    await page.evaluate( () => window.scrollTo( 0, 0 ) );
    assert.equal( await page.locator( '#roomCardWrapper-99 .gcbooster-kdr-media' ).textContent(), 'KDR Médio: 1.10' );
    await page.getByRole( 'button', { name: 'Restaurar padrão' } ).click();
    await visible( 1, true );
    await visible( 3, true );
    assert.equal( await page.locator( '#gcb-kdr-filters' ).count(), 1 );
    // Also load the original lobby bundle and exercise a normal new player.
    await page.goto( 'https://gamersclub.com.br/lobby' );
    await page.locator( '#gcb-kdr-filters' ).waitFor();
    await page.locator( '[name="individualEnabled"]' ).check();
    await visible( 2, true );
    await page.evaluate( () => document.querySelector( '#roomCardWrapper-2 .LobbyRoom__lineup' ).insertAdjacentHTML( 'beforeend',
      '<a class="LobbyPlayerVertical" href="/jogador/4" title="KDR: 0.60 Level: 20">Jogador novo</a>' ) );
    await visible( 2, false );
    await page.locator( '#roomCardWrapper-2 #gcbooster_kdr_span' ).first().waitFor( { state: 'attached' } );
    assert.deepEqual( errors, [], 'No page errors in the compiled content scripts' );
    assert.equal( requests.some( url => /\/api\//.test( url ) ), false, 'KDR filters must not fetch API data' );
    console.log( `Lobby checks passed: ${context.browser().version()}; synthetic data only.` );
    // Document route-scoped injection: pushState alone cannot load an uninjected content script.
    await page.goto( 'https://gamersclub.com.br/home' );
    assert.equal( await page.locator( '#gcb-kdr-filters' ).count(), 0 );
    await page.evaluate( () => history.pushState( {}, '', '/lobby' ) );
    await page.evaluate( () => new Promise( resolve => requestAnimationFrame( () => requestAnimationFrame( resolve ) ) ) );
    assert.equal( await page.locator( '#gcb-kdr-filters' ).count(), 0,
      'An external SPA entry requires a document reload; this limitation is documented' );
    await page.reload();
    await page.locator( '#gc-ext-wrapper > #gcb-kdr-filters' ).waitFor();
  } finally {
    await context?.close();
    await removeProfile( profile );
  }
} );
