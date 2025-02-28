import { notifyDiscord } from "../utils/Discord.js";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";
const URL = "https://www.micromania.fr/coffret-pokemon-avril-2024-138545.html";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340448681387626648/0XphuBY_isoGsgXlVRMhyI3v5Ak0nV81I216SU2OGH8b9Pmv7y9sXXt5G44wa2ytFdOJ";

export async function Ademo_checkMicromania(browser) {
    const page = await browser.newPage();
    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    
    try {
        await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
        let product = await parse_results(page);
        if (!product || product.title === "Produit inconnu") {
            console.warn("⚠️ Impossible d'extraire le produit.");
            return;
        }
        console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
        await notifyDiscord(product, DISCORD_WEBHOOK_URL, "micromania");
    } catch (err) {
        console.error("❌ Erreur lors du scraping :", err);
    } finally {
        await page.close();
    }
}

async function parse_results(page) {
    return await page.evaluate(() => {
        const title = document.querySelector("span.text-transform-none")?.innerText.trim() || "Produit inconnu";
        const priceElement = document.querySelector("span.pricing-container.text-right");
        let price = priceElement ? priceElement.innerText.trim() : "Non disponible";
        const imageElement = document.querySelector("img.main-carousel-image-large.d-block.d-lg-none.img-fluid.mw-100.mh-100.carousel-image-large");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href};
    });
}