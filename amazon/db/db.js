import mysql from 'mysql2';
import { Product } from '../init.js';

export let db;

export function connectDB() {
    return new Promise((resolve, reject) => {
        db = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'ademo'
        });

        db.connect(err => {
            if (err) {
                console.error('❌ Erreur de connexion à la base de données :', err);
                return reject(err);
            }
            console.log('✅ Connecté à la base de données MySQL.');
            resolve(db);
        });
    });
}

export function getDB() {
    if (!db) throw new Error("❌ La connexion à la base de données n'est pas encore établie !");
    return db;
}

export async function DefaultTable() {
    if (!db) {
        console.error("⚠️ La connexion MySQL n'a pas été initialisée.");
        return;
    }
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM product", (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            console.log(`🔍 ${results.length} produits trouvés.`);
            for (let site in Product) {
                Product[site] = [];
            }
            results.forEach(v => {
                const site2 = v.site.toLowerCase();
                if (!Product[site2]) Product[site2] = [];
                try {
                    const products = JSON.parse(v.product);
                    products.forEach(prod => {
                        Product[site2].push(prod.url);
                    });
                } catch (e) {
                    console.error(`❌ Erreur de parsing JSON pour ${site2}:`, e);
                }
            });
            // console.log('📦 Produits chargés depuis la base de données:', Product);
            resolve(Product);
        });
    });
}

