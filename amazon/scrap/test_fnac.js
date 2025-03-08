import FnacScraper from './fnac.js';

async function testScraper() {
    const scraper = new FnacScraper();
    
    try {
        // URL d'exemple d'un produit Fnac
        const url = 'https://www.fr.fnac.be/Pokemon-Coffret-ex-Avril-2024/a18629212';
        
        console.log('🔍 Démarrage du scraping...');
        const productData = await scraper.scrapeProduct(url);
        
        console.log('✅ Données extraites avec succès:');
        console.log(JSON.stringify(productData, null, 2));
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

testScraper();
