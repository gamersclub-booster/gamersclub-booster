// Torna um painel (criado em position:absolute dentro de um overlay fixo)
// arrastável pelo header. Troca a ancoragem bottom/right inicial para
// top/left na primeira interação, e trava o arrasto dentro da viewport.
export const makeDraggable = ( $container, $handle ) => {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const onMouseMove = e => {
    if ( !dragging ) { return; }
    const width = $container.outerWidth();
    const height = $container.outerHeight();
    const left = Math.min( Math.max( e.clientX - offsetX, 0 ), window.innerWidth - width );
    const top = Math.min( Math.max( e.clientY - offsetY, 0 ), window.innerHeight - height );
    $container.css( { left: `${left}px`, top: `${top}px`, right: 'auto', bottom: 'auto' } );
  };

  const onMouseUp = () => {
    dragging = false;
    $( document ).off( 'mousemove.gcbooster_drag mouseup.gcbooster_drag' );
  };

  $handle.on( 'mousedown', e => {
    // Não inicia o arrasto se o clique for em um botão/link do header (fechar, abas, etc.)
    if ( $( e.target ).closest( 'button, a' ).length > 0 ) { return; }

    e.preventDefault();
    dragging = true;

    const rect = $container[0].getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    $( document ).on( 'mousemove.gcbooster_drag', onMouseMove );
    $( document ).on( 'mouseup.gcbooster_drag', onMouseUp );
  } );
};
