import React from 'react';

const AnimatedIcons: React.FC = () => {
  return (
    <div className="relative h-40 w-40 mx-auto mb-8">
      <img 
        src="/plane.png" 
        alt="Plane" 
        className="absolute w-20 h-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          animation: 'swirl 10s linear infinite',
          animationDelay: '0s'
        }}
      />
      <img 
        src="/taco.png" 
        alt="Taco" 
        className="absolute w-20 h-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          animation: 'swirl 10s linear infinite',
          animationDelay: '-3.33s'
        }}
      />
      <img 
        src="/palm.png" 
        alt="Palm Tree" 
        className="absolute w-20 h-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          animation: 'swirl 10s linear infinite',
          animationDelay: '-6.66s'
        }}
      />
    </div>
  );
};

export default AnimatedIcons; 