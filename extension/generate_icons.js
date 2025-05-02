// Simple script to create icons from SVG

const fs = require('fs');
const path = require('path');

// Create basic PNG icon representation
function createIcon(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Draw a circle with Chrome blue color
  ctx.fillStyle = '#4285F4';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw a white circle inside (to create a ring)
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 * 0.8, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw the center circle
  ctx.fillStyle = '#4285F4';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 * 0.6, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw three white horizontal bars in the center
  ctx.fillStyle = 'white';
  const barHeight = size * 0.1;
  const barSpacing = size * 0.06;
  const totalHeight = barHeight * 3 + barSpacing * 2;
  let y = (size - totalHeight) / 2;
  
  // Top bar
  ctx.fillRect(size * 0.25, y, size * 0.5, barHeight);
  y += barHeight + barSpacing;
  
  // Middle bar
  ctx.fillRect(size * 0.25, y, size * 0.35, barHeight);
  y += barHeight + barSpacing;
  
  // Bottom bar
  ctx.fillRect(size * 0.25, y, size * 0.45, barHeight);
  
  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
}

// Create icons for all the required sizes
const iconSizes = [16, 48, 128];

iconSizes.forEach(size => {
  const iconData = createIcon(size);
  fs.writeFileSync(
    path.join(__dirname, `icons/icon${size}.png`), 
    Buffer.from(iconData, 'base64')
  );
  console.log(`Created icon${size}.png`);
});