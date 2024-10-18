// home/layout.tsx
import{ SidebarDemo} from "@/components/ui/SidebarDemo";
import { Timer } from '@/components/ui/Timer';
import { AudioProvider } from "@/components/ui/audioContext"; // Import the AudioProvider

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioProvider> {/* Wrap the layout with the AudioProvider */}
      <div className="flex h-screen relative">
        {/* Sidebar for all "home" pages */}
        <SidebarDemo />

        {/* Timer with absolute positioning */}
        <div className="absolute bottom-4 left-4 z-50">
          <Timer />
        </div>

        {/* Main content */}
        <div className="flex-1 bg-gray-50 dark:bg-neutral-900 p-4">
          {children} {/* Page-specific content */}
        </div>
      </div>
    </AudioProvider>
  );
}
