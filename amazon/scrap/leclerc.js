import { notifyDiscord } from "../utils/Discord.js";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

// const PRODUCT_URLS = ["https://www.e.leclerc/fp/pokemon-coffret-dresseur-d-elite-pokevx5eli-0196214105140"];
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340849038974779402/M_LT1AwDqezTQb3AmTeX5kZqUp6w2ztb_QTpzjZ09HBOO6f2feS6kqDneaCg6gVG4vbb";


export async function Ademo_CheckLecler(browser, PRODUCT_URLS) {
    for (const URL of PRODUCT_URLS) {
    const page = await browser.newPage();
    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
    
    try {
        console.log(`🌐 Navigation vers : ${URL}`);
        await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        let product = await parse_results(page);
        if (!product || product.title === "Produit inconnu") {
            console.warn("⚠️ Impossible d'extraire le produit.");
            return;
        }
        if (product.AvailableBOl) {
            console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
            await notifyDiscord(product, DISCORD_WEBHOOK_URL, "leclerc", false, "non", true, "✅ Disponible Juste en magasin");
        } else {
            if (product.price == "Non disponible") {
                console.log(`📢 Produit Indisponible : ${product.title}, Prix: ${product.price}`);
            } else {
                console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
                await notifyDiscord(product, DISCORD_WEBHOOK_URL, "leclerc", false, "non", true, "✅ Disponible en magasin et en ligne", true); 
            }
        }
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
        let AvailableBOl = false
        const title = document.querySelector("h1.product-block-title.clamp.clamp-2")?.innerText.trim() || "Produit inconnu";
        const priceElement = document.querySelector("div.price-unit.ng-star-inserted");
        const priceElement2 = document.querySelector("b");
        const Available = document.querySelector("div.pickup-stock.mt-lg-0")?.innerText.trim()
        let price = ''
        if (Available == "Disponible en magasin") {
            AvailableBOl = true
            price = priceElement2?.innerText;
        } else {
            AvailableBOl = false
            price = priceElement ? priceElement.innerText.trim() : "Non disponible";
        }
        const imageElement = document.querySelector("img.img-fluid");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href, AvailableBOl};
    });
}