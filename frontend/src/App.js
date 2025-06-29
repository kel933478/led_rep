import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header" style={{backgroundColor: '#1a1a1a', color: 'white', padding: '2rem'}}>
        <h1>🔐 Ledger Récupération</h1>
        <p>Application de gestion de portefeuille crypto</p>
        
        <div style={{marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
          <div style={{backgroundColor: '#2a2a2a', padding: '1rem', borderRadius: '8px', minWidth: '200px'}}>
            <h3>👤 Client</h3>
            <p>Email: client@demo.com</p>
            <p>Password: demo123</p>
            <p>Portfolio: 50,000€</p>
          </div>
          
          <div style={{backgroundColor: '#2a2a2a', padding: '1rem', borderRadius: '8px', minWidth: '200px'}}>
            <h3>🔧 Admin</h3>
            <p>Email: admin@ledger.com</p>
            <p>Password: admin123</p>
            <p>Gestion complète</p>
          </div>
          
          <div style={{backgroundColor: '#2a2a2a', padding: '1rem', borderRadius: '8px', minWidth: '200px'}}>
            <h3>💼 Vendeur</h3>
            <p>Email: vendeur@demo.com</p>
            <p>Password: vendeur123</p>
            <p>Clients assignés</p>
          </div>
        </div>
        
        <div style={{marginTop: '2rem'}}>
          <h3>🚀 Fonctionnalités</h3>
          <ul style={{textAlign: 'left', maxWidth: '600px'}}>
            <li>💰 Portfolio crypto multi-devises (BTC, ETH, USDT, etc.)</li>
            <li>📤 Envoi de cryptomonnaies</li>
            <li>📥 Réception avec QR codes</li>
            <li>🔄 Échange entre cryptos</li>
            <li>⚙️ Paramètres utilisateur avancés</li>
            <li>🔐 Système KYC complet</li>
            <li>📊 Dashboard admin</li>
            <li>💼 Interface vendeur</li>
          </ul>
        </div>
        
        <div style={{marginTop: '2rem', padding: '1rem', backgroundColor: '#0066cc', borderRadius: '8px'}}>
          <h3>✅ Status</h3>
          <p>🌐 API: Opérationnelle</p>
          <p>🗄️ Base de données: Configurée</p>
          <p>🔐 Authentification: 3 rôles actifs</p>
          <p>🚀 Ready for databackupledger.com</p>
        </div>
      </header>
    </div>
  );
}

export default App;
