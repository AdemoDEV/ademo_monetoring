import { notifyDiscord } from "../utils/Discord.js";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

// const PRODUCT_URLS = ["https://www.joueclub.fr/jeux-de-constructions-maquettes/pokemon-bulbizarre-pixel-art-374-briques-0194735190836.html"];
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340782468802019550/6E7InrbWiYduRdd8ttezYj368GZX_-skyboof1ipZSp_V0pIRJNb8F9QS_Xn0_CyO9SB";

export async function Ademo_CheckJoueClub(browser, PRODUCT_URLS) {
    for (const URL of PRODUCT_URLS) {
    const page = await browser.newPage();
    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    

    try {
        console.log(`🌐 Navigation vers : ${URL}`);
        await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        let product = await parse_results(page);
        if (product.length === 0) {
            console.warn("⚠️ Aucun produit trouvé, vérifie le sélecteur ou le chargement JS.");
            return;
        }

        if (product.IsAvailable == "none") {
            console.log(`❌ Produit Indisponible : ${product.title}, Prix: ${product.price}`);
        } else if (product.IsAvailable == "magasin") {
            await notifyDiscord(product, DISCORD_WEBHOOK_URL, "joueclub", false, "non", true, "✅ Disponible juste en magasin"); 
        } else if (product.IsAvailable == "enligne") {
            await notifyDiscord(product, DISCORD_WEBHOOK_URL, "joueclub", false, "non", true, "✅ Disponible juste en ligne", true); 
        } else {
            await notifyDiscord(product, DISCORD_WEBHOOK_URL, "joueclub", false, "non", true, "✅ Disponible en magasin et en ligne", true); 
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
        let IsAvailable = '';
        const title = document.querySelector("h1.c-product-header__title")?.innerText.trim() || "Produit inconnu";
        const priceElement = document.querySelector("div.scalapay-price");
        let price = priceElement ? priceElement.innerText.trim() : "Non disponible";
        const imageElement = document.querySelector("img.media-visuals-main-img");
        const elementAvailable = document.querySelector("div.row.ng-pristine.ng-valid");
        const textA = elementAvailable ? elementAvailable.innerText.trim() : "";
        if (textA.includes("Indisponible en ligne") && textA.includes("Indisponible en retrait magasin")) {
            IsAvailable = 'none';
        } else if (textA.includes("Indisponible en ligne")) {
            IsAvailable = 'magasin';
        } else if (textA.includes("Indisponible en retrait magasin")) {
            IsAvailable = 'enligne';
        } else {
            IsAvailable = 'all';
        }
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href, IsAvailable};
    });
}
