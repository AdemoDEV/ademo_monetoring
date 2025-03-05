import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { connectDB, getDB, DefaultTable } from "./db/db.js"; 
import client from "./utils/AdminDiscord.js";

import { Ademo_CheckVintiCards } from "./scrap/vinticards.js"
import { Ademo_CheckFnac } from "./scrap/fnac.js";
import { Ademo_checkMicromania } from "./scrap/micromania.js";
import { Ademo_CheckLecler } from "./scrap/leclerc.js";
import { Ademo_CheckSmartoys } from "./scrap/smartoys.js";
import { Ademo_CheckLaGrandRecre } from "./scrap/lagrandrecree.js";
import { Ademo_CheckJoueClub } from "./scrap/joueclub.js";
import { Ademo_CheckGuiztteFamily } from "./scrap/guizettefamily.js";
import { Ademo_CheckDreamLand } from "./scrap/dreamland.js";
import { Ademo_CheckAuchan } from "./scrap/auchan.js";
import { Ademo_CheckAmazon } from "./scrap/amazon.js";
import { Ademo_CheckKingJouet } from "./scrap/kingjouet.js";

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


// DEV (async () => {
//     try {
//         await connectDB();
//         await DefaultTable();
//         console.log("✅ Base de données connectée avec succès !");
//         client.login();
//          await new Promise(resolve => setTimeout(resolve, 5000));
//          puppeteer.use(StealthPlugin());
//          const browser = 
//          await puppeteer.launch({
//              headless: true,
//              args: [
//                  `--proxy-server=${PROXY_HOST}:${PROXY_PORT}`,
//                  '--no-sandbox',
//                  '--disable-setuid-sandbox',
//                  '--disable-blink-features=AutomationControlled',
//                  '--disable-infobars',
//                  '--window-size=1920,1080'
//              ],
//          });
//          await new Promise(resolve => setTimeout(resolve, 5000));
//          console.log("✅ Lancement de Puppeteer via Proxy...");
//          await Promise.all([
//              // Ademo_CheckFnac(browser, Product["fnac"]),
//              // Ademo_CheckVintiCards(browser, Product["vinticards"]),
//              // Ademo_checkMicromania(browser, Product["micromania"]),
//             //  Ademo_CheckLecler(browser, Product["leclerc"]),
//               Ademo_CheckSmartoys(browser, Product["smartoys"]),
//              // Ademo_CheckLaGrandRecre(browser, Product["lagrandrecree"]),
//              // Ademo_CheckJoueClub(browser, Product["joueclub"]),
//              // Ademo_CheckGuiztteFamily(browser, Product["guizettefamily"]),
//              // Ademo_CheckDreamLand(browser, Product["dreamland"]),
//              // Ademo_CheckAuchan(browser, Product["auchan"]),
//              // Ademo_CheckAmazon(browser, Product["amazon"])
//          ]);
     
//         console.log("🛑 Scraping terminé. Fermeture du navigateur.");
//         await browser.close();
//     } catch (error) {
//         console.error("❌ Erreur lors du démarrage du bot :", error);
//     }
// })();

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

                puppeteer.use(StealthPlugin());
                const browser = await puppeteer.launch({
                    headless: true,
                    args: [
                        `--proxy-server=${PROXY_HOST}:${PROXY_PORT}`,
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-blink-features=AutomationControlled',
                        '--disable-infobars',
                        '--window-size=1920,1080'
                    ],
                });

                await new Promise(resolve => setTimeout(resolve, 5000));
                console.log("✅ Lancement de Puppeteer via Proxy...");

                await Promise.all([
                    Ademo_CheckFnac(browser, Product["fnac"]),
                    Ademo_CheckVintiCards(browser, Product["vinticards"]),
                    Ademo_checkMicromania(browser, Product["micromania"]),
                    Ademo_CheckLecler(browser, Product["leclerc"]),
                    Ademo_CheckSmartoys(browser, Product["smartoys"]),
                    Ademo_CheckLaGrandRecre(browser, Product["lagrandrecree"]),
                    Ademo_CheckJoueClub(browser, Product["joueclub"]),
                    Ademo_CheckGuiztteFamily(browser, Product["guizettefamily"]),
                    Ademo_CheckDreamLand(browser, Product["dreamland"]),
                    Ademo_CheckAuchan(browser, Product["auchan"]),
                    Ademo_CheckAmazon(browser, Product["amazon"])
                ]);

                console.log("🛑 Scraping terminé. Fermeture du navigateur.");
                await browser.close();
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

