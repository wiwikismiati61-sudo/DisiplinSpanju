import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

export async function migrateLocalStorageToFirebase() {
  const collections = [
    'students',
    'violations',
    'consequences',
    'followups',
    'transactions',
    'homeroomTeachers',
    'counselors',
    'credentials'
  ];

  for (const colName of collections) {
    const localData = localStorage.getItem(colName);
    if (localData) {
      try {
        const items = JSON.parse(localData);
        const itemsArray = Array.isArray(items) ? items : [items];
        
        if (itemsArray.length > 0) {
          // Check if firebase collection is empty before migrating
          const querySnapshot = await getDocs(collection(db, colName));
          if (querySnapshot.empty) {
            console.log(`Migrating ${colName}...`);
            const batch = writeBatch(db);
            itemsArray.forEach((item: any) => {
              const { id, ...data } = item;
              // For credentials, we use 'admin' as fixed ID if it's the only one
              const finalId = colName === 'credentials' ? (id || 'admin') : id;
              const docRef = finalId ? doc(db, colName, finalId) : doc(collection(db, colName));
              batch.set(docRef, data);
            });
            await batch.commit();
            console.log(`Successfully migrated ${colName}`);
          } else {
            console.log(`${colName} already has data in Firebase, skipping migration.`);
          }
        }
      } catch (err) {
        console.error(`Error migrating ${colName}:`, err);
      }
    }
  }
}
