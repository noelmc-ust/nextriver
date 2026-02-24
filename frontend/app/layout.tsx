// REMOVE "use client" from here
import './globals.css';
import Navbar from './Navbar'; // Import the new component

export const metadata = { 
  title: 'La Rivera – Elegance in Every Stitch', 
  description: 'Timeless dresses crafted for modern women.' 
};

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="en">
      <body>
        <Navbar /> 
        {children}
        <footer className="footer container">© La Rivera.</footer>
        <div id="toast"></div>
      </body>
    </html>
  );
}