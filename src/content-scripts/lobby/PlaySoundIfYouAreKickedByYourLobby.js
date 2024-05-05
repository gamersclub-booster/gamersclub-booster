export const PlaySoundIfYouAreKickedByYourLobby = mutations => {
    chrome.storage.sync.get( [ 'somReady', 'customSomReady', 'volume' ], function ( result ) {
        const som = result.somReady === 'custom' ? result.customSomReady : result.somReady;
        if (gcToastExists(mutations)) {
            const audio = new Audio( som );
            audio.play();
        }
    })
}

function gcToastExists(mutations) {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            console.log(node)
            if (!node.classList) {
                continue;
            }
            if (node.innerText.toLowerCase().includes("kickado")) {
                return true;
            }
        }
    }

    return false;
}

