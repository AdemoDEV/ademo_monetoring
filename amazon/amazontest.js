import puppeteer from "puppeteer";
import fetch from "node-fetch";

const URL = "https://www.amazon.fr";
const search_term = "Pokémon TCG";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340314296340713563/gqGJEs0L_2lrn7oun2z0bQjRmDrYxEIZkzPfVakkht0EZMYSFl0AgHcCuKXuZfNiuxU6"; // Remplace par ton webhook Discord

const EmbedDiscord = {
    panier: "https://www.amazon.fr/gp/cart/view.html?ref_=nav_cart",
    account: "https://www.amazon.fr/gp/css/homepage.html?ref_=nav_youraccount_btn",
    payment: "https://www.amazon.fr/gp/cart/view.html?ref_=nav_cart",
};

let previousProducts = new Map();

async function notifyDiscord(product) {
    console.log("📡 Envoi du produit sur Discord :", product);

    const atcURL = `${product.url}?autoAdd=1`;

    const embed = {
        embeds: [
            {
                title: product.title,
                url: product.url,
                color: 5763719, // Couleur violet foncé
                thumbnail: { url: product.image || "https://via.placeholder.com/150" },
                fields: [
                    { name: "**Site**", value: "Amazon FR", inline: false },
                    { name: "**Prix**", value: `\`${product.price || "Non disponible"} €\``, inline: false },
                    { name: "**Liens**", value: `[Redirection vers la page](${product.url})`, inline: false },
                    { name: "**Utils**", value: `[Panier](${EmbedDiscord.panier}) | [Compte](${EmbedDiscord.account}) | [Paiement](${EmbedDiscord.payment})`, inline: false },
                ],
                footer: { text: "🔍 Surveillance automatique Amazon FR" },
                timestamp: new Date().toISOString(),
            },
        ],
    };

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(embed),
        });

        const responseData = await response.text();
        console.log("📡 Réponse Discord :", responseData);

        if (response.ok) {
            console.log(`✅ Produit envoyé à Discord : ${product.title}`);
        } else {
            console.error("❌ Échec de l'envoi à Discord :", responseData);
            console.log("🔄 Tentative d'envoi en message texte...");
            await fetch(DISCORD_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    content: `**${product.title}**\n💰 Prix : ${product.price}\n📦 Disponibilité : ${product.isAvailable ? "✅ En stock" : "❌ Indisponible"}\n🔗 [Voir le produit](${product.url})\n🛒 [Ajouter au panier](${atcURL})`
                }),
            });
            console.log("✅ Produit envoyé sous forme de message texte.");
        }
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi à Discord :", err);
    }
}

async function checkAmazonStock(browser) {
    const page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    );

    try {
        console.log("🔄 Accès à Amazon FR...");
        await page.goto(URL, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("#twotabsearchtextbox", { timeout: 30000 });

        await page.type("#twotabsearchtextbox", search_term);
        await page.keyboard.press("Enter");

        console.log("🔍 Recherche des produits...");
        await page.waitForSelector(".s-card-container", { timeout: 30000 });

        const products = await parse_results(page);
        console.log(`📦 ${products.length} produits trouvés sur Amazon FR`);

        for (const product of products) {
            const previousProduct = previousProducts.get(product.url);

            if (!previousProduct || (previousProduct.price === "Non disponible" && product.price !== "Non disponible")) {
                console.log(`📢 NOUVEAU ou DE RETOUR EN STOCK : ${product.title}, Prix: ${product.price}`);
                await notifyDiscord(product);
            }

            previousProducts.set(product.url, product);
        }
    } catch (err) {
        console.error("❌ Erreur lors du scraping :", err);
    } finally {
        await page.close();
    }
}

async function parse_results(page) {
    return await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".s-card-container")).map(el => {
            const title = el.querySelector("h2 span")?.innerText || "Produit inconnu";
            const price = el.querySelector(".a-price > .a-offscreen")?.innerText || "Non disponible";
            const image = el.querySelector(".s-image")?.getAttribute("src") || "";
            const relativeUrl = el.querySelector("a")?.getAttribute("href");
            const url = relativeUrl ? `https://www.amazon.fr${relativeUrl}` : "Non disponible";

            return { title, price, image, url };
        });
    });
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    console.log("✅ Lancement de Puppeteer en local...");
    await checkAmazonStock(browser);

    console.log("🛑 Scraping terminé. Fermeture du navigateur.");
    await browser.close();
})();
