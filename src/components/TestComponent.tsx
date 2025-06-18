import React from 'react';

export const TestComponent: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '500px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#0088cc' }}>SplitTON Test Component</h1>
      <p>If you can see this, basic React rendering is working!</p>
      
      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '4px'
      }}>
        <h2>Debug Information</h2>
        <ul>
          <li>React is working</li>
          <li>Component rendering is working</li>
          <li>JavaScript execution is working</li>
        </ul>
      </div>
      
      <button 
        onClick={() => alert('Button click works!')}
        style={{
          marginTop: '20px',
          padding: '10px 15px',
          background: '#0088cc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Interactivity
      </button>
    </div>
  );
}; 