const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore/lite');

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

async function checkOrders() {
  const ordersCol = collection(db, 'orders');
  const orderSnapshot = await getDocs(ordersCol);
  const orderList = orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  orderList.forEach(o => {
    if (o.status === 'Order Placed') {
      console.log(`ID: ${o.id}`);
      console.log(`CreatedAt raw:`, o.createdAt);
      console.log(`CreatedAt type:`, typeof o.createdAt);
      console.log(`CreatedAt constructor:`, o.createdAt ? o.createdAt.constructor.name : 'null');
      console.log('---');
    }
  });
}

checkOrders().catch(console.error);
