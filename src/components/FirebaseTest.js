import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';

function FirebaseTest() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const testAuth = async () => {
    try {
      // Test création de compte
      setMessage('Test 1: Création du compte...');
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage(prev => prev + '\nCompte créé avec succès!');

      // Test connexion
      setMessage(prev => prev + '\nTest 2: Connexion...');
      await signInWithEmailAndPassword(auth, email, password);
      setMessage(prev => prev + '\nConnexion réussie!');

      // Test Firestore
      setMessage(prev => prev + '\nTest 3: Ajout d\'un document dans Firestore...');
      const docRef = await addDoc(collection(db, 'test'), {
        timestamp: new Date(),
        test: 'Ceci est un test'
      });
      setMessage(prev => prev + '\nDocument ajouté avec succès! ID: ' + docRef.id);

      // Test déconnexion
      setMessage(prev => prev + '\nTest 4: Déconnexion...');
      await signOut(auth);
      setMessage(prev => prev + '\nDéconnexion réussie!');

    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Test Firebase</h2>
      <button onClick={testAuth}>Lancer les tests</button>
      
      {message && (
        <pre style={{ 
          whiteSpace: 'pre-wrap',
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#e6ffe6',
          borderRadius: '5px'
        }}>
          {message}
        </pre>
      )}
      
      {error && (
        <pre style={{ 
          whiteSpace: 'pre-wrap',
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#ffe6e6',
          borderRadius: '5px'
        }}>
          {error}
        </pre>
      )}
    </div>
  );
}

export default FirebaseTest;
