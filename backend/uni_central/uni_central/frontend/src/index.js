import React from 'react';
import ReactDOM from 'react-dom';

function App() {
  return (
    <div>
      <h1>Hello from React!</h1>
      <p>This is a React component embedded in a Django template.</p>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('react-root'));
