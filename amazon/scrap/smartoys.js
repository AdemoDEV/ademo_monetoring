import { notifyDiscord } from "../utils/Discord.js";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

const PRODUCT_URLS = ["https://www.smartoys.be/catalog/trading-cards-pokmon-jcc-pokmon-jcc-coffret-zacian-nabil-p-0196214106598.html"];
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340824292102770708/PAlYwwPKVWw1aN3XxdEYRMMWEeNZxLjlLgTyRH-OSXSWSM2BqRNEzHPYpfNPiFI7VUlo";

export async function Ademo_CheckSmartoys(browser) {
    for (URL of PRODUCT_URLS) {
    const page = await browser.newPage();
    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    

    try {
        await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        let product = await parse_results(page);
        if (!product || product.title === "Produit inconnu") {
            console.warn("⚠️ Impossible d'extraire le produit.");
            return;
        }
        console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
        await notifyDiscord(product, DISCORD_WEBHOOK_URL, "smartoys");
    } catch (err) {
        console.error("❌ Erreur lors du scraping :", err);
        const failedContent = await page.content();
        console.log("⚠️ Debug HTML après erreur :", failedContent.slice(0, 2000));
    } finally {
        await page.close();
    }
 }
}

async function parse_results(page) {
    return await page.evaluate(() => {
        const title = document.querySelector("#productName")?.innerText.trim() || "Produit inconnu";
        const priceWeb = document.querySelector("#prod_price")?.innerText || "Non disponible";
        const price2 = document.querySelector("#product-price-sm")?.innerText || "";
        let price = priceWeb + price2;
        const imageElement = document.querySelector("img.xzoom-gallery");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href};
    });
}
