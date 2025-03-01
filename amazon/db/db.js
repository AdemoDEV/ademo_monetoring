import mysql from 'mysql2';
// import { Product } from '../init';

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ademo'
});

db.connect(err => {
    if (err) {
        console.error('❌ Erreur de connexion à la base de données :', err);
        return;
    }
    console.log('✅ Connecté à la base de données MySQL.');
});


export function GetProductAll() {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM product", (err, results) => {
            if (err) return reject(err);
            const productsBySite = results.reduce((acc, v) => {
                const products = JSON.parse(v.product);
                const site = v.site.toUpperCase();
                if (!acc[site]) acc[site] = [];
                products.forEach(prod => {
                    acc[site].push({
                        url: prod.url,
                        name: prod.name
                    });
                });

                return acc;
            }, {});

            resolve(productsBySite);
        });
    });
}

export function AddProductToDB(site, name, url) {
    return new Promise((resolve, reject) => {
        // Vérifier si un enregistrement existe déjà pour ce site
        db.query("SELECT * FROM product WHERE site = ?", [site], (err, results) => {
            if (err) return reject(err);

            if (results.length > 0) {
                // Si le site existe déjà, mettre à jour la liste de produits
                const existingProducts = JSON.parse(results[0].product);
                existingProducts.push({ name, url });

                db.query(
                    "UPDATE product SET product = ? WHERE site = ?",
                    [JSON.stringify(existingProducts), site],
                    (err, result) => {
                        if (err) return reject(err);
                        console.log(`✅ Produit mis à jour pour ${site} : ${name}`);
                        resolve(result);
                    }
                );
            } else {
                // Si le site n'existe pas, créer un nouvel enregistrement
                const newProduct = JSON.stringify([{ name, url }]);
                
                db.query(
                    "INSERT INTO product (site, product) VALUES (?, ?)",
                    [site, newProduct],
                    (err, result) => {
                        if (err) return reject(err);
                        console.log(`✅ Nouveau produit ajouté : ${name} (${site})`);
                        resolve(result);
                    }
                );
            }
        });
    });
}


