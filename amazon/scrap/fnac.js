import { notifyDiscord } from "../utils/Discord.js";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

// const PRODUCT_URLS = ["https://www.fr.fnac.be/Carte-a-collectionner-Pokemon-Coffret-Collection-Premium-Dracaufeu-ex/a17884220"];
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1341888650530525246/uGkh3jSnfZaValdAzShfFqVT0ul-c0ccooGPf_VVE34zQ1VT3VH9M9_lT7O-jaFkuf_V";

export async function Ademo_CheckFnac(browser, PRODUCT_URLS) {
    for (const URL of PRODUCT_URLS) {
    const page = await browser.newPage();
    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    
    try {
        console.log(`🌐 Navigation vers : ${URL}`);
        await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
        let product = await parseProduct(page);
        if (!product || product.title === "Produit inconnu") {
            console.warn("⚠️ Impossible d'extraire le produit.");
            return;
        }
         if (product.price !== "Non disponible") {
            console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
            await notifyDiscord(product, DISCORD_WEBHOOK_URL, "fnac", false, "non", true, "✅ Disponible", true);
        } else {
            console.log(`📢 Produit indisponible : ${product.title}, Prix: ${product.price}`);
        }
        const delay = 5000 + Math.random() * 5000;
        console.log(`⏱️ Attente de ${Math.round(delay / 1000)} secondes avant le prochain produit...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    } catch (err) {
        console.error("❌ Erreur lors du scraping :", err);
    } finally {
        await page.close();
    }
  }
}

async function parseProduct(page) {
    return await page.evaluate(() => {
        const title = document.querySelector("h1.f-productHeader__heading")?.innerText.trim() || "Produit inconnu";
        const priceElement = document.querySelector(".f-faPriceBox__price.userPrice.checked");
        let price = priceElement ? priceElement.innerText.trim() : "Non disponible";
        const imageElement = document.querySelector(".f-productMedias__viewItem--main");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href};
    });
}
