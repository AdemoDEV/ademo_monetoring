import {notifyDiscord} from "../utils/Discord.js"
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

const URL = "https://www.dreamland.be/e/fr/dl/pok%C3%A9mon-tcg-premium-collection-darkrai-vstar-ang-165977";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340506949740924982/oZO3U011AmHa0TGu_nffrXdwmFmBvlwOoYcRanwjJ-vHauoet6cEHEOe8n4GPCh7p_HI";

export async function Ademo_CheckDreamLand(browser) {
    const page = await browser.newPage();

    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");
    
    try {
        await page.goto(URL, { waitUntil: "networkidle2" });
        let product = await parse_results(page);
        if (product.length === 0) {
            console.warn("⚠️ Aucun produit trouvé, vérifie le sélecteur ou le chargement JS.");
            return;
        }
        console.log(`📢 NOUVEAU ou DE RETOUR EN STOCK : ${product.title}, Prix: ${product.price}`);
        await notifyDiscord(product, DISCORD_WEBHOOK_URL, "dreamland");

    } catch (err) {
        console.error("❌ Erreur lors du scraping :", err);
    } finally {
        await page.close();
    }
}

async function parse_results(page) {
    return await page.evaluate(() => {
        const title = document.querySelector("h1.main_header")?.innerText.trim() || "Produit inconnu";
        const priceWeb = document.querySelector("span.price__main")?.innerText || "Non disponible";
        const price2 = document.querySelector("span.price__decimals")?.innerText || "";
        let price = priceWeb !== "Non disponible" && price2 ? `${priceWeb},${price2}` : priceWeb;
        const imageElement = document.querySelector("#productMainImage");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href};
    });
}

