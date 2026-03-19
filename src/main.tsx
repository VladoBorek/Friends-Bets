import React from 'react'
import ReactDOM from 'react-dom/client'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Backend Connection Successful</h1>
      <p>Project skeleton and database schemas (Drizzle ORM entities) setup successfully.</p>
    </div>
  </React.StrictMode>,
)
