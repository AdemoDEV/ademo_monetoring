import { notifyDiscord } from "../utils/Discord.js";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";
const URL = "https://www.e.leclerc/fp/pokemon-coffret-dresseur-d-elite-pokevx5eli-0196214105140";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340849038974779402/M_LT1AwDqezTQb3AmTeX5kZqUp6w2ztb_QTpzjZ09HBOO6f2feS6kqDneaCg6gVG4vbb";


export async function Ademo_CheckLecler(browser) {
    const page = await browser.newPage();
    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
    
    try {
        await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        let product = await parse_results(page);
        if (!product || product.title === "Produit inconnu") {
            console.warn("⚠️ Impossible d'extraire le produit.");
            return;
        }
        console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
        await notifyDiscord(product, DISCORD_WEBHOOK_URL, "leclerc");
    } catch (err) {
        console.error("❌ Erreur lors du scraping :", err);

        const failedContent = await page.content();
        console.log("⚠️ Debug HTML après erreur :", failedContent.slice(0, 2000));
    } finally {
        await page.close();
    }
}

async function parse_results(page) {
    return await page.evaluate(() => {
        const title = document.querySelector("h1.product-block-title.clamp.clamp-2")?.innerText.trim() || "Produit inconnu";
        const priceElement = document.querySelector("div.price-unit.ng-star-inserted");
        let price = priceElement ? priceElement.innerText.trim() : "Non disponible";
        const imageElement = document.querySelector("img.img-fluid");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href};
    });
}