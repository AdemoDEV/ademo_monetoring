import { notifyDiscord } from "../utils/Discord.js";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

const URL = "https://www.guizettefamily.com/produit/case-etb-ev6-5/";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340837615812743211/cCbfcJ_dbdZWgV47sCJo-LpW3kZ1w38sxr-7c-1mFcUufS2liRfA8UU6GuvKSOO21tU4";
export async function Ademo_CheckGuiztteFamily(browser) {
    const page = await browser.newPage();
    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    
    try {
        await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        let product = await parse_results(page);
        if (product.length === 0) {
            console.warn("⚠️ Aucun produit trouvé, vérifie le sélecteur ou le chargement JS.");
            return;
        }
        console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
        await notifyDiscord(product, DISCORD_WEBHOOK_URL, "guizettefamily");
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
        const title = document.querySelector("h1.product_title.entry-title")?.innerText.trim() || "Produit inconnu";
        const priceElement = document.querySelector("p.price");
        let price = priceElement ? priceElement.innerText.trim() : "Non disponible";
        const imageElement = document.querySelector("img.flex-active");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href};
    });
}