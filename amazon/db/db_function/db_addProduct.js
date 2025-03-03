import { db } from "../db.js";
import { Product } from "../../init.js";
export function AddProductToDB(site, name, url) {
    console.log(Product)
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM product WHERE site = ?", [site], (err, results) => {
            if (err) return reject(err);
            if (results.length > 0) {
                const existingProducts = JSON.parse(results[0].product);
                const isDuplicate = existingProducts.some(prod => prod.url === url);
                if (isDuplicate) {
                    console.log(`⚠️ Le produit avec ce lien existe déjà pour ${site} : ${url}`);
                    return resolve({ message: "Produit déjà existant", site, url });
                }
                existingProducts.push({ name, url });
                Product[site].push(url)
                db.query(
                    "UPDATE product SET product = ? WHERE site = ?",
                    [JSON.stringify(existingProducts), site],
                    (err, result) => {
                        if (err) return reject(err);
                        console.log(`✅ Produit mis à jour pour ${site} : ${name}`);
                        console.log(Product)
                        resolve(result);
                    }
                );
            } else {
                const newProduct = JSON.stringify([{ name, url }]);
                Product[site].push(url)
                db.query(
                    "INSERT INTO product (site, product) VALUES (?, ?)",
                    [site, newProduct],
                    (err, result) => {
                        if (err) return reject(err);
                        console.log(`✅ Nouveau produit ajouté : ${name} (${site})`);
                        console.log(Product)
                        resolve(result);
                    }
                );
            }
        });
    });
}

