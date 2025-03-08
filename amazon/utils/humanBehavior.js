/**
 * Utilitaires pour la simulation de comportement humain
 * Aide à contourner la détection de bot par Datadome
 */

/**
 * Génère des mouvements de souris aléatoires sur la page
 */
export async function generateMouseMovements(page) {
    await page.evaluate(() => {
        const points = [];
        const numPoints = 10 + Math.floor(Math.random() * 10);
        
        // Génère des points de contrôle aléatoires
        for (let i = 0; i < numPoints; i++) {
            points.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                timestamp: Date.now() + i * (100 + Math.random() * 200)
            });
        }

        // Simule les mouvements de souris entre les points
        points.forEach(point => {
            setTimeout(() => {
                const event = new MouseEvent('mousemove', {
                    bubbles: true,
                    cancelable: true,
                    clientX: point.x,
                    clientY: point.y,
                    screenX: point.x,
                    screenY: point.y,
                    movementX: 5 - Math.random() * 10,
                    movementY: 5 - Math.random() * 10
                });
                document.dispatchEvent(event);
            }, point.timestamp - Date.now());
        });
    });
}

/**
 * Génère un délai aléatoire entre min et max millisecondes
 */
export async function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Simule des frappes de clavier aléatoires
 */
export async function simulateKeystrokes(page, text) {
    for (const char of text) {
        await page.keyboard.type(char, {
            delay: 50 + Math.random() * 150
        });
    }
}

/**
 * Simule un scroll naturel
 */
export async function naturalScroll(page) {
    await page.evaluate(() => {
        return new Promise((resolve) => {
            let currentScroll = 0;
            const maxScroll = Math.min(
                document.documentElement.scrollHeight - window.innerHeight,
                2000
            );
            
            const scroll = () => {
                if (currentScroll >= maxScroll) {
                    resolve();
                    return;
                }

                const step = Math.floor(10 + Math.random() * 30);
                currentScroll = Math.min(currentScroll + step, maxScroll);
                
                window.scrollTo({
                    top: currentScroll,
                    behavior: 'smooth'
                });

                setTimeout(scroll, 100 + Math.random() * 200);
            };

            scroll();
        });
    });
}
