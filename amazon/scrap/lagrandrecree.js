import { notifyDiscord } from "../utils/Discord.js";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";
const URL = "https://www.lagranderecre.fr/jeux-de-societe/cartes-a-collectionner/coffret-dresseur-d-elite-pokemon-ecarlate-et-violet-extension-6-mascarade-crepusculaire.html";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1341520624303996950/8UdDlWLHJgV5bpxMXTj_CIoKTBX7QviqUBLJTN-Coc3SkQoofxmUg8n1Icogo6afnXtQ";

export async function Ademo_CheckLaGrandRecre(browser) {
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
        console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}, Disponibilité: ${product.stock}`);
        await notifyDiscord(product, DISCORD_WEBHOOK_URL, "lagranderecre", true, product.stock);
    } catch (err) {
        console.error("❌ Erreur lors du scraping :", err);
    } finally {
        await page.close();
    }
}

async function parse_results(page) {
    return await page.evaluate(() => {
        const title = document.querySelector("h1")?.innerText.trim() || "Produit inconnu";
        const priceElement = document.querySelector(".scalapay-price");
        let price = priceElement ? priceElement.innerText.trim() : "Non disponible";
        const stockElement = document.querySelector(".stock-availability .unavailable");
        let stock = stockElement ? "Indisponible" : "Disponible";
        const imageElement = document.querySelector(".media-visuals-main-img");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href, stock};
    });
}

