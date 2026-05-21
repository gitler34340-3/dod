import { RouterProvider } from 'react-router';
import { router } from '@/app/routes';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/app/contexts/ThemeContext';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { GatekeeperProvider } from '@/app/contexts/GatekeeperContext';
import { SoundEffects } from '@/app/components/SoundEffects';
import { StartupVideo } from '@/app/components/StartupVideo';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GatekeeperProvider>
          <SoundEffects />
          <RouterProvider router={router} />
          <StartupVideo />
          <Toaster position="top-center" richColors />
        </GatekeeperProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
