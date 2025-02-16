import puppeteer from "puppeteer";
import fetch from "node-fetch";

const PROXY_HOST = "geo.iproyal.com";
const PROXY_PORT = "12321";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

const URL = "https://www.dreamland.be/e/SearchDisplay?categoryId=&storeId=13102&catalogId=15501&langId=-2&sType=SimpleSearch&resultCatEntryType=2&showResultsPage=true&searchSource=Q&pageView=&beginIndex=0&pageSize=4000&searchTerm=Pok%C3%A9mon+TCG";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340506949740924982/oZO3U011AmHa0TGu_nffrXdwmFmBvlwOoYcRanwjJ-vHauoet6cEHEOe8n4GPCh7p_HI";

const EmbedDiscord = {
    panier: "https://www.dreamland.be/e/fr/ShopCartOverviewCmd?calculationUsageId=-1&catalogId=15501&doConfigurationValidation=Y&updatePrices=1&orderId=.&langId=-2&storeId=13102&errorViewName=ShopCartOverviewCmd&URL=ShopCartOverviewCmd",
    account: "https://www.dreamland.be/webapp/wcs/stores/servlet/fr/OrderHistoryDisplayView?catalogId=15501&storeId=13102&langId=-2",
    payment: "https://www.dreamland.be/e/fr/dl/checkout-delivery?",
};

let previousProducts = new Map();

async function notifyDiscord(product) {
    console.log("📡 Envoi du produit sur Discord :", product);

    // 🔹 **URL pour ajouter au panier automatiquement**
    const atcURL = `${product.url}?autoAdd=1`;

    const embed = {
        embeds: [
            {
                title: product.title,
                url: product.url,
                color: 10181046, // Couleur violet foncé
                thumbnail: { url: product.image || "https://via.placeholder.com/150" },
                fields: [
                    { name: "**Site**", value: "DreamLand", inline: false },
                    { name: "**Prix**", value: `\`${product.price || "Non disponible"} €\``, inline: false },
                    { name: "**Liens**", value: `[Redirections vers la page](${product.url})`, inline: false },
                    { name: "**Utils**", value: `[Panier](${EmbedDiscord.panier}) | [Compte](${EmbedDiscord.account}) | [Paiement](${EmbedDiscord.payment})`, inline: false },
                ],
                footer: { text: "🔍 Surveillance automatique Dreamland" },
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
                body: JSON.stringify({ content: `**${product.title}**\n💰 Prix : ${product.price}\n🔗 [Voir le produit](${product.url})\n🛒 [Ajouter au panier](${atcURL})` }),
            });
            console.log("✅ Produit envoyé sous forme de message texte.");
        }
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi à Discord :", err);
    }
}

async function checkDreamlandStock(browser) {
    const page = await browser.newPage();
    
    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");

    try {
        console.log("🔄 Accès à Dreamland via Proxy...");
        await page.goto(URL, { waitUntil: "networkidle2" });

        console.log("🔍 Attente du chargement des produits...");
        await page.waitForSelector(".grid_mode.grid.ui-grid-b li", { timeout: 30000 });

        console.log("🔍 Extraction des produits...");
        let products = await parse_results(page);

        if (products.length === 0) {
            console.warn("⚠️ Aucun produit trouvé, vérifie le sélecteur ou le chargement JS.");
            return;
        }

        products = products.map(product => ({
            ...product,
            url: generateProductURL(product.title, product.productId)
        }));

        console.log(`📦 ${products.length} produits trouvés sur Dreamland`);

        for (const product of products) {
            if (!product.title || product.title === "Produit inconnu") {
                console.warn("⚠️ Produit sans titre détecté, vérification requise !");
                continue;
            }

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
        return Array.from(document.querySelectorAll(".grid_mode.grid.ui-grid-b li")).map(el => {
            const product = el.querySelector(".product");
            if (!product) return null;

            const title = product.getAttribute("data-tms-product-name") || "Produit inconnu";
            const price = product.getAttribute("data-tms-product-price") || "Non disponible";
            const image = el.querySelector("img")?.getAttribute("src") || "";
            const productId = product.getAttribute("data-tms-product-id") || "";

            return { title, price, image, productId };
        }).filter(Boolean);
    });
}

function generateProductURL(title, productId) {
    if (!productId) return "https://www.dreamland.be";

    let formattedTitle = title
        .replace(/[^a-z0-9é\s-]+/gi, "")
        .replace(/\s+/g, "-")
        .toLowerCase();

    formattedTitle = formattedTitle.split("-").map(encodeURIComponent).join("-");

    return `https://www.dreamland.be/e/fr/dl/${formattedTitle}-${productId}`;
}

// 🌟 Lancement du script et arrêt après exécution
(async () => {
    const browser = await puppeteer.launch({
        headless: false, 
        args: [
            `--proxy-server=${PROXY_HOST}:${PROXY_PORT}`,
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ],
    });

    console.log("✅ Lancement de Puppeteer via Proxy...");

    await checkDreamlandStock(browser);

    console.log("🛑 Scraping terminé. Fermeture du navigateur.");
    await browser.close();
})();
