import { notifyDiscord } from "../utils/Discord.js";
import { ComportementHumain } from "../utils/HumainComportement.js";
import { simulateHumanMouseMovements } from "../utils/HumainComportement.js";
import { autoScroll } from "../utils/HumainComportement.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";
const URL = "https://www.king-jouet.com/fr-be/jeu-jouet/jeux-societes/cartes-a-collectionner/ref-979937-coffret-pokemon--combined-powers--premium-collection-eng-.htm";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1341888650530525246/uGkh3jSnfZaValdAzShfFqVT0ul-c0ccooGPf_VVE34zQ1VT3VH9M9_lT7O-jaFkuf_V";
const COOKIES_PATH = path.resolve(__dirname, "cookies.json");

export async function Ademo_CheckKingJouet(browser) {
    const page = await browser.newPage();
    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Referer': 'https://www.google.com',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Connection': 'keep-alive',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1'
    });
    if (fs.existsSync(COOKIES_PATH)) { 
        const rawCookies = JSON.parse(fs.readFileSync(COOKIES_PATH, "utf-8"));

        // Adapter les cookies pour Puppeteer
        const cookies = rawCookies.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            expires: cookie.expirationDate ? cookie.expirationDate : -1,
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            sameSite: cookie.sameSite || 'Lax'
        }));

        await page.setCookie(...cookies);
        console.log("🍪 Cookies chargés avec succès !");
    } else {
        console.warn("⚠️ Fichier de cookies non trouvé !");
    }
    await page.setViewport({
        width: 1280,
        height: 800,
        isMobile: false,
        hasTouch: false
    });

    await page.evaluateOnNewDocument(() => {
        delete navigator.__proto__.webdriver;
        Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
        Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr'] });
        window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {} };
        // Simuler le deviceMemory et le hardwareConcurrency
        Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
    });
    try {
        await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
        await page.mouse.move(100, 100);
        await page.mouse.click(200, 200);
        await page.keyboard.type("test");
        await ComportementHumain(page);
        await simulateHumanMouseMovements(page);
        await autoScroll(page);
        console.log("🔍 Extraction des informations du produit...");

        let product = await parseProduct(page);
        if (!product || product.title === "Produit inconnu") {
            console.warn("⚠️ Impossible d'extraire le produit.");
            return;
        }
        console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
        await notifyDiscord(product, DISCORD_WEBHOOK_URL, "fnac");
    } catch (err) {
        console.error("❌ Erreur lors du scraping :", err);
    } finally {
        await page.close();
    }
}

async function parseProduct(page) {
    await page.waitForSelector("div.lg\\:bg-white.px-2.lg\\:py-4 h1 span", { timeout: 5000 });
    return await page.evaluate(() => {
        const title = document.querySelector("div.lg\\:bg-white.px-2.lg\\:py-4 h1 span")?.innerText.trim() || "Produit inconnu";
        const priceElement = document.querySelector("span.prix");
        let price = priceElement ? priceElement.innerText.trim() : "Non disponible";
        const imageElement = document.querySelector("img.h-full.mx-auto.w-auto.object-scale-down");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href};
    });
}
