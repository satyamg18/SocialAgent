import './globals.css';
import Sidebar from '@/components/Sidebar';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'SocialPilot — Social Media Automation Agent',
  description: 'AI-powered social media automation for LinkedIn and Instagram. Plan, create, approve, and publish content with intelligent content generation.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
