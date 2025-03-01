import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
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
    "amazon" : {},
    'auchan': {},
    'dreamland': {},
    'fnac': {},
    'guizettefammily': {},
    'joueclub': {},
    'kingjouet': {},
    'lagrandrecree': {},
    'leclerc': {},
    'micromania': {},
    'smartoys': {},
    'vinticards': {},
}

(async () => {
   
})();


// (async () => {
//     puppeteer.use(StealthPlugin());
//     const browser = 
//     await puppeteer.launch({
//         headless: false,
//         args: [
//             `--proxy-server=${PROXY_HOST}:${PROXY_PORT}`,
//             '--no-sandbox',
//             '--disable-setuid-sandbox',
//             '--disable-blink-features=AutomationControlled',
//             '--disable-infobars',
//             '--window-size=1920,1080'
//         ],
//     });

//     await new Promise(resolve => setTimeout(resolve, 5000));
//     console.log("✅ Lancement de Puppeteer via Proxy...");
//     await Promise.all([
//         //  Ademo_CheckFnac(browser),
//         //  Ademo_CheckVintiCards(browser),
//         //  Ademo_checkMicromania(browser),
//         //  Ademo_CheckLecler(browser),
//         //  Ademo_CheckSmartoys(browser),
//         // Ademo_CheckLaGrandRecre(browser),
//         //  Ademo_CheckJoueClub(browser),
//         //  Ademo_CheckGuiztteFamily(browser),
//         //  Ademo_CheckDreamLand(browser),
//         //  Ademo_CheckAuchan(browser),
//         Ademo_CheckAmazon(browser)
//     ]);
    

//     console.log("🛑 Scraping terminé. Fermeture du navigateur.");
//     await browser.close();
// })();
