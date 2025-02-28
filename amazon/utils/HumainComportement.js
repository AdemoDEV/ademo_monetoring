
export async function ComportementHumain(page) {
    console.log("🕒 Attente pour simuler un comportement humain...");
    await page.mouse.move(100, 100, { steps: 20 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.mouse.move(500, 200, { steps: 30 });
    await new Promise(resolve => setTimeout(resolve, 1500));
    await page.mouse.click(500, 200);
    await page.keyboard.press('ArrowDown');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.mouse.move(300, 300, { steps: 15 });
    await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
}

export async function simulateHumanMouseMovements(page) {
    const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    for (let i = 0; i < 100; i++) {
        const x = Math.floor(Math.random() * 1280);
        const y = Math.floor(Math.random() * 800);
        await page.mouse.move(x, y, { steps: randomDelay(5, 20) });
        await new Promise(r => setTimeout(r, randomDelay(100, 500)));
    }
}

export async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= document.body.scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, Math.floor(Math.random() * 300) + 100);
        });
    });
}