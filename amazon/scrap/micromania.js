import { notifyDiscord } from "../utils/Discord.js";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

// const PRODUCT_URLS = ["https://www.micromania.fr/coffret-pokemon-avril-2024-138545.html"];
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340448681387626648/0XphuBY_isoGsgXlVRMhyI3v5Ak0nV81I216SU2OGH8b9Pmv7y9sXXt5G44wa2ytFdOJ";

export async function Ademo_checkMicromania(browser, PRODUCT_URLS) {
    for (const URL of PRODUCT_URLS) {
    const page = await browser.newPage();
    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    
    try {
        console.log(`🌐 Navigation vers : ${URL}`);
        await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
        let product = await parse_results(page);
        if (!product || product.title === "Produit inconnu") {
            console.warn("⚠️ Impossible d'extraire le produit.");
            return;
        }

        if (product.available == "all") {
            console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
            await notifyDiscord(product, DISCORD_WEBHOOK_URL, "micromania", false, "non", true, "✅ Disponible en magasin et en ligne", true);
        } else if (product.available == "enligne") {
            console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
            await notifyDiscord(product, DISCORD_WEBHOOK_URL, "micromania", false, "non", true, "✅ Disponible en ligne", true);
        } else if (product.available == "magasin") {
            console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
            await notifyDiscord(product, DISCORD_WEBHOOK_URL, "micromania", false, "non", true, "✅ Disponible en magasin");
        } else if (product.available == "epuise") {
            console.log(`📢 Produit indisponible : ${product.title}, Prix: ${product.price}`);   
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
        function isButtonVisible(button) {
            if (!button) return false;
            const style = window.getComputedStyle(button);
            if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
                return false;
            }
            if (button.disabled) return false;
            const rect = button.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
            let parent = button;
            while (parent) {
                const parentStyle = window.getComputedStyle(parent);
                if (parentStyle.display === "none" || parentStyle.visibility === "hidden") {
                    return false;
                }
                parent = parent.parentElement;
            }
            return true;
        }

        let available = "";
        const title = document.querySelector("span.text-transform-none")?.innerText.trim() || "Produit inconnu";
        const priceElement = document.querySelector("span.pricing-container.text-right");
        let price = priceElement ? priceElement.innerText.trim() : "Non disponible";
        const addToCartButton = document.querySelector("button.add-to-cart");
        const availabilityText = document.querySelector("span.uppercase.d-block")?.innerText.trim();
        const stockInfo = document.querySelector("div.pdp-in-store-inventory");

        if (availabilityText === "CE PRODUIT EST ÉPUISÉ 😭") {
            console.log("❌ Produit épuisé !");
            available = "epuise";
        } else if (isButtonVisible(addToCartButton) && isButtonVisible(stockInfo)) {
            console.log("✅ Produit disponible en magasin et en ligne !");
            available = "all";
        } else if (isButtonVisible(addToCartButton)) {
            console.log("✅ Produit disponible en ligne !");
            available = "enligne";
        } else if (isButtonVisible(stockInfo)) {
            console.log("✅ Produit disponible en retrait magasin !");
            available = "magasin";
        } else {
            available = "none";
            console.log("❌ Produit indisponible !");
        }

        const imageElement = document.querySelector("img.main-carousel-image-large.d-block.d-lg-none.img-fluid.mw-100.mh-100.carousel-image-large");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        
        return { title, price, image, url: window.location.href, available};
    });
}



