import {notifyDiscord} from "../utils/Discord.js"
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

const PRODUCT_URLS = [
    "https://www.amazon.com/Pok%C3%A9mon-TCG-Scarlet-Violet-Temporal-Trainer/dp/B0CS6JYNSG/ref=sr_1_2?crid=YCDPIFFEWGJ0&dib=eyJ2IjoiMSJ9.pz-SjvSoxMrd91G5WKvyEkAT9B-ysMgRJ0EK8GxINllGGNDA2Qz5egpv88EcNneX9iOZa_wX5XeYPowmaFZ_u25c_kVRdHwCwEmZF96CYZJveinTxcbCFpoSB5QU4tDLW_CKcNJbtRwvMkkAI6yZ2hZlGfhcT6kGhepCoK2jIY6NFLuTtFIz_qAtTY5AOgev_36qYiYRkm39ppsK72snSzoP_lGP-_0oXJCufNOKSAqfDmhq20m30BIaqGs7GIBogpS2BiiFKBGNCDJZcFiDOb-oDBe6EmubHjnVnxhOyvU.d7O6tERJniVIyAHpiWFsriGljcx3sHXbBXZcNA98tD8&dib_tag=se&keywords=Pok%C3%A9mon+Coffret&qid=1740439302&sprefix=pok%C3%A9mon+coffre%2Caps%2C155&sr=8-2",
    "https://www.amazon.com.be/Fable-N%C3%A9buleuse-enti%C3%A8rement-illustr%C3%A9e-Accessoires/dp/B0D7QP688Q/ref=sr_1_3",
    "https://www.amazon.fr/dp/B0DX2NTV71"
];
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340314296340713563/gqGJEs0L_2lrn7oun2z0bQjRmDrYxEIZkzPfVakkht0EZMYSFl0AgHcCuKXuZfNiuxU6";

export async function Ademo_CheckAmazon(browser) {
    for (URL of PRODUCT_URLS) {
        const page = await browser.newPage();
        await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");
        
        try {
            await page.goto(URL, { waitUntil: "networkidle2" });
            let product = await parse_results(page);
            if (product.length === 0) {
                console.warn("⚠️ Aucun produit trouvé, vérifie le sélecteur ou le chargement JS.");
                return;
            }
            console.log(product.IsAvailable)
            if (product.IsAvailable) {
                console.log(`📢 DE RETOUR EN STOCK : ${product.title}, Prix: ${product.price}`);
                await notifyDiscord(product, DISCORD_WEBHOOK_URL, "amazon");
            } else {
                console.log(`📢 TOUJOURS HORS STOCK : ${product.title}, Prix: ${product.price}`);
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
        } else {
            IsAvailable = false;
        }
        const imageElement = document.querySelector("#landingImage");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href, IsAvailable};
    });
}
