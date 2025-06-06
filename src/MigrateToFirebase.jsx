import React from "react";
import { db } from "./firebase";
import { collection, setDoc, doc } from "firebase/firestore";

const MigrateToFirebase = () => {
  const migrateData = async () => {
    // 1. Get data from localStorage
    const items = JSON.parse(localStorage.getItem("items") || "[]");
    const transactions = JSON.parse(localStorage.getItem("transactions") || "[]");

    // 2. Upload items
    for (const item of items) {
      await setDoc(doc(collection(db, "items"), item.id), item);
    }

    // 3. Upload transactions
    for (const transaction of transactions) {
      await setDoc(doc(collection(db, "transactions"), transaction.id), transaction);
    }

    alert("Migration complete! Check your Firebase Console.");
  };

  return (
    <div style={{ padding: 40 }}>
      <button onClick={migrateData} style={{ fontSize: 20, padding: 10 }}>
        Migrate localStorage to Firebase
      </button>
    </div>
  );
};

export default MigrateToFirebase; 