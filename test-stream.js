const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, onSnapshot } = require('firebase/firestore/lite');

const firebaseConfig = {
    apiKey: "AIzaSyCgLtdTFH65cbmjzt0W3vjQ5DeIfawyr5I",
    authDomain: "qr-code-restaurant-7ba27.firebaseapp.com",
    projectId: "qr-code-restaurant-7ba27",
    storageBucket: "qr-code-restaurant-7ba27.firebasestorage.app",
    messagingSenderId: "553674996905",
    appId: "1:553674996905:web:773c78dc7eec5100ef3db8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const q = query(collection(db, 'orders'));
onSnapshot(q, (snapshot) => {
    console.log("Snapshot size:", snapshot.size);
    const docs = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
    
    // Exact same filter logic:
    const filtered = docs.filter(o => o.status !== 'Paid' && o.status !== 'Completed' && o.items && o.items.length > 0);
    console.log("Filtered length:", filtered.length);
    filtered.forEach(o => {
        console.log(`- ${o.id}: status=${o.status}, items=${o.items.length}`);
    });
    
    process.exit(0);
});
