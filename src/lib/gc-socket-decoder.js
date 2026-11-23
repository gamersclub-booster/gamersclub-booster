/* eslint-disable no-bitwise */
/**
 * ============================================================
 * @file        gc-socket-decoder.js
 * @author      Caio Felipe - https://github.com/caiofelipedossantos
 * @version     1.0.2
 * @date        2026-11-18
 * @license     MIT
 *
 * @description
 *   Biblioteca core de decodificação de pacotes WebSocket
 *   binários no formato Protobuf utilizado pela plataforma
 *   GamerClub. Expõe a classe `GCSocketDecoder` para ser
 *   consumida por extensões, scripts ou ferramentas externas
 *   sem qualquer dependência de DOM ou ambiente de browser.
 *
 *
 *   SEGUE A TABELA DE DADOS DOS PLAYERS - 2026-11-19
 *
 *   field  1: player_id (varint)
 *   field  2: name      (string)
 *   field  4: pais      (string)
 *   field  5: level     (varint)
 *   field 11: kdr       (float32 / wire=5)
 *   field 12: mID       (varint) -> ID da Medalha
 *   field 13: nome      (string) -> Nome da Medalha
 *   field 14: steam_id  (string)
 *   field 15: moldura do avatar (string)
 *   field 21: accountid (string)
 *
 *   CAMPO 17 SEM IDENTIFICAÇÃO
 *   CAMPOS 24 e 25 NÃO IDENTIFIQUEI AINDA, PARECE SER DO RANK DA SEASON
 *
 *
 *
 * @purpose
 *   Prover um decoder reutilizável e isolado para:
 *     • Interceptar mensagens WebSocket binárias (ArrayBuffer/Blob)
 *     • Decodificar o envelope Protobuf dos pacotes GamerClub
 *     • Extrair sala, mapa, jogo e jogadores (nome, steam_id,
 *       level, KDR) de cada mensagem recebida
 *     • Notificar consumidores via callback `onMessage`
 *
 * ============================================================
 * FLUXO DO PROCESSO
 * ============================================================
 *
 *  WebSocket (binário)
 *       │
 *       ▼
 *  ┌─────────────────────────────────────────────────────┐
 *  │  GCSocketDecoder.attach(socket)                     │
 *  │  Registra listener de "message" no socket           │
 *  └────────────────────┬────────────────────────────────┘
 *                       │  event.data
 *                       ▼
 *            ┌──────────────────────┐
 *            │  ArrayBuffer / Blob  │
 *            │  → normaliza para    │
 *            │    Uint8Array        │
 *            └──────────┬───────────┘
 *                       │
 *                       ▼
 *  ┌─────────────────────────────────────────────────────┐
 *  │  _parseProtobuf(bytes)                              │
 *  │  Lê campos tag/wire-type/value do envelope raiz     │
 *  └────────────────────┬────────────────────────────────┘
 *                       │  field 36 (wire=2) → payload
 *                       ▼
 *  ┌─────────────────────────────────────────────────────┐
 *  │  _parseProtobuf(payload)  — nível da sala           │
 *  │  Extrai:                                            │
 *  │    field  1  → room_id  (varint)                    │
 *  │    field 14  → players[]  (length-delimited)        │
 *  │    field 20  → map       (string)                   │
 *  │    field 21  → game      (string)                   │
 *  └────────────────────┬────────────────────────────────┘
 *                       │  cada item field 14
 *                       ▼
 *  ┌─────────────────────────────────────────────────────┐
 *  │  _parseProtobuf(playerBytes) — nível do jogador     │
 *  │  Extrai:                                            │
 *  │    field  2  → name      (string)                   │
 *  │    field  5  → level     (varint)                   │
 *  │    field 11  → kdr       (float32 / wire=5)         │
 *  │    field 14  → steam_id  (string)                   │
 *  └────────────────────┬────────────────────────────────┘
 *                       │
 *                       ▼
 *  ┌─────────────────────────────────────────────────────┐
 *  │  Monta objeto DecodedMessage                        │
 *  │  { room_id, game, map, players[] }                  │
 *  └────────────────────┬────────────────────────────────┘
 *                       │
 *                       ▼
 *            onMessage(DecodedMessage, socketUrl)
 *            (callback registrado pelo consumidor)
 *
 * ============================================================
 */

'use strict';

/**
 * @typedef {Object} DecodedPlayer
 * @property {string|null} name     - Nick do jogador
 * @property {string|null} steam_id - Steam ID 64 bits
 * @property {number|null} level    - Nível na plataforma
 * @property {number|null} kdr      - Kill/Death Ratio (float32)
 */

/**
 * @typedef {Object} DecodedMessage
 * @property {string|null}   room_id  - ID da sala
 * @property {string|null}   game     - Modalidade do jogo
 * @property {string|null}   map      - Mapa selecionado
 * @property {DecodedPlayer[]} players - Lista de jogadores decodificados
 */

class GCSocketDecoder {

  // ----------------------------------------------------------
  // CONSTRUTOR
  // ----------------------------------------------------------

  /**
     * Cria uma instância do decoder.
     *
     * @param {Object}   [options={}]            - Opções de configuração
     * @param {Function} [options.onMessage]      - Callback chamado ao decodificar
     *                                             uma mensagem válida.
     *                                             Assinatura: (msg: DecodedMessage, url: string) => void
     * @param {boolean}  [options.debug=false]    - Habilita logs de depuração
     *
     * @example
     * const decoder = new GCSocketDecoder({
     *   onMessage: (msg, url) => console.log(msg),
     *   debug: true
     * });
     */
  constructor( { onMessage = null, debug = false } = {} ) {
    /** @type {Function|null} */
    this.onMessage = onMessage;

    /** @type {boolean} */
    this.debug = debug;

    /** @private */
    this._decoder = new TextDecoder();

    /** @private — sockets já monitorados */
    this._monitored = new WeakSet();
  }

  // ----------------------------------------------------------
  // API PÚBLICA
  // ----------------------------------------------------------

  /**
     * Anexa o decoder a um WebSocket existente.
     * Registra listener de "message" e processa cada frame binário.
     * É seguro chamar múltiplas vezes no mesmo socket (idempotente).
     *
     * @param {WebSocket} socket - Instância do WebSocket a monitorar
     * @returns {void}
     */
  attach( socket ) {
    if ( this._monitored.has( socket ) ) { return; }

    this._monitored.add( socket );

    socket.addEventListener( 'message', event => {
      if ( event.data instanceof ArrayBuffer ) {
        this._handleBuffer( event.data, socket.url );

      } else if ( event.data instanceof Blob ) {
        event.data
          .arrayBuffer()
          .then( buffer => this._handleBuffer( buffer, socket.url ) )
          .catch( err => this._debug( '[GCSocketDecoder] Blob.arrayBuffer() falhou:', err ) );
      }
    } );

    this._log( `[GCSocketDecoder] Socket anexado: ${socket.url}` );
  }

  /**
     * Processa um frame bruto e notifica via onMessage se a mensagem for válida.
     * Interface pública para processamento externo sem expor _handleBuffer.
     *
     * @param {ArrayBuffer} buffer   - Dados binários do pacote
     * @param {string}      [url=""] - URL de origem (informativo)
     * @returns {void}
     */
  processFrame( buffer, url = '' ) {
    this._handleBuffer( buffer, url );
  }

  /**
     * Decodifica diretamente um ArrayBuffer sem necessidade de socket.
     * Útil para testes unitários ou reprocessamento de dados gravados.
     *
     * @param {ArrayBuffer} buffer    - Dados binários do pacote
     * @param {string}      [url=""]  - URL de origem (informativo)
     * @returns {DecodedMessage|null} Objeto decodificado ou null se inválido
     */
  decode( buffer, url = '' ) {
    try {
      const bytes = new Uint8Array( buffer );
      if ( !bytes.length ) { return null; }
      return this._decodeMessage( bytes );
    } catch ( error ) {
      this._debug( `[GCSocketDecoder] Erro ao decodificar buffer (${url}):`, error );
      return null;
    }
  }

  // ----------------------------------------------------------
  // PROCESSAMENTO INTERNO
  // ----------------------------------------------------------

  /**
     * @private
     * Recebe um ArrayBuffer, converte para Uint8Array e decodifica.
     *
     * @param {ArrayBuffer} buffer
     * @param {string}      url
     */
  _handleBuffer( buffer, url ) {
    try {
      const bytes = new Uint8Array( buffer );
      if ( !bytes.length ) { return; }

      const result = this._decodeMessage( bytes );

      if ( !result || !result.room_id ) { return; }

      if ( typeof this.onMessage === 'function' ) {
        this.onMessage( result, url );
      }

    } catch ( error ) {
      this._debug( '[GCSocketDecoder] Pacote não reconhecido:', error );
    }
  }

  // ----------------------------------------------------------
  // DECODER DE MENSAGEM
  // ----------------------------------------------------------

  /**
     * @private
     * Decodifica o envelope Protobuf e extrai os dados da sala.
     *
     * Estrutura esperada:
     *   Envelope raiz
     *     └─ field 36 (wire=2) → payload da sala
     *          ├─ field  1 (wire=0) → room_id
     *          ├─ field 14 (wire=2) → player (repetido)
     *          ├─ field 20 (wire=2) → map
     *          └─ field 21 (wire=2) → game
     *
     * @param {Uint8Array} bytes
     * @returns {DecodedMessage|null}
     */
  _decodeMessage( bytes ) {
    const envelope = this._parseProtobuf( bytes );

    const main = envelope.find(
      f => f.field === 36 && f.wire === 2
    );

    if ( !main ) { return null; }

    const fields = this._parseProtobuf( main.value );

    const roomField = fields.find( f => f.field === 1 && f.wire === 0 );
    const mapField = fields.find( f => f.field === 20 && f.wire === 2 );
    const gameField = fields.find( f => f.field === 21 && f.wire === 2 );
    const playerRows = fields.filter( f => f.field === 14 && f.wire === 2 );

    const players = playerRows.map( item => this._decodePlayer( item.value ) );

    return {
      room_id: roomField ? String( roomField.value ) : null,
      game: gameField ? this._getString( gameField ) : null,
      map: mapField ? this._getString( mapField ) : null,
      players
    };
  }

  /**
     * @private
     * Decodifica o sub-bloco Protobuf de um único jogador.
     *
     * Estrutura esperada:
     *   field  2 (wire=2) → name
     *   field  5 (wire=0) → level
     *   field 11 (wire=5) → kdr (float32, little-endian)
     *   field 14 (wire=2) → steam_id
     *
     * @param {Uint8Array} bytes
     * @returns {DecodedPlayer}
     */
  _decodePlayer( bytes ) {
    const player = this._parseProtobuf( bytes );

    const idField = player.find( f => f.field === 1 && f.wire === 0 );
    const nameField = player.find( f => f.field === 2 && f.wire === 2 );
    const levelField = player.find( f => f.field === 5 && f.wire === 0 );
    const kdrField = player.find( f => f.field === 11 && f.wire === 5 );
    const steamField = player.find( f => f.field === 14 && f.wire === 2 );

    const levelNum = levelField ? Number( levelField.value ) : null;
    const level = ( Number.isSafeInteger( levelNum ) && levelNum >= 0 ) ? levelNum : null;

    return {
      id: idField ? String( idField.value ) : null,
      name: nameField ? this._getString( nameField ) : null,
      steam_id: steamField ? this._getString( steamField ) : null,
      level,
      kdr: kdrField ? this._getFloat32( kdrField ) : null
    };
  }

  // ----------------------------------------------------------
  // PARSER PROTOBUF GENÉRICO
  // ----------------------------------------------------------

  /**
     * @private
     * Analisa um bloco de bytes no formato Protobuf binário.
     * Suporta wire types:
     *   0 → Varint
     *   1 → Fixed 64-bit
     *   2 → Length-delimited (string, bytes, embedded message)
     *   5 → Fixed 32-bit
     *
     * @param {Uint8Array} data
     * @returns {Array<{field:number, wire:number, value:*}>}
     * @throws {Error} Se o formato for inválido ou truncado
     */
  _parseProtobuf( data ) {
    const fields = [];
    const state = { pos: 0 };

    while ( state.pos < data.length ) {
      const tag = Number( this._readVarint( data, state ) );
      const field = tag >>> 3;
      const wire = tag & 7;

      if ( !field ) { throw new Error( 'Campo inválido (field=0)' ); }

      if ( wire === 0 ) {
        // Varint
        fields.push( { field, wire, value: this._readVarint( data, state ) } );

      } else if ( wire === 1 || wire === 5 ) {
        // Fixed 64 / Fixed 32
        const size = wire === 1 ? 8 : 4;

        if ( state.pos + size > data.length ) {
          throw new Error( 'Campo fixo truncado' );
        }

        fields.push( {
          field,
          wire,
          value: data.slice( state.pos, state.pos + size )
        } );

        state.pos += size;

      } else if ( wire === 2 ) {
        // Length-delimited
        const length = Number( this._readVarint( data, state ) );

        if (
          !Number.isSafeInteger( length ) ||
                    length < 0 ||
                    state.pos + length > data.length
        ) {
          throw new Error( 'Campo delimitado inválido ou truncado' );
        }

        fields.push( {
          field,
          wire,
          value: data.slice( state.pos, state.pos + length )
        } );

        state.pos += length;

      } else {
        throw new Error( `Wire type não suportado: ${wire}` );
      }
    }

    return fields;
  }

  // ----------------------------------------------------------
  // LEITURA DE TIPOS PRIMITIVOS
  // ----------------------------------------------------------

  /**
     * @private
     * Lê um inteiro de largura variável (varint) conforme spec Protobuf.
     * Limita a leitura a no máximo 10 bytes e valida o 10º byte contra overflow.
     *
     * @param {Uint8Array}      data
     * @param {{ pos: number }} state - Cursor de leitura (mutado in-place)
     * @returns {bigint}
     * @throws {Error} Se o varint for incompleto ou exceder 10 bytes / 64 bits
     */
  _readVarint( data, state ) {
    let result = 0n;
    let shift = 0n;
    let bytesRead = 0;

    while ( state.pos < data.length ) {
      const byte = data[state.pos++];
      bytesRead++;

      if ( bytesRead > 10 ) {
        throw new Error( 'Varint excedeu o tamanho máximo permitido (10 bytes)' );
      }

      if ( bytesRead === 10 ) {
        if ( ( byte & 0x80 ) !== 0 ) {
          throw new Error( 'Varint overflow no 10º byte' );
        }
        result |= BigInt( byte & 0x7f ) << shift;
        return result;
      }

      result |= BigInt( byte & 0x7f ) << shift;

      if ( !( byte & 0x80 ) ) { return result; }

      shift += 7n;
    }

    throw new Error( 'Varint incompleto — stream encerrou inesperadamente' );
  }

  /**
     * @private
     * Decodifica um campo length-delimited como string UTF-8.
     *
     * @param {{ value: Uint8Array }} field
     * @returns {string}
     */
  _getString( field ) {
    return this._decoder.decode( field.value );
  }

  /**
     * @private
     * Decodifica um campo Fixed32 (wire=5) como float32 little-endian.
     * Rejeita NaN e Infinity, retornando null nesses casos.
     *
     * @param {{ value: Uint8Array }} field
     * @returns {number|null} Valor float finito ou null se inválido
     */
  _getFloat32( field ) {
    if (
      !( field.value instanceof Uint8Array ) ||
            field.value.length !== 4
    ) {
      return null;
    }

    const buffer = field.value.buffer.slice(
      field.value.byteOffset,
      field.value.byteOffset + field.value.byteLength
    );

    const value = new DataView( buffer ).getFloat32( 0, true );
    return Number.isFinite( value ) ? value : null;
  }

  // ----------------------------------------------------------
  // UTILITÁRIOS
  // ----------------------------------------------------------

  /**
     * @private
     * Verifica se o modo debug está ativo (via config ou window.__GC_DEBUG__).
     */
  _isDebug() {
    return Boolean( this.debug || ( typeof window !== 'undefined' && window.__GC_DEBUG__ ) );
  }

  /**
     * @private
     * Emite log se `debug` estiver habilitado.
     */
  _log( ...args ) {
    if ( this._isDebug() ) { console.log( ...args ); }
  }

  /**
     * @private
     * Emite log de depuração apenas se `debug` estiver habilitado.
     */
  _debug( ...args ) {
    if ( this._isDebug() ) { console.debug( ...args ); }
  }
}

// Exporta para ambientes modulares (ES Module)
// e também expõe globalmente para uso em scripts de browser ou testes.
export { GCSocketDecoder };

if ( typeof window !== 'undefined' ) {
  window.GCSocketDecoder = GCSocketDecoder;
}
