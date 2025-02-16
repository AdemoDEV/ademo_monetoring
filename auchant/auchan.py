import requests
from bs4 import BeautifulSoup
import time
import json
import random

discord_webhook_url = "https://discord.com/api/webhooks/1339740504409116682/nuOU4AajJFklj01SmidgHJ7TpgQfYSuF67n6q1zGFF2FiSqF897kirp5CoZMnDtDi-Qc"
auchan_url = "https://www.auchan.fr/recherche?text=Pokemon"
seen_products = set()

user_agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36"
]

def get_pokemon_products():
    headers = {"User-Agent": random.choice(user_agents), "Accept-Language": "fr-FR,fr;q=0.9"}
    response = requests.get(auchan_url, headers=headers)
    
    if response.status_code != 200:
        print("Erreur lors de la récupération de la page Auchan")
        return []
    
    soup = BeautifulSoup(response.text, "html.parser")
    products = []
    
    for item in soup.select(".offer-selector__description-content"):
        title_element = item.select_one("h1")
        price_element = item.select_one(".product-price")
        link_element = item.find_parent("a", href=True)
        
        title = title_element.get_text(strip=True) if title_element else "Sans titre"
        price = price_element.get_text(strip=True) if price_element else "Indisponible"
        link = f"https://www.auchan.fr{link_element['href']}" if link_element else "#"
        
        products.append({
            "title": title,
            "price": price,
            "link": link
        })
    
    return products

def send_discord_notification(product):
    data = {
        "embeds": [
            {
                "title": product["title"],
                "description": f"💰 **Prix:** {product['price']}\n\n[Voir sur Auchan]({product['link']})",
                "color": 15258703,
                "footer": {"text": "Pokésauce | Auchan"}
            }
        ]
    }
    requests.post(discord_webhook_url, data=json.dumps(data), headers={"Content-Type": "application/json"})

def monitor_auchan():
    while True:
        print("Vérification des stocks...")
        products = get_pokemon_products()
        
        for product in products:
            if product["title"] not in seen_products:
                seen_products.add(product["title"])
                send_discord_notification(product)
                print(f"Nouveau produit détecté: {product['title']}")
        
        time.sleep(random.randint(18, 22))  # Vérification toutes les 18-22 secondes pour éviter la détection

if __name__ == "__main__":
    monitor_auchan()
