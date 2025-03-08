import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { notifyDiscord } from '../../utils/Discord.js';
import { randomDelay } from '../../utils/humanBehavior.js';

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1341888650530525246/uGkh3jSnfZaValdAzShfFqVT0ul-c0ccooGPf_VVE34zQ1VT3VH9M9_lT7O-jaFkuf_V";
class AmazonScraper {
    async initDriver() {
        const options = new chrome.Options();
        options.addArguments(
            '--window-size=1920,1080',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--disable-notifications',
            '--start-maximized',
            '--disable-gpu'
        );
        options.excludeSwitches(['enable-automation']);
        options.setUserPreferences({
            'credentials_enable_service': false,
            'profile.password_manager_enabled': false
        });

        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        await this.driver.executeScript(`
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        `);
    }

    async scrapeProduct(url) {
        try {
            await this.initDriver();
            await this.driver.get(url);
            await randomDelay(2000, 4000);
            await this.simulateHumanBehavior();
            const data = await this.driver.executeScript(`
                let IsAvailable = false;
                const title = document.querySelector("#productTitle")?.innerText.trim() || "Produit inconnu";
                const Disponible = document.querySelector("#availability")?.innerText.trim();
                 if (Disponible == '' || Disponible == 'In Stock' || Disponible == 'En stock') {
                    IsAvailable = true;
                 } else if (Disponible == 'This item cannot be shipped to your selected delivery location. Please choose a different delivery location.') {
                     IsAvailable = false;
                 } else {
                     IsAvailable = false;
                 }
                const priceElement = document.querySelector("span.aok-offscreen");
                const price = priceElement ? priceElement.innerText.trim() : "Non disponible";
                const imageElement = document.querySelector("#landingImage");
                const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
                return { 
                    title, 
                    price, 
                    image, 
                    url: window.location.href,
                    IsAvailable,
                    timestamp: new Date().toISOString()
                };
            `);

            console.log(' Données extraites:', data);
            let product = {
                title: data.title,
                price: data.price,
                image: data.image,
                IsAvailable : data.IsAvailable,
                url: data.url,
                timestamp: data.timestamp
            }
            if (product.IsAvailable) {
                await notifyDiscord(product, DISCORD_WEBHOOK_URL, "amazon", false, "non", true, "✅ Disponible", true);
            }
            return data;

        } catch (error) {
            console.error('Erreur lors du scraping:', error);
            throw error;
        } finally {
            if (this.driver) {
                await this.driver.quit();
            }
        }
    }

    async simulateHumanBehavior() {
        await this.driver.executeScript(`
            window.scrollTo({
                top: Math.random() * (document.documentElement.scrollHeight - window.innerHeight),
                behavior: 'smooth'
            });
        `);
        await randomDelay(1000, 2000);
        const actions = this.driver.actions({async: true});
        await actions
            .move({x: 100, y: 100})
            .pause(1000)
            .move({x: 200, y: 200})
            .pause(1000)
            .perform();
    }
}

export async function Ademo_CheckAmazon(PRODUCT_URLS) {
    const scraper = new AmazonScraper();
    console.log(" Démarrage du scraping Amazon...");
    for (const url of PRODUCT_URLS) {
        try {
            console.log(` Vérification du produit: ${url}`);
            await scraper.scrapeProduct(url);
            await randomDelay(3000, 5000);
        } catch (error) {
            console.error(` Erreur lors du scraping de ${url}:`, error);
            continue;
        }
    }
    console.log(" Scraping Amazon terminé");
}

export default AmazonScraper;
