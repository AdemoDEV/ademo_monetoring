import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { connectDB, getDB, DefaultTable } from "./db/db.js"; 
import client from "./utils/AdminDiscord.js";
import { randomDelay } from "./utils/humanBehavior.js";

import { Ademo_CheckVintiCards } from "./scrap/vinticards.js"
import { Ademo_CheckFnac } from "./scrap/Selenium/fnac.js";
import { Ademo_checkMicromania } from "./scrap/micromania.js";
import { Ademo_CheckLecler } from "./scrap/leclerc.js";
import { Ademo_CheckSmartoys } from "./scrap/smartoys.js";
import { Ademo_CheckLaGrandRecre } from "./scrap/lagrandrecree.js";
import { Ademo_CheckJoueClub } from "./scrap/joueclub.js";
import { Ademo_CheckGuiztteFamily } from "./scrap/guizettefamily.js";
import { Ademo_CheckDreamLand } from "./scrap/dreamland.js";
import { Ademo_CheckAuchan } from "./scrap/auchan.js";
import { Ademo_CheckAmazon } from "./scrap/Selenium/amazon.js";

const PROXY_HOST = "geo.iproyal.com";
const PROXY_PORT = "12321";

export let Product = {
    "amazon" : [],
    'auchan': [],
    'dreamland': [],
    'fnac': [],
    'guizettefamily': [],
    'joueclub': [],
    'kingjouet': [],
    'lagrandrecree': [],
    'leclerc': [],
    'micromania': [],
    'smartoys': [],
    'vinticards': [],
}
console.log("✅ Chargement de init.js...");

(async () => {
    try {
        await connectDB();
        await DefaultTable();
        console.log("✅ Base de données connectée avec succès !");
        client.login();

        const launchScraping = async () => {
            try {
                console.log("🚀 Lancement du scraping...");
                await new Promise(resolve => setTimeout(resolve, 5000));
                await Ademo_CheckAmazon(Product["amazon"]);
                await Ademo_CheckFnac(Product["fnac"]);
                // puppeteer.use(StealthPlugin());
                // const browser = await puppeteer.launch({
                //     headless: false,
                //     args: [
                //         `--proxy-server=${PROXY_HOST}:${PROXY_PORT}`,
                //         '--no-sandbox',
                //         '--disable-setuid-sandbox',
                //         '--disable-blink-features=AutomationControlled',
                //         '--disable-infobars',
                //         '--window-size=1920,1080'
                //     ],
                // });

                // await new Promise(resolve => setTimeout(resolve, 5000));
                // console.log("✅ Lancement de Puppeteer via Proxy...");

                // // Fonction pour exécuter un scraper avec délai
                // async function runScraperWithDelay(scraper, products, name) {
                //     console.log(`🔄 Démarrage du scraping ${name}...`);
                //     await scraper(browser, products);
                //     console.log(`✅ Scraping ${name} terminé`);
                //     await randomDelay(3000, 5000); // Délai plus court entre 3-5 secondes
                // }

                // // Exécution séquentielle des scrapers avec délais
                // await runScraperWithDelay(Ademo_CheckVintiCards, Product["vinticards"], "VintiCards");
                // await runScraperWithDelay(Ademo_checkMicromania, Product["micromania"], "Micromania");
                // await runScraperWithDelay(Ademo_CheckLecler, Product["leclerc"], "Leclerc");
                // await runScraperWithDelay(Ademo_CheckSmartoys, Product["smartoys"], "Smartoys");
                // await runScraperWithDelay(Ademo_CheckLaGrandRecre, Product["lagrandrecree"], "La Grande Récré");
                // await runScraperWithDelay(Ademo_CheckJoueClub, Product["joueclub"], "JouéClub");
                // await runScraperWithDelay(Ademo_CheckGuiztteFamily, Product["guizettefamily"], "Guizette Family");
                // await runScraperWithDelay(Ademo_CheckDreamLand, Product["dreamland"], "Dreamland");
                // await runScraperWithDelay(Ademo_CheckAuchan, Product["auchan"], "Auchan");
                // await runScraperWithDelay(Ademo_CheckAmazon, Product["amazon"], "Amazon");

                // console.log("🛑 Scraping terminé. Fermeture du navigateur.");
                // await browser.close();
            
            } catch (error) {
                console.error("❌ Erreur lors du scraping :", error);
            }
        };

        await launchScraping();
        setInterval(async () => {
            console.log("⏳ Attente 1 heure avant le prochain scraping...");
            await launchScraping();
        }, 3600000);

    } catch (error) {
        console.error("❌ Erreur lors du démarrage du bot :", error);
    }
})();
