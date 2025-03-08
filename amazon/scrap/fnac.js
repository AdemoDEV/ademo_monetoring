import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { notifyDiscord } from '../utils/Discord.js';
import { randomDelay } from '../utils/humanBehavior.js';
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1341888650530525246/uGkh3jSnfZaValdAzShfFqVT0ul-c0ccooGPf_VVE34zQ1VT3VH9M9_lT7O-jaFkuf_V";
class FnacScraper {
    // constructor() {
    //     // Configuration de base sans proxy
    // }

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
                const title = document.querySelector("h1.f-productHeader__heading")?.innerText.trim() || "Produit inconnu";
                const priceElement = document.querySelector(".f-faPriceBox__price.userPrice.checked");
                const price = priceElement ? priceElement.innerText.trim() : "Non disponible";
                const imageElement = document.querySelector(".f-productMedias__viewItem--main");
                const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
                return { 
                    title, 
                    price, 
                    image, 
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                };
            `);

            console.log(' Données extraites:', data);
            let product = {
                title: data.title,
                price: data.price,
                image: data.image,
                url: data.url,
                timestamp: data.timestamp
            }
            await notifyDiscord(product, DISCORD_WEBHOOK_URL, "fnac", false, "non", true, "✅ Disponible", true);
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

export default FnacScraper;
