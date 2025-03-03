import {notifyDiscord} from "../utils/Discord.js"
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340314296340713563/gqGJEs0L_2lrn7oun2z0bQjRmDrYxEIZkzPfVakkht0EZMYSFl0AgHcCuKXuZfNiuxU6";

export async function Ademo_CheckAmazon(browser, PRODUCT_URLS) {
    for (const URL of PRODUCT_URLS) {
        const page = await browser.newPage();
        await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");
        
        try {
            console.log(`🌐 Navigation vers : ${URL}`);
            await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
            let product = await parse_results(page);
            if (product.length === 0) {
                console.warn("⚠️ Aucun produit trouvé, vérifie le sélecteur ou le chargement JS.");
                return;
            }
            if (product.IsAvailable) {
                console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
                await notifyDiscord(product, DISCORD_WEBHOOK_URL, "amazon", false, "non", true, "✅ Disponible", true);
            } else {
                console.log(`📢 Produit indisponible : ${product.title}, Prix: ${product.price}`);
            }
        } catch (err) {
            console.error("❌ Erreur lors du scraping :", err);
        } finally {
            await page.close();
        }
    }
}

async function parse_results(page) {
    return await page.evaluate(() => {
        let IsAvailable = false;
        const title = document.querySelector("#productTitle")?.innerText.trim() || "Produit inconnu";
        const priceElement = document.querySelector("span.aok-offscreen");
        let price = priceElement ? priceElement.innerText.trim() : "Non disponible";
        const Disponible = document.querySelector("#availability")?.innerText.trim();
        if (Disponible == '' || Disponible == 'In Stock' || Disponible == 'En stock') {
            IsAvailable = true;
        } else if (Disponible == 'This item cannot be shipped to your selected delivery location. Please choose a different delivery location.') {
            IsAvailable = false;
        } else {
            IsAvailable = false;
        }
        const imageElement = document.querySelector("#landingImage");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href, IsAvailable};
    });
}
