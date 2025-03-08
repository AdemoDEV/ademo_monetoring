function getCountryFromURL(url) {
    const domain = new URL(url).hostname;
    const parts = domain.split(".");
    
    if (parts.length >= 2) {
        return parts[parts.length - 1].toUpperCase();
    }
    
    return "Pays inconnu";
}

console.log(getCountryFromURL("https://www.amazon.com.be/Pok%C3%A9mon-TCG-Scarlet-Violet-Temporal-Trainer/dp/B0CS6JYNSG"));
console.log(getCountryFromURL("https://www.amazon.fr/Pokemon-151-Sealed-Booster-English/dp/B0CJ7P9LBN"));
console.log(getCountryFromURL("https://www.amazon.nl/dp/B0CNSXMWCR"));