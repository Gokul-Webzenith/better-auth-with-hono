import { Providers } from "@/components/providers"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import "@workspace/ui/globals.css"

import AppSidebar from "@/components/app-sidebar"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>

        <Providers>

          <div className="flex w-screen min-h-screen">

            {/* Sidebar */}
            <div className="w-[200px] min-w-[200px] max-w-[200px] border-r bg-white">
              <AppSidebar />
            </div>

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-auto bg-gray-50">

              <TooltipProvider>
                {children}
              </TooltipProvider>

            </main>

          </div>

        </Providers>

      </body>
    </html>
  )
}
