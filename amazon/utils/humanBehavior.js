export function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

export async function simulateMouseMovements(driver) {
    try {
        const actions = driver.actions({async: true});
        // Mouvements aléatoires de la souris
        for (let i = 0; i < 3; i++) {
            const x = Math.floor(Math.random() * 800);
            const y = Math.floor(Math.random() * 600);
            await actions.move({x, y}).pause(500).perform();
        }
    } catch (error) {
        console.warn("⚠️ Erreur lors de la simulation des mouvements de souris:", error);
    }
}

export async function simulateNaturalScroll(driver) {
    try {
        await driver.executeScript(`
            const scrollHeight = document.documentElement.scrollHeight;
            const viewportHeight = window.innerHeight;
            const scrollSteps = Math.floor(Math.random() * 3) + 2; // 2-4 étapes
            
            for (let i = 0; i < scrollSteps; i++) {
                const targetScroll = Math.floor((scrollHeight - viewportHeight) * (i + 1) / scrollSteps);
                window.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            }
        `);
        await randomDelay(500, 1000);
    } catch (error) {
        console.warn("⚠️ Erreur lors de la simulation du scroll:", error);
    }
}


export async function getCountryFromURL(url) {
    const domain = new URL(url).hostname;
    const parts = domain.split(".");
    if (parts.length >= 2) {
        return parts[parts.length - 1].toUpperCase();
    }
    return "Pays inconnu";
}