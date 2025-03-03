import { db } from "../db.js";

export function GetProductAll() {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM product", (err, results) => {
            if (err) return reject(err);
            const productsBySite = results.reduce((acc, v) => {
                const products = JSON.parse(v.product);
                const site = v.site.toUpperCase();
                const site2 = v.site.toLowerCase();
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